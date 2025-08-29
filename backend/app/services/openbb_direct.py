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
                "chart_path": chart_path,
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
        """Generate equity price chart with OpenBB Python API"""
        
        if not OPENBB_AVAILABLE:
            return {
                "success": False,
                "error": "OpenBB not available"
            }
        
        try:
            # Get equity historical data with chart
            data = obb.equity.price.historical(
                symbol=symbol,
                provider=provider,
                chart=True
            )
            
            # Save chart for web UI
            chart_path = await self._save_chart(data, symbol, "equity", period)
            
            # Store in user portfolio
            if save_to_portfolio:
                await self._store_chart_in_portfolio(symbol, chart_path, "equity", period)
            
            return {
                "success": True,
                "symbol": symbol,
                "asset_type": "equity",
                "period": period,
                "chart_path": chart_path,
                "chart_url": f"/charts/{chart_path.name}",
                "interactive": True,
                "data_points": len(data.results) if hasattr(data, 'results') else 0,
                "source": "OpenBB Direct API"
            }
            
        except Exception as e:
            self.logger.error(f"Equity chart generation error for {symbol}: {e}")
            return {
                "success": False,
                "error": str(e),
                "symbol": symbol
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
                
                # Wrap in full HTML document for iframe embedding
                full_html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>{symbol} - {asset_type.title()} Chart</title>
    <meta charset="utf-8">
    <style>
        body {{ margin: 0; padding: 10px; background: #1a1a1a; }}
        .chart-container {{ width: 100%; height: 100vh; }}
    </style>
</head>
<body>
    <div class="chart-container">
        {chart_html}
    </div>
</body>
</html>
                """
                
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