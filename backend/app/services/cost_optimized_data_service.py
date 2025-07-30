"""Cost-optimized data service that prioritizes cache hits over API calls."""

from typing import Dict, Any, Optional, List
import asyncio
import logging
from datetime import datetime
import time

from .smart_cache_service import SmartCacheService
from .tavily_service import TavilyService
from .openbb_service import OpenBBService
from .coingecko_service import CoinGeckoService
from ..models.cache import CacheResponse, BatchResponse


class CostOptimizedDataService:
    """
    Main data service that implements intelligent cost optimization:
    - Cache-first strategy for all requests
    - Aggressive budget management
    - Graceful fallback to cached data
    - Batch processing optimization
    """
    
    def __init__(self):
        self.cache_service = SmartCacheService()
        self.tavily_service = TavilyService()
        self.openbb_service = OpenBBService()
        self.coingecko_service = CoinGeckoService()
        self.logger = logging.getLogger(__name__)
    
    async def get_company_profile(
        self, 
        company_name: str, 
        website: Optional[str] = None,
        user_id: Optional[str] = None,
        force_refresh: bool = False
    ) -> CacheResponse:
        """
        Get company profile with intelligent caching and budget management.
        
        Strategy:
        1. Check fresh cache first (unless force_refresh)
        2. Check API budget before expensive calls
        3. Make API call if budget allows
        4. Fall back to expired cache if API fails or budget exceeded
        """
        
        start_time = time.time()
        company_identifier = self.cache_service.normalize_company_identifier(company_name, website)
        
        # Step 1: Check fresh cache first (unless forced refresh)
        if not force_refresh:
            cached_data = await self.cache_service.get_cached_data(
                company_identifier, 'profile', user_id
            )
            
            if cached_data and not cached_data.get('_cache_meta', {}).get('is_expired', False):
                execution_time = int((time.time() - start_time) * 1000)
                
                return CacheResponse(
                    data=cached_data,
                    source='cache',
                    cached=True,
                    cost=0.0,
                    expires_in=self._calculate_expires_in(cached_data),
                    confidence_score=cached_data.get('confidence_score', 0.8)
                )
        
        # Step 2: Check API budget before making expensive calls
        budget_status = await self.cache_service.check_api_budget(user_id or 'system', 'tavily')
        
        if not budget_status.within_budget:
            # Budget exceeded - try to use expired cache
            cached_data = await self.cache_service.get_cached_data(
                company_identifier, 'profile', user_id, include_expired=True
            )
            
            if cached_data:
                execution_time = int((time.time() - start_time) * 1000)
                self.logger.warning(f"API budget exceeded, using expired cache for {company_identifier}")
                
                return CacheResponse(
                    data=cached_data,
                    source='cache_expired',
                    cached=True,
                    cost=0.0,
                    expires_in=0,  # Expired
                    confidence_score=cached_data.get('confidence_score', 0.5)
                )
            else:
                # No cache available and budget exceeded
                raise ValueError(f"API budget exceeded and no cached data available for {company_name}")
        
        # Step 3: Make API call (budget allows)
        try:
            profile_data = await self.tavily_service.fetch_company_profile(
                company_name, website
            )
            
            # Check if we got valid data
            if not profile_data or profile_data.get('error'):
                raise Exception(profile_data.get('error', 'No profile data returned'))
            
            # Store in cache for future use
            await self.cache_service.store_cached_data(
                company_identifier, 'profile', profile_data, 'tavily', 
                profile_data.get('confidence_score', 0.8)
            )
            
            # Log API usage
            execution_time = int((time.time() - start_time) * 1000)
            cost = profile_data.get('_meta', {}).get('cost_estimate', 0.005)
            
            await self.cache_service.log_api_usage(
                user_id, 'tavily', 'company_profile', cost, 
                {'company': company_name, 'website': website}, 
                execution_time, False
            )
            
            return CacheResponse(
                data=profile_data,
                source='api',
                cached=False,
                cost=cost,
                confidence_score=profile_data.get('confidence_score', 0.8)
            )
            
        except Exception as e:
            # API failed - try expired cache as fallback
            self.logger.error(f"API call failed for {company_identifier}: {str(e)}")
            
            cached_data = await self.cache_service.get_cached_data(
                company_identifier, 'profile', user_id, include_expired=True
            )
            
            if cached_data:
                execution_time = int((time.time() - start_time) * 1000)
                self.logger.info(f"Using expired cache as fallback for {company_identifier}")
                
                return CacheResponse(
                    data=cached_data,
                    source='cache_fallback',
                    cached=True,
                    cost=0.0,
                    expires_in=0,
                    confidence_score=cached_data.get('confidence_score', 0.3)
                )
            
            # No fallback available
            raise e
    
    async def get_company_funding(
        self,
        company_name: str,
        website: Optional[str] = None,
        user_id: Optional[str] = None,
    ) -> CacheResponse:
        """Get company funding data with caching."""
        
        start_time = time.time()
        company_identifier = self.cache_service.normalize_company_identifier(company_name, website)
        
        # Check cache first
        cached_data = await self.cache_service.get_cached_data(
            company_identifier, 'funding', user_id
        )
        
        if cached_data and not cached_data.get('_cache_meta', {}).get('is_expired', False):
            return CacheResponse(
                data=cached_data,
                source='cache',
                cached=True,
                cost=0.0,
                expires_in=self._calculate_expires_in(cached_data),
                confidence_score=cached_data.get('confidence_score', 0.8)
            )
        
        # Check budget
        budget_status = await self.cache_service.check_api_budget(user_id or 'system', 'tavily')
        if not budget_status.within_budget:
            if cached_data:
                return CacheResponse(
                    data=cached_data,
                    source='cache_expired',
                    cached=True,
                    cost=0.0,
                    expires_in=0,
                    confidence_score=cached_data.get('confidence_score', 0.5)
                )
            raise ValueError("API budget exceeded and no cached funding data available")
        
        # Fetch from API
        try:
            funding_data = await self.tavily_service.fetch_company_funding(company_name, website)
            
            if not funding_data or funding_data.get('error'):
                raise Exception(funding_data.get('error', 'No funding data returned'))
            
            await self.cache_service.store_cached_data(
                company_identifier, 'funding', funding_data, 'tavily',
                funding_data.get('confidence_score', 0.8)
            )
            
            execution_time = int((time.time() - start_time) * 1000)
            cost = funding_data.get('_meta', {}).get('cost_estimate', 0.008)
            
            await self.cache_service.log_api_usage(
                user_id, 'tavily', 'company_funding', cost,
                {'company': company_name}, execution_time, False
            )
            
            return CacheResponse(
                data=funding_data,
                source='api',
                cached=False,
                cost=cost,
                confidence_score=funding_data.get('confidence_score', 0.8)
            )
            
        except Exception as e:
            # Fallback to expired cache
            if cached_data:
                return CacheResponse(
                    data=cached_data,
                    source='cache_fallback',
                    cached=True,
                    cost=0.0,
                    expires_in=0,
                    confidence_score=cached_data.get('confidence_score', 0.3)
                )
            raise e
    
    async def get_real_time_price(
        self, 
        symbol: str, 
        asset_type: str = 'crypto'
    ) -> CacheResponse:
        """
        Get real-time price with short-term caching (15 minutes).
        Uses OpenBB/CoinGecko for financial data.
        """
        
        start_time = time.time()
        cache_key = f"price_{symbol.lower()}"
        
        # Check short-term cache
        from ..database import get_session
        from sqlmodel import select
        from ..models.cache import RealtimeDataCache
        
        with get_session() as session:
            cached_price = session.exec(
                select(RealtimeDataCache).where(
                    RealtimeDataCache.data_key == cache_key,
                    RealtimeDataCache.expires_at > datetime.utcnow()
                )
            ).first()
            
            if cached_price:
                expires_in = int((cached_price.expires_at - datetime.utcnow()).total_seconds())
                return CacheResponse(
                    data=cached_price.data_payload,
                    source='cache',
                    cached=True,
                    cost=0.0,
                    expires_in=expires_in
                )
        
        # Fetch fresh price data
        try:
            if asset_type == 'crypto':
                # Use CoinGecko for crypto prices (free tier)
                price_data = await self._fetch_crypto_price(symbol)
                service = 'coingecko'
                cost = 0.0  # Free tier
            else:
                # Use OpenBB for stock prices (free tier)
                price_data = await self._fetch_stock_price(symbol)
                service = 'openbb'
                cost = 0.0  # Free tier
            
            # Cache for 15 minutes
            await self.cache_service.store_cached_data(
                symbol, 'price', price_data, service
            )
            
            execution_time = int((time.time() - start_time) * 1000)
            await self.cache_service.log_api_usage(
                None, service, f'{asset_type}_price', cost,
                {'symbol': symbol}, execution_time, False
            )
            
            return CacheResponse(
                data=price_data,
                source='api',
                cached=False,
                cost=cost
            )
            
        except Exception as e:
            self.logger.error(f"Failed to fetch {asset_type} price for {symbol}: {str(e)}")
            raise e
    
    async def get_batch_company_data(
        self, 
        companies: List[Dict[str, str]], 
        user_id: str,
        data_types: List[str] = ['profile']
    ) -> BatchResponse:
        """
        Efficiently process multiple companies with maximum cache optimization.
        
        Strategy:
        1. Check cache for all companies first
        2. Group API calls by priority and budget
        3. Process high-confidence cached data immediately
        4. Make API calls only for critical missing data within budget
        """
        
        batch_start_time = time.time()
        results = {}
        api_calls_needed = []
        stats = {
            'total_companies': len(companies),
            'cache_hits': 0,
            'api_calls': 0,
            'budget_limited': 0,
            'total_cost': 0.0
        }
        
        # Phase 1: Check cache for all companies
        for company in companies:
            company_name = company['name']
            website = company.get('website')
            company_identifier = self.cache_service.normalize_company_identifier(company_name, website)
            
            company_results = {}
            cache_hit_count = 0
            
            for data_type in data_types:
                cached_data = await self.cache_service.get_cached_data(
                    company_identifier, data_type, user_id
                )
                
                if cached_data and not cached_data.get('_cache_meta', {}).get('is_expired', False):
                    company_results[data_type] = {
                        'data': cached_data,
                        'source': 'cache',
                        'cost': 0.0
                    }
                    cache_hit_count += 1
                else:
                    # Mark for API call
                    api_calls_needed.append({
                        'company_identifier': company_identifier,
                        'company_name': company_name,
                        'website': website,
                        'data_type': data_type,
                        'cached_data': cached_data  # May be expired
                    })
            
            if company_results:
                results[company_identifier] = company_results
                stats['cache_hits'] += cache_hit_count
        
        # Phase 2: Budget-aware API calls
        budget_status = await self.cache_service.check_api_budget(user_id, 'tavily')
        max_api_calls = min(
            len(api_calls_needed),
            budget_status.calls_limit - budget_status.calls_used,
            20  # Reasonable batch limit
        )
        
        # Prioritize API calls (profile data first, then funding, then team)
        data_type_priority = {'profile': 3, 'funding': 2, 'team': 1}
        api_calls_needed.sort(
            key=lambda x: data_type_priority.get(x['data_type'], 0), 
            reverse=True
        )
        
        # Process priority API calls
        for i, call_info in enumerate(api_calls_needed[:max_api_calls]):
            try:
                if call_info['data_type'] == 'profile':
                    api_data = await self.tavily_service.fetch_company_profile(
                        call_info['company_name'], call_info['website']
                    )
                    cost = 0.005
                elif call_info['data_type'] == 'funding':
                    api_data = await self.tavily_service.fetch_company_funding(
                        call_info['company_name'], call_info['website']
                    )
                    cost = 0.008
                elif call_info['data_type'] == 'team':
                    api_data = await self.tavily_service.fetch_company_team(
                        call_info['company_name']
                    )
                    cost = 0.005
                else:
                    continue
                
                if api_data and not api_data.get('error'):
                    # Store in cache
                    await self.cache_service.store_cached_data(
                        call_info['company_identifier'], 
                        call_info['data_type'], 
                        api_data, 
                        'tavily',
                        api_data.get('confidence_score', 0.8)
                    )
                    
                    # Add to results
                    company_id = call_info['company_identifier']
                    if company_id not in results:
                        results[company_id] = {}
                    
                    results[company_id][call_info['data_type']] = {
                        'data': api_data,
                        'source': 'api',
                        'cost': cost
                    }
                    
                    stats['api_calls'] += 1
                    stats['total_cost'] += cost
                    
                    # Rate limiting
                    await asyncio.sleep(0.3)  # 300ms between calls
                
            except Exception as e:
                self.logger.error(f"Batch API call failed: {str(e)}")
                
                # Use expired cache as fallback
                if call_info['cached_data']:
                    company_id = call_info['company_identifier']
                    if company_id not in results:
                        results[company_id] = {}
                    
                    results[company_id][call_info['data_type']] = {
                        'data': call_info['cached_data'],
                        'source': 'cache_fallback',
                        'cost': 0.0
                    }
        
        # Phase 3: Use expired cache for remaining calls
        remaining_calls = api_calls_needed[max_api_calls:]
        for call_info in remaining_calls:
            if call_info['cached_data']:
                company_id = call_info['company_identifier']
                if company_id not in results:
                    results[company_id] = {}
                
                results[company_id][call_info['data_type']] = {
                    'data': call_info['cached_data'],
                    'source': 'cache_expired',
                    'cost': 0.0
                }
                stats['budget_limited'] += 1
        
        # Log batch operation
        total_time = int((time.time() - batch_start_time) * 1000)
        await self.cache_service.log_api_usage(
            user_id, 'tavily', 'batch_company_data', stats['total_cost'],
            {'batch_size': len(companies), 'data_types': data_types}, 
            total_time, False
        )
        
        # Calculate final statistics
        stats['cache_hit_rate'] = (stats['cache_hits'] / (stats['cache_hits'] + stats['api_calls'])) if (stats['cache_hits'] + stats['api_calls']) > 0 else 0
        stats['processing_time_ms'] = total_time
        
        return BatchResponse(
            results=results,
            summary=stats
        )
    
    async def _fetch_crypto_price(self, symbol: str) -> Dict[str, Any]:
        """Fetch crypto price using CoinGecko service."""
        try:
            # Use existing CoinGecko service
            price_data = await self.coingecko_service.get_token_price(symbol)
            return price_data
        except Exception as e:
            # Fallback to OpenBB crypto
            return await self.openbb_service.get_crypto_price(symbol)
    
    async def _fetch_stock_price(self, symbol: str) -> Dict[str, Any]:
        """Fetch stock price using OpenBB service."""
        return await self.openbb_service.get_stock_price(symbol)
    
    def _calculate_expires_in(self, cached_data: Dict[str, Any]) -> int:
        """Calculate seconds until cache expiration."""
        cache_meta = cached_data.get('_cache_meta', {})
        expires_at_str = cache_meta.get('expires_at')
        
        if expires_at_str:
            try:
                expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
                expires_in = int((expires_at - datetime.utcnow()).total_seconds())
                return max(0, expires_in)
            except:
                pass
        
        return 0  # Expired or unknown
    
    async def get_budget_status(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive budget status for user."""
        budgets = {}
        
        for service in ['tavily', 'openbb', 'coingecko']:
            budget_status = await self.cache_service.check_api_budget(user_id, service)
            budgets[service] = budget_status.dict()
        
        return {
            'user_id': user_id,
            'budgets': budgets,
            'overall_status': all(b['within_budget'] for b in budgets.values())
        }
    
    async def get_service_statistics(self, days: int = 7) -> Dict[str, Any]:
        """Get comprehensive service performance statistics."""
        cache_stats = await self.cache_service.get_cache_statistics(days)
        
        return {
            'period_days': days,
            'cache_performance': cache_stats,
            'service_health': {
                'tavily_available': True,  # Could check actual service health
                'openbb_available': True,
                'coingecko_available': True
            },
            'cost_efficiency': {
                'total_savings': cache_stats.get('cost_optimization', {}).get('estimated_savings', 0),
                'cache_hit_rate': cache_stats.get('cache_statistics', {}).get('cache_hit_rate', 0),
                'average_response_time': 'TBD'  # Could track this
            }
        }