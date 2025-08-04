"""
News Service - Google Search-based news fetching for companies.

Uses Google Custom Search API to find recent news articles about companies.
"""

import asyncio
import httpx
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from ..config import settings

logger = logging.getLogger(__name__)


class NewsService:
    """Service for fetching company news using Google Search API."""
    
    def __init__(self):
        self.google_api_key = getattr(settings, 'google_search_api_key', None)
        self.google_cx_id = getattr(settings, 'google_search_cx_id', None)
        self.client = None
        
    async def __aenter__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()
    
    def _build_search_query(self, company_name: str, company_type: str = "company") -> str:
        """Build optimized search query for company news."""
        # Clean and optimize company name for better search results
        # Remove common corporate suffixes that may be too restrictive
        clean_name = company_name
        suffixes_to_remove = [" Corporation", " Corp", " Inc", " LLC", " Ltd", " Limited", " Company", " Co"]
        for suffix in suffixes_to_remove:
            if clean_name.endswith(suffix):
                clean_name = clean_name[:-len(suffix)].strip()
                break
        
        # For crypto companies, add relevant keywords
        if company_type.lower() == "crypto":
            return f'"{clean_name}" cryptocurrency blockchain news'
        elif company_type.lower() == "public":
            return f'"{clean_name}" stock earnings financial news'
        else:
            return f'"{clean_name}" company news business'
    
    async def get_company_news(
        self, 
        company_name: str, 
        company_type: str = "company",
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get recent news for a company using Google Search.
        
        Args:
            company_name: Name of the company
            company_type: Type of company (crypto, public, private)
            limit: Number of news articles to return
            
        Returns:
            List of news articles with title, url, snippet, and published date
        """
        if not self.google_api_key or not self.google_cx_id:
            logger.warning("Google Search API not configured, returning empty news")
            return []
            
        try:
            search_query = self._build_search_query(company_name, company_type)
            
            # Build search parameters
            params = {
                'key': self.google_api_key,
                'cx': self.google_cx_id,
                'q': search_query,
                'num': min(limit, 10),  # Google API max is 10
                'gl': 'us',
                'lr': 'lang_en',
                'dateRestrict': 'm1',  # Past month
                'sort': 'date'  # Sort by date
            }
            
            # Add news-specific sites for better results
            news_sites = [
                'site:reuters.com OR site:bloomberg.com OR site:cnbc.com',
                'OR site:coindesk.com OR site:cointelegraph.com',
                'OR site:techcrunch.com OR site:venturebeat.com'
            ]
            params['q'] += f' ({" ".join(news_sites)})'
            
            logger.info(f"Searching for news: {search_query}")
            
            response = await self.client.get(
                'https://www.googleapis.com/customsearch/v1',
                params=params
            )
            response.raise_for_status()
            
            data = response.json()
            items = data.get('items', [])
            
            news_articles = []
            for item in items:
                # Extract publish date from snippet or use current date
                publish_date = self._extract_date(item.get('snippet', ''))
                
                article = {
                    'title': item.get('title', ''),
                    'url': item.get('link', ''),
                    'snippet': item.get('snippet', ''),
                    'source': self._extract_source(item.get('link', '')),
                    'published_at': publish_date,
                    'relevance_score': 0.8  # Default relevance for Google results
                }
                news_articles.append(article)
            
            logger.info(f"Found {len(news_articles)} news articles for {company_name}")
            return news_articles
            
        except Exception as e:
            logger.error(f"Failed to fetch news for {company_name}: {str(e)}")
            return []
    
    def _extract_source(self, url: str) -> str:
        """Extract source name from URL."""
        try:
            from urllib.parse import urlparse
            domain = urlparse(url).netloc
            
            # Map domains to readable source names
            source_mapping = {
                'reuters.com': 'Reuters',
                'bloomberg.com': 'Bloomberg',
                'cnbc.com': 'CNBC',
                'coindesk.com': 'CoinDesk',
                'cointelegraph.com': 'Cointelegraph',
                'techcrunch.com': 'TechCrunch',
                'venturebeat.com': 'VentureBeat',
                'forbes.com': 'Forbes',
                'wsj.com': 'Wall Street Journal'
            }
            
            for domain_key, source_name in source_mapping.items():
                if domain_key in domain:
                    return source_name
            
            # Return cleaned domain name if not in mapping
            return domain.replace('www.', '').replace('.com', '').title()
            
        except Exception:
            return 'News Source'
    
    def _extract_date(self, snippet: str) -> str:
        """Extract or estimate publish date from snippet."""
        # For now, return current date - could be enhanced with date parsing
        return datetime.now().isoformat()


# Global service instance
news_service = NewsService()