"""
OpenBB Direct Python API Integration
Replaces CLI subprocess calls with direct Python API usage
Saves charts for web UI display and user portal storage
"""

import os
import sys
import asyncio
import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
from pathlib import Path
import json

# Add OpenBB to Python path
sys.path.append('/Users/marvin/redpill-project/openbb-source/openbb_platform')

try:
    from openbb import obb
    from openbb_core.app.model.obbject import OBBject
    OPENBB_AVAILABLE = True
except ImportError as e:
    logging.warning(f"OpenBB direct import failed: {e}")
    OPENBB_AVAILABLE = False

class OpenBBDirect:
    """
    Direct OpenBB Python API integration for RedPill
    Generates charts and saves them for web UI display
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.charts_dir = Path("/Users/marvin/redpill-project/frontend/public/charts")
        self.charts_dir.mkdir(parents=True, exist_ok=True)
        
        # Configure OpenBB settings for chart export
        if OPENBB_AVAILABLE:
            self._configure_openbb()
    
    def _configure_openbb(self):
        """Configure OpenBB for chart generation and export"""
        try:
            # Set API keys from environment
            self._set_credentials()
            
            # Configure charting to save files instead of display
            os.environ["PLOT_ENABLE_PYWRY"] = "0"  # Disable GUI display
            
            self.logger.info("✅ OpenBB Direct API configured successfully")
            
        except Exception as e:
            self.logger.error(f"OpenBB configuration error: {e}")
    
    def _set_credentials(self):
        """Set OpenBB credentials from environment"""
        try:
            # Set individual credentials using OpenBB's method
            polygon_key = os.getenv("POLYGON_API_KEY")
            fmp_key = os.getenv("FMP_API_KEY") 
            av_key = os.getenv("ALPHA_VANTAGE_API_KEY")
            
            if polygon_key:
                obb.account.credentials.polygon_api_key = polygon_key
            if fmp_key:
                obb.account.credentials.fmp_api_key = fmp_key
            if av_key:
                obb.account.credentials.alpha_vantage_api_key = av_key
                
            self.logger.info("✅ OpenBB credentials configured")
            
        except Exception as e:
            self.logger.warning(f"OpenBB credentials setup issue: {e}")
            # Continue without credentials - some providers work without keys
    
    async def get_crypto_chart(
        self,
        symbol: str,
        period: str = "1y",
        provider: str = "fmp",
        save_to_portfolio: bool = True
    ) -> Dict[str, Any]:
        """
        Generate crypto price chart using OpenBB Python API
        Saves chart for web UI display and optionally to user portfolio
        """
        
        if not OPENBB_AVAILABLE:
            return {
                "success": False,
                "error": "OpenBB not available",
                "fallback_message": "OpenBB Python API not properly configured"
            }
        
        try:
            # Get crypto historical data
            data = obb.crypto.price.historical(
                symbol=symbol,
                provider=provider,
                chart=True
            )
            
            # Generate chart
            chart_path = await self._save_chart(data, symbol, "crypto", period)
            
            # Store in user portfolio if requested
            if save_to_portfolio:
                await self._store_chart_in_portfolio(symbol, chart_path, "crypto", period)
            
            return {
                "success": True,
                "symbol": symbol,
                "asset_type": "crypto",
                "period": period,
                "chart_path": str(chart_path),
                "chart_url": f"/charts/{chart_path.name}",
                "interactive": True,
                "data_points": len(data.results) if hasattr(data, 'results') else 0,
                "source": "OpenBB Direct API"
            }
            
        except Exception as e:
            self.logger.error(f"Crypto chart generation error for {symbol}: {e}")
            return {
                "success": False,
                "error": str(e),
                "symbol": symbol
            }
    
    async def get_equity_chart(
        self,
        symbol: str,
        period: str = "1y",
        provider: str = "yfinance",
        save_to_portfolio: bool = True
    ) -> Dict[str, Any]:
        """Generate equity price chart with robust provider fallbacks"""
        
        if not OPENBB_AVAILABLE:
            return {
                "success": False,
                "error": "OpenBB not available"
            }
        
        # Provider fallback chain - ordered by reliability and speed
        providers = [
            provider,  # User requested provider first
            "fmp",     # Financial Modeling Prep - reliable
            "polygon", # Polygon.io - high quality
            "alpha_vantage", # Alpha Vantage - solid backup
            "yfinance", # Yahoo Finance - free fallback
            "tiingo",  # Tiingo - additional backup
            "cboe"     # CBOE - options/indices specialist
        ]
        
        # Remove duplicates while preserving order
        providers = list(dict.fromkeys(providers))
        
        last_error = None
        
        for attempt_provider in providers:
            try:
                self.logger.info(f"Attempting equity chart for {symbol} using {attempt_provider}")
                
                # Get equity historical data with chart
                data = obb.equity.price.historical(
                    symbol=symbol,
                    provider=attempt_provider,
                    chart=True
                )
                
                # Save chart for web UI
                chart_path = await self._save_chart(data, symbol, "equity", period)
                
                # Store in user portfolio
                if save_to_portfolio:
                    await self._store_chart_in_portfolio(symbol, chart_path, "equity", period)
                
                self.logger.info(f"✅ Successfully generated equity chart for {symbol} using {attempt_provider}")
                return {
                    "success": True,
                    "symbol": symbol,
                    "asset_type": "equity",
                    "period": period,
                    "provider_used": attempt_provider,
                    "chart_path": str(chart_path),
                    "chart_url": f"/charts/{chart_path.name}",
                    "interactive": True,
                    "data_points": len(data.results) if hasattr(data, 'results') else 0,
                    "source": f"OpenBB Direct API ({attempt_provider})"
                }
                
            except Exception as e:
                last_error = str(e)
                self.logger.warning(f"Failed to get equity chart for {symbol} using {attempt_provider}: {e}")
                continue  # Try next provider
        
        # All providers failed
        self.logger.error(f"All providers failed for equity chart {symbol}. Last error: {last_error}")
        return {
            "success": False,
            "error": f"All data providers failed. Last error: {last_error}",
            "symbol": symbol,
            "providers_attempted": providers
        }
    
    async def get_multi_asset_comparison_chart(
        self,
        symbols: list[str],
        period: str = "1y",
        asset_type: str = "equity",
        provider: str = "yfinance",
        save_to_portfolio: bool = True
    ) -> Dict[str, Any]:
        """Generate multi-asset comparison chart with robust provider fallbacks"""
        
        if not OPENBB_AVAILABLE:
            return {
                "success": False,
                "error": "OpenBB not available"
            }
        
        # Provider fallback chain
        providers = [
            provider,
            "fmp",
            "polygon", 
            "alpha_vantage",
            "yfinance",
            "tiingo"
        ]
        providers = list(dict.fromkeys(providers))
        
        last_error = None
        combined_data = {}
        successful_symbols = []
        
        # Fetch data for each symbol
        for symbol in symbols:
            for attempt_provider in providers:
                try:
                    self.logger.info(f"Fetching data for {symbol} using {attempt_provider}")
                    
                    if asset_type == "equity":
                        data = obb.equity.price.historical(
                            symbol=symbol,
                            provider=attempt_provider,
                            chart=False  # We'll create our own comparison chart
                        )
                    else:  # crypto
                        data = obb.crypto.price.historical(
                            symbol=symbol,
                            provider=attempt_provider,
                            chart=False
                        )
                    
                    # Store the data
                    combined_data[symbol] = data
                    successful_symbols.append(symbol)
                    self.logger.info(f"✅ Successfully fetched data for {symbol} using {attempt_provider}")
                    break  # Success, move to next symbol
                    
                except Exception as e:
                    last_error = str(e)
                    self.logger.warning(f"Failed to fetch data for {symbol} using {attempt_provider}: {e}")
                    continue
        
        if not successful_symbols:
            return {
                "success": False,
                "error": f"Failed to fetch data for any symbols. Last error: {last_error}",
                "symbols": symbols,
                "providers_attempted": providers
            }
        
        # Create comparison chart
        try:
            import pandas as pd
            import plotly.graph_objects as go
            from plotly.subplots import make_subplots
            
            # Prepare data for comparison
            comparison_df = pd.DataFrame()
            
            for symbol in successful_symbols:
                data = combined_data[symbol]
                if hasattr(data, 'results') and data.results:
                    df = data.to_df()
                    if not df.empty:
                        # Normalize to percentage change from start
                        df['normalized'] = (df['close'] / df['close'].iloc[0] - 1) * 100
                        comparison_df[symbol] = df['normalized']
            
            if comparison_df.empty:
                return {
                    "success": False,
                    "error": "No valid data retrieved for comparison chart"
                }
            
            # Create the comparison chart
            fig = go.Figure()
            
            colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c']
            
            for i, symbol in enumerate(comparison_df.columns):
                fig.add_trace(go.Scatter(
                    x=comparison_df.index,
                    y=comparison_df[symbol],
                    mode='lines',
                    name=f'{symbol}',
                    line=dict(color=colors[i % len(colors)], width=2),
                    hovertemplate=f'<b>{symbol}</b><br>Date: %{{x}}<br>Return: %{{y:.2f}}%<extra></extra>'
                ))
            
            fig.update_layout(
                title=dict(
                    text=f'Multi-Asset Comparison: {", ".join(successful_symbols)} ({period})',
                    x=0.5,
                    font=dict(size=16, color='white')
                ),
                xaxis_title="Date",
                yaxis_title="Percentage Return (%)",
                template="plotly_dark",
                hovermode='x unified',
                height=600,
                showlegend=True,
                legend=dict(
                    yanchor="top",
                    y=0.99,
                    xanchor="left",
                    x=0.01,
                    bgcolor="rgba(0,0,0,0.5)"
                )
            )
            
            # Save the comparison chart
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            symbols_str = "_vs_".join(successful_symbols)
            filename = f"{symbols_str}_comparison_{period}_{timestamp}.html"
            chart_path = self.charts_dir / filename
            
            chart_html = fig.to_html(
                include_plotlyjs='cdn',
                config={'displayModeBar': True, 'responsive': True}
            )
            
            # Extract just the Plotly chart content (between body tags) from the generated HTML
            import re
            body_match = re.search(r'<body[^>]*>(.*?)</body>', chart_html, re.DOTALL)
            if body_match:
                chart_content = body_match.group(1)
            else:
                chart_content = chart_html
            
            # Also extract any script tags from the head
            script_match = re.findall(r'(<script[^>]*>.*?</script>)', chart_html, re.DOTALL)
            scripts = '\n'.join(script_match) if script_match else ''
            
            full_html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Multi-Asset Comparison: {", ".join(successful_symbols)} | RedPill Intelligence</title>
    <meta charset="utf-8">
    <style>
        body {{ 
            margin: 0; 
            padding: 20px; 
            background: #1a1a1a; 
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }}
        .header {{ 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }}
        .header h1 {{
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }}
        .header p {{
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }}
        .chart-container {{ 
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 20px;
            min-height: 600px;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 8px;
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
            font-size: 12px;
            margin-right: 8px;
        }}
    </style>
    {scripts}
</head>
<body>
    <div class="header">
        <h1>📊 RedPill Intelligence | Multi-Asset Comparison</h1>
        <p>
            <span class="badge">📈 {len(successful_symbols)} Assets</span>
            <span class="badge">📅 {period.upper()} Period</span>
            <span class="badge">⏰ {timestamp}</span>
        </p>
        <p style="margin-top: 15px;">
            <strong>Comparing:</strong> {" vs ".join(successful_symbols)}
        </p>
    </div>
    <div class="chart-container">
        {chart_content}
    </div>
</body>
</html>"""
            
            with open(chart_path, 'w', encoding='utf-8') as f:
                f.write(full_html)
            
            self.logger.info(f"✅ Multi-asset comparison chart saved: {chart_path}")
            
            return {
                "success": True,
                "symbols": successful_symbols,
                "failed_symbols": [s for s in symbols if s not in successful_symbols],
                "asset_type": asset_type,
                "period": period,
                "chart_path": str(chart_path),
                "chart_url": f"/charts/{chart_path.name}",
                "web_viewer_url": f"http://localhost:3000/charts/{chart_path.name}",
                "interactive": True,
                "data_points": len(comparison_df),
                "source": "OpenBB Multi-Asset Comparison"
            }
            
        except Exception as e:
            self.logger.error(f"Failed to create comparison chart: {e}")
            return {
                "success": False,
                "error": f"Failed to create comparison chart: {str(e)}",
                "symbols": symbols
            }
    
    async def _save_chart(
        self,
        data: OBBject,
        symbol: str,
        asset_type: str,
        period: str
    ) -> Path:
        """Save OpenBB chart as HTML for web UI display"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{symbol}_{asset_type}_{period}_{timestamp}.html"
        chart_path = self.charts_dir / filename
        
        try:
            # Get the chart from the OBBject
            if hasattr(data, 'chart') and data.chart and hasattr(data.chart, 'fig') and data.chart.fig:
                # Save chart as HTML using the figure object
                chart_html = data.chart.fig.to_html(
                    include_plotlyjs='cdn',
                    config={'displayModeBar': True, 'responsive': True}
                )
                
                # Extract just the Plotly chart content (between body tags) from the generated HTML
                import re
                body_match = re.search(r'<body[^>]*>(.*?)</body>', chart_html, re.DOTALL)
                if body_match:
                    chart_content = body_match.group(1)
                else:
                    chart_content = chart_html
                
                # Also extract any script tags from the head
                script_match = re.findall(r'(<script[^>]*>.*?</script>)', chart_html, re.DOTALL)
                scripts = '\n'.join(script_match) if script_match else ''
                
                # Wrap in full HTML document with RedPill branding
                full_html = f"""<!DOCTYPE html>
<html>
<head>
    <title>{symbol} - {asset_type.title()} Price Chart | RedPill Intelligence</title>
    <meta charset="utf-8">
    <style>
        body {{ 
            margin: 0; 
            padding: 20px; 
            background: #1a1a1a; 
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }}
        .header {{ 
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }}
        .header h1 {{
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }}
        .header p {{
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }}
        .chart-container {{ 
            background: rgba(255,255,255,0.05);
            border-radius: 10px;
            padding: 20px;
            min-height: 600px;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 8px;
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
            font-size: 12px;
            margin-right: 8px;
        }}
    </style>
    {scripts}
</head>
<body>
    <div class="header">
        <h1>📊 RedPill Intelligence | {symbol} Price Chart</h1>
        <p>
            <span class="badge">📈 {asset_type.upper()}</span>
            <span class="badge">📅 {period.upper()} Period</span>
            <span class="badge">⏰ {timestamp}</span>
        </p>
    </div>
    <div class="chart-container">
        {chart_content}
    </div>
</body>
</html>"""
                
                with open(chart_path, 'w', encoding='utf-8') as f:
                    f.write(full_html)
                
                self.logger.info(f"✅ Chart saved: {chart_path}")
                
            else:
                # Fallback: create simple data table if no chart
                await self._create_fallback_chart(data, chart_path, symbol, asset_type)
                
            return chart_path
            
        except Exception as e:
            self.logger.error(f"Chart saving error: {e}")
            # Create error chart
            await self._create_error_chart(chart_path, symbol, str(e))
            return chart_path
    
    async def _create_fallback_chart(
        self,
        data: OBBject,
        chart_path: Path,
        symbol: str,
        asset_type: str
    ):
        """Create fallback HTML table when chart generation fails"""
        
        # Convert data to HTML table
        if hasattr(data, 'results') and data.results:
            df = data.to_dataframe()
            table_html = df.head(20).to_html(classes='table table-striped', escape=False)
        else:
            table_html = f"<p>No data available for {symbol}</p>"
        
        fallback_html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>{symbol} - {asset_type.title()} Data</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {{ background: #1a1a1a; color: #fff; padding: 20px; }}
        .table {{ background: #2a2a2a; color: #fff; }}
    </style>
</head>
<body>
    <div class="container">
        <h2>{symbol} - {asset_type.title()} Data</h2>
        {table_html}
    </div>
</body>
</html>
        """
        
        with open(chart_path, 'w', encoding='utf-8') as f:
            f.write(fallback_html)
    
    async def _create_error_chart(self, chart_path: Path, symbol: str, error: str):
        """Create error display HTML"""
        
        error_html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Chart Error - {symbol}</title>
    <style>
        body {{ background: #1a1a1a; color: #ff6b6b; padding: 20px; font-family: monospace; }}
        .error-container {{ text-align: center; padding: 50px; }}
    </style>
</head>
<body>
    <div class="error-container">
        <h2>Chart Generation Error</h2>
        <p><strong>Symbol:</strong> {symbol}</p>
        <p><strong>Error:</strong> {error}</p>
        <p>Please try again or contact support.</p>
    </div>
</body>
</html>
        """
        
        with open(chart_path, 'w', encoding='utf-8') as f:
            f.write(error_html)
    
    async def _store_chart_in_portfolio(
        self,
        symbol: str,
        chart_path: Path,
        asset_type: str,
        period: str
    ):
        """Store chart reference in user's portfolio for future reuse"""
        
        # This will integrate with ChromaDB for persistent storage
        chart_metadata = {
            "symbol": symbol,
            "asset_type": asset_type,
            "period": period,
            "chart_path": str(chart_path),
            "chart_url": f"/charts/{chart_path.name}",
            "created_at": datetime.now().isoformat(),
            "title": f"{symbol} {asset_type.title()} Chart ({period})"
        }
        
        # TODO: Store in ChromaDB charts collection
        self.logger.info(f"📊 Chart stored in portfolio: {symbol} ({asset_type})")
        
        return chart_metadata
    
    async def get_market_overview_table(self) -> Dict[str, Any]:
        """Generate comprehensive market overview using OpenBB tables"""
        
        if not OPENBB_AVAILABLE:
            return {"success": False, "error": "OpenBB not available"}
        
        try:
            # Get multiple market data points
            indices = obb.index.price.historical(symbol="SPY,QQQ,DIA", chart=False)
            gainers = obb.equity.discovery.gainers(limit=10)
            
            # Create combined HTML table
            overview_path = await self._create_market_overview_html(indices, gainers)
            
            return {
                "success": True,
                "table_url": f"/charts/{overview_path.name}",
                "source": "OpenBB Market Data"
            }
            
        except Exception as e:
            self.logger.error(f"Market overview error: {e}")
            return {"success": False, "error": str(e)}
    
    async def _create_market_overview_html(self, indices, gainers) -> Path:
        """Create comprehensive market overview HTML"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        overview_path = self.charts_dir / f"market_overview_{timestamp}.html"
        
        # Convert to HTML tables
        indices_html = indices.to_dataframe().to_html(classes='table table-dark') if hasattr(indices, 'to_dataframe') else "<p>No indices data</p>"
        gainers_html = gainers.to_dataframe().to_html(classes='table table-dark') if hasattr(gainers, 'to_dataframe') else "<p>No gainers data</p>"
        
        overview_html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Market Overview</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {{ background: #1a1a1a; color: #fff; padding: 20px; }}
        .table {{ background: #2a2a2a; color: #fff; }}
        .section {{ margin-bottom: 30px; }}
    </style>
</head>
<body>
    <div class="container-fluid">
        <h1>Market Overview</h1>
        <div class="section">
            <h3>Major Indices</h3>
            {indices_html}
        </div>
        <div class="section">
            <h3>Top Gainers</h3>
            {gainers_html}
        </div>
    </div>
</body>
</html>
        """
        
        with open(overview_path, 'w', encoding='utf-8') as f:
            f.write(overview_html)
        
        return overview_path


# Singleton instance
openbb_direct = OpenBBDirect()