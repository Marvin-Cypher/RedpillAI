"""
Investment Intelligence Service for RedPill Terminal
Provides proactive AI features with portfolio awareness and meeting preparation
"""

import logging
import json
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import asyncio

from .unified_chroma_service import UnifiedChromaService, SourceType, ChromaDocument

logger = logging.getLogger(__name__)


@dataclass
class InvestmentInsight:
    """Structured investment insight"""
    insight_type: str  # "opportunity", "risk", "trend", "alert"
    title: str
    description: str
    symbols: List[str]
    confidence: float
    metadata: Dict[str, Any]
    timestamp: datetime


@dataclass 
class MeetingPrep:
    """Meeting preparation package"""
    company: str
    symbol: str
    talking_points: List[str]
    recent_news: List[Dict[str, str]]
    financials_summary: Dict[str, Any]
    competitive_landscape: Dict[str, Any]
    questions_to_ask: List[str]
    investment_thesis: str


class InvestmentIntelligenceService:
    """
    Proactive AI intelligence for investment decisions
    Provides portfolio-aware insights, meeting prep, and pattern recognition
    """
    
    def __init__(self, chroma_service: UnifiedChromaService):
        self.logger = logging.getLogger(__name__)
        self.chroma = chroma_service
        self.portfolio_context = {}
        self.market_patterns = {}
        
    async def get_portfolio_context(self, tenant_id: str = "default") -> Dict[str, Any]:
        """Build comprehensive portfolio context from ChromaDB"""
        try:
            context = {
                "holdings": [],
                "watchlist": [],
                "recent_research": [],
                "investment_themes": [],
                "risk_exposure": {},
                "sector_allocation": {}
            }
            
            # Get portfolio holdings
            portfolio_results = await self.chroma.semantic_search(
                collection_name="portfolio_memory",
                query="current holdings positions",
                filters={"action_type": {"$in": ["buy", "hold"]}},
                tenant_id=tenant_id,
                n_results=50
            )
            
            # Extract unique symbols
            symbols = set()
            for result in portfolio_results:
                if result.get("metadata", {}).get("ticker"):
                    symbols.add(result["metadata"]["ticker"])
                    context["holdings"].append({
                        "symbol": result["metadata"]["ticker"],
                        "action": result["metadata"].get("action_type"),
                        "date": result["metadata"].get("date")
                    })
            
            # Get watchlist
            watchlist_results = await self.chroma.semantic_search(
                collection_name="portfolio_memory",
                query="watching tracking monitoring",
                filters={"action_type": {"$eq": "watch"}},
                tenant_id=tenant_id,
                n_results=30
            )
            
            for result in watchlist_results:
                if result.get("metadata", {}).get("ticker"):
                    context["watchlist"].append(result["metadata"]["ticker"])
            
            # Get recent research
            research_results = await self.chroma.semantic_search(
                collection_name="research_reports",
                query="analysis insights recommendations",
                tenant_id=tenant_id,
                n_results=10
            )
            
            context["recent_research"] = [
                {
                    "content": r.get("content", "")[:200],
                    "date": r.get("metadata", {}).get("date"),
                    "source": r.get("metadata", {}).get("source_type")
                }
                for r in research_results
            ]
            
            # Analyze sector allocation
            sector_counts = {}
            for holding in context["holdings"]:
                # Would need to look up sector from company_profiles
                sector = await self._get_company_sector(holding["symbol"])
                sector_counts[sector] = sector_counts.get(sector, 0) + 1
            
            context["sector_allocation"] = sector_counts
            
            # Identify investment themes from conversations
            conversation_results = await self.chroma.semantic_search(
                collection_name="user_conversations",
                query="interested in focusing on looking for",
                tenant_id=tenant_id,
                n_results=20
            )
            
            # Extract themes (simplified - would use NLP in production)
            themes = set()
            theme_keywords = ["AI", "crypto", "biotech", "fintech", "climate", "SaaS", "cybersecurity"]
            for conv in conversation_results:
                content = conv.get("content", "").lower()
                for keyword in theme_keywords:
                    if keyword.lower() in content:
                        themes.add(keyword)
            
            context["investment_themes"] = list(themes)
            
            self.portfolio_context = context
            return context
            
        except Exception as e:
            self.logger.error(f"Failed to build portfolio context: {e}")
            return {}
    
    async def _get_company_sector(self, symbol: str) -> str:
        """Get company sector from profiles collection"""
        try:
            results = await self.chroma.semantic_search(
                collection_name="company_profiles",
                query=symbol,
                filters={"ticker": {"$eq": symbol}},
                n_results=1
            )
            
            if results:
                return results[0].get("metadata", {}).get("sector", "Unknown")
            return "Unknown"
            
        except Exception as e:
            self.logger.error(f"Failed to get sector for {symbol}: {e}")
            return "Unknown"
    
    async def generate_proactive_insights(
        self, 
        tenant_id: str = "default"
    ) -> List[InvestmentInsight]:
        """Generate proactive investment insights based on portfolio and market data"""
        try:
            insights = []
            
            # Get portfolio context
            if not self.portfolio_context:
                await self.get_portfolio_context(tenant_id)
            
            # 1. Concentration risk alerts
            if self.portfolio_context.get("sector_allocation"):
                for sector, count in self.portfolio_context["sector_allocation"].items():
                    if count > 5:  # Over-concentrated in sector
                        insights.append(InvestmentInsight(
                            insight_type="risk",
                            title=f"High Concentration in {sector}",
                            description=f"Your portfolio has {count} holdings in {sector}, which may indicate concentration risk.",
                            symbols=[],
                            confidence=0.85,
                            metadata={"sector": sector, "holdings_count": count},
                            timestamp=datetime.now()
                        ))
            
            # 2. Theme-based opportunities
            for theme in self.portfolio_context.get("investment_themes", []):
                # Search for companies matching themes
                theme_results = await self.chroma.semantic_search(
                    collection_name="company_profiles",
                    query=f"{theme} innovative leader emerging",
                    n_results=5
                )
                
                for result in theme_results[:2]:  # Top 2 per theme
                    symbol = result.get("metadata", {}).get("ticker")
                    if symbol and symbol not in [h["symbol"] for h in self.portfolio_context["holdings"]]:
                        insights.append(InvestmentInsight(
                            insight_type="opportunity",
                            title=f"{theme} Opportunity: {symbol}",
                            description=f"Based on your interest in {theme}, {symbol} may be worth researching.",
                            symbols=[symbol],
                            confidence=0.72,
                            metadata={"theme": theme, "source": "theme_matching"},
                            timestamp=datetime.now()
                        ))
            
            # 3. Momentum alerts for watchlist
            for symbol in self.portfolio_context.get("watchlist", []):
                # Check for recent positive news/momentum
                market_results = await self.chroma.semantic_search(
                    collection_name="market_intelligence",
                    query=f"{symbol} momentum breakout surge rally",
                    filters={"ticker": {"$eq": symbol}},
                    n_results=3
                )
                
                if market_results:
                    insights.append(InvestmentInsight(
                        insight_type="alert",
                        title=f"Momentum Alert: {symbol}",
                        description=f"{symbol} from your watchlist is showing positive momentum signals.",
                        symbols=[symbol],
                        confidence=0.68,
                        metadata={"trigger": "momentum", "watchlist": True},
                        timestamp=datetime.now()
                    ))
            
            # 4. Portfolio rebalancing suggestions
            if len(self.portfolio_context["holdings"]) > 10:
                # Check for positions held too long
                old_positions = [
                    h for h in self.portfolio_context["holdings"]
                    if h.get("date") and (datetime.now() - datetime.fromisoformat(h["date"])).days > 365
                ]
                
                if old_positions:
                    insights.append(InvestmentInsight(
                        insight_type="trend",
                        title="Portfolio Review Recommended",
                        description=f"You have {len(old_positions)} positions over 1 year old. Consider reviewing for rebalancing.",
                        symbols=[p["symbol"] for p in old_positions[:3]],
                        confidence=0.75,
                        metadata={"action": "rebalance", "old_positions": len(old_positions)},
                        timestamp=datetime.now()
                    ))
            
            return insights
            
        except Exception as e:
            self.logger.error(f"Failed to generate proactive insights: {e}")
            return []
    
    async def prepare_meeting(
        self,
        company_name: str,
        symbol: str,
        meeting_type: str = "pitch",  # pitch, diligence, update
        tenant_id: str = "default"
    ) -> MeetingPrep:
        """Prepare comprehensive meeting package with context-aware insights"""
        try:
            prep = MeetingPrep(
                company=company_name,
                symbol=symbol,
                talking_points=[],
                recent_news=[],
                financials_summary={},
                competitive_landscape={},
                questions_to_ask=[],
                investment_thesis=""
            )
            
            # 1. Get company profile and fundamentals
            company_results = await self.chroma.semantic_search(
                collection_name="company_profiles",
                query=f"{company_name} {symbol} fundamentals metrics revenue growth",
                filters={"ticker": {"$eq": symbol}},
                n_results=5
            )
            
            if company_results:
                # Extract key metrics
                for result in company_results:
                    metadata = result.get("metadata", {})
                    prep.financials_summary.update({
                        "sector": metadata.get("sector"),
                        "stage": metadata.get("stage"),
                        "market_cap": metadata.get("market_cap")
                    })
            
            # 2. Get recent news and sentiment
            news_results = await self.chroma.semantic_search(
                collection_name="market_intelligence",
                query=f"{company_name} {symbol} news announcement update",
                filters={"ticker": {"$eq": symbol}},
                n_results=5
            )
            
            prep.recent_news = [
                {
                    "headline": r.get("content", "")[:100],
                    "date": r.get("metadata", {}).get("date"),
                    "sentiment": r.get("metadata", {}).get("sentiment", "neutral")
                }
                for r in news_results
            ]
            
            # 3. Prior research and interactions
            prior_research = await self.chroma.semantic_search(
                collection_name="research_reports",
                query=f"{company_name} {symbol}",
                tenant_id=tenant_id,
                n_results=3
            )
            
            if prior_research:
                prep.talking_points.append(f"Previous analysis from {prior_research[0].get('metadata', {}).get('date', 'earlier')}")
            
            # 4. Competitive analysis
            if prep.financials_summary.get("sector"):
                competitor_results = await self.chroma.semantic_search(
                    collection_name="company_profiles",
                    query=f"{prep.financials_summary['sector']} competitors",
                    n_results=5
                )
                
                competitors = []
                for comp in competitor_results:
                    comp_symbol = comp.get("metadata", {}).get("ticker")
                    if comp_symbol and comp_symbol != symbol:
                        competitors.append({
                            "symbol": comp_symbol,
                            "market_cap": comp.get("metadata", {}).get("market_cap")
                        })
                
                prep.competitive_landscape = {
                    "main_competitors": competitors[:3],
                    "sector": prep.financials_summary.get("sector")
                }
            
            # 5. Generate context-aware questions based on meeting type
            if meeting_type == "pitch":
                prep.questions_to_ask = [
                    "What's your primary customer acquisition channel and CAC?",
                    "How do you differentiate from [competitor]?",
                    "What are your key metrics for the next 12 months?",
                    "What's your current burn rate and runway?",
                    "How do you plan to use the funds being raised?"
                ]
            elif meeting_type == "diligence":
                prep.questions_to_ask = [
                    "Can you walk through your unit economics?",
                    "What are the main risks to your growth projections?",
                    "How sticky is your customer base? What's your churn?",
                    "What's your strategy for market expansion?",
                    "How do you think about competitive moats?"
                ]
            else:  # update meeting
                prep.questions_to_ask = [
                    "How are you tracking against your OKRs this quarter?",
                    "What are the key challenges you're facing?",
                    "Any changes to your burn rate or runway?",
                    "How is the team scaling going?",
                    "Any strategic pivots or new initiatives?"
                ]
            
            # 6. Investment thesis based on context
            themes = self.portfolio_context.get("investment_themes", [])
            matching_themes = [t for t in themes if t.lower() in company_name.lower() or t.lower() in str(prep.financials_summary.get("sector", "")).lower()]
            
            if matching_themes:
                prep.investment_thesis = f"Aligns with portfolio themes: {', '.join(matching_themes)}. "
            
            prep.investment_thesis += f"Company operates in {prep.financials_summary.get('sector', 'target')} sector"
            
            if prep.recent_news:
                positive_news = [n for n in prep.recent_news if n.get("sentiment") == "positive"]
                if positive_news:
                    prep.investment_thesis += f" with {len(positive_news)} positive developments recently."
            
            # 7. Key talking points
            prep.talking_points = [
                f"Company is in {prep.financials_summary.get('stage', 'growth')} stage",
                f"Sector: {prep.financials_summary.get('sector', 'Technology')}",
                f"Recent momentum: {len(prep.recent_news)} news items tracked"
            ]
            
            if prior_research:
                prep.talking_points.append(f"We have {len(prior_research)} prior research reports on file")
            
            return prep
            
        except Exception as e:
            self.logger.error(f"Failed to prepare meeting for {company_name}: {e}")
            return MeetingPrep(
                company=company_name,
                symbol=symbol,
                talking_points=["Error preparing meeting materials"],
                recent_news=[],
                financials_summary={},
                competitive_landscape={},
                questions_to_ask=["What is your current status?"],
                investment_thesis="Unable to generate thesis - manual review required"
            )
    
    async def detect_patterns(
        self,
        tenant_id: str = "default",
        lookback_days: int = 30
    ) -> List[Dict[str, Any]]:
        """Detect patterns in portfolio behavior and market movements"""
        try:
            patterns = []
            
            # 1. Trading pattern detection
            lookback_date = (datetime.now() - timedelta(days=lookback_days)).isoformat()
            
            portfolio_actions = await self.chroma.semantic_search(
                collection_name="portfolio_memory",
                query="buy sell trade add remove",
                tenant_id=tenant_id,
                n_results=50
            )
            
            # Analyze action frequency
            action_counts = {}
            for action in portfolio_actions:
                action_type = action.get("metadata", {}).get("action_type")
                if action_type:
                    action_counts[action_type] = action_counts.get(action_type, 0) + 1
            
            if action_counts.get("buy", 0) > action_counts.get("sell", 0) * 2:
                patterns.append({
                    "pattern": "bullish_bias",
                    "description": "Strong buying activity relative to selling",
                    "confidence": 0.75,
                    "data": action_counts
                })
            
            # 2. Sector rotation detection
            recent_sectors = {}
            for action in portfolio_actions[-10:]:  # Last 10 actions
                symbol = action.get("metadata", {}).get("ticker")
                if symbol:
                    sector = await self._get_company_sector(symbol)
                    recent_sectors[sector] = recent_sectors.get(sector, 0) + 1
            
            if recent_sectors:
                top_sector = max(recent_sectors, key=recent_sectors.get)
                if recent_sectors[top_sector] >= 3:
                    patterns.append({
                        "pattern": "sector_focus",
                        "description": f"Recent concentration in {top_sector} sector",
                        "confidence": 0.70,
                        "data": recent_sectors
                    })
            
            # 3. Research to action correlation
            research_count = len(await self.chroma.semantic_search(
                collection_name="research_reports",
                query="analysis research",
                tenant_id=tenant_id,
                n_results=20
            ))
            
            if research_count > 0 and len(portfolio_actions) > 0:
                research_action_ratio = research_count / len(portfolio_actions)
                if research_action_ratio > 2:
                    patterns.append({
                        "pattern": "research_driven",
                        "description": "High research activity relative to trading",
                        "confidence": 0.65,
                        "data": {"research_items": research_count, "actions": len(portfolio_actions)}
                    })
            
            return patterns
            
        except Exception as e:
            self.logger.error(f"Failed to detect patterns: {e}")
            return []
    
    async def generate_portfolio_summary(
        self,
        tenant_id: str = "default"
    ) -> Dict[str, Any]:
        """Generate comprehensive portfolio summary with insights"""
        try:
            # Get portfolio context
            context = await self.get_portfolio_context(tenant_id)
            
            # Get recent patterns
            patterns = await self.detect_patterns(tenant_id)
            
            # Get proactive insights
            insights = await self.generate_proactive_insights(tenant_id)
            
            summary = {
                "overview": {
                    "total_holdings": len(context.get("holdings", [])),
                    "watchlist_size": len(context.get("watchlist", [])),
                    "investment_themes": context.get("investment_themes", []),
                    "sector_allocation": context.get("sector_allocation", {})
                },
                "recent_activity": {
                    "patterns": patterns,
                    "last_research": context.get("recent_research", [])[:3]
                },
                "insights": [
                    {
                        "type": i.insight_type,
                        "title": i.title,
                        "description": i.description,
                        "symbols": i.symbols
                    }
                    for i in insights[:5]  # Top 5 insights
                ],
                "recommendations": []
            }
            
            # Generate recommendations based on patterns and insights
            if any(p["pattern"] == "research_driven" for p in patterns):
                summary["recommendations"].append({
                    "action": "Continue research-driven approach",
                    "rationale": "Your pattern shows thorough research before investment decisions"
                })
            
            if context.get("sector_allocation"):
                top_sector = max(context["sector_allocation"], key=context["sector_allocation"].get)
                if context["sector_allocation"][top_sector] > 5:
                    summary["recommendations"].append({
                        "action": f"Consider diversifying from {top_sector}",
                        "rationale": f"High concentration with {context['sector_allocation'][top_sector]} holdings"
                    })
            
            return summary
            
        except Exception as e:
            self.logger.error(f"Failed to generate portfolio summary: {e}")
            return {
                "overview": {},
                "recent_activity": {},
                "insights": [],
                "recommendations": []
            }


# Factory function to create service
def create_investment_intelligence_service(chroma_service: UnifiedChromaService) -> InvestmentIntelligenceService:
    """Create and initialize investment intelligence service"""
    return InvestmentIntelligenceService(chroma_service)