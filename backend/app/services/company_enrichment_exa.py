"""
Company Data Enrichment Service with Exa.ai Integration
Primary: Exa.ai for powerful AI-driven search and monitoring
Fallback: Tavily for basic company data
Plus: OpenBB for market data
"""

import logging
import os
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from sqlmodel import Session

from app.models.companies import Company, CompanyType
from app.services.exa_service import ExaService
from app.services.tavily_service import TavilyService
from app.services.openbb_service import OpenBBService
from app.database import get_session

logger = logging.getLogger(__name__)


class CompanyEnrichmentServiceExa:
    """
    Enhanced company enrichment service using Exa.ai as primary source.
    Falls back to Tavily if Exa is unavailable or not configured.
    """
    
    def __init__(self):
        """Initialize services with Exa as primary, Tavily as fallback."""
        self.exa_service = ExaService()
        self.tavily_service = TavilyService()
        self.openbb_service = OpenBBService()
        
        # Check if Exa is configured
        from app.config import settings
        self.exa_enabled = bool(settings.EXA_API_KEY)
        if self.exa_enabled:
            logger.info("Exa.ai service enabled for enhanced company enrichment")
        else:
            logger.warning("Exa.ai not configured, falling back to Tavily")
    
    async def enrich_company_data(
        self, 
        company: Company, 
        force_refresh: bool = False,
        use_exa: bool = True
    ) -> Company:
        """
        Enrich company data with Exa (primary) or Tavily (fallback) + OpenBB.
        
        Args:
            company: Company object to enrich
            force_refresh: Whether to force refresh even if data is recent
            use_exa: Whether to attempt using Exa first (default True)
            
        Returns:
            Updated company object with enriched data
        """
        try:
            logger.info(f"Starting data enrichment for company: {company.name}")
            
            # Check if we need to refresh data
            if not self._should_refresh_data(company, force_refresh):
                logger.info(f"Data for {company.name} is fresh, skipping refresh")
                return company
            
            # Step 1: Try Exa first if enabled
            intelligence_data = None
            data_source = None
            
            if use_exa and self.exa_enabled:
                intelligence_data = await self._get_exa_data(company)
                if intelligence_data and not intelligence_data.get('error'):
                    data_source = 'exa'
                    logger.info(f"Successfully enriched {company.name} with Exa.ai")
            
            # Step 2: Fallback to Tavily if Exa didn't work
            if not intelligence_data:
                intelligence_data = await self._get_tavily_data(company)
                if intelligence_data and not intelligence_data.get('error'):
                    data_source = 'tavily'
                    logger.info(f"Enriched {company.name} with Tavily (fallback)")
            
            # Step 3: Enrich with OpenBB market data
            market_data = await self._get_openbb_data(company)
            
            # Step 4: Process and store enriched data
            company = self._process_enriched_data(
                company, 
                intelligence_data, 
                market_data,
                data_source
            )
            
            # Update timestamps
            company.data_last_refreshed = datetime.utcnow()
            if intelligence_data:
                if data_source == 'exa':
                    company.exa_last_updated = datetime.utcnow()
                else:
                    company.tavily_last_updated = datetime.utcnow()
            if market_data:
                company.market_data_last_updated = datetime.utcnow()
            
            logger.info(f"Successfully enriched data for {company.name} using {data_source}")
            return company
            
        except Exception as e:
            logger.error(f"Failed to enrich data for {company.name}: {e}")
            return company
    
    async def _get_exa_data(self, company: Company) -> Optional[Dict[str, Any]]:
        """
        Get comprehensive company data from Exa.ai.
        Returns structured data with profile, funding, team, and news.
        """
        try:
            logger.info(f"Fetching Exa data for {company.name}")
            
            # Fetch comprehensive data using Exa's powerful search
            exa_data = {}
            
            # Get company profile
            profile = await self.exa_service.fetch_company_profile(
                company.name,
                company.website
            )
            if profile and not profile.get('error'):
                exa_data.update(profile)
            
            # Get funding information
            funding = await self.exa_service.fetch_company_funding(
                company.name,
                company.website
            )
            if funding and not funding.get('error'):
                exa_data['funding_data'] = funding
                exa_data['total_funding'] = funding.get('total_funding')
                exa_data['investors'] = funding.get('investors', [])
                exa_data['funding_rounds'] = funding.get('funding_rounds', [])
            
            # Get team information
            team = await self.exa_service.fetch_company_team(company.name)
            if team and not team.get('error'):
                exa_data['team_data'] = team
                exa_data['founders'] = team.get('founders', [])
                exa_data['executives'] = team.get('executives', [])
            
            # Get recent news/market intelligence
            intelligence = await self.exa_service.fetch_market_intelligence(
                company.name,
                "news"
            )
            if intelligence and not intelligence.get('error'):
                exa_data['news'] = intelligence.get('articles', [])
                exa_data['market_summary'] = intelligence.get('summary')
            
            # Add Exa-specific metadata
            exa_data['_source'] = 'exa'
            exa_data['_confidence'] = max(
                profile.get('confidence_score', 0),
                funding.get('confidence_score', 0),
                team.get('confidence_score', 0)
            )
            
            return exa_data if exa_data else None
            
        except Exception as e:
            logger.warning(f"Failed to fetch Exa data for {company.name}: {e}")
            return None
    
    async def _get_tavily_data(self, company: Company) -> Optional[Dict[str, Any]]:
        """Get company data from Tavily API (fallback)."""
        try:
            logger.info(f"Fetching Tavily data for {company.name}")
            
            # Use existing Tavily service methods
            tavily_data = await self.tavily_service.fetch_company_profile(
                company.name, 
                company.website
            )
            
            # Also get funding data
            funding = await self.tavily_service.fetch_company_funding(
                company.name,
                company.website
            )
            if funding and not funding.get('error'):
                tavily_data['funding_data'] = funding
                tavily_data['total_funding'] = funding.get('total_funding')
            
            # Get team data
            team = await self.tavily_service.fetch_company_team(company.name)
            if team and not team.get('error'):
                tavily_data['team_data'] = team
                tavily_data['founders'] = team.get('founders', [])
            
            if tavily_data and not tavily_data.get('error'):
                tavily_data['_source'] = 'tavily'
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
    
    def _should_refresh_data(self, company: Company, force_refresh: bool) -> bool:
        """Check if company data needs refreshing."""
        if force_refresh:
            return True
            
        if not company.data_last_refreshed:
            return True
            
        # Refresh data older than 24 hours
        refresh_threshold = datetime.utcnow() - timedelta(hours=24)
        return company.data_last_refreshed < refresh_threshold
    
    def _infer_ticker_symbol(self, company_name: str) -> Optional[str]:
        """Infer ticker symbol from company name."""
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
            'oracle': 'ORCL'
        }
        
        company_lower = company_name.lower()
        for name, ticker in ticker_mappings.items():
            if name in company_lower:
                return ticker
        
        return None
    
    def _process_enriched_data(
        self, 
        company: Company, 
        intelligence_data: Optional[Dict], 
        market_data: Optional[Dict],
        data_source: Optional[str]
    ) -> Company:
        """Process and merge enriched data into company object."""
        try:
            # Store raw enriched data
            company.enriched_data = intelligence_data
            company.market_data = market_data
            
            # Track data source
            if intelligence_data:
                intelligence_data['_data_source'] = data_source
            
            # Extract and normalize key metrics
            key_metrics = self._extract_key_metrics(intelligence_data, market_data)
            company.key_metrics = key_metrics
            
            # Update company fields with enriched data if available
            if intelligence_data:
                # Update basic company info
                if intelligence_data.get('founded_year') and not company.founded_year:
                    company.founded_year = intelligence_data.get('founded_year')
                
                if intelligence_data.get('headquarters') and not company.headquarters:
                    company.headquarters = intelligence_data.get('headquarters')
                
                if intelligence_data.get('employee_count') and not company.employee_count:
                    company.employee_count = str(intelligence_data.get('employee_count'))
                
                if intelligence_data.get('description') and not company.description:
                    company.description = intelligence_data.get('description')
                
                # Update funding information
                if intelligence_data.get('total_funding'):
                    company.total_funding = intelligence_data.get('total_funding')
                
                if intelligence_data.get('founders'):
                    company.founders = intelligence_data.get('founders')
                
                # Store news if available (Exa provides richer news data)
                if intelligence_data.get('news'):
                    company.recent_news = intelligence_data.get('news')[:5]  # Store top 5 news
            
            logger.info(f"Processed enriched data for {company.name} from {data_source}")
            return company
            
        except Exception as e:
            logger.error(f"Failed to process enriched data for {company.name}: {e}")
            return company
    
    def _extract_key_metrics(
        self, 
        intelligence_data: Optional[Dict], 
        market_data: Optional[Dict]
    ) -> Dict[str, Any]:
        """Extract key financial and business metrics from enriched data."""
        metrics = {}
        
        try:
            # Extract metrics from intelligence data (Exa or Tavily)
            if intelligence_data:
                # Company fundamentals
                metrics.update({
                    'founded_year': intelligence_data.get('founded_year'),
                    'headquarters': intelligence_data.get('headquarters'),
                    'total_funding': intelligence_data.get('total_funding', 0),
                    'industry': intelligence_data.get('industry'),
                    'employee_count': intelligence_data.get('employee_count'),
                    'data_source': intelligence_data.get('_source', 'unknown'),
                    'confidence_score': intelligence_data.get('_confidence', 0)
                })
                
                # Funding metrics
                if 'funding_data' in intelligence_data:
                    funding = intelligence_data['funding_data']
                    metrics.update({
                        'last_funding_round': funding.get('last_round'),
                        'funding_rounds_count': len(funding.get('funding_rounds', [])),
                        'investor_count': len(funding.get('investors', []))
                    })
                
                # Team metrics
                if 'team_data' in intelligence_data:
                    team = intelligence_data['team_data']
                    metrics.update({
                        'founder_count': len(team.get('founders', [])),
                        'executive_count': len(team.get('executives', []))
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
                        'profit_margin': equity.get('profit_margin')
                    })
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to extract key metrics: {e}")
            return {}
    
    async def setup_company_monitor(
        self,
        company: Company,
        webhook_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Set up continuous monitoring for a company using Exa monitors.
        This will track news and updates automatically.
        """
        if not self.exa_enabled:
            return {'error': 'Exa not configured for monitoring'}
        
        try:
            result = await self.exa_service.create_news_monitor(
                company.name,
                webhook_url
            )
            
            if result.get('status') == 'success':
                # Store monitor ID in company record
                company.monitor_id = result.get('monitor_id')
                company.monitor_enabled = True
                logger.info(f"Created Exa monitor for {company.name}")
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to setup monitor for {company.name}: {e}")
            return {'error': str(e)}


# Service instance - use this instead of the old one
company_enrichment_service_exa = CompanyEnrichmentServiceExa()