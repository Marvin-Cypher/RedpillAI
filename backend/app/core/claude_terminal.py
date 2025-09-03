"""
Claude Code Level AI Terminal - True AI-First Architecture
No hardcoded routing, no intent tables, no predetermined workflows.
Pure AI reasoning with flexible tool calling.
"""

from typing import Dict, Any, List, Optional, Union
import json
import asyncio
from datetime import datetime
from pydantic import BaseModel
from ..services.ai_service import AIService
from ..services.intelligent_tools import IntelligentToolsService


class QueryResult(BaseModel):
    """Result from AI query processing"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None
    tools_used: List[str] = []
    reasoning: Optional[str] = None
    follow_up_suggestions: List[str] = []


class ClaudeTerminal:
    """
    True Claude Code level terminal - AI reasons about tools, no hardcoded patterns
    """
    
    def __init__(self):
        self.ai_service = AIService()
        self.tools_service = IntelligentToolsService()
        
    async def process_query(self, user_query: str, user_context: Optional[Dict] = None) -> QueryResult:
        """
        Main processing method - let AI reason about what to do
        """
        try:
            # Get all available tools with their schemas
            available_tools = await self.tools_service.get_tool_definitions()
            
            # Build system prompt with tool capabilities
            system_prompt = self._build_system_prompt(available_tools)
            
            # Build user message with context
            user_message = user_query
            if user_context:
                user_id = user_context.get("user_id") or "default"
                # Add user context to the prompt so AI knows the user ID
                user_message = f"[User ID: {user_id}] {user_query}"
            
            # Let AI reason and decide what tools to use
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ]
            
            # Use OpenAI function calling - let AI choose tools dynamically
            response = await self.ai_service.chat_with_tools(
                messages=messages,
                tools=available_tools,
                tool_choice="auto"  # Let AI decide
            )
            
            # Process AI response and execute any tool calls
            result = await self._process_ai_response(response, user_query)
            
            return result
            
        except Exception as e:
            return QueryResult(
                success=False,
                message=f"Error processing query: {str(e)}",
                data={"error": str(e)}
            )
    
    def _build_system_prompt(self, available_tools: List[Dict]) -> str:
        """Build system prompt with available tools"""
        tool_descriptions = []
        for tool in available_tools:
            func = tool["function"]
            tool_descriptions.append(f"• {func['name']}: {func['description']}")
        
        return f"""You are an intelligent FINANCIAL AI ASSISTANT with deep expertise in investment analysis and portfolio management.

🧠 CORE INTELLIGENCE PRINCIPLES:
- You understand user intent through semantic analysis, not pattern matching
- You choose tools based on their capabilities and user needs, not hardcoded rules  
- You reason about what the user wants and select the best tools to accomplish it
- You trust your intelligence to understand context and make smart tool choices

🏦 FINANCIAL DOMAIN CONTEXT:
- All interactions focus on investing, trading, portfolio management, and market analysis
- Users are investors, fund managers, analysts seeking investment insights
- Numbers represent financial values: "100M" = $100 million market cap, "500B" = $500 billion

💰 FINANCIAL TERMINOLOGY:
- "tracking companies/list" = user's watchlist, portfolio, or monitored investments
- "my companies/portfolio" = user's personal investment holdings and tracking list  
- "performance" = stock price changes, returns, trading metrics
- "market cap limits" = company size filtering (e.g., "within 100M" = companies ≤ $100M market cap)

🛠 AVAILABLE TOOLS - UNDERSTAND THEIR CAPABILITIES:
{chr(10).join(tool_descriptions)}

🎯 SEMANTIC REASONING APPROACH:
1. **Understand Intent**: What does the user actually want to accomplish?
2. **Analyze Context**: What domain knowledge and user context applies?
3. **Choose Tools**: Which tool(s) can best fulfill the user's needs?
4. **Extract Parameters**: What parameters does the tool need from the user's request?
5. **Execute Intelligently**: Use tools to provide comprehensive, actionable insights

🔥 CRITICAL: You have access to the user's ID in the message context. When users ask about their personal data ("my portfolio", "my tracking list", "my companies"), automatically use the provided user_id to call appropriate tools. Never ask for user identification - use what's provided in the context.

📊 OUTPUT FORMATTING RULES:
- When creating tables, ALWAYS provide COMPLETE data - never truncate rows or columns
- Include ALL requested companies/items in your analysis, not just a subset
- Format tables properly with all columns visible and complete information
- Do not abbreviate or truncate content to save space - provide full details

🎯 CRITICAL TABLE FORMATTING RULE:
- ALWAYS use the format_financial_table tool for ANY table containing financial data (companies, quotes, fundamentals, comparisons)
- Set format="rich" for clean box-drawing tables (┌─┬─┐) that are CLI-friendly
- Do NOT use markdown tables for financial data - they are harder to read in terminal
- Use table_type="companies" for company comparisons, "quotes" for market data, "portfolio" for holdings

Trust your intelligence. Understand semantically. Choose tools wisely. Provide professional investment insights.
"""
    
    async def _process_ai_response(self, response: Dict, original_query: str) -> QueryResult:
        """Process AI response and execute tool calls"""
        
        message_content = ""
        tools_used = []
        combined_data = {}
        reasoning = ""
        
        # Check if AI wants to use tools
        print(f"DEBUG: AI response keys: {response.keys()}")
        if "tool_calls" in response:
            print(f"DEBUG: Found {len(response['tool_calls'])} tool calls")
            # Execute tool calls sequentially or in parallel as needed
            for tool_call in response["tool_calls"]:
                tool_name = tool_call["function"]["name"]
                tool_args = json.loads(tool_call["function"]["arguments"])
                
                # Execute the tool
                print(f"DEBUG: About to execute tool {tool_name} with args {tool_args}")
                tool_result = await self.tools_service.execute_tool(
                    tool_name=tool_name,
                    arguments=tool_args
                )
                print(f"DEBUG: Tool result: {tool_result}")
                
                tools_used.append(tool_name)
                
                # Merge tool results (ToolResult is a Pydantic model)
                if tool_result.success:
                    if tool_result.data:
                        combined_data.update(tool_result.data)
                    if tool_result.message:
                        message_content += f"{tool_result.message}\n\n"
                else:
                    message_content += f"❌ {tool_name} failed: {tool_result.message or 'Unknown error'}\n\n"
            
            # Check if tool results already contain formatted tables - if so, use them directly
            if message_content and any("┌" in msg and "┐" in msg for msg in message_content.split("\n")):
                # Tool result already contains clean box tables - use as-is
                pass
            else:
                # Let AI synthesize final response based on tool results
                synthesis_prompt = f"""
Original query: {original_query}

Tool results: {json.dumps(combined_data, indent=2)}

🎯 CRITICAL: If the tool results contain a "formatted_table" field, you MUST use that exact table formatting in your response instead of creating new tables. The formatted_table contains clean box-drawing characters (┌─┬─┐) optimized for CLI display.

Based on these tool results, provide a comprehensive answer to the user's query. 
Format the response professionally with proper organization, and actionable insights.
If there is a "formatted_table" in the data, display it prominently.
"""
                
                # Use increased max_tokens for complete table output
                final_response = await self.ai_service.generate_response(
                    synthesis_prompt, 
                    max_tokens=8000,  # Increased to prevent table truncation
                    temperature=0.3   # Lower temperature for consistent formatting
                )
                message_content = final_response or "Analysis completed successfully"
            
        else:
            # AI provided direct response without tools
            message_content = response.get("content", "I understand your request but couldn't determine the appropriate tools to use.")
        
        return QueryResult(
            success=True,
            message=message_content.strip(),
            data=combined_data,
            tools_used=tools_used,
            reasoning=reasoning
        )