# CoinGecko Service for RedpillAI Backend
# Enhanced crypto token detection and analysis

from typing import Dict, List, Optional, Any
import requests
import asyncio
from datetime import datetime
from ..config import settings


class CoinGeckoService:
    """
    CoinGecko API service for comprehensive crypto token data
    Provides better token detection and detailed metrics than OpenBB alone
    """
    
    def __init__(self):
        self.api_key = settings.coingecko_api_key
        self.base_url = "https://api.coingecko.com/api/v3"
        self.session = requests.Session()
        
        # Set up headers
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'RedpillAI/1.0'
        }
        
        # Only add API key if it's actually configured (not placeholder)
        if self.api_key and self.api_key != 'your_coingecko_api_key_here':
            headers['x-cg-demo-api-key'] = self.api_key
            
        self.session.headers.update(headers)
        
        # Common token mappings for better company-to-token detection
        self.company_token_mapping = {
            'chainlink': 'chainlink',
            'chainlink labs': 'chainlink', 
            'uniswap': 'uniswap',
            'uniswap labs': 'uniswap',
            'solana': 'solana',
            'solana labs': 'solana',
            'solana foundation': 'solana',
            'ethereum': 'ethereum',
            'ethereum foundation': 'ethereum',
            'bitcoin': 'bitcoin',
            'aave': 'aave',
            'compound': 'compound',
            'makerdao': 'maker',
            'polygon': 'matic-network',
            'polygon technology': 'matic-network',
            'avalanche': 'avalanche-2',
            'ava labs': 'avalanche-2',
            'fantom': 'fantom',
            'fantom foundation': 'fantom',
            'near': 'near',
            'near protocol': 'near',
            'the graph': 'the-graph',
            'graph protocol': 'the-graph',
            'cosmos': 'cosmos',
            'cosmos network': 'cosmos',
            'polkadot': 'polkadot',
            'web3 foundation': 'polkadot',
            'algorand': 'algorand',
            'algorand foundation': 'algorand',
            'cardano': 'cardano',
            'iohk': 'cardano',
            'input output': 'cardano'
        }

    def _make_request(self, endpoint: str, params: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """Make API request with error handling"""
        try:
            url = f"{self.base_url}{endpoint}"
            
            if params and self.api_key and self.api_key != 'your_coingecko_api_key_here':
                params['x_cg_demo_api_key'] = self.api_key
                
            response = self.session.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:  # Rate limit
                print(f"⚠️ CoinGecko rate limit hit. Consider upgrading API plan.")
                return None
            else:
                print(f"⚠️ CoinGecko API error: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"⚠️ CoinGecko request failed: {e}")
            return None

    def search_token_by_company(self, company_name: str, company_domain: str = None) -> Optional[Dict[str, Any]]:
        """
        Enhanced token detection using company name and domain
        """
        if not company_name:
            return None
            
        company_lower = company_name.lower().strip()
        
        # First, try direct mapping
        if company_lower in self.company_token_mapping:
            token_id = self.company_token_mapping[company_lower]
            return self.get_token_data(token_id)
        
        # Try searching with company name
        search_results = self._make_request('/search', {'query': company_name})
        
        if search_results and 'coins' in search_results:
            coins = search_results['coins']
            
            # Look for exact matches first
            for coin in coins:
                coin_name_lower = coin.get('name', '').lower()
                coin_symbol_lower = coin.get('symbol', '').lower()
                
                # Exact name match
                if coin_name_lower == company_lower:
                    return self.get_token_data(coin['id'])
                
                # Company name contains coin name or vice versa
                if (company_lower in coin_name_lower or 
                    coin_name_lower in company_lower):
                    return self.get_token_data(coin['id'])
            
            # If no exact match, try first result if it's close
            if coins and len(coins) > 0:
                first_coin = coins[0]
                # Only return if it's a reasonable match
                if (company_lower[:4] in first_coin.get('name', '').lower() or
                    first_coin.get('name', '').lower()[:4] in company_lower):
                    return self.get_token_data(first_coin['id'])
        
        # Try domain-based search if available
        if company_domain:
            domain_search = company_domain.split('.')[0]  # Get domain without TLD
            domain_results = self._make_request('/search', {'query': domain_search})
            
            if domain_results and 'coins' in domain_results:
                coins = domain_results['coins']
                if coins:
                    return self.get_token_data(coins[0]['id'])
        
        return None

    def get_token_data(self, token_id: str) -> Optional[Dict[str, Any]]:
        """Get comprehensive token data for VC analysis"""
        try:
            # Get basic market data
            market_data = self._make_request('/coins/markets', {
                'ids': token_id,
                'vs_currency': 'usd',
                'order': 'market_cap_desc',
                'per_page': '1',
                'page': '1',
                'sparkline': 'false',
                'price_change_percentage': '24h,7d,30d'
            })
            
            if not market_data or len(market_data) == 0:
                return None
                
            token_market = market_data[0]
            
            # Get detailed info
            detailed_info = self._make_request(f'/coins/{token_id}', {
                'localization': 'false',
                'tickers': 'false',
                'market_data': 'true',
                'community_data': 'true',
                'developer_data': 'true',
                'sparkline': 'false'
            })
            
            # Combine market and detailed data
            token_data = {
                'id': token_id,
                'symbol': token_market.get('symbol', '').upper(),
                'name': token_market.get('name', ''),
                'current_price': token_market.get('current_price', 0),
                'market_cap': token_market.get('market_cap', 0),
                'market_cap_rank': token_market.get('market_cap_rank', 0),
                'volume_24h': token_market.get('total_volume', 0),
                'price_change_24h': token_market.get('price_change_percentage_24h', 0),
                'price_change_7d': token_market.get('price_change_percentage_7d_in_currency', 0),
                'price_change_30d': token_market.get('price_change_percentage_30d_in_currency', 0),
                'circulating_supply': token_market.get('circulating_supply', 0),
                'total_supply': token_market.get('total_supply', 0),
                'max_supply': token_market.get('max_supply', 0),
                'ath': token_market.get('ath', 0),
                'ath_change_percentage': token_market.get('ath_change_percentage', 0),
                'last_updated': token_market.get('last_updated', datetime.now().isoformat())
            }
            
            # Add detailed info if available
            if detailed_info:
                token_data.update({
                    'description': detailed_info.get('description', {}).get('en', '')[:500],  # Limit description
                    'homepage': detailed_info.get('links', {}).get('homepage', []),
                    'community_data': {
                        'twitter_followers': detailed_info.get('community_data', {}).get('twitter_followers', 0),
                        'reddit_subscribers': detailed_info.get('community_data', {}).get('reddit_subscribers', 0),
                        'telegram_channel_user_count': detailed_info.get('community_data', {}).get('telegram_channel_user_count', 0)
                    },
                    'developer_data': {
                        'stars': detailed_info.get('developer_data', {}).get('stars', 0),
                        'forks': detailed_info.get('developer_data', {}).get('forks', 0),
                        'commit_count_4_weeks': detailed_info.get('developer_data', {}).get('commit_count_4_weeks', 0)
                    }
                })
            
            return token_data
            
        except Exception as e:
            print(f"Error getting token data for {token_id}: {e}")
            return None

    def format_for_enrichment(self, token_data: Dict[str, Any]) -> Dict[str, Any]:
        """Format token data for company enrichment"""
        if not token_data:
            return {}
            
        market_cap_category = self._get_market_cap_category(token_data.get('market_cap', 0))
        
        return {
            'symbol': token_data.get('symbol'),
            'name': token_data.get('name'),
            'current_price': token_data.get('current_price', 0),
            'market_cap': token_data.get('market_cap', 0),
            'market_cap_rank': token_data.get('market_cap_rank', 0),
            'volume_24h': token_data.get('volume_24h', 0),
            'price_change_24h': token_data.get('price_change_24h', 0),
            'market_cap_category': market_cap_category,
            'last_updated': token_data.get('last_updated'),
            'data_source': 'coingecko',
            'description': token_data.get('description', ''),
            'community_score': self._calculate_community_score(token_data),
            'development_score': self._calculate_development_score(token_data)
        }

    def _get_market_cap_category(self, market_cap: float) -> str:
        """Categorize token by market cap for VC analysis"""
        if market_cap > 10_000_000_000:  # >$10B
            return 'Large Cap'
        elif market_cap > 1_000_000_000:  # $1B-$10B
            return 'Mid Cap'
        elif market_cap > 100_000_000:  # $100M-$1B
            return 'Small Cap'
        elif market_cap > 10_000_000:  # $10M-$100M
            return 'Micro Cap'
        else:
            return 'Nano Cap'

    def _calculate_community_score(self, token_data: Dict[str, Any]) -> int:
        """Calculate community engagement score (0-100)"""
        try:
            community = token_data.get('community_data', {})
            
            twitter = min(community.get('twitter_followers', 0) / 100000, 10) * 4  # Max 40 points
            reddit = min(community.get('reddit_subscribers', 0) / 50000, 10) * 3   # Max 30 points  
            telegram = min(community.get('telegram_channel_user_count', 0) / 25000, 10) * 3  # Max 30 points
            
            return min(int(twitter + reddit + telegram), 100)
        except:
            return 0

    def _calculate_development_score(self, token_data: Dict[str, Any]) -> int:
        """Calculate development activity score (0-100)"""
        try:
            dev = token_data.get('developer_data', {})
            
            stars = min(dev.get('stars', 0) / 1000, 10) * 3        # Max 30 points
            commits = min(dev.get('commit_count_4_weeks', 0) / 50, 10) * 5  # Max 50 points
            forks = min(dev.get('forks', 0) / 500, 10) * 2        # Max 20 points
            
            return min(int(stars + commits + forks), 100)
        except:
            return 0

    def test_connection(self) -> Dict[str, Any]:
        """Test CoinGecko API connection"""
        try:
            # Simple ping test
            ping = self._make_request('/ping')
            
            if ping and ping.get('gecko_says') == '(V3) To the Moon!':
                # Test search functionality
                search_test = self._make_request('/search', {'query': 'bitcoin'})
                
                return {
                    'coingecko_available': True,
                    'api_key_configured': bool(self.api_key),
                    'search_working': bool(search_test and 'coins' in search_test),
                    'test_results': f"Found {len(search_test.get('coins', []))} coins in search test" if search_test else "Search test failed"
                }
            else:
                return {
                    'coingecko_available': False,
                    'error': 'Ping test failed'
                }
                
        except Exception as e:
            return {
                'coingecko_available': False,
                'error': str(e)
            }


# Singleton instance
coingecko_service = CoinGeckoService()