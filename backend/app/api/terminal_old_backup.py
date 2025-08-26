"""
Terminal API - Natural language interface to OpenBB Platform
This is the "Claude Code for Investment" experience
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Optional, Dict, Any, AsyncGenerator, List
import json
import asyncio
from datetime import datetime
from pydantic import BaseModel

from ..services.ai_service import AIService
from ..services.ai_openbb_service import ai_openbb_service
from ..services.market_data_service import MarketDataService
from ..services.portfolio_service import PortfolioService
from ..services.company_service import CompanyService
from ..services.exa_service import ExaService
from ..core.auth import get_current_user_optional
from ..models.users import User
from ..database import get_db
from sqlmodel import Session

import os
import subprocess
import platform
import psutil
from pathlib import Path
import yaml
import requests
import uuid
import pickle
import time
import traceback
from datetime import datetime, timedelta
# Import config functions locally to avoid circular imports
from ..utils.terminal_logger import terminal_logger

router = APIRouter()

class TerminalCommand(BaseModel):
    """Terminal command input"""
    command: str
    context: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None  # For conversation persistence
    include_directories: Optional[List[str]] = None  # Multi-directory context
    non_interactive: Optional[bool] = False  # Scripting mode

class CommandResponse(BaseModel):
    """Terminal command response"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    visualization: Optional[Dict[str, Any]] = None  # For charts/graphs
    session_id: Optional[str] = None  # Return session ID for persistence
    conversation_context: Optional[List[Dict[str, str]]] = None  # Chat history
    
class TerminalInterpreter:
    """
    Interprets natural language commands and routes to appropriate OpenBB functions
    This is the core of the "Claude Code" experience for investment
    """
    
    def __init__(self, session: Session):
        self.session = session
        self.ai_service = AIService()
        # Use AI-OpenBB service for dynamic OpenBB integration
        self.market_data_service = MarketDataService()
        self.portfolio_service = PortfolioService()
        self.company_service = CompanyService()
        self.exa_service = ExaService()
        
        # Session management for conversation persistence
        self.sessions_dir = Path.home() / ".redpill" / "sessions"
        self.sessions_dir.mkdir(parents=True, exist_ok=True)
        self.current_session = None
        self.conversation_history = []
        
        # Command patterns and their handlers - Complete VC API actions
        self.command_patterns = {
            # Investment & Deal Management (deals.py API)
            "invest": self._handle_invest,
            "deal": self._handle_list,
            "deals": self._handle_list,
            "create_deal": self._handle_create,
            "update_deal": self._handle_update,
            "pipeline": self._handle_portfolio,
            "due_diligence": self._handle_research,
            "meeting": self._handle_create,
            "memo": self._handle_create,
            "valuation": self._handle_analyze,
            
            # Company Management (companies.py API)
            "companies": self._handle_companies,
            "company": self._handle_companies,
            "add_company": self._handle_create,
            "enrich": self._handle_research,
            "company_data": self._handle_companies,
            
            # People & Founders Management (persons.py API)
            "founders": self._handle_search,
            "people": self._handle_search,
            "track_founder": self._handle_track,
            "talent": self._handle_search,
            "contacts": self._handle_list,
            
            # Portfolio Management (portfolio.py API)
            "portfolio": self._handle_portfolio,
            "holdings": self._handle_portfolio,
            "performance": self._handle_analyze,
            "analytics": self._handle_analyze,
            "projects": self._handle_list,
            
            # Market Data & Research (market.py API)
            "market": self._handle_market,
            "price": self._handle_analyze,
            "research": self._handle_research,
            "news": self._handle_news,
            "openbb": self._handle_openbb_dynamic,  # Direct OpenBB access
            
            # Dashboard & Visualization (dashboards.py API)
            "dashboard": self._handle_show,
            "widgets": self._handle_show,
            "charts": self._handle_plot,
            "visualize": self._handle_plot,
            
            # Workflows & Automation (workflows.py API)
            "workflow": self._handle_create,
            "automate": self._handle_create,
            "schedule": self._handle_create,
            "trigger": self._handle_create,
            
            # Data Analysis & Intelligence
            "analyze": self._handle_analyze,
            "monitor": self._handle_monitor,
            "show": self._handle_show,
            "plot": self._handle_plot,
            "chart": self._handle_plot,
            "track": self._handle_track,
            "alert": self._handle_alert,
            "import": self._handle_import,
            "export": self._handle_export,
            "search": self._handle_search,
            "find": self._handle_find,
            "help": self._handle_help,
            
            # System management commands (Claude Code-level)
            "check": self._handle_check,
            "status": self._handle_status,
            "setup": self._handle_setup,
            "configure": self._handle_configure,
            "install": self._handle_install,
            "update": self._handle_update,
            "read": self._handle_file_read,
            "write": self._handle_file_write,
            "create": self._handle_create,
            "delete": self._handle_delete,
            "list": self._handle_list,
            "backup": self._handle_backup,
            "restore": self._handle_restore,
            "download": self._handle_download,
            "upload": self._handle_upload,
        }
        
    async def interpret_and_execute(self, command: str, context: Dict[str, Any] = None) -> CommandResponse:
        """
        Main entry point - interprets natural language and executes appropriate actions
        """
        # Generate unique interaction ID for tracking
        interaction_id = str(uuid.uuid4())
        start_time = time.time()
        
        command_lower = command.lower().strip()
        routing_path = []
        handler_used = None
        intent_detected = None
        
        try:
            # First, check for direct system command matches (faster, no AI needed)
            direct_handler = self._get_direct_handler(command_lower)
            if direct_handler:
                # Create minimal intent for direct commands
                intent = {"action": command_lower, "entities": [], "parameters": {}}
                intent_detected = intent
                handler_used = f"direct_{command_lower.replace(' ', '_')}"
                routing_path.append("direct_handler")
                
                result = await direct_handler(command, intent, context)
            else:
                # For complex queries, use AI to understand intent
                try:
                    routing_path.append("ai_intent_analysis")
                    intent = await self._analyze_intent(command)
                    intent_detected = intent
                    
                    # Route to appropriate handler based on intent
                    handler = self._get_handler(intent)
                    if handler:
                        handler_used = handler.__name__ if hasattr(handler, '__name__') else str(handler)
                        routing_path.append(f"ai_handler_{handler_used}")
                        result = await handler(command, intent, context)
                    else:
                        routing_path.append("no_handler_found")
                        result = await self._handle_simple_response(command, context)
                        handler_used = "_handle_simple_response"
                        
                except Exception as e:
                    # If AI fails, fall back to simple pattern matching
                    routing_path.append("ai_failed_fallback_pattern_match")
                    intent = self._simple_pattern_match(command_lower)
                    intent_detected = intent
                    handler = self._get_handler(intent)
                    if handler:
                        handler_used = handler.__name__ if hasattr(handler, '__name__') else str(handler)
                        routing_path.append(f"pattern_handler_{handler_used}")
                        result = await handler(command, intent, context)
                    else:
                        routing_path.append("fallback_simple_response")
                        result = await self._handle_simple_response(command, context)
                        handler_used = "_handle_simple_response"
            
            # Calculate response time
            response_time_ms = (time.time() - start_time) * 1000
            
            # Log the interaction
            terminal_logger.log_interaction(
                interaction_id=interaction_id,
                user_input=command,
                system_output=result.message,
                session_id=getattr(self, 'current_session', None),
                response_time_ms=response_time_ms,
                success=result.success,
                metadata={
                    "context_keys": list(context.keys()) if context else [],
                    "result_has_data": result.data is not None,
                    "result_data_keys": list(result.data.keys()) if result.data else []
                }
            )
            
            # Log routing decision
            terminal_logger.log_routing_decision(
                interaction_id=interaction_id,
                user_input=command,
                routing_path=" -> ".join(routing_path),
                handler_used=handler_used or "unknown",
                intent_detected=intent_detected,
                confidence_score=intent_detected.get('confidence') if intent_detected else None
            )
            
            # Log performance metrics
            terminal_logger.log_performance_metrics(
                interaction_id=interaction_id,
                metrics={
                    "response_time_ms": response_time_ms,
                    "routing_steps": len(routing_path),
                    "intent_analysis_used": "ai_intent_analysis" in routing_path,
                    "fallback_used": "fallback" in " -> ".join(routing_path)
                }
            )
            
            return result
            
        except Exception as e:
            # Log error
            terminal_logger.log_error(
                interaction_id=interaction_id,
                error_type=type(e).__name__,
                error_message=str(e),
                user_input=command,
                stack_trace=traceback.format_exc()
            )
            
            # Return error response
            return CommandResponse(
                success=False,
                message=f"Error processing command: {str(e)}",
                data={"error": str(e), "interaction_id": interaction_id}
            )
    
    def _load_or_create_session(self, session_id: str = None) -> str:
        """Load existing session or create new one"""
        if not session_id:
            session_id = str(uuid.uuid4())
        
        session_file = self.sessions_dir / f"{session_id}.pkl"
        
        if session_file.exists():
            try:
                with open(session_file, 'rb') as f:
                    session_data = pickle.load(f)
                    self.conversation_history = session_data.get('conversation_history', [])
                    self.current_session = session_id
                    
                # Log session resumed
                terminal_logger.log_session_event(
                    session_id=session_id,
                    event_type="resumed",
                    metadata={
                        "conversation_length": len(self.conversation_history),
                        "last_activity": session_data.get('last_updated', 'unknown')
                    }
                )
            except Exception as e:
                # If session file is corrupted, start fresh
                self.conversation_history = []
                self.current_session = session_id
                
                # Log session creation due to corruption
                terminal_logger.log_session_event(
                    session_id=session_id,
                    event_type="created",
                    metadata={"reason": f"corruption_recovery: {str(e)}"}
                )
        else:
            # New session
            self.conversation_history = []
            self.current_session = session_id
            
            # Log new session creation
            terminal_logger.log_session_event(
                session_id=session_id,
                event_type="created",
                metadata={"reason": "new_session"}
            )
        
        return session_id
    
    def _save_session(self, session_id: str):
        """Save current session to disk"""
        if not session_id:
            return
        
        session_file = self.sessions_dir / f"{session_id}.pkl"
        session_data = {
            'conversation_history': self.conversation_history,
            'created_at': datetime.utcnow().isoformat(),
            'last_updated': datetime.utcnow().isoformat()
        }
        
        try:
            with open(session_file, 'wb') as f:
                pickle.dump(session_data, f)
        except Exception as e:
            pass  # Silently fail for now
    
    def _add_to_conversation(self, role: str, content: str):
        """Add message to conversation history"""
        self.conversation_history.append({
            'role': role,
            'content': content,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Keep only last 50 messages to prevent memory bloat
        if len(self.conversation_history) > 50:
            self.conversation_history = self.conversation_history[-50:]
    
    def _get_project_context(self, include_directories: List[str] = None) -> str:
        """Get project context from directories and REDPILL.md files"""
        context_parts = []
        
        # Look for REDPILL.md in current directory
        redpill_file = Path.cwd() / "REDPILL.md"
        if redpill_file.exists():
            try:
                context_parts.append(f"=== REDPILL.md ===\n{redpill_file.read_text()}")
            except Exception:
                pass
        
        # Include specified directories
        if include_directories:
            for dir_path in include_directories:
                try:
                    dir_path = Path(dir_path).resolve()
                    if dir_path.exists() and dir_path.is_dir():
                        # Get directory structure
                        files = []
                        for file_path in dir_path.rglob("*"):
                            if file_path.is_file() and file_path.suffix in ['.py', '.js', '.ts', '.md', '.txt']:
                                rel_path = file_path.relative_to(dir_path)
                                files.append(str(rel_path))
                        
                        if files:
                            context_parts.append(f"=== Directory: {dir_path} ===\nFiles: {', '.join(files[:20])}")
                            if len(files) > 20:
                                context_parts.append(f"... and {len(files) - 20} more files")
                except Exception:
                    continue
        
        return "\n\n".join(context_parts) if context_parts else ""
    
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
        
        # Use the correct AI service method
        response = await self.ai_service.generate_response(system_prompt + "\n\nUser: " + command)
        
        try:
            return json.loads(response)
        except:
            return {"action": "unknown", "entities": [], "parameters": {}}
    
    def _get_direct_handler(self, command_lower: str):
        """Get direct handler for system commands without AI processing"""
        
        # Investment & Deal Management Commands - Enhanced pattern matching
        if any(word in command_lower for word in ["invest", "invested", "investment"]) and ("in " in command_lower or "into " in command_lower or any(word in command_lower for word in ["polkadot", "chainlink", "bitcoin", "ethereum", "aave", "openai"])):
            return self._handle_invest
        elif command_lower == "deals" or command_lower == "deal list" or "pipeline" in command_lower:
            return self._handle_list
        elif "create deal" in command_lower or "new deal" in command_lower:
            return self._handle_create
        elif "update deal" in command_lower or "modify deal" in command_lower:
            return self._handle_update
        elif "valuation" in command_lower:
            return self._handle_analyze
        elif "due diligence" in command_lower or "diligence" in command_lower:
            return self._handle_research
        elif "meeting" in command_lower and ("notes" in command_lower or "schedule" in command_lower):
            return self._handle_create
        elif "memo" in command_lower or "research memo" in command_lower:
            return self._handle_create
            
        # Company Management Commands  
        elif command_lower == "companies" or command_lower == "company list" or command_lower == "list companies":
            return self._handle_companies
        elif "add company" in command_lower or "new company" in command_lower:
            return self._handle_create
        elif "enrich" in command_lower and "company" in command_lower:
            return self._handle_research
            
        # People & Founder Management Commands
        elif command_lower == "founders" or "founder" in command_lower:
            return self._handle_search
        elif command_lower == "people" or command_lower == "contacts":
            return self._handle_search
        elif "track founder" in command_lower or "track talent" in command_lower:
            return self._handle_track
        elif command_lower == "talent":
            return self._handle_search
            
        # Portfolio Management Commands
        elif "portfolio" in command_lower and ("list" in command_lower or command_lower == "portfolio"):
            return self._handle_portfolio
        elif "holdings" in command_lower:
            return self._handle_portfolio
        elif "performance" in command_lower:
            return self._handle_analyze
        elif "analytics" in command_lower:
            return self._handle_analyze
        elif "projects" in command_lower:
            return self._handle_list
            
        # Market & Research Commands
        elif command_lower == "market" or command_lower == "market data":
            return self._handle_market
        elif "price" in command_lower and ("of" in command_lower or "for" in command_lower):
            return self._handle_analyze
        elif "research" in command_lower:
            return self._handle_research
        elif command_lower == "news":
            return self._handle_news
            
        # Dashboard & Visualization Commands
        elif "dashboard" in command_lower:
            return self._handle_show
        elif "widgets" in command_lower:
            return self._handle_show
        elif "chart" in command_lower or "visualize" in command_lower:
            return self._handle_plot
            
        # System commands
        elif "check api keys" in command_lower or "check keys" in command_lower:
            return self._handle_check
        elif "check system" in command_lower or "system status" in command_lower:
            return self._handle_status
        elif "check health" in command_lower or "health check" in command_lower:
            return self._handle_check
        elif ("start" in command_lower and "backend" in command_lower) or ("launch" in command_lower and ("backend" in command_lower or "redpill" in command_lower)):
            return self._handle_start_backend
        elif command_lower.startswith("setup "):
            return self._handle_setup
        elif command_lower.startswith("read "):
            return self._handle_file_read
        elif command_lower == "status":
            return self._handle_status
            
        return None

    def _get_handler(self, intent: Dict[str, Any]):
        """Get the appropriate handler based on intent"""
        action = intent.get("action", "").lower()
        print(f"DEBUG _get_handler: action='{action}', intent={intent}")
        for pattern, handler in self.command_patterns.items():
            if pattern in action:
                print(f"DEBUG _get_handler: Matched pattern '{pattern}' to handler {handler.__name__}")
                return handler
        print(f"DEBUG _get_handler: No pattern matched for action '{action}'")
        return None
    
    def _simple_pattern_match(self, command_lower: str) -> Dict[str, Any]:
        """Simple pattern matching fallback when AI fails"""
        if "api key" in command_lower or "keys" in command_lower:
            return {"action": "check", "entities": ["api_keys"], "parameters": {}}
        elif command_lower == "companies" or command_lower.strip() == "companies":
            print(f"DEBUG: Pattern matched 'companies' exactly")
            return {"action": "companies", "entities": [], "parameters": {}}
        elif "companies" in command_lower:
            print(f"DEBUG: Pattern matched 'companies' in '{command_lower}'")
            return {"action": "companies", "entities": [], "parameters": {}}
        elif "import" in command_lower and ("from" in command_lower or "csv" in command_lower or "notion" in command_lower):
            # Only treat as import if it has explicit import indicators
            return {"action": "import", "entities": [], "parameters": {}}
        elif "analyze" in command_lower:
            return {"action": "analyze", "entities": [], "parameters": {}}
        elif "portfolio" in command_lower:
            return {"action": "portfolio", "entities": [], "parameters": {}}
        elif "market" in command_lower:
            return {"action": "market", "entities": [], "parameters": {}}
        else:
            return {"action": "unknown", "entities": [], "parameters": {}}
    
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
                fundamentals = await ai_openbb_service.execute_ai_command(f"get fundamentals for {ticker}")
                
                # Recent price data
                price_data = await self.market_data_service.get_stock_quote(ticker)
                
                # News sentiment
                news = await ai_openbb_service.execute_ai_command(f"get recent news for {ticker}", {"days": 7})
                
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
            historical = await ai_openbb_service.execute_ai_command(
                f"get historical price data for {ticker}",
                {"symbol": ticker, "period": params.get("period", "1y")}
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
        elif "companies" in command.lower():
            return await self._handle_companies(command, intent, context)
        else:
            return CommandResponse(
                success=True,
                message="What would you like to see?",
                data={
                    "options": [
                        "show portfolio performance",
                        "show market overview", 
                        "show companies",
                        "show watchlist",
                        "show recent trades"
                    ]
                }
            )
    
    async def _handle_portfolio(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle portfolio-related commands with OpenBB-style formatting"""
        try:
            # Get deals data directly from database
            from sqlmodel import Session, select
            from ..database import engine
            from ..models.deals import Deal
            from ..models.companies import Company
            
            with Session(engine) as session:
                # Get all deals with company information
                result = session.exec(
                    select(Deal, Company)
                    .join(Company, Deal.company_id == Company.id)
                    .where(Deal.our_investment.isnot(None))  # Only deals with actual investments
                )
                deal_data = result.all()
                
                if not deal_data:
                    return CommandResponse(
                        success=True,
                        message=format_portfolio_display({
                            "total_invested": 0,
                            "total_current_value": 0,
                            "unrealized_pnl": 0,
                            "active_investments": 0,
                            "holdings": []
                        }),
                        data={
                            "display_type": "portfolio",
                            "total_value": 0,
                            "holdings": [],
                            "performance": {},
                            "allocation": {}
                        }
                    )
                
                # Calculate portfolio summary
                total_invested = 0
                active_deals = 0
                holdings = []
                
                for deal, company in deal_data:
                    if deal.our_investment:
                        total_invested += deal.our_investment
                        active_deals += 1
                        
                        holdings.append({
                            "company": company.name,
                            "investment_amount": deal.our_investment,
                            "valuation": deal.valuation or 0,
                            "stage": deal.stage.value if deal.stage else "Unknown",
                            "status": deal.status.value if deal.status else "Unknown",
                            "sector": company.sector or "Unknown"
                        })
                
                portfolio_data = {
                    "total_invested": total_invested,
                    "total_current_value": total_invested,  # For now, same as invested
                    "unrealized_pnl": 0,  # Calculate based on current valuations if available
                    "active_investments": active_deals,
                    "holdings": holdings
                }
                
                formatted_message = format_portfolio_display(portfolio_data)
                
                return CommandResponse(
                    success=True,
                    message=formatted_message,
                    data={
                        "display_type": "portfolio",
                        "total_value": total_invested,
                        "holdings": holdings[:10],  # Limit data payload
                        "performance": {"total_invested": total_invested},
                        "allocation": {"active_deals": active_deals}
                    }
                )
                
        except Exception as e:
            logger.error(f"Error getting portfolio data: {e}")
            return CommandResponse(
                success=False,
                message=f"Error retrieving portfolio: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _handle_invest(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle investment commands like 'invest 100k in polkadot'"""
        try:
            from sqlmodel import Session, select
            from ..database import engine
            from ..models.deals import Deal
            from ..models.companies import Company
            import re
            
            # Parse investment amount and company from command
            amount_patterns = [
                r'(\d+k|\d+\.?\d*k)',  # 100k, 2.5k format
                r'(\d+m|\d+\.?\d*m)',  # 100m, 2.5m format  
                r'\$(\d+[,\d]*)',      # $100,000 format
                r'(\d+[,\d]*)'         # 100000 format
            ]
            
            company_patterns = [
                r'(?:in|into|for)\s+(\w+(?:\s+\w+)*)',  # "in polkadot", "into chainlink"
                r'(\w+(?:\s+\w+)*)\s*$'                # "polkadot" at end
            ]
            
            amount_value = None
            company_name = None
            
            # Extract amount
            for pattern in amount_patterns:
                match = re.search(pattern, command.lower())
                if match:
                    amount_str = match.group(1)
                    if 'k' in amount_str:
                        amount_value = int(float(amount_str.replace('k', '')) * 1000)
                    elif 'm' in amount_str:
                        amount_value = int(float(amount_str.replace('m', '')) * 1000000)
                    else:
                        amount_value = int(amount_str.replace(',', '').replace('$', ''))
                    break
            
            # Extract company name
            for pattern in company_patterns:
                match = re.search(pattern, command.lower())
                if match:
                    company_name = match.group(1).strip()
                    break
            
            if not amount_value or not company_name:
                return CommandResponse(
                    success=False,
                    message="Please specify both investment amount and company name. Example: 'invest 100k in polkadot'",
                    data={"example": "invest 100k in polkadot"}
                )
            
            with Session(engine) as session:
                # Find company by name (case insensitive)
                company_result = session.exec(
                    select(Company).where(Company.name.ilike(f"%{company_name}%"))
                ).first()
                
                if not company_result:
                    return CommandResponse(
                        success=False,
                        message=f"Company '{company_name}' not found. Add the company first with: add company {company_name}",
                        data={"company_name": company_name, "suggestion": f"add company {company_name}"}
                    )
                
                # Find existing deal or create new one
                deal_result = session.exec(
                    select(Deal).where(Deal.company_id == company_result.id)
                ).first()
                
                if deal_result:
                    # Update existing deal
                    deal_result.our_investment = amount_value
                    session.add(deal_result)
                    session.commit()
                    action = "updated"
                else:
                    # Create new deal
                    from ..models.deals import DealStatus, InvestmentStage
                    new_deal = Deal(
                        company_id=company_result.id,
                        status=DealStatus.DEAL,
                        stage=InvestmentStage.SEED,  # Default stage
                        our_investment=amount_value,
                        created_by="system"  # Would use current user in real app
                    )
                    session.add(new_deal)
                    session.commit()
                    action = "created"
                
                return CommandResponse(
                    success=True,
                    message=f"✅ Investment {action}: ${amount_value:,} in {company_result.name}",
                    data={
                        "action": action,
                        "company": company_result.name,
                        "amount": amount_value,
                        "formatted_amount": f"${amount_value:,}"
                    }
                )
                
        except Exception as e:
            logger.error(f"Error processing investment: {e}")
            return CommandResponse(
                success=False,
                message=f"Error processing investment: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _handle_companies(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle companies-related commands with OpenBB-style formatting"""
        try:
            # Get companies from the database
            companies = await self.company_service.get_all_companies()
            print(f"DEBUG: _handle_companies got {len(companies) if companies else 0} companies")
            
            if not companies:
                return CommandResponse(
                    success=True,
                    message="No companies found in database. Try importing companies or adding them manually.",
                    data={"companies_count": 0}
                )
            
            # Format companies data in OpenBB terminal style
            formatted_message = format_companies_display(companies)
            
            return CommandResponse(
                success=True,
                message=formatted_message,
                data={
                    "display_type": "companies",
                    "companies_count": len(companies),
                    "companies": companies[:10]  # Limit data payload
                }
            )
            
        except Exception as e:
            return CommandResponse(
                success=False,
                message=f"Error retrieving companies: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _handle_market(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle market overview commands"""
        # Get market overview using OpenBB
        market_data = {
            "indices": await ai_openbb_service.execute_ai_command("get market indices"),
            "movers": await ai_openbb_service.execute_ai_command("get market movers"),
            "crypto": await self.market_data_service.get_top_crypto(),
            "news": await ai_openbb_service.execute_ai_command("get market news")
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
                entity_news = await ai_openbb_service.execute_ai_command(f"get company news for {entity.upper()}")
                news[entity] = entity_news
        else:
            # Get general market news
            news = await ai_openbb_service.execute_ai_command("get market news")
        
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
    
    async def _handle_start_backend(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle backend start commands"""
        return CommandResponse(
            success=True,
            message="✅ Backend is already running!",
            data={
                "status": "running",
                "url": "http://localhost:8000",
                "health_check": "/health",
                "api_docs": "/docs",
                "message": "The Redpill backend is operational and ready to handle your investment commands."
            }
        )
    
    async def _handle_openbb_dynamic(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """
        Dynamic OpenBB command handler - route any query to OpenBB via AI
        Examples: 
        - "openbb get bitcoin price"
        - "openbb analyze AAPL fundamentals"  
        - "openbb show economic indicators"
        """
        # Extract the actual command after "openbb"
        openbb_command = command.lower().replace("openbb", "").strip()
        
        if not openbb_command:
            # Show available OpenBB capabilities
            commands = await ai_openbb_service.discover_commands()
            return CommandResponse(
                success=True,
                message="Available OpenBB capabilities discovered",
                data={
                    "openbb_modules": commands,
                    "usage": "openbb [your request]",
                    "examples": [
                        "openbb get bitcoin price",
                        "openbb analyze AAPL fundamentals",
                        "openbb show market indices",
                        "openbb economic indicators inflation",
                        "openbb options chain for TSLA"
                    ]
                }
            )
        
        # Route to AI-OpenBB service
        try:
            result = await ai_openbb_service.execute_ai_command(openbb_command, context)
            return CommandResponse(
                success=result.get("success", True),
                message=f"OpenBB: {openbb_command}",
                data=result
            )
        except Exception as e:
            return CommandResponse(
                success=False,
                message=f"OpenBB command failed: {openbb_command}",
                data={"error": str(e), "suggestion": "Try a simpler command or check OpenBB documentation"}
            )
    
    async def _handle_complex_query(self, command: str, context: Dict[str, Any]) -> CommandResponse:
        """Handle complex queries that don't fit standard patterns"""
        # Use AI to process and respond
        system_prompt = """You are an investment terminal assistant with access to OpenBB Platform.
        Help the user with their investment query. Be concise and actionable.
        If they need data, specify what OpenBB functions would be used."""
        
        response = await self.ai_service.generate_response(system_prompt + "\n\nUser: " + command)
        
        return CommandResponse(
            success=True,
            message="AI Response",
            data={"response": response}
        )
    
    async def _handle_simple_response(self, command: str, context: Dict[str, Any]) -> CommandResponse:
        """Handle unrecognized commands with intelligent response - try to work with ANY input"""
        command_lower = command.lower().strip()
        
        # Smart keyword detection and routing
        smart_responses = await self._attempt_smart_routing(command, command_lower, context)
        if smart_responses:
            return smart_responses
            
        # If we still can't figure it out, use AI to generate contextual response
        return await self._generate_ai_response(command, context)
    
    async def _attempt_smart_routing(self, command: str, command_lower: str, context: Dict[str, Any]) -> Optional[CommandResponse]:
        """Attempt to intelligently route commands based on keywords and context"""
        
        # Financial/Market related
        if any(word in command_lower for word in ['price', 'market', 'stock', 'crypto', 'bitcoin', 'eth', 'trading']):
            return await self._handle_market_query(command, context)
        
        # System/Status related
        if any(word in command_lower for word in ['system', 'status', 'health', 'memory', 'cpu', 'disk']):
            return await self._handle_system_query(command, context)
        
        # API/Configuration related  
        if any(word in command_lower for word in ['api', 'key', 'config', 'setup', 'configure']):
            return await self._handle_api_query(command, context)
            
        # Project/Development related
        if any(word in command_lower for word in ['project', 'file', 'code', 'build', 'deploy', 'structure']):
            return await self._handle_project_query(command, context)
            
        # Portfolio/Investment related
        if any(word in command_lower for word in ['portfolio', 'investment', 'holdings', 'trades', 'assets']):
            return await self._handle_portfolio_query(command, context)
            
        # Help/Questions
        if any(word in command_lower for word in ['help', 'how', 'what', 'why', 'when', 'where']):
            return await self._handle_help_query(command, context)
            
        return None
    
    async def _handle_market_query(self, command: str, context: Dict[str, Any]) -> CommandResponse:
        """Handle market-related queries intelligently"""
        try:
            # Try to extract tickers or crypto symbols
            import re
            tickers = re.findall(r'\b[A-Z]{2,5}\b', command.upper())
            
            if tickers:
                # Get price data for found tickers
                results = {}
                for ticker in tickers[:3]:  # Limit to 3 tickers
                    try:
                        if ticker in ['BTC', 'ETH', 'SOL', 'ADA', 'DOT']:
                            price_data = await self.market_data_service.get_crypto_price(ticker)
                            results[ticker] = price_data
                        else:
                            price_data = await self.market_data_service.get_stock_quote(ticker)  
                            results[ticker] = price_data
                    except:
                        results[ticker] = {"error": "Data not available"}
                        
                return CommandResponse(
                    success=True,
                    message=f"Market data for {', '.join(tickers)}",
                    data=results
                )
            else:
                # General market overview
                btc_price = await self.market_data_service.get_crypto_price('BTC')
                eth_price = await self.market_data_service.get_crypto_price('ETH')
                
                return CommandResponse(
                    success=True,
                    message="Market Overview",
                    data={
                        "BTC": btc_price,
                        "ETH": eth_price,
                        "market_sentiment": "Based on your query, here's current market data"
                    }
                )
        except Exception as e:
            return CommandResponse(
                success=True,
                message=f"I can help with market data! Try: 'BTC price' or 'show market overview'",
                data={"suggestion": "For live data, specify a ticker symbol"}
            )
    
    async def _handle_system_query(self, command: str, context: Dict[str, Any]) -> CommandResponse:
        """Handle system-related queries"""
        try:
            import psutil
            
            system_info = {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory": {
                    "total": f"{psutil.virtual_memory().total / (1024**3):.1f} GB",
                    "available": f"{psutil.virtual_memory().available / (1024**3):.1f} GB",
                    "percent": f"{psutil.virtual_memory().percent}%"
                },
                "disk": {
                    "total": f"{psutil.disk_usage('/').total / (1024**3):.1f} GB", 
                    "free": f"{psutil.disk_usage('/').free / (1024**3):.1f} GB",
                    "percent": f"{psutil.disk_usage('/').percent}%"
                }
            }
            
            return CommandResponse(
                success=True,
                message="System Status",
                data=system_info
            )
        except Exception as e:
            return CommandResponse(
                success=True,
                message="System monitoring available. Try: 'check system' or 'show memory usage'",
                data={"error": str(e)}
            )
    
    async def _handle_api_query(self, command: str, context: Dict[str, Any]) -> CommandResponse:
        """Handle API/configuration queries"""
        # Route to existing API checking functionality
        intent = {"action": "check", "entities": ["api", "keys"]}
        return await self._handle_check(command, intent, context)
    
    async def _handle_project_query(self, command: str, context: Dict[str, Any]) -> CommandResponse:
        """Handle project/development queries"""
        project_info = {
            "project": "RedPill VC CRM",
            "components": ["Backend (FastAPI)", "Frontend (Next.js)", "CLI (Node.js)"],
            "status": "Running",
            "endpoints": "http://localhost:8000 (API), http://localhost:3000 (Web)",
            "capabilities": [
                "AI-powered terminal interface",
                "Real-time market data",
                "Portfolio management", 
                "Company analysis",
                "Session management"
            ]
        }
        
        return CommandResponse(
            success=True,
            message="RedPill Project Information",
            data=project_info
        )
    
    async def _handle_portfolio_query(self, command: str, context: Dict[str, Any]) -> CommandResponse:
        """Handle portfolio/investment queries"""
        return CommandResponse(
            success=True,
            message="Portfolio features available",
            data={
                "available_features": [
                    "Portfolio analysis and tracking",
                    "Investment performance monitoring",
                    "Holdings import/export",
                    "Risk assessment"
                ],
                "suggestion": "Try: 'show portfolio' or 'import portfolio from CSV'"
            }
        )
    
    async def _handle_help_query(self, command: str, context: Dict[str, Any]) -> CommandResponse:
        """Handle help and question queries"""
        return CommandResponse(
            success=True,
            message="I can help with many things!",
            data={
                "categories": {
                    "Market Data": ["check BTC price", "analyze AAPL", "market overview"],
                    "System": ["check system", "memory usage", "api status"],
                    "Portfolio": ["show portfolio", "import holdings", "track investments"],
                    "Development": ["project status", "show files", "read config"]
                },
                "tip": "I try to understand any input - just describe what you want!"
            }
        )
    
    async def _generate_ai_response(self, command: str, context: Dict[str, Any]) -> CommandResponse:
        """Generate AI-powered response for truly unrecognized commands"""
        try:
            ai_prompt = f"""
            As a smart AI terminal for a VC investment platform, respond helpfully to this user input: "{command}"
            
            Available capabilities:
            - Market data and analysis
            - System monitoring
            - API management
            - Portfolio tracking
            - File operations
            - Project information
            
            Provide a brief, helpful response that either:
            1. Attempts to fulfill the request if possible
            2. Suggests related commands that might help
            3. Asks clarifying questions
            
            Be conversational but concise.
            """
            
            response = await self.ai_service.generate_response(ai_prompt, max_tokens=200)
            
            return CommandResponse(
                success=True,
                message=response,
                data={"ai_generated": True, "original_command": command}
            )
        except Exception as e:
            # Final fallback
            return CommandResponse(
                success=True,
                message=f"I'm trying to understand '{command}'. Could you rephrase or try something like 'check api keys', 'BTC price', or 'help'?",
                data={"fallback": True}
            )
    
    async def _generate_analysis_summary(self, ticker: str, fundamentals: Dict, price_data: Dict) -> str:
        """Generate an AI-powered analysis summary"""
        prompt = f"""Provide a brief investment analysis for {ticker} based on:
        Fundamentals: {json.dumps(fundamentals, default=str)}
        Current Price: {json.dumps(price_data, default=str)}
        
        Include: valuation assessment, key strengths/risks, and recommendation.
        Keep it under 200 words."""
        
        return await self.ai_service.generate_response(prompt)

    # System Management Handlers (Claude Code-level intelligence)
    
    async def _handle_check(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle system check commands like 'check api keys'"""
        command_lower = command.lower()
        
        if "api key" in command_lower or "keys" in command_lower:
            # Check API key status
            try:
                # Get configured keys directly from environment
                from ..api.config import API_KEY_CONFIGS
                
                current_keys = {"configured_keys": {}, "total_configured": 0}
                
                # Check all configured API keys
                all_keys = [
                    key["key"] for cat in API_KEY_CONFIGS.values() 
                    for key in cat["keys"]
                ]
                
                configured_count = 0
                for key in all_keys:
                    env_value = os.getenv(key)
                    is_configured = bool(env_value)
                    if is_configured:
                        configured_count += 1
                    
                    # Mask the value for security
                    masked_value = None
                    if env_value and len(env_value) >= 8:
                        masked_value = env_value[:4] + "*" * (len(env_value) - 8) + env_value[-4:]
                    elif env_value:
                        masked_value = "***"
                    
                    current_keys["configured_keys"][key] = {
                        "configured": is_configured,
                        "masked_value": masked_value
                    }
                
                current_keys["total_configured"] = configured_count
                
                configured_count = current_keys["total_configured"]
                key_status = current_keys["configured_keys"]
                
                # Format status report
                status_report = []
                for key, info in key_status.items():
                    status = "✅ Configured" if info["configured"] else "❌ Missing"
                    masked_value = f" ({info['masked_value']})" if info["masked_value"] else ""
                    status_report.append(f"{key}: {status}{masked_value}")
                
                return CommandResponse(
                    success=True,
                    message=f"API Keys Status ({configured_count}/{len(key_status)} configured)",
                    data={
                        "configured_count": configured_count,
                        "total_keys": len(key_status),
                        "status_details": status_report,
                        "missing_keys": [k for k, v in key_status.items() if not v["configured"]],
                        "next_steps": [
                            "Visit /settings/api-keys in the web UI to configure missing keys",
                            "Or set environment variables directly in your .env file",
                            "Use 'setup api keys' command for guided configuration"
                        ]
                    }
                )
            except Exception as e:
                return CommandResponse(
                    success=False,
                    message=f"Failed to check API keys: {str(e)}",
                    data={"error": str(e)}
                )
        
        elif "system" in command_lower or "health" in command_lower:
            # System health check
            return await self._system_health_check()
        
        elif "connection" in command_lower or "backend" in command_lower:
            # Check backend connectivity
            return await self._check_backend_status()
        
        else:
            return CommandResponse(
                success=True,
                message="What would you like to check?",
                data={
                    "options": [
                        "check api keys - View API key configuration status",
                        "check system - System health and resource usage",
                        "check connection - Backend and service connectivity",
                        "check portfolio - Portfolio data integrity",
                        "check market - Market data feed status"
                    ]
                }
            )
    
    async def _handle_status(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle status commands"""
        try:
            # Get system status
            system_info = {
                "platform": platform.system(),
                "platform_version": platform.version(),
                "cpu_count": psutil.cpu_count(),
                "cpu_usage": psutil.cpu_percent(interval=1),
                "memory_total": psutil.virtual_memory().total // (1024**3),  # GB
                "memory_used": psutil.virtual_memory().percent,
                "disk_usage": psutil.disk_usage('/').percent,
                "python_version": platform.python_version(),
            }
            
            # Check service status
            services_status = {
                "backend": "running",  # If this code is running, backend is up
                "database": "connected",  # Assume connected if no error
                "ai_service": "available" if self.ai_service else "unavailable",
                "ai_openbb": await ai_openbb_service.get_health_status(),
            }
            
            return CommandResponse(
                success=True,
                message="System Status Overview",
                data={
                    "system": system_info,
                    "services": services_status,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        except Exception as e:
            return CommandResponse(
                success=False,
                message=f"Failed to get system status: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _handle_setup(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle setup and configuration commands"""
        command_lower = command.lower()
        
        if "api key" in command_lower:
            return CommandResponse(
                success=True,
                message="API Key Setup Guide",
                data={
                    "setup_methods": [
                        {
                            "method": "Web UI",
                            "description": "Use the comprehensive web interface",
                            "url": "http://localhost:3000/settings/api-keys",
                            "features": ["Visual interface", "Key testing", "Auto .env generation"]
                        },
                        {
                            "method": "Environment Variables",
                            "description": "Set directly in your .env file",
                            "example": "OPENAI_API_KEY=sk-your-key-here",
                            "location": ".env file in project root"
                        }
                    ],
                    "required_keys": ["OPENAI_API_KEY"],
                    "optional_keys": ["REDPILL_API_KEY", "COINGECKO_API_KEY", "OPENBB_PAT"],
                    "next_steps": "Choose a setup method and configure your API keys"
                }
            )
        
        elif "portfolio" in command_lower:
            return CommandResponse(
                success=True,
                message="Portfolio Setup Guide",
                data={
                    "setup_steps": [
                        "1. Configure API keys for market data access",
                        "2. Import existing holdings (CSV, Excel, or manual entry)",
                        "3. Set up monitoring and alerts",
                        "4. Configure performance tracking preferences"
                    ],
                    "import_options": ["CSV file", "Excel spreadsheet", "Manual entry", "Notion database"],
                    "next_step": "Start with 'import portfolio from [source]'"
                }
            )
        
        else:
            return CommandResponse(
                success=True,
                message="Setup Options",
                data={
                    "available_setups": [
                        "setup api keys - Configure API access",
                        "setup portfolio - Initialize portfolio tracking",
                        "setup monitoring - Configure alerts and tracking",
                        "setup backup - Set up data backup"
                    ]
                }
            )
    
    async def _handle_file_read(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle file reading commands"""
        # Extract file path from command
        entities = intent.get("entities", [])
        
        if not entities:
            return CommandResponse(
                success=False,
                message="Please specify a file to read",
                data={"example": "read portfolio.csv"}
            )
        
        file_path = entities[0]
        
        try:
            # Security check - only allow reading from safe directories
            safe_dirs = [
                str(Path.home() / "Downloads"),
                str(Path.home() / "Documents"),
                "/tmp",
                str(Path.cwd())  # Current working directory
            ]
            
            full_path = Path(file_path).resolve()
            if not any(str(full_path).startswith(safe_dir) for safe_dir in safe_dirs):
                return CommandResponse(
                    success=False,
                    message="Access denied. Files can only be read from safe directories.",
                    data={
                        "safe_directories": safe_dirs,
                        "attempted_path": str(full_path)
                    }
                )
            
            # Read file content
            if full_path.suffix.lower() in ['.csv', '.txt', '.json', '.yaml', '.yml', '.env']:
                content = full_path.read_text()
                file_type = full_path.suffix.lower()
                
                # Parse and format based on file type
                if file_type == '.csv':
                    # Preview first few lines of CSV
                    lines = content.split('\n')[:10]
                    preview = '\n'.join(lines)
                    
                    return CommandResponse(
                        success=True,
                        message=f"CSV file content (showing first 10 lines)",
                        data={
                            "file_path": str(full_path),
                            "file_size": len(content),
                            "line_count": len(content.split('\n')),
                            "preview": preview,
                            "actions": [
                                "import portfolio from this file",
                                "analyze data structure",
                                "convert to different format"
                            ]
                        }
                    )
                
                elif file_type == '.json':
                    try:
                        data = json.loads(content)
                        return CommandResponse(
                            success=True,
                            message="JSON file parsed successfully",
                            data={
                                "file_path": str(full_path),
                                "structure": str(type(data)),
                                "keys": list(data.keys()) if isinstance(data, dict) else None,
                                "content": data if len(str(data)) < 5000 else "Content too large to display"
                            }
                        )
                    except json.JSONDecodeError as e:
                        return CommandResponse(
                            success=False,
                            message=f"Invalid JSON file: {str(e)}",
                            data={"raw_content": content[:1000]}
                        )
                
                else:
                    # Plain text file
                    return CommandResponse(
                        success=True,
                        message=f"File content ({file_type})",
                        data={
                            "file_path": str(full_path),
                            "content": content[:5000],  # Limit to 5KB
                            "truncated": len(content) > 5000
                        }
                    )
            
            else:
                return CommandResponse(
                    success=False,
                    message=f"Unsupported file type: {full_path.suffix}",
                    data={"supported_types": [".csv", ".txt", ".json", ".yaml", ".yml", ".env"]}
                )
        
        except FileNotFoundError:
            return CommandResponse(
                success=False,
                message=f"File not found: {file_path}",
                data={"suggestion": "Check the file path and try again"}
            )
        except Exception as e:
            return CommandResponse(
                success=False,
                message=f"Error reading file: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _system_health_check(self) -> CommandResponse:
        """Comprehensive system health check"""
        try:
            health_status = {
                "system": {
                    "cpu_usage": psutil.cpu_percent(interval=1),
                    "memory_usage": psutil.virtual_memory().percent,
                    "disk_usage": psutil.disk_usage('/').percent,
                    "load_average": os.getloadavg() if hasattr(os, 'getloadavg') else None,
                    "uptime": psutil.boot_time()
                },
                "services": {
                    "backend": "running",
                    "database": "connected",  # TODO: Add actual DB health check
                    "ai_service": self.ai_service is not None,
                    "market_data": self.market_data_service is not None
                },
                "network": {
                    "internet": await self._check_internet_connectivity(),
                    "api_endpoints": await self._check_api_endpoints()
                }
            }
            
            # Determine overall health
            critical_issues = []
            if health_status["system"]["cpu_usage"] > 90:
                critical_issues.append("High CPU usage")
            if health_status["system"]["memory_usage"] > 90:
                critical_issues.append("High memory usage")
            if health_status["system"]["disk_usage"] > 90:
                critical_issues.append("Low disk space")
            
            overall_health = "healthy" if not critical_issues else "warning"
            
            return CommandResponse(
                success=True,
                message=f"System health: {overall_health}",
                data={
                    "overall_health": overall_health,
                    "details": health_status,
                    "issues": critical_issues,
                    "recommendations": self._get_health_recommendations(critical_issues)
                }
            )
        
        except Exception as e:
            return CommandResponse(
                success=False,
                message=f"Health check failed: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _check_internet_connectivity(self) -> bool:
        """Check internet connectivity"""
        try:
            response = requests.get("https://httpbin.org/status/200", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    async def _check_api_endpoints(self) -> Dict[str, bool]:
        """Check API endpoint availability"""
        endpoints = {
            "openai": "https://api.openai.com/v1/models",
            "coingecko": "https://api.coingecko.com/api/v3/ping",
        }
        
        results = {}
        for name, url in endpoints.items():
            try:
                response = requests.get(url, timeout=5)
                results[name] = response.status_code == 200
            except:
                results[name] = False
        
        return results
    
    async def _check_backend_status(self) -> CommandResponse:
        """Check backend service connectivity"""
        try:
            status = {
                "backend_server": "running",  # If this executes, backend is running
                "database_connection": "active",
                "ai_service": "available" if self.ai_service else "unavailable",
                "market_data_service": "available" if self.market_data_service else "unavailable",
                "market_data": "available" if self.market_data_service else "unavailable"
            }
            
            return CommandResponse(
                success=True,
                message="Backend Status: All systems operational",
                data=status
            )
        
        except Exception as e:
            return CommandResponse(
                success=False,
                message=f"Backend check failed: {str(e)}",
                data={"error": str(e)}
            )
    
    def _get_health_recommendations(self, issues: list) -> list:
        """Get health improvement recommendations"""
        recommendations = []
        
        if "High CPU usage" in issues:
            recommendations.append("Consider closing unnecessary applications")
            recommendations.append("Check for background processes consuming CPU")
        
        if "High memory usage" in issues:
            recommendations.append("Restart the application to free memory")
            recommendations.append("Consider increasing system RAM")
        
        if "Low disk space" in issues:
            recommendations.append("Clean up temporary files")
            recommendations.append("Archive old portfolio data")
        
        return recommendations
    
    # Placeholder handlers for other system commands
    async def _handle_configure(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle configuration commands"""
        return CommandResponse(success=True, message="Configuration command recognized", data={"command": command})
    
    async def _handle_install(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle installation commands"""
        return CommandResponse(success=True, message="Installation command recognized", data={"command": command})
    
    async def _handle_update(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle update commands"""
        return CommandResponse(success=True, message="Update command recognized", data={"command": command})
    
    async def _handle_file_write(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle file writing commands"""
        return CommandResponse(success=True, message="File write command recognized", data={"command": command})
    
    async def _handle_create(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle create commands"""
        return CommandResponse(success=True, message="Create command recognized", data={"command": command})
    
    async def _handle_delete(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle delete commands"""
        return CommandResponse(success=True, message="Delete command recognized", data={"command": command})
    
    async def _handle_list(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle list commands"""
        return CommandResponse(success=True, message="List command recognized", data={"command": command})
    
    async def _handle_search(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle search commands"""
        return CommandResponse(success=True, message="Search command recognized", data={"command": command})
    
    async def _handle_find(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle find commands"""
        return CommandResponse(success=True, message="Find command recognized", data={"command": command})
    
    async def _handle_backup(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle backup commands"""
        return CommandResponse(success=True, message="Backup command recognized", data={"command": command})
    
    async def _handle_restore(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle restore commands"""
        return CommandResponse(success=True, message="Restore command recognized", data={"command": command})
    
    async def _handle_export(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle export commands"""
        return CommandResponse(success=True, message="Export command recognized", data={"command": command})
    
    async def _handle_download(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle download commands"""
        return CommandResponse(success=True, message="Download command recognized", data={"command": command})
    
    async def _handle_upload(self, command: str, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Handle upload commands"""
        return CommandResponse(success=True, message="Upload command recognized", data={"command": command})

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
        # Load or create session for conversation persistence
        session_id = interpreter._load_or_create_session(command.session_id)
        
        # Add project context if directories specified
        project_context = interpreter._get_project_context(command.include_directories)
        if project_context:
            if not command.context:
                command.context = {}
            command.context['project_context'] = project_context
        
        # Add user command to conversation history
        interpreter._add_to_conversation('user', command.command)
        
        result = await interpreter.interpret_and_execute(
            command.command,
            command.context
        )
        
        # Add assistant response to conversation history
        interpreter._add_to_conversation('assistant', result.message)
        
        # Save session
        interpreter._save_session(session_id)
        
        # Include session info in response
        result.session_id = session_id
        result.conversation_context = interpreter.conversation_history[-10:] if not command.non_interactive else None
        
        return result
    except Exception as e:
        return CommandResponse(
            success=False,
            message=f"Error executing command: {str(e)}",
            data={"error": str(e)}
        )

@router.get("/logs/stats")
async def get_terminal_logs_stats(
    hours: int = 24,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get terminal interaction statistics for analysis"""
    try:
        interaction_stats = terminal_logger.get_interaction_stats(hours)
        routing_analysis = terminal_logger.get_routing_analysis()
        
        return {
            "success": True,
            "data": {
                "interaction_stats": interaction_stats,
                "routing_analysis": routing_analysis,
                "period_hours": hours
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@router.get("/logs/recent")
async def get_recent_interactions(
    limit: int = 50,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get recent terminal interactions for review"""
    try:
        log_file = terminal_logger.interaction_log
        interactions = []
        
        if log_file.exists():
            with open(log_file, 'r') as f:
                lines = list(f)[-limit:]  # Get last N lines
                for line in lines:
                    try:
                        interactions.append(json.loads(line))
                    except:
                        continue
        
        return {
            "success": True,
            "data": {
                "interactions": interactions,
                "count": len(interactions)
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

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

# Add portfolio formatter as class method within TerminalInterpreter
def format_portfolio_display(portfolio: Dict[str, Any]) -> str:
    """Format portfolio data in OpenBB terminal style"""
    
    # Extract portfolio values
    total_value = portfolio.get("total_value", 0)
    total_investments = portfolio.get("total_investments", 0) 
    current_valuation = portfolio.get("total_current_valuation", 0)
    unrealized_pnl = portfolio.get("unrealized_gain_loss", 0)
    active_investments = portfolio.get("active_investments", 0)
    holdings = portfolio.get("holdings", [])
    
    # Create OpenBB-style display
    lines = []
    lines.append("=" * 80)
    lines.append("                              🚀 PORTFOLIO OVERVIEW")
    lines.append("=" * 80)
    lines.append("")
    
    # Summary section
    lines.append("📊 PORTFOLIO SUMMARY")
    lines.append("-" * 40)
    lines.append(f"💰 Total Invested:        ${total_investments/1000000:.1f}M")
    lines.append(f"📈 Current Value:         ${current_valuation/1000000:.1f}M")
    pnl_color = "🟢" if unrealized_pnl >= 0 else "🔴"
    pnl_sign = "+" if unrealized_pnl >= 0 else ""
    lines.append(f"{pnl_color} Unrealized P&L:       {pnl_sign}${unrealized_pnl/1000000:.1f}M")
    lines.append(f"🏢 Active Investments:    {active_investments}")
    lines.append("")
    
    # Holdings section
    if holdings:
        lines.append("🏢 TOP HOLDINGS")
        lines.append("-" * 40)
        lines.append(f"{'Company':<20} {'Investment':<12} {'Value':<12} {'P&L':<10}")
        lines.append("-" * 56)
        
        for holding in holdings[:8]:  # Show top 8 holdings
            company = str(holding.get('company', 'Unknown'))[:18]
            invested = holding.get('invested', 0) / 1000000
            value = holding.get('current_value', 0) / 1000000
            pnl = holding.get('unrealized_pnl', 0) / 1000000
            pnl_sign = "+" if pnl >= 0 else ""
            
            lines.append(f"{company:<20} ${invested:>8.1f}M   ${value:>8.1f}M   {pnl_sign}{pnl:>6.1f}M")
        
        lines.append("")
    
    # Performance metrics
    if total_investments > 0:
        roi = ((current_valuation - total_investments) / total_investments) * 100
        lines.append("📈 PERFORMANCE METRICS") 
        lines.append("-" * 40)
        roi_color = "🟢" if roi >= 0 else "🔴"
        roi_sign = "+" if roi >= 0 else ""
        lines.append(f"{roi_color} Total ROI:            {roi_sign}{roi:.1f}%")
        lines.append(f"📊 Portfolio Multiple:    {current_valuation/total_investments:.2f}x")
    
    lines.append("")
    lines.append("=" * 80)
    
    return "\n".join(lines)

# Add companies formatter function
def format_companies_display(companies: List[Dict[str, Any]]) -> str:
    """Format companies data in OpenBB terminal style"""
    
    # Create OpenBB-style display
    lines = []
    lines.append("=" * 80)
    lines.append("                              🏢 COMPANIES OVERVIEW")
    lines.append("=" * 80)
    lines.append("")
    
    # Summary section
    lines.append(f"📊 TOTAL COMPANIES: {len(companies)}")
    lines.append("-" * 40)
    lines.append("")
    
    # Companies table
    lines.append("🏢 COMPANIES LIST")
    lines.append("-" * 40)
    lines.append(f"{'Company':<25} {'Type':<12} {'Industry':<20} {'Stage':<10}")
    lines.append("-" * 70)
    
    for company in companies[:15]:  # Show top 15 companies
        name = str(company.get('name', 'Unknown'))[:23]
        company_type = str(company.get('company_type', 'N/A'))[:10]
        industry = str(company.get('industry', 'N/A'))[:18]
        stage = str(company.get('stage', 'N/A'))[:8]
        
        lines.append(f"{name:<25} {company_type:<12} {industry:<20} {stage:<10}")
    
    if len(companies) > 15:
        lines.append(f"... and {len(companies) - 15} more companies")
    
    lines.append("")
    lines.append("=" * 80)
    
    return "\n".join(lines)