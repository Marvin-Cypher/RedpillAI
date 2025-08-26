"""
Chart Service - Generate financial charts using matplotlib and OpenBB data
Simple fallback when OpenBB Terminal is not available
"""

import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
import logging
from typing import Dict, Any, Optional
import asyncio

try:
    from openbb import obb
    OPENBB_AVAILABLE = True
except ImportError:
    obb = None
    OPENBB_AVAILABLE = False

logger = logging.getLogger(__name__)

class ChartService:
    """
    Simple chart generation service using matplotlib
    Fallback when OpenBB Terminal is not available
    """
    
    def __init__(self):
        self.charts_dir = Path.home() / ".redpill" / "charts"
        self.charts_dir.mkdir(parents=True, exist_ok=True)
        
    async def generate_crypto_chart(self, symbol: str, period: str = "1y") -> Dict[str, Any]:
        """
        Generate crypto price chart using matplotlib
        """
        try:
            # Get historical data
            data = await self._get_crypto_historical_data(symbol, period)
            
            if data is None or len(data) < 2:
                return {
                    "success": False,
                    "error": f"Insufficient data for {symbol}"
                }
            
            # Generate chart
            chart_path = await self._create_price_chart(
                data, 
                title=f"{symbol} Price Chart ({period})",
                symbol=symbol
            )
            
            return {
                "success": True,
                "chart_path": str(chart_path),
                "symbol": symbol,
                "period": period,
                "data_points": len(data),
                "source": "Chart Service + CoinGecko"
            }
            
        except Exception as e:
            logger.error(f"Chart generation failed for {symbol}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def generate_stock_chart(self, symbol: str, period: str = "1y") -> Dict[str, Any]:
        """
        Generate stock price chart using matplotlib
        """
        try:
            # Get historical data
            data = await self._get_stock_historical_data(symbol, period)
            
            if data is None or len(data) < 2:
                return {
                    "success": False,
                    "error": f"Insufficient data for {symbol}"
                }
            
            # Generate chart
            chart_path = await self._create_price_chart(
                data,
                title=f"{symbol} Stock Price Chart ({period})",
                symbol=symbol
            )
            
            return {
                "success": True,
                "chart_path": str(chart_path),
                "symbol": symbol,
                "period": period,
                "data_points": len(data),
                "source": "Chart Service + OpenBB"
            }
            
        except Exception as e:
            logger.error(f"Stock chart generation failed for {symbol}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _get_crypto_historical_data(self, symbol: str, period: str) -> Optional[pd.DataFrame]:
        """Get crypto historical data"""
        try:
            # First try OpenBB if available
            if OPENBB_AVAILABLE:
                try:
                    # Try yfinance for crypto
                    crypto_symbol = f"{symbol}-USD"
                    result = obb.equity.price.historical(
                        symbol=crypto_symbol, 
                        provider="yfinance",
                        period="1y"
                    )
                    if result is not None and len(result) > 0:
                        return result
                except Exception:
                    pass
            
            # Fallback to CoinGecko API for basic price history
            import httpx
            
            # Map period to days
            days_map = {
                "1d": 1, "7d": 7, "1m": 30, "3m": 90, 
                "6m": 180, "1y": 365, "2y": 730
            }
            days = days_map.get(period, 365)
            
            # Symbol mapping
            symbol_mapping = {
                'BTC': 'bitcoin', 'ETH': 'ethereum', 'DOT': 'polkadot',
                'LINK': 'chainlink', 'SOL': 'solana', 'ADA': 'cardano'
            }
            coin_id = symbol_mapping.get(symbol.upper(), symbol.lower())
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"https://api.coingecko.com/api/v3/coins/{coin_id}/market_chart",
                    params={"vs_currency": "usd", "days": days}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    prices = data.get("prices", [])
                    
                    if prices:
                        # Convert to DataFrame
                        df_data = []
                        for timestamp, price in prices:
                            df_data.append({
                                'timestamp': pd.to_datetime(timestamp, unit='ms'),
                                'price': price
                            })
                        
                        df = pd.DataFrame(df_data)
                        df.set_index('timestamp', inplace=True)
                        return df
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get crypto data for {symbol}: {e}")
            return None
    
    async def _get_stock_historical_data(self, symbol: str, period: str) -> Optional[pd.DataFrame]:
        """Get stock historical data"""
        try:
            if not OPENBB_AVAILABLE:
                return None
                
            # Try different providers
            providers = ['yfinance', 'fmp', 'alpha_vantage']
            
            for provider in providers:
                try:
                    result = obb.equity.price.historical(
                        symbol=symbol,
                        provider=provider,
                        period="1y"
                    )
                    if result is not None and len(result) > 0:
                        return result
                except Exception:
                    continue
                    
            return None
            
        except Exception as e:
            logger.error(f"Failed to get stock data for {symbol}: {e}")
            return None
    
    async def _create_price_chart(self, data: pd.DataFrame, title: str, symbol: str) -> Path:
        """Create a price chart using matplotlib"""
        try:
            plt.style.use('dark_background')
            fig, ax = plt.subplots(figsize=(12, 8))
            
            # Determine price column
            price_col = None
            for col in ['price', 'close', 'Close']:
                if col in data.columns:
                    price_col = col
                    break
            
            if price_col is None:
                raise ValueError("No price column found in data")
            
            # Plot price line
            ax.plot(data.index, data[price_col], color='#00ff88', linewidth=2, label='Price')
            
            # Styling
            ax.set_title(title, fontsize=16, fontweight='bold', color='white')
            ax.set_xlabel('Date', fontsize=12, color='white')
            ax.set_ylabel('Price (USD)', fontsize=12, color='white')
            ax.grid(True, alpha=0.3)
            ax.legend()
            
            # Format axes
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            # Save chart
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            chart_filename = f"{symbol}_{timestamp}_chart.png"
            chart_path = self.charts_dir / chart_filename
            
            plt.savefig(chart_path, dpi=300, bbox_inches='tight', 
                       facecolor='black', edgecolor='none')
            plt.close()
            
            return chart_path
            
        except Exception as e:
            logger.error(f"Chart creation failed: {e}")
            raise

# Global instance
chart_service = ChartService()