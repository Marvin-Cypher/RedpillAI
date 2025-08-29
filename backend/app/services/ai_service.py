from typing import List, Dict, Any, Optional, AsyncGenerator
import json
import aiohttp
from datetime import datetime
from openai import OpenAI

from ..config import settings
from ..models.deals import Deal
from ..models.companies import Company

class AIService:
    """AI service for VC analysis supporting both OpenAI and redpill.ai APIs with tool calling."""
    
    def __init__(self):
        # Support multiple AI providers
        self.use_redpill = settings.REDPILL_API_KEY and settings.use_redpill_ai
        
        if self.use_redpill:
            # Use OpenAI client with Redpill baseURL (more reliable)
            self.api_key = settings.REDPILL_API_KEY
            self.base_url = settings.redpill_api_url
            self.client = OpenAI(
                base_url="https://api.redpill.ai/v1",
                api_key=settings.REDPILL_API_KEY
            )
            self.default_model = "phala/gpt-oss-120b"
            self.use_redpill = True
        else:
            # Fallback to OpenAI
            if not settings.openai_api_key or settings.openai_api_key == "sk-9JABKD0bYW6s8VN6PoIG0LUOj1uo44TrXm0MNJWXe7GWP1wR":
                # Use mock mode if no valid API key
                self.client = None
                self.api_key = None
                self.use_redpill = False
            else:
                self.api_key = settings.openai_api_key
                self.client = OpenAI(api_key=settings.openai_api_key)
                self.default_model = "gpt-4"
        
        # Define available tools for function calling
        self.tools = self._define_tools()
    
    def _define_tools(self) -> List[Dict[str, Any]]:
        """Define all available tools for function calling."""
        return [
            {
                "type": "function",
                "function": {
                    "name": "get_portfolio",
                    "description": "Get user portfolio holdings and summary",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "User ID to get portfolio for"}
                        },
                        "required": ["user_id"]
                    }
                }
            },
            {
                "type": "function", 
                "function": {
                    "name": "add_portfolio_holding",
                    "description": "Add an asset to user portfolio",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "User ID"},
                            "symbol": {"type": "string", "description": "Asset symbol (e.g. BTC, ETH, AAPL)"},
                            "amount": {"type": "number", "description": "Amount to add"}
                        },
                        "required": ["user_id", "symbol", "amount"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "remove_portfolio_holding", 
                    "description": "Remove or reduce an asset from user portfolio",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "user_id": {"type": "string", "description": "User ID"},
                            "symbol": {"type": "string", "description": "Asset symbol to remove"},
                            "amount": {"type": "number", "description": "Amount to remove (optional - removes all if not specified)"}
                        },
                        "required": ["user_id", "symbol"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_crypto_price",
                    "description": "Get current cryptocurrency price and market data",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "symbol": {"type": "string", "description": "Crypto symbol (e.g. BTC, ETH)"}
                        },
                        "required": ["symbol"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_equity_quote",
                    "description": "Get stock/equity quote and market data",
                    "parameters": {
                        "type": "object", 
                        "properties": {
                            "symbol": {"type": "string", "description": "Stock symbol (e.g. AAPL, MSFT)"}
                        },
                        "required": ["symbol"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_chart",
                    "description": "Create price chart for financial assets",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "symbols": {"type": "array", "items": {"type": "string"}, "description": "Asset symbols to chart"},
                            "period": {"type": "string", "description": "Time period (1d, 7d, 1m, 3m, 6m, 1y)"}
                        },
                        "required": ["symbols"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_market_overview",
                    "description": "Get market overview and summary of major indices and trends",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_companies",
                    "description": "Get list of companies in the database",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "sector": {"type": "string", "description": "Filter by sector (optional)"}
                        },
                        "required": []
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "map_companies_to_symbols",
                    "description": "Map company names to their stock ticker symbols for chart creation and analysis",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "company_names": {
                                "type": "array",
                                "description": "Array of company names to map to stock symbols",
                                "items": {"type": "string"}
                            }
                        },
                        "required": ["company_names"]
                    }
                }
            },
            {
                "type": "function", 
                "function": {
                    "name": "check_api_keys",
                    "description": "Check API key configuration status",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                        "required": []
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "import_portfolio",
                    "description": "Import portfolio from file or external source",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {"type": "string", "description": "Path to portfolio file"},
                            "format": {"type": "string", "description": "File format (csv, json, excel)"}
                        },
                        "required": ["file_path"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_news",
                    "description": "Get latest news and market updates using Exa.ai",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Search query for news (e.g., 'Bitcoin', 'NVDA earnings', 'market indices')"},
                            "limit": {"type": "number", "description": "Number of articles to return (default: 5)"}
                        },
                        "required": ["query"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_indices",
                    "description": "Get major market indices and performance data",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "region": {"type": "string", "description": "Region (US, EU, ASIA) or 'all' for global"}
                        },
                        "required": []
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_trending_stocks",
                    "description": "Get today's top trending stocks with volume and price movements",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "count": {"type": "number", "description": "Number of trending stocks to return (default: 10)"},
                            "category": {"type": "string", "description": "Category filter: 'gainers', 'losers', 'volume', or 'all'"},
                            "sector": {"type": "string", "description": "Sector filter: 'tech', 'semiconductor', 'chip', 'finance', 'energy', 'healthcare', etc."}
                        },
                        "required": []
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "access_internet",
                    "description": "Access internet to fetch data when APIs fail - search web or fetch specific URLs",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Search query or URL to fetch"},
                            "purpose": {"type": "string", "description": "What data you're trying to get (e.g., 'stock price', 'crypto price', 'market news')"}
                        },
                        "required": ["query", "purpose"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "create_script",
                    "description": "Create a script or tool when needed functionality doesn't exist",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "script_type": {"type": "string", "description": "Type: 'python', 'bash', 'nodejs', 'curl'"},
                            "purpose": {"type": "string", "description": "What the script should accomplish"},
                            "requirements": {"type": "string", "description": "Specific requirements or APIs to use"}
                        },
                        "required": ["script_type", "purpose"]
                    }
                }
            },
            {
                "type": "function", 
                "function": {
                    "name": "access_device_files",
                    "description": "Access local device files when needed (read, search, analyze)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action": {"type": "string", "description": "Action: 'search', 'read', 'list', 'analyze'"},
                            "path": {"type": "string", "description": "File path or directory to access"},
                            "pattern": {"type": "string", "description": "Search pattern if searching for files"}
                        },
                        "required": ["action"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "execute_system_command", 
                    "description": "Execute system commands when needed to solve problems",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "command": {"type": "string", "description": "System command to execute"},
                            "purpose": {"type": "string", "description": "Why this command is needed"},
                            "safe": {"type": "boolean", "description": "Whether this command is safe to execute (default: true)"}
                        },
                        "required": ["command", "purpose"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "execute_multi_step_request",
                    "description": "Execute complex requests that require multiple tools in sequence (e.g., get data then create chart)",
                    "parameters": {
                        "type": "object", 
                        "properties": {
                            "steps": {
                                "type": "array",
                                "description": "Array of steps to execute in order",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "tool": {"type": "string", "description": "Tool name to use"},
                                        "params": {"type": "object", "description": "Parameters for the tool"},
                                        "description": {"type": "string", "description": "What this step does"}
                                    }
                                }
                            },
                            "final_goal": {"type": "string", "description": "Overall goal of the multi-step request"}
                        },
                        "required": ["steps", "final_goal"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "research_and_analyze_companies",
                    "description": "Research companies in a specific sector/category, analyze them, and extract actionable data (symbols, market caps, etc.)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "sector": {"type": "string", "description": "Sector/category to research (e.g., 'AI security', 'fintech', 'biotech')"},
                            "company_type": {"type": "string", "description": "Type filter: 'public', 'private', 'startup', 'all'"},
                            "count": {"type": "number", "description": "Number of companies to analyze (default: 5)"},
                            "analysis_focus": {"type": "string", "description": "What to analyze: 'market_cap', 'growth', 'financial', 'competitive'"}
                        },
                        "required": ["sector"]
                    }
                }
            }
        ]
        
    def create_vc_system_prompt(self, deal: Deal, company: Company) -> str:
        """Create a specialized system prompt for VC analysis."""
        return f"""You are a senior venture capital analyst at Redpill, a leading VC firm specializing in blockchain, DeFi, and Web3 investments. You are analyzing {company.name}, a {company.sector} company in the {deal.stage} stage.

Company Context:
- Company: {company.name}
- Sector: {company.sector}
- Stage: {deal.stage}
- Deal Status: {deal.status}
- Round Size: ${deal.round_size/1000000 if deal.round_size else 'TBD'}M
- Valuation: ${deal.valuation/1000000 if deal.valuation else 'TBD'}M
- Our Target: ${deal.our_target/1000000 if deal.our_target else 'TBD'}M
- Founded: {company.founded_year or 'N/A'}
- Location: {company.headquarters or 'N/A'}
- Employees: {company.employee_count or 'N/A'}
- Website: {company.website or 'N/A'}
- Description: {company.description or 'No description available'}

Your expertise includes:
1. **Market Analysis**: TAM/SAM analysis, competitive landscape, market timing
2. **Technology Assessment**: Technical feasibility, innovation, IP analysis
3. **Team Evaluation**: Founder backgrounds, team composition, execution capability
4. **Financial Modeling**: Revenue projections, unit economics, burn rate analysis
5. **Risk Assessment**: Technical, market, regulatory, and execution risks
6. **Due Diligence**: Investment thesis, term sheet analysis, exit scenarios

Guidelines:
- Provide data-driven, analytical responses
- Consider both opportunities and risks
- Reference industry benchmarks and comparable companies
- Focus on actionable insights for investment decisions
- Be thorough but concise
- Always maintain professional VC terminology
- Support recommendations with clear reasoning

Current investment pipeline probability: {deal.probability or 'Not assessed'}%
Next milestone: {deal.next_milestone or 'Not defined'}
"""

    def _generate_mock_response(self, query: str, company_name: str) -> str:
        """Generate mock response when no API is available."""
        query_lower = query.lower()
        
        if "valuation" in query_lower:
            return f"Based on my analysis of {company_name}, the valuation appears reasonable given current market conditions. Key factors include their technology differentiation, market traction, and team strength. I'd recommend comparing this to similar deals in the sector."
        elif "risk" in query_lower:
            return f"The main risks for {company_name} include: 1) Market timing and adoption rates, 2) Competitive threats from established players, 3) Technology execution challenges, 4) Regulatory uncertainty in their sector. These should be carefully evaluated during due diligence."
        elif "team" in query_lower:
            return f"The {company_name} team shows promise with relevant domain expertise. Key strengths include their technical background and industry connections. Areas to explore further include scaling experience and go-to-market capabilities."
        else:
            return f"I'm analyzing {company_name} from a VC investment perspective. Could you please be more specific about what aspect you'd like me to evaluate? I can help with market analysis, competitive positioning, team assessment, or financial projections."

    async def _call_redpill_api(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 1000,
        temperature: float = 0.7,
        stream: bool = False
    ) -> Dict[str, Any]:
        """Call redpill.ai API with OpenAI-compatible format."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Clean and validate messages to prevent parsing errors
        cleaned_messages = []
        for msg in messages:
            # Ensure all fields are strings and not None
            role = str(msg.get("role", "user")).strip()
            content = str(msg.get("content", "")).strip()
            
            # Skip empty messages
            if not content:
                continue
                
            # Limit content length to prevent API errors
            if len(content) > 4000:
                content = content[:4000] + "..."
                
            cleaned_messages.append({
                "role": role,
                "content": content
            })
        
        # Ensure we have at least one message
        if not cleaned_messages:
            cleaned_messages = [{"role": "user", "content": "Hello"}]
        
        payload = {
            "model": self.default_model,
            "messages": cleaned_messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    print(f"Redpill API error {response.status}: {error_text}")
                    print(f"Payload sent: {json.dumps(payload, indent=2)}")
                    raise Exception(f"Redpill AI API error {response.status}: {error_text}")

    async def generate_response(
        self,
        prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> str:
        """Simple response generation for terminal interactions"""
        if not self.client:
            # Mock mode
            return f"Mock response to: {prompt[:100]}..."
        
        try:
            if self.use_redpill:
                response = self.client.chat.completions.create(
                    model=self.default_model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens,
                    temperature=temperature
                )
            else:
                response = self.client.chat.completions.create(
                    model=self.default_model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens,
                    temperature=temperature
                )
            
            return response.choices[0].message.content
            
        except Exception as e:
            # Fallback to mock response
            return f"I understand you're asking about '{prompt[:50]}'. I'm working on processing your request."

    async def generate_chat_response(
        self, 
        user_message: str, 
        conversation_history: List[Dict[str, str]], 
        deal: Deal, 
        company: Company
    ) -> str:
        """Generate AI response for chat conversation."""
        
        system_prompt = self.create_vc_system_prompt(deal, company)
        
        # Build message history
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history
        for msg in conversation_history[-10:]:  # Keep last 10 messages for context
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        try:
            if self.use_redpill:
                # Use redpill.ai API
                response = await self._call_redpill_api(messages, max_tokens=1000, temperature=0.7)
                return response["choices"][0]["message"]["content"]
            elif self.client:
                # Use OpenAI API
                response = self.client.chat.completions.create(
                    model=self.default_model,
                    messages=messages,
                    max_tokens=1000,
                    temperature=0.7,
                    presence_penalty=0.1,
                    frequency_penalty=0.1
                )
                return response.choices[0].message.content
            else:
                # Mock response when no API is available
                return self._generate_mock_response(user_message, company.name)
            
        except Exception as e:
            print(f"AI API error: {e}")
            return f"I apologize, but I'm experiencing technical difficulties. Please try again. (Error: {str(e)[:100]})"
    
    async def generate_quick_analysis(
        self, 
        analysis_type: str, 
        deal: Deal, 
        company: Company
    ) -> Dict[str, Any]:
        """Generate quick AI analysis for specific aspects."""
        
        system_prompt = self.create_vc_system_prompt(deal, company)
        
        analysis_prompts = {
            "risks": f"Provide a comprehensive risk analysis for {company.name}. Identify and analyze the top 5 risks (market, technical, team, regulatory, competitive) with mitigation strategies. Format as structured bullet points.",
            
            "competition": f"Analyze the competitive landscape for {company.name} in the {company.sector} sector. Identify direct and indirect competitors, competitive advantages, and market positioning. Include a competitive matrix if possible.",
            
            "team": f"Evaluate the founding team and key personnel at {company.name}. Assess their backgrounds, relevant experience, track record, and team composition. Identify any gaps or red flags.",
            
            "market": f"Perform a market analysis for {company.name}. Estimate TAM/SAM/SOM, analyze market trends, growth drivers, and timing. Include market dynamics and opportunities.",
            
            "memo": f"Generate a comprehensive investment memo for {company.name}. Include executive summary, investment thesis, market opportunity, competitive analysis, team assessment, financial projections, risks, and recommendation. Structure it as a formal VC investment memo.",
            
            "valuation": f"Analyze the valuation of {company.name} at ${deal.valuation/1000000 if deal.valuation else 'TBD'}M. Compare to industry benchmarks, comparable companies, and provide valuation assessment. Include multiple valuation methods if applicable.",
            
            "diligence": f"Create a due diligence checklist for {company.name}. Identify key areas to investigate: technical, commercial, legal, financial, and team. Prioritize critical due diligence items."
        }
        
        prompt = analysis_prompts.get(analysis_type)
        if not prompt:
            return {
                "error": f"Unknown analysis type: {analysis_type}",
                "available_types": list(analysis_prompts.keys())
            }
        
        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            if self.use_redpill:
                # Use redpill.ai API
                response = await self._call_redpill_api(messages, max_tokens=1500, temperature=0.3)
                content = response["choices"][0]["message"]["content"]
            elif self.client:
                # Use OpenAI API
                response = self.client.chat.completions.create(
                    model=self.default_model,
                    messages=messages,
                    max_tokens=1500,
                    temperature=0.3,  # Lower temperature for more focused analysis
                    presence_penalty=0.1
                )
                content = response.choices[0].message.content
            else:
                # Mock response
                content = f"[Mock Analysis] {analysis_type.title()} for {company.name}:\n\n{self._generate_mock_response(prompt, company.name)}"
            
            return {
                "analysis_type": analysis_type,
                "company": company.name,
                "deal_id": deal.id,
                "content": content,
                "generated_at": datetime.utcnow().isoformat(),
                "model": "gpt-4",
                "confidence": 85,  # Model confidence score
                "word_count": len(content.split())
            }
            
        except Exception as e:
            print(f"OpenAI API error in quick analysis: {e}")
            return {
                "error": f"Failed to generate analysis: {str(e)[:100]}",
                "analysis_type": analysis_type,
                "company": company.name
            }
    
    async def generate_investment_memo(
        self, 
        deal: Deal, 
        company: Company,
        additional_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate a comprehensive investment memo."""
        
        system_prompt = f"""You are a senior investment partner at Redpill VC writing a formal investment memo for the partnership. Create a comprehensive, professional investment memo for {company.name}.

Structure the memo with these sections:
1. EXECUTIVE SUMMARY
2. INVESTMENT THESIS  
3. COMPANY OVERVIEW
4. MARKET OPPORTUNITY
5. COMPETITIVE LANDSCAPE
6. TEAM ASSESSMENT
7. BUSINESS MODEL & FINANCIALS
8. TECHNOLOGY ANALYSIS
9. RISK ASSESSMENT
10. VALUATION & TERMS
11. RECOMMENDATION

Use professional VC language, include specific metrics where possible, and provide a clear investment recommendation."""

        context_info = f"""
Company: {company.name}
Sector: {company.sector}
Stage: {deal.stage}
Valuation: ${deal.valuation/1000000 if deal.valuation else 'TBD'}M
Round Size: ${deal.round_size/1000000 if deal.round_size else 'TBD'}M
Our Investment: ${deal.our_target/1000000 if deal.our_target else 'TBD'}M
Founded: {company.founded_year}
Team Size: {company.employee_count}
Location: {company.headquarters}
Description: {company.description}
{f'Additional Context: {additional_context}' if additional_context else ''}
"""
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Generate a comprehensive investment memo based on this information:\n\n{context_info}\n\nEnsure the memo is detailed, professional, and includes specific analysis and recommendations."}
                ],
                max_tokens=3000,
                temperature=0.3
            )
            
            content = response.choices[0].message.content
            
            return {
                "title": f"Investment Memo: {company.name}",
                "company": company.name,
                "deal_id": deal.id,
                "content": content,
                "generated_at": datetime.utcnow().isoformat(),
                "model": "gpt-4",
                "word_count": len(content.split()),
                "type": "investment_memo"
            }
            
        except Exception as e:
            print(f"OpenAI API error in memo generation: {e}")
            return {
                "error": f"Failed to generate investment memo: {str(e)[:100]}",
                "company": company.name
            }

    async def chat(
        self,
        message: str,
        project_context: Optional[Dict[str, Any]] = None,
        conversation_history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Main chat method that the API endpoint expects.
        Routes to appropriate AI provider and handles responses.
        """
        try:
            # Build context for AI
            context_info = ""
            if project_context:
                project_name = project_context.get("project_name", "Unknown")
                project_type = project_context.get("project_type", "general")
                context_info = f"Project: {project_name} (Type: {project_type})"

            # Build conversation history for context
            history_context = ""
            if conversation_history:
                for msg in conversation_history[-5:]:  # Use last 5 messages for context
                    history_context += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"

            # System prompt for VC assistant
            system_prompt = f"""You are a senior VC analyst at Redpill, a leading venture capital firm specializing in blockchain, DeFi, and Web3 investments.

{f"Current Context: {context_info}" if context_info else ""}

IMPORTANT: Always respond in English. Provide thoughtful, professional analysis and insights. Focus on:
- Investment opportunities and risks
- Market dynamics and trends
- Technical assessment
- Team and execution capabilities
- Financial projections and valuation

Be concise but thorough in your responses. Use only English language in all responses."""

            # Prepare messages for AI
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add conversation history if available
            if conversation_history:
                for msg in conversation_history[-10:]:  # Last 10 messages
                    # Map frontend role names to API-compatible names
                    role = msg.get("role", "user")
                    if role == "ai":
                        role = "assistant"
                    messages.append({
                        "role": role,
                        "content": msg.get("content", "")
                    })

            # Add current user message
            messages.append({"role": "user", "content": message})

            # Route to appropriate AI provider with tool calling
            if self.client:
                response = self.client.chat.completions.create(
                    model=self.default_model,
                    messages=messages,
                    max_tokens=2000,
                    temperature=0.7,
                    tools=self.tools,
                    tool_choice="auto"
                )
                
                # Handle tool calls if present
                message = response.choices[0].message
                if message.tool_calls:
                    # Return both content and tool calls for processing
                    content = message.content or "I'll help you with that."
                    tool_calls = []
                    for tool_call in message.tool_calls:
                        tool_calls.append({
                            "id": tool_call.id,
                            "function": {
                                "name": tool_call.function.name,
                                "arguments": tool_call.function.arguments
                            }
                        })
                    
                    return {
                        "content": content,
                        "tool_calls": tool_calls,
                        "model": self.default_model,
                        "usage": {
                            "total_tokens": response.usage.total_tokens if response.usage else 0,
                            "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                            "completion_tokens": response.usage.completion_tokens if response.usage else 0
                        }
                    }
                else:
                    content = message.content
                    model = self.default_model
                    usage = {
                        "total_tokens": response.usage.total_tokens if response.usage else 0,
                        "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                        "completion_tokens": response.usage.completion_tokens if response.usage else 0
                    }
            else:
                # Mock response for development
                content = self._generate_mock_chat_response(message, project_context)
                model = "mock"
                usage = {"total_tokens": 0}

            return {
                "content": content,
                "model": model,
                "usage": usage,
                "projectContext": project_context
            }

        except Exception as e:
            print(f"AI chat error: {e}")
            # Return a fallback response
            return {
                "content": f"I apologize, but I'm experiencing technical difficulties. Error: {str(e)[:100]}",
                "model": "error",
                "usage": {"total_tokens": 0},
                "projectContext": project_context,
                "error": str(e)
            }

    def _generate_mock_chat_response(
        self,
        message: str,
        project_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate a mock AI response for development/testing."""
        project_name = project_context.get("project_name", "this project") if project_context else "this topic"
        
        mock_responses = [
            f"Thanks for your question about {project_name}. As a VC analyst, I'd like to explore this further. What specific aspects are you most interested in discussing?",
            f"Regarding {project_name}, this is an interesting analysis point. From a venture capital perspective, we should consider the market opportunity, competitive landscape, and execution risk.",
            f"Your question about {project_name} touches on important investment considerations. Let me provide some thoughts based on current market trends and our investment thesis.",
            f"That's a great question about {project_name}. In our experience evaluating similar opportunities, key factors include team strength, market timing, and scalability potential."
        ]
        
        # Simple hash to get consistent response for same input
        import hashlib
        response_index = int(hashlib.md5(message.encode()).hexdigest(), 16) % len(mock_responses)
        return mock_responses[response_index]

# Singleton instance
ai_service = AIService()