"""
AI-First Terminal API - Natural language interface to OpenBB Platform
New architecture: Intent-based routing with declarative system prompt
No hard-coded command handlers - everything routed through AI intent analysis
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Optional, Dict, Any, AsyncGenerator, List
import json
import asyncio
from datetime import datetime
from pydantic import BaseModel
from pathlib import Path

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
import time
import uuid
import traceback
from datetime import datetime, timedelta
from ..utils.terminal_logger import terminal_logger

router = APIRouter()

class TerminalCommand(BaseModel):
    """Terminal command input"""
    command: str
    context: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None
    include_directories: Optional[List[str]] = None
    non_interactive: Optional[bool] = False

class CommandResponse(BaseModel):
    """AI-First command response with trace"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    trace: Optional[Dict[str, Any]] = None  # New: trace/observability data
    visualization: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None
    conversation_context: Optional[List[Dict[str, str]]] = None

class AITerminalInterpreter:
    """
    AI-First Terminal Interpreter using declarative intent routing
    Replaces hard-coded patterns with flexible AI-driven command interpretation
    """
    
    def __init__(self, session: Session):
        self.session = session
        self.ai_service = AIService()
        self.market_data_service = MarketDataService()
        self.portfolio_service = PortfolioService()
        self.company_service = CompanyService()
        self.exa_service = ExaService()
        
        # Session management
        self.sessions_dir = Path.home() / ".redpill" / "sessions"
        self.sessions_dir.mkdir(parents=True, exist_ok=True)
        self.current_session = None
        self.conversation_history = []
        
        # Load system prompt from file
        self.system_prompt = self._load_system_prompt()
        
        # Intent router table - maps intents to tools
        self.router_table = {
            "import_portfolio": {"primary": "tool.csv_import", "secondary": ["tool.file_ingest"]},
            "generate_research": {"primary": "tool.openbb_research", "secondary": ["tool.news_summarize"]},
            "chart_company": {"primary": "tool.openbb_fundamentals", "secondary": ["tool.chart_spec"]},
            "chart_token_compare": {"primary": "tool.openbb_crypto", "secondary": ["tool.stats_compute"]},
            "daily_digest": {"primary": "tool.news_portfolio_filter", "secondary": ["tool.summary"]},
            "monitor_dashboard": {"primary": "tool.dashboard_define", "secondary": ["tool.alert_rules"]},
            "deal_management": {"primary": "tool.deals_crud", "secondary": ["tool.valuation_calc"]},
            "company_analysis": {"primary": "tool.companies_fetch", "secondary": ["tool.openbb_fundamentals"]},
            "portfolio_overview": {"primary": "tool.portfolio_aggregate", "secondary": ["tool.performance_calc"]},
            "investment_execution": {"primary": "tool.investment_create", "secondary": ["tool.deal_update"]},
            "system_control": {"primary": "tool.backend_control", "secondary": ["tool.api_status"]},
            "economic_calendar": {"primary": "tool.economic_calendar", "secondary": ["tool.exa_events"]},
            "news_analysis": {"primary": "tool.news_sentiment", "secondary": ["tool.social_sentiment"]},
            "etf_analysis": {"primary": "tool.etf_sectors", "secondary": ["tool.etf_holdings"]},
            "sector_analysis": {"primary": "tool.sector_compare", "secondary": ["tool.market_indices"]},
            "correlation_analysis": {"primary": "tool.correlation_calc", "secondary": ["tool.stats_compute"]}
        }
        
        # Tool specifications with actual implementations
        self.tools = {
            "tool.openbb_research": self._execute_openbb_research,
            "tool.openbb_fundamentals": self._execute_openbb_fundamentals,
            "tool.openbb_crypto": self._execute_openbb_crypto,
            "tool.deals_crud": self._execute_deals_crud,
            "tool.investment_create": self._execute_investment_create,
            "tool.backend_control": self._execute_backend_control,
            "tool.portfolio_aggregate": self._execute_portfolio_aggregate,
            "tool.companies_fetch": self._execute_companies_fetch,
            "tool.api_status": self._execute_api_status,
            # New comprehensive OpenBB-style features
            "tool.market_indices": self._execute_market_overview,
            "tool.sector_compare": self._execute_sector_analysis,
            "tool.correlation_calc": self._execute_correlation_analysis,
            "tool.options_data": self._execute_options_analysis,
            "tool.greeks_calc": self._execute_options_analysis,
            "tool.earnings_calendar": self._execute_earnings_analysis,
            "tool.economic_indicators": self._execute_economic_data,
            "tool.fed_data": self._execute_economic_data,
            "tool.news_sentiment": self._execute_news_analysis,
            "tool.social_sentiment": self._execute_news_analysis,
            "tool.defi_metrics": self._execute_openbb_crypto,
            # Missing tools that are needed by the router
            "tool.news_portfolio_filter": self._execute_news_analysis,
            "tool.chart_spec": self._execute_openbb_fundamentals,
            "tool.stats_compute": self._execute_openbb_crypto,
            "tool.performance_calc": self._execute_portfolio_aggregate,
            "tool.summary": self._execute_news_analysis,
            # Add dashboard_define mapping for market overview
            "tool.dashboard_define": self._execute_market_overview,
            "tool.alert_rules": self._execute_market_overview,
            "tool.economic_calendar": self._execute_economic_calendar,
            "tool.exa_events": self._execute_economic_calendar,
            "tool.etf_sectors": self._execute_etf_analysis,
            "tool.etf_holdings": self._execute_etf_analysis,
            "tool.csv_import": self._execute_portfolio_import,
            "tool.file_ingest": self._execute_portfolio_import
        }
    
    def _load_system_prompt(self) -> str:
        """Load the system prompt from file"""
        try:
            prompt_file = Path(__file__).parent.parent.parent / "prompts" / "system.redpill.md"
            if prompt_file.exists():
                return prompt_file.read_text()
            else:
                return "You are Redpill CLI, a natural-language interface for investment workflows."
        except Exception:
            return "You are Redpill CLI, a natural-language interface for investment workflows."
    
    async def interpret_and_execute(self, command: str, context: Dict[str, Any] = None) -> CommandResponse:
        """
        Main entry point - AI-first intent parsing and tool routing
        """
        interaction_id = str(uuid.uuid4())
        start_time = time.time()
        trace = {
            "interaction_id": interaction_id,
            "user_command": command,
            "routing_path": [],
            "tools_used": [],
            "confidence": 0.0,
            "execution_time": 0.0
        }
        
        try:
            # Step 1: Parse intent using AI with system prompt
            trace["routing_path"].append("ai_intent_parsing")
            intent_result = await self._parse_intent_ai(command)
            
            # Handle case where intent_result might be a string
            if isinstance(intent_result, dict):
                # intent_result is the full intent object
                intent = intent_result
                confidence = intent_result.get("confidence", 0.0)
            else:
                # Fallback if AI parsing failed
                intent = {"intent": "generate_research", "entities": {"query": command}}
                confidence = 0.5
            
            # Add original command text to intent for tools to access
            intent["text"] = command
            
            trace["confidence"] = confidence
            trace["detected_intent"] = intent
            
            # Step 2: Self-check - validate confidence and required fields
            validation_result = self._validate_intent(intent, confidence)
            if not validation_result["valid"]:
                return self._create_validation_response(validation_result, trace)
            
            # Step 3: Route to appropriate tool via router table
            trace["routing_path"].append("router_table_lookup")
            tool_chain = self._get_tool_chain(intent)
            
            if not tool_chain:
                trace["routing_path"].append("no_tool_found_fallback")
                return await self._handle_fallback(command, intent, trace)
            
            # Step 4: Execute tool chain
            trace["routing_path"].append("tool_execution")
            result = await self._execute_tool_chain(tool_chain, intent, context, trace)
            
            # Step 5: Calculate trace metrics
            trace["execution_time"] = (time.time() - start_time) * 1000
            
            # Log interaction
            self._log_interaction(interaction_id, command, result, trace)
            
            # Add trace to response
            result.trace = trace
            
            return result
            
        except Exception as e:
            trace["error"] = str(e)
            trace["routing_path"].append("exception_occurred")
            
            return CommandResponse(
                success=False,
                message=f"Error processing command: {str(e)}",
                data={"error": str(e)},
                trace=trace
            )
    
    async def _parse_intent_ai(self, command: str) -> Dict[str, Any]:
        """Use AI to parse command into canonical intent schema"""
        
        # Enhanced prompt with few-shot examples
        ai_prompt = f"""
{self.system_prompt}

Parse the following user command into the canonical intent schema:

User command: "{command}"

Return JSON with this exact structure:
{{
  "intent": "import_portfolio | generate_research | chart_company | chart_token_compare | daily_digest | monitor_dashboard | deal_management | company_analysis | portfolio_overview | investment_execution | system_control",
  "entities": {{
    "tickers": ["AAPL","SOL"],
    "companies": ["Tesla","OpenAI"],
    "amount": "100k|2.5m",
    "action": "create|read|update|start|check_api|help",
    "file_path": "/path/to/file.csv"
  }},
  "timeframe": {{"from":"2022-01-01","to":"2025-08-25","interval":"1d"}},
  "output_format": "text|chart|file|gui",
  "confidence": 0.0
}}

CRITICAL INTENT RULES:
- ANY command containing "import" AND "portfolio" AND "from" → ALWAYS intent: "import_portfolio"
- Extract file_path from file paths in import commands
- "what api keys" OR "which api keys" → intent: "system_control", action: "check_api"

Examples:
- "i invested polkadot 100k in 2022" → {{"intent": "investment_execution", "entities": {{"companies": ["polkadot"], "amount": "100k"}}, "confidence": 0.92}}
- "add coinbase into my tracking company" → {{"intent": "investment_execution", "entities": {{"companies": ["Coinbase"], "action": "create"}}, "confidence": 0.90}}
- "track Tesla as investment" → {{"intent": "investment_execution", "entities": {{"companies": ["Tesla"], "action": "create"}}, "confidence": 0.88}}
- "start backend" → {{"intent": "system_control", "entities": {{"action": "start"}}, "confidence": 0.98}}
- "what api keys should i fill in" → {{"intent": "system_control", "entities": {{"action": "check_api"}}, "confidence": 0.95}}
- "import my portfolio from /Users/marvin/Downloads/Crypto_for_all" → {{"intent": "import_portfolio", "entities": {{"file_path": "/Users/marvin/Downloads/Crypto_for_all"}}, "confidence": 0.94}}
- "import portfolio from /path/data.csv" → {{"intent": "import_portfolio", "entities": {{"file_path": "/path/data.csv"}}, "confidence": 0.95}}
- "companies" → {{"intent": "company_analysis", "entities": {{}}, "confidence": 0.95}}
- "portfolio" → {{"intent": "portfolio_overview", "entities": {{}}, "confidence": 0.95}}
- "market overview" → {{"intent": "monitor_dashboard", "entities": {{}}, "confidence": 0.95}}
- "show market indices" → {{"intent": "monitor_dashboard", "entities": {{}}, "confidence": 0.95}}
- "help" → {{"intent": "system_control", "entities": {{"action": "help"}}, "confidence": 0.95}}
- "compare NVDA, AMD, AVGO" → {{"intent": "chart_company", "entities": {{"tickers": ["NVDA", "AMD", "AVGO"], "action": "compare"}}, "confidence": 0.95}}
- "BTC and ETH quotes" → {{"intent": "chart_token_compare", "entities": {{"tickers": ["BTC", "ETH"]}}, "confidence": 0.95}}
- "quote for AAPL" → {{"intent": "chart_company", "entities": {{"tickers": ["AAPL"]}}, "confidence": 0.95}}
- "AAPL income statement" → {{"intent": "chart_company", "entities": {{"tickers": ["AAPL"], "action": "fundamentals"}}, "confidence": 0.95}}
- "NVDA fundamentals" → {{"intent": "chart_company", "entities": {{"tickers": ["NVDA"], "action": "fundamentals"}}, "confidence": 0.95}}
- "news for AAPL today" → {{"intent": "news_analysis", "entities": {{"tickers": ["AAPL"], "action": "news"}}, "confidence": 0.95}}
- "Tesla news" → {{"intent": "news_analysis", "entities": {{"tickers": ["TSLA"], "action": "news"}}, "confidence": 0.95}}
- "economic calendar for this week" → {{"intent": "economic_calendar", "entities": {{"country": ["US"]}}, "confidence": 0.95}}
- "upcoming economic events" → {{"intent": "economic_calendar", "entities": {{}}, "confidence": 0.90}}
- "top sectors in SPY" → {{"intent": "etf_analysis", "entities": {{"tickers": ["SPY"]}}, "confidence": 0.95}}
- "QQQ holdings breakdown" → {{"intent": "etf_analysis", "entities": {{"tickers": ["QQQ"]}}, "confidence": 0.90}}
- "technology sector performance" → {{"intent": "sector_analysis", "entities": {{"sector": "Technology"}}, "confidence": 0.95}}
- "healthcare sector breakdown" → {{"intent": "sector_analysis", "entities": {{"sector": "Healthcare"}}, "confidence": 0.95}}
- "sector analysis" → {{"intent": "sector_analysis", "entities": {{}}, "confidence": 0.90}}
- "BTC vs QQQ correlation" → {{"intent": "correlation_analysis", "entities": {{"asset1": "BTC", "asset2": "QQQ", "period": "90d"}}, "confidence": 0.95}}
- "rolling 90-day correlation BTC vs QQQ" → {{"intent": "correlation_analysis", "entities": {{"asset1": "BTC", "asset2": "QQQ", "period": "90d"}}, "confidence": 0.95}}
- "TSLA versus SPY correlation" → {{"intent": "correlation_analysis", "entities": {{"asset1": "TSLA", "asset2": "SPY", "period": "90d"}}, "confidence": 0.90}}
- "import /path/file.csv as crypto portfolio" → {{"intent": "import_portfolio", "entities": {{"file_path": "/path/file.csv", "portfolio_type": "crypto"}}, "confidence": 0.95}}
- "import portfolio from ~/Downloads/trades.csv" → {{"intent": "import_portfolio", "entities": {{"file_path": "~/Downloads/trades.csv", "portfolio_type": "general"}}, "confidence": 0.92}}
"""
        
        try:
            response = await self.ai_service.generate_response(ai_prompt)
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                intent_data = json.loads(json_match.group())
                return intent_data
            else:
                # Fallback parsing
                return self._fallback_intent_parsing(command)
        except Exception as e:
            return self._fallback_intent_parsing(command)
    
    def _fallback_intent_parsing(self, command: str) -> Dict[str, Any]:
        """Fallback intent parsing using simple patterns"""
        command_lower = command.lower().strip()
        
        # Simple pattern-based intent detection
        # Help command
        if command_lower in ["help", "?", "commands", "what can you do"]:
            return {
                "intent": "system_control",
                "entities": {"action": "help"},
                "confidence": 0.95
            }
        # Market overview patterns
        elif any(phrase in command_lower for phrase in ["market overview", "market indices", "show market", "market summary", "market status", "global market"]):
            return {
                "intent": "monitor_dashboard",
                "entities": {},
                "confidence": 0.9
            }
        elif any(word in command_lower for word in ["invest", "invested", "investment", "add", "track", "tracking"]) and any(word in command_lower for word in ["company", "stock", "into"]):
            # Extract company name from command
            companies = []
            # Simple company name extraction
            company_patterns = ["coinbase", "tesla", "apple", "google", "microsoft", "amazon", "meta", "netflix", "nvidia"]
            for pattern in company_patterns:
                if pattern in command_lower:
                    companies.append(pattern.capitalize())
            
            return {
                "intent": "investment_execution",
                "entities": {"action": "create", "companies": companies},
                "confidence": 0.8
            }
        elif any(phrase in command_lower for phrase in ["economic calendar", "economic events", "upcoming events", "this week events", "fomc meeting", "cpi release"]):
            return {
                "intent": "economic_calendar",
                "entities": {"country": ["US"]},
                "confidence": 0.8
            }
        elif "news" in command_lower:
            # Try to extract ticker/company from the command
            tickers = []
            companies = []
            
            # Common stock tickers
            stock_patterns = ["AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "NFLX"]
            for ticker in stock_patterns:
                if ticker.lower() in command_lower:
                    tickers.append(ticker)
            
            # Company names
            if "tesla" in command_lower:
                companies.append("Tesla")
            elif "apple" in command_lower:
                companies.append("Apple")
            elif "nvidia" in command_lower:
                companies.append("NVIDIA")
            elif "microsoft" in command_lower:
                companies.append("Microsoft")
            
            return {
                "intent": "news_analysis",
                "entities": {"tickers": tickers, "companies": companies, "action": "news"},
                "confidence": 0.7
            }
        elif any(phrase in command_lower for phrase in ["sectors", "etf", "holdings", "breakdown"]):
            # Try to extract ETF ticker
            etf_tickers = []
            etf_patterns = ["SPY", "QQQ", "IWM", "VTI", "EFA", "EEM", "XLK", "XLF", "XLE"]
            for ticker in etf_patterns:
                if ticker.lower() in command_lower:
                    etf_tickers.append(ticker)
            
            return {
                "intent": "etf_analysis",
                "entities": {"tickers": etf_tickers if etf_tickers else ["SPY"]},
                "confidence": 0.8
            }
        elif command_lower in ["companies", "company list"]:
            return {
                "intent": "company_analysis", 
                "entities": {},
                "confidence": 0.8
            }
        elif "portfolio" in command_lower:
            return {
                "intent": "portfolio_overview",
                "entities": {},
                "confidence": 0.8
            }
        elif "start" in command_lower and "backend" in command_lower:
            return {
                "intent": "system_control",
                "entities": {"action": "start"},
                "confidence": 0.9
            }
        elif "check" in command_lower and "api" in command_lower:
            return {
                "intent": "system_control",
                "entities": {"action": "check_api"},
                "confidence": 0.8
            }
        # News patterns
        elif "news" in command_lower and any(ticker in command.upper() for ticker in ["AAPL", "MSFT", "GOOGL", "NVDA", "AMD", "TSLA", "META", "AMZN"]):
            import re
            tickers = re.findall(r'\b[A-Z]{2,5}\b', command.upper())
            return {
                "intent": "news_analysis",
                "entities": {
                    "tickers": tickers,
                    "companies": [],
                    "action": "news"
                },
                "confidence": 0.9
            }
        # Fundamental data patterns
        elif any(word in command_lower for word in ["income statement", "balance sheet", "fundamentals", "financial", "earnings", "revenue", "profit", "ratios"]):
            import re
            tickers = re.findall(r'\b[A-Z]{2,5}\b', command.upper())
            return {
                "intent": "chart_company",
                "entities": {
                    "tickers": tickers,
                    "companies": [],
                    "action": "fundamentals"
                },
                "confidence": 0.9
            }
        # Compare stocks pattern
        elif "compare" in command_lower and any(ticker in command.upper() for ticker in ["NVDA", "AMD", "AVGO", "AAPL", "MSFT", "GOOGL", "TSLA"]):
            import re
            tickers = re.findall(r'\b[A-Z]{2,5}\b', command.upper())
            return {
                "intent": "chart_company",  # Should handle multi-stock comparison
                "entities": {
                    "tickers": tickers,
                    "companies": [],
                    "action": "compare"
                },
                "confidence": 0.9
            }
        elif any(word in command_lower for word in ["price", "stock", "quote", "nvdia", "nvidia", "tsla", "tesla", "aapl", "apple"]):
            # Extract ticker/company from command
            import re
            tickers = re.findall(r'\b[A-Z]{2,5}\b', command.upper())
            companies = []
            
            # Map common company names to tickers
            if "nvidia" in command_lower or "nvdia" in command_lower:
                companies.append("NVIDIA")
                if "NVDA" not in tickers:
                    tickers.append("NVDA")
            if "tesla" in command_lower:
                companies.append("Tesla")
                if "TSLA" not in tickers:
                    tickers.append("TSLA")
            if "apple" in command_lower:
                companies.append("Apple")
                if "AAPL" not in tickers:
                    tickers.append("AAPL")
            if "amd" in command_lower or "advanced micro" in command_lower:
                companies.append("AMD")
                if "AMD" not in tickers:
                    tickers.append("AMD")
            if "broadcom" in command_lower or "avgo" in command_lower:
                companies.append("Broadcom")
                if "AVGO" not in tickers:
                    tickers.append("AVGO")
            
            return {
                "intent": "chart_company",
                "entities": {
                    "tickers": tickers,
                    "companies": companies,
                    "query": f"stock price for {' '.join(companies + tickers)}"
                },
                "confidence": 0.8
            }
        elif any(phrase in command_lower for phrase in ["sector performance", "sector analysis", "technology sector", "healthcare sector", "financial sector", "energy sector", "sector breakdown"]):
            # Extract specific sector if mentioned
            sector = None
            if "technology" in command_lower or "tech" in command_lower:
                sector = "Technology"
            elif "healthcare" in command_lower or "health" in command_lower:
                sector = "Healthcare"
            elif "financial" in command_lower or "finance" in command_lower:
                sector = "Financial"
            elif "energy" in command_lower:
                sector = "Energy"
            elif "consumer" in command_lower:
                if "discretionary" in command_lower:
                    sector = "Consumer Discretionary"
                elif "staples" in command_lower:
                    sector = "Consumer Staples"
            elif "industrial" in command_lower:
                sector = "Industrial"
            elif "materials" in command_lower:
                sector = "Materials"
            elif "utilities" in command_lower:
                sector = "Utilities"
            elif "real estate" in command_lower:
                sector = "Real Estate"
            elif "communication" in command_lower:
                sector = "Communication"
            
            return {
                "intent": "sector_analysis",
                "entities": {"sector": sector},
                "confidence": 0.85
            }
        elif any(phrase in command_lower for phrase in ["correlation", "vs", "versus", " vs ", "rolling correlation", "correlated"]):
            # Extract assets for correlation analysis
            import re
            
            # Try to find "X vs Y" or "X versus Y" pattern
            # More specific patterns to avoid false matches
            vs_patterns = [
                r'(\w+)\s+vs\s+(\w+)',  # "BTC vs QQQ"
                r'(\w+)\s+versus\s+(\w+)',  # "BTC versus QQQ" 
                r'correlation.*?(\b[A-Z]{2,5}\b).*?(\b[A-Z]{2,5}\b)',  # "correlation TSLA SPY"
                r'(\b[A-Z]{2,5}\b).*?vs.*?(\b[A-Z]{2,5}\b)',  # "TSLA vs SPY"
            ]
            asset1, asset2 = None, None
            
            for pattern in vs_patterns:
                match = re.search(pattern, command)  # Use original command to preserve case
                if match:
                    asset1, asset2 = match.groups()
                    # Validate that we found actual asset symbols
                    if len(asset1) >= 2 and len(asset2) >= 2:
                        break
            
            # Extract period if mentioned
            period = "90d"  # default
            period_match = re.search(r'(\d+)[-\s]?day|(\d+)d|(\d+)[-\s]?week|(\d+)w|(\d+)[-\s]?month|(\d+)m', command_lower)
            if period_match:
                groups = period_match.groups()
                for i, group in enumerate(groups):
                    if group:
                        if i in [0, 1]:  # day patterns
                            period = f"{group}d"
                        elif i in [2, 3]:  # week patterns  
                            period = f"{group}w"
                        elif i in [4, 5]:  # month patterns
                            period = f"{group}m"
                        break
            
            return {
                "intent": "correlation_analysis",
                "entities": {
                    "asset1": asset1.upper() if asset1 else None,
                    "asset2": asset2.upper() if asset2 else None,
                    "period": period,
                    "tickers": [asset1.upper(), asset2.upper()] if asset1 and asset2 else []
                },
                "confidence": 0.8
            }
        elif "import" in command_lower and ("portfolio" in command_lower or "crypto" in command_lower or ".csv" in command_lower):
            # Extract file path and portfolio type
            import re
            file_path_match = re.search(r'(/[^\s]+)', command)
            file_path = file_path_match.group(1) if file_path_match else None
            
            portfolio_type = "crypto" if "crypto" in command_lower else "general"
            
            return {
                "intent": "import_portfolio", 
                "entities": {
                    "file_path": file_path,
                    "portfolio_type": portfolio_type,
                    "action": "import"
                },
                "confidence": 0.9
            }
        else:
            return {
                "intent": "generate_research",
                "entities": {"query": command},
                "confidence": 0.3
            }
    
    def _validate_intent(self, intent: Dict[str, Any], confidence: float) -> Dict[str, Any]:
        """Validate parsed intent and confidence"""
        
        # Check confidence threshold
        if confidence < 0.5:
            return {
                "valid": False,
                "reason": "low_confidence",
                "confidence": confidence,
                "suggestion": "Please be more specific about what you want to do."
            }
        
        # Ensure intent is a dictionary
        if not isinstance(intent, dict):
            return {
                "valid": False,
                "reason": "invalid_intent_format",
                "suggestion": "Could not parse your request."
            }
        
        # Check required fields
        intent_type = intent.get("intent")
        if not intent_type:
            return {
                "valid": False,
                "reason": "missing_intent",
                "suggestion": "Could not understand your request."
            }
        
        # Intent-specific validations
        if intent_type == "investment_execution":
            entities = intent.get("entities", {})
            if not entities.get("companies") and not entities.get("amount"):
                return {
                    "valid": False,
                    "reason": "missing_investment_details",
                    "suggestion": "Please specify both investment amount and company name."
                }
        
        return {"valid": True}
    
    def _create_validation_response(self, validation: Dict[str, Any], trace: Dict[str, Any]) -> CommandResponse:
        """Create response for validation failures"""
        trace["validation_failed"] = validation["reason"]
        
        return CommandResponse(
            success=False,
            message=validation.get("suggestion", "Please provide more details."),
            data={"validation_error": validation["reason"]},
            trace=trace
        )
    
    def _get_tool_chain(self, intent: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Get tool chain from router table based on intent"""
        intent_type = intent.get("intent")
        
        if intent_type in self.router_table:
            return self.router_table[intent_type]
        else:
            return None
    
    async def _execute_tool_chain(self, tool_chain: Dict[str, Any], intent: Dict[str, Any], context: Dict[str, Any], trace: Dict[str, Any]) -> CommandResponse:
        """Execute the primary tool and optional secondary tools"""
        
        primary_tool = tool_chain.get("primary")
        secondary_tools = tool_chain.get("secondary", [])
        
        trace["tools_used"].append(primary_tool)
        
        # Execute primary tool
        if primary_tool in self.tools:
            result = await self.tools[primary_tool](intent, context)
            
            # If primary tool succeeds, optionally run secondary tools
            if result.success and secondary_tools:
                for secondary_tool in secondary_tools[:1]:  # Limit to 1 secondary
                    if secondary_tool in self.tools:
                        trace["tools_used"].append(secondary_tool)
                        secondary_result = await self.tools[secondary_tool](intent, context)
                        # Merge secondary results
                        if secondary_result.data:
                            if not result.data:
                                result.data = {}
                            result.data.update(secondary_result.data)
            
            return result
        else:
            return CommandResponse(
                success=False,
                message=f"Tool not implemented: {primary_tool}",
                data={"missing_tool": primary_tool}
            )
    
    async def _handle_fallback(self, command: str, intent: Dict[str, Any], trace: Dict[str, Any]) -> CommandResponse:
        """Handle commands that don't match any intent"""
        
        # Try to generate a helpful AI response
        try:
            ai_prompt = f"""
User asked: "{command}"

As a helpful investment terminal assistant, provide a brief response that either:
1. Attempts to fulfill the request if possible
2. Suggests related commands that might help
3. Asks clarifying questions

Be concise and actionable.
"""
            response = await self.ai_service.generate_response(ai_prompt, max_tokens=150)
            
            return CommandResponse(
                success=True,
                message=response,
                data={"fallback_response": True, "original_command": command}
            )
        except:
            return CommandResponse(
                success=True,
                message=f"I'm trying to understand '{command}'. Could you try rephrasing or use commands like 'portfolio', 'companies', or 'check api keys'?",
                data={"fallback": True}
            )
    
    def _log_interaction(self, interaction_id: str, command: str, result: CommandResponse, trace: Dict[str, Any]):
        """Log interaction for analysis"""
        try:
            terminal_logger.log_interaction(
                interaction_id=interaction_id,
                user_input=command,
                system_output=result.message,
                session_id=getattr(self, 'current_session', None),
                response_time_ms=trace.get("execution_time", 0),
                success=result.success,
                metadata={
                    "trace": trace,
                    "intent": trace.get("detected_intent"),
                    "confidence": trace.get("confidence"),
                    "tools_used": trace.get("tools_used", [])
                }
            )
        except Exception:
            pass  # Don't fail on logging errors
    
    # Tool Implementations
    async def _execute_openbb_research(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Execute OpenBB research queries with AI routing"""
        entities = intent.get("entities", {})
        query = entities.get("query", "market overview")
        
        try:
            result = await ai_openbb_service.execute_ai_command(query, context)
            return CommandResponse(
                success=True,
                message="Research complete",
                data=result
            )
        except Exception as e:
            return CommandResponse(
                success=False,
                message=f"Research failed: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _execute_deals_crud(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Execute deal CRUD operations"""
        entities = intent.get("entities", {})
        action = entities.get("action", "read")
        
        # Simple implementation for now
        return CommandResponse(
            success=True,
            message=f"Deal {action} operation completed",
            data={"action": action, "deals": []}
        )
    
    async def _execute_investment_create(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Execute investment creation with smart parsing"""
        entities = intent.get("entities", {})
        companies = entities.get("companies", [])
        tickers = entities.get("tickers", [])
        amount = entities.get("amount", "")
        
        # Use companies or tickers as company names
        company_names = companies + tickers
        
        if not company_names or not amount:
            return CommandResponse(
                success=False,
                message="Please specify both investment amount and company name",
                data={"example": "invest 100k in polkadot"}
            )
        
        # Import the existing investment logic
        from sqlmodel import Session, select
        from ..database import engine
        from ..models.deals import Deal
        from ..models.companies import Company
        import re
        
        try:
            # Parse amount
            amount_str = str(amount).lower()
            if 'k' in amount_str:
                amount_value = int(float(amount_str.replace('k', '')) * 1000)
            elif 'm' in amount_str:
                amount_value = int(float(amount_str.replace('m', '')) * 1000000)
            else:
                amount_value = int(amount_str.replace(',', '').replace('$', ''))
            
            # Use the first available company name (could be from companies or tickers)
            company_name = company_names[0]
            
            # Map common tickers to full company names
            ticker_mappings = {
                "DOT": "Polkadot",
                "BTC": "Bitcoin", 
                "ETH": "Ethereum",
                "LINK": "Chainlink",
                "ADA": "Cardano",
                "SOL": "Solana"
            }
            
            if company_name in ticker_mappings:
                company_name = ticker_mappings[company_name]
            
            with Session(engine) as session:
                # Find company
                company_result = session.exec(
                    select(Company).where(Company.name.ilike(f"%{company_name}%"))
                ).first()
                
                if not company_result:
                    return CommandResponse(
                        success=False,
                        message=f"Company '{company_name}' not found. Add the company first with: add company {company_name}",
                        data={"company_name": company_name}
                    )
                
                # Find existing deal or create new one
                deal_result = session.exec(
                    select(Deal).where(Deal.company_id == company_result.id)
                ).first()
                
                if deal_result:
                    deal_result.our_investment = amount_value
                    session.add(deal_result)
                    session.commit()
                    action = "updated"
                else:
                    from ..models.deals import DealStatus, InvestmentStage
                    new_deal = Deal(
                        company_id=company_result.id,
                        status=DealStatus.DEAL,
                        stage=InvestmentStage.SEED,
                        our_investment=amount_value,
                        created_by="system"
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
                        "amount": amount_value
                    }
                )
                
        except Exception as e:
            return CommandResponse(
                success=False,
                message=f"Error processing investment: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _execute_backend_control(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Execute backend control operations"""
        entities = intent.get("entities", {})
        action = entities.get("action", "status")
        
        if action == "start":
            return CommandResponse(
                success=True,
                message="✅ Backend is already running!",
                data={
                    "status": "running",
                    "url": "http://localhost:8000",
                    "message": "The Redpill backend is operational and ready to handle your investment commands."
                }
            )
        elif action == "check_api":
            # Get current API status
            api_status = await self._check_api_keys()
            
            # Convert to guidance message 
            if api_status.success and api_status.data:
                configured_count = api_status.data.get("configured_count", 0)
                status_details = api_status.data.get("status_details", [])
                
                if configured_count == 0:
                    message = "🔑 **Missing API Keys** - You need to configure these:\n\n"
                    message += "**Required:**\n"
                    message += "• OPENAI_API_KEY - For AI analysis (get from https://platform.openai.com)\n" 
                    message += "• REDPILL_API_KEY - For VC intelligence (contact your admin)\n"
                    message += "• COINGECKO_API_KEY - For crypto data (get from https://coingecko.com)\n\n"
                    message += "**Setup:** Add these to your .env file or environment variables\n\n"
                    for detail in status_details:
                        if "❌" in detail:
                            message += f"• {detail}\n"
                elif configured_count < 3:
                    message = f"🔑 **Partial Setup** ({configured_count}/3 keys configured)\n\n"
                    missing = [detail for detail in status_details if "❌" in detail]
                    if missing:
                        message += "**Still needed:**\n"
                        for detail in missing:
                            key_name = detail.split(":")[0]
                            if key_name == "OPENAI_API_KEY":
                                message += f"• {detail} - Get from https://platform.openai.com\n"
                            elif key_name == "REDPILL_API_KEY":
                                message += f"• {detail} - Contact your admin\n"
                            elif key_name == "COINGECKO_API_KEY":
                                message += f"• {detail} - Get from https://coingecko.com\n"
                else:
                    message = "✅ **All API Keys Configured!** Your system is ready to use."
                    
                return CommandResponse(
                    success=True,
                    message=message,
                    data=api_status.data
                )
            else:
                return api_status
        elif action == "help":
            return CommandResponse(
                success=True,
                message="""🚀 **Redpill AI Terminal Commands**

📊 **Market Data**
• `market overview` - Global market snapshot with indices & crypto
• `quote for AAPL` - Get stock quote with price, volume, change
• `BTC and ETH quotes` - Get crypto prices with 24h changes
• `compare NVDA, AMD, AVGO` - Compare multiple stocks

💼 **Portfolio & Investments**
• `portfolio` - View your investment portfolio overview
• `companies` - List all companies in your CRM
• `i invested 100k in Polkadot` - Record an investment

📰 **Research & Analysis**
• `news for AAPL today` - Get latest news for a company
• `analyze Tesla fundamentals` - Get fundamental analysis
• `research AI companies` - Research companies by sector

🔧 **System**
• `check api keys` - Check API configuration status
• `help` - Show this help message

💡 **Tips**
• Use natural language - the AI understands context
• Combine commands - "show AAPL quote and news"
• All major stocks and crypto symbols supported""",
                data={
                    "commands": [
                        "market overview", "quote for [TICKER]", "[CRYPTO] quotes",
                        "portfolio", "companies", "news for [COMPANY]",
                        "check api keys", "help"
                    ],
                    "version": "1.0.0"
                }
            )
        else:
            return CommandResponse(
                success=True,
                message="Backend status: operational",
                data={"status": "running"}
            )
    
    async def _execute_portfolio_aggregate(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Execute portfolio overview aggregation"""
        try:
            from sqlmodel import Session, select
            from ..database import engine
            from ..models.deals import Deal
            from ..models.companies import Company
            
            with Session(engine) as session:
                result = session.exec(
                    select(Deal, Company)
                    .join(Company, Deal.company_id == Company.id)
                    .where(Deal.our_investment.isnot(None))
                )
                deal_data = result.all()
                
                if not deal_data:
                    return CommandResponse(
                        success=True,
                        message="No portfolio data found. Add some investments to get started.",
                        data={"total_value": 0, "holdings": []}
                    )
                
                # Calculate portfolio metrics
                total_invested = sum(deal.our_investment for deal, company in deal_data if deal.our_investment)
                active_deals = len(deal_data)
                
                holdings = []
                for deal, company in deal_data:
                    if deal.our_investment:
                        holdings.append({
                            "company": company.name,
                            "investment_amount": deal.our_investment,
                            "sector": company.sector or "Unknown"
                        })
                
                portfolio_summary = f"""
🚀 PORTFOLIO OVERVIEW
==================
💰 Total Invested:    ${total_invested/1000000:.1f}M
🏢 Active Deals:      {active_deals}
📊 Holdings:          {len(holdings)} companies

Top Holdings:
"""
                for holding in holdings[:5]:
                    portfolio_summary += f"  • {holding['company']}: ${holding['investment_amount']/1000:.0f}k\n"
                
                return CommandResponse(
                    success=True,
                    message=portfolio_summary,
                    data={
                        "total_invested": total_invested,
                        "active_deals": active_deals,
                        "holdings": holdings
                    }
                )
                
        except Exception as e:
            return CommandResponse(
                success=False,
                message=f"Error retrieving portfolio: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _execute_companies_fetch(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Execute companies data fetch"""
        try:
            companies = await self.company_service.get_all_companies()
            
            if not companies:
                return CommandResponse(
                    success=True,
                    message="No companies found in database. Try importing companies or adding them manually.",
                    data={"companies_count": 0}
                )
            
            # Format companies summary
            companies_summary = f"""
🏢 COMPANIES OVERVIEW
===================
📊 Total Companies: {len(companies)}

Recent Companies:
"""
            for company in companies[:8]:
                name = company.get('name', 'Unknown')
                sector = company.get('sector', 'N/A')
                companies_summary += f"  • {name} ({sector})\n"
            
            return CommandResponse(
                success=True,
                message=companies_summary,
                data={
                    "companies_count": len(companies),
                    "companies": companies[:10]
                }
            )
            
        except Exception as e:
            return CommandResponse(
                success=False,
                message=f"Error retrieving companies: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _execute_api_status(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Execute API status check"""
        return await self._check_api_keys()
    
    async def _execute_openbb_fundamentals(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Execute OpenBB fundamentals analysis for stocks with chart generation"""
        entities = intent.get("entities", {})
        companies = entities.get("companies", [])
        tickers = entities.get("tickers", [])
        command_text = intent.get("text", "").lower()
        
        # Combine companies and tickers
        symbols = companies + tickers
        if not symbols:
            return CommandResponse(
                success=False,
                message="Please specify a stock symbol or company name",
                data={"example": "NVDA chart or NVIDIA stock price"}
            )
        
        try:
            # Check what user wants
            action = entities.get("action", "quote")
            wants_chart = any(word in command_text for word in ['chart', 'candle', 'graph', 'plot', 'visualization'])
            wants_fundamentals = action == "fundamentals" or any(word in command_text for word in ['income', 'balance', 'fundamentals', 'earnings', 'revenue'])
            
            results = {}
            chart_paths = []
            
            for symbol in symbols[:5]:  # Limit to 5 symbols for comparison
                # Map company names to tickers
                ticker_map = {
                    "NVIDIA": "NVDA",
                    "Tesla": "TSLA", 
                    "Apple": "AAPL",
                    "Microsoft": "MSFT",
                    "Amazon": "AMZN",
                    "Google": "GOOGL",
                    "Meta": "META",
                    "Netflix": "NFLX",
                    "AMD": "AMD",
                    "Advanced Micro Devices": "AMD",
                    "Broadcom": "AVGO",
                    "Intel": "INTC",
                    "Qualcomm": "QCOM"
                }
                
                ticker = ticker_map.get(symbol, symbol.upper())
                
                try:
                    # Use our built-in market service (no OpenBB dependency)
                    from ..services.builtin_market_service import builtin_market_service
                    
                    if wants_fundamentals:
                        # Get fundamental data
                        fund_data = await builtin_market_service.get_stock_fundamentals(ticker)
                        results[symbol] = {
                            **fund_data,
                            "ticker": ticker,
                            "company": symbol
                        }
                    else:
                        # Get regular stock data
                        stock_data = await builtin_market_service.get_stock_data(
                            symbol=ticker,
                            with_chart=wants_chart
                        )
                        
                        if "error" not in stock_data:
                            results[symbol] = {
                                **stock_data,
                                "ticker": ticker,
                                "company": symbol
                            }
                            if stock_data.get("chart_path"):
                                chart_paths.append(stock_data["chart_path"])
                        else:
                            results[symbol] = {
                                **stock_data,
                                "ticker": ticker,
                                "company": symbol
                            }
                        
                except Exception as e:
                    results[symbol] = {"error": f"Data not available: {str(e)}"}
            
            if results:
                # Format response
                response_lines = []
                if wants_fundamentals:
                    response_lines.append(f"📊 Fundamental Analysis for {', '.join(symbols)}:")
                elif wants_chart:
                    response_lines.append(f"📊 Stock Charts & Data for {', '.join(symbols)}:")
                else:
                    response_lines.append(f"📈 Stock Data for {', '.join(symbols)}:")
                response_lines.append("")
                
                for symbol, data in results.items():
                    if "error" in data:
                        response_lines.append(f"❌ {symbol}: {data['error']}")
                    elif wants_fundamentals:
                        # Format fundamental data
                        ticker = data.get("ticker", symbol)
                        response_lines.append(f"💼 {ticker} Fundamentals:")
                        
                        # Revenue and profitability
                        if data.get("revenue"):
                            revenue = data["revenue"]
                            response_lines.append(f"   📈 Revenue (TTM): ${revenue:,.0f}" if isinstance(revenue, (int, float)) else f"   📈 Revenue (TTM): ${revenue}")
                        if data.get("net_income"):
                            net_income = data["net_income"]  
                            response_lines.append(f"   💰 Net Income: ${net_income:,.0f}" if isinstance(net_income, (int, float)) else f"   💰 Net Income: ${net_income}")
                        if data.get("eps"):
                            response_lines.append(f"   📊 EPS: ${data['eps']}")
                        
                        # Key ratios
                        if data.get("pe_ratio"):
                            response_lines.append(f"   📉 P/E Ratio: {data['pe_ratio']:.2f}" if isinstance(data['pe_ratio'], (int, float)) else f"   📉 P/E Ratio: {data['pe_ratio']}")
                        if data.get("profit_margin"):
                            margin = data["profit_margin"]
                            if isinstance(margin, (int, float)):
                                response_lines.append(f"   📊 Profit Margin: {margin:.1%}")
                        if data.get("roe"):
                            roe = data["roe"]
                            if isinstance(roe, (int, float)):
                                response_lines.append(f"   🏆 ROE: {roe:.1%}")
                        
                        # Balance sheet
                        if data.get("total_debt") and data.get("shareholders_equity"):
                            debt = data["total_debt"]
                            equity = data["shareholders_equity"]
                            if isinstance(debt, (int, float)) and isinstance(equity, (int, float)) and equity > 0:
                                debt_to_equity = debt / equity
                                response_lines.append(f"   ⚖️  Debt/Equity: {debt_to_equity:.2f}")
                        
                        response_lines.append(f"   📅 Data from: {data.get('fiscal_year', 'Latest')}")
                        response_lines.append(f"   🔗 Source: {data.get('source', 'FMP')}")
                        response_lines.append("")
                    elif "message" in data:
                        response_lines.append(f"📈 {symbol} ({data.get('ticker', '')}): {data['message']}")
                        
                        # Chart info
                        if data.get('chart_generated'):
                            response_lines.append(f"   📊 Chart saved: {data['chart_path']}")
                        elif wants_chart:
                            response_lines.append(f"   📊 Chart generation attempted but failed")
                    else:
                        price = data.get('price', 'N/A')
                        change_pct = data.get('change_pct', 'N/A')
                        volume = data.get('volume', 'N/A')
                        source = data.get('source', 'OpenBB Platform')
                        ticker = data.get('ticker', symbol)
                        
                        if price != 'N/A':
                            price_str = f"${price:,.2f}" if isinstance(price, (int, float)) else f"${price}"
                            change_str = f"{change_pct:+.2f}%" if isinstance(change_pct, (int, float)) else f"{change_pct}"
                            response_lines.append(f"💰 {symbol} ({ticker}): {price_str} ({change_str})")
                            
                            if isinstance(volume, (int, float)) and volume != 'N/A':
                                response_lines.append(f"   Volume: {volume:,.0f}")
                            
                            # Chart info
                            if data.get('chart_generated'):
                                response_lines.append(f"   📊 Chart saved: {data['chart_path']}")
                            elif wants_chart:
                                response_lines.append(f"   📊 Chart generation attempted but failed")
                                
                            response_lines.append(f"   Source: {source}")
                        else:
                            response_lines.append(f"❌ {symbol}: Unable to retrieve price data")
                    response_lines.append("")
                
                # Add chart paths to visualization data for frontend
                visualization_data = {
                    "type": "stock_analysis",
                    "symbols": symbols,
                    "results": results,
                    "chart_requested": wants_chart,
                    "chart_paths": chart_paths
                }
                
                return CommandResponse(
                    success=True,
                    message="\n".join(response_lines),
                    data=results,
                    visualization=visualization_data
                )
            else:
                return CommandResponse(
                    success=False,
                    message="No stock data available for the requested symbols",
                    data={"symbols": symbols}
                )
                
        except Exception as e:
            return CommandResponse(
                success=False,
                message=f"Error fetching stock data: {str(e)}",
                data={"error": str(e)}
            )
    
    async def _execute_openbb_crypto(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Execute OpenBB crypto analysis with chart generation"""
        entities = intent.get("entities", {})
        tickers = entities.get("tickers", [])
        companies = entities.get("companies", [])
        command_text = intent.get("text", "").lower()
        
        # Crypto-specific mapping
        crypto_map = {
            "Bitcoin": "BTC",
            "Ethereum": "ETH", 
            "Polkadot": "DOT",
            "Chainlink": "LINK",
            "Solana": "SOL"
        }
        
        symbols = []
        for company in companies:
            symbols.append(crypto_map.get(company, company))
        symbols.extend(tickers)
        
        if not symbols:
            return CommandResponse(
                success=False,
                message="Please specify a cryptocurrency symbol",
                data={"example": "BTC price chart or Bitcoin analysis"}
            )
        
        try:
            # Check if user wants a chart
            wants_chart = any(word in command_text for word in ['chart', 'candle', 'graph', 'plot', 'visualization'])
            
            results = {}
            chart_paths = []
            
            for symbol in symbols[:3]:  # Limit to 3 symbols
                try:
                    # Use our built-in market service (no OpenBB dependency)
                    from ..services.builtin_market_service import builtin_market_service
                    
                    crypto_data = await builtin_market_service.get_crypto_data(
                        symbol=symbol,
                        with_chart=wants_chart
                    )
                    
                    if "error" not in crypto_data:
                        results[symbol] = crypto_data
                        if crypto_data.get("chart_path"):
                            chart_paths.append(crypto_data["chart_path"])
                    else:
                        results[symbol] = crypto_data
                        
                except Exception as e:
                    results[symbol] = {"error": str(e)}
            
            # Format response
            response_lines = []
            if wants_chart:
                response_lines.append(f"📊 Crypto Charts & Data for {', '.join(symbols)}:")
            else:
                response_lines.append(f"🪙 Crypto Data for {', '.join(symbols)}:")
            response_lines.append("")
            
            for symbol, data in results.items():
                if "error" in data:
                    response_lines.append(f"❌ {symbol}: {data['error']}")
                else:
                    price = data.get('price', 'N/A')
                    change_24h = data.get('change_24h', 'N/A')
                    volume = data.get('volume', 'N/A')
                    source = data.get('source', 'Market Data Service')
                    
                    if price != 'N/A':
                        price_str = f"${price:,.2f}" if isinstance(price, (int, float)) else f"${price}"
                        change_str = f"{change_24h:+.2f}%" if isinstance(change_24h, (int, float)) else f"{change_24h}"
                        response_lines.append(f"💰 {symbol}: {price_str} ({change_str})")
                        
                        if isinstance(volume, (int, float)) and volume != 'N/A':
                            response_lines.append(f"   Volume: ${volume:,.0f}")
                        
                        # Chart info
                        if data.get('chart_generated'):
                            response_lines.append(f"   📊 Chart saved: {data['chart_path']}")
                        elif wants_chart:
                            response_lines.append(f"   📊 Chart generation attempted but failed")
                            
                        response_lines.append(f"   Source: {source}")
                    else:
                        response_lines.append(f"❌ {symbol}: Unable to retrieve price data")
                response_lines.append("")
            
            # Add chart paths to visualization data for frontend
            visualization_data = {
                "type": "crypto_analysis",
                "symbols": symbols,
                "results": results,
                "chart_requested": wants_chart,
                "chart_paths": chart_paths
            }
            
            return CommandResponse(
                success=True,
                message="\n".join(response_lines),
                data=results,
                visualization=visualization_data
            )
            
        except Exception as e:
            return CommandResponse(
                success=False,
                message=f"Error retrieving crypto data: {str(e)}",
                data={"error": str(e), "symbols": symbols}
            )

    async def _check_api_keys(self) -> CommandResponse:
        """Check API key configuration status"""
        try:
            configured_count = 0
            status_details = []
            
            # Check common API keys
            # Note: OPENBB_PAT is NOT needed - we use the open-source OpenBB SDK
            keys_to_check = [
                "OPENAI_API_KEY",
                "REDPILL_API_KEY", 
                "COINGECKO_API_KEY"
            ]
            
            # Optional keys (not counted in total)
            optional_keys = ["OPENBB_PAT"]  # Legacy - not needed with OSS OpenBB
            
            for key in keys_to_check:
                env_value = os.getenv(key)
                is_configured = bool(env_value)
                if is_configured:
                    configured_count += 1
                
                status = "✅ Configured" if is_configured else "❌ Missing"
                masked_value = ""
                if env_value and len(env_value) >= 8:
                    masked_value = f" ({env_value[:4]}***{env_value[-4:]})"
                
                status_details.append(f"{key}: {status}{masked_value}")
            
            # Check optional keys (informational only)
            for key in optional_keys:
                env_value = os.getenv(key)
                is_configured = bool(env_value)
                status = "✅ Configured" if is_configured else "➖ Not needed (OSS OpenBB)"
                masked_value = ""
                if env_value and len(env_value) >= 8:
                    masked_value = f" ({env_value[:4]}***{env_value[-4:]})"
                
                status_details.append(f"{key}: {status}{masked_value}")
            
            return CommandResponse(
                success=True,
                message=f"API Keys Status ({configured_count}/{len(keys_to_check)} configured)",
                data={
                    "configured_count": configured_count,
                    "total_keys": len(keys_to_check),
                    "status_details": status_details
                }
            )
            
        except Exception as e:
            return CommandResponse(
                success=False,
                message=f"Failed to check API keys: {str(e)}",
                data={"error": str(e)}
            )

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

    async def _execute_correlation_analysis(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Execute correlation analysis between assets"""
        try:
            from ..services.builtin_market_service import builtin_market_service
            
            # Extract assets from entities
            entities = intent.get("entities", {})
            tickers = entities.get("tickers", [])
            asset1 = entities.get("asset1")
            asset2 = entities.get("asset2")
            period = entities.get("period", "90d")
            
            # Try to get assets from tickers list if not explicitly set
            if not asset1 and not asset2 and len(tickers) >= 2:
                asset1 = tickers[0]
                asset2 = tickers[1]
            elif not asset1 and not asset2:
                # Default assets for demo
                asset1 = "BTC"
                asset2 = "QQQ"
            
            if not asset1 or not asset2:
                return CommandResponse(
                    success=False,
                    message="❌ Need two assets for correlation analysis (e.g., 'BTC vs QQQ')",
                    data={"error": "Missing assets"}
                )
            
            correlation_data = await builtin_market_service.get_correlation_analysis(asset1, asset2, period)
            
            if "error" in correlation_data:
                return CommandResponse(
                    success=False,
                    message=f"❌ Correlation analysis error: {correlation_data['error']}",
                    data=correlation_data
                )
            
            # Format correlation message
            corr_value = correlation_data.get("correlation", 0)
            strength = correlation_data.get("correlation_strength", "Unknown")
            direction = correlation_data.get("correlation_direction", "Unknown")
            asset1_type = correlation_data.get("asset1_type", "asset")
            asset2_type = correlation_data.get("asset2_type", "asset")
            
            # Choose emoji based on correlation
            if abs(corr_value) >= 0.7:
                corr_emoji = "🔗" if corr_value > 0 else "🔀"
            elif abs(corr_value) >= 0.4:
                corr_emoji = "📊" if corr_value > 0 else "📉"
            else:
                corr_emoji = "🎲"
            
            message = f"📊 Correlation Analysis\n"
            message += f"{corr_emoji} {asset1} ({asset1_type}) vs {asset2} ({asset2_type})\n"
            message += f"📈 {period} Correlation: {corr_value:+.3f}\n"
            message += f"💪 Strength: {strength} {direction}"
            
            if correlation_data.get("note"):
                message += f"\n💡 {correlation_data['note']}"
            
            return CommandResponse(
                success=True,
                message=message,
                data=correlation_data
            )
            
        except Exception as e:
            return CommandResponse(
                success=False,
                message="❌ Correlation analysis error",
                data={"error": str(e)}
            )

    async def _execute_portfolio_import(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Execute portfolio import from file"""
        try:
            entities = intent.get("entities", {})
            file_path = entities.get("file_path")
            portfolio_type = entities.get("portfolio_type", "general")
            
            if not file_path:
                return CommandResponse(
                    success=False,
                    message="❌ Please specify a file path to import",
                    data={
                        "error": "missing_file_path",
                        "suggestion": "Example: import /path/to/portfolio.csv as crypto portfolio",
                        "supported_formats": ["CSV", "JSON"],
                        "expected_columns": ["symbol", "amount", "price"] if portfolio_type == "crypto" else ["ticker", "shares", "cost_basis"]
                    }
                )
            
            # Check if file exists and is readable
            import os
            from pathlib import Path
            
            file_path_obj = Path(file_path)
            if not file_path_obj.exists():
                return CommandResponse(
                    success=False,
                    message=f"❌ File not found: {file_path}",
                    data={
                        "error": "file_not_found",
                        "file_path": file_path,
                        "suggestion": f"Please check that the file exists and you have read permissions",
                        "trace": {
                            "detected_intent": "import_portfolio",
                            "file_validation": "failed",
                            "reason": "file_not_exists"
                        }
                    }
                )
            
            if not file_path_obj.is_file():
                return CommandResponse(
                    success=False,
                    message=f"❌ Path is not a file: {file_path}",
                    data={
                        "error": "not_a_file",
                        "file_path": file_path,
                        "suggestion": "Please provide a path to a CSV or JSON file"
                    }
                )
            
            # Try to read and parse the file
            import pandas as pd
            
            if file_path.endswith('.csv'):
                try:
                    df = pd.read_csv(file_path)
                    
                    message = f"📁 Portfolio Import Preview\n"
                    message += f"📂 File: {file_path}\n"  
                    message += f"📊 Type: {portfolio_type.title()}\n"
                    message += f"📝 Rows: {len(df)}\n"
                    message += f"🔧 Columns: {', '.join(df.columns.tolist())}\n\n"
                    
                    # Show preview of first 3 rows
                    if len(df) > 0:
                        message += f"📋 Preview (first 3 rows):\n"
                        preview_df = df.head(3)
                        for idx, row in preview_df.iterrows():
                            row_str = " | ".join([f"{col}: {val}" for col, val in row.items() if pd.notna(val)])
                            message += f"  {idx+1}. {row_str}\n"
                    
                    message += f"\n💡 Next steps:\n"
                    message += f"  • Review the data structure above\n"
                    message += f"  • Confirm column mapping matches your portfolio format\n"
                    message += f"  • Run 'confirm import {file_path}' to proceed\n"
                    
                    return CommandResponse(
                        success=True,
                        message=message,
                        data={
                            "import_preview": True,
                            "file_path": file_path,
                            "portfolio_type": portfolio_type,
                            "rows": len(df),
                            "columns": df.columns.tolist(),
                            "preview_data": df.head(3).to_dict('records'),
                            "trace": {
                                "detected_intent": "import_portfolio",
                                "file_validation": "success",
                                "parsing": "success",
                                "next_step": "user_confirmation_required"
                            }
                        }
                    )
                    
                except Exception as e:
                    return CommandResponse(
                        success=False,
                        message=f"❌ Failed to parse CSV file: {str(e)}",
                        data={
                            "error": "csv_parsing_failed",
                            "file_path": file_path,
                            "details": str(e),
                            "suggestion": "Please check the CSV format and encoding"
                        }
                    )
            else:
                return CommandResponse(
                    success=False,
                    message=f"❌ Unsupported file format: {file_path}",
                    data={
                        "error": "unsupported_format",
                        "file_path": file_path,
                        "supported_formats": [".csv", ".json"],
                        "suggestion": "Please provide a CSV or JSON file"
                    }
                )
                
        except Exception as e:
            return CommandResponse(
                success=False,
                message=f"❌ Portfolio import error: {str(e)}",
                data={
                    "error": "import_execution_failed",
                    "details": str(e),
                    "trace": {
                        "detected_intent": "import_portfolio", 
                        "execution": "failed",
                        "error": str(e)
                    }
                }
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
    
    async def _execute_economic_calendar(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Execute economic calendar"""
        try:
            from ..services.builtin_market_service import builtin_market_service
            
            # Extract parameters from entities
            entities = intent.get("entities", {})
            country = entities.get("country", ["US"])[0] if entities.get("country") else "US"
            days = 7  # Default to 1 week
            
            calendar_data = await builtin_market_service.get_economic_calendar(country, days)
            
            if "error" in calendar_data:
                message = f"❌ Economic calendar unavailable: {calendar_data['error']}"
            else:
                events = calendar_data.get("events", [])
                message_parts = [f"📅 Economic Calendar ({country}) - {calendar_data.get('period', 'Next 7 days')}:", ""]
                
                for event in events[:5]:  # Limit to 5 events for display
                    importance_icon = "🔴" if event.get("importance") == "High" else "🟡" if event.get("importance") == "Medium" else "🟢"
                    date = event.get("date", "TBD")
                    event_name = event.get("event", "Economic Event")
                    
                    message_parts.append(f"{importance_icon} {date}: {event_name}")
                    if event.get("forecast"):
                        message_parts.append(f"   📊 Forecast: {event.get('forecast')}")
                
                message_parts.append("")
                message_parts.append(f"📍 Source: {calendar_data.get('source', 'Economic Calendar')}")
                message = "\n".join(message_parts)
            
            return CommandResponse(
                success=True,
                message=message,
                data=calendar_data
            )
            
        except Exception as e:
            return CommandResponse(
                success=False,
                message="❌ Economic calendar error",
                data={"error": str(e)}
            )
    
    async def _execute_etf_analysis(self, intent: Dict[str, Any], context: Dict[str, Any]) -> CommandResponse:
        """Execute ETF sector analysis"""
        try:
            from ..services.builtin_market_service import builtin_market_service
            
            # Extract ETF symbol from entities
            entities = intent.get("entities", {})
            tickers = entities.get("tickers", [])
            companies = entities.get("companies", [])
            
            # Default to SPY if no symbol specified
            symbol = tickers[0] if tickers else (companies[0] if companies else "SPY")
            
            # Ensure it's an ETF symbol
            if symbol.upper() in ["SPY", "QQQ", "IWM", "VTI", "EFA", "EEM", "XLK", "XLF", "XLE"]:
                etf_data = await builtin_market_service.get_etf_sectors(symbol.upper())
                
                if "error" in etf_data:
                    message = f"❌ ETF data unavailable for {symbol}: {etf_data['error']}"
                else:
                    sectors = etf_data.get("sectors", [])
                    message_parts = [f"📊 {symbol} ETF Sector Breakdown:", ""]
                    
                    for sector in sectors[:6]:  # Top 6 sectors
                        sector_name = sector.get("sector", "Unknown")
                        weight = sector.get("weight", 0)
                        companies = sector.get("companies", 0)
                        
                        message_parts.append(f"• {sector_name}: {weight}% ({companies} companies)")
                    
                    message_parts.append("")
                    message_parts.append(f"📅 Holdings Date: {etf_data.get('holdings_date', 'N/A')}")
                    message_parts.append(f"🏢 Total Holdings: {etf_data.get('total_holdings', 'N/A')}")
                    message_parts.append(f"📍 Source: {etf_data.get('source', 'ETF Data')}")
                    
                    message = "\n".join(message_parts)
            else:
                message = f"💡 {symbol} is not a recognized ETF. Try SPY, QQQ, IWM, VTI, XLK, XLF, etc."
                etf_data = {"info": "Not an ETF symbol"}
            
            return CommandResponse(
                success=True,
                message=message,
                data=etf_data
            )
            
        except Exception as e:
            return CommandResponse(
                success=False,
                message="❌ ETF analysis error",
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
        """Execute news analysis with actual news data"""
        try:
            from ..services.builtin_market_service import builtin_market_service
            
            # Extract symbol from entities if available
            entities = intent.get("entities", {})
            tickers = entities.get("tickers", [])
            companies = entities.get("companies", [])
            action = entities.get("action", "news")
            
            symbol = tickers[0] if tickers else (companies[0] if companies else None)
            
            if not symbol:
                return CommandResponse(
                    success=False,
                    message="Please specify a company symbol for news analysis",
                    data={"example": "news for AAPL today"}
                )
            
            # Get actual news data
            news_data = await builtin_market_service.get_company_news(symbol, limit=5)
            
            if "error" in news_data:
                message = f"❌ News unavailable for {symbol}: {news_data['error']}"
            elif news_data.get("articles"):
                articles = news_data["articles"]
                message_parts = [f"📰 Latest News for {symbol}:"]
                message_parts.append("")
                
                for i, article in enumerate(articles[:5], 1):
                    title = article.get("title", "No title")
                    site = article.get("site", "Unknown source")
                    date = article.get("published_date", "").split("T")[0] if article.get("published_date") else "Recent"
                    
                    message_parts.append(f"{i}. **{title}**")
                    message_parts.append(f"   📅 {date} | 🔗 {site}")
                    if article.get("text"):
                        message_parts.append(f"   📝 {article['text']}")
                    message_parts.append("")
                
                message_parts.append(f"🔗 Source: {news_data.get('source', 'FMP News')}")
                message = "\n".join(message_parts)
            else:
                message = f"📰 No recent news found for {symbol}\n💡 Try checking major financial news sites"
            
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


# FastAPI endpoints using the new AI-first interpreter
@router.post("/execute", response_model=CommandResponse)
async def execute_command(
    command: TerminalCommand,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> CommandResponse:
    """
    Execute a natural language terminal command using AI-first Financial Agent
    """
    # Use our enhanced Financial Agent instead of the old terminal interpreter
    from ..core.financial_agent import financial_agent  # Use global singleton
    
    try:
        result = await financial_agent.process_command(
            command.command,
            user_id=current_user.id if current_user else "anonymous"
        )
        
        # Convert Financial Agent response to CommandResponse format
        return CommandResponse(
            success=result.get("success", True),
            message=result.get("message", ""),
            data=result.get("data", {}),
            trace={
                "tools_used": result.get("tools_used", []),
                "reasoning": result.get("reasoning", ""),
                "command": command.command
            }
        )
        
    except Exception as e:
        return CommandResponse(
            success=False,
            message=f"Error executing command: {str(e)}",
            data={"error": str(e)},
            trace={
                "error": str(e),
                "command": command.command
            }
        )

@router.get("/suggestions")
async def get_suggestions(
    query: str,
    session: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
) -> Dict[str, Any]:
    """Get command suggestions based on partial input"""
    
    suggestions = [
        "invest 100k in polkadot",
        "show portfolio overview",
        "list all companies", 
        "check api keys",
        "start backend",
        "analyze Tesla fundamentals",
        "research AI startups",
        "market overview",
        "sector analysis technology",
        "NVDA earnings analysis",
        "economic data inflation",
        "news sentiment Tesla",
        "options data AAPL",
        "BTC price chart",
        "ETH candle chart",
        "Tesla stock fundamentals",
        "technology sector performance",
        "unemployment economic data",
        "Fed interest rates",
        "MSFT options analysis"
    ]
    
    # Filter based on query
    query_lower = query.lower()
    filtered_suggestions = [cmd for cmd in suggestions if query_lower in cmd.lower()]
    
    return {
        "suggestions": filtered_suggestions[:5],
        "query": query
    }