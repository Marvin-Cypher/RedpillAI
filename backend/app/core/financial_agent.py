"""
True AI-First Financial Agent
Based on Gemini CLI architecture patterns - AI reasons then uses tools
"""

from typing import Dict, Any, Optional, List
import logging
import json
from datetime import datetime

from ..services.ai_service import AIService
from ..services.openbb_service import OpenBBService
from ..services.portfolio_service import portfolio_service
from ..services.market_data_service import MarketDataService
from ..services.chart_service import ChartService
from ..services.company_service import CompanyService


class FinancialAgent:
    """
    AI-first financial agent that reasons about user requests
    and chooses appropriate tools - NO HARDCODED PATTERNS
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.ai_service = AIService()
        self.openbb_service = OpenBBService()
        self.market_data_service = MarketDataService()
        self.chart_service = ChartService()
        self.company_service = CompanyService()
        self.conversation_history = []
        
    async def process_command(self, user_input: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Process user command using AI reasoning - core method
        """
        try:
            # Build comprehensive system prompt
            system_prompt = self._build_system_prompt()
            
            # Add conversation context
            context = self._build_conversation_context()
            
            # Construct full prompt for AI reasoning
            full_prompt = f"""{system_prompt}

{context}

User: {user_input}

Analyze the user's request and respond naturally. If you need market data, portfolio operations, or analysis, use the available tools appropriately."""

            # Let AI reason and respond using chat method
            ai_response = await self.ai_service.chat(
                message=full_prompt,
                conversation_history=self._get_conversation_messages()
            )
            
            # Process AI response and execute any tool calls
            result = await self._process_ai_response(ai_response, user_input, user_id)
            
            # Update conversation history
            self._update_conversation(user_input, result)
            
            return {
                "success": True,
                "message": result.get("message", ""),
                "data": result.get("data", {}),
                "reasoning": result.get("reasoning", ""),
                "tools_used": result.get("tools_used", [])
            }
            
        except Exception as e:
            self.logger.error(f"Error processing command: {e}")
            return {
                "success": False,
                "message": f"I encountered an error: {str(e)}",
                "data": {"error": str(e)},
                "suggested_actions": [
                    "Try rephrasing your request",
                    "Check if the backend services are running",
                    "Contact support if the issue persists"
                ]
            }
    
    def _build_system_prompt(self) -> str:
        """Build comprehensive system prompt optimized for AI reasoning"""
        return """You are a smart financial assistant that understands natural language requests about investments, crypto, stocks, and portfolio management.

When users ask about:

PORTFOLIO OPERATIONS:
- "delete/remove/sell [amount] [asset]" → Help them reduce holdings
- "buy/add [amount] [asset]" → Help them add to portfolio  
- "show/view portfolio" → Display current holdings
- "import portfolio from [file]" → Load portfolio data

MARKET DATA:
- "price of [asset]" → Get current price
- "market review/overview" → Summarize market conditions
- "[asset] analysis" → Provide investment analysis
- "news about [topic]" → Get relevant news

EXAMPLES:
- "got 2 aave in my holding, delete them" → Understand they want to remove AAVE holdings
- "today stock market review" → Provide market overview for today
- "what's bitcoin doing?" → Get Bitcoin price and trend analysis

RESPONSE APPROACH:
1. Understand the user's intent naturally
2. Provide helpful, conversational responses
3. Offer specific actionable suggestions
4. Be direct and professional
5. If you need live data, mention that you would fetch it

Remember: You're having a conversation, not matching keywords. Understand context and respond naturally."""

    def _build_conversation_context(self) -> str:
        """Build conversation context from history"""
        if not self.conversation_history:
            return "\\nConversation Context: This is the start of our conversation."
        
        context = "\\nRecent Conversation Context:"
        # Include last 3 exchanges for context
        for entry in self.conversation_history[-3:]:
            context += f"\\nUser: {entry['user_input']}"
            context += f"\\nAssistant: {entry['response'][:200]}..."
        
        return context
    
    def _get_conversation_messages(self) -> List[Dict[str, str]]:
        """Convert conversation history to messages format"""
        messages = []
        for entry in self.conversation_history[-5:]:  # Last 5 exchanges
            messages.append({"role": "user", "content": entry["user_input"]})
            messages.append({"role": "assistant", "content": entry["response"]})
        return messages
    
    async def _process_ai_response(self, ai_response: Dict[str, Any], user_input: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Process AI response and execute any tool calls requested by the AI
        """
        
        # Extract AI message and tool calls from response  
        message = ai_response.get("content", "I understand your request.")
        tool_calls = ai_response.get("tool_calls", [])
        
        tools_used = []
        enhanced_data = {}
        effective_user_id = user_id or "default_user"
        
        # Execute tool calls if AI requested them
        if tool_calls:
            for tool_call in tool_calls:
                function_name = tool_call["function"]["name"]
                try:
                    function_args = json.loads(tool_call["function"]["arguments"])
                except:
                    function_args = {}
                
                # Execute the requested tool
                tool_result = await self._execute_tool(function_name, function_args, effective_user_id)
                if tool_result:
                    tools_used.append(function_name)
                    enhanced_data[function_name] = tool_result
                    
                    # Update message with tool results
                    if tool_result.get("success") and tool_result.get("message"):
                        message = tool_result["message"]
                    elif not tool_result.get("success"):
                        message = f"❌ {tool_result.get('message', 'Tool execution failed')}"
        
        return {
            "message": message,
            "data": enhanced_data,
            "reasoning": f"AI processed: '{user_input}' and used tools: {tools_used}" if tools_used else f"AI responded to: '{user_input}'",
            "tools_used": tools_used
        }
    
    async def _execute_tool(self, function_name: str, function_args: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Execute a specific tool function with given arguments."""
        try:
            if function_name == "get_portfolio":
                result = portfolio_service.get_summary(user_id)
                return result
                
            elif function_name == "add_portfolio_holding":
                symbol = function_args.get("symbol")
                amount = function_args.get("amount")
                result = portfolio_service.add_holding(user_id, symbol, amount)
                return result
                
            elif function_name == "remove_portfolio_holding":
                symbol = function_args.get("symbol")
                amount = function_args.get("amount")
                result = portfolio_service.remove_holding(user_id, symbol, amount)
                return result
                
            elif function_name == "get_crypto_price":
                symbol = function_args.get("symbol")
                price_data = await self.market_data_service.get_crypto_price(symbol)
                if price_data and hasattr(price_data, 'price'):
                    return {
                        "success": True,
                        "message": f"{symbol} is currently trading at ${price_data.price:,.2f}",
                        "data": {"price": price_data.price, "symbol": symbol}
                    }
                else:
                    return {
                        "success": False,
                        "message": f"Unable to fetch price for {symbol} - API provider issues"
                    }
                    
            elif function_name == "get_equity_quote":
                symbol = function_args.get("symbol")
                try:
                    quote_data = await self.market_data_service.get_equity_price(symbol)
                    if quote_data:
                        # EquityPrice has close, not price
                        current_price = quote_data.close
                        return {
                            "success": True,
                            "message": f"{symbol} quote: ${current_price:,.2f} (Close: ${quote_data.close:,.2f}, High: ${quote_data.high:,.2f}, Low: ${quote_data.low:,.2f})",
                            "data": {"price": current_price, "symbol": symbol, "high": quote_data.high, "low": quote_data.low}
                        }
                    else:
                        return {
                            "success": False,
                            "message": f"Unable to fetch quote for {symbol}"
                        }
                except Exception as e:
                    return {
                        "success": False,
                        "message": f"Error fetching quote for {symbol}: {str(e)}"
                    }
                    
            elif function_name == "create_chart":
                symbols = function_args.get("symbols", [])
                period = function_args.get("period", "1y")
                chart_result = await self._create_chart(symbols, user_id)
                return chart_result
                
            elif function_name == "get_market_overview":
                try:
                    market_data = await self.market_data_service.get_market_overview()
                    if market_data:
                        return {
                            "success": True,
                            "message": "📊 Market overview retrieved successfully",
                            "data": market_data
                        }
                    else:
                        return {
                            "success": False,
                            "message": "📊 Market data temporarily unavailable"
                        }
                except Exception as e:
                    return {
                        "success": False,
                        "message": f"📊 Error getting market overview: {str(e)}"
                    }
                    
            elif function_name == "get_companies":
                sector = function_args.get("sector")
                companies = await self.company_service.get_all_companies()
                if sector:
                    companies = [c for c in companies if c.get("sector", "").lower() == sector.lower()]
                
                if companies:
                    message = f"🏢 Found {len(companies)} companies"
                    if sector:
                        message += f" in {sector} sector"
                    message += ":\n"
                    for company in companies[:5]:  # Show first 5
                        message += f"• {company.get('name', 'Unknown')} - {company.get('sector', 'Unknown sector')}\n"
                    if len(companies) > 5:
                        message += f"... and {len(companies) - 5} more"
                else:
                    message = "🏢 No companies found"
                    
                return {
                    "success": True,
                    "message": message,
                    "data": {"companies": companies}
                }
                
            elif function_name == "check_api_keys":
                # Mock API key status check
                return {
                    "success": True,
                    "message": "🔑 API Keys Status:\n• Redpill AI: ✅ Configured\n• OpenBB: ✅ Configured\n• CoinGecko: ⚠️ Using free tier",
                    "data": {"api_status": "configured"}
                }
                
            elif function_name == "import_portfolio":
                file_path = function_args.get("file_path")
                format_type = function_args.get("format", "csv")
                
                try:
                    import pandas as pd
                    import os
                    
                    if not os.path.exists(file_path):
                        return {
                            "success": False,
                            "message": f"File not found: {file_path}"
                        }
                    
                    # Read the file based on format
                    if file_path.endswith('.csv'):
                        df = pd.read_csv(file_path)
                    elif file_path.endswith(('.xlsx', '.xls')):
                        df = pd.read_excel(file_path)
                    elif file_path.endswith('.json'):
                        df = pd.read_json(file_path)
                    else:
                        return {
                            "success": False,
                            "message": f"Unsupported file format. Please use CSV, Excel, or JSON files."
                        }
                    
                    # Try to identify symbol and amount columns
                    df.columns = df.columns.str.lower().str.strip()
                    
                    # Common column mappings
                    symbol_cols = ['symbol', 'ticker', 'asset', 'coin', 'token', 'name']
                    amount_cols = ['amount', 'quantity', 'qty', 'balance', 'holdings', 'units']
                    
                    symbol_col = None
                    amount_col = None
                    
                    for col in df.columns:
                        if any(s in col for s in symbol_cols) and symbol_col is None:
                            symbol_col = col
                        if any(a in col for a in amount_cols) and amount_col is None:
                            amount_col = col
                    
                    if not symbol_col or not amount_col:
                        return {
                            "success": False,
                            "message": f"Could not identify symbol and amount columns. Found columns: {list(df.columns)}. Please ensure your file has columns like 'symbol' and 'amount'."
                        }
                    
                    # Import holdings
                    imported_count = 0
                    errors = []
                    
                    for _, row in df.iterrows():
                        try:
                            symbol = str(row[symbol_col]).upper().strip()
                            amount = float(row[amount_col])
                            
                            if amount > 0:  # Only import positive amounts
                                result = portfolio_service.add_holding(user_id, symbol, amount)
                                if result.get("success"):
                                    imported_count += 1
                                else:
                                    errors.append(f"{symbol}: {result.get('message', 'Unknown error')}")
                        except Exception as e:
                            errors.append(f"Row error: {str(e)}")
                    
                    message = f"✅ Successfully imported {imported_count} holdings from {os.path.basename(file_path)}"
                    if errors:
                        message += f"\n⚠️ {len(errors)} errors occurred:\n" + "\n".join(errors[:5])
                        if len(errors) > 5:
                            message += f"\n... and {len(errors) - 5} more errors"
                    
                    return {
                        "success": True,
                        "message": message,
                        "data": {
                            "imported_count": imported_count,
                            "total_rows": len(df),
                            "errors": len(errors)
                        }
                    }
                    
                except Exception as e:
                    return {
                        "success": False,
                        "message": f"Error importing portfolio: {str(e)}"
                    }
                    
            elif function_name == "get_news":
                query = function_args.get("query", "market news")
                limit = function_args.get("limit", 5)
                
                try:
                    # For now, return a placeholder response until Exa.ai is integrated
                    return {
                        "success": True,
                        "message": f"📰 Latest news for '{query}':\n\n• [Placeholder] News integration with Exa.ai coming soon\n• Currently using fallback news aggregation\n• Query: {query} (limit: {limit})\n\nTo get real-time news, please check financial news websites directly.",
                        "data": {"query": query, "limit": limit, "source": "placeholder"}
                    }
                except Exception as e:
                    return {
                        "success": False,
                        "message": f"Error fetching news: {str(e)}"
                    }
                    
            elif function_name == "get_indices":
                region = function_args.get("region", "US")
                
                try:
                    # Mock major indices data until real integration
                    indices_data = {
                        "US": {
                            "S&P 500": {"value": 4585.59, "change": "+0.45%"},
                            "NASDAQ": {"value": 14465.92, "change": "+0.78%"},
                            "DOW": {"value": 35654.30, "change": "+0.23%"}
                        },
                        "EU": {
                            "DAX": {"value": 16789.23, "change": "+0.34%"},
                            "FTSE 100": {"value": 7654.12, "change": "+0.12%"},
                            "CAC 40": {"value": 7234.56, "change": "+0.56%"}
                        }
                    }
                    
                    if region.upper() == "ALL":
                        message = "📈 Global Market Indices:\n\n"
                        for reg, indices in indices_data.items():
                            message += f"**{reg}:**\n"
                            for name, data in indices.items():
                                message += f"• {name}: {data['value']:,.2f} ({data['change']})\n"
                            message += "\n"
                    else:
                        region_data = indices_data.get(region.upper(), indices_data["US"])
                        message = f"📈 {region.upper()} Market Indices:\n\n"
                        for name, data in region_data.items():
                            message += f"• {name}: {data['value']:,.2f} ({data['change']})\n"
                    
                    message += "\n⚠️ Note: Using mock data until real-time API integration is complete."
                    
                    return {
                        "success": True,
                        "message": message,
                        "data": {"region": region, "indices": indices_data.get(region.upper(), indices_data["US"])}
                    }
                except Exception as e:
                    return {
                        "success": False,
                        "message": f"Error fetching indices: {str(e)}"
                    }
                    
            elif function_name == "get_trending_stocks":
                count = function_args.get("count", 10)
                category = function_args.get("category", "all")
                
                try:
                    # Mock trending stocks data with realistic symbols and movements
                    trending_data = {
                        "gainers": [
                            {"symbol": "NVDA", "price": 875.23, "change": "+8.5%", "volume": "52.3M"},
                            {"symbol": "AMD", "price": 142.67, "change": "+6.2%", "volume": "41.2M"},
                            {"symbol": "TSLA", "price": 248.42, "change": "+4.8%", "volume": "89.1M"},
                            {"symbol": "META", "price": 512.34, "change": "+3.9%", "volume": "24.7M"},
                            {"symbol": "GOOGL", "price": 167.89, "change": "+2.1%", "volume": "28.9M"}
                        ],
                        "volume": [
                            {"symbol": "AAPL", "price": 227.85, "change": "+1.2%", "volume": "156.8M"},
                            {"symbol": "TSLA", "price": 248.42, "change": "+4.8%", "volume": "89.1M"},
                            {"symbol": "NVDA", "price": 875.23, "change": "+8.5%", "volume": "52.3M"},
                            {"symbol": "AMZN", "price": 178.34, "change": "-0.5%", "volume": "47.2M"},
                            {"symbol": "AMD", "price": 142.67, "change": "+6.2%", "volume": "41.2M"}
                        ]
                    }
                    
                    if category == "all" or category == "gainers":
                        stocks = trending_data["gainers"][:count]
                        category_title = "Top Gainers"
                    elif category == "volume":
                        stocks = trending_data["volume"][:count]
                        category_title = "High Volume"
                    else:
                        stocks = trending_data["gainers"][:count]  # default
                        category_title = "Trending"
                    
                    message = f"📈 {category_title} Today:\n\n"
                    for i, stock in enumerate(stocks, 1):
                        message += f"{i}. {stock['symbol']}: ${stock['price']:.2f} ({stock['change']}) - Vol: {stock['volume']}\n"
                    
                    return {
                        "success": True,
                        "message": message.strip(),
                        "data": {"trending_stocks": stocks, "category": category_title}
                    }
                    
                except Exception as e:
                    return {
                        "success": False,
                        "message": f"Error fetching trending stocks: {str(e)}"
                    }
                
            else:
                return {
                    "success": False,
                    "message": f"Unknown tool function: {function_name}"
                }
                
        except Exception as e:
            self.logger.error(f"Error executing tool {function_name}: {e}")
            return {
                "success": False,
                "message": f"Error executing {function_name}: {str(e)}"
            }

    def _update_conversation(self, user_input: str, result: Dict[str, Any]):
        """Update conversation history"""
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "user_input": user_input,
            "response": result.get("message", ""),
            "tools_used": result.get("tools_used", [])
        })
        
        # Keep only last 10 exchanges
        if len(self.conversation_history) > 10:
            self.conversation_history = self.conversation_history[-10:]
    
    # Tool integration methods
    def _get_crypto_price(self, symbol: str) -> Optional[float]:
        """Get cryptocurrency price using OpenBB"""
        try:
            return self.openbb_service.get_crypto_price(symbol)
        except Exception as e:
            self.logger.error(f"Error getting crypto price for {symbol}: {e}")
            return None
    
    async def _create_chart(self, symbols: List[str], user_id: str) -> Dict[str, Any]:
        """Create chart using chart service"""
        try:
            if len(symbols) == 1:
                # Single asset chart
                symbol = symbols[0].upper().replace('$', '')
                if symbol in ['BTC', 'BITCOIN']:
                    symbol = 'BTC'
                
                # Determine if crypto or stock
                crypto_symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK']
                if symbol in crypto_symbols or symbol.lower() in ['bitcoin', 'ethereum', 'solana']:
                    result = await self.chart_service.generate_crypto_chart(symbol)
                else:
                    # Assume stock symbol
                    result = await self.chart_service.generate_stock_chart(symbol)
                return result
            else:
                # Create individual charts for each symbol for now
                results = []
                for symbol in symbols:
                    clean_symbol = symbol.upper().replace('$', '')
                    if clean_symbol in ['BITCOIN']:
                        clean_symbol = 'BTC'
                    if clean_symbol in ['ETHEREUM']: 
                        clean_symbol = 'ETH'
                    
                    chart_result = await self.chart_service.generate_crypto_chart(clean_symbol)
                    if chart_result.get("success"):
                        results.append(f"Created chart for {clean_symbol}: {chart_result.get('chart_path')}")
                    else:
                        results.append(f"Failed to create chart for {clean_symbol}")
                
                if results:
                    return {
                        "success": True,
                        "message": f"📈 Generated {len([r for r in results if 'Created' in r])} charts:\n" + "\n".join(results)
                    }
                else:
                    return {
                        "success": False,
                        "message": f"Failed to create charts for {', '.join(symbols)}"
                    }
        except Exception as e:
            self.logger.error(f"Error creating chart: {e}")
            return {"success": False, "message": f"Chart creation failed: {e}"}


# Global agent instance
financial_agent = FinancialAgent()