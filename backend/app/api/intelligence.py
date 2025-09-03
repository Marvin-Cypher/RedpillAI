"""
Intelligence API endpoints for RedPill Terminal
Provides proactive AI features with investment context
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, Any, List, Optional
import logging

from ..services.unified_chroma_service import UnifiedChromaService
from ..services.investment_intelligence_service import (
    create_investment_intelligence_service,
    InvestmentIntelligenceService
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/intelligence", tags=["intelligence"])

# Global service instances
_chroma_service = None
_intelligence_service = None


def get_chroma_service():
    """Get or create ChromaDB service singleton"""
    global _chroma_service
    if _chroma_service is None:
        _chroma_service = UnifiedChromaService()
    return _chroma_service


def get_intelligence_service():
    """Get or create Intelligence service singleton"""
    global _intelligence_service
    if _intelligence_service is None:
        chroma_service = get_chroma_service()
        _intelligence_service = create_investment_intelligence_service(chroma_service)
    return _intelligence_service


@router.get("/portfolio/context")
async def get_portfolio_context(
    tenant_id: str = Query(default="default", description="Tenant ID for data isolation"),
    intelligence_service: InvestmentIntelligenceService = Depends(get_intelligence_service)
) -> Dict[str, Any]:
    """Get comprehensive portfolio context and holdings analysis"""
    try:
        context = await intelligence_service.get_portfolio_context(tenant_id)
        return {
            "success": True,
            "data": context,
            "timestamp": intelligence_service.portfolio_context.get("last_updated", "")
        }
    except Exception as e:
        logger.error(f"Failed to get portfolio context: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get portfolio context: {str(e)}")


@router.get("/insights/proactive")
async def get_proactive_insights(
    tenant_id: str = Query(default="default", description="Tenant ID for data isolation"),
    intelligence_service: InvestmentIntelligenceService = Depends(get_intelligence_service)
) -> Dict[str, Any]:
    """Generate proactive investment insights based on portfolio and market data"""
    try:
        insights = await intelligence_service.generate_proactive_insights(tenant_id)
        
        return {
            "success": True,
            "data": {
                "insights": [
                    {
                        "type": insight.insight_type,
                        "title": insight.title,
                        "description": insight.description,
                        "symbols": insight.symbols,
                        "confidence": insight.confidence,
                        "metadata": insight.metadata,
                        "timestamp": insight.timestamp.isoformat()
                    }
                    for insight in insights
                ],
                "count": len(insights),
                "categories": {
                    "opportunities": len([i for i in insights if i.insight_type == "opportunity"]),
                    "risks": len([i for i in insights if i.insight_type == "risk"]),
                    "alerts": len([i for i in insights if i.insight_type == "alert"]),
                    "trends": len([i for i in insights if i.insight_type == "trend"])
                }
            }
        }
    except Exception as e:
        logger.error(f"Failed to generate proactive insights: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")


@router.post("/meeting/prepare")
async def prepare_meeting(
    company_name: str,
    symbol: str,
    meeting_type: str = "pitch",  # pitch, diligence, update
    tenant_id: str = Query(default="default", description="Tenant ID for data isolation"),
    intelligence_service: InvestmentIntelligenceService = Depends(get_intelligence_service)
) -> Dict[str, Any]:
    """Prepare comprehensive meeting package with context-aware insights"""
    try:
        if meeting_type not in ["pitch", "diligence", "update"]:
            raise HTTPException(status_code=400, detail="Meeting type must be 'pitch', 'diligence', or 'update'")
        
        prep = await intelligence_service.prepare_meeting(
            company_name=company_name,
            symbol=symbol,
            meeting_type=meeting_type,
            tenant_id=tenant_id
        )
        
        return {
            "success": True,
            "data": {
                "company": prep.company,
                "symbol": prep.symbol,
                "meeting_type": meeting_type,
                "talking_points": prep.talking_points,
                "recent_news": prep.recent_news,
                "financials_summary": prep.financials_summary,
                "competitive_landscape": prep.competitive_landscape,
                "questions_to_ask": prep.questions_to_ask,
                "investment_thesis": prep.investment_thesis
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to prepare meeting for {company_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to prepare meeting: {str(e)}")


@router.get("/patterns/detect")
async def detect_patterns(
    lookback_days: int = Query(default=30, description="Number of days to look back for patterns"),
    tenant_id: str = Query(default="default", description="Tenant ID for data isolation"),
    intelligence_service: InvestmentIntelligenceService = Depends(get_intelligence_service)
) -> Dict[str, Any]:
    """Detect patterns in portfolio behavior and market movements"""
    try:
        if lookback_days < 1 or lookback_days > 365:
            raise HTTPException(status_code=400, detail="Lookback days must be between 1 and 365")
        
        patterns = await intelligence_service.detect_patterns(tenant_id, lookback_days)
        
        return {
            "success": True,
            "data": {
                "patterns": patterns,
                "lookback_days": lookback_days,
                "analysis_date": intelligence_service._get_current_timestamp()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to detect patterns: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to detect patterns: {str(e)}")


@router.get("/portfolio/summary")
async def get_portfolio_summary(
    tenant_id: str = Query(default="default", description="Tenant ID for data isolation"),
    intelligence_service: InvestmentIntelligenceService = Depends(get_intelligence_service)
) -> Dict[str, Any]:
    """Generate comprehensive portfolio summary with insights"""
    try:
        summary = await intelligence_service.generate_portfolio_summary(tenant_id)
        
        return {
            "success": True,
            "data": summary,
            "generated_at": intelligence_service._get_current_timestamp()
        }
    except Exception as e:
        logger.error(f"Failed to generate portfolio summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")


@router.get("/search/semantic")
async def semantic_search(
    collection: str,
    query: str,
    n_results: int = Query(default=10, description="Number of results to return"),
    tenant_id: str = Query(default="default", description="Tenant ID for data isolation"),
    chroma_service: UnifiedChromaService = Depends(get_chroma_service)
) -> Dict[str, Any]:
    """Perform semantic search across investment intelligence collections"""
    try:
        if n_results < 1 or n_results > 50:
            raise HTTPException(status_code=400, detail="n_results must be between 1 and 50")
        
        # Validate collection name
        valid_collections = [
            "user_conversations", "portfolio_memory", "company_profiles",
            "research_reports", "founder_profiles", "meeting_memory",
            "dealroom_data", "market_intelligence", "fund_performance",
            "imported_data", "action_items"
        ]
        
        if collection not in valid_collections:
            raise HTTPException(
                status_code=400, 
                detail=f"Collection must be one of: {', '.join(valid_collections)}"
            )
        
        results = await chroma_service.semantic_search(
            collection_name=collection,
            query=query,
            tenant_id=tenant_id,
            n_results=n_results
        )
        
        return {
            "success": True,
            "data": {
                "results": results,
                "collection": collection,
                "query": query,
                "count": len(results)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to perform semantic search: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/health")
async def health_check(
    chroma_service: UnifiedChromaService = Depends(get_chroma_service)
) -> Dict[str, Any]:
    """Health check for intelligence services"""
    try:
        # Check if ChromaDB is accessible
        collections_info = {}
        for name, collection in chroma_service.collections.items():
            try:
                count = collection.count()
                collections_info[name] = {"document_count": count, "status": "healthy"}
            except Exception as e:
                collections_info[name] = {"status": "error", "error": str(e)}
        
        return {
            "success": True,
            "data": {
                "status": "healthy",
                "collections": collections_info,
                "services": {
                    "chroma_db": "connected",
                    "investment_intelligence": "initialized"
                }
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


# Helper method to add to InvestmentIntelligenceService
def _add_helper_method():
    """Add helper method to InvestmentIntelligenceService"""
    from datetime import datetime
    
    def _get_current_timestamp(self):
        return datetime.now().isoformat()
    
    InvestmentIntelligenceService._get_current_timestamp = _get_current_timestamp

# Execute the helper addition
_add_helper_method()