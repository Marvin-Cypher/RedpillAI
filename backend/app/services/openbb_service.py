# OpenBB Service for RedpillAI
# This service wraps OpenBB functionality for the RedpillAI backend

from typing import Dict, List, Optional, Any
from datetime import datetime, date
import pandas as pd
import asyncio
import functools
import os
try:
    from openbb import obb
    OPENBB_AVAILABLE = True
except ImportError:
    obb = None
    OPENBB_AVAILABLE = False
from pydantic import BaseModel
from ..config import settings


class CryptoPrice(BaseModel):
    """Crypto price data model"""
    symbol: str
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    change_percent: Optional[float] = None


class MarketData(BaseModel):
    """Market data aggregated model"""
    btc_price: Optional[float] = None
    eth_price: Optional[float] = None
    total_market_cap: Optional[float] = None
    crypto_prices: List[CryptoPrice] = []


class EquityPrice(BaseModel):
    """Equity price data model"""
    symbol: str
    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    change_percent: Optional[float] = None


class FundamentalData(BaseModel):
    """Fundamental data model for equities"""
    symbol: str
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    revenue_ttm: Optional[float] = None
    gross_margin: Optional[float] = None
    profit_margin: Optional[float] = None
    debt_ratio: Optional[float] = None
    price_to_book: Optional[float] = None
    dividend_yield: Optional[float] = None


class OpenBBService:
    """
    OpenBB service wrapper for RedpillAI
    Provides crypto market data, analytics, and research capabilities
    """
    
    def __init__(self):
        self.providers = {
            'crypto': ['yfinance', 'fmp', 'polygon'],  # Fallback order
            'equity': ['yfinance', 'fmp', 'polygon'],
            'news': ['benzinga', 'fmp']
        }
        self._configure_openbb_credentials()
    
    def _configure_openbb_credentials(self):
        """Configure OpenBB with API credentials from settings"""
        try:
            # Set OpenBB credentials if available
            if settings.fmp_api_key:
                obb.user.credentials.fmp_api_key = settings.fmp_api_key
                
            if settings.polygon_api_key:
                obb.user.credentials.polygon_api_key = settings.polygon_api_key
                
            if settings.alpha_vantage_api_key:
                obb.user.credentials.alpha_vantage_api_key = settings.alpha_vantage_api_key
                
            if settings.quandl_api_key:
                obb.user.credentials.quandl_api_key = settings.quandl_api_key
                
            if settings.benzinga_api_key:
                obb.user.credentials.benzinga_api_key = settings.benzinga_api_key
                
            print("✅ OpenBB credentials configured successfully")
            
        except Exception as e:
            print(f"⚠️  OpenBB credential configuration warning: {e}")
            print("💡 Add API keys to .env file for full market data access")
    
    def _run_sync(self, coro):
        """Run async OpenBB functions in sync context"""
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        if loop.is_running():
            # If loop is already running, use run_in_executor
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, coro)
                return future.result()
        else:
            return loop.run_until_complete(coro)
    
    def get_crypto_price(self, symbol: str, provider: Optional[str] = None) -> Optional[CryptoPrice]:
        """
        Get current price for a cryptocurrency
        """
        try:
            # Normalize symbol format (BTC -> BTCUSD)
            if len(symbol) <= 4 and not symbol.endswith('USD'):
                symbol = f"{symbol}USD"
            
            # Try providers in order
            providers_to_try = [provider] if provider else self.providers['crypto']
            
            for prov in providers_to_try:
                try:
                    result = obb.crypto.price.historical(
                        symbol=symbol,
                        provider=prov,
                        interval='1d',
                        limit=1  # Just get latest
                    )
                    
                    if result.results and len(result.results) > 0:
                        data = result.results[-1]  # Get most recent
                        return CryptoPrice(
                            symbol=symbol,
                            date=data.date,
                            open=data.open,
                            high=data.high,
                            low=data.low,
                            close=data.close,
                            volume=data.volume,
                            change_percent=getattr(data, 'change_percent', None)
                        )
                except Exception as e:
                    print(f"Provider {prov} failed for {symbol}: {e}")
                    continue
            
            return None
            
        except Exception as e:
            print(f"Error getting crypto price for {symbol}: {e}")
            return None
    
    def get_crypto_historical(
        self, 
        symbol: str, 
        days: int = 30,
        provider: Optional[str] = None
    ) -> List[CryptoPrice]:
        """
        Get historical price data for cryptocurrency
        """
        try:
            # Normalize symbol
            if len(symbol) <= 4 and not symbol.endswith('USD'):
                symbol = f"{symbol}USD"
            
            providers_to_try = [provider] if provider else self.providers['crypto']
            
            for prov in providers_to_try:
                try:
                    result = obb.crypto.price.historical(
                        symbol=symbol,
                        provider=prov,
                        interval='1d'
                    )
                    
                    if result.results:
                        # Convert to our model
                        prices = []
                        for data in result.results[-days:]:  # Last N days
                            prices.append(CryptoPrice(
                                symbol=symbol,
                                date=data.date,
                                open=data.open,
                                high=data.high,
                                low=data.low,
                                close=data.close,
                                volume=data.volume,
                                change_percent=getattr(data, 'change_percent', None)
                            ))
                        return prices
                        
                except Exception as e:
                    print(f"Provider {prov} failed for historical {symbol}: {e}")
                    continue
            
            return []
            
        except Exception as e:
            print(f"Error getting historical data for {symbol}: {e}")
            return []
    
    def get_market_overview(self) -> MarketData:
        """
        Get overall crypto market data
        """
        market_data = MarketData()
        
        try:
            # Get BTC price
            btc_price = self.get_crypto_price('BTC')
            if btc_price:
                market_data.btc_price = btc_price.close
            
            # Get ETH price
            eth_price = self.get_crypto_price('ETH')
            if eth_price:
                market_data.eth_price = eth_price.close
            
            # Add more major cryptos
            major_cryptos = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT']
            for crypto in major_cryptos:
                price = self.get_crypto_price(crypto)
                if price:
                    market_data.crypto_prices.append(price)
        
        except Exception as e:
            print(f"Error getting market overview: {e}")
        
        return market_data
    
    def search_crypto_news(self, symbol: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """
        Get crypto-related news
        """
        try:
            # Try to use OpenBB news with configured providers
            news_items = []
            
            # Try benzinga first (we have API key)
            try:
                if symbol:
                    result = obb.news.company(symbol=symbol, provider='benzinga', limit=limit)
                else:
                    result = obb.news.world(provider='benzinga', limit=limit)
                
                if result and hasattr(result, 'results') and result.results:
                    for item in result.results[:limit]:
                        news_items.append({
                            'title': str(getattr(item, 'title', getattr(item, 'headline', 'No title'))),
                            'summary': str(getattr(item, 'text', getattr(item, 'summary', getattr(item, 'description', '')))),
                            'source': 'Benzinga',
                            'published_at': str(getattr(item, 'date', getattr(item, 'published', datetime.now()))),
                            'url': str(getattr(item, 'url', getattr(item, 'link', '#'))),
                            'ticker': symbol
                        })
                    return news_items
            except Exception as benzinga_error:
                print(f"Benzinga news error: {benzinga_error}")
            
            # Try FMP as fallback
            try:
                if symbol:
                    result = obb.news.company(symbol=symbol, provider='fmp', limit=limit)
                else:
                    result = obb.news.world(provider='fmp', limit=limit)
                
                if result and hasattr(result, 'results') and result.results:
                    for item in result.results[:limit]:
                        news_items.append({
                            'title': str(getattr(item, 'title', getattr(item, 'headline', 'No title'))),
                            'summary': str(getattr(item, 'text', getattr(item, 'summary', getattr(item, 'description', '')))),
                            'source': 'Financial Modeling Prep',
                            'published_at': str(getattr(item, 'date', getattr(item, 'published', datetime.now()))),
                            'url': str(getattr(item, 'url', getattr(item, 'link', '#'))),
                            'ticker': symbol
                        })
                    return news_items
            except Exception as fmp_error:
                print(f"FMP news error: {fmp_error}")
            
            # If all providers fail, return empty list
            print(f"No news available from any provider for {symbol or 'crypto'}")
            return []
            
        except Exception as e:
            print(f"Error getting crypto news: {e}")
            return []
    
    def analyze_portfolio_risk(self, symbols: List[str], weights: List[float]) -> Dict[str, Any]:
        """
        Analyze portfolio risk using OpenBB analytics
        """
        try:
            # This would use OpenBB's portfolio optimization features
            # For now, return basic analysis structure
            
            return {
                'symbols': symbols,
                'weights': weights,
                'total_value': sum(weights),
                'risk_metrics': {
                    'volatility': 'Not calculated - requires API keys',
                    'sharpe_ratio': 'Not calculated - requires API keys',
                    'max_drawdown': 'Not calculated - requires API keys'
                },
                'analysis_note': 'Full portfolio analysis available with OpenBB API keys'
            }
            
        except Exception as e:
            print(f"Error analyzing portfolio: {e}")
            return {'error': str(e)}
    
    def get_technical_indicators(self, symbol: str, indicator: str = 'sma') -> Dict[str, Any]:
        """
        Calculate technical indicators using OpenBB
        """
        try:
            # Get historical data first
            historical = self.get_crypto_historical(symbol, days=50)
            
            if not historical:
                return {'error': 'No historical data available'}
            
            # Convert to pandas for analysis
            df = pd.DataFrame([{
                'date': h.date,
                'close': h.close,
                'volume': h.volume
            } for h in historical])
            
            # Basic SMA calculation (can be enhanced with OpenBB technical analysis)
            if indicator.lower() == 'sma':
                df['sma_20'] = df['close'].rolling(window=20).mean()
                df['sma_50'] = df['close'].rolling(window=50).mean()
            
            return {
                'symbol': symbol,
                'indicator': indicator,
                'current_price': historical[-1].close if historical else None,
                'analysis': 'Basic technical analysis - enhance with OpenBB TA module',
                'data_points': len(historical)
            }
            
        except Exception as e:
            print(f"Error calculating indicators for {symbol}: {e}")
            return {'error': str(e)}
    
    def get_defi_protocols(self) -> List[Dict[str, Any]]:
        """
        Get DeFi protocol data (placeholder for future OpenBB integration)
        """
        return [
            {
                'name': 'Uniswap',
                'tvl': 'Available via OpenBB DeFi extensions',
                'category': 'DEX',
                'note': 'Full DeFi data available with proper OpenBB configuration'
            },
            {
                'name': 'Aave',
                'tvl': 'Available via OpenBB DeFi extensions', 
                'category': 'Lending',
                'note': 'Full DeFi data available with proper OpenBB configuration'
            }
        ]
    
    def get_available_providers(self) -> Dict[str, List[str]]:
        """
        Get list of available OpenBB providers by category
        """
        return self.providers
    
    def test_connection(self) -> Dict[str, Any]:
        """
        Test OpenBB connection and available features
        """
        try:
            # Test basic functionality
            test_result = {
                'openbb_available': True,
                'providers': self.providers,
                'test_crypto_access': False,
                'test_news_access': False,
                'notes': []
            }
            
            # Test crypto access
            try:
                btc_test = self.get_crypto_price('BTC')
                test_result['test_crypto_access'] = btc_test is not None
                if btc_test:
                    test_result['sample_btc_price'] = btc_test.close
            except Exception as e:
                test_result['notes'].append(f'Crypto access issue: {str(e)}')
            
            # Test news access
            try:
                news_test = self.search_crypto_news(limit=1)
                test_result['test_news_access'] = len(news_test) > 0
            except Exception as e:
                test_result['notes'].append(f'News access issue: {str(e)}')
            
            return test_result
            
        except Exception as e:
            return {
                'openbb_available': False,
                'error': str(e),
                'notes': ['OpenBB platform not properly initialized']
            }
    
    # ========================
    # EQUITY DATA METHODS
    # ========================
    
    def get_equity_price(self, ticker: str, provider: Optional[str] = None) -> Optional[EquityPrice]:
        """
        Get current price for an equity/stock
        """
        try:
            # Try providers in order
            providers_to_try = [provider] if provider else self.providers['equity']
            
            for prov in providers_to_try:
                try:
                    result = obb.equity.price.historical(
                        symbol=ticker,
                        provider=prov,
                        interval='1d',
                        limit=1  # Just get latest
                    )
                    
                    if result.results and len(result.results) > 0:
                        data = result.results[-1]  # Get most recent
                        return EquityPrice(
                            symbol=ticker,
                            date=data.date,
                            open=data.open,
                            high=data.high,
                            low=data.low,
                            close=data.close,
                            volume=data.volume,
                            change_percent=getattr(data, 'change_percent', None)
                        )
                except Exception as e:
                    print(f"Provider {prov} failed for {ticker}: {e}")
                    continue
            
            return None
            
        except Exception as e:
            print(f"Error getting equity price for {ticker}: {e}")
            return None
    
    def get_equity_historical(
        self, 
        ticker: str, 
        days: int = 252,  # Default 1 year of trading days
        provider: Optional[str] = None
    ) -> List[EquityPrice]:
        """
        Get historical price data for equity/stock
        """
        try:
            providers_to_try = [provider] if provider else self.providers['equity']
            
            for prov in providers_to_try:
                try:
                    result = obb.equity.price.historical(
                        symbol=ticker,
                        provider=prov,
                        interval='1d'
                    )
                    
                    if result.results:
                        # Convert to our model
                        prices = []
                        for data in result.results[-days:]:  # Last N days
                            prices.append(EquityPrice(
                                symbol=ticker,
                                date=data.date,
                                open=data.open,
                                high=data.high,
                                low=data.low,
                                close=data.close,
                                volume=data.volume,
                                change_percent=getattr(data, 'change_percent', None)
                            ))
                        return prices
                        
                except Exception as e:
                    print(f"Provider {prov} failed for historical {ticker}: {e}")
                    continue
            
            return []
            
        except Exception as e:
            print(f"Error getting historical data for {ticker}: {e}")
            return []
    
    def get_equity_fundamentals(self, ticker: str, provider: Optional[str] = None) -> Optional[FundamentalData]:
        """
        Get fundamental financial data for equity
        """
        try:
            providers_to_try = [provider] if provider else self.providers['equity']
            
            for prov in providers_to_try:
                try:
                    # Get overview data
                    overview = obb.equity.fundamental.overview(
                        symbol=ticker,
                        provider=prov
                    )
                    
                    if overview.results and len(overview.results) > 0:
                        data = overview.results[0]
                        return FundamentalData(
                            symbol=ticker,
                            market_cap=getattr(data, 'market_cap', None),
                            pe_ratio=getattr(data, 'pe_ratio', None),
                            revenue_ttm=getattr(data, 'revenue_ttm', None),
                            gross_margin=getattr(data, 'gross_margin', None),
                            profit_margin=getattr(data, 'profit_margin', None),
                            debt_ratio=getattr(data, 'debt_ratio', None),
                            price_to_book=getattr(data, 'price_to_book', None),
                            dividend_yield=getattr(data, 'dividend_yield', None)
                        )
                        
                except Exception as e:
                    print(f"Provider {prov} failed for fundamentals {ticker}: {e}")
                    continue
            
            return None
            
        except Exception as e:
            print(f"Error getting fundamentals for {ticker}: {e}")
            return None
    
    def compare_equities(self, tickers: List[str], provider: Optional[str] = None) -> Dict[str, Any]:
        """
        Compare fundamental metrics across multiple equities
        """
        try:
            comparisons = {}
            
            for ticker in tickers:
                try:
                    fundamentals = self.get_equity_fundamentals(ticker, provider)
                    if fundamentals:
                        comparisons[ticker] = {
                            'market_cap': fundamentals.market_cap,
                            'pe_ratio': fundamentals.pe_ratio,
                            'revenue_ttm': fundamentals.revenue_ttm,
                            'gross_margin': fundamentals.gross_margin,
                            'profit_margin': fundamentals.profit_margin,
                            'price_to_book': fundamentals.price_to_book,
                            'dividend_yield': fundamentals.dividend_yield
                        }
                except Exception as e:
                    print(f"Failed to get comparison data for {ticker}: {e}")
                    continue
            
            return {
                'comparisons': comparisons,
                'ticker_count': len(comparisons),
                'analysis_note': f'Compared {len(comparisons)} out of {len(tickers)} requested equities'
            }
            
        except Exception as e:
            print(f"Error comparing equities: {e}")
            return {'error': str(e)}
    
    def get_sector_data(self, sector: str, provider: Optional[str] = None) -> Dict[str, Any]:
        """
        Get sector/industry data and key players
        """
        try:
            # This would use OpenBB's equity screening capabilities
            # For now, return structure for implementation
            
            return {
                'sector': sector,
                'analysis_note': 'Sector data available with OpenBB screening modules',
                'top_companies': [],
                'sector_metrics': {
                    'average_pe': 'Available with screening API',
                    'sector_growth': 'Available with screening API',
                    'market_leaders': 'Available with screening API'
                }
            }
            
        except Exception as e:
            print(f"Error getting sector data for {sector}: {e}")
            return {'error': str(e)}
    
    def search_equity_news(self, ticker: Optional[str] = None, limit: int = 10) -> List[Dict]:
        """
        Get equity-related news
        """
        try:
            # Try to use OpenBB news with configured providers
            news_items = []
            
            # Try benzinga first (we have API key)
            try:
                if ticker:
                    result = obb.news.company(symbol=ticker, provider='benzinga', limit=limit)
                else:
                    result = obb.news.world(provider='benzinga', limit=limit)
                
                if result and hasattr(result, 'results') and result.results:
                    for item in result.results[:limit]:
                        news_items.append({
                            'title': str(getattr(item, 'title', getattr(item, 'headline', 'No title'))),
                            'summary': str(getattr(item, 'text', getattr(item, 'summary', getattr(item, 'description', '')))),
                            'source': 'Benzinga',
                            'published_at': str(getattr(item, 'date', getattr(item, 'published', datetime.now()))),
                            'url': str(getattr(item, 'url', getattr(item, 'link', '#'))),
                            'ticker': ticker
                        })
                    return news_items
            except Exception as benzinga_error:
                print(f"Benzinga equity news error: {benzinga_error}")
            
            # Try FMP as fallback
            try:
                if ticker:
                    result = obb.news.company(symbol=ticker, provider='fmp', limit=limit)
                else:
                    result = obb.news.world(provider='fmp', limit=limit)
                
                if result and hasattr(result, 'results') and result.results:
                    for item in result.results[:limit]:
                        news_items.append({
                            'title': str(getattr(item, 'title', getattr(item, 'headline', 'No title'))),
                            'summary': str(getattr(item, 'text', getattr(item, 'summary', getattr(item, 'description', '')))),
                            'source': 'Financial Modeling Prep',
                            'published_at': str(getattr(item, 'date', getattr(item, 'published', datetime.now()))),
                            'url': str(getattr(item, 'url', getattr(item, 'link', '#'))),
                            'ticker': ticker
                        })
                    return news_items
            except Exception as fmp_error:
                print(f"FMP equity news error: {fmp_error}")
            
            # If all providers fail, return empty list
            print(f"No news available from any provider for {ticker or 'market'}")
            return []
            
        except Exception as e:
            print(f"Error getting equity news: {e}")
            return []
    
    # ========================
    # NATIVE OPENBB CHARTING METHODS
    # ========================
    
    def create_equity_chart(
        self, 
        symbol: str, 
        period: str = "1y", 
        chart_type: str = "candle",
        indicators: Optional[List[str]] = None,
        provider: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create visual chart for equity using OpenBB's native charting capabilities
        
        Args:
            symbol: Stock ticker symbol
            period: Time period (1d, 5d, 1m, 3m, 6m, 1y, 2y, 5y, 10y, ytd, max)
            chart_type: Chart type (candle, ohlc, line)
            indicators: List of technical indicators (sma, ema, rsi, macd, bollinger)
            provider: Data provider (yfinance, fmp, polygon)
        
        Returns:
            Dict with chart data and visualization info
        """
        try:
            providers_to_try = [provider] if provider else self.providers['equity']
            
            for prov in providers_to_try:
                try:
                    # Get historical data with chart=True to enable charting
                    result = obb.equity.price.historical(
                        symbol=symbol,
                        provider=prov,
                        interval='1d',
                        chart=True  # Enable OpenBB charting
                    )
                    
                    if result.results:
                        # Convert data to DataFrame for chart generation
                        import pandas as pd
                        data = []
                        for item in result.results:
                            data.append({
                                'date': item.date,
                                'open': item.open,
                                'high': item.high,
                                'low': item.low,
                                'close': item.close,
                                'volume': item.volume
                            })
                        
                        df = pd.DataFrame(data)
                        df.set_index('date', inplace=True)
                        
                        # Add technical indicators if requested
                        if indicators:
                            df = self._add_technical_indicators(df, indicators)
                        
                        # Generate chart using OpenBB's charting system
                        chart_data = self._generate_openbb_chart(df, symbol, chart_type, indicators)
                        
                        return {
                            'symbol': symbol,
                            'chart_type': chart_type,
                            'period': period,
                            'provider': prov,
                            'data_points': len(df),
                            'indicators': indicators or [],
                            'chart_data': chart_data,
                            'success': True,
                            'current_price': df['close'].iloc[-1] if not df.empty else None,
                            'price_change': ((df['close'].iloc[-1] - df['close'].iloc[0]) / df['close'].iloc[0] * 100) if len(df) > 1 else 0
                        }
                        
                except Exception as e:
                    print(f"Provider {prov} failed for chart {symbol}: {e}")
                    continue
            
            return {
                'symbol': symbol,
                'error': 'No providers available for charting',
                'success': False
            }
            
        except Exception as e:
            print(f"Error creating chart for {symbol}: {e}")
            return {'symbol': symbol, 'error': str(e), 'success': False}
    
    def create_crypto_chart(
        self,
        symbol: str,
        period: str = "30d",
        chart_type: str = "candle",
        indicators: Optional[List[str]] = None,
        provider: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create visual chart for cryptocurrency using OpenBB's native charting
        
        Args:
            symbol: Crypto symbol (BTC, ETH, etc.)
            period: Time period (7d, 30d, 90d, 1y)
            chart_type: Chart type (candle, ohlc, line)
            indicators: List of technical indicators
            provider: Data provider
        
        Returns:
            Dict with chart data and visualization info
        """
        try:
            # Normalize symbol format
            if len(symbol) <= 4 and not symbol.endswith('USD'):
                symbol = f"{symbol}USD"
            
            providers_to_try = [provider] if provider else self.providers['crypto']
            
            for prov in providers_to_try:
                try:
                    # Get historical data with charting enabled
                    result = obb.crypto.price.historical(
                        symbol=symbol,
                        provider=prov,
                        interval='1d',
                        chart=True  # Enable OpenBB charting
                    )
                    
                    if result.results:
                        # Convert to DataFrame
                        import pandas as pd
                        data = []
                        for item in result.results:
                            data.append({
                                'date': item.date,
                                'open': item.open,
                                'high': item.high,
                                'low': item.low,
                                'close': item.close,
                                'volume': item.volume
                            })
                        
                        df = pd.DataFrame(data)
                        df.set_index('date', inplace=True)
                        
                        # Add technical indicators
                        if indicators:
                            df = self._add_technical_indicators(df, indicators)
                        
                        # Generate chart
                        chart_data = self._generate_openbb_chart(df, symbol, chart_type, indicators)
                        
                        return {
                            'symbol': symbol,
                            'chart_type': chart_type,
                            'period': period,
                            'provider': prov,
                            'data_points': len(df),
                            'indicators': indicators or [],
                            'chart_data': chart_data,
                            'success': True,
                            'current_price': df['close'].iloc[-1] if not df.empty else None,
                            'price_change': ((df['close'].iloc[-1] - df['close'].iloc[0]) / df['close'].iloc[0] * 100) if len(df) > 1 else 0
                        }
                        
                except Exception as e:
                    print(f"Provider {prov} failed for crypto chart {symbol}: {e}")
                    continue
            
            return {
                'symbol': symbol,
                'error': 'No providers available for crypto charting',
                'success': False
            }
            
        except Exception as e:
            print(f"Error creating crypto chart for {symbol}: {e}")
            return {'symbol': symbol, 'error': str(e), 'success': False}
    
    def create_comparison_chart(
        self,
        symbols: List[str],
        period: str = "1y",
        chart_type: str = "line",
        normalize: bool = True,
        provider: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create comparison chart for multiple symbols using OpenBB charting
        
        Args:
            symbols: List of symbols to compare
            period: Time period for comparison
            chart_type: Chart type (line recommended for comparisons)
            normalize: Normalize prices to percentage change from start
            provider: Data provider
        
        Returns:
            Dict with comparison chart data
        """
        try:
            import pandas as pd
            comparison_data = {}
            
            for symbol in symbols:
                try:
                    # Determine if crypto or equity
                    is_crypto = len(symbol) <= 4 and symbol.upper() in ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'LINK', 'UNI']
                    
                    if is_crypto:
                        if not symbol.endswith('USD'):
                            symbol_formatted = f"{symbol}USD"
                        else:
                            symbol_formatted = symbol
                        result = obb.crypto.price.historical(
                            symbol=symbol_formatted,
                            provider=provider or self.providers['crypto'][0],
                            interval='1d'
                        )
                    else:
                        result = obb.equity.price.historical(
                            symbol=symbol,
                            provider=provider or self.providers['equity'][0],
                            interval='1d'
                        )
                    
                    if result.results:
                        data = []
                        for item in result.results:
                            data.append({
                                'date': item.date,
                                'close': item.close
                            })
                        
                        df = pd.DataFrame(data)
                        df.set_index('date', inplace=True)
                        
                        if normalize:
                            # Normalize to percentage change from first price
                            first_price = df['close'].iloc[0]
                            df['normalized'] = (df['close'] / first_price - 1) * 100
                        
                        comparison_data[symbol] = df
                        
                except Exception as e:
                    print(f"Failed to get data for {symbol}: {e}")
                    continue
            
            if not comparison_data:
                return {
                    'symbols': symbols,
                    'error': 'No data available for any symbols',
                    'success': False
                }
            
            # Generate comparison chart
            chart_data = self._generate_comparison_chart(comparison_data, normalize)
            
            return {
                'symbols': list(comparison_data.keys()),
                'chart_type': chart_type,
                'period': period,
                'normalized': normalize,
                'data_points': len(list(comparison_data.values())[0]) if comparison_data else 0,
                'chart_data': chart_data,
                'success': True
            }
            
        except Exception as e:
            print(f"Error creating comparison chart: {e}")
            return {'symbols': symbols, 'error': str(e), 'success': False}
    
    def _add_technical_indicators(self, df: pd.DataFrame, indicators: List[str]) -> pd.DataFrame:
        """
        Add technical indicators to DataFrame using OpenBB TA methods
        
        Args:
            df: Price data DataFrame with OHLCV columns
            indicators: List of indicator names
        
        Returns:
            DataFrame with added indicator columns
        """
        try:
            for indicator in indicators:
                if indicator.lower() == 'sma':
                    df['sma_20'] = df['close'].rolling(window=20).mean()
                    df['sma_50'] = df['close'].rolling(window=50).mean()
                elif indicator.lower() == 'ema':
                    df['ema_12'] = df['close'].ewm(span=12).mean()
                    df['ema_26'] = df['close'].ewm(span=26).mean()
                elif indicator.lower() == 'rsi':
                    # Simple RSI calculation
                    delta = df['close'].diff()
                    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
                    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
                    rs = gain / loss
                    df['rsi'] = 100 - (100 / (1 + rs))
                elif indicator.lower() == 'macd':
                    # MACD calculation
                    exp1 = df['close'].ewm(span=12).mean()
                    exp2 = df['close'].ewm(span=26).mean()
                    df['macd'] = exp1 - exp2
                    df['macd_signal'] = df['macd'].ewm(span=9).mean()
                    df['macd_histogram'] = df['macd'] - df['macd_signal']
                elif indicator.lower() == 'bollinger':
                    # Bollinger Bands
                    rolling_mean = df['close'].rolling(window=20).mean()
                    rolling_std = df['close'].rolling(window=20).std()
                    df['bb_upper'] = rolling_mean + (rolling_std * 2)
                    df['bb_lower'] = rolling_mean - (rolling_std * 2)
                    df['bb_middle'] = rolling_mean
            
            return df
        except Exception as e:
            print(f"Error adding technical indicators: {e}")
            return df
    
    def _generate_openbb_chart(self, df: pd.DataFrame, symbol: str, chart_type: str, indicators: Optional[List[str]] = None) -> str:
        """
        Generate ASCII chart visualization using OpenBB-style formatting
        
        Args:
            df: Price data with indicators
            symbol: Symbol name
            chart_type: Type of chart
            indicators: Technical indicators included
        
        Returns:
            ASCII chart string for terminal display
        """
        try:
            if df.empty:
                return f"📈 No data available for {symbol}"
            
            # Get recent price data (last 30 days for ASCII chart)
            recent_df = df.tail(30)
            
            # Generate ASCII price chart
            prices = recent_df['close'].values
            min_price = prices.min()
            max_price = prices.max()
            price_range = max_price - min_price
            
            if price_range == 0:
                return f"📈 {symbol}: ${prices[-1]:.2f} (No price movement)"
            
            # Create ASCII chart
            chart_height = 15
            chart_width = min(len(prices), 50)
            chart_lines = []
            
            for i in range(chart_height, 0, -1):
                line = ""
                threshold = min_price + (price_range * i / chart_height)
                
                for j, price in enumerate(prices[-chart_width:]):
                    if price >= threshold:
                        if j > 0 and prices[-chart_width:][j-1] < price:
                            line += "🟢"  # Price going up
                        elif j > 0 and prices[-chart_width:][j-1] > price:
                            line += "🔴"  # Price going down
                        else:
                            line += "🟡"  # Price stable
                    else:
                        line += " "
                
                chart_lines.append(line)
            
            # Format chart with headers and indicators
            current_price = prices[-1]
            price_change = ((current_price - prices[0]) / prices[0] * 100) if len(prices) > 1 else 0
            trend_emoji = "📈" if price_change > 0 else "📉" if price_change < 0 else "➡️"
            
            chart_output = f"""
{trend_emoji} {symbol} Price Chart ({chart_type.upper()})
┌{'─' * (chart_width + 2)}┐
"""
            
            for line in chart_lines:
                chart_output += f"│ {line:<{chart_width}} │\n"
            
            chart_output += f"""└{'─' * (chart_width + 2)}┘
💰 Current: ${current_price:.2f}
📊 Change: {price_change:+.2f}%
📅 Period: {len(recent_df)} days
"""
            
            # Add technical indicator summary
            if indicators and not recent_df.empty:
                chart_output += "\n🔍 Technical Indicators:\n"
                
                for indicator in indicators:
                    if indicator.lower() == 'sma':
                        if 'sma_20' in recent_df.columns:
                            sma20 = recent_df['sma_20'].iloc[-1]
                            signal = "BULLISH" if current_price > sma20 else "BEARISH"
                            chart_output += f"   SMA(20): ${sma20:.2f} - {signal}\n"
                    elif indicator.lower() == 'rsi':
                        if 'rsi' in recent_df.columns:
                            rsi = recent_df['rsi'].iloc[-1]
                            if rsi > 70:
                                signal = "OVERBOUGHT"
                            elif rsi < 30:
                                signal = "OVERSOLD"
                            else:
                                signal = "NEUTRAL"
                            chart_output += f"   RSI(14): {rsi:.1f} - {signal}\n"
                    elif indicator.lower() == 'macd':
                        if 'macd' in recent_df.columns:
                            macd = recent_df['macd'].iloc[-1]
                            signal_line = recent_df['macd_signal'].iloc[-1]
                            signal = "BULLISH" if macd > signal_line else "BEARISH"
                            chart_output += f"   MACD: {macd:.3f} - {signal}\n"
            
            return chart_output
            
        except Exception as e:
            print(f"Error generating OpenBB chart: {e}")
            return f"📈 {symbol} - Chart generation failed: {str(e)}"
    
    def _generate_comparison_chart(self, comparison_data: Dict[str, pd.DataFrame], normalize: bool) -> str:
        """
        Generate ASCII comparison chart for multiple symbols
        
        Args:
            comparison_data: Dict of symbol -> DataFrame
            normalize: Whether data is normalized to percentage
        
        Returns:
            ASCII comparison chart string
        """
        try:
            if not comparison_data:
                return "📊 No data available for comparison"
            
            # Get the column to use for comparison
            value_column = 'normalized' if normalize else 'close'
            
            chart_output = "📊 Symbol Comparison Chart\n"
            chart_output += "═" * 50 + "\n"
            
            symbols = list(comparison_data.keys())
            colors = ["🟢", "🔴", "🟡", "🔵", "🟣"]  # Different colors for different symbols
            
            # Create performance summary
            for i, (symbol, df) in enumerate(comparison_data.items()):
                if value_column in df.columns and not df.empty:
                    current_val = df[value_column].iloc[-1]
                    start_val = df[value_column].iloc[0]
                    
                    if normalize:
                        performance = current_val  # Already in percentage
                        chart_output += f"{colors[i % len(colors)]} {symbol:<8}: {performance:+6.2f}%\n"
                    else:
                        performance = ((current_val - start_val) / start_val * 100) if start_val != 0 else 0
                        chart_output += f"{colors[i % len(colors)]} {symbol:<8}: ${current_val:8.2f} ({performance:+5.2f}%)\n"
            
            chart_output += "═" * 50 + "\n"
            
            # Simple ASCII comparison chart showing recent trend
            chart_output += "Recent Trend (Last 20 Points):\n"
            
            # Get min/max for scaling
            all_values = []
            for symbol, df in comparison_data.items():
                if value_column in df.columns:
                    all_values.extend(df[value_column].dropna().tail(20).values)
            
            if all_values:
                min_val = min(all_values)
                max_val = max(all_values)
                val_range = max_val - min_val if max_val != min_val else 1
                
                # Create trend lines
                chart_height = 10
                for i in range(chart_height, 0, -1):
                    line = ""
                    threshold = min_val + (val_range * i / chart_height)
                    
                    # Show each symbol's trend
                    for j, (symbol, df) in enumerate(comparison_data.items()):
                        if value_column in df.columns:
                            recent_values = df[value_column].dropna().tail(20).values
                            if len(recent_values) > 0:
                                avg_val = recent_values.mean()
                                if avg_val >= threshold:
                                    line += colors[j % len(colors)]
                                else:
                                    line += " "
                    
                    line += "\n"
                    chart_output += line
            
            return chart_output
            
        except Exception as e:
            print(f"Error generating comparison chart: {e}")
            return f"📊 Comparison chart generation failed: {str(e)}"
    
    def create_portfolio_chart(
        self,
        portfolio_symbols: List[str],
        period: str = "1y",
        show_allocation: bool = True
    ) -> Dict[str, Any]:
        """
        Create comprehensive portfolio visualization using OpenBB charting
        
        Args:
            portfolio_symbols: List of symbols in portfolio
            period: Time period for analysis
            show_allocation: Include allocation breakdown
        
        Returns:
            Dict with portfolio chart data and analytics
        """
        try:
            # Get comparison data for all portfolio symbols
            comparison_result = self.create_comparison_chart(
                symbols=portfolio_symbols,
                period=period,
                normalize=True
            )
            
            if not comparison_result.get('success'):
                return {
                    'symbols': portfolio_symbols,
                    'error': 'Failed to generate portfolio comparison',
                    'success': False
                }
            
            # Add portfolio-specific analysis
            portfolio_analysis = {
                'total_symbols': len(portfolio_symbols),
                'period': period,
                'chart_data': comparison_result['chart_data'],
                'success': True,
                'performance_summary': f"Portfolio tracking {len(portfolio_symbols)} symbols over {period}"
            }
            
            # Add allocation visualization if requested
            if show_allocation:
                # Simple equal-weight assumption for now
                allocation_chart = "📊 Portfolio Allocation (Equal Weight):\n"
                weight = 100.0 / len(portfolio_symbols)
                for symbol in portfolio_symbols:
                    bar_length = int(weight / 5)  # Scale for visualization
                    allocation_chart += f"{symbol:<8}: {'█' * bar_length} {weight:.1f}%\n"
                
                portfolio_analysis['allocation_chart'] = allocation_chart
            
            return portfolio_analysis
            
        except Exception as e:
            print(f"Error creating portfolio chart: {e}")
            return {'symbols': portfolio_symbols, 'error': str(e), 'success': False}


# Singleton instance
openbb_service = OpenBBService()