# VC Deal Analyzer Tool for Suna
# This extends Suna with VC-specific investment analysis

from typing import Dict, Any, List
import json
from datetime import datetime

class VCDealAnalyzer:
    """
    Custom Suna tool for analyzing potential VC investments.
    Uses Suna's existing tools internally.
    """
    
    def __init__(self, suna_context):
        self.suna = suna_context
        self.name = "vc_deal_analyzer"
        self.description = "Analyze potential investments with VC-specific metrics"
        
    async def execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a potential investment opportunity.
        
        Parameters:
        - company_name: Name of the company
        - sector: Industry sector
        - stage: Funding stage (seed, series A, etc)
        - investment_size: Potential investment amount
        """
        company_name = params.get("company_name")
        sector = params.get("sector", "")
        stage = params.get("stage", "seed")
        
        # Step 1: Use Suna's web search for company info
        company_research = await self.suna.call_tool("web_search", {
            "query": f"{company_name} {sector} funding revenue team news",
            "num_results": 20
        })
        
        # Step 2: Search for competitor analysis
        competitor_research = await self.suna.call_tool("web_search", {
            "query": f"{sector} startups competitors {company_name} market size",
            "num_results": 15
        })
        
        # Step 3: LinkedIn search for founders
        founder_research = await self.suna.call_tool("linkedin_scraper", {
            "query": f"{company_name} founder CEO CTO",
            "limit": 5
        })
        
        # Step 4: Financial data if available
        financial_research = await self.suna.call_tool("web_search", {
            "query": f"{company_name} revenue ARR growth rate burn rate",
            "num_results": 10
        })
        
        # Step 5: Use Suna's AI to analyze all data
        analysis_prompt = f"""
        Analyze this investment opportunity for a VC firm:
        
        Company: {company_name}
        Sector: {sector}
        Stage: {stage}
        
        Company Research: {json.dumps(company_research, indent=2)}
        Competitor Analysis: {json.dumps(competitor_research, indent=2)}
        Founder Profiles: {json.dumps(founder_research, indent=2)}
        Financial Data: {json.dumps(financial_research, indent=2)}
        
        Provide a VC investment analysis including:
        1. Market opportunity size and growth
        2. Competitive advantages and moats
        3. Team assessment
        4. Business model and unit economics
        5. Key risks and mitigation strategies
        6. Investment recommendation with rationale
        7. Suggested valuation range
        8. Key milestones to track
        
        Format as a structured JSON response.
        """
        
        ai_analysis = await self.suna.call_tool("ai_chat", {
            "messages": [{
                "role": "system",
                "content": "You are a senior VC partner with deep expertise in startup analysis."
            }, {
                "role": "user", 
                "content": analysis_prompt
            }]
        })
        
        # Step 6: Create structured output
        return {
            "company": company_name,
            "sector": sector,
            "stage": stage,
            "analysis_date": datetime.now().isoformat(),
            "market_research": self._extract_market_insights(company_research, competitor_research),
            "team_assessment": self._assess_team(founder_research),
            "financial_analysis": self._analyze_financials(financial_research),
            "ai_recommendation": ai_analysis,
            "data_sources": {
                "company_sources": len(company_research.get("results", [])),
                "competitor_sources": len(competitor_research.get("results", [])),
                "founder_profiles": len(founder_research.get("results", []))
            }
        }
    
    def _extract_market_insights(self, company_data: Dict, competitor_data: Dict) -> Dict:
        """Extract market-specific insights from search results."""
        return {
            "market_signals": "Extracted from search results",
            "competitive_landscape": "Analysis of competitors",
            "market_size_estimate": "Based on available data"
        }
    
    def _assess_team(self, founder_data: Dict) -> Dict:
        """Assess founding team strength."""
        return {
            "founder_experience": "Based on LinkedIn profiles",
            "previous_exits": "Extracted from profiles",
            "team_completeness": "Analysis of key roles"
        }
    
    def _analyze_financials(self, financial_data: Dict) -> Dict:
        """Analyze available financial information."""
        return {
            "revenue_indicators": "Extracted from public sources",
            "funding_history": "Previous rounds and valuations",
            "burn_rate_estimate": "Based on team size and industry"
        }

# Register tool with Suna
def register_tool(suna_app):
    """Register this tool with Suna's tool system."""
    tool = VCDealAnalyzer(suna_app)
    suna_app.register_tool(
        name=tool.name,
        description=tool.description,
        execute_fn=tool.execute,
        parameters={
            "company_name": {"type": "string", "required": True},
            "sector": {"type": "string", "required": False},
            "stage": {"type": "string", "required": False},
            "investment_size": {"type": "number", "required": False}
        }
    )