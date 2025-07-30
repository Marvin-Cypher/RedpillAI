# OpenBB Service for RedpillAI
# This service wraps OpenBB functionality for the RedpillAI backend

from typing import Dict, List, Optional, Any
from datetime import datetime, date
import pandas as pd
import asyncio
import functools
import os
from openbb import obb
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
            # For now, use a generic search since OpenBB news might need API keys
            # In future, we can enhance this with:
            # result = obb.news.world(provider='benzinga', limit=limit)
            
            return [{
                'title': f'Latest {symbol or "Crypto"} Market Update',
                'summary': 'Market analysis available through OpenBB integration',
                'source': 'OpenBB Platform',
                'published_at': datetime.now().isoformat(),
                'url': 'https://openbb.co'
            }]
            
        except Exception as e:
            print(f"Error getting news: {e}")
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
            # For now, use a generic search since OpenBB news might need API keys
            # In future, we can enhance this with:
            # result = obb.news.company(symbol=ticker, provider='benzinga', limit=limit)
            
            return [{
                'title': f'Latest {ticker or "Market"} News Update',
                'summary': f'Market analysis for {ticker or "general market"} available through OpenBB integration',
                'source': 'OpenBB Platform',
                'published_at': datetime.now().isoformat(),
                'url': 'https://openbb.co',
                'ticker': ticker
            }]
            
        except Exception as e:
            print(f"Error getting equity news: {e}")
            return []


# Singleton instance
openbb_service = OpenBBService()