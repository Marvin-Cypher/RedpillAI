# Market Data API using OpenBB
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
from datetime import datetime, timedelta

from ..services.market_data_service import market_data_service
from ..services.openbb_service import MarketData, CryptoPrice, EquityPrice, FundamentalData
from ..services.news_service import news_service
from ..core.auth import get_current_active_user
from ..models.users import User

logger = logging.getLogger(__name__)

router = APIRouter()


# @router.get("/test")
# async def market_test():
#     """Simple test endpoint for market data system - REMOVED"""
#     return {
#         "status": "success",
#         "message": "OpenBB Platform connection ready",
#         "timestamp": datetime.now().isoformat(),
#         "available_features": [
#             "crypto_prices",
#             "historical_data",
#             "technical_analysis",
#             "portfolio_analysis"
#         ]
#     }

@router.get("/health")
async def market_health():
    """Check OpenBB market data service health"""
    try:
        return await market_data_service.test_connection()
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
        market_data = await market_data_service.get_market_overview()
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
        price_data = await market_data_service.get_crypto_price(symbol, provider)
        
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
        historical_data = await market_data_service.get_crypto_historical(symbol, days, provider)
        
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
        analysis = await market_data_service.get_technical_indicators(symbol, indicator)
        
        if "error" in analysis:
            raise HTTPException(status_code=404, detail=analysis["error"])
        
        return {
            **analysis,
            "source": "OpenBB Platform"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze {symbol}: {str(e)}")


@router.get("/news")
async def get_company_news(
    symbol: Optional[str] = Query(None, description="Company symbol or name for specific news"),
    limit: int = Query(5, ge=1, le=10, description="Number of news articles"),
    current_user: User = Depends(get_current_active_user)
):
    """Get company news using Google Search API"""
    try:
        # Use symbol as company name for news search
        company_name = symbol if symbol else "crypto market"
        company_type = "crypto" if symbol else "general"
        
        async with news_service as service:
            news_articles = await service.get_company_news(
                company_name=company_name,
                company_type=company_type,
                limit=limit
            )
        
        return {
            "news": news_articles,
            "company": company_name,
            "count": len(news_articles),
            "source": "Google Search API"
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch news for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch news: {str(e)}")


@router.get("/defi/protocols")
async def get_defi_protocols(
    current_user: User = Depends(get_current_active_user)
):
    """Get DeFi protocol information"""
    try:
        protocols = await market_data_service.get_defi_protocols()
        
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
        
        analysis = await market_data_service.analyze_portfolio_risk(symbols, weights)
        
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
        providers = await market_data_service.get_available_providers()
        
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
                price_data = await market_data_service.get_crypto_price(symbol)
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
                    price_data = await market_data_service.get_crypto_price(symbol)
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


# ========================
# EQUITY ENDPOINTS
# ========================

@router.get("/equity/{ticker}/price")
async def get_equity_price(
    ticker: str,
    provider: Optional[str] = Query(None, description="Data provider (yfinance, fmp, polygon)"),
    current_user: User = Depends(get_current_active_user)
):
    """Get current price for an equity/stock"""
    try:
        price_data = await market_data_service.get_equity_price(ticker, provider)
        
        if not price_data:
            # Fallback to mock data for demo
            mock_prices = {
                'AAPL': {'price': 175.50, 'change': 1.2, 'volume': 65000000},
                'TSLA': {'price': 185.20, 'change': -2.1, 'volume': 95000000},
                'MSFT': {'price': 415.30, 'change': 0.8, 'volume': 32000000},
                'GOOGL': {'price': 142.80, 'change': 1.5, 'volume': 28000000},
                'AMZN': {'price': 165.90, 'change': -0.3, 'volume': 41000000}
            }
            
            if ticker in mock_prices:
                mock_data = mock_prices[ticker]
                return {
                    "symbol": ticker,
                    "current_price": mock_data['price'],
                    "open_price": mock_data['price'] * 0.99,
                    "high_24h": mock_data['price'] * 1.02,
                    "low_24h": mock_data['price'] * 0.98,
                    "volume_24h": mock_data['volume'],
                    "change_percent": mock_data['change'],
                    "last_updated": datetime.now().isoformat(),
                    "provider": "demo_data",
                    "source": "RedpillAI Demo"
                }
            
            raise HTTPException(
                status_code=404, 
                detail=f"Price data not available for {ticker}. Try a different provider or check ticker symbol."
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
        raise HTTPException(status_code=500, detail=f"Failed to fetch price for {ticker}: {str(e)}")


@router.get("/equity/{ticker}/historical")
async def get_equity_historical(
    ticker: str,
    days: int = Query(252, ge=1, le=1260, description="Number of days of historical data (default: 1 year)"),
    provider: Optional[str] = Query(None, description="Data provider"),
    current_user: User = Depends(get_current_active_user)
):
    """Get historical price data for an equity/stock"""
    try:
        historical_data = await market_data_service.get_equity_historical(ticker, days, provider)
        
        if not historical_data:
            raise HTTPException(
                status_code=404,
                detail=f"Historical data not available for {ticker}"
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
            "symbol": ticker,
            "data": formatted_data,
            "period_days": days,
            "data_points": len(formatted_data),
            "provider": provider or "auto",
            "source": "OpenBB Platform"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch historical data: {str(e)}")


@router.get("/equity/{ticker}/fundamentals")
async def get_equity_fundamentals(
    ticker: str,
    provider: Optional[str] = Query(None, description="Data provider"),
    current_user: User = Depends(get_current_active_user)
):
    """Get fundamental financial data for an equity/stock"""
    try:
        fundamentals = await market_data_service.get_equity_fundamentals(ticker, provider)
        
        if not fundamentals:
            # Fallback to mock data for demo
            mock_fundamentals = {
                'AAPL': {
                    'market_cap': 2800000000000,
                    'pe_ratio': 28.5,
                    'revenue_ttm': 394000000000,
                    'gross_margin': 0.46,
                    'profit_margin': 0.26,
                    'debt_ratio': 0.32,
                    'price_to_book': 39.8,
                    'dividend_yield': 0.0044
                },
                'TSLA': {
                    'market_cap': 580000000000,
                    'pe_ratio': 45.2,
                    'revenue_ttm': 96000000000,
                    'gross_margin': 0.19,
                    'profit_margin': 0.08,
                    'debt_ratio': 0.09,
                    'price_to_book': 9.1,
                    'dividend_yield': 0.0
                }
            }
            
            if ticker in mock_fundamentals:
                mock_data = mock_fundamentals[ticker]
                return {
                    "symbol": ticker,
                    **mock_data,
                    "provider": "demo_data",
                    "source": "RedpillAI Demo"
                }
            
            raise HTTPException(
                status_code=404,
                detail=f"Fundamental data not available for {ticker}"
            )
        
        return {
            "symbol": fundamentals.symbol,
            "market_cap": fundamentals.market_cap,
            "pe_ratio": fundamentals.pe_ratio,
            "revenue_ttm": fundamentals.revenue_ttm,
            "gross_margin": fundamentals.gross_margin,
            "profit_margin": fundamentals.profit_margin,
            "debt_ratio": fundamentals.debt_ratio,
            "price_to_book": fundamentals.price_to_book,
            "dividend_yield": fundamentals.dividend_yield,
            "provider": provider or "auto",
            "source": "OpenBB Platform"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch fundamentals for {ticker}: {str(e)}")


@router.get("/equity/compare")
async def compare_equities(
    tickers: str = Query(..., description="Comma-separated ticker symbols (e.g., AAPL,MSFT,GOOGL)"),
    provider: Optional[str] = Query(None, description="Data provider"),
    current_user: User = Depends(get_current_active_user)
):
    """Compare fundamental metrics across multiple equities"""
    try:
        ticker_list = [t.strip().upper() for t in tickers.split(',')]
        
        if len(ticker_list) > 10:
            raise HTTPException(
                status_code=400,
                detail="Too many tickers requested. Maximum 10 allowed."
            )
        
        comparison_data = await market_data_service.compare_equities(ticker_list, provider)
        
        if "error" in comparison_data:
            raise HTTPException(status_code=500, detail=comparison_data["error"])
        
        return {
            **comparison_data,
            "requested_tickers": ticker_list,
            "source": "OpenBB Platform"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")


@router.get("/equity/{ticker}/news")
async def get_equity_news(
    ticker: str,
    limit: int = Query(5, ge=1, le=10, description="Number of news articles"),
    current_user: User = Depends(get_current_active_user)
):
    """Get news for a specific equity/stock using Google Search API"""
    try:
        # Use ticker as company name for news search
        async with news_service as service:
            news_articles = await service.get_company_news(
                company_name=ticker,
                company_type="public",
                limit=limit
            )
        
        return {
            "news": news_articles,
            "ticker": ticker,
            "count": len(news_articles),
            "source": "Google Search API"
        }
        
    except Exception as e:
        logger.error(f"Failed to fetch news for {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch news for {ticker}: {str(e)}")


@router.get("/sector/{sector}")
async def get_sector_data(
    sector: str,
    provider: Optional[str] = Query(None, description="Data provider"),
    current_user: User = Depends(get_current_active_user)
):
    """Get sector/industry data and analysis"""
    try:
        sector_data = await market_data_service.get_sector_data(sector, provider)
        
        if "error" in sector_data:
            raise HTTPException(status_code=500, detail=sector_data["error"])
        
        return {
            **sector_data,
            "source": "OpenBB Platform"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch sector data for {sector}: {str(e)}")