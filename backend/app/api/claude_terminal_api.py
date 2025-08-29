"""
Claude Code Level Terminal API - Replacement for the hardcoded terminal.py
True AI-first architecture with flexible tool calling
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import json

from ..core.claude_terminal import ClaudeTerminal, QueryResult
from ..database import get_db
from sqlmodel import Session


router = APIRouter()


class TerminalQuery(BaseModel):
    """Input for terminal queries"""
    query: str
    user_id: Optional[str] = "default"
    context: Optional[Dict[str, Any]] = None


class TerminalResponse(BaseModel):
    """Response from terminal"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    tools_used: list = []
    reasoning: Optional[str] = None
    follow_up_suggestions: list = []
    timestamp: datetime


@router.post("/query", response_model=TerminalResponse)
async def process_terminal_query(
    request: TerminalQuery,
    db: Session = Depends(get_db)
):
    """
    Process natural language query with Claude Code level intelligence
    
    Examples:
    - "list top biotech companies in US (not healthcare or pill makers), ranked by market cap"
    - "compare NVDA vs AMD vs Intel performance over last year"  
    - "add 5 BTC to my portfolio then show me crypto market overview"
    - "what are trending AI stocks today with volume analysis"
    """
    
    try:
        # Initialize Claude terminal
        terminal = ClaudeTerminal()
        
        # Process query with AI reasoning
        result = await terminal.process_query(
            user_query=request.query,
            user_context=request.context
        )
        
        # Convert to API response format
        response = TerminalResponse(
            success=result.success,
            message=result.message,
            data=result.data,
            tools_used=result.tools_used,
            reasoning=result.reasoning,
            follow_up_suggestions=result.follow_up_suggestions,
            timestamp=datetime.now()
        )
        
        return response
        
    except Exception as e:
        return TerminalResponse(
            success=False,
            message=f"Error processing query: {str(e)}",
            data={"error": str(e), "query": request.query},
            tools_used=[],
            timestamp=datetime.now()
        )


@router.get("/capabilities")
async def get_terminal_capabilities():
    """Get information about terminal capabilities"""
    
    return {
        "name": "Claude Code Level AI Terminal",
        "description": "True AI-first financial terminal with flexible tool calling",
        "features": [
            "Natural language query processing",
            "Dynamic parameter extraction", 
            "Flexible tool composition",
            "Multi-step reasoning",
            "Complex filtering and ranking",
            "Real-time market data integration"
        ],
        "example_queries": [
            "list top biotech companies in US ranked by market cap",
            "compare performance of my portfolio vs SPY",
            "find trending semiconductor stocks with high volume",
            "analyze NVDA fundamentals and create price chart",
            "add 2.5 ETH to portfolio then show crypto market overview",
            "research fintech companies in Europe with > $1B valuation"
        ],
        "available_tools": [
            "search_companies - Flexible company search with filtering",
            "get_market_data - Comprehensive market data retrieval", 
            "analyze_portfolio - Multi-dimensional portfolio analysis",
            "create_investment_analysis - AI-powered investment research",
            "get_trending_analysis - Trending stocks/sectors analysis",
            "execute_portfolio_action - Portfolio management actions"
        ]
    }


@router.post("/test-biotech")
async def test_biotech_query(db: Session = Depends(get_db)):
    """Test the specific biotech query that was failing before"""
    
    test_query = "list top bio tech companies in us (not health care or pill maker), rank by market"
    
    terminal = ClaudeTerminal()
    result = await terminal.process_query(test_query)
    
    return {
        "test_query": test_query,
        "result": result.dict(),
        "analysis": {
            "tools_used": result.tools_used,
            "success": result.success,
            "message_length": len(result.message),
            "data_keys": list(result.data.keys()) if result.data else []
        }
    }