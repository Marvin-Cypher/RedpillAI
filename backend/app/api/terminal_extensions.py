"""
Terminal API Extensions - Additional OpenBB-style features
"""

from typing import Dict, Any
from .terminal import CommandResponse

async def _execute_market_overview(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
    """Execute market overview analysis"""
    try:
        from ..services.builtin_market_service import builtin_market_service
        
        market_data = await builtin_market_service.get_market_overview()
        
        if "error" in market_data:
            return CommandResponse(
                success=False,
                message=f"❌ Market overview error: {market_data['error']}",
                data=market_data
            )
        
        # Format market overview message
        message_parts = ["📊 Market Overview\n"]
        
        if "market_indices" in market_data:
            message_parts.append("📈 Major Indices:")
            for name, data in market_data["market_indices"].items():
                change_emoji = "📈" if data.get("change_pct", 0) >= 0 else "📉"
                message_parts.append(
                    f"  {change_emoji} {name}: ${data['price']:.2f} ({data.get('change_pct', 0):+.2f}%)"
                )
            message_parts.append("")
        
        if "crypto_markets" in market_data:
            message_parts.append("🪙 Crypto Markets:")
            for symbol, data in market_data["crypto_markets"].items():
                change_emoji = "📈" if data.get("change_24h", 0) >= 0 else "📉"
                message_parts.append(
                    f"  {change_emoji} {symbol}: ${data['price']:,.2f} ({data.get('change_24h', 0):+.2f}%)"
                )
        
        return CommandResponse(
            success=True,
            message="\n".join(message_parts),
            data=market_data
        )
        
    except Exception as e:
        return CommandResponse(
            success=False,
            message="❌ Market overview error",
            data={"error": str(e)}
        )

async def _execute_sector_analysis(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
    """Execute sector analysis"""
    try:
        from ..services.builtin_market_service import builtin_market_service
        
        # Extract sector from entities if available
        entities = intent.get("entities", {})
        sector = entities.get("sector") or entities.get("topic")
        
        sector_data = await builtin_market_service.get_sector_analysis(sector)
        
        if "error" in sector_data:
            return CommandResponse(
                success=False,
                message=f"❌ Sector analysis error: {sector_data['error']}",
                data=sector_data
            )
        
        # Format sector analysis message
        if sector and "price" in sector_data:
            # Single sector analysis
            change_emoji = "📈" if sector_data.get("change_pct", 0) >= 0 else "📉"
            message = f"🏭 Sector Analysis: {sector}\n{change_emoji} Price: ${sector_data['price']:.2f} ({sector_data.get('change_pct', 0):+.2f}%)"
        else:
            # Multiple sectors overview
            message_parts = ["🏭 Sector Performance\n"]
            if "sector_performance" in sector_data:
                for sector_name, data in sector_data["sector_performance"].items():
                    change_emoji = "📈" if data.get("change_pct", 0) >= 0 else "📉"
                    message_parts.append(
                        f"  {change_emoji} {sector_name}: ${data['price']:.2f} ({data.get('change_pct', 0):+.2f}%)"
                    )
            message = "\n".join(message_parts)
        
        return CommandResponse(
            success=True,
            message=message,
            data=sector_data
        )
        
    except Exception as e:
        return CommandResponse(
            success=False,
            message="❌ Sector analysis error",
            data={"error": str(e)}
        )

async def _execute_options_analysis(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
    """Execute options analysis"""
    try:
        from ..services.builtin_market_service import builtin_market_service
        
        # Extract symbol from entities
        entities = intent.get("entities", {})
        tickers = entities.get("tickers", [])
        companies = entities.get("companies", [])
        
        symbol = tickers[0] if tickers else (companies[0] if companies else "SPY")
        
        options_data = await builtin_market_service.get_options_data(symbol)
        
        message = f"📊 Options Analysis for {symbol}\n{options_data.get('message', 'Options data analysis')}"
        if options_data.get('note'):
            message += f"\n💡 {options_data['note']}"
        
        return CommandResponse(
            success=True,
            message=message,
            data=options_data
        )
        
    except Exception as e:
        return CommandResponse(
            success=False,
            message="❌ Options analysis error",
            data={"error": str(e)}
        )

async def _execute_earnings_analysis(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
    """Execute earnings analysis"""
    try:
        from ..services.builtin_market_service import builtin_market_service
        
        # Extract symbol from entities
        entities = intent.get("entities", {})
        tickers = entities.get("tickers", [])
        companies = entities.get("companies", [])
        
        symbol = tickers[0] if tickers else (companies[0] if companies else "AAPL")
        
        earnings_data = await builtin_market_service.get_earnings_data(symbol)
        
        message = f"📈 Earnings Analysis for {symbol}\n{earnings_data.get('message', 'Earnings analysis')}"
        if earnings_data.get('note'):
            message += f"\n💡 {earnings_data['note']}"
        
        return CommandResponse(
            success=True,
            message=message,
            data=earnings_data
        )
        
    except Exception as e:
        return CommandResponse(
            success=False,
            message="❌ Earnings analysis error",
            data={"error": str(e)}
        )

async def _execute_economic_data(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
    """Execute economic data analysis"""
    try:
        from ..services.builtin_market_service import builtin_market_service
        
        # Extract indicator from entities or command text
        command_text = intent.get("text", "").lower()
        
        # Map command keywords to indicators
        if "gdp" in command_text:
            indicator = "gdp"
        elif "inflation" in command_text:
            indicator = "inflation"
        elif "unemployment" in command_text:
            indicator = "unemployment"
        elif "interest" in command_text or "fed" in command_text:
            indicator = "interest_rates"
        else:
            indicator = "gdp"
        
        economic_data = await builtin_market_service.get_economic_data(indicator)
        
        message = f"📊 Economic Data: {indicator.upper()}\n{economic_data.get('message', 'Economic analysis')}"
        if economic_data.get('note'):
            message += f"\n💡 {economic_data['note']}"
        
        return CommandResponse(
            success=True,
            message=message,
            data=economic_data
        )
        
    except Exception as e:
        return CommandResponse(
            success=False,
            message="❌ Economic data error",
            data={"error": str(e)}
        )

async def _execute_news_analysis(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
    """Execute news sentiment analysis"""
    try:
        from ..services.builtin_market_service import builtin_market_service
        
        # Extract symbol from entities if available
        entities = intent.get("entities", {})
        tickers = entities.get("tickers", [])
        companies = entities.get("companies", [])
        
        symbol = tickers[0] if tickers else (companies[0] if companies else None)
        
        news_data = await builtin_market_service.get_news_sentiment(symbol)
        
        message = f"📰 News Sentiment Analysis"
        if symbol:
            message += f" for {symbol}"
        message += f"\n{news_data.get('message', 'News analysis')}"
        if news_data.get('note'):
            message += f"\n💡 {news_data['note']}"
        
        return CommandResponse(
            success=True,
            message=message,
            data=news_data
        )
        
    except Exception as e:
        return CommandResponse(
            success=False,
            message="❌ News analysis error",
            data={"error": str(e)}
        )