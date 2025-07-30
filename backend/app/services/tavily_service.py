"""Tavily API service for intelligent company data fetching."""

from typing import Dict, Any, Optional, List
import asyncio
import re
import logging
from datetime import datetime
import aiohttp
import json

from ..config import settings


class TavilyService:
    """
    Tavily API service for comprehensive company data fetching.
    Focused on cost-efficient, high-quality data extraction.
    """
    
    def __init__(self):
        self.api_key = settings.TAVILY_API_KEY
        self.base_url = "https://api.tavily.com"
        self.logger = logging.getLogger(__name__)
        
        # Debug: Check API key loading
        if self.api_key:
            self.logger.info(f"Tavily API key loaded: {self.api_key[:10]}...")
        else:
            self.logger.error("Tavily API key not loaded from settings")
        
        # Cost tracking
        self.cost_per_search = {
            'basic': 0.005,      # Basic search
            'advanced': 0.008,   # Advanced search with more results
            'extract': 0.003     # Content extraction
        }
    
    async def fetch_company_profile(
        self, 
        company_name: str, 
        website: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch comprehensive company profile using optimized search strategy.
        Returns structured data with confidence scores.
        """
        
        try:
            # Strategy: Use targeted search with specific domains for higher quality
            query = self._build_company_profile_query(company_name, website)
            
            search_params = {
                "query": query,
                "search_depth": "basic",
                "include_domains": [
                    "crunchbase.com", 
                    "linkedin.com", 
                    "pitchbook.com",
                    "bloomberg.com"
                ],
                "exclude_domains": [
                    "wikipedia.org",  # Often outdated
                    "reddit.com",     # Unreliable for factual data
                    "twitter.com"     # Too brief/fragmented
                ],
                "max_results": 5,  # Limit results to control cost
                "include_answer": True,
                "include_raw_content": False  # Reduce response size
            }
            
            response = await self._make_api_request("search", search_params)
            
            if not response or 'results' not in response:
                return self._empty_profile_response("No search results")
            
            # Extract structured data from response
            profile_data = self._extract_company_profile_data(response, company_name)
            
            # Add metadata
            profile_data['_meta'] = {
                'source': 'tavily',
                'query_used': query,
                'results_count': len(response.get('results', [])),
                'extracted_at': datetime.utcnow().isoformat(),
                'cost_estimate': self.cost_per_search['basic']
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
        Fetch detailed funding history and investor information.
        Uses advanced search for more comprehensive results.
        """
        
        try:
            query = f"{company_name} funding history investors Series A B C seed venture capital"
            
            search_params = {
                "query": query,
                "search_depth": "advanced",
                "include_domains": [
                    "crunchbase.com",
                    "techcrunch.com", 
                    "venturebeat.com",
                    "pitchbook.com",
                    "bloomberg.com"
                ],
                "max_results": 8,
                "include_answer": True,
                "include_raw_content": True  # Need full content for funding extraction
            }
            
            response = await self._make_api_request("search", search_params)
            
            if not response or 'results' not in response:
                return self._empty_funding_response("No funding data found")
            
            funding_data = self._extract_funding_data(response, company_name)
            
            funding_data['_meta'] = {
                'source': 'tavily',
                'query_used': query,
                'results_count': len(response.get('results', [])),
                'extracted_at': datetime.utcnow().isoformat(),
                'cost_estimate': self.cost_per_search['advanced']
            }
            
            return funding_data
            
        except Exception as e:
            self.logger.error(f"Failed to fetch funding data for {company_name}: {str(e)}")
            return self._empty_funding_response(f"API Error: {str(e)}")
    
    async def fetch_company_team(
        self, 
        company_name: str
    ) -> Dict[str, Any]:
        """
        Fetch team and leadership information.
        Focuses on founders and key executives.
        """
        
        try:
            query = f"{company_name} founders CEO CTO team leadership executives"
            
            search_params = {
                "query": query,
                "search_depth": "basic",
                "include_domains": [
                    "linkedin.com",
                    "crunchbase.com",
                    "bloomberg.com"
                ],
                "max_results": 5,
                "include_answer": True,
                "include_raw_content": True
            }
            
            response = await self._make_api_request("search", search_params)
            
            if not response or 'results' not in response:
                return self._empty_team_response("No team data found")
            
            team_data = self._extract_team_data(response, company_name)
            
            team_data['_meta'] = {
                'source': 'tavily',
                'query_used': query,
                'results_count': len(response.get('results', [])),
                'extracted_at': datetime.utcnow().isoformat(),
                'cost_estimate': self.cost_per_search['basic']
            }
            
            return team_data
            
        except Exception as e:
            self.logger.error(f"Failed to fetch team data for {company_name}: {str(e)}")
            return self._empty_team_response(f"API Error: {str(e)}")
    
    async def fetch_market_intelligence(
        self,
        company_name: str,
        intelligence_type: str = "general"  # 'news', 'sentiment', 'competition'
    ) -> Dict[str, Any]:
        """
        Fetch market intelligence and recent news.
        Uses advanced search for comprehensive coverage.
        """
        
        try:
            if intelligence_type == "news":
                query = f"{company_name} news recent updates announcements 2024 2025"
                domains = ["techcrunch.com", "bloomberg.com", "coindesk.com", "venturebeat.com"]
            elif intelligence_type == "competition":
                query = f"{company_name} competitors competitive analysis market position"
                domains = ["crunchbase.com", "bloomberg.com", "techcrunch.com"]
            else:  # general
                query = f"{company_name} market analysis business overview recent developments"
                domains = ["bloomberg.com", "techcrunch.com", "venturebeat.com"]
            
            search_params = {
                "query": query,
                "search_depth": "advanced",
                "include_domains": domains,
                "max_results": 10,
                "include_answer": True,
                "include_raw_content": True
            }
            
            response = await self._make_api_request("search", search_params)
            
            if not response or 'results' not in response:
                return self._empty_intelligence_response("No market intelligence found")
            
            intelligence_data = self._extract_market_intelligence(response, company_name, intelligence_type)
            
            intelligence_data['_meta'] = {
                'source': 'tavily',
                'intelligence_type': intelligence_type,
                'query_used': query,
                'results_count': len(response.get('results', [])),
                'extracted_at': datetime.utcnow().isoformat(),
                'cost_estimate': self.cost_per_search['advanced']
            }
            
            return intelligence_data
            
        except Exception as e:
            self.logger.error(f"Failed to fetch market intelligence for {company_name}: {str(e)}")
            return self._empty_intelligence_response(f"API Error: {str(e)}")
    
    def _build_company_profile_query(self, company_name: str, website: Optional[str] = None) -> str:
        """Build optimized search query for company profiles."""
        base_query = f"{company_name} company profile"
        
        # Add website domain for more targeted search
        if website:
            domain = website.replace('https://', '').replace('http://', '').replace('www.', '')
            base_query += f" site:{domain.split('/')[0]}"
        
        # Add key profile elements
        base_query += " founded headquarters team size description"
        
        return base_query
    
    async def _make_api_request(self, endpoint: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Make API request to Tavily with error handling and rate limiting."""
        
        if not self.api_key:
            self.logger.error("Tavily API key not configured")
            raise ValueError("Tavily API key not configured")
        
        headers = {
            "Content-Type": "application/json"
        }
        
        payload = {
            "api_key": self.api_key,
            **params
        }
        
        self.logger.info(f"Making Tavily API request to {endpoint} with query: {params.get('query', 'No query')}")
        
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
                async with session.post(
                    f"{self.base_url}/{endpoint}",
                    headers=headers,
                    json=payload
                ) as response:
                    
                    response_text = await response.text()
                    self.logger.info(f"Tavily API response status: {response.status}")
                    self.logger.info(f"Tavily API response body: {response_text[:500]}")
                    
                    if response.status == 200:
                        try:
                            response_json = await response.json()
                            self.logger.info(f"Tavily API JSON response keys: {list(response_json.keys()) if response_json else 'None'}")
                            return response_json
                        except Exception as json_error:
                            self.logger.error(f"Failed to parse Tavily API JSON response: {json_error}")
                            return None
                    elif response.status == 429:
                        # Rate limit hit
                        self.logger.warning("Tavily API rate limit hit")
                        await asyncio.sleep(2)  # Wait before retry
                        return None
                    else:
                        self.logger.error(f"Tavily API error {response.status}: {response_text}")
                        return None
                        
        except asyncio.TimeoutError:
            self.logger.error("Tavily API request timeout")
            return None
        except Exception as e:
            self.logger.error(f"Tavily API request failed: {str(e)}")
            return None
    
    def _extract_company_profile_data(self, response: Dict[str, Any], company_name: str) -> Dict[str, Any]:
        """Extract structured company profile data from Tavily response."""
        
        profile_data = {
            'company_name': company_name,
            'description': None,
            'founded_year': None,
            'headquarters': None,
            'employee_count': None,
            'website': None,
            'industry': None,
            'confidence_score': 0.0
        }
        
        # Combine all content from results
        all_content = ""
        if response.get('answer'):
            all_content += response['answer'] + " "
        
        for result in response.get('results', []):
            if result.get('content'):
                all_content += result['content'] + " "
        
        # Extract founded year
        year_patterns = [
            r'founded in (\d{4})',
            r'established in (\d{4})',
            r'started in (\d{4})',
            r'launched in (\d{4})'
        ]
        
        for pattern in year_patterns:
            match = re.search(pattern, all_content, re.IGNORECASE)
            if match:
                year = int(match.group(1))
                if 1800 <= year <= datetime.now().year:
                    profile_data['founded_year'] = year
                    profile_data['confidence_score'] += 0.2
                    break
        
        # Extract headquarters
        hq_patterns = [
            r'headquartered in ([^,\.\n]+(?:,\s*[A-Z]{2,})?)',
            r'based in ([^,\.\n]+(?:,\s*[A-Z]{2,})?)',
            r'located in ([^,\.\n]+(?:,\s*[A-Z]{2,})?)'
        ]
        
        for pattern in hq_patterns:
            match = re.search(pattern, all_content, re.IGNORECASE)
            if match:
                hq = match.group(1).strip()
                if len(hq) < 50:  # Reasonable HQ length
                    profile_data['headquarters'] = hq
                    profile_data['confidence_score'] += 0.2
                    break
        
        # Extract employee count
        emp_patterns = [
            r'(\d+[\+\-~]?)\s*employees',
            r'team of (\d+)',
            r'workforce of (\d+)',
            r'(\d+)\s*people'
        ]
        
        for pattern in emp_patterns:
            match = re.search(pattern, all_content, re.IGNORECASE)
            if match:
                emp_count = match.group(1)
                profile_data['employee_count'] = emp_count
                profile_data['confidence_score'] += 0.15
                break
        
        # Extract description (use Tavily's answer if available)
        if response.get('answer'):
            # Clean and truncate answer for description
            description = response['answer'].strip()
            if len(description) > 500:
                description = description[:497] + "..."
            profile_data['description'] = description
            profile_data['confidence_score'] += 0.3
        
        # Extract website from results
        for result in response.get('results', []):
            url = result.get('url', '')
            # Try to identify the main company website
            if any(keyword in url.lower() for keyword in [company_name.lower().replace(' ', ''), 'www.']):
                profile_data['website'] = url
                profile_data['confidence_score'] += 0.1
                break
        
        return profile_data
    
    def _extract_funding_data(self, response: Dict[str, Any], company_name: str) -> Dict[str, Any]:
        """Extract funding and investment data from Tavily response."""
        
        funding_data = {
            'company_name': company_name,
            'total_funding': None,
            'funding_rounds': [],
            'investors': [],
            'last_round': None,
            'confidence_score': 0.0
        }
        
        # Combine content for analysis
        all_content = ""
        if response.get('answer'):
            all_content += response['answer'] + " "
        
        for result in response.get('results', []):
            if result.get('content'):
                all_content += result['content'] + " "
        
        # Extract funding amounts
        amount_patterns = [
            r'\$(\d+(?:\.\d+)?)\s*([Bb]illion)',
            r'\$(\d+(?:\.\d+)?)\s*([Mm]illion)',
            r'\$(\d+(?:\.\d+)?)\s*([Kk])'
        ]
        
        amounts = []
        for pattern in amount_patterns:
            matches = re.findall(pattern, all_content)
            for amount, unit in matches:
                amount_val = float(amount)
                if unit.lower().startswith('b'):
                    amount_val *= 1000000000
                elif unit.lower().startswith('m'):
                    amount_val *= 1000000
                elif unit.lower().startswith('k'):
                    amount_val *= 1000
                amounts.append(amount_val)
        
        if amounts:
            funding_data['total_funding'] = sum(amounts)
            funding_data['last_round'] = {
                'amount': max(amounts),
                'type': 'Unknown'
            }
            funding_data['confidence_score'] += 0.3
        
        # Extract round types
        round_patterns = [
            r'(Series [A-E])',
            r'(Seed round)',
            r'(Pre-seed)',
            r'(IPO)'
        ]
        
        rounds = []
        for pattern in round_patterns:
            matches = re.findall(pattern, all_content, re.IGNORECASE)
            rounds.extend(matches)
        
        if rounds:
            funding_data['funding_rounds'] = list(set(rounds))
            funding_data['confidence_score'] += 0.2
        
        # Extract investors
        investor_patterns = [
            r'led by ([^,\.\n]+)',
            r'investors include ([^,\.\n]+)',
            r'backed by ([^,\.\n]+)',
            r'funding from ([^,\.\n]+)'
        ]
        
        investors = []
        for pattern in investor_patterns:
            matches = re.findall(pattern, all_content, re.IGNORECASE)
            for match in matches:
                # Split by common separators and clean
                investor_names = re.split(r',| and | & ', match)
                for name in investor_names:
                    name = name.strip()
                    if len(name) > 3 and len(name) < 50:  # Reasonable investor name length
                        investors.append(name)
        
        if investors:
            funding_data['investors'] = list(set(investors))[:10]  # Limit to top 10
            funding_data['confidence_score'] += 0.2
        
        return funding_data
    
    def _extract_team_data(self, response: Dict[str, Any], company_name: str) -> Dict[str, Any]:
        """Extract team and leadership information."""
        
        team_data = {
            'company_name': company_name,
            'founders': [],
            'executives': [],
            'team_size': None,
            'confidence_score': 0.0
        }
        
        all_content = ""
        if response.get('answer'):
            all_content += response['answer'] + " "
        
        for result in response.get('results', []):
            if result.get('content'):
                all_content += result['content'] + " "
        
        # Extract founders
        founder_patterns = [
            r'founded by ([^,\.\n]+)',
            r'co-founded by ([^,\.\n]+)',
            r'founder[s]?:?\s*([^,\.\n]+)'
        ]
        
        founders = []
        for pattern in founder_patterns:
            matches = re.findall(pattern, all_content, re.IGNORECASE)
            for match in matches:
                # Split multiple founders
                founder_names = re.split(r',| and | & ', match)
                for name in founder_names:
                    name = name.strip()
                    if len(name) > 3 and len(name) < 40:
                        founders.append(name)
        
        if founders:
            team_data['founders'] = list(set(founders))[:5]  # Limit to 5 founders
            team_data['confidence_score'] += 0.4
        
        # Extract executives (CEO, CTO, etc.)
        exec_patterns = [
            r'CEO:?\s*([^,\.\n]+)',
            r'CTO:?\s*([^,\.\n]+)',
            r'Chief Executive Officer:?\s*([^,\.\n]+)',
            r'Chief Technology Officer:?\s*([^,\.\n]+)'
        ]
        
        executives = []
        for pattern in exec_patterns:
            matches = re.findall(pattern, all_content, re.IGNORECASE)
            for match in matches:
                name = match.strip()
                if len(name) > 3 and len(name) < 40:
                    executives.append(name)
        
        if executives:
            team_data['executives'] = list(set(executives))[:5]
            team_data['confidence_score'] += 0.3
        
        return team_data
    
    def _extract_market_intelligence(
        self, 
        response: Dict[str, Any], 
        company_name: str, 
        intelligence_type: str
    ) -> Dict[str, Any]:
        """Extract market intelligence and news data."""
        
        intelligence_data = {
            'company_name': company_name,
            'intelligence_type': intelligence_type,
            'articles': [],
            'summary': None,
            'sentiment': 'neutral',
            'confidence_score': 0.0
        }
        
        # Process each result as a separate article
        for result in response.get('results', []):
            article = {
                'title': result.get('title', ''),
                'url': result.get('url', ''),
                'content': result.get('content', '')[:500],  # Truncate for storage
                'published_date': result.get('published_date'),
                'source': self._extract_domain(result.get('url', ''))
            }
            intelligence_data['articles'].append(article)
        
        # Use Tavily's answer as summary if available
        if response.get('answer'):
            intelligence_data['summary'] = response['answer']
            intelligence_data['confidence_score'] += 0.3
        
        # Simple sentiment analysis based on keywords
        all_text = (response.get('answer', '') + " " + 
                   " ".join(r.get('content', '') for r in response.get('results', [])))
        
        positive_keywords = ['growth', 'success', 'expansion', 'funding', 'partnership', 'innovation']
        negative_keywords = ['loss', 'decline', 'layoffs', 'bankruptcy', 'investigation', 'lawsuit']
        
        positive_count = sum(1 for word in positive_keywords if word in all_text.lower())
        negative_count = sum(1 for word in negative_keywords if word in all_text.lower())
        
        if positive_count > negative_count:
            intelligence_data['sentiment'] = 'positive'
        elif negative_count > positive_count:
            intelligence_data['sentiment'] = 'negative'
        
        if len(intelligence_data['articles']) > 0:
            intelligence_data['confidence_score'] += 0.4
        
        return intelligence_data
    
    def _extract_domain(self, url: str) -> str:
        """Extract domain name from URL."""
        try:
            from urllib.parse import urlparse
            return urlparse(url).netloc.replace('www.', '')
        except:
            return url
    
    def _empty_profile_response(self, error_msg: str) -> Dict[str, Any]:
        """Return empty profile response with error info."""
        return {
            'company_name': '',
            'description': None,
            'founded_year': None, 
            'headquarters': None,
            'employee_count': None,
            'website': None,
            'industry': None,
            'confidence_score': 0.0,
            'error': error_msg
        }
    
    def _empty_funding_response(self, error_msg: str) -> Dict[str, Any]:
        """Return empty funding response with error info."""
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
        """Return empty team response with error info."""
        return {
            'company_name': '',
            'founders': [],
            'executives': [],
            'team_size': None,
            'confidence_score': 0.0,
            'error': error_msg
        }
    
    def _empty_intelligence_response(self, error_msg: str) -> Dict[str, Any]:
        """Return empty intelligence response with error info."""
        return {
            'company_name': '',
            'intelligence_type': 'general',
            'articles': [],
            'summary': None,
            'sentiment': 'neutral',
            'confidence_score': 0.0,
            'error': error_msg
        }