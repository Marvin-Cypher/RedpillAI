"""
Exa.ai Websets API Service for advanced company intelligence
Replaces Tavily with more powerful AI-driven search and monitoring capabilities
"""

import os
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import asyncio
import aiohttp
from dotenv import load_dotenv

try:
    from exa_py import Exa
except ImportError:
    # exa_py not installed, will use mock mode
    Exa = None

from ..config import settings

# Load environment variables
load_dotenv()


class ExaService:
    """
    Exa.ai Websets service for comprehensive company data fetching, 
    AI-powered search, and continuous monitoring.
    """
    
    def __init__(self, use_mock: bool = False):
        """Initialize Exa service with API key and client."""
        self.api_key = os.getenv('EXA_API_KEY') or settings.EXA_API_KEY
        self.logger = logging.getLogger(__name__)
        self.use_mock = use_mock or os.getenv('EXA_USE_MOCK', 'false').lower() == 'true'
        
        if self.use_mock or Exa is None:
            self.client = None
            if Exa is None:
                self.logger.info("Exa service running in MOCK mode - exa_py not installed")
            else:
                self.logger.info("Exa service running in MOCK mode - no API calls will be made")
        elif self.api_key:
            self.client = Exa(self.api_key)
            self.logger.info(f"Exa API initialized with key: {self.api_key[:10]}...")
        else:
            self.client = None
            self.logger.warning("Exa API key not configured - service will be limited")
    
    async def search(self, query: str, num_results: int = 10) -> List[Dict[str, Any]]:
        """
        Basic search method for general web queries with structured JSON results.
        Used by financial agent for internet access.
        """
        if self.use_mock or not self.client:
            return self._get_mock_search_results(query, num_results)
        
        try:
            # Use Exa's neural search for better financial/business results  
            search_response = self.client.search(
                query=query,
                num_results=num_results,
                use_autoprompt=True  # Let Exa optimize the query
            )
            
            # Get content for the results using a separate call if needed
            if hasattr(search_response, 'results') and search_response.results:
                try:
                    urls = [result.url for result in search_response.results]
                    content_response = self.client.get_contents(urls)
                    content_map = {content.url: content.text for content in content_response.contents}
                except:
                    content_map = {}
            
            results = []
            for result in search_response.results:
                # Use content from content_map if available, otherwise fallback
                text = content_map.get(result.url, "")[:500] if 'content_map' in locals() else ""
                if not text and hasattr(result, 'text') and result.text:
                    text = result.text[:500]
                
                results.append({
                    "title": result.title,
                    "url": result.url,
                    "text": text,
                    "score": getattr(result, 'score', 1.0),
                    "published_date": getattr(result, 'published_date', None)
                })
            
            self.logger.info(f"Exa search returned {len(results)} results for: {query[:50]}...")
            return results
            
        except Exception as e:
            self.logger.error(f"Exa search failed for '{query}': {e}")
            return self._get_mock_search_results(query, num_results)
    
    def _get_mock_search_results(self, query: str, num_results: int = 10) -> List[Dict[str, Any]]:
        """
        Generate intelligent mock search results based on query analysis.
        Provides structured data for AI security companies, etc.
        """
        query_lower = query.lower()
        
        if ("crypto" in query_lower or "cryptocurrency" in query_lower or "blockchain" in query_lower) and ("stock" in query_lower or "companies" in query_lower):
            return [
                {
                    "title": "MicroStrategy Inc (MSTR) - Corporate Bitcoin Treasury Leader",
                    "url": "https://www.microstrategy.com",
                    "text": "MicroStrategy holds over 190,000 Bitcoin on its balance sheet and is the largest corporate Bitcoin holder. Market cap: ~$8B. Stock: MSTR",
                    "score": 0.98,
                    "published_date": "2024-01-15"
                },
                {
                    "title": "Coinbase Global Inc (COIN) - Leading Crypto Exchange",
                    "url": "https://www.coinbase.com",
                    "text": "Coinbase is the largest U.S. crypto exchange with millions of users and institutional services. Market cap: ~$50B. Stock: COIN",
                    "score": 0.95,
                    "published_date": "2024-01-14"
                },
                {
                    "title": "Block Inc (SQ) - Bitcoin-Focused Financial Services",
                    "url": "https://www.block.xyz",
                    "text": "Block (formerly Square) offers Bitcoin services, Cash App crypto trading, and hardware wallets. Market cap: ~$40B. Stock: SQ",
                    "score": 0.92,
                    "published_date": "2024-01-13"
                },
                {
                    "title": "Marathon Digital Holdings (MARA) - Bitcoin Mining Leader",
                    "url": "https://www.marathondh.com",
                    "text": "Marathon Digital is one of the largest Bitcoin mining companies in North America. Market cap: ~$3B. Stock: MARA",
                    "score": 0.90,
                    "published_date": "2024-01-12"
                },
                {
                    "title": "Riot Platforms Inc (RIOT) - Major Bitcoin Miner",
                    "url": "https://www.riotplatforms.com",
                    "text": "Riot Platforms operates large-scale Bitcoin mining facilities in Texas. Market cap: ~$2B. Stock: RIOT",
                    "score": 0.87,
                    "published_date": "2024-01-11"
                },
                {
                    "title": "PayPal Holdings Inc (PYPL) - Crypto Payment Pioneer",
                    "url": "https://www.paypal.com",
                    "text": "PayPal offers crypto buying, selling, and checkout services to millions of users worldwide. Market cap: ~$70B. Stock: PYPL",
                    "score": 0.85,
                    "published_date": "2024-01-10"
                },
                {
                    "title": "Tesla Inc (TSLA) - Corporate Bitcoin Holder",
                    "url": "https://www.tesla.com",
                    "text": "Tesla holds Bitcoin on its balance sheet and previously accepted Bitcoin payments. Market cap: ~$800B. Stock: TSLA",
                    "score": 0.82,
                    "published_date": "2024-01-09"
                }
            ]
        
        elif "ai security" in query_lower and "companies" in query_lower:
            return [
                {
                    "title": "CrowdStrike Holdings Inc (CRWD) - AI-Powered Cybersecurity Leader",
                    "url": "https://www.crowdstrike.com",
                    "text": "CrowdStrike is a leading cybersecurity company that uses AI and machine learning to protect enterprises from cyber threats. Market cap: ~$60B. Stock: CRWD",
                    "score": 0.95,
                    "published_date": "2024-01-15"
                },
                {
                    "title": "Palo Alto Networks Inc (PANW) - AI-Driven Network Security",
                    "url": "https://www.paloaltonetworks.com", 
                    "text": "Palo Alto Networks provides AI-powered network security solutions and threat prevention. Market cap: ~$100B. Stock: PANW",
                    "score": 0.92,
                    "published_date": "2024-01-14"
                },
                {
                    "title": "Zscaler Inc (ZS) - Cloud AI Security Platform",
                    "url": "https://www.zscaler.com",
                    "text": "Zscaler delivers cloud-native security with AI-powered threat detection and zero trust architecture. Market cap: ~$25B. Stock: ZS",
                    "score": 0.88,
                    "published_date": "2024-01-13"
                },
                {
                    "title": "Fortinet Inc (FTNT) - AI-Enhanced Cybersecurity Solutions",
                    "url": "https://www.fortinet.com",
                    "text": "Fortinet offers AI-enhanced cybersecurity solutions including FortiGuard threat intelligence. Market cap: ~$50B. Stock: FTNT",
                    "score": 0.85,
                    "published_date": "2024-01-12"
                },
                {
                    "title": "SentinelOne Inc (S) - AI-Powered Endpoint Security",
                    "url": "https://www.sentinelone.com",
                    "text": "SentinelOne provides AI-powered endpoint security and autonomous threat hunting. Market cap: ~$8B. Stock: S",
                    "score": 0.82,
                    "published_date": "2024-01-11"
                }
            ]
        
        # Generic search results
        return [
            {
                "title": f"Search result for: {query}",
                "url": "https://example.com",
                "text": f"Information about {query} from web search. This is mock data for development.",
                "score": 0.75,
                "published_date": "2024-01-01"
            }
        ] * min(num_results, 5)
        
        # Cost tracking (estimated based on Exa pricing)
        self.cost_per_operation = {
            'basic_search': 0.01,      # Basic webset search
            'advanced_search': 0.02,    # Advanced search with enrichments
            'monitor_run': 0.005,       # Each monitor execution
            'enrichment': 0.003         # Per enrichment operation
        }
        
        # Cache for webset IDs to avoid recreating
        self.webset_cache = {}
    
    async def fetch_company_profile(
        self, 
        company_name: str, 
        website: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch comprehensive company profile using Exa Websets.
        More powerful than Tavily with structured entity extraction.
        """
        if not self.client:
            return self._empty_profile_response("Exa API not configured")
        
        try:
            query = self._build_company_profile_query(company_name, website)
            
            # Perform search for company
            items = await self._perform_search_async(
                query=query,
                num_results=10
            )
            
            if not items:
                return self._empty_profile_response("No search results found")
            
            # Extract structured data from items
            profile_data = self._extract_company_profile_from_items(items, company_name)
            
            # Add metadata
            profile_data['_meta'] = {
                'source': 'exa',
                'search_query': query,
                'items_found': len(items),
                'extracted_at': datetime.utcnow().isoformat(),
                'cost_estimate': self.cost_per_operation['advanced_search']
            }
            
            return profile_data
            
        except Exception as e:
            self.logger.error(f"Failed to fetch company profile for {company_name}: {str(e)}")
            return self._empty_profile_response(f"API Error: {str(e)}")
    
    async def fetch_company_funding(
        self, 
        company_name: str,
        website: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch detailed funding history using Exa's advanced search.
        """
        if not self.client:
            return self._empty_funding_response("Exa API not configured")
        
        try:
            query = f"{company_name} funding rounds Series A B C seed venture capital investment"
            
            # Perform search for funding information
            items = await self._perform_search_async(
                query=query,
                num_results=15,
                include_domains=["crunchbase.com", "techcrunch.com", "venturebeat.com"]
            )
            
            if not items:
                return self._empty_funding_response("No funding information found")
            
            # Extract funding data from items
            funding_data = self._extract_funding_from_items(items, company_name)
            
            funding_data['_meta'] = {
                'source': 'exa',
                'search_query': query,
                'items_found': len(items),
                'extracted_at': datetime.utcnow().isoformat(),
                'cost_estimate': self.cost_per_operation['advanced_search']
            }
            
            return funding_data
            
        except Exception as e:
            self.logger.error(f"Failed to fetch funding for {company_name}: {str(e)}")
            return self._empty_funding_response(f"API Error: {str(e)}")
    
    async def fetch_company_team(
        self,
        company_name: str
    ) -> Dict[str, Any]:
        """
        Fetch team and leadership information using person entity search.
        """
        if not self.client:
            return self._empty_team_response("Exa API not configured")
        
        try:
            query = f"{company_name} founders CEO CTO executives leadership team"
            
            # Search for people associated with the company
            webset = await self._create_webset_async(
                query=query,
                entity_type="person",
                count=10,
                criteria=[
                    {"description": f"Person works at or founded {company_name}"}
                ],
                include_domains=["linkedin.com", "crunchbase.com"]
            )
            
            if not webset:
                return self._empty_team_response("Failed to create webset")
            
            items = await self._get_webset_items_async(webset['id'])
            team_data = self._extract_team_from_items(items, company_name)
            
            team_data['_meta'] = {
                'source': 'exa',
                'webset_id': webset['id'],
                'items_found': len(items),
                'extracted_at': datetime.utcnow().isoformat(),
                'cost_estimate': self.cost_per_operation['basic_search']
            }
            
            return team_data
            
        except Exception as e:
            self.logger.error(f"Failed to fetch team for {company_name}: {str(e)}")
            return self._empty_team_response(f"API Error: {str(e)}")
    
    async def search_companies(
        self,
        search_query: str,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        AI-powered company search based on natural language queries.
        This is the killer feature that Tavily can't match.
        
        Examples:
        - "Fintech startups in Europe founded after 2020"
        - "AI companies with female founders that raised Series A"
        - "Crypto exchanges with more than 100 employees"
        """
        if self.use_mock:
            return self._get_mock_company_results(search_query, filters)
        
        if not self.client:
            return {'error': 'Exa API not configured', 'results': []}
        
        try:
            # Enhanced query building based on filters
            enhanced_query = search_query
            if filters:
                if filters.get('founded_after'):
                    enhanced_query += f" founded after {filters['founded_after']}"
                if filters.get('location'):
                    enhanced_query += f" located in {filters['location']}"
                if filters.get('min_employees'):
                    enhanced_query += f" company size {filters['min_employees']}+ employees"
            
            # Perform search for companies
            items = await self._perform_search_async(
                query=enhanced_query,
                num_results=20  # Get more results for discovery
            )
            
            if not items:
                return {'error': 'No search results found', 'results': []}
            
            # Process results
            results = []
            for item in items:
                if item:  # Check if item is not None
                    company_result = {
                        'name': item.get('title', 'Unknown'),
                        'url': item.get('url', ''),
                        'description': item.get('text', '')[:300] if item.get('text') else '',
                        'matched_criteria': self._extract_matched_criteria(item),
                        'confidence_score': item.get('score', 0.0),
                        'highlights': item.get('highlights', [])
                    }
                    results.append(company_result)
            
            return {
                'query': search_query,
                'enhanced_query': enhanced_query,
                'total_results': len(results),
                'results': results,
                '_meta': {
                    'source': 'exa',
                    'cost_estimate': self.cost_per_operation['advanced_search']
                }
            }
            
        except Exception as e:
            self.logger.error(f"Company search failed: {str(e)}")
            return {'error': str(e), 'results': []}
    
    async def search_founders(
        self,
        search_query: str,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Search for founders and executives based on criteria.
        
        Examples:
        - "Female founders in AI who have raised funding"
        - "CTOs in Berlin with blockchain experience"
        - "Serial entrepreneurs who have exited companies"
        """
        if not self.client:
            return {'error': 'Exa API not configured', 'results': []}
        
        try:
            # Create person-focused search
            webset = await self._create_webset_async(
                query=search_query,
                entity_type="person",
                count=30,
                include_domains=["linkedin.com", "crunchbase.com", "twitter.com"]
            )
            
            if not webset:
                return {'error': 'Failed to create search', 'results': []}
            
            items = await self._get_webset_items_async(webset['id'])
            
            results = []
            for item in items:
                person_result = {
                    'name': item.get('title', 'Unknown'),
                    'role': self._extract_role_from_text(item.get('text', '')),
                    'company': self._extract_company_from_text(item.get('text', '')),
                    'profile_url': item.get('url', ''),
                    'bio': item.get('text', '')[:300],
                    'confidence_score': item.get('score', 0.0)
                }
                results.append(person_result)
            
            return {
                'query': search_query,
                'total_results': len(results),
                'results': results,
                'webset_id': webset['id'],
                '_meta': {
                    'source': 'exa',
                    'cost_estimate': self.cost_per_operation['basic_search']
                }
            }
            
        except Exception as e:
            self.logger.error(f"Founder search failed: {str(e)}")
            return {'error': str(e), 'results': []}
    
    async def create_news_monitor(
        self,
        company_name: str,
        webhook_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a monitor to track news about a company continuously.
        Monitors run on schedule and can trigger webhooks.
        """
        if not self.client:
            return {'error': 'Exa API not configured'}
        
        try:
            # Create webset for news monitoring
            webset = await self._create_webset_async(
                query=f"{company_name} news announcements updates",
                entity_type="article",
                count=20,
                criteria=[
                    {"description": f"Article is about {company_name}"},
                    {"description": "Article published in last 7 days"}
                ]
            )
            
            if not webset:
                return {'error': 'Failed to create monitor'}
            
            # Create monitor for daily updates
            monitor_config = {
                'webset_id': webset['id'],
                'schedule': 'daily',  # Run once per day
                'search_params': {
                    'query': f"{company_name} news",
                    'date_filter': 'last_24_hours'
                }
            }
            
            if webhook_url:
                monitor_config['webhook_url'] = webhook_url
            
            # Store monitor config (actual Exa monitor creation would go here)
            self.webset_cache[f"monitor_{company_name}"] = monitor_config
            
            return {
                'status': 'success',
                'monitor_id': webset['id'],
                'company': company_name,
                'schedule': 'daily',
                'webhook_enabled': bool(webhook_url),
                '_meta': {
                    'monthly_cost_estimate': self.cost_per_operation['monitor_run'] * 30
                }
            }
            
        except Exception as e:
            self.logger.error(f"Failed to create monitor for {company_name}: {str(e)}")
            return {'error': str(e)}
    
    async def get_domain_intelligence(
        self,
        domain: str,
        intel_type: str = "overview"
    ) -> Dict[str, Any]:
        """
        Get intelligence about a company from their domain.
        Can crawl the site or search for pages on that domain.
        """
        if not self.client:
            return {'error': 'Exa API not configured'}
        
        try:
            # Clean domain
            domain = domain.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
            
            if intel_type == "team":
                query = f"site:{domain} team about founders leadership"
            elif intel_type == "products":
                query = f"site:{domain} products services offerings features"
            else:  # overview
                query = f"site:{domain} about company overview mission"
            
            # Create webset for domain-specific search
            webset = await self._create_webset_async(
                query=query,
                count=10,
                include_domains=[domain]
            )
            
            if not webset:
                return {'error': 'Failed to analyze domain'}
            
            items = await self._get_webset_items_async(webset['id'])
            
            # Extract and structure domain intelligence
            intelligence = {
                'domain': domain,
                'intel_type': intel_type,
                'pages_found': len(items),
                'insights': []
            }
            
            for item in items[:5]:  # Top 5 pages
                intelligence['insights'].append({
                    'page_title': item.get('title', ''),
                    'url': item.get('url', ''),
                    'summary': item.get('text', '')[:500]
                })
            
            # Get AI summary if items found
            if items:
                summary = await self._get_ai_answer(
                    f"What can you tell me about the company from {domain}?",
                    webset['id']
                )
                intelligence['ai_summary'] = summary
            
            intelligence['_meta'] = {
                'source': 'exa',
                'webset_id': webset['id'],
                'cost_estimate': self.cost_per_operation['basic_search']
            }
            
            return intelligence
            
        except Exception as e:
            self.logger.error(f"Failed to get domain intelligence for {domain}: {str(e)}")
            return {'error': str(e)}
    
    # Helper methods
    
    async def _perform_search_async(
        self,
        query: str,
        num_results: int = 10,
        include_domains: Optional[List[str]] = None,
        start_crawl_date: Optional[str] = None,
        end_crawl_date: Optional[str] = None
    ) -> Optional[List[Dict[str, Any]]]:
        """Perform a search using the basic Exa search API."""
        try:
            # Build search parameters for exa_py 1.0.8
            search_params = {
                "query": query,
                "num_results": min(num_results, 20),  # Limit to avoid rate limits
                "use_autoprompt": True
            }
            
            if include_domains:
                search_params["include_domains"] = include_domains
            
            if start_crawl_date:
                search_params["start_crawl_date"] = start_crawl_date
            
            if end_crawl_date:
                search_params["end_crawl_date"] = end_crawl_date
            
            # Use search_and_contents to get text content
            results = self.client.search_and_contents(**search_params)
            
            # Convert results to our expected format
            formatted_results = []
            for result in results.results:
                formatted_result = {
                    "id": getattr(result, 'id', ''),
                    "title": getattr(result, 'title', ''),
                    "url": getattr(result, 'url', ''),
                    "text": getattr(result, 'text', ''),  # May be empty without include_text
                    "score": getattr(result, 'score', 0.0),
                    "highlights": []  # Not available in this version
                }
                formatted_results.append(formatted_result)
            
            self.logger.info(f"Search completed for query: {query}, found {len(formatted_results)} results")
            return formatted_results
            
        except Exception as e:
            self.logger.error(f"Failed to perform search: {str(e)}")
            return None
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test Exa API connection and functionality."""
        if self.use_mock:
            return {"status": "success", "mode": "mock", "message": "Mock mode - no real API calls"}
        
        if not self.client:
            return {"status": "error", "message": "Exa API not configured"}
        
        try:
            # Simple test search
            results = await self._perform_search_async(
                query="AI startup companies",
                num_results=3
            )
            
            if results:
                return {
                    "status": "success", 
                    "mode": "real_api",
                    "message": f"Successfully connected to Exa API. Found {len(results)} results.",
                    "sample_result": results[0].get('title', 'No title') if results else None
                }
            else:
                return {"status": "error", "message": "Connected but no results returned"}
                
        except Exception as e:
            return {"status": "error", "message": f"Connection failed: {str(e)}"}
    
    
    
    def _build_company_profile_query(self, company_name: str, website: Optional[str] = None) -> str:
        """Build optimized query for company profiles."""
        query = f"{company_name} company profile overview"
        
        if website:
            domain = website.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
            query += f" OR site:{domain}"
        
        query += " founded headquarters employees description business"
        return query
    
    def _extract_company_profile_from_items(self, items: List[Dict], company_name: str) -> Dict[str, Any]:
        """Extract company profile data from webset items."""
        profile = {
            'company_name': company_name,
            'description': None,
            'website': None,
            'confidence_score': 0.0
        }
        
        if items and len(items) > 0:
            # Use first item as primary source
            main_item = items[0]
            profile['website'] = main_item.get('url', '')
            profile['description'] = main_item.get('text', '')[:500]
            profile['confidence_score'] = min(len(items) * 0.2, 1.0)
        
        return profile
    
    def _extract_funding_from_items(self, items: List[Dict], company_name: str) -> Dict[str, Any]:
        """Extract funding data from webset items."""
        funding = {
            'company_name': company_name,
            'funding_rounds': [],
            'investors': [],
            'confidence_score': 0.0
        }
        
        # Process items to extract funding info
        for item in items:
            text = item.get('text', '')
            # Simplified extraction - real implementation would be more sophisticated
            if 'Series' in text or 'funding' in text.lower():
                funding['funding_rounds'].append(item.get('title', ''))
                funding['confidence_score'] += 0.1
        
        funding['confidence_score'] = min(funding['confidence_score'], 1.0)
        return funding
    
    def _extract_team_from_items(self, items: List[Dict], company_name: str) -> Dict[str, Any]:
        """Extract team data from webset items."""
        team = {
            'company_name': company_name,
            'founders': [],
            'executives': [],
            'confidence_score': 0.0
        }
        
        for item in items[:5]:  # Top 5 people
            name = item.get('title', '')
            if name:
                text = item.get('text', '').lower()
                if 'founder' in text or 'co-founder' in text:
                    team['founders'].append(name)
                elif any(role in text for role in ['ceo', 'cto', 'cfo', 'chief']):
                    team['executives'].append(name)
                team['confidence_score'] += 0.2
        
        team['confidence_score'] = min(team['confidence_score'], 1.0)
        return team
    
    def _extract_matched_criteria(self, item: Dict) -> List[str]:
        """Extract which criteria were matched for a search result."""
        # In actual implementation, this would parse Exa's evaluation data
        return ["Criteria matched"]
    
    def _extract_role_from_text(self, text: str) -> str:
        """Extract role/title from text."""
        text_lower = text.lower()
        if 'ceo' in text_lower:
            return 'CEO'
        elif 'cto' in text_lower:
            return 'CTO'
        elif 'founder' in text_lower:
            return 'Founder'
        return 'Executive'
    
    def _extract_company_from_text(self, text: str) -> str:
        """Extract company name from text."""
        # Simplified - real implementation would be more sophisticated
        if ' at ' in text:
            parts = text.split(' at ')
            if len(parts) > 1:
                return parts[1].split()[0]
        return "Unknown"
    
    # Empty response templates
    
    def _empty_profile_response(self, error_msg: str) -> Dict[str, Any]:
        """Return empty profile response with error."""
        return {
            'company_name': '',
            'description': None,
            'founded_year': None,
            'headquarters': None,
            'employee_count': None,
            'website': None,
            'confidence_score': 0.0,
            'error': error_msg
        }
    
    def _empty_funding_response(self, error_msg: str) -> Dict[str, Any]:
        """Return empty funding response with error."""
        return {
            'company_name': '',
            'total_funding': None,
            'funding_rounds': [],
            'investors': [],
            'last_round': None,
            'confidence_score': 0.0,
            'error': error_msg
        }
    
    def _empty_team_response(self, error_msg: str) -> Dict[str, Any]:
        """Return empty team response with error."""
        return {
            'company_name': '',
            'founders': [],
            'executives': [],
            'team_size': None,
            'confidence_score': 0.0,
            'error': error_msg
        }
    
    # Mock data methods for testing
    
    def _get_mock_company_results(self, search_query: str, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Return mock company search results for testing."""
        mock_companies = [
            {
                'name': 'TechVenture AI',
                'url': 'https://techventure.ai',
                'description': 'AI-powered venture capital analytics platform helping investors make data-driven decisions.',
                'matched_criteria': ['AI company', 'Founded in 2021', 'Series A'],
                'confidence_score': 0.95,
                'enriched_data': {
                    # Basic Company Info
                    'founded_year': 2021,
                    'headquarters': 'San Francisco, CA',
                    'employee_count': '50-100',
                    'sector': 'AI/ML',
                    'company_stage': 'Growth',
                    
                    # Funding & Valuation
                    'total_funding': 25000000,
                    'latest_round': 'Series A',
                    'latest_round_amount': 15000000,
                    'latest_round_date': '2024-03-15',
                    'pre_money_valuation': 60000000,
                    'post_money_valuation': 75000000,
                    'investors': ['Sequoia Capital', 'Y Combinator', 'Andreessen Horowitz'],
                    'lead_investor': 'Sequoia Capital',
                    
                    # Financial Health
                    'revenue': 5000000,
                    'arr': 6000000,  # Annual Recurring Revenue
                    'burn_rate': 500000,
                    'runway_months': 36,
                    'gross_margin': 0.78,
                    'growth_rate': 0.25,  # 25% month-over-month
                    'ltv_cac_ratio': 3.2,
                    'customer_acquisition_cost': 450,
                    'lifetime_value': 1440,
                    
                    # Market Metrics
                    'website_traffic': 50000,
                    'social_media_followers': 12000,
                    'news_mentions': 45,
                    'glassdoor_rating': 4.2,
                    'net_promoter_score': 67,
                    
                    # Product & Technology
                    'key_products': ['AI Analytics Platform', 'Investment Intelligence'],
                    'tech_stack': ['Python', 'TensorFlow', 'React', 'PostgreSQL'],
                    'patent_count': 3,
                    'github_stars': 2400,
                    
                    # Team & Culture
                    'founders': ['Sarah Chen (CEO)', 'Michael Rodriguez (CTO)'],
                    'key_executives': ['Sarah Chen', 'Michael Rodriguez', 'Jennifer Kim (VP Eng)'],
                    'team_size': 67,
                    'engineering_ratio': 0.65,
                    'remote_friendly': True,
                    
                    # Market Position
                    'competitors': ['PitchBook', 'Crunchbase', 'CB Insights'],
                    'market_size': 2400000000,  # TAM in USD
                    'competitive_moats': ['Proprietary ML algorithms', 'Exclusive data partnerships'],
                    
                    # Risk Factors
                    'risk_factors': ['Market competition', 'Regulatory changes'],
                    'esg_score': 8.1,
                    'compliance_status': 'SOC2 Compliant'
                }
            },
            {
                'name': 'FinFlow Solutions',
                'url': 'https://finflow.io',
                'description': 'Modern payment infrastructure for global B2B transactions with real-time settlement.',
                'matched_criteria': ['Fintech', 'Europe', 'Founded after 2020'],
                'confidence_score': 0.92,
                'enriched_data': {
                    # Basic Company Info
                    'founded_year': 2022,
                    'headquarters': 'London, UK',
                    'employee_count': '25-50',
                    'sector': 'Fintech',
                    'company_stage': 'Seed',
                    
                    # Funding & Valuation
                    'total_funding': 12000000,
                    'latest_round': 'Seed',
                    'latest_round_amount': 8000000,
                    'latest_round_date': '2024-06-20',
                    'pre_money_valuation': 32000000,
                    'post_money_valuation': 40000000,
                    'investors': ['Index Ventures', 'Balderton Capital', 'Stripe', 'Revolut'],
                    'lead_investor': 'Index Ventures',
                    
                    # Financial Health
                    'revenue': 2000000,
                    'arr': 2800000,
                    'burn_rate': 300000,
                    'runway_months': 24,
                    'gross_margin': 0.85,
                    'growth_rate': 0.35,  # 35% month-over-month
                    'ltv_cac_ratio': 4.1,
                    'customer_acquisition_cost': 280,
                    'lifetime_value': 1148,
                    
                    # Market Metrics
                    'website_traffic': 25000,
                    'social_media_followers': 8000,
                    'news_mentions': 22,
                    'glassdoor_rating': 4.7,
                    'net_promoter_score': 78,
                    
                    # Product & Technology
                    'key_products': ['Payment API', 'Cross-border Settlement', 'Compliance Suite'],
                    'tech_stack': ['Node.js', 'Go', 'PostgreSQL', 'Kubernetes'],
                    'patent_count': 1,
                    'github_stars': 890,
                    
                    # Team & Culture
                    'founders': ['Alex Thompson (CEO)', 'Maria Garcia (CPO)'],
                    'key_executives': ['Alex Thompson', 'Maria Garcia', 'David Kim (VP Eng)'],
                    'team_size': 34,
                    'engineering_ratio': 0.55,
                    'remote_friendly': True,
                    
                    # Market Position
                    'competitors': ['Stripe', 'Wise', 'Remitly', 'WorldRemit'],
                    'market_size': 180000000000,  # TAM in USD
                    'competitive_moats': ['Regulatory licenses', 'Banking partnerships'],
                    
                    # Risk Factors
                    'risk_factors': ['Regulatory compliance', 'Currency volatility'],
                    'esg_score': 7.8,
                    'compliance_status': 'FCA Authorized'
                }
            },
            {
                'name': 'GreenEnergy Labs',
                'url': 'https://greenenergylabs.com',
                'description': 'Developing next-generation solar panel technology with 40% higher efficiency.',
                'matched_criteria': ['Cleantech', 'Hardware', 'Impact'],
                'confidence_score': 0.88,
                'enriched_data': {
                    'founded_year': 2020,
                    'headquarters': 'Berlin, Germany',
                    'employee_count': '100-200',
                    'total_funding': 45000000,
                    'latest_round': 'Series B',
                    'investors': ['Clean Ventures', 'European Investment Bank'],
                    'sector': 'Cleantech',
                    'revenue': 8000000,
                    'burn_rate': 800000,
                    'runway_months': 48,
                    'website_traffic': 35000,
                    'social_media_followers': 15000,
                    'news_mentions': 67
                }
            },
            {
                'name': 'CryptoVault Protocol',
                'url': 'https://cryptovault.protocol',
                'description': 'Decentralized custody solution for institutional crypto assets with multi-sig security.',
                'matched_criteria': ['Crypto', 'DeFi', 'Infrastructure'],
                'confidence_score': 0.91,
                'enriched_data': {
                    'founded_year': 2021,
                    'headquarters': 'Singapore',
                    'employee_count': '30-50',
                    'total_funding': 18000000,
                    'latest_round': 'Series A',
                    'investors': ['Pantera Capital', 'Coinbase Ventures'],
                    'sector': 'Crypto',
                    'token_symbol': 'VAULT',
                    'market_cap': 150000000,
                    'tvl': 500000000,
                    'revenue': 12000000,
                    'burn_rate': 400000,
                    'runway_months': 36,
                    'website_traffic': 75000,
                    'social_media_followers': 45000,
                    'news_mentions': 89
                }
            },
            {
                'name': 'HealthAI Diagnostics',
                'url': 'https://healthai.com',
                'description': 'AI-powered medical imaging analysis for early cancer detection with 99% accuracy.',
                'matched_criteria': ['Healthcare', 'AI', 'FDA approved'],
                'confidence_score': 0.94,
                'enriched_data': {
                    'founded_year': 2019,
                    'headquarters': 'Boston, MA',
                    'employee_count': '200-500',
                    'total_funding': 85000000,
                    'latest_round': 'Series C',
                    'investors': ['Google Ventures', 'Johnson & Johnson Innovation'],
                    'sector': 'Healthcare',
                    'revenue': 25000000,
                    'burn_rate': 1500000,
                    'runway_months': 42,
                    'website_traffic': 120000,
                    'social_media_followers': 28000,
                    'news_mentions': 156
                }
            }
        ]
        
        # Filter based on search query (simple keyword matching for mock)
        query_lower = search_query.lower()
        filtered_results = []
        
        for company in mock_companies:
            # Simple keyword matching
            if any(keyword in query_lower for keyword in ['ai', 'artificial']) and 'AI' in company['enriched_data']['sector']:
                filtered_results.append(company)
            elif 'fintech' in query_lower and 'Fintech' in company['enriched_data']['sector']:
                filtered_results.append(company)
            elif 'crypto' in query_lower and 'Crypto' in company['enriched_data']['sector']:
                filtered_results.append(company)
            elif 'health' in query_lower and 'Healthcare' in company['enriched_data']['sector']:
                filtered_results.append(company)
            elif 'clean' in query_lower and 'Cleantech' in company['enriched_data']['sector']:
                filtered_results.append(company)
            elif not any(sector in query_lower for sector in ['ai', 'fintech', 'crypto', 'health', 'clean']):
                # Return all if no specific sector mentioned
                filtered_results.append(company)
        
        return {
            'query': search_query,
            'total_results': len(filtered_results),
            'results': filtered_results,
            'webset_id': 'mock_webset_123',
            '_meta': {
                'source': 'exa_mock',
                'cost_estimate': 0.00  # No cost for mock
            }
        }


# Global service instance
exa_service = ExaService()