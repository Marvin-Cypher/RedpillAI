"""
MarketDataService - Async-safe market data operations.

Wraps OpenBB and CoinGecko services to provide non-blocking market data access.
"""

import asyncio
import httpx
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

from .openbb_service import openbb_service, MarketData, CryptoPrice, EquityPrice, FundamentalData

logger = logging.getLogger(__name__)


class AsyncCoinGeckoClient:
    """Async-safe CoinGecko API client using httpx."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.base_url = "https://api.coingecko.com/api/v3"
        
        # Headers setup
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'RedpillAI/1.0'
        }
        
        # Only add API key if it's actually configured (not placeholder)
        if self.api_key and self.api_key != 'your_coingecko_api_key_here':
            headers['x-cg-demo-api-key'] = self.api_key
            
        self.http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0),
            headers=headers
        )
        
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
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.http_client.aclose()
    
    async def _make_request(self, endpoint: str, params: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """Make async API request with error handling."""
        try:
            url = f"{self.base_url}{endpoint}"
            
            if params and self.api_key and self.api_key != 'your_coingecko_api_key_here':
                params['x_cg_demo_api_key'] = self.api_key
                
            response = await self.http_client.get(url, params=params)
            
            if response.status_code == 200:
                return await response.json()
            elif response.status_code == 429:  # Rate limit
                logger.warning("CoinGecko rate limit hit. Consider upgrading API plan.")
                return None
            else:
                logger.warning(f"CoinGecko API error: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"CoinGecko request failed: {e}")
            return None
    
    async def get_token_price(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get current token price - method expected by cost_optimized_data_service.
        """
        try:
            # Convert symbol to CoinGecko ID format if needed
            if symbol.upper() in ['BTC', 'BITCOIN']:
                token_id = 'bitcoin'
            elif symbol.upper() in ['ETH', 'ETHEREUM']: 
                token_id = 'ethereum'
            elif symbol.upper() in ['DOT', 'POLKADOT']:
                token_id = 'polkadot'
            else:
                # Try to find via search
                search_results = await self._make_request('/search', {'query': symbol})
                if search_results and 'coins' in search_results and search_results['coins']:
                    token_id = search_results['coins'][0]['id']
                else:
                    return None
            
            # Get current price data
            market_data = await self._make_request('/coins/markets', {
                'ids': token_id,
                'vs_currency': 'usd',
                'order': 'market_cap_desc',
                'per_page': '1',
                'page': '1',
                'sparkline': 'false',
                'price_change_percentage': '24h'
            })
            
            if not market_data or len(market_data) == 0:
                return None
                
            token_market = market_data[0]
            
            return {
                'symbol': token_market.get('symbol', '').upper(),
                'name': token_market.get('name', ''),
                'current_price': token_market.get('current_price', 0),
                'market_cap': token_market.get('market_cap', 0),
                'price_change_24h': token_market.get('price_change_percentage_24h', 0),
                'volume_24h': token_market.get('total_volume', 0),
                'last_updated': token_market.get('last_updated', datetime.now().isoformat())
            }
            
        except Exception as e:
            logger.error(f"Error getting token price for {symbol}: {e}")
            return None
    
    async def search_token_by_company(self, company_name: str, company_domain: str = None) -> Optional[Dict[str, Any]]:
        """Enhanced token detection using company name and domain."""
        if not company_name:
            return None
            
        company_lower = company_name.lower().strip()
        
        # First, try direct mapping
        if company_lower in self.company_token_mapping:
            token_id = self.company_token_mapping[company_lower]
            return await self.get_token_data(token_id)
        
        # Try searching with company name
        search_results = await self._make_request('/search', {'query': company_name})
        
        if search_results and 'coins' in search_results:
            coins = search_results['coins']
            
            # Look for exact matches first
            for coin in coins:
                coin_name_lower = coin.get('name', '').lower()
                coin_symbol_lower = coin.get('symbol', '').lower()
                
                # Exact name match
                if coin_name_lower == company_lower:
                    return await self.get_token_data(coin['id'])
                
                # Company name contains coin name or vice versa
                if (company_lower in coin_name_lower or 
                    coin_name_lower in company_lower):
                    return await self.get_token_data(coin['id'])
            
            # If no exact match, try first result if it's close
            if coins and len(coins) > 0:
                first_coin = coins[0]
                # Only return if it's a reasonable match
                if (company_lower[:4] in first_coin.get('name', '').lower() or
                    first_coin.get('name', '').lower()[:4] in company_lower):
                    return await self.get_token_data(first_coin['id'])
        
        # Try domain-based search if available
        if company_domain:
            domain_search = company_domain.split('.')[0]  # Get domain without TLD
            domain_results = await self._make_request('/search', {'query': domain_search})
            
            if domain_results and 'coins' in domain_results:
                coins = domain_results['coins']
                if coins:
                    return await self.get_token_data(coins[0]['id'])
        
        return None
    
    async def get_token_data(self, token_id: str) -> Optional[Dict[str, Any]]:
        """Get comprehensive token data for VC analysis."""
        try:
            # Get basic market data
            market_data = await self._make_request('/coins/markets', {
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
            detailed_info = await self._make_request(f'/coins/{token_id}', {
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
            logger.error(f"Error getting token data for {token_id}: {e}")
            return None


class MarketDataService:
    """
    Async-safe service for market data operations.
    
    This service coordinates market data from OpenBB and CoinGecko APIs,
    ensuring all operations are non-blocking.
    """
    
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.async_coingecko = None  # Initialized per request
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.executor:
            self.executor.shutdown(wait=True)
    
    # Async wrappers for OpenBB service methods
    async def test_connection(self) -> Dict[str, Any]:
        """Test OpenBB connection in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, openbb_service.test_connection)
    
    async def get_market_overview(self) -> MarketData:
        """Get market overview in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, openbb_service.get_market_overview)
    
    async def get_crypto_price(self, symbol: str, provider: Optional[str] = None) -> Optional[CryptoPrice]:
        """Get crypto price in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor, 
            lambda: openbb_service.get_crypto_price(symbol, provider)
        )
    
    async def get_crypto_historical(
        self, 
        symbol: str, 
        days: int = 30,
        provider: Optional[str] = None
    ) -> List[CryptoPrice]:
        """Get crypto historical data in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            lambda: openbb_service.get_crypto_historical(symbol, days, provider)
        )
    
    async def get_technical_indicators(self, symbol: str, indicator: str = 'sma') -> Dict[str, Any]:
        """Get technical indicators in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            lambda: openbb_service.get_technical_indicators(symbol, indicator)
        )
    
    async def search_crypto_news(self, symbol: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """Get crypto news in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            lambda: openbb_service.search_crypto_news(symbol, limit)
        )
    
    async def get_defi_protocols(self) -> List[Dict[str, Any]]:
        """Get DeFi protocols in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, openbb_service.get_defi_protocols)
    
    async def analyze_portfolio_risk(self, symbols: List[str], weights: List[float]) -> Dict[str, Any]:
        """Analyze portfolio risk in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            lambda: openbb_service.analyze_portfolio_risk(symbols, weights)
        )
    
    async def get_available_providers(self) -> Dict[str, List[str]]:
        """Get available providers in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, openbb_service.get_available_providers)
    
    # Equity methods
    async def get_equity_price(self, ticker: str, provider: Optional[str] = None) -> Optional[EquityPrice]:
        """Get equity price in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            lambda: openbb_service.get_equity_price(ticker, provider)
        )
    
    async def get_equity_historical(
        self, 
        ticker: str, 
        days: int = 252,
        provider: Optional[str] = None
    ) -> List[EquityPrice]:
        """Get equity historical data in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            lambda: openbb_service.get_equity_historical(ticker, days, provider)
        )
    
    async def get_equity_fundamentals(self, ticker: str, provider: Optional[str] = None) -> Optional[FundamentalData]:
        """Get equity fundamentals in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            lambda: openbb_service.get_equity_fundamentals(ticker, provider)
        )
    
    async def compare_equities(self, tickers: List[str], provider: Optional[str] = None) -> Dict[str, Any]:
        """Compare equities in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            lambda: openbb_service.compare_equities(tickers, provider)
        )
    
    async def get_sector_data(self, sector: str, provider: Optional[str] = None) -> Dict[str, Any]:
        """Get sector data in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            lambda: openbb_service.get_sector_data(sector, provider)
        )
    
    async def search_equity_news(self, ticker: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """Get equity news in executor."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.executor,
            lambda: openbb_service.search_equity_news(ticker, limit)
        )
    
    # CoinGecko async methods
    async def get_coingecko_client(self, api_key: Optional[str] = None) -> AsyncCoinGeckoClient:
        """Get async CoinGecko client instance."""
        return AsyncCoinGeckoClient(api_key)
    
    async def get_token_price_coingecko(self, symbol: str, api_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get token price using async CoinGecko client."""
        async with AsyncCoinGeckoClient(api_key) as client:
            return await client.get_token_price(symbol)
    
    async def search_token_by_company(self, company_name: str, company_domain: str = None, api_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Search token by company using async CoinGecko client."""
        async with AsyncCoinGeckoClient(api_key) as client:
            return await client.search_token_by_company(company_name, company_domain)


# Singleton instance
market_data_service = MarketDataService()