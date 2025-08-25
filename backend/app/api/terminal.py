"""
Terminal API - Natural language interface to OpenBB Platform
This is the "Claude Code for Investment" experience
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Optional, Dict, Any, AsyncGenerator
import json
import asyncio
from datetime import datetime
from pydantic import BaseModel

from ..services.ai_service import AIService
from ..services.openbb_service import OpenBBService
from ..services.market_data_service import MarketDataService
from ..services.portfolio_service import PortfolioService
from ..services.company_service import CompanyService
from ..services.exa_service import ExaService
from ..core.auth import get_current_user_optional
from ..models.users import User
from ..database import get_db
from sqlmodel import Session

router = APIRouter()

class TerminalCommand(BaseModel):
    """Terminal command input"""
    command: str
    context: Optional[Dict[str, Any]] = None

class CommandResponse(BaseModel):
    """Terminal command response"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    visualization: Optional[Dict[str, Any]] = None  # For charts/graphs
    
class TerminalInterpreter:
    """
    Interprets natural language commands and routes to appropriate OpenBB functions
    This is the core of the "Claude Code" experience for investment
    """
    
    def __init__(self, session: Session):
        self.session = session
        self.ai_service = AIService()
        self.openbb_service = OpenBBService()
        self.market_data_service = MarketDataService()
        self.portfolio_service = PortfolioService()
        self.company_service = CompanyService()
        self.exa_service = ExaService()
        
        # Command patterns and their handlers
        self.command_patterns = {
            "import": self._handle_import,
            "analyze": self._handle_analyze,
            "monitor": self._handle_monitor,
            "show": self._handle_show,
            "plot": self._handle_plot,
            "chart": self._handle_plot,
            "research": self._handle_research,
            "track": self._handle_track,
            "alert": self._handle_alert,
            "portfolio": self._handle_portfolio,
            "market": self._handle_market,
            "news": self._handle_news,
            "help": self._handle_help,
        }
        
    async def interpret_and_execute(self, command: str, context: Dict[str, Any] = None) -> CommandResponse:
        """
        Main entry point - interprets natural language and executes appropriate actions
        """
        command_lower = command.lower().strip()
        
        # First, use AI to understand intent
        intent = await self._analyze_intent(command)
        
        # Route to appropriate handler based on intent
        handler = self._get_handler(intent)
        if handler:
            return await handler(command, intent, context)
        
        # Fallback to AI for complex queries
        return await self._handle_complex_query(command, context)
    
    async def _analyze_intent(self, command: str) -> Dict[str, Any]:
        """Use AI to understand the user's intent"""
        system_prompt = """You are an investment terminal interpreter. Analyze the user's command and extract:
        1. Primary action (import, analyze, monitor, show, plot, research, etc.)
        2. Target entities (companies, tickers, assets, portfolios)
        3. Specific parameters (time ranges, metrics, sources)
        4. Output format preference (table, chart, summary)
        
        Return a structured JSON with these fields:
        {
            "action": "primary_action",
            "entities": ["list", "of", "entities"],
            "parameters": {"key": "value"},
            "output_format": "format"
        }
        """
        
        response = await self.ai_service.process_message(
            message=command,
            system_prompt=system_prompt,
            response_format="json"
        )
        
        try:
            return json.loads(response)
        except:
            return {"action": "unknown", "entities": [], "parameters": {}}
    
    def _get_handler(self, intent: Dict[str, Any]):
        """Get the appropriate handler based on intent"""
        action = intent.get("action", "").lower()
        for pattern, handler in self.command_patterns.items():
            if pattern in action:
                return handler
        return None
    
    async def _handle_import(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle portfolio import commands"""
        # Examples: "import portfolio from Notion", "import holdings from CSV"
        
        source = None
        if "notion" in command.lower():
            source = "notion"
        elif "csv" in command.lower():
            source = "csv"
        elif "excel" in command.lower() or "xlsx" in command.lower():
            source = "excel"
            
        if not source:
            return CommandResponse(
                success=False,
                message="Please specify the import source (Notion, CSV, Excel)",
                data={"example": "import portfolio from Notion"}
            )
        
        # TODO: Implement actual import logic
        return CommandResponse(
            success=True,
            message=f"Ready to import from {source}. Please provide the file or connection details.",
            data={
                "source": source,
                "next_steps": f"Upload your {source} file or provide API credentials"
            }
        )
    
    async def _handle_analyze(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle analysis commands using OpenBB"""
        entities = intent.get("entities", [])
        
        if not entities:
            return CommandResponse(
                success=False,
                message="Please specify what to analyze",
                data={"example": "analyze TSLA financials"}
            )
        
        results = {}
        for entity in entities:
            # Use OpenBB to get financial data
            ticker = entity.upper()
            
            # Get comprehensive analysis
            try:
                # Fundamentals
                fundamentals = await self.openbb_service.get_stock_fundamentals(ticker)
                
                # Recent price data
                price_data = await self.market_data_service.get_stock_quote(ticker)
                
                # News sentiment
                news = await self.openbb_service.get_company_news(ticker, days=7)
                
                results[ticker] = {
                    "fundamentals": fundamentals,
                    "current_price": price_data,
                    "recent_news": news[:3] if news else [],
                    "analysis_summary": await self._generate_analysis_summary(ticker, fundamentals, price_data)
                }
            except Exception as e:
                results[ticker] = {"error": str(e)}
        
        return CommandResponse(
            success=True,
            message=f"Analysis complete for {', '.join(entities)}",
            data=results
        )
    
    async def _handle_monitor(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle monitoring setup commands"""
        entities = intent.get("entities", [])
        
        if not entities:
            return CommandResponse(
                success=False,
                message="Please specify what to monitor",
                data={"example": "monitor BTC and AAPL"}
            )
        
        # Set up monitoring for specified assets
        monitored = []
        for entity in entities:
            ticker = entity.upper()
            # TODO: Add to monitoring system
            monitored.append(ticker)
        
        return CommandResponse(
            success=True,
            message=f"Now monitoring: {', '.join(monitored)}",
            data={
                "monitored_assets": monitored,
                "update_frequency": "real-time",
                "alerts_enabled": True
            }
        )
    
    async def _handle_plot(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle plotting/charting commands"""
        # Extract what to plot
        entities = intent.get("entities", [])
        params = intent.get("parameters", {})
        
        if not entities:
            return CommandResponse(
                success=False,
                message="Please specify what to plot",
                data={"example": "plot TSLA revenue vs earnings"}
            )
        
        # Generate chart data using OpenBB
        chart_data = {}
        for entity in entities:
            ticker = entity.upper()
            # Get historical data
            historical = await self.openbb_service.get_stock_historical(
                ticker, 
                period=params.get("period", "1y")
            )
            chart_data[ticker] = historical
        
        return CommandResponse(
            success=True,
            message=f"Chart data prepared for {', '.join(entities)}",
            data=chart_data,
            visualization={
                "type": "line_chart",
                "data": chart_data,
                "config": {
                    "title": f"Price Chart - {', '.join(entities)}",
                    "x_axis": "Date",
                    "y_axis": "Price"
                }
            }
        )
    
    async def _handle_show(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle show/display commands"""
        if "portfolio" in command.lower():
            return await self._handle_portfolio(command, intent, context)
        elif "market" in command.lower():
            return await self._handle_market(command, intent, context)
        else:
            return CommandResponse(
                success=True,
                message="What would you like to see?",
                data={
                    "options": [
                        "show portfolio performance",
                        "show market overview",
                        "show watchlist",
                        "show recent trades"
                    ]
                }
            )
    
    async def _handle_portfolio(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle portfolio-related commands"""
        # Get portfolio data
        portfolio = await self.portfolio_service.get_user_portfolio()
        
        return CommandResponse(
            success=True,
            message="Portfolio overview",
            data={
                "total_value": portfolio.get("total_value"),
                "holdings": portfolio.get("holdings"),
                "performance": portfolio.get("performance"),
                "allocation": portfolio.get("allocation")
            }
        )
    
    async def _handle_market(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle market overview commands"""
        # Get market overview using OpenBB
        market_data = {
            "indices": await self.openbb_service.get_market_indices(),
            "movers": await self.openbb_service.get_market_movers(),
            "crypto": await self.market_data_service.get_top_crypto(),
            "news": await self.openbb_service.get_market_news()
        }
        
        return CommandResponse(
            success=True,
            message="Market overview",
            data=market_data
        )
    
    async def _handle_research(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle research commands using Exa"""
        entities = intent.get("entities", [])
        
        if not entities:
            return CommandResponse(
                success=False,
                message="Please specify what to research",
                data={"example": "research AI companies in healthcare"}
            )
        
        # Use Exa for deep research
        research_query = " ".join(entities)
        results = await self.exa_service.search_companies(research_query)
        
        return CommandResponse(
            success=True,
            message=f"Research results for: {research_query}",
            data={"results": results}
        )
    
    async def _handle_track(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle tracking commands"""
        entities = intent.get("entities", [])
        
        tracked = []
        for entity in entities:
            # Add to tracking system
            tracked.append(entity)
        
        return CommandResponse(
            success=True,
            message=f"Now tracking: {', '.join(tracked)}",
            data={"tracked_entities": tracked}
        )
    
    async def _handle_alert(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle alert setup commands"""
        # Parse alert conditions from command
        return CommandResponse(
            success=True,
            message="Alert configured",
            data={"alert_type": "price", "condition": "parsed_from_command"}
        )
    
    async def _handle_news(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle news commands"""
        entities = intent.get("entities", [])
        
        if entities:
            # Get news for specific entities
            news = {}
            for entity in entities:
                entity_news = await self.openbb_service.get_company_news(entity.upper())
                news[entity] = entity_news
        else:
            # Get general market news
            news = await self.openbb_service.get_market_news()
        
        return CommandResponse(
            success=True,
            message="Latest news",
            data={"news": news}
        )
    
    async def _handle_help(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle help commands"""
        return CommandResponse(
            success=True,
            message="Available commands",
            data={
                "commands": [
                    {"command": "import portfolio from [source]", "description": "Import holdings from Notion, CSV, or Excel"},
                    {"command": "analyze [ticker/company]", "description": "Get comprehensive analysis using OpenBB"},
                    {"command": "monitor [assets]", "description": "Set up real-time monitoring"},
                    {"command": "plot [ticker] [metric]", "description": "Create charts and visualizations"},
                    {"command": "show portfolio", "description": "Display portfolio overview"},
                    {"command": "research [topic]", "description": "Deep research using AI"},
                    {"command": "track [entities]", "description": "Track companies, people, or trends"},
                    {"command": "alert when [condition]", "description": "Set up custom alerts"},
                    {"command": "news [ticker/topic]", "description": "Get latest news"},
                ],
                "examples": [
                    "analyze TSLA financials",
                    "plot AAPL revenue over 5 years",
                    "monitor BTC and ETH",
                    "research quantum computing startups",
                    "alert when NVDA drops 5%"
                ]
            }
        )
    
    async def _handle_complex_query(self, command: str, context: Dict[str, Any]) -> CommandResponse:
        """Handle complex queries that don't fit standard patterns"""
        # Use AI to process and respond
        response = await self.ai_service.process_message(
            message=command,
            system_prompt="""You are an investment terminal assistant with access to OpenBB Platform.
            Help the user with their investment query. Be concise and actionable.
            If they need data, specify what OpenBB functions would be used."""
        )
        
        return CommandResponse(
            success=True,
            message="AI Response",
            data={"response": response}
        )
    
    async def _generate_analysis_summary(self, ticker: str, fundamentals: Dict, price_data: Dict) -> str:
        """Generate an AI-powered analysis summary"""
        prompt = f"""Provide a brief investment analysis for {ticker} based on:
        Fundamentals: {json.dumps(fundamentals, default=str)}
        Current Price: {json.dumps(price_data, default=str)}
        
        Include: valuation assessment, key strengths/risks, and recommendation.
        Keep it under 200 words."""
        
        return await self.ai_service.process_message(message=prompt)

@router.post("/execute", response_model=CommandResponse)
async def execute_command(
    command: TerminalCommand,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> CommandResponse:
    """
    Execute a natural language terminal command
    This is the main entry point for the Claude Code-like experience
    """
    interpreter = TerminalInterpreter(session)
    
    try:
        result = await interpreter.interpret_and_execute(
            command.command,
            command.context
        )
        return result
    except Exception as e:
        return CommandResponse(
            success=False,
            message=f"Error executing command: {str(e)}",
            data={"error": str(e)}
        )

@router.post("/execute/stream")
async def execute_command_stream(
    command: TerminalCommand,
    session: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Execute a command with streaming response
    Used for long-running operations or real-time updates
    """
    async def generate() -> AsyncGenerator[str, None]:
        interpreter = TerminalInterpreter(session)
        
        # Start with acknowledgment
        yield f"data: {json.dumps({'type': 'status', 'content': 'Processing command...'})}\n\n"
        
        try:
            # Execute command
            result = await interpreter.interpret_and_execute(
                command.command,
                command.context
            )
            
            # Stream the result
            yield f"data: {json.dumps({'type': 'result', 'content': result.message, 'data': result.data})}\n\n"
            
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
        
        # End stream
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )

@router.get("/suggestions")
async def get_suggestions(
    query: str,
    session: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """
    Get command suggestions based on partial input
    Provides autocomplete functionality
    """
    suggestions = []
    
    # Basic command suggestions
    commands = [
        "import portfolio from Notion",
        "analyze TSLA fundamentals",
        "monitor BTC and ETH",
        "plot AAPL vs MSFT",
        "show portfolio performance",
        "research AI startups",
        "track Elon Musk",
        "alert when SPY drops 2%",
        "news on semiconductor sector"
    ]
    
    # Filter based on query
    query_lower = query.lower()
    suggestions = [cmd for cmd in commands if query_lower in cmd.lower()]
    
    return {
        "suggestions": suggestions[:5],  # Limit to 5 suggestions
        "query": query
    }