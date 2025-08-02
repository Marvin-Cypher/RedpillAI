"""
CompanyDataService - Parallel processing for company data pipeline.

Implements the approved parallel processing architecture:
- Run all external API calls (Tavily, CoinGecko, OpenBB) in parallel using asyncio.gather()
- Intelligent caching with static data (30-day TTL) and live data (5-15 min TTL)
- Company type differentiation (Private→Tavily only, Crypto→Tavily+CoinGecko, Public→Tavily+OpenBB)
- Background task scheduling for long operations
- In-process locks to prevent duplicate concurrent fetches
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager

from ..models.companies import Company, CompanyType
from ..models.cache import CompanyDataCache
from ..database import engine
from sqlmodel import Session, select

from .tavily_service import TavilyService
from .market_data_service import market_data_service
from .smart_cache_service import SmartCacheService

logger = logging.getLogger(__name__)


class CompanyDataService:
    """
    Service for parallel company data fetching with intelligent caching.
    
    Key Features:
    - Parallel API calls using asyncio.gather() 
    - Static vs live data separation (different TTLs)
    - Company type-aware data fetching
    - In-process concurrency locks
    - Comprehensive error handling and fallbacks
    """
    
    def __init__(self):
        self.tavily_service = TavilyService()
        self.cache_service = SmartCacheService()
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # In-process locks to prevent duplicate concurrent fetches
        self._company_locks: Dict[str, asyncio.Lock] = {}
        self._lock_creation_lock = asyncio.Lock()
        
        # TTL configurations
        self.ttl_config = {
            'static': timedelta(days=30),      # Profile, funding, team data
            'live': timedelta(minutes=15),     # Prices, metrics, news
            'mixed': timedelta(hours=6)        # Combined data
        }
        
        # Timeout configurations per API
        self.timeout_config = {
            'tavily': 30.0,     # Tavily can be slow for complex queries
            'coingecko': 10.0,  # CoinGecko is usually fast
            'openbb': 15.0      # OpenBB varies by data complexity
        }
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.executor:
            self.executor.shutdown(wait=True)
    
    async def _get_company_lock(self, company_identifier: str) -> asyncio.Lock:
        """Get or create a lock for a specific company to prevent concurrent fetches."""
        async with self._lock_creation_lock:
            if company_identifier not in self._company_locks:
                self._company_locks[company_identifier] = asyncio.Lock()
            return self._company_locks[company_identifier]
    
    def _get_data_category(self, data_types: List[str]) -> str:
        """Determine data category based on requested data types."""
        static_types = {'profile', 'funding', 'team'}
        live_types = {'price', 'metrics', 'news'}
        
        has_static = bool(set(data_types) & static_types)
        has_live = bool(set(data_types) & live_types)
        
        if has_static and has_live:
            return 'mixed'
        elif has_static:
            return 'static'
        elif has_live:
            return 'live'
        else:
            return 'mixed'  # Default for unknown types
    
    def _is_data_stale(self, cache_entry: CompanyDataCache, data_category: str) -> bool:
        """Check if cached data is stale based on category-specific TTL."""
        if not cache_entry:
            return True
            
        now = datetime.utcnow()
        ttl = self.ttl_config.get(data_category, self.ttl_config['mixed'])
        
        # Check appropriate timestamp based on data category
        if data_category == 'static' and cache_entry.last_fetched_static:
            return (now - cache_entry.last_fetched_static) > ttl
        elif data_category == 'live' and cache_entry.last_fetched_live:
            return (now - cache_entry.last_fetched_live) > ttl
        elif cache_entry.last_fetched:
            return (now - cache_entry.last_fetched) > ttl
        else:
            return True  # No timestamp means stale
    
    async def _check_and_set_fetch_lock(self, company_identifier: str, data_category: str) -> bool:
        """
        Check if another process is already fetching data for this company.
        Returns True if we can proceed, False if locked by another process.
        """
        try:
            with Session(engine) as session:
                # Check for active fetch locks (within last 5 minutes)
                lock_threshold = datetime.utcnow() - timedelta(minutes=5)
                
                active_lock = session.exec(
                    select(CompanyDataCache).where(
                        CompanyDataCache.company_identifier == company_identifier,
                        CompanyDataCache.data_category == data_category,
                        CompanyDataCache.parallel_fetch_lock > lock_threshold
                    )
                ).first()
                
                if active_lock:
                    logger.info(f"Fetch already in progress for {company_identifier} ({data_category})")
                    return False
                
                # Set our lock
                lock_entry = session.exec(
                    select(CompanyDataCache).where(
                        CompanyDataCache.company_identifier == company_identifier,
                        CompanyDataCache.data_category == data_category
                    )
                ).first()
                
                if lock_entry:
                    lock_entry.parallel_fetch_lock = datetime.utcnow()
                    session.add(lock_entry)
                else:
                    # Create new entry with lock
                    new_entry = CompanyDataCache(
                        company_identifier=company_identifier,
                        data_type=data_category,
                        data_category=data_category,
                        parallel_fetch_lock=datetime.utcnow(),
                        cached_data={}
                    )
                    session.add(new_entry)
                
                session.commit()
                return True
                
        except Exception as e:
            logger.error(f"Error setting fetch lock for {company_identifier}: {e}")
            return True  # Proceed on error to avoid deadlock
    
    async def _clear_fetch_lock(self, company_identifier: str, data_category: str):
        """Clear the fetch lock after completing the operation."""
        try:
            with Session(engine) as session:
                lock_entry = session.exec(
                    select(CompanyDataCache).where(
                        CompanyDataCache.company_identifier == company_identifier,
                        CompanyDataCache.data_category == data_category
                    )
                ).first()
                
                if lock_entry:
                    lock_entry.parallel_fetch_lock = None
                    session.add(lock_entry)
                    session.commit()
                    
        except Exception as e:
            logger.error(f"Error clearing fetch lock for {company_identifier}: {e}")
    
    async def fetch_company_data_parallel(
        self,
        company: Company,
        data_types: List[str] = None,
        force_refresh: bool = False,
        use_background: bool = True
    ) -> Dict[str, Any]:
        """
        Fetch company data using parallel API calls with intelligent caching.
        
        Args:
            company: Company object with type and basic info
            data_types: List of data types to fetch ['profile', 'funding', 'price', 'metrics']
            force_refresh: Skip cache and force fresh API calls
            use_background: Use background tasks for long-running operations
            
        Returns:
            Dictionary with fetched data, metadata, and performance stats
        """
        
        start_time = datetime.utcnow()
        company_identifier = self.cache_service.normalize_company_identifier(
            company.name, company.website
        )
        
        # Default data types based on company type
        if data_types is None:
            if company.company_type == CompanyType.CRYPTO:
                data_types = ['profile', 'funding', 'price', 'metrics']
            elif company.company_type == CompanyType.TRADITIONAL:
                data_types = ['profile', 'funding', 'price']  # Traditional companies may have stock data
            else:  # Other types (AI, SAAS, FINTECH)
                data_types = ['profile', 'funding']
        
        data_category = self._get_data_category(data_types)
        
        # Get company-specific lock to prevent concurrent fetches
        company_lock = await self._get_company_lock(company_identifier)
        
        async with company_lock:
            try:
                # Step 1: Check cache unless force refresh
                if not force_refresh:
                    cached_result = await self._get_cached_data(
                        company_identifier, data_types, data_category
                    )
                    if cached_result:
                        logger.info(f"Cache hit for {company.name} ({data_category})")
                        return cached_result
                
                # Step 2: Check if another process is already fetching
                can_proceed = await self._check_and_set_fetch_lock(company_identifier, data_category)
                if not can_proceed:
                    # Wait briefly and try cache again
                    await asyncio.sleep(2)
                    cached_result = await self._get_cached_data(
                        company_identifier, data_types, data_category
                    )
                    if cached_result:
                        return cached_result
                    else:
                        # Proceed anyway to avoid deadlock
                        logger.warning(f"Proceeding with fetch despite active lock: {company.name}")
                
                # Step 3: Determine API calls needed based on company type
                api_tasks = self._build_api_tasks(company, data_types)
                
                # Step 4: Execute API calls in parallel with timeouts
                logger.info(f"Starting parallel fetch for {company.name}: {len(api_tasks)} API calls")
                api_results = await self._execute_parallel_api_calls(api_tasks, company.name)
                
                # Step 5: Process and combine results
                combined_data = await self._process_and_combine_results(
                    api_results, company, data_types
                )
                
                # Step 6: Update cache with new data
                await self._update_cache(
                    company_identifier, combined_data, data_category, data_types
                )
                
                # Calculate performance metrics
                execution_time = (datetime.utcnow() - start_time).total_seconds()
                
                result = {
                    'data': combined_data,
                    'metadata': {
                        'company_identifier': company_identifier,
                        'data_types': data_types,
                        'data_category': data_category,
                        'source': 'api_parallel',
                        'api_calls_made': len(api_tasks),
                        'execution_time_seconds': execution_time,
                        'cached': False,
                        'timestamp': start_time.isoformat()
                    }
                }
                
                logger.info(f"Parallel fetch completed for {company.name} in {execution_time:.2f}s")
                return result
                
            finally:
                # Always clear the fetch lock
                await self._clear_fetch_lock(company_identifier, data_category)
    
    def _build_api_tasks(self, company: Company, data_types: List[str]) -> List[Dict[str, Any]]:
        """Build list of API tasks based on company type and requested data types."""
        tasks = []
        
        # Always include Tavily for comprehensive company data
        if any(dt in data_types for dt in ['profile', 'funding', 'team']):
            if 'profile' in data_types:
                tasks.append({
                    'service': 'tavily',
                    'method': 'fetch_company_profile',
                    'args': (company.name, company.website),
                    'timeout': self.timeout_config['tavily'],
                    'data_type': 'profile'
                })
            
            if 'funding' in data_types:
                tasks.append({
                    'service': 'tavily', 
                    'method': 'fetch_company_funding',
                    'args': (company.name, company.website),
                    'timeout': self.timeout_config['tavily'],
                    'data_type': 'funding'
                })
            
            if 'team' in data_types:
                tasks.append({
                    'service': 'tavily',
                    'method': 'fetch_company_team', 
                    'args': (company.name,),
                    'timeout': self.timeout_config['tavily'],
                    'data_type': 'team'
                })
        
        # Add market data based on company type
        if company.company_type == CompanyType.CRYPTO:
            if 'price' in data_types or 'metrics' in data_types:
                # Use both CoinGecko and OpenBB for crypto
                tasks.append({
                    'service': 'coingecko',
                    'method': 'search_token_by_company',
                    'args': (company.name, company.website),
                    'timeout': self.timeout_config['coingecko'], 
                    'data_type': 'price'
                })
                
                if company.token_symbol:
                    tasks.append({
                        'service': 'openbb',
                        'method': 'get_crypto_price',
                        'args': (company.token_symbol,),
                        'timeout': self.timeout_config['openbb'],
                        'data_type': 'metrics'
                    })
        
        elif company.company_type == CompanyType.TRADITIONAL:
            if 'price' in data_types or 'metrics' in data_types:
                # Try to get stock data via OpenBB for traditional companies (if publicly traded)
                ticker = self._infer_ticker_symbol(company.name)
                if ticker:
                    tasks.append({
                        'service': 'openbb',
                        'method': 'get_equity_price',
                        'args': (ticker,),  
                        'timeout': self.timeout_config['openbb'],
                        'data_type': 'price'
                    })
                    
                    tasks.append({
                        'service': 'openbb',
                        'method': 'get_equity_fundamentals',
                        'args': (ticker,),
                        'timeout': self.timeout_config['openbb'],
                        'data_type': 'metrics'
                    })
        
        return tasks
    
    async def _execute_parallel_api_calls(
        self, 
        api_tasks: List[Dict[str, Any]], 
        company_name: str
    ) -> Dict[str, Any]:
        """Execute API calls in parallel with proper timeout and error handling."""
        
        async def execute_single_task(task: Dict[str, Any]) -> Tuple[str, Any]:
            """Execute a single API task with timeout and error handling."""
            service_name = task['service']
            method_name = task['method']
            args = task['args']
            timeout = task['timeout']
            data_type = task['data_type']
            
            try:
                # Get the appropriate service
                if service_name == 'tavily':
                    service = self.tavily_service
                elif service_name == 'coingecko':
                    service = market_data_service
                    method_name = 'search_token_by_company'  # Use async CoinGecko method
                elif service_name == 'openbb':
                    service = market_data_service
                else:
                    raise ValueError(f"Unknown service: {service_name}")
                
                # Execute with timeout
                method = getattr(service, method_name)
                result = await asyncio.wait_for(method(*args), timeout=timeout)
                
                logger.info(f"✅ {service_name}.{method_name} succeeded for {company_name}")
                return f"{service_name}_{data_type}", result
                
            except asyncio.TimeoutError:
                logger.warning(f"⏰ {service_name}.{method_name} timed out for {company_name}")
                return f"{service_name}_{data_type}", {'error': 'timeout', 'service': service_name}
                
            except Exception as e:
                logger.error(f"❌ {service_name}.{method_name} failed for {company_name}: {str(e)}")
                return f"{service_name}_{data_type}", {'error': str(e), 'service': service_name}
        
        # Execute all tasks in parallel
        logger.info(f"Executing {len(api_tasks)} API calls in parallel for {company_name}")
        
        tasks = [execute_single_task(task) for task in api_tasks]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results and handle exceptions
        api_results = {}
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Task raised exception: {result}")
                continue
                
            key, value = result
            api_results[key] = value
        
        success_count = sum(1 for v in api_results.values() if not isinstance(v, dict) or 'error' not in v)
        logger.info(f"Parallel execution completed: {success_count}/{len(api_tasks)} succeeded")
        
        return api_results
    
    async def _process_and_combine_results(
        self,
        api_results: Dict[str, Any],
        company: Company,
        data_types: List[str]
    ) -> Dict[str, Any]:
        """Process and combine results from parallel API calls."""
        
        combined_data = {
            'company_name': company.name,
            'company_type': company.company_type.value if company.company_type else 'unknown',
            'data_sources': [],
            'fetch_timestamp': datetime.utcnow().isoformat()
        }
        
        # Process Tavily results
        for key, result in api_results.items():
            if key.startswith('tavily_') and result and not result.get('error'):
                data_type = key.split('_', 1)[1]
                combined_data[data_type] = result
                combined_data['data_sources'].append(f"tavily_{data_type}")
        
        # Process market data results
        price_data = {}
        metrics_data = {}
        
        # CoinGecko results
        coingecko_result = api_results.get('coingecko_price')
        if coingecko_result and not coingecko_result.get('error'):
            price_data.update({
                'current_price': coingecko_result.get('current_price'),
                'market_cap': coingecko_result.get('market_cap'),
                'volume_24h': coingecko_result.get('volume_24h'),
                'price_change_24h': coingecko_result.get('price_change_24h'),
                'source': 'coingecko'
            })
            combined_data['data_sources'].append('coingecko_price')
        
        # OpenBB results
        openbb_price = api_results.get('openbb_price')
        if openbb_price and not openbb_price.get('error'):
            if not price_data:  # Use OpenBB if no CoinGecko data
                price_data.update({
                    'current_price': getattr(openbb_price, 'close', None),
                    'volume_24h': getattr(openbb_price, 'volume', None),
                    'price_change_24h': getattr(openbb_price, 'change_percent', None),
                    'source': 'openbb'
                })
            combined_data['data_sources'].append('openbb_price')
        
        openbb_metrics = api_results.get('openbb_metrics')
        if openbb_metrics and not openbb_metrics.get('error'):
            metrics_data.update({
                'pe_ratio': getattr(openbb_metrics, 'pe_ratio', None),
                'market_cap': getattr(openbb_metrics, 'market_cap', None),
                'revenue': getattr(openbb_metrics, 'revenue', None),
                'source': 'openbb'
            })
            combined_data['data_sources'].append('openbb_metrics')
        
        # Add market data to combined results
        if price_data:
            combined_data['price'] = price_data
        if metrics_data:
            combined_data['metrics'] = metrics_data
        
        # Add confidence score based on data sources
        confidence_score = min(1.0, len(combined_data['data_sources']) * 0.25)
        combined_data['confidence_score'] = confidence_score
        
        return combined_data
    
    async def _get_cached_data(
        self,
        company_identifier: str,
        data_types: List[str],
        data_category: str
    ) -> Optional[Dict[str, Any]]:
        """Get cached data if fresh enough based on data category."""
        
        try:
            with Session(engine) as session:
                cache_entry = session.exec(
                    select(CompanyDataCache).where(
                        CompanyDataCache.company_identifier == company_identifier,
                        CompanyDataCache.data_category == data_category
                    )
                ).first()
                
                if not cache_entry or self._is_data_stale(cache_entry, data_category):
                    return None
                
                # Return cached data with metadata
                return {
                    'data': cache_entry.cached_data,
                    'metadata': {
                        'company_identifier': company_identifier,
                        'data_types': data_types,
                        'data_category': data_category,
                        'source': 'cache',
                        'cached': True,
                        'last_fetched': cache_entry.last_fetched.isoformat() if cache_entry.last_fetched else None,
                        'last_fetched_static': cache_entry.last_fetched_static.isoformat() if cache_entry.last_fetched_static else None,
                        'last_fetched_live': cache_entry.last_fetched_live.isoformat() if cache_entry.last_fetched_live else None,
                        'confidence_score': cache_entry.confidence_score or 0.8
                    }
                }
                
        except Exception as e:
            logger.error(f"Error getting cached data for {company_identifier}: {e}")
            return None
    
    async def _update_cache(
        self,
        company_identifier: str,
        combined_data: Dict[str, Any],
        data_category: str,
        data_types: List[str]
    ):
        """Update cache with new data and appropriate timestamps."""
        
        try:
            now = datetime.utcnow()
            
            with Session(engine) as session:
                # Get or create cache entry
                cache_entry = session.exec(
                    select(CompanyDataCache).where(
                        CompanyDataCache.company_identifier == company_identifier,
                        CompanyDataCache.data_category == data_category
                    )
                ).first()
                
                if not cache_entry:
                    cache_entry = CompanyDataCache(
                        company_identifier=company_identifier,
                        data_type=data_category,
                        data_category=data_category
                    )
                
                # Update data and timestamps
                cache_entry.cached_data = combined_data
                cache_entry.last_fetched = now
                cache_entry.confidence_score = combined_data.get('confidence_score', 0.8)
                
                # Update category-specific timestamps
                if data_category == 'static':
                    cache_entry.last_fetched_static = now
                elif data_category == 'live':
                    cache_entry.last_fetched_live = now
                else:  # mixed
                    cache_entry.last_fetched_static = now
                    cache_entry.last_fetched_live = now
                
                session.add(cache_entry)
                session.commit()
                
                logger.info(f"Cache updated for {company_identifier} ({data_category})")
                
        except Exception as e:
            logger.error(f"Error updating cache for {company_identifier}: {e}")
    
    def _infer_ticker_symbol(self, company_name: str) -> Optional[str]:
        """Infer stock ticker symbol from company name."""
        # Known mappings for major companies
        ticker_mappings = {
            'amazon': 'AMZN',
            'apple': 'AAPL',
            'microsoft': 'MSFT', 
            'google': 'GOOGL',
            'alphabet': 'GOOGL',
            'meta': 'META',
            'facebook': 'META',
            'tesla': 'TSLA',
            'nvidia': 'NVDA',
            'netflix': 'NFLX',
            'adobe': 'ADBE',
            'salesforce': 'CRM',
            'oracle': 'ORCL',
            'intel': 'INTC',
            'ibm': 'IBM',
            'cisco': 'CSCO',
            'uber': 'UBER',
            'airbnb': 'ABNB'
        }
        
        company_lower = company_name.lower()
        for name, ticker in ticker_mappings.items():
            if name in company_lower:
                return ticker
        
        return None


# Service instance
company_data_service = CompanyDataService()