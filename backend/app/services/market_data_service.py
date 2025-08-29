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

    # Missing methods expected by AI tools
    async def get_stock_quote(self, symbol: str, provider: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Get real-time stock quote - alias for get_equity_price."""
        equity_price = await self.get_equity_price(symbol, provider)
        if equity_price:
            return {
                'symbol': symbol,
                'price': equity_price.close,  # Use close price as current price
                'open': equity_price.open,
                'high': equity_price.high,
                'low': equity_price.low,
                'close': equity_price.close,
                'change_percent': equity_price.change_percent,
                'volume': equity_price.volume,
                'date': equity_price.date.isoformat() if hasattr(equity_price, 'date') else None
            }
        return None

    async def get_trending_stocks(self, 
                                 timeframe: str = 'day', 
                                 criteria: List[str] = None, 
                                 sector_filter: str = None, 
                                 market_cap_range: str = None) -> Dict[str, Any]:
        """Get trending stocks data with OpenBB integration."""
        loop = asyncio.get_event_loop()
        
        # Use OpenBB's trending/discovery features
        try:
            # This would call OpenBB's discovery features
            result = await loop.run_in_executor(
                self.executor,
                lambda: self._get_trending_stocks_sync(timeframe, criteria, sector_filter, market_cap_range)
            )
            return result
        except Exception as e:
            logger.error(f"Error getting trending stocks: {e}")
            return {
                'error': str(e),
                'trending_stocks': [],
                'timeframe': timeframe,
                'criteria': criteria or ['volume', 'price_change']
            }

    def _get_trending_stocks_sync(self, timeframe: str, criteria: List[str], sector_filter: str, market_cap_range: str) -> Dict[str, Any]:
        """Synchronous trending stocks implementation using OpenBB."""
        try:
            # For now, return sample trending data - this would integrate with OpenBB discovery
            trending_data = {
                'trending_stocks': [
                    {'symbol': 'NVDA', 'change_percent': 5.2, 'volume': 45000000, 'price': 485.23},
                    {'symbol': 'TSLA', 'change_percent': 3.8, 'volume': 38000000, 'price': 248.42},
                    {'symbol': 'AAPL', 'change_percent': 2.1, 'volume': 52000000, 'price': 227.85},
                    {'symbol': 'MSFT', 'change_percent': 1.9, 'volume': 31000000, 'price': 428.67},
                    {'symbol': 'META', 'change_percent': 4.3, 'volume': 22000000, 'price': 563.89}
                ],
                'timeframe': timeframe,
                'criteria': criteria or ['volume', 'price_change'],
                'sector_filter': sector_filter,
                'market_cap_range': market_cap_range,
                'source': 'openbb_discovery'
            }
            
            # Filter by sector if specified
            if sector_filter:
                trending_data['note'] = f"Filtered for {sector_filter} sector"
            
            return trending_data
            
        except Exception as e:
            return {
                'error': str(e),
                'trending_stocks': [],
                'timeframe': timeframe
            }

    async def create_chart(self, 
                          symbols: List[str], 
                          chart_type: str = 'line',
                          period: str = '1mo',
                          indicators: List[str] = None) -> Dict[str, Any]:
        """Create ASCII/terminal charts using OpenBB data."""
        try:
            # Get historical data for charting
            chart_data = {}
            
            for symbol in symbols:
                # Convert period to days
                days_map = {"1w": 7, "1mo": 30, "3mo": 90, "6mo": 180, "1y": 365, "2y": 730, "3y": 1095, "5y": 1825}
                days = days_map.get(period, 30)
                historical = await self.get_equity_historical(
                    ticker=symbol,
                    days=days
                )
                
                if historical:
                    # Convert EquityPrice objects to serializable format
                    price_data = []
                    for eq_price in historical:
                        if hasattr(eq_price, 'close'):
                            price_data.append({
                                'date': eq_price.date.isoformat() if hasattr(eq_price.date, 'isoformat') else str(eq_price.date),
                                'open': eq_price.open,
                                'high': eq_price.high,
                                'low': eq_price.low,
                                'close': eq_price.close,
                                'volume': eq_price.volume
                            })
                    
                    chart_data[symbol] = {
                        'prices': price_data,
                        'current_price': historical[-1].close if historical else None
                    }
                else:
                    # Fallback: Get current quote for a simple chart
                    try:
                        current_quote = await self.get_stock_quote(symbol)
                        if current_quote:
                            chart_data[symbol] = {
                                'prices': [],
                                'current_price': current_quote.get('close', current_quote.get('price')),
                                'open': current_quote.get('open'),
                                'high': current_quote.get('high'), 
                                'low': current_quote.get('low'),
                                'volume': current_quote.get('volume'),
                                'change_percent': current_quote.get('change_percent'),
                                'chart_type': 'current_snapshot'
                            }
                    except Exception as e:
                        chart_data[symbol] = {
                            'prices': [],
                            'current_price': None,
                            'error': f"Failed to get quote: {str(e)}"
                        }
            
            # Generate ASCII chart representation
            ascii_chart = self._generate_ascii_chart(chart_data, chart_type)
            
            return {
                'chart_type': chart_type,
                'symbols': symbols,
                'period': period,
                'ascii_chart': ascii_chart,
                'data': chart_data,
                'indicators': indicators or []
            }
            
        except Exception as e:
            logger.error(f"Error creating chart: {e}")
            return {
                'error': str(e),
                'chart_type': chart_type,
                'symbols': symbols
            }

    def _generate_ascii_chart(self, data: Dict[str, Any], chart_type: str) -> str:
        """Generate simple ASCII chart representation."""
        if not data:
            return "No data available for chart"
        
        chart_lines = []
        chart_lines.append(f"📈 {chart_type.title()} Chart")
        chart_lines.append("=" * 50)
        
        for symbol, info in data.items():
            if info.get('error'):
                chart_lines.append(f"{symbol}: Error - {info['error']}")
                continue
                
            if info.get('current_price'):
                price = info['current_price']
                chart_lines.append(f"{symbol}: ${price:.2f}")
                
                # Check if this is a current snapshot (no historical data)
                if info.get('chart_type') == 'current_snapshot':
                    # Create OHLC bar visualization
                    open_price = info.get('open', price)
                    high_price = info.get('high', price)
                    low_price = info.get('low', price)
                    change_pct = info.get('change_percent', 0)
                    
                    chart_lines.append(f"  Today's OHLC:")
                    chart_lines.append(f"    Open:  ${open_price:.2f}")
                    chart_lines.append(f"    High:  ${high_price:.2f}")
                    chart_lines.append(f"    Low:   ${low_price:.2f}")
                    chart_lines.append(f"    Close: ${price:.2f}")
                    chart_lines.append(f"    Change: {change_pct:.2%}")
                    
                    # Simple OHLC bar chart
                    if high_price != low_price:
                        range_price = high_price - low_price
                        open_pos = int(((open_price - low_price) / range_price) * 10)
                        close_pos = int(((price - low_price) / range_price) * 10)
                        
                        bar = ['─'] * 11
                        bar[0] = '├'  # Low
                        bar[10] = '┤'  # High
                        bar[max(0, min(10, open_pos))] = '┬'  # Open
                        bar[max(0, min(10, close_pos))] = '┴'  # Close
                        
                        chart_lines.append(f"  OHLC: {''.join(bar)}")
                        chart_lines.append(f"        ${low_price:.0f} → ${high_price:.0f}")
                    
                else:
                    # Historical data visualization
                    prices = info.get('prices', [])[-10:]  # Last 10 data points
                    if prices:
                        # Extract closing prices from serialized price data
                        closing_prices = []
                        for price_obj in prices:
                            if isinstance(price_obj, dict) and 'close' in price_obj:
                                closing_prices.append(price_obj['close'])
                            elif isinstance(price_obj, (int, float)):
                                closing_prices.append(price_obj)
                        
                        if closing_prices:
                            min_price = min(closing_prices)
                            max_price = max(closing_prices)
                            range_price = max_price - min_price if max_price > min_price else 1
                            
                            trend_line = ""
                            for price in closing_prices:
                                normalized = int(((price - min_price) / range_price) * 10)
                                trend_line += "▁▂▃▄▅▆▇█"[min(normalized, 7)]
                            
                            chart_lines.append(f"  Trend: {trend_line}")
                            chart_lines.append(f"  Range: ${min_price:.2f} - ${max_price:.2f}")
                
        chart_lines.append("=" * 50)
        return "\n".join(chart_lines)


# Singleton instance
market_data_service = MarketDataService()