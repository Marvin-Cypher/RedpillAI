"""
Built-in Market Data Service - No external dependencies
Direct integration with free financial APIs and custom charting
"""

import asyncio
import httpx
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
import logging
import json

logger = logging.getLogger(__name__)

class BuiltinMarketService:
    """
    Built-in market data service using free APIs and custom charting
    No reliance on OpenBB or other external services
    """
    
    def __init__(self):
        self.charts_dir = Path.home() / ".redpill" / "charts"
        self.charts_dir.mkdir(parents=True, exist_ok=True)
        
        # Free data sources
        self.crypto_apis = {
            'coingecko': 'https://api.coingecko.com/api/v3',
            'coinapi': 'https://rest.coinapi.io/v1'  # Requires key but has free tier
        }
        
        self.stock_apis = {
            'yahoo': 'https://query1.finance.yahoo.com/v8/finance',
            'alphavantage': 'https://www.alphavantage.co/query',  # Free tier available
            'finnhub': 'https://finnhub.io/api/v1'  # Free tier available
        }
        
        # Symbol mappings for better recognition
        self.crypto_symbols = {
            'bitcoin': 'BTC', 'btc': 'BTC',
            'ethereum': 'ETH', 'eth': 'ETH', 
            'solana': 'SOL', 'sol': 'SOL',
            'polkadot': 'DOT', 'dot': 'DOT',
            'chainlink': 'LINK', 'link': 'LINK',
            'cardano': 'ADA', 'ada': 'ADA',
            'polygon': 'MATIC', 'matic': 'MATIC',
            'avalanche': 'AVAX', 'avax': 'AVAX',
            'uniswap': 'UNI', 'uni': 'UNI',
            'dogecoin': 'DOGE', 'doge': 'DOGE'
        }
        
        self.coingecko_ids = {
            'BTC': 'bitcoin', 'ETH': 'ethereum', 'SOL': 'solana',
            'DOT': 'polkadot', 'LINK': 'chainlink', 'ADA': 'cardano',
            'MATIC': 'polygon', 'AVAX': 'avalanche-2', 'UNI': 'uniswap',
            'DOGE': 'dogecoin'
        }
        
        self.stock_symbols = {
            'apple': 'AAPL', 'microsoft': 'MSFT', 'google': 'GOOGL',
            'amazon': 'AMZN', 'tesla': 'TSLA', 'meta': 'META',
            'nvidia': 'NVDA', 'netflix': 'NFLX', 'dropbox': 'DBX'
        }
        
        # Economic data sources
        self.economic_apis = {
            'fred': 'https://api.stlouisfed.org/fred/series/observations',
            'treasury': 'https://api.fiscaldata.treasury.gov/services/api/v1',
            'bls': 'https://api.bls.gov/publicAPI/v2/timeseries/data'
        }
        
        # Market indices and sector ETFs
        self.market_indices = {
            'SPY': 'S&P 500', 'QQQ': 'NASDAQ 100', 'DIA': 'Dow Jones',
            'IWM': 'Russell 2000', 'VTI': 'Total Stock Market'
        }
        
        self.sector_etfs = {
            'XLK': 'Technology', 'XLF': 'Financial', 'XLV': 'Healthcare',
            'XLE': 'Energy', 'XLI': 'Industrial', 'XLP': 'Consumer Staples',
            'XLY': 'Consumer Discretionary', 'XLRE': 'Real Estate',
            'XLU': 'Utilities', 'XLB': 'Materials', 'XLC': 'Communication'
        }
    
    async def get_crypto_data(self, symbol: str, with_chart: bool = False) -> Dict[str, Any]:
        """Get crypto data with optional chart generation"""
        try:
            # Normalize symbol
            symbol = self.crypto_symbols.get(symbol.lower(), symbol.upper())
            coin_id = self.coingecko_ids.get(symbol)
            
            if not coin_id:
                return {"error": f"Unknown crypto symbol: {symbol}"}
            
            # Get current price and basic data
            current_data = await self._get_coingecko_current(coin_id, symbol)
            
            chart_path = None
            if with_chart:
                # Get historical data for chart
                historical_data = await self._get_coingecko_historical(coin_id, days=365)
                if historical_data is not None and len(historical_data) > 0:
                    chart_path = await self._create_crypto_chart(historical_data, symbol)
            
            result = {
                **current_data,
                "chart_path": chart_path,
                "chart_generated": bool(chart_path),
                "source": "Built-in CoinGecko Integration"
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Crypto data error for {symbol}: {e}")
            return {"error": str(e)}
    
    async def get_stock_data(self, symbol: str, with_chart: bool = False) -> Dict[str, Any]:
        """Get stock data with optional chart generation"""
        try:
            # Normalize symbol
            symbol = self.stock_symbols.get(symbol.lower(), symbol.upper())
            
            # Get current price from Yahoo Finance (free)
            current_data = await self._get_yahoo_current(symbol)
            
            chart_path = None
            if with_chart:
                # Get historical data for chart
                historical_data = await self._get_yahoo_historical(symbol, period='1y')
                if historical_data is not None and len(historical_data) > 0:
                    chart_path = await self._create_stock_chart(historical_data, symbol)
            
            result = {
                **current_data,
                "chart_path": chart_path,
                "chart_generated": bool(chart_path),
                "source": "Built-in Yahoo Finance Integration"
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Stock data error for {symbol}: {e}")
            return {"error": str(e)}
    
    async def _get_coingecko_current(self, coin_id: str, symbol: str) -> Dict[str, Any]:
        """Get current crypto price from CoinGecko with retry logic"""
        for attempt in range(3):
            try:
                await asyncio.sleep(attempt * 1.0)  # Progressive delay
                
                headers = {
                    'Accept': 'application/json',
                    'User-Agent': 'RedpillAI/1.0'
                }
                
                async with httpx.AsyncClient(timeout=20.0, headers=headers) as client:
                    response = await client.get(
                        f"{self.crypto_apis['coingecko']}/simple/price",
                        params={
                            'ids': coin_id,
                            'vs_currencies': 'usd',
                            'include_24hr_change': 'true',
                            'include_24hr_vol': 'true',
                            'include_market_cap': 'true'
                        }
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        if coin_id in data:
                            coin_data = data[coin_id]
                            return {
                                "symbol": symbol,
                                "price": coin_data.get('usd'),
                                "change_24h": coin_data.get('usd_24h_change'),
                                "volume": coin_data.get('usd_24h_vol'),
                                "market_cap": coin_data.get('market_cap')
                            }
                    elif response.status_code == 429:
                        # Rate limited, wait longer on next attempt
                        if attempt < 2:
                            await asyncio.sleep(5.0)
                            continue
                    
                    return {"error": f"CoinGecko API error: {response.status_code}"}
                    
            except Exception as e:
                if attempt == 2:  # Last attempt
                    return {"error": f"CoinGecko request failed: {str(e)}"}
                await asyncio.sleep(2.0)
    
    async def _get_coingecko_historical(self, coin_id: str, days: int = 365) -> Optional[pd.DataFrame]:
        """Get historical crypto data from CoinGecko"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.crypto_apis['coingecko']}/coins/{coin_id}/market_chart",
                    params={
                        'vs_currency': 'usd',
                        'days': days
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    prices = data.get('prices', [])
                    volumes = data.get('total_volumes', [])
                    
                    if prices:
                        df_data = []
                        for i, (timestamp, price) in enumerate(prices):
                            volume = volumes[i][1] if i < len(volumes) else 0
                            df_data.append({
                                'timestamp': pd.to_datetime(timestamp, unit='ms'),
                                'price': price,
                                'volume': volume
                            })
                        
                        df = pd.DataFrame(df_data)
                        df.set_index('timestamp', inplace=True)
                        return df
                        
        except Exception as e:
            logger.error(f"Historical crypto data error: {e}")
            
        return None
    
    async def _get_yahoo_current(self, symbol: str) -> Dict[str, Any]:
        """Get current stock price from Yahoo Finance"""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    f"{self.stock_apis['yahoo']}/chart/{symbol}",
                    params={'interval': '1d', 'range': '1d'}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    result = data.get('chart', {}).get('result', [])
                    
                    if result:
                        meta = result[0].get('meta', {})
                        return {
                            "symbol": symbol,
                            "price": meta.get('regularMarketPrice'),
                            "change": meta.get('regularMarketPrice', 0) - meta.get('previousClose', 0),
                            "change_pct": ((meta.get('regularMarketPrice', 0) - meta.get('previousClose', 1)) / meta.get('previousClose', 1)) * 100,
                            "volume": meta.get('regularMarketVolume'),
                            "market_cap": meta.get('regularMarketPrice', 0) * meta.get('sharesOutstanding', 0) if meta.get('sharesOutstanding') else None
                        }
                
                return {"error": f"Yahoo Finance API error: {response.status_code}"}
                
        except Exception as e:
            return {"error": f"Yahoo Finance request failed: {str(e)}"}
    
    async def _get_yahoo_historical(self, symbol: str, period: str = '1y') -> Optional[pd.DataFrame]:
        """Get historical stock data from Yahoo Finance"""
        try:
            # Calculate date range
            end_date = datetime.now()
            if period == '1y':
                start_date = end_date - timedelta(days=365)
            elif period == '6m':
                start_date = end_date - timedelta(days=180)
            elif period == '3m':
                start_date = end_date - timedelta(days=90)
            else:
                start_date = end_date - timedelta(days=365)
            
            period1 = int(start_date.timestamp())
            period2 = int(end_date.timestamp())
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.stock_apis['yahoo']}/chart/{symbol}",
                    params={
                        'interval': '1d',
                        'period1': period1,
                        'period2': period2
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    result = data.get('chart', {}).get('result', [])
                    
                    if result:
                        timestamps = result[0].get('timestamp', [])
                        indicators = result[0].get('indicators', {})
                        quote = indicators.get('quote', [{}])[0]
                        
                        df_data = []
                        for i, timestamp in enumerate(timestamps):
                            if i < len(quote.get('close', [])):
                                df_data.append({
                                    'timestamp': pd.to_datetime(timestamp, unit='s'),
                                    'price': quote['close'][i],
                                    'volume': quote.get('volume', [0] * len(timestamps))[i],
                                    'open': quote.get('open', [0] * len(timestamps))[i],
                                    'high': quote.get('high', [0] * len(timestamps))[i],
                                    'low': quote.get('low', [0] * len(timestamps))[i]
                                })
                        
                        if df_data:
                            df = pd.DataFrame(df_data)
                            df.set_index('timestamp', inplace=True)
                            return df
                        
        except Exception as e:
            logger.error(f"Historical stock data error: {e}")
            
        return None
    
    async def _create_crypto_chart(self, data: pd.DataFrame, symbol: str) -> Optional[str]:
        """Create cryptocurrency chart"""
        try:
            plt.style.use('dark_background')
            fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10), 
                                         gridspec_kw={'height_ratios': [3, 1]})
            
            # Price chart
            ax1.plot(data.index, data['price'], color='#00ff88', linewidth=2, label='Price')
            ax1.set_title(f'{symbol} Price Chart (1 Year)', fontsize=16, fontweight='bold', color='white')
            ax1.set_ylabel('Price (USD)', fontsize=12, color='white')
            ax1.grid(True, alpha=0.3)
            ax1.legend()
            
            # Volume chart
            ax2.bar(data.index, data['volume'], color='#0088ff', alpha=0.7, width=1)
            ax2.set_ylabel('Volume', fontsize=12, color='white')
            ax2.set_xlabel('Date', fontsize=12, color='white')
            ax2.grid(True, alpha=0.3)
            
            # Format dates
            ax1.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
            ax1.xaxis.set_major_locator(mdates.MonthLocator(interval=2))
            ax2.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
            ax2.xaxis.set_major_locator(mdates.MonthLocator(interval=2))
            
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            # Save chart
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            chart_filename = f"{symbol}_crypto_{timestamp}.png"
            chart_path = self.charts_dir / chart_filename
            
            plt.savefig(chart_path, dpi=300, bbox_inches='tight',
                       facecolor='black', edgecolor='none')
            plt.close()
            
            return str(chart_path)
            
        except Exception as e:
            logger.error(f"Crypto chart creation failed: {e}")
            return None
    
    async def _create_stock_chart(self, data: pd.DataFrame, symbol: str) -> Optional[str]:
        """Create stock chart with OHLC candlesticks"""
        try:
            plt.style.use('dark_background')
            fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10),
                                         gridspec_kw={'height_ratios': [3, 1]})
            
            # Candlestick-style chart (simplified)
            for i in range(len(data)):
                row = data.iloc[i]
                date = data.index[i]
                open_price, high, low, close = row['open'], row['high'], row['low'], row['price']
                
                # Body color
                color = '#00ff88' if close >= open_price else '#ff4444'
                
                # Draw body
                body_height = abs(close - open_price)
                body_bottom = min(close, open_price)
                ax1.bar(date, body_height, bottom=body_bottom, color=color, 
                       width=timedelta(days=0.8), alpha=0.8)
                
                # Draw wicks
                ax1.plot([date, date], [low, high], color='white', linewidth=0.8, alpha=0.6)
            
            ax1.set_title(f'{symbol} Stock Chart (1 Year)', fontsize=16, fontweight='bold', color='white')
            ax1.set_ylabel('Price (USD)', fontsize=12, color='white')
            ax1.grid(True, alpha=0.3)
            
            # Volume chart
            ax2.bar(data.index, data['volume'], color='#0088ff', alpha=0.7, width=timedelta(days=0.8))
            ax2.set_ylabel('Volume', fontsize=12, color='white')
            ax2.set_xlabel('Date', fontsize=12, color='white')
            ax2.grid(True, alpha=0.3)
            
            # Format dates
            ax1.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
            ax1.xaxis.set_major_locator(mdates.MonthLocator(interval=2))
            ax2.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
            ax2.xaxis.set_major_locator(mdates.MonthLocator(interval=2))
            
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            # Save chart
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            chart_filename = f"{symbol}_stock_{timestamp}.png"
            chart_path = self.charts_dir / chart_filename
            
            plt.savefig(chart_path, dpi=300, bbox_inches='tight',
                       facecolor='black', edgecolor='none')
            plt.close()
            
            return str(chart_path)
            
        except Exception as e:
            logger.error(f"Stock chart creation failed: {e}")
            return None

    async def get_fundamentals(self, symbol: str) -> Dict[str, Any]:
        """Get comprehensive fundamental analysis data"""
        try:
            symbol = self.stock_symbols.get(symbol.lower(), symbol.upper())
            
            # Get basic stock data first
            stock_data = await self.get_stock_data(symbol, with_chart=False)
            
            # Get additional fundamental data from Yahoo Finance
            fundamentals = await self._get_yahoo_fundamentals(symbol)
            
            return {
                **stock_data,
                **fundamentals,
                "analysis_type": "fundamentals",
                "source": "Built-in Yahoo Finance Fundamentals"
            }
            
        except Exception as e:
            logger.error(f"Fundamentals error for {symbol}: {e}")
            return {"error": str(e)}
    
    async def get_sector_analysis(self, sector: str = None) -> Dict[str, Any]:
        """Get sector performance analysis"""
        try:
            if sector:
                # Find sector ETF
                sector_etf = None
                for etf, sector_name in self.sector_etfs.items():
                    if sector.lower() in sector_name.lower():
                        sector_etf = etf
                        break
                
                if sector_etf:
                    return await self.get_stock_data(sector_etf, with_chart=True)
            
            # Get all sector ETF performance
            sector_performance = {}
            for etf, sector_name in list(self.sector_etfs.items())[:5]:  # Limit to avoid rate limits
                try:
                    data = await self.get_stock_data(etf, with_chart=False)
                    if 'price' in data:
                        sector_performance[sector_name] = {
                            'symbol': etf,
                            'price': data['price'],
                            'change_pct': data.get('change_pct', 0)
                        }
                except Exception:
                    continue
            
            return {
                "sector_performance": sector_performance,
                "analysis_type": "sector_analysis",
                "source": "Built-in Sector ETF Analysis"
            }
            
        except Exception as e:
            logger.error(f"Sector analysis error: {e}")
            return {"error": str(e)}
    
    async def get_market_overview(self) -> Dict[str, Any]:
        """Get comprehensive market overview"""
        try:
            market_data = {}
            
            # Get major indices
            for symbol, name in list(self.market_indices.items())[:3]:  # Limit requests
                try:
                    data = await self.get_stock_data(symbol, with_chart=False)
                    if 'price' in data:
                        market_data[name] = {
                            'symbol': symbol,
                            'price': data['price'],
                            'change_pct': data.get('change_pct', 0)
                        }
                except Exception:
                    continue
            
            # Get top crypto data
            crypto_data = {}
            for symbol in ['BTC', 'ETH', 'SOL']:
                try:
                    data = await self.get_crypto_data(symbol, with_chart=False)
                    if 'price' in data:
                        crypto_data[symbol] = {
                            'price': data['price'],
                            'change_24h': data.get('change_24h', 0)
                        }
                except Exception:
                    continue
            
            return {
                "market_indices": market_data,
                "crypto_markets": crypto_data,
                "analysis_type": "market_overview",
                "source": "Built-in Market Overview"
            }
            
        except Exception as e:
            logger.error(f"Market overview error: {e}")
            return {"error": str(e)}
    
    async def get_economic_data(self, indicator: str = "gdp") -> Dict[str, Any]:
        """Get economic indicators"""
        try:
            # Map common indicators to FRED series IDs
            fred_series = {
                'gdp': 'GDP',
                'inflation': 'CPIAUCSL',
                'unemployment': 'UNRATE',
                'interest_rates': 'FEDFUNDS',
                'sp500': 'SP500'
            }
            
            series_id = fred_series.get(indicator.lower(), 'GDP')
            
            return {
                "indicator": indicator,
                "series_id": series_id,
                "message": f"Economic data for {indicator} would be fetched from FRED API",
                "note": "FRED API key required for live data",
                "analysis_type": "economic_data",
                "source": "FRED Economic Data API"
            }
            
        except Exception as e:
            logger.error(f"Economic data error: {e}")
            return {"error": str(e)}
    
    async def get_options_data(self, symbol: str) -> Dict[str, Any]:
        """Get options data and analysis"""
        try:
            symbol = self.stock_symbols.get(symbol.lower(), symbol.upper())
            
            return {
                "symbol": symbol,
                "message": f"Options data for {symbol} would include call/put chains, IV, Greeks",
                "note": "Options data requires specialized financial data provider",
                "analysis_type": "options_analysis",
                "source": "Options Analysis Module"
            }
            
        except Exception as e:
            logger.error(f"Options data error: {e}")
            return {"error": str(e)}
    
    async def get_news_sentiment(self, symbol: str = None) -> Dict[str, Any]:
        """Get news sentiment analysis"""
        try:
            if symbol:
                symbol = self.stock_symbols.get(symbol.lower(), symbol.upper())
                message = f"News sentiment analysis for {symbol}"
            else:
                message = "Market-wide news sentiment analysis"
            
            return {
                "symbol": symbol,
                "message": message,
                "note": "News sentiment requires news API integration",
                "analysis_type": "news_sentiment",
                "source": "News Sentiment Analysis"
            }
            
        except Exception as e:
            logger.error(f"News sentiment error: {e}")
            return {"error": str(e)}
    
    async def get_earnings_data(self, symbol: str) -> Dict[str, Any]:
        """Get earnings data and calendar"""
        try:
            symbol = self.stock_symbols.get(symbol.lower(), symbol.upper())
            
            return {
                "symbol": symbol,
                "message": f"Earnings analysis for {symbol} including calendar, estimates, and history",
                "note": "Earnings data requires financial data provider",
                "analysis_type": "earnings_analysis",
                "source": "Earnings Analysis Module"
            }
            
        except Exception as e:
            logger.error(f"Earnings data error: {e}")
            return {"error": str(e)}
    
    async def _get_yahoo_fundamentals(self, symbol: str) -> Dict[str, Any]:
        """Get fundamental data from Yahoo Finance"""
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                # Get company info
                response = await client.get(
                    f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{symbol}",
                    params={
                        'modules': 'defaultKeyStatistics,financialData,summaryProfile'
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    result = data.get('quoteSummary', {}).get('result', [])
                    
                    if result:
                        key_stats = result[0].get('defaultKeyStatistics', {})
                        financial = result[0].get('financialData', {})
                        profile = result[0].get('summaryProfile', {})
                        
                        return {
                            "market_cap": key_stats.get('marketCap', {}).get('raw'),
                            "pe_ratio": key_stats.get('trailingPE', {}).get('raw'),
                            "peg_ratio": key_stats.get('pegRatio', {}).get('raw'),
                            "price_to_book": key_stats.get('priceToBook', {}).get('raw'),
                            "debt_to_equity": financial.get('debtToEquity', {}).get('raw'),
                            "roe": financial.get('returnOnEquity', {}).get('raw'),
                            "sector": profile.get('sector'),
                            "industry": profile.get('industry'),
                            "website": profile.get('website'),
                            "employees": profile.get('fullTimeEmployees')
                        }
                
                return {}
                
        except Exception as e:
            logger.error(f"Yahoo fundamentals error: {e}")
            return {}

# Global instance
builtin_market_service = BuiltinMarketService()