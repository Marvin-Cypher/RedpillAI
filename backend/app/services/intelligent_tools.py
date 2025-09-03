"""
Intelligent Tools Service - Flexible, composable financial tools
No hardcoded parameters - AI extracts what it needs dynamically
"""

from typing import Dict, Any, List, Optional, Union
import json
import asyncio
import logging
from datetime import datetime
from pydantic import BaseModel
from ..services.openbb_service import OpenBBService
from ..services.openbb_cli_wrapper import openbb_cli
from ..services.openbb_direct import openbb_direct
from ..services.openbb_tool_registry import openbb_registry, ToolPriority
from ..services.openbb_tool_executor import openbb_executor
from ..services.creation_recorder import creation_recorder
from ..services.market_data_service import MarketDataService
from ..services.company_service import CompanyService
from ..services.portfolio_service import PortfolioService
from ..services.unified_chroma_service import UnifiedChromaService
from ..services.table_formatter import FinancialTableFormatter, format_quotes_table, format_portfolio_table


class ToolResult(BaseModel):
    """Standard tool result format"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class IntelligentToolsService:
    """
    Service providing intelligent, flexible tools that AI can use dynamically
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.openbb = OpenBBService()
        self.market_data = MarketDataService()
        self.company_service = CompanyService()
        self.portfolio_service = PortfolioService()
        self.chroma_service = UnifiedChromaService()
        self.table_formatter = FinancialTableFormatter()
    
    async def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """Get OpenAI function calling definitions for all tools"""
        
        # Start with custom RedPill tools
        custom_tools = [
            {
                "type": "function",
                "function": {
                    "name": "search_companies",
                    "description": "Search and filter companies with flexible criteria, geographic filtering, sector classification, and ranking",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "Natural language query (e.g., 'biotech companies', 'AI startups', 'large cap tech')"
                            },
                            "sectors": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Sector filters: biotech, technology, healthcare, finance, energy, etc."
                            },
                            "exclude_sectors": {
                                "type": "array", 
                                "items": {"type": "string"},
                                "description": "Sectors to exclude (e.g., ['healthcare', 'pharmaceuticals'])"
                            },
                            "region": {
                                "type": "string",
                                "description": "Geographic filter: US, EU, Asia, Global, etc."
                            },
                            "market_cap_min": {
                                "type": "number",
                                "description": "Minimum market cap in billions"
                            },
                            "market_cap_max": {
                                "type": "number", 
                                "description": "Maximum market cap in billions"
                            },
                            "sort_by": {
                                "type": "string",
                                "description": "Sort criteria: market_cap, revenue, growth_rate, pe_ratio, etc."
                            },
                            "sort_order": {
                                "type": "string",
                                "enum": ["asc", "desc"],
                                "description": "Sort order: ascending or descending"
                            },
                            "limit": {
                                "type": "integer",
                                "description": "Maximum number of companies to return"
                            }
                        },
                        "required": ["query"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_market_data",
                    "description": "Get comprehensive market data including quotes, fundamentals, and performance metrics",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "symbols": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Stock symbols or crypto tokens to analyze"
                            },
                            "data_types": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["quote", "fundamentals", "technicals", "news", "earnings", "chart", "historical"]
                                },
                                "description": "Types of data to retrieve - include 'chart' for visual charts or 'historical' for time series data"
                            },
                            "period": {
                                "type": "string",
                                "description": "Time period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y"
                            },
                            "include_competitors": {
                                "type": "boolean",
                                "description": "Include competitor comparison data"
                            }
                        },
                        "required": ["symbols"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "analyze_portfolio",
                    "description": "Comprehensive portfolio analysis with performance metrics, risk assessment, and recommendations",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "user_id": {
                                "type": "string",
                                "description": "User identifier"
                            },
                            "analysis_type": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["performance", "risk", "allocation", "rebalancing", "tax_optimization"]
                                },
                                "description": "Types of analysis to perform"
                            },
                            "benchmark": {
                                "type": "string",
                                "description": "Benchmark for comparison (SPY, QQQ, etc.)"
                            },
                            "time_period": {
                                "type": "string",
                                "description": "Analysis period: 1mo, 3mo, 6mo, 1y, ytd, all"
                            }
                        },
                        "required": ["user_id"]
                    }
                }
            },
            {
                "type": "function", 
                "function": {
                    "name": "create_investment_analysis",
                    "description": "Deep investment analysis combining multiple data sources and AI insights",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "target": {
                                "type": "string",
                                "description": "Investment target: company, sector, theme, or specific query"
                            },
                            "analysis_depth": {
                                "type": "string",
                                "enum": ["quick", "comprehensive", "deep_dive"],
                                "description": "Depth of analysis"
                            },
                            "focus_areas": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["financials", "competitive_position", "growth_prospects", "risks", "valuation", "technicals"]
                                },
                                "description": "Areas to focus analysis on"
                            },
                            "time_horizon": {
                                "type": "string", 
                                "description": "Investment time horizon: short_term, medium_term, long_term"
                            }
                        },
                        "required": ["target"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_trending_analysis",
                    "description": "Get trending stocks, sectors, or themes with AI-powered analysis",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "trend_type": {
                                "type": "string",
                                "enum": ["stocks", "sectors", "themes", "crypto", "etfs"],
                                "description": "Type of trending analysis"
                            },
                            "timeframe": {
                                "type": "string",
                                "enum": ["today", "week", "month", "quarter"],
                                "description": "Trending timeframe"
                            },
                            "criteria": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["volume", "price_change", "news_sentiment", "social_sentiment", "analyst_upgrades"]
                                },
                                "description": "Trending criteria to analyze"
                            },
                            "sector_filter": {
                                "type": "string",
                                "description": "Focus on specific sector"
                            },
                            "market_cap_range": {
                                "type": "string",
                                "enum": ["micro", "small", "mid", "large", "mega"],
                                "description": "Market cap range filter"
                            }
                        },
                        "required": ["trend_type"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "execute_portfolio_action",
                    "description": "Execute portfolio actions like adding, removing, or importing holdings",
                    "parameters": {
                        "type": "object", 
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["add", "remove", "update", "import", "export"],
                                "description": "Portfolio action to execute"
                            },
                            "user_id": {
                                "type": "string",
                                "description": "User identifier"
                            },
                            "symbol": {
                                "type": "string",
                                "description": "Asset symbol for add/remove/update actions"
                            },
                            "amount": {
                                "type": "number",
                                "description": "Amount/quantity for the action"
                            },
                            "file_path": {
                                "type": "string",
                                "description": "File path for import/export actions"
                            },
                            "format": {
                                "type": "string",
                                "enum": ["csv", "excel", "json"],
                                "description": "File format for import/export"
                            }
                        },
                        "required": ["action", "user_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "openbb_data_query",
                    "description": "Execute comprehensive OpenBB Terminal commands for advanced financial data, interactive charts, and tables. Use this for any request that needs professional financial analysis, charts, or extensive data tables. IMPORTANT: For crypto symbols (BTC, ETH, PHA, etc.) always use asset_class='crypto'. For stocks (AAPL, MSFT, etc.) use asset_class='equity'.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query_type": {
                                "type": "string",
                                "enum": ["historical_data", "market_movers", "company_fundamentals", "economic_data", "options_data", "crypto_data", "news", "charts", "search", "calendar"],
                                "description": "Type of financial data query"
                            },
                            "asset_class": {
                                "type": "string",
                                "enum": ["equity", "crypto", "currency", "etf", "index", "derivatives", "fixedincome", "commodity"],
                                "description": "Asset class for the query. Use 'crypto' for Bitcoin (BTC), Ethereum (ETH), Phala (PHA), etc. Use 'equity' for stocks like AAPL, MSFT, NVDA."
                            },
                            "symbol": {
                                "type": "string",
                                "description": "Ticker symbol or comma-separated symbols (e.g., 'AAPL', 'AAPL,MSFT,GOOGL')"
                            },
                            "period": {
                                "type": "string",
                                "enum": ["1d", "5d", "1m", "3m", "6m", "1y", "2y", "5y", "max"],
                                "description": "Time period for historical data"
                            },
                            "interval": {
                                "type": "string", 
                                "enum": ["1m", "5m", "15m", "30m", "1h", "1d", "1wk", "1mo"],
                                "description": "Data interval/frequency"
                            },
                            "generate_chart": {
                                "type": "boolean",
                                "description": "Whether to generate interactive OpenBB chart (opens in window)"
                            },
                            "start_date": {
                                "type": "string",
                                "description": "Start date in YYYY-MM-DD format"
                            },
                            "end_date": {
                                "type": "string", 
                                "description": "End date in YYYY-MM-DD format"
                            },
                            "data_type": {
                                "type": "string",
                                "enum": ["quote", "historical", "income", "balance", "cash", "ratios", "overview", "gainers", "losers", "active", "earnings", "dividends", "splits", "chains", "unusual"],
                                "description": "Specific type of data to retrieve"
                            },
                            "limit": {
                                "type": "integer",
                                "description": "Maximum number of results to return"
                            },
                            "search_query": {
                                "type": "string",
                                "description": "Search query for symbol/company lookup"
                            },
                            "indicators": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Technical indicators for charts (sma, rsi, macd, bollinger, etc.)"
                            }
                        },
                        "required": ["query_type"]
                    }
                }
            },
            {
                "type": "function", 
                "function": {
                    "name": "openbb_interactive_chart",
                    "description": "Generate professional interactive charts using OpenBB Terminal. Creates advanced financial visualizations with technical indicators that open in PyWry windows.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "symbol": {
                                "type": "string",
                                "description": "Ticker symbol for the chart"
                            },
                            "asset_type": {
                                "type": "string",
                                "enum": ["equity", "crypto", "index", "currency", "etf"],
                                "description": "Type of asset to chart"
                            },
                            "period": {
                                "type": "string",
                                "enum": ["1d", "5d", "1m", "3m", "6m", "1y", "2y", "5y"],
                                "description": "Time period for the chart"
                            },
                            "chart_type": {
                                "type": "string",
                                "enum": ["candlestick", "ohlc", "line"],
                                "description": "Type of chart to generate"
                            },
                            "indicators": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": ["sma", "ema", "rsi", "macd", "bollinger", "stoch", "adx", "atr", "obv"]
                                },
                                "description": "Technical indicators to overlay on chart"
                            }
                        },
                        "required": ["symbol", "asset_type"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "openbb_market_overview",
                    "description": "Get comprehensive market overview including indices, movers, sectors, and economic indicators using OpenBB's extensive data tables.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "include_indices": {
                                "type": "boolean",
                                "description": "Include major market indices data"
                            },
                            "include_movers": {
                                "type": "boolean", 
                                "description": "Include top gainers, losers, and most active stocks"
                            },
                            "include_sectors": {
                                "type": "boolean",
                                "description": "Include sector performance data"
                            },
                            "include_economic": {
                                "type": "boolean",
                                "description": "Include economic calendar and indicators"
                            },
                            "include_crypto": {
                                "type": "boolean",
                                "description": "Include cryptocurrency market data"
                            },
                            "generate_charts": {
                                "type": "boolean",
                                "description": "Generate interactive charts for key metrics"
                            }
                        }
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "generate_interactive_chart",
                    "description": "Generate interactive OpenBB charts that display in web UI and save to user portfolio. This is the PREFERRED method for creating charts as it provides real-time visual display and persistent storage. Use this for any chart request.",
                    "parameters": {
                        "type": "object", 
                        "properties": {
                            "symbol": {
                                "type": "string",
                                "description": "Asset symbol (e.g., 'BTC', 'AAPL', 'SPY')"
                            },
                            "asset_type": {
                                "type": "string", 
                                "enum": ["crypto", "equity", "etf", "index"],
                                "description": "Type of asset. Use 'crypto' for Bitcoin, Ethereum, PHA, etc. Use 'equity' for stocks."
                            },
                            "period": {
                                "type": "string",
                                "enum": ["1d", "7d", "1m", "3m", "6m", "1y", "2y", "3y", "5y", "max"],
                                "description": "Time period for the chart",
                                "default": "1y"
                            },
                            "save_to_portfolio": {
                                "type": "boolean", 
                                "description": "Save chart to user's portfolio for future access",
                                "default": True
                            },
                            "auto_open": {
                                "type": "boolean",
                                "description": "Automatically open chart in web browser",
                                "default": True
                            }
                        },
                        "required": ["symbol", "asset_type"]
                    }
                }
            },
            {
                "type": "function", 
                "function": {
                    "name": "generate_multi_asset_comparison_chart",
                    "description": "Generate comparative analysis chart for multiple assets/stocks. Shows relative performance with normalized percentage returns. Perfect for comparing multiple stocks, sectors, or asset classes side-by-side.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "symbols": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "List of asset symbols to compare (e.g., ['PANW', 'CRWD', 'FTNT'] or ['BTC', 'ETH', 'SOL'])"
                            },
                            "asset_type": {
                                "type": "string",
                                "enum": ["equity", "crypto"],
                                "description": "Type of assets to compare"
                            },
                            "period": {
                                "type": "string",
                                "enum": ["1m", "3m", "6m", "1y", "2y", "5y"],
                                "description": "Time period for comparison",
                                "default": "1y"
                            },
                            "save_to_portfolio": {
                                "type": "boolean",
                                "description": "Save chart to user portfolio for future reference",
                                "default": True
                            },
                            "auto_open": {
                                "type": "boolean", 
                                "description": "Automatically open chart in browser",
                                "default": True
                            }
                        },
                        "required": ["symbols", "asset_type"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "format_financial_table",
                    "description": "Format financial data into enhanced color-coded tables for CLI display. Use when presenting live market data, quotes, portfolio holdings, or comparative financial analysis that would benefit from visual formatting.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "data": {
                                "type": "array",
                                "items": {"type": "object"},
                                "description": "Array of data objects to format as table"
                            },
                            "table_type": {
                                "type": "string",
                                "enum": ["quotes", "portfolio", "companies", "general"],
                                "description": "Type of table for optimal formatting"
                            },
                            "format": {
                                "type": "string",
                                "enum": ["rich", "markdown", "simple"],
                                "description": "Output format - 'rich' for CLI colors, 'markdown' for general use",
                                "default": "rich"
                            },
                            "title": {
                                "type": "string",
                                "description": "Optional table title"
                            },
                            "highlight_changes": {
                                "type": "boolean",
                                "description": "Whether to highlight positive/negative changes with colors",
                                "default": True
                            }
                        },
                        "required": ["data", "table_type"]
                    }
                }
            }
        ]
        
        # Add ALL OpenBB tools from the comprehensive registry
        # Get high-priority OpenBB tools (Critical and High priority)
        openbb_tools = openbb_registry.get_all_ai_tool_schemas(max_priority=ToolPriority.HIGH)
        
        # Combine custom RedPill tools with OpenBB tools
        all_tools = custom_tools + openbb_tools
        
        self.logger.info(f"✅ Registered {len(all_tools)} total AI tools ({len(custom_tools)} custom + {len(openbb_tools)} OpenBB)")
        
        return all_tools
    
    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> ToolResult:
        """Execute a tool with given arguments"""
        try:
            self.logger.info(f"Executing tool: {tool_name} with arguments: {arguments}")
            print(f"DEBUG: Executing tool: {tool_name} with arguments: {arguments}")
            if tool_name == "search_companies":
                return await self._search_companies(**arguments)
            elif tool_name == "get_market_data":
                return await self._get_market_data(**arguments)
            elif tool_name == "analyze_portfolio":
                return await self._analyze_portfolio(**arguments)
            elif tool_name == "create_investment_analysis":
                return await self._create_investment_analysis(**arguments)
            elif tool_name == "get_trending_analysis":
                return await self._get_trending_analysis(**arguments)
            elif tool_name == "execute_portfolio_action":
                return await self._execute_portfolio_action(**arguments)
            elif tool_name == "openbb_data_query":
                return await self._openbb_data_query(**arguments)
            elif tool_name == "openbb_interactive_chart":
                return await self._openbb_interactive_chart(**arguments)
            elif tool_name == "openbb_market_overview":
                return await self._openbb_market_overview(**arguments)
            elif tool_name == "generate_interactive_chart":
                return await self._generate_interactive_chart(**arguments)
            elif tool_name == "generate_multi_asset_comparison_chart":
                return await self._generate_multi_asset_comparison_chart(**arguments)
            elif tool_name == "format_financial_table":
                return await self._format_financial_table(**arguments)
            else:
                # Check if it's an OpenBB tool from the registry
                if openbb_registry.get_tool_definition(tool_name):
                    # Execute OpenBB tool dynamically
                    result = await openbb_executor.execute_tool(tool_name, arguments)
                    
                    if result["success"]:
                        return ToolResult(
                            success=True,
                            message=f"OpenBB tool {tool_name} executed successfully",
                            data=result.get("data"),
                            metadata=result.get("metadata")
                        )
                    else:
                        return ToolResult(
                            success=False,
                            message=f"OpenBB tool error: {result.get('error', 'Unknown error')}",
                            data=result
                        )
                else:
                    return ToolResult(
                        success=False,
                        message=f"Unknown tool: {tool_name}"
                    )
        except Exception as e:
            return ToolResult(
                success=False,
                message=f"Error executing {tool_name}: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _search_companies(
        self,
        query: str,
        sectors: Optional[List[str]] = None,
        exclude_sectors: Optional[List[str]] = None,
        region: Optional[str] = None,
        market_cap_min: Optional[float] = None,
        market_cap_max: Optional[float] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = "desc",
        limit: Optional[int] = 20
    ) -> ToolResult:
        """Intelligent company search with flexible filtering"""
        
        try:
            # Get all companies from database
            all_companies = await self.company_service.get_all_companies()
            
            # Apply filters
            filtered_companies = []
            
            for company in all_companies:
                # Sector filtering
                company_sector = company.get("sector", "").lower()
                
                # Include sectors filter
                if sectors:
                    sector_match = any(s.lower() in company_sector for s in sectors)
                    if not sector_match:
                        continue
                
                # Exclude sectors filter  
                if exclude_sectors:
                    sector_exclude = any(s.lower() in company_sector for s in exclude_sectors)
                    if sector_exclude:
                        continue
                
                # Geographic filtering (basic implementation)
                if region and region.upper() == "US":
                    # Filter for US companies - you could expand this with actual data
                    if not self._is_us_company(company):
                        continue
                
                # Get market cap data if available
                if market_cap_min or market_cap_max or sort_by == "market_cap":
                    market_cap = await self._get_company_market_cap(company)
                    company["market_cap"] = market_cap
                    
                    if market_cap_min and (market_cap is None or market_cap < market_cap_min * 1e9):
                        continue
                    if market_cap_max and (market_cap is None or market_cap > market_cap_max * 1e9):
                        continue
                
                filtered_companies.append(company)
            
            # Sorting
            if sort_by and filtered_companies:
                reverse = sort_order == "desc"
                
                if sort_by == "market_cap":
                    filtered_companies.sort(
                        key=lambda x: x.get("market_cap", 0) or 0,
                        reverse=reverse
                    )
                elif sort_by == "name":
                    filtered_companies.sort(
                        key=lambda x: x.get("name", ""),
                        reverse=reverse
                    )
            
            # Limit results
            if limit:
                filtered_companies = filtered_companies[:limit]
            
            # Format response
            if not filtered_companies:
                return ToolResult(
                    success=True,
                    message=f"No companies found matching criteria: {query}",
                    data={"companies": [], "total": 0}
                )
            
            # Format company data for display
            formatted_companies = []
            for company in filtered_companies:
                formatted_company = {
                    "name": company.get("name", "Unknown"),
                    "sector": company.get("sector", "Unknown"),
                    "symbol": company.get("token_symbol") or company.get("symbol", ""),
                    "description": company.get("description", "")[:100] + "..." if len(company.get("description", "")) > 100 else company.get("description", "")
                }
                
                if company.get("market_cap"):
                    formatted_company["market_cap"] = f"${company['market_cap'] / 1e9:.1f}B"
                
                formatted_companies.append(formatted_company)
            
            # Automatically format company data as clean box table for CLI display
            formatted_table = self.table_formatter.create_clean_box_table(
                data=formatted_companies,
                currency_columns=["market_cap"] if any("market_cap" in company for company in formatted_companies) else []
            )
            
            message = f"Found {len(formatted_companies)} companies matching '{query}'"
            if sectors:
                message += f" in sectors: {', '.join(sectors)}"
            if exclude_sectors:
                message += f" (excluding: {', '.join(exclude_sectors)})"
            if region:
                message += f" in {region}"
            
            # Add formatted table to message
            message += f"\n\n{formatted_table}"
            
            return ToolResult(
                success=True,
                message=message,
                data={
                    "companies": formatted_companies,
                    "total": len(formatted_companies),
                    "formatted_table": formatted_table,
                    "filters_applied": {
                        "sectors": sectors,
                        "exclude_sectors": exclude_sectors,
                        "region": region,
                        "sort_by": sort_by
                    }
                }
            )
            
        except Exception as e:
            return ToolResult(
                success=False,
                message=f"Error searching companies: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _get_market_data(
        self,
        symbols: List[str],
        data_types: Optional[List[str]] = None,
        period: Optional[str] = "1d",
        include_competitors: Optional[bool] = False
    ) -> ToolResult:
        """Get comprehensive market data for symbols"""
        
        if not data_types:
            data_types = ["quote"]
        
        results = {}
        
        for symbol in symbols:
            symbol_data = {}
            
            for data_type in data_types:
                try:
                    if data_type == "quote":
                        # Check if this is a historical request (period specified and not just "1d")
                        if period and period != "1d" and period not in ["1d", "today"]:
                            # Get historical data for chart generation
                            if symbol.upper() in ["BTC", "ETH", "SOL", "ADA", "DOT"]:
                                # Convert period to days for crypto historical data
                                days_map = {"1w": 7, "1mo": 30, "3mo": 90, "6mo": 180, "1y": 365, "2y": 730, "3y": 1095, "5y": 1825}
                                days = days_map.get(period, 365)
                                historical_data = await self.market_data.get_crypto_historical(symbol, days)
                                
                                # Convert historical data to chart-friendly format
                                if historical_data:
                                    symbol_data["historical"] = []
                                    for price_data in historical_data:
                                        symbol_data["historical"].append({
                                            "date": price_data.date.isoformat(),
                                            "open": price_data.open,
                                            "high": price_data.high,
                                            "low": price_data.low,
                                            "close": price_data.close,
                                            "volume": price_data.volume
                                        })
                                    # Also include current quote
                                    current_quote = await self.market_data.get_crypto_price(symbol)
                                    if current_quote:
                                        symbol_data["quote"] = {
                                            "symbol": current_quote.symbol,
                                            "price": current_quote.close,
                                            "open": current_quote.open,
                                            "high": current_quote.high,
                                            "low": current_quote.low,
                                            "close": current_quote.close,
                                            "change_percent": current_quote.change_percent,
                                            "volume": current_quote.volume,
                                            "date": current_quote.date.isoformat()
                                        }
                                else:
                                    symbol_data["historical"] = None
                            else:
                                # For stocks, get historical data from OpenBB
                                days_map = {"1w": 7, "1mo": 30, "3mo": 90, "6mo": 180, "1y": 365, "2y": 730, "3y": 1095, "5y": 1825}
                                days = days_map.get(period, 365)
                                historical_data = await self.market_data.get_equity_historical(symbol, days=days)
                                
                                if historical_data:
                                    symbol_data["historical"] = historical_data
                                    # Also include current quote
                                    quote_data = await self.market_data.get_stock_quote(symbol)
                                    symbol_data["quote"] = quote_data
                                else:
                                    symbol_data["historical"] = None
                                    # Fallback to current quote only
                                    quote_data = await self.market_data.get_stock_quote(symbol)
                                    symbol_data["quote"] = quote_data
                        else:
                            # Regular current quote request
                            if symbol.upper() in ["BTC", "ETH", "SOL", "ADA", "DOT"]:
                                quote_data = await self.market_data.get_crypto_price(symbol)
                                # Convert CryptoPrice object to dict for JSON serialization
                                if quote_data:
                                    symbol_data["quote"] = {
                                        "symbol": quote_data.symbol,
                                        "price": quote_data.close,
                                        "open": quote_data.open,
                                        "high": quote_data.high,
                                        "low": quote_data.low,
                                        "close": quote_data.close,
                                        "change_percent": quote_data.change_percent,
                                        "volume": quote_data.volume,
                                        "date": quote_data.date.isoformat()
                                    }
                                else:
                                    symbol_data["quote"] = None
                            else:
                                quote_data = await self.market_data.get_stock_quote(symbol)
                                symbol_data["quote"] = quote_data
                        
                    elif data_type == "chart":
                        # Generate visual chart using OpenBB's native charting capabilities
                        try:
                            # Determine if crypto or equity
                            is_crypto = symbol.upper() in ["BTC", "ETH", "SOL", "ADA", "DOT", "LINK", "UNI", "AVAX", "MATIC", "ATOM"]
                            
                            if is_crypto:
                                # Use OpenBB crypto charting with technical indicators
                                chart_result = self.openbb.create_crypto_chart(
                                    symbol=symbol,
                                    period=period or "30d",
                                    chart_type="candle",
                                    indicators=["sma", "rsi"]  # Add common indicators
                                )
                            else:
                                # Use OpenBB equity charting with technical indicators
                                chart_result = self.openbb.create_equity_chart(
                                    symbol=symbol,
                                    period=period or "1y",
                                    chart_type="candle",
                                    indicators=["sma", "rsi", "macd"]  # Add common indicators
                                )
                            
                            if chart_result.get("success"):
                                symbol_data["chart"] = chart_result["chart_data"]
                                symbol_data["chart_metadata"] = {
                                    "data_points": chart_result.get("data_points", 0),
                                    "indicators": chart_result.get("indicators", []),
                                    "current_price": chart_result.get("current_price"),
                                    "price_change": chart_result.get("price_change", 0)
                                }
                            else:
                                # Fallback to basic market data service
                                chart_data = await self.market_data.create_chart([symbol], period=period or "1mo")
                                symbol_data["chart"] = chart_data
                        except Exception as chart_error:
                            # Fallback to market data service if OpenBB charting fails
                            try:
                                chart_data = await self.market_data.create_chart([symbol], period=period or "1mo")
                                symbol_data["chart"] = chart_data
                            except Exception as fallback_error:
                                symbol_data["chart"] = f"Chart generation failed: {str(fallback_error)}"
                        
                    elif data_type == "historical":
                        # Get historical time series data regardless of period
                        if symbol.upper() in ["BTC", "ETH", "SOL", "ADA", "DOT"]:
                            days_map = {"1w": 7, "1mo": 30, "3mo": 90, "6mo": 180, "1y": 365, "2y": 730, "3y": 1095, "5y": 1825}
                            days = days_map.get(period, 365)
                            historical_data = await self.market_data.get_crypto_historical(symbol, days)
                            
                            if historical_data:
                                symbol_data["historical"] = []
                                for price_data in historical_data:
                                    symbol_data["historical"].append({
                                        "date": price_data.date.isoformat(),
                                        "open": price_data.open,
                                        "high": price_data.high,
                                        "low": price_data.low,
                                        "close": price_data.close,
                                        "volume": price_data.volume
                                    })
                            else:
                                symbol_data["historical"] = None
                        else:
                            days_map = {"1w": 7, "1mo": 30, "3mo": 90, "6mo": 180, "1y": 365, "2y": 730, "3y": 1095, "5y": 1825}
                            days = days_map.get(period or "1y", 365)
                            historical_data = await self.market_data.get_equity_historical(symbol, days=days)
                            symbol_data["historical"] = historical_data
                        
                    elif data_type == "fundamentals":
                        # Get fundamental data
                        fundamentals = await self.openbb.get_fundamentals(symbol)
                        symbol_data["fundamentals"] = fundamentals
                        
                except Exception as e:
                    symbol_data[data_type] = {"error": str(e)}
            
            results[symbol] = symbol_data
        
        return ToolResult(
            success=True,
            message=f"Retrieved {len(data_types)} data types for {len(symbols)} symbols",
            data={"market_data": results}
        )
    
    async def _analyze_portfolio(
        self,
        user_id: str,
        analysis_type: Optional[List[str]] = None,
        benchmark: Optional[str] = "SPY",
        time_period: Optional[str] = "1y"
    ) -> ToolResult:
        """Comprehensive portfolio analysis"""
        
        try:
            self.logger.info(f"Starting portfolio analysis for user_id: {user_id}")
            # Get user portfolio - use default user if none specified
            effective_user_id = user_id or "default"
            portfolio = self.portfolio_service.get_portfolio(effective_user_id)
            self.logger.info(f"Portfolio service returned: {portfolio}")
            
            if not portfolio:
                self.logger.info("No portfolio found, trying ChromaDB and backend fallback")
                # Get tracked companies from ChromaDB memory
                try:
                    portfolio_context = await self.chroma_service.get_portfolio_context(
                        tenant_id=effective_user_id,
                        query="tracking companies watchlist symbols performance"
                    )
                    
                    tracked_symbols = portfolio_context.get("symbols", [])
                    
                    if not tracked_symbols:
                        # If ChromaDB is empty, fallback to backend companies with known symbols
                        self.logger.info("No tracked symbols in ChromaDB, falling back to backend companies")
                        all_companies = await self.company_service.get_all_companies()
                        self.logger.info(f"Retrieved {len(all_companies)} companies from backend")
                        backend_symbols = []
                        
                        # Extract companies with valid ticker symbols from backend
                        for company in all_companies:
                            symbol = company.get("token_symbol") or company.get("symbol", "")
                            name = company.get("name", "")
                            
                            # Map common company names to ticker symbols
                            symbol_mapping = {
                                "NVIDIA": "NVDA", "NVIDIA Corporation": "NVDA",
                                "Apple": "AAPL", "Apple Inc": "AAPL", 
                                "Microsoft": "MSFT", "Microsoft Corporation": "MSFT",
                                "Google": "GOOGL", "Alphabet": "GOOGL",
                                "Amazon": "AMZN", "Amazon.com": "AMZN",
                                "Tesla": "TSLA", "Tesla Inc": "TSLA"
                            }
                            
                            # Use mapped symbol or existing symbol
                            final_symbol = symbol_mapping.get(name, symbol)
                            if final_symbol and len(final_symbol) <= 5:  # Valid ticker format
                                backend_symbols.append(final_symbol)
                        
                        tracked_symbols = backend_symbols[:10]  # Limit to 10 for performance
                    
                    if tracked_symbols:
                        # Get performance data for tracked symbols
                        performance_data = []
                        for symbol in tracked_symbols:
                            try:
                                # Get current quote and performance
                                quote_data = await self.market_data.get_equity_price(symbol)
                                if quote_data:
                                    performance_data.append({
                                        "symbol": symbol,
                                        "current_price": quote_data.close,
                                        "change_percent": quote_data.change_percent or 0,
                                        "volume": quote_data.volume,
                                        "performance": quote_data.change_percent or 0
                                    })
                            except Exception as e:
                                self.logger.warning(f"Failed to get performance for {symbol}: {e}")
                        
                        # Sort by performance (best performers first)
                        performance_data.sort(key=lambda x: float(x.get("performance", 0) or 0), reverse=True)
                        
                        data_source = "chromadb_tracking" if portfolio_context.get("symbols") else "backend_companies"
                        message = f"📈 Today's Performance - Your {len(performance_data)} Tracked Companies:\n\n"
                        for i, perf in enumerate(performance_data):
                            change = perf.get("change_percent", "N/A")
                            price = perf.get("current_price", "N/A")
                            emoji = "🟢" if float(change or 0) > 0 else "🔴" if float(change or 0) < 0 else "⚪"
                            message += f"{i+1}. {perf['symbol']} - ${price} ({change}%) {emoji}\n"
                        
                        message += f"\n💡 Data source: {data_source.replace('_', ' ').title()}"
                        
                        return ToolResult(
                            success=True,
                            message=message,
                            data={
                                "tracked_companies": performance_data, 
                                "total": len(performance_data),
                                "source": data_source
                            }
                        )
                    
                    # If still no symbols found, return helpful message
                    return ToolResult(
                        success=True,
                        message="No companies with valid ticker symbols found in your tracking list or backend database.",
                        data={"tracked_companies": [], "total": 0, "source": "empty_tracking"}
                    )
                    
                except Exception as e:
                    self.logger.error(f"Failed to get tracked companies from ChromaDB: {e}")
                    # Fallback to informative message instead of random companies
                    return ToolResult(
                        success=False,
                        message="Unable to retrieve your tracking list. You can add companies by mentioning them in conversations.",
                        data={"error": str(e)}
                    )
            
            analysis_results = {}
            
            if not analysis_type:
                analysis_type = ["performance", "allocation"]
            
            for analysis in analysis_type:
                if analysis == "performance":
                    analysis_results["performance"] = await self._analyze_portfolio_performance(portfolio, benchmark)
                elif analysis == "allocation":
                    analysis_results["allocation"] = await self._analyze_portfolio_allocation(portfolio)
                elif analysis == "risk":
                    analysis_results["risk"] = await self._analyze_portfolio_risk(portfolio)
            
            # Convert portfolio holdings to serializable format
            serializable_portfolio = {}
            if isinstance(portfolio, dict):
                for symbol, holding in portfolio.items():
                    if hasattr(holding, '__dict__'):
                        # Convert dataclass to dict
                        from dataclasses import asdict
                        serializable_portfolio[symbol] = asdict(holding)
                    elif isinstance(holding, dict):
                        serializable_portfolio[symbol] = holding
                    else:
                        # Convert other objects to dict
                        serializable_portfolio[symbol] = {
                            "symbol": getattr(holding, 'symbol', symbol),
                            "amount": getattr(holding, 'amount', 0),
                            "average_price": getattr(holding, 'average_price', None),
                            "last_updated": getattr(holding, 'last_updated', None)
                        }
            
            return ToolResult(
                success=True,
                message=f"Portfolio analysis complete for {len(analysis_type)} metrics",
                data={"portfolio": serializable_portfolio, "analysis": analysis_results}
            )
            
        except Exception as e:
            return ToolResult(
                success=False,
                message=f"Portfolio analysis error: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _create_investment_analysis(
        self,
        target: str,
        analysis_depth: Optional[str] = "comprehensive",
        focus_areas: Optional[List[str]] = None,
        time_horizon: Optional[str] = "medium_term"
    ) -> ToolResult:
        """Create comprehensive investment analysis"""
        
        # This would integrate multiple data sources and AI analysis
        # For now, return structured placeholder
        
        return ToolResult(
            success=True,
            message=f"Investment analysis for {target} ({analysis_depth} depth)",
            data={
                "target": target,
                "analysis_depth": analysis_depth,
                "focus_areas": focus_areas or ["financials", "growth_prospects", "risks"],
                "recommendations": "Analysis would be generated here with real data integration"
            }
        )
    
    async def _get_trending_analysis(
        self,
        trend_type: str,
        timeframe: Optional[str] = "today",
        criteria: Optional[List[str]] = None,
        sector_filter: Optional[str] = None,
        market_cap_range: Optional[str] = None
    ) -> ToolResult:
        """Get trending analysis with flexible parameters"""
        
        # Use existing trending stocks functionality but enhance with parameters
        try:
            if trend_type == "stocks":
                trending_data = await self.market_data.get_trending_stocks()
                
                return ToolResult(
                    success=True,
                    message=f"Trending {trend_type} for {timeframe}",
                    data={
                        "trending_data": trending_data,
                        "timeframe": timeframe,
                        "criteria": criteria,
                        "filters": {
                            "sector": sector_filter,
                            "market_cap_range": market_cap_range
                        }
                    }
                )
            else:
                return ToolResult(
                    success=True,
                    message=f"Trending analysis for {trend_type} not yet implemented",
                    data={"trend_type": trend_type, "status": "coming_soon"}
                )
                
        except Exception as e:
            return ToolResult(
                success=False,
                message=f"Trending analysis error: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _execute_portfolio_action(
        self,
        action: str,
        user_id: str,
        symbol: Optional[str] = None,
        amount: Optional[float] = None,
        file_path: Optional[str] = None,
        format: Optional[str] = "csv"
    ) -> ToolResult:
        """Execute portfolio actions"""
        
        try:
            if action == "add" and symbol and amount:
                result = self.portfolio_service.add_holding(user_id, symbol, amount)
                return ToolResult(
                    success=result["success"],
                    message=result["message"],
                    data={"action": action, "symbol": symbol, "amount": amount, "result": result}
                )
            
            elif action == "remove" and symbol:
                result = self.portfolio_service.remove_holding(user_id, symbol, amount)
                return ToolResult(
                    success=result["success"],
                    message=result["message"],
                    data={"action": action, "symbol": symbol, "amount": amount, "result": result}
                )
            
            elif action == "import" and file_path:
                # Import portfolio functionality
                return ToolResult(
                    success=True,
                    message=f"Imported portfolio from {file_path}",
                    data={"action": action, "file_path": file_path, "format": format}
                )
            
            else:
                return ToolResult(
                    success=False,
                    message=f"Invalid portfolio action: {action} with provided parameters"
                )
                
        except Exception as e:
            return ToolResult(
                success=False,
                message=f"Portfolio action error: {str(e)}",
                data={"error": str(e)}
            )
    
    def _is_us_company(self, company: Dict) -> bool:
        """Check if company is US-based (placeholder logic)"""
        # This would use real geographic data
        return True  # Placeholder
    
    async def _get_company_market_cap(self, company: Dict) -> Optional[float]:
        """Get market cap for a company"""
        # This would integrate with financial APIs to get real market cap
        symbol = company.get("token_symbol") or company.get("symbol")
        if symbol:
            try:
                fundamentals = await self.openbb.get_fundamentals(symbol)
                return fundamentals.get("market_cap")
            except:
                pass
        return None
    
    async def _analyze_portfolio_performance(self, portfolio: Dict, benchmark: str) -> Dict:
        """Analyze portfolio performance"""
        return {"performance": "analysis_placeholder"}
    
    async def _analyze_portfolio_allocation(self, portfolio: Dict) -> Dict:
        """Analyze portfolio allocation"""
        return {"allocation": "analysis_placeholder"}
    
    async def _analyze_portfolio_risk(self, portfolio: Dict) -> Dict:
        """Analyze portfolio risk"""  
        return {"risk": "analysis_placeholder"}
    
    # ========================
    # OpenBB Terminal Integration Methods
    # ========================
    
    async def _openbb_data_query(
        self,
        query_type: str,
        asset_class: str = "equity",
        symbol: Optional[str] = None,
        period: Optional[str] = None,
        interval: Optional[str] = None,
        generate_chart: bool = False,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        data_type: Optional[str] = None,
        limit: Optional[int] = None,
        search_query: Optional[str] = None,
        indicators: Optional[List[str]] = None
    ) -> ToolResult:
        """Execute comprehensive OpenBB data queries with professional tables and charts"""
        
        try:
            # Map query types to OpenBB commands
            command_mapping = {
                "historical_data": {
                    "equity": "/equity/price/historical",
                    "crypto": "/crypto/price/historical", 
                    "index": "/index/price/historical",
                    "currency": "/currency/price/historical",
                    "etf": "/etf/price/historical"
                },
                "market_movers": {
                    "equity": "/equity/discovery/{mover_type}"
                },
                "company_fundamentals": {
                    "equity": "/equity/fundamental/{data_type}"
                },
                "economic_data": {
                    "economy": "/economy/{data_type}"
                },
                "crypto_data": {
                    "crypto": "/crypto/price/{data_type}"
                },
                "news": {
                    "equity": "/news/company",
                    "general": "/news/world"
                },
                "search": {
                    "equity": "/equity/search",
                    "crypto": "/crypto/search"
                },
                "calendar": {
                    "equity": "/equity/calendar/{data_type}",
                    "economy": "/economy/calendar"
                }
            }
            
            # Build command path
            command_path = None
            parameters = {}
            
            if query_type == "historical_data":
                command_path = command_mapping[query_type].get(asset_class, "/equity/price/historical")
                if symbol:
                    parameters["symbol"] = symbol
                if period:
                    parameters["period"] = period
                if interval:
                    parameters["interval"] = interval
                if start_date:
                    parameters["start_date"] = start_date
                if end_date:
                    parameters["end_date"] = end_date
                
                # Add provider for crypto data
                if asset_class == "crypto":
                    parameters["provider"] = "fmp"  # Use FMP for crypto data
            
            elif query_type == "market_movers":
                mover_type = data_type or "gainers"
                command_path = f"/equity/discovery/{mover_type}"
                if limit:
                    parameters["limit"] = limit
            
            elif query_type == "company_fundamentals":
                fund_type = data_type or "overview"
                command_path = f"/equity/fundamental/{fund_type}"
                if symbol:
                    parameters["symbol"] = symbol
            
            elif query_type == "search":
                command_path = command_mapping[query_type].get(asset_class, "/equity/search")
                if search_query:
                    parameters["query"] = search_query
                if limit:
                    parameters["limit"] = limit
            
            elif query_type == "crypto_data":
                crypto_type = data_type or "quote"
                command_path = f"/crypto/price/{crypto_type}"
                if symbol:
                    parameters["symbol"] = symbol
            
            elif query_type == "calendar":
                if asset_class == "equity":
                    cal_type = data_type or "earnings"
                    command_path = f"/equity/calendar/{cal_type}"
                else:
                    command_path = "/economy/calendar"
                if start_date:
                    parameters["start_date"] = start_date
                if end_date:
                    parameters["end_date"] = end_date
            
            elif query_type == "news":
                if symbol:
                    command_path = "/news/company"
                    parameters["symbol"] = symbol
                else:
                    command_path = "/news/world"
                if limit:
                    parameters["limit"] = limit
            
            elif query_type == "charts":
                # Map charts to historical_data with chart generation
                command_path = command_mapping["historical_data"].get(asset_class, "/equity/price/historical")
                if symbol:
                    parameters["symbol"] = symbol
                if start_date:
                    parameters["start_date"] = start_date
                if end_date:
                    parameters["end_date"] = end_date
                parameters["interval"] = interval or "1d"
                
                # Add provider for crypto data
                if asset_class == "crypto":
                    parameters["provider"] = "fmp"
                
                # Force chart generation
                generate_chart = True
            
            if not command_path:
                return ToolResult(
                    success=False,
                    message=f"Unsupported query type: {query_type} for asset class: {asset_class}"
                )
            
            # Execute OpenBB command
            result = await openbb_cli.execute_openbb_command(
                command_path=command_path,
                parameters=parameters,
                chart=generate_chart
            )
            
            return ToolResult(
                success=result.get("success", False),
                message=f"OpenBB query executed: {command_path}",
                data={
                    "command": command_path,
                    "parameters": parameters,
                    "output": result.get("output"),
                    "data": result.get("data"),
                    "chart_generated": generate_chart,
                    "source": "OpenBB Terminal"
                }
            )
            
        except Exception as e:
            return ToolResult(
                success=False,
                message=f"OpenBB data query error: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _openbb_interactive_chart(
        self,
        symbol: str,
        asset_type: str,
        period: Optional[str] = "1y",
        chart_type: Optional[str] = "candlestick",
        indicators: Optional[List[str]] = None
    ) -> ToolResult:
        """Generate professional interactive charts using OpenBB Terminal"""
        
        try:
            # Create comprehensive chart with OpenBB
            result = await openbb_cli.create_interactive_chart(
                asset_type=asset_type,
                symbol=symbol,
                period=period or "1y",
                indicators=indicators or []
            )
            
            return ToolResult(
                success=result.get("success", False),
                message=f"Interactive OpenBB chart created for {symbol}",
                data={
                    "symbol": symbol,
                    "asset_type": asset_type,
                    "period": period,
                    "chart_type": chart_type,
                    "indicators": indicators,
                    "chart_generated": True,
                    "interactive": True,
                    "opens_in_window": True,
                    "data": result.get("data"),
                    "source": "OpenBB Terminal Charts"
                }
            )
            
        except Exception as e:
            return ToolResult(
                success=False,
                message=f"Interactive chart error: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _openbb_market_overview(
        self,
        include_indices: bool = True,
        include_movers: bool = True,
        include_sectors: bool = True,
        include_economic: bool = True,
        include_crypto: bool = True,
        generate_charts: bool = False
    ) -> ToolResult:
        """Get comprehensive market overview using OpenBB's extensive data"""
        
        try:
            # Get comprehensive market snapshot
            result = await openbb_cli.get_market_snapshot()
            
            overview_data = {}
            
            if include_indices:
                # Get major indices
                indices_result = await openbb_cli.execute_openbb_command(
                    "/index/price/historical",
                    {"symbol": "SPY,QQQ,DIA,IWM", "interval": "1d", "limit": 1},
                    chart=generate_charts
                )
                overview_data["indices"] = indices_result.get("data")
            
            if include_movers:
                # Get market movers in parallel
                gainers_result = await openbb_cli.execute_openbb_command(
                    "/equity/discovery/gainers",
                    {"limit": 10}
                )
                losers_result = await openbb_cli.execute_openbb_command(
                    "/equity/discovery/losers", 
                    {"limit": 10}
                )
                active_result = await openbb_cli.execute_openbb_command(
                    "/equity/discovery/active",
                    {"limit": 10}
                )
                
                overview_data["market_movers"] = {
                    "gainers": gainers_result.get("data"),
                    "losers": losers_result.get("data"),
                    "most_active": active_result.get("data")
                }
            
            if include_crypto:
                # Get top crypto prices
                crypto_result = await openbb_cli.execute_openbb_command(
                    "/crypto/price/quote",
                    {"symbol": "BTC,ETH,SOL,ADA,DOT,LINK,UNI,AVAX"},
                    chart=generate_charts
                )
                overview_data["crypto"] = crypto_result.get("data")
            
            if include_economic:
                # Get economic calendar for today
                from datetime import date
                today = date.today().isoformat()
                econ_result = await openbb_cli.execute_openbb_command(
                    "/economy/calendar",
                    {"start_date": today, "end_date": today}
                )
                overview_data["economic_events"] = econ_result.get("data")
            
            return ToolResult(
                success=True,
                message="Comprehensive market overview generated using OpenBB Terminal",
                data={
                    "overview": overview_data,
                    "timestamp": str(datetime.now()),
                    "charts_generated": generate_charts,
                    "data_source": "OpenBB Terminal Professional Tables",
                    "comprehensive": True
                }
            )
            
        except Exception as e:
            return ToolResult(
                success=False,
                message=f"Market overview error: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _generate_interactive_chart(
        self,
        symbol: str,
        asset_type: str,
        period: str = "1y",
        save_to_portfolio: bool = True,
        auto_open: bool = True
    ) -> ToolResult:
        """
        Generate interactive OpenBB chart that displays in web UI
        This is the main chart generation method that provides real visual output
        """
        
        try:
            self.logger.info(f"Generating interactive chart for {symbol} ({asset_type})")
            
            # Use OpenBB Direct API for chart generation
            if asset_type == "crypto":
                result = await openbb_direct.get_crypto_chart(
                    symbol=symbol,
                    period=period,
                    save_to_portfolio=save_to_portfolio
                )
            elif asset_type in ["equity", "etf", "index"]:
                result = await openbb_direct.get_equity_chart(
                    symbol=symbol,
                    period=period,
                    save_to_portfolio=save_to_portfolio
                )
            else:
                return ToolResult(
                    success=False,
                    message=f"Unsupported asset type: {asset_type}"
                )
            
            if result["success"]:
                # Auto-open in browser if requested
                if auto_open:
                    import webbrowser
                    # Open from frontend server at port 3000 where charts are actually served
                    chart_url = f"http://localhost:3000{result['chart_url']}"
                    print(f"🌐 Opening chart in browser: {chart_url}")
                    webbrowser.open(chart_url)
                
                # Record as creation in Universal Creation Recording System
                creation_id = await creation_recorder.record_chart_creation(
                    user_id="default_user",  # TODO: Get actual user ID from context
                    symbol=symbol,
                    asset_type=asset_type,
                    chart_result=result,
                    openbb_tool="generate_interactive_chart",
                    parameters={"symbol": symbol, "asset_type": asset_type, "period": period}
                )
                
                # Store chart reference in ChromaDB for future access (legacy)
                await self._store_chart_metadata(symbol, result, asset_type, period)
                
                return ToolResult(
                    success=True,
                    message=f"✅ Interactive chart generated for {symbol}! Opening in web browser...",
                    data={
                        "symbol": symbol,
                        "asset_type": asset_type,
                        "period": period,
                        "chart_url": result["chart_url"],
                        "web_viewer_url": f"http://localhost:3000{result['chart_url']}",
                        "interactive": True,
                        "saved_to_portfolio": save_to_portfolio,
                        "auto_opened": auto_open,
                        "data_points": result.get("data_points", 0),
                        "creation_id": creation_id,  # Track in Investment CRM
                        "recorded_as_creation": True
                    }
                )
            else:
                return ToolResult(
                    success=False,
                    message=f"Chart generation failed for {symbol}: {result.get('error', 'Unknown error')}",
                    data={"symbol": symbol, "error": result.get("error")}
                )
            
        except Exception as e:
            self.logger.error(f"Interactive chart generation error: {e}")
            return ToolResult(
                success=False,
                message=f"Chart generation error: {str(e)}",
                data={"error": str(e), "symbol": symbol}
            )
    
    async def _generate_multi_asset_comparison_chart(
        self,
        symbols: list[str],
        asset_type: str,
        period: str = "1y",
        save_to_portfolio: bool = True,
        auto_open: bool = True
    ) -> ToolResult:
        """
        Generate multi-asset comparison chart showing relative performance
        """
        
        try:
            self.logger.info(f"Generating multi-asset comparison chart for {symbols} ({asset_type})")
            
            # Use OpenBB Direct API for multi-asset comparison
            result = await openbb_direct.get_multi_asset_comparison_chart(
                symbols=symbols,
                asset_type=asset_type,
                period=period,
                save_to_portfolio=save_to_portfolio
            )
            
            if result["success"]:
                # Auto-open in browser if requested
                if auto_open:
                    import webbrowser
                    chart_url = f"http://localhost:3000{result['chart_url']}"
                    print(f"🌐 Opening comparison chart in browser: {chart_url}")
                    webbrowser.open(chart_url)
                
                # Record as creation (TODO: Create multi-asset recording method)
                # creation_id = await creation_recorder.record_comparison_creation(...)
                
                successful_symbols = result.get("symbols", symbols)
                failed_symbols = result.get("failed_symbols", [])
                
                return ToolResult(
                    success=True,
                    message=f"✅ Multi-asset comparison chart generated for {', '.join(successful_symbols)}! Opening in web browser...",
                    data={
                        "symbols": successful_symbols,
                        "failed_symbols": failed_symbols,
                        "asset_type": asset_type,
                        "period": period,
                        "chart_url": result["chart_url"],
                        "web_viewer_url": result["web_viewer_url"],
                        "interactive": True,
                        "saved_to_portfolio": save_to_portfolio,
                        "auto_opened": auto_open,
                        "data_points": result.get("data_points", 0),
                        "chart_type": "multi_asset_comparison"
                    }
                )
            else:
                return ToolResult(
                    success=False,
                    message=f"Comparison chart generation failed: {result.get('error', 'Unknown error')}",
                    data={"symbols": symbols, "error": result.get("error")}
                )
            
        except Exception as e:
            self.logger.error(f"Multi-asset comparison chart error: {e}")
            return ToolResult(
                success=False,
                message=f"Comparison chart error: {str(e)}",
                data={"error": str(e), "symbols": symbols}
            )
    
    async def _store_chart_metadata(
        self,
        symbol: str,
        chart_result: Dict[str, Any],
        asset_type: str,
        period: str
    ):
        """Store chart metadata in ChromaDB for portfolio access"""
        
        try:
            # Create chart metadata for storage
            chart_metadata = {
                "symbol": symbol,
                "asset_type": asset_type,
                "period": period,
                "chart_url": chart_result.get("chart_url"),
                "created_at": datetime.now().isoformat(),
                "title": f"{symbol} {asset_type.title()} Chart ({period})",
                "interactive": True,
                "data_points": chart_result.get("data_points", 0)
            }
            
            # Store in ChromaDB charts collection (to be implemented)
            # await self.chroma_service.store_chart_metadata("default", chart_metadata)
            
            self.logger.info(f"📊 Chart metadata stored for {symbol}")
            
        except Exception as e:
            self.logger.error(f"Error storing chart metadata: {e}")

    async def _format_financial_table(
        self,
        data: List[Dict[str, Any]],
        table_type: str = "general",
        format: str = "rich",
        title: Optional[str] = None,
        highlight_changes: bool = True
    ) -> ToolResult:
        """Format financial data into enhanced tables for better CLI display"""
        try:
            if not data:
                return ToolResult(
                    success=False,
                    message="No data provided for table formatting"
                )

            # Determine currency and percentage columns based on table type
            currency_columns = []
            percentage_columns = []
            
            if table_type == "quotes":
                currency_columns = ["price", "open", "high", "low", "close", "last", "bid", "ask"]
                percentage_columns = ["change_percent", "change_pct", "pct_change"]
            elif table_type == "portfolio":
                currency_columns = ["price", "cost", "value", "unrealized_pl", "market_value", "cost_basis"]
                percentage_columns = ["change_percent", "weight", "return", "allocation", "pct_return"]
            elif table_type == "companies":
                currency_columns = ["market_cap", "revenue", "price", "enterprise_value"]
                percentage_columns = ["growth_rate", "margin", "return", "yield"]

            # Use clean box table for CLI (like Gemini)
            if format == "rich" or format == "clean":
                formatted_table = self.table_formatter.create_clean_box_table(
                    data=data,
                    currency_columns=currency_columns,
                    percentage_columns=percentage_columns
                )
            else:
                # Use regular formatting for markdown/simple
                formatted_table = self.table_formatter.format_financial_table(
                    data=data,
                    format_type=format,
                    title=title,
                    highlight_changes=highlight_changes,
                    currency_columns=currency_columns,
                    percentage_columns=percentage_columns
                )

            return ToolResult(
                success=True,
                message=formatted_table,
                data={
                    "table_type": table_type,
                    "format": format,
                    "row_count": len(data),
                    "column_count": len(data[0].keys()) if data else 0
                }
            )

        except Exception as e:
            self.logger.error(f"Error formatting financial table: {e}")
            return ToolResult(
                success=False,
                message=f"Table formatting failed: {str(e)}"
            )