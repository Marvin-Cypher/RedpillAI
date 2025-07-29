# Market Data API using OpenBB
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
from datetime import datetime, timedelta

from ..services.openbb_service import openbb_service, MarketData, CryptoPrice
from ..core.auth import get_current_active_user
from ..models.users import User

router = APIRouter()


@router.get("/test")
async def market_test():
    """Simple test endpoint for market data system"""
    return {
        "status": "success",
        "message": "OpenBB Platform connection ready",
        "timestamp": datetime.now().isoformat(),
        "available_features": [
            "crypto_prices",
            "historical_data",
            "technical_analysis",
            "portfolio_analysis"
        ]
    }

@router.get("/health")
async def market_health():
    """Check OpenBB market data service health"""
    try:
        return openbb_service.test_connection()
    except Exception as e:
        return {
            "status": "error",
            "message": f"OpenBB service unavailable: {str(e)}",
            "fallback": "Mock data available"
        }


@router.get("/overview", response_model=MarketData)
async def get_market_overview():
    """Get overall crypto market overview using OpenBB"""
    try:
        market_data = openbb_service.get_market_overview()
        return market_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")


@router.get("/crypto/{symbol}/price")
async def get_crypto_price(
    symbol: str,
    provider: Optional[str] = Query(None, description="Data provider (yfinance, fmp, polygon)")
):
    """Get current price for a cryptocurrency"""
    try:
        price_data = openbb_service.get_crypto_price(symbol, provider)
        
        if not price_data:
            # Fallback to mock data for demo
            mock_prices = {
                'BTC': {'price': 42500, 'change': 2.5, 'volume': 25000000000},
                'ETH': {'price': 2650, 'change': 1.8, 'volume': 12000000000},
                'AVAX': {'price': 38.5, 'change': -1.2, 'volume': 450000000},
                'MATIC': {'price': 0.85, 'change': 3.1, 'volume': 380000000},
                'SOL': {'price': 95.2, 'change': 4.2, 'volume': 1800000000}
            }
            
            if symbol in mock_prices:
                mock_data = mock_prices[symbol]
                return {
                    "symbol": f"{symbol}USD",
                    "current_price": mock_data['price'],
                    "open_price": mock_data['price'] * 0.98,
                    "high_24h": mock_data['price'] * 1.05,
                    "low_24h": mock_data['price'] * 0.95,
                    "volume_24h": mock_data['volume'],
                    "change_percent": mock_data['change'],
                    "last_updated": datetime.now().isoformat(),
                    "provider": "demo_data",
                    "source": "RedpillAI Demo"
                }
            
            raise HTTPException(
                status_code=404, 
                detail=f"Price data not available for {symbol}. Try a different provider or check symbol format."
            )
        
        return {
            "symbol": price_data.symbol,
            "current_price": price_data.close,
            "open_price": price_data.open,
            "high_24h": price_data.high,
            "low_24h": price_data.low,
            "volume_24h": price_data.volume,
            "change_percent": price_data.change_percent,
            "last_updated": price_data.date,
            "provider": provider or "auto",
            "source": "OpenBB Platform"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch price for {symbol}: {str(e)}")


@router.get("/crypto/{symbol}/historical")
async def get_crypto_historical(
    symbol: str,
    days: int = Query(30, ge=1, le=365, description="Number of days of historical data"),
    provider: Optional[str] = Query(None, description="Data provider"),
    current_user: User = Depends(get_current_active_user)
):
    """Get historical price data for a cryptocurrency"""
    try:
        historical_data = openbb_service.get_crypto_historical(symbol, days, provider)
        
        if not historical_data:
            raise HTTPException(
                status_code=404,
                detail=f"Historical data not available for {symbol}"
            )
        
        # Format for API response
        formatted_data = []
        for price in historical_data:
            formatted_data.append({
                "date": price.date,
                "open": price.open,
                "high": price.high,
                "low": price.low,
                "close": price.close,
                "volume": price.volume,
                "change_percent": price.change_percent
            })
        
        return {
            "symbol": symbol,
            "data": formatted_data,
            "period_days": days,
            "data_points": len(formatted_data),
            "provider": provider or "auto",
            "source": "OpenBB Platform"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical data: {str(e)}")


@router.get("/crypto/{symbol}/analysis")
async def get_crypto_analysis(
    symbol: str,
    indicator: str = Query("sma", description="Technical indicator (sma, rsi, macd)"),
    current_user: User = Depends(get_current_active_user)
):
    """Get technical analysis for a cryptocurrency"""
    try:
        analysis = openbb_service.get_technical_indicators(symbol, indicator)
        
        if "error" in analysis:
            raise HTTPException(status_code=404, detail=analysis["error"])
        
        return {
            **analysis,
            "source": "OpenBB Platform"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze {symbol}: {str(e)}")


@router.get("/news")
async def get_crypto_news(
    symbol: Optional[str] = Query(None, description="Crypto symbol for specific news"),
    limit: int = Query(10, ge=1, le=50, description="Number of news articles"),
    current_user: User = Depends(get_current_active_user)
):
    """Get crypto-related news"""
    try:
        news_data = openbb_service.search_crypto_news(symbol, limit)
        
        return {
            "news": news_data,
            "symbol": symbol,
            "count": len(news_data),
            "source": "OpenBB Platform"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch news: {str(e)}")


@router.get("/defi/protocols")
async def get_defi_protocols(
    current_user: User = Depends(get_current_active_user)
):
    """Get DeFi protocol information"""
    try:
        protocols = openbb_service.get_defi_protocols()
        
        return {
            "protocols": protocols,
            "count": len(protocols),
            "source": "OpenBB Platform",
            "note": "Enhanced DeFi data available with proper OpenBB configuration"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch DeFi data: {str(e)}")


@router.post("/portfolio/analyze")
async def analyze_portfolio(
    portfolio_data: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """Analyze portfolio risk using OpenBB"""
    try:
        symbols = portfolio_data.get("symbols", [])
        weights = portfolio_data.get("weights", [])
        
        if len(symbols) != len(weights):
            raise HTTPException(
                status_code=400,
                detail="Symbols and weights arrays must have the same length"
            )
        
        analysis = openbb_service.analyze_portfolio_risk(symbols, weights)
        
        return {
            **analysis,
            "source": "OpenBB Platform"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portfolio analysis failed: {str(e)}")


@router.get("/providers")
async def get_available_providers(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of available OpenBB data providers"""
    try:
        providers = openbb_service.get_available_providers()
        
        return {
            "providers": providers,
            "source": "OpenBB Platform",
            "note": "Some providers require API keys for full functionality"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get providers: {str(e)}")


@router.get("/trending")
async def get_trending_cryptos(
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user)
):
    """Get trending cryptocurrencies (placeholder - enhance with real OpenBB data)"""
    try:
        # For now, return major cryptos with current prices
        major_cryptos = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'LINK', 'UNI', 'ATOM', 'NEAR']
        trending_data = []
        
        for symbol in major_cryptos[:limit]:
            try:
                price_data = openbb_service.get_crypto_price(symbol)
                if price_data:
                    trending_data.append({
                        "symbol": price_data.symbol,
                        "current_price": price_data.close,
                        "change_percent": price_data.change_percent or 0,
                        "volume": price_data.volume,
                        "market_cap": None,  # Would require additional API calls
                        "rank": len(trending_data) + 1
                    })
            except:
                continue
        
        return {
            "trending": trending_data,
            "count": len(trending_data),
            "source": "OpenBB Platform",
            "note": "Enhanced trending data available with market cap APIs"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get trending data: {str(e)}")


@router.get("/search")
async def search_assets(
    query: str = Query(..., min_length=1, description="Search query for assets"),
    asset_type: str = Query("crypto", description="Asset type (crypto, equity, etf)"),
    current_user: User = Depends(get_current_active_user)
):
    """Search for assets across different categories"""
    try:
        # Basic search implementation
        # This can be enhanced with OpenBB's search capabilities
        
        results = []
        
        if asset_type == "crypto":
            # Simple crypto symbol matching
            crypto_symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'LINK', 'UNI', 'ATOM', 'NEAR']
            matched_symbols = [s for s in crypto_symbols if query.upper() in s]
            
            for symbol in matched_symbols[:5]:
                try:
                    price_data = openbb_service.get_crypto_price(symbol)
                    if price_data:
                        results.append({
                            "symbol": symbol,
                            "name": f"{symbol} Token",  # Would need name mapping
                            "type": "cryptocurrency",
                            "current_price": price_data.close,
                            "change_percent": price_data.change_percent
                        })
                except:
                    continue
        
        return {
            "query": query,
            "asset_type": asset_type,
            "results": results,
            "count": len(results),
            "source": "OpenBB Platform"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")