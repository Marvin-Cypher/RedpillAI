"""
Company Data Enrichment Service
Handles pre-loading and refreshing company data from Tavily + OpenBB
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from sqlmodel import Session

from app.models.companies import Company, CompanyType
from app.services.tavily_service import TavilyService
from app.services.openbb_service import OpenBBService
from app.database import get_session

logger = logging.getLogger(__name__)


class CompanyEnrichmentService:
    """Service for enriching company data from external sources."""
    
    def __init__(self):
        self.tavily_service = TavilyService()
        self.openbb_service = OpenBBService()
    
    async def enrich_company_data(self, company: Company, force_refresh: bool = False) -> Company:
        """
        Enrich company data with Tavily + OpenBB data.
        
        Args:
            company: Company object to enrich
            force_refresh: Whether to force refresh even if data is recent
            
        Returns:
            Updated company object with enriched data
        """
        try:
            logger.info(f"Starting data enrichment for company: {company.name}")
            
            # Check if we need to refresh data
            if not self._should_refresh_data(company, force_refresh):
                logger.info(f"Data for {company.name} is fresh, skipping refresh")
                return company
            
            # Step 1: Enrich with Tavily data (company profile, financials, news)
            tavily_data = await self._get_tavily_data(company)
            
            # Step 2: Enrich with OpenBB data (market data, financials for public companies)
            market_data = await self._get_openbb_data(company)
            
            # Step 3: Process and store enriched data
            company = self._process_enriched_data(company, tavily_data, market_data)
            
            # Update timestamps
            company.data_last_refreshed = datetime.utcnow()
            if tavily_data:
                company.tavily_last_updated = datetime.utcnow()
            if market_data:
                company.market_data_last_updated = datetime.utcnow()
            
            logger.info(f"Successfully enriched data for {company.name}")
            return company
            
        except Exception as e:
            logger.error(f"Failed to enrich data for {company.name}: {e}")
            return company
    
    def _should_refresh_data(self, company: Company, force_refresh: bool) -> bool:
        """Check if company data needs refreshing."""
        if force_refresh:
            return True
            
        if not company.data_last_refreshed:
            return True
            
        # Refresh data older than 24 hours
        refresh_threshold = datetime.utcnow() - timedelta(hours=24)
        return company.data_last_refreshed < refresh_threshold
    
    async def _get_tavily_data(self, company: Company) -> Optional[Dict[str, Any]]:
        """Get company data from Tavily API."""
        try:
            logger.info(f"Fetching Tavily data for {company.name}")
            
            # Use Tavily to get comprehensive company information
            tavily_data = await self.tavily_service.fetch_company_profile(
                company.name, 
                company.website
            )
            
            if tavily_data and not tavily_data.get('error'):
                logger.info(f"Successfully fetched Tavily data for {company.name}")
                return tavily_data
            else:
                logger.warning(f"No valid Tavily data for {company.name}")
                return None
                
        except Exception as e:
            logger.warning(f"Failed to fetch Tavily data for {company.name}: {e}")
            return None
    
    async def _get_openbb_data(self, company: Company) -> Optional[Dict[str, Any]]:
        """Get market data from OpenBB for public companies/tokens."""
        try:
            logger.info(f"Fetching OpenBB data for {company.name}")
            
            market_data = {}
            
            # For crypto companies with token symbol
            if company.company_type == CompanyType.CRYPTO and company.token_symbol:
                try:
                    crypto_data = await self.openbb_service.get_crypto_data(company.token_symbol)
                    if crypto_data:
                        market_data['crypto'] = crypto_data
                        logger.info(f"Fetched crypto data for {company.token_symbol}")
                except Exception as e:
                    logger.warning(f"Failed to fetch crypto data for {company.token_symbol}: {e}")
            
            # For traditional companies, try to get stock data
            elif company.company_type == CompanyType.TRADITIONAL:
                # Try to infer ticker symbol from company name
                ticker = self._infer_ticker_symbol(company.name)
                if ticker:
                    try:
                        equity_data = await self.openbb_service.get_equity_data(ticker)
                        if equity_data:
                            market_data['equity'] = equity_data
                            logger.info(f"Fetched equity data for {ticker}")
                    except Exception as e:
                        logger.warning(f"Failed to fetch equity data for {ticker}: {e}")
            
            return market_data if market_data else None
            
        except Exception as e:
            logger.warning(f"Failed to fetch OpenBB data for {company.name}: {e}")
            return None
    
    def _infer_ticker_symbol(self, company_name: str) -> Optional[str]:
        """Infer ticker symbol from company name."""
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
            'airbnb': 'ABNB',
            'zoom': 'ZM',
            'paypal': 'PYPL',
            'square': 'SQ'
        }
        
        company_lower = company_name.lower()
        for name, ticker in ticker_mappings.items():
            if name in company_lower:
                return ticker
        
        return None
    
    def _process_enriched_data(self, company: Company, tavily_data: Optional[Dict], market_data: Optional[Dict]) -> Company:
        """Process and merge enriched data into company object."""
        try:
            # Store raw enriched data
            company.enriched_data = tavily_data
            company.market_data = market_data
            
            # Extract and normalize key metrics
            key_metrics = self._extract_key_metrics(tavily_data, market_data)
            company.key_metrics = key_metrics
            
            # Update company fields with enriched data if available
            if tavily_data:
                # Update basic company info from Tavily
                if tavily_data.get('founded_year') and not company.founded_year:
                    company.founded_year = tavily_data.get('founded_year')
                
                if tavily_data.get('headquarters') and not company.headquarters:
                    company.headquarters = tavily_data.get('headquarters')
                
                if tavily_data.get('employee_count') and not company.employee_count:
                    company.employee_count = str(tavily_data.get('employee_count'))
                
                if tavily_data.get('description') and not company.description:
                    company.description = tavily_data.get('description')
            
            logger.info(f"Processed enriched data for {company.name}")
            return company
            
        except Exception as e:
            logger.error(f"Failed to process enriched data for {company.name}: {e}")
            return company
    
    def _extract_key_metrics(self, tavily_data: Optional[Dict], market_data: Optional[Dict]) -> Dict[str, Any]:
        """Extract key financial and business metrics from enriched data."""
        metrics = {}
        
        try:
            # Extract metrics from Tavily data
            if tavily_data:
                # Financial metrics
                if 'key_metrics' in tavily_data:
                    tavily_metrics = tavily_data['key_metrics']
                    metrics.update({
                        'revenue': tavily_metrics.get('revenue', 0),
                        'revenue_growth': tavily_metrics.get('revenue_growth', 0),
                        'burn_rate': tavily_metrics.get('burn_rate', 0),
                        'runway_months': tavily_metrics.get('runway', 0),
                        'employees': tavily_metrics.get('employees', 0),
                        'customers': tavily_metrics.get('customers', 0),
                        'arr': tavily_metrics.get('arr', 0),
                        'gross_margin': tavily_metrics.get('gross_margin', 0),
                        'valuation': tavily_metrics.get('valuation', 0)
                    })
                
                # Company info
                metrics.update({
                    'founded_year': tavily_data.get('founded_year'),
                    'headquarters': tavily_data.get('headquarters'),
                    'total_funding': tavily_data.get('total_funding', 0),
                    'industry': tavily_data.get('industry')
                })
            
            # Extract metrics from market data
            if market_data:
                if 'crypto' in market_data:
                    crypto = market_data['crypto']
                    metrics.update({
                        'current_price': crypto.get('current_price'),
                        'market_cap': crypto.get('market_cap'),
                        'market_cap_rank': crypto.get('market_cap_rank'),
                        'volume_24h': crypto.get('total_volume'),
                        'price_change_24h': crypto.get('price_change_percentage_24h'),
                        'circulating_supply': crypto.get('circulating_supply'),
                        'total_supply': crypto.get('total_supply')
                    })
                
                if 'equity' in market_data:
                    equity = market_data['equity']
                    metrics.update({
                        'stock_price': equity.get('current_price'),
                        'market_cap': equity.get('market_cap'),
                        'pe_ratio': equity.get('pe_ratio'),
                        'revenue_ttm': equity.get('revenue'),
                        'profit_margin': equity.get('profit_margin'),
                        'dividend_yield': equity.get('dividend_yield')
                    })
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to extract key metrics: {e}")
            return {}


# Service instance
company_enrichment_service = CompanyEnrichmentService()