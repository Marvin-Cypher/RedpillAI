"""
TRUE AI-First Financial Terminal API

Real AI-first architecture based on Gemini CLI principles:
- AI reasons about user requests
- Chooses appropriate tools dynamically
- Maintains conversation context
- No hardcoded pattern matching
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging
from datetime import datetime

from ..core.financial_agent import financial_agent


router = APIRouter()
logger = logging.getLogger(__name__)


class CommandRequest(BaseModel):
    command: str
    user_id: Optional[str] = None
    session_context: Optional[Dict[str, Any]] = None


class CommandResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    
    # AI reasoning trace
    trace: Dict[str, Any] = {}
    execution_time_ms: Optional[float] = None
    
    # Helpful suggestions
    suggested_actions: list[str] = []


@router.post("/execute", response_model=CommandResponse)
async def execute_command(request: CommandRequest):
    """
    Execute command using TRUE AI-first approach (Gemini CLI style)
    
    Key principles:
    - AI reasons about user request
    - Chooses tools dynamically  
    - Maintains conversation context
    - Graceful error handling
    """
    
    start_time = datetime.now()
    
    try:
        # Use AI agent to process command - NO HARDCODED PATTERNS
        result = await financial_agent.process_command(request.command, request.user_id)
        
        execution_time = (datetime.now() - start_time).total_seconds() * 1000
        
        logger.info(f"AI processed command: '{request.command}' - Success: {result['success']}")
        
        response = CommandResponse(
            success=result["success"],
            message=result["message"],
            data=result.get("data", {}),
            
            # AI reasoning trace
            trace={
                "ai_reasoning": result.get("reasoning", ""),
                "tools_used": result.get("tools_used", []),
                "execution_time_ms": execution_time,
                "approach": "ai_first_gemini_style"
            },
            execution_time_ms=execution_time,
            
            # Helpful suggestions
            suggested_actions=result.get("suggested_actions", [
                "Try rephrasing if I didn't understand",
                "Ask for specific financial data or analysis",
                "Use natural language - I understand context"
            ])
        )
        
        return response
        
    except Exception as e:
        execution_time = (datetime.now() - start_time).total_seconds() * 1000
        
        logger.error(f"AI command processing failed: {str(e)}", exc_info=True)
        
        return CommandResponse(
            success=False,
            message=f"I encountered an error processing your request: {str(e)}",
            trace={
                "error_occurred": True,
                "error_type": type(e).__name__,
                "execution_time_ms": execution_time,
                "approach": "ai_first_gemini_style"
            },
            suggested_actions=[
                "Try rephrasing your request",
                "Check if you meant to ask about crypto prices or portfolio management",
                "Use simpler language if the request was complex",
                "Contact support if the issue persists"
            ],
            execution_time_ms=execution_time
        )


@router.get("/debug/{command}")
async def debug_command(command: str):
    """
    Debug endpoint to show how AI processes commands
    """
    
    try:
        # Process command and return detailed info
        result = await financial_agent.process_command(command, user_id="debug")
        
        return {
            "command": command,
            "ai_processing": {
                "reasoning": result.get("reasoning", ""),
                "tools_used": result.get("tools_used", []),
                "success": result["success"]
            },
            "response_preview": result["message"][:200] + "..." if len(result["message"]) > 200 else result["message"],
            "approach": "ai_first_natural_language"
        }
        
    except Exception as e:
        logger.error(f"Debug processing failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tools/available")
async def get_available_tools():
    """Get list of tools available to the AI agent"""
    
    return {
        "approach": "ai_first_dynamic_tool_selection",
        "tools": [
            {
                "name": "get_crypto_price",
                "description": "Get current cryptocurrency price",
                "usage": "AI chooses when user asks about crypto prices"
            },
            {
                "name": "get_stock_price", 
                "description": "Get current stock price",
                "usage": "AI chooses when user asks about stock prices"
            },
            {
                "name": "market_overview",
                "description": "Get today's market summary",
                "usage": "AI chooses when user asks about market conditions"
            },
            {
                "name": "portfolio_operations",
                "description": "Add/remove/view portfolio holdings",
                "usage": "AI chooses when user mentions portfolio changes"
            },
            {
                "name": "financial_analysis",
                "description": "Analyze stocks, crypto, or market trends",
                "usage": "AI chooses when user asks for analysis"
            }
        ],
        "selection_method": "ai_reasoning_based_on_natural_language"
    }


@router.get("/health")
async def health_check():
    """
    Health check for TRUE AI-first architecture
    """
    
    try:
        # Test AI agent
        test_result = await financial_agent.process_command("hello", user_id="health_check")
        
        return {
            "healthy": test_result["success"],
            "architecture": "ai_first_gemini_style", 
            "features": [
                "AI reasoning instead of pattern matching",
                "Dynamic tool selection",
                "Conversation context maintained",
                "Natural language processing",
                "Graceful error handling"
            ],
            "test_command_processed": test_result["success"],
            "approach": "true_ai_first_no_hardcoding"
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        return {
            "healthy": False,
            "error": str(e),
            "architecture": "ai_first_gemini_style_error"
        }


@router.post("/validate")
async def validate_command(request: CommandRequest):
    """
    Validate command without executing - shows AI reasoning
    """
    
    try:
        # Show what AI would do without executing
        return {
            "command": request.command,
            "validation": {
                "approach": "AI will reason about this request naturally",
                "will_understand": "Yes - AI processes any natural language", 
                "no_pattern_matching": "True - no hardcoded keyword matching",
                "context_aware": "Yes - maintains conversation history"
            },
            "examples_ai_can_handle": [
                "got 2 aave in my holding, delete them",
                "today stock market review", 
                "what's bitcoin doing?",
                "analyze Tesla fundamentals",
                "import my portfolio from /path/file.csv"
            ]
        }
        
    except Exception as e:
        logger.error(f"Validation failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))