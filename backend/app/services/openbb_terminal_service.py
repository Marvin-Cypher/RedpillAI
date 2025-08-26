"""
OpenBB Terminal Service - Direct integration with OpenBB for charts and data
Uses subprocess to call OpenBB terminal commands and returns formatted results
"""

import subprocess
import tempfile
import json
import os
import logging
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
import asyncio

logger = logging.getLogger(__name__)

class OpenBBTerminalService:
    """
    Direct OpenBB Terminal integration for charts and comprehensive market data
    Bypasses Python API dependency issues by using terminal commands directly
    """
    
    def __init__(self):
        self.charts_dir = Path.home() / ".redpill" / "charts"
        self.charts_dir.mkdir(parents=True, exist_ok=True)
        
    async def get_crypto_chart(self, symbol: str, period: str = "1y", chart_type: str = "candle") -> Dict[str, Any]:
        """
        Generate crypto price chart using OpenBB terminal
        
        Args:
            symbol: Crypto symbol (e.g., 'BTC', 'ETH')
            period: Time period ('1d', '7d', '1m', '1y', etc.)
            chart_type: 'candle', 'line', 'ohlc'
        """
        try:
            # Create temporary script for OpenBB commands
            script_content = f"""
# OpenBB Terminal script for {symbol} crypto chart
crypto
load {symbol}

# Set period
period {period}

# Generate chart
chart --type {chart_type} --export png

# Get current price data
quote

# Exit
quit
"""
            
            # Save script to temp file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.openbb', delete=False) as f:
                f.write(script_content)
                script_path = f.name
            
            try:
                # Run OpenBB with the script
                result = await asyncio.create_subprocess_exec(
                    'openbb', '-s', script_path,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=str(self.charts_dir)
                )
                
                stdout, stderr = await result.communicate()
                
                # Look for generated chart files
                chart_files = list(self.charts_dir.glob(f"*{symbol}*.png"))
                
                response = {
                    "success": True,
                    "symbol": symbol,
                    "period": period,
                    "chart_type": chart_type,
                    "chart_path": str(chart_files[0]) if chart_files else None,
                    "output": stdout.decode() if stdout else "",
                    "source": "OpenBB Terminal"
                }
                
                # Extract price data from output if available
                output_text = stdout.decode() if stdout else ""
                price_data = self._extract_price_from_output(output_text)
                if price_data:
                    response.update(price_data)
                
                return response
                
            finally:
                # Clean up temp script
                try:
                    os.unlink(script_path)
                except:
                    pass
                
        except Exception as e:
            logger.error(f"OpenBB crypto chart error for {symbol}: {e}")
            return {
                "success": False,
                "error": str(e),
                "fallback": await self._fallback_crypto_data(symbol)
            }
    
    async def get_stock_chart(self, symbol: str, period: str = "1y", chart_type: str = "candle") -> Dict[str, Any]:
        """
        Generate stock chart using OpenBB terminal
        """
        try:
            script_content = f"""
# OpenBB Terminal script for {symbol} stock chart
stocks
load {symbol}

# Set period  
candle --ma 20,50 --export png

# Get fundamentals
fa
quote

# Exit
quit
"""
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.openbb', delete=False) as f:
                f.write(script_content)
                script_path = f.name
            
            try:
                result = await asyncio.create_subprocess_exec(
                    'openbb', '-s', script_path,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=str(self.charts_dir)
                )
                
                stdout, stderr = await result.communicate()
                
                chart_files = list(self.charts_dir.glob(f"*{symbol}*.png"))
                
                response = {
                    "success": True,
                    "symbol": symbol,
                    "period": period,
                    "chart_type": chart_type,
                    "chart_path": str(chart_files[0]) if chart_files else None,
                    "output": stdout.decode() if stdout else "",
                    "source": "OpenBB Terminal"
                }
                
                # Extract stock data from output
                output_text = stdout.decode() if stdout else ""
                stock_data = self._extract_stock_from_output(output_text)
                if stock_data:
                    response.update(stock_data)
                
                return response
                
            finally:
                try:
                    os.unlink(script_path)
                except:
                    pass
                    
        except Exception as e:
            logger.error(f"OpenBB stock chart error for {symbol}: {e}")
            return {
                "success": False,
                "error": str(e),
                "fallback": await self._fallback_stock_data(symbol)
            }
    
    def _extract_price_from_output(self, output: str) -> Optional[Dict[str, Any]]:
        """Extract price data from OpenBB terminal output"""
        try:
            lines = output.split('\n')
            price_data = {}
            
            for line in lines:
                line = line.strip()
                
                # Look for price patterns
                if 'Price:' in line or 'Current Price:' in line:
                    # Extract price value
                    parts = line.split('$')
                    if len(parts) > 1:
                        price_str = parts[1].split()[0].replace(',', '')
                        try:
                            price_data['current_price'] = float(price_str)
                        except:
                            pass
                
                # Look for change patterns
                elif '%' in line and ('change' in line.lower() or 'Change' in line):
                    # Extract percentage change
                    import re
                    pct_match = re.search(r'([-+]?\d+\.?\d*)%', line)
                    if pct_match:
                        try:
                            price_data['price_change_24h'] = float(pct_match.group(1))
                        except:
                            pass
            
            return price_data if price_data else None
            
        except Exception as e:
            logger.debug(f"Error extracting price from output: {e}")
            return None
    
    def _extract_stock_from_output(self, output: str) -> Optional[Dict[str, Any]]:
        """Extract stock data from OpenBB terminal output"""
        try:
            lines = output.split('\n')
            stock_data = {}
            
            for line in lines:
                line = line.strip()
                
                # Look for various stock metrics
                if 'Market Cap:' in line:
                    parts = line.split('$')
                    if len(parts) > 1:
                        try:
                            stock_data['market_cap'] = parts[1].split()[0]
                        except:
                            pass
                
                elif 'P/E Ratio:' in line:
                    parts = line.split(':')
                    if len(parts) > 1:
                        try:
                            stock_data['pe_ratio'] = float(parts[1].strip())
                        except:
                            pass
            
            return stock_data if stock_data else None
            
        except Exception as e:
            logger.debug(f"Error extracting stock data from output: {e}")
            return None
    
    async def _fallback_crypto_data(self, symbol: str) -> Dict[str, Any]:
        """Fallback to simple crypto data if OpenBB fails"""
        try:
            import httpx
            
            symbol_mapping = {
                'BTC': 'bitcoin',
                'ETH': 'ethereum', 
                'DOT': 'polkadot',
                'LINK': 'chainlink',
                'SOL': 'solana'
            }
            
            coin_id = symbol_mapping.get(symbol.upper(), symbol.lower())
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"https://api.coingecko.com/api/v3/simple/price",
                    params={
                        'ids': coin_id,
                        'vs_currencies': 'usd',
                        'include_24hr_change': 'true'
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if coin_id in data:
                        return {
                            "current_price": data[coin_id].get('usd'),
                            "price_change_24h": data[coin_id].get('usd_24h_change'),
                            "source": "CoinGecko Fallback"
                        }
                        
            return {"error": "No fallback data available"}
            
        except Exception as e:
            return {"error": f"Fallback failed: {str(e)}"}
    
    async def _fallback_stock_data(self, symbol: str) -> Dict[str, Any]:
        """Fallback to simple stock data if OpenBB fails"""
        try:
            import httpx
            
            # Use a simple stock API as fallback
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"https://api.twelvedata.com/quote?symbol={symbol}&apikey=demo"
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if 'close' in data:
                        return {
                            "current_price": float(data['close']),
                            "price_change": float(data.get('change', 0)),
                            "source": "TwelveData Fallback"
                        }
                        
            return {"error": "No fallback stock data available"}
            
        except Exception as e:
            return {"error": f"Stock fallback failed: {str(e)}"}

# Global instance
openbb_terminal_service = OpenBBTerminalService()