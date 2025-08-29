"""
API endpoints for Universal Creation Management
Provides Investment CRM-like access to all user OpenBB creations
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel

from ..services.creation_recorder import creation_recorder, CreationType, CreationCategory, Creation


router = APIRouter()


class CreationSummary(BaseModel):
    """Summary view of a creation for CRM interface"""
    creation_id: str
    title: str
    description: str
    creation_type: str
    category: str
    symbols: List[str]
    created_at: str
    chart_url: Optional[str] = None
    web_url: Optional[str] = None
    priority: str
    tags: List[str]


class CreationDetail(BaseModel):
    """Detailed view of a creation with full data"""
    creation_id: str
    title: str
    description: str
    creation_type: str
    category: str
    symbols: List[str]
    sectors: List[str]
    created_at: str
    openbb_tool: str
    openbb_module: str
    parameters: dict
    chart_url: Optional[str] = None
    web_url: Optional[str] = None
    priority: str
    tags: List[str]
    summary: Optional[str] = None
    key_insights: List[str]
    data: dict


@router.get("/creations/{user_id}", response_model=List[CreationSummary])
async def get_user_creations(
    user_id: str,
    creation_type: Optional[str] = Query(None, description="Filter by creation type"),
    category: Optional[str] = Query(None, description="Filter by category"),
    symbols: Optional[str] = Query(None, description="Comma-separated symbols to filter by"),
    limit: int = Query(50, description="Maximum number of results")
):
    """
    Get all creations for a user with optional filters
    Provides Investment CRM-like view of all OpenBB interactions
    """
    
    try:
        # Parse filters
        creation_type_filter = CreationType(creation_type) if creation_type else None
        category_filter = CreationCategory(category) if category else None
        symbols_filter = symbols.split(",") if symbols else None
        
        # Retrieve creations
        creations = await creation_recorder.get_user_creations(
            user_id=user_id,
            creation_type=creation_type_filter,
            category=category_filter,
            symbols=symbols_filter,
            limit=limit
        )
        
        # Convert to summary format
        summaries = []
        for creation in creations:
            summary = CreationSummary(
                creation_id=creation.metadata.creation_id,
                title=creation.metadata.title,
                description=creation.metadata.description,
                creation_type=creation.metadata.creation_type.value,
                category=creation.metadata.category.value,
                symbols=creation.metadata.symbols,
                created_at=creation.metadata.created_at,
                chart_url=creation.metadata.chart_url,
                web_url=creation.metadata.web_url,
                priority=creation.metadata.priority,
                tags=creation.metadata.tags
            )
            summaries.append(summary)
        
        return summaries
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve creations: {str(e)}")


@router.get("/creations/{user_id}/{creation_id}", response_model=CreationDetail)
async def get_creation_detail(user_id: str, creation_id: str):
    """
    Get detailed view of a specific creation
    Includes full data and AI-generated insights
    """
    
    try:
        # Get all user creations and find the specific one
        creations = await creation_recorder.get_user_creations(user_id=user_id, limit=1000)
        
        target_creation = None
        for creation in creations:
            if creation.metadata.creation_id == creation_id:
                target_creation = creation
                break
        
        if not target_creation:
            raise HTTPException(status_code=404, detail="Creation not found")
        
        # Convert to detailed format
        detail = CreationDetail(
            creation_id=target_creation.metadata.creation_id,
            title=target_creation.metadata.title,
            description=target_creation.metadata.description,
            creation_type=target_creation.metadata.creation_type.value,
            category=target_creation.metadata.category.value,
            symbols=target_creation.metadata.symbols,
            sectors=target_creation.metadata.sectors,
            created_at=target_creation.metadata.created_at,
            openbb_tool=target_creation.metadata.openbb_tool,
            openbb_module=target_creation.metadata.openbb_module,
            parameters=target_creation.metadata.parameters,
            chart_url=target_creation.metadata.chart_url,
            web_url=target_creation.metadata.web_url,
            priority=target_creation.metadata.priority,
            tags=target_creation.metadata.tags,
            summary=target_creation.summary,
            key_insights=target_creation.key_insights,
            data=target_creation.data
        )
        
        return detail
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve creation detail: {str(e)}")


@router.get("/creations/{user_id}/search")
async def search_creations(
    user_id: str,
    query: str = Query(..., description="Search query"),
    limit: int = Query(20, description="Maximum number of results")
):
    """
    Search user's creations using semantic search
    Enables finding relevant analysis, charts, and reports
    """
    
    try:
        creations = await creation_recorder.search_creations(
            user_id=user_id,
            query=query,
            n_results=limit
        )
        
        # Convert to summary format
        summaries = []
        for creation in creations:
            summary = CreationSummary(
                creation_id=creation.metadata.creation_id,
                title=creation.metadata.title,
                description=creation.metadata.description,
                creation_type=creation.metadata.creation_type.value,
                category=creation.metadata.category.value,
                symbols=creation.metadata.symbols,
                created_at=creation.metadata.created_at,
                chart_url=creation.metadata.chart_url,
                web_url=creation.metadata.web_url,
                priority=creation.metadata.priority,
                tags=creation.metadata.tags
            )
            summaries.append(summary)
        
        return summaries
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("/creations/{user_id}/categories")
async def get_creation_categories(user_id: str):
    """
    Get summary of user's creations organized by category
    Provides Investment CRM dashboard overview
    """
    
    try:
        # Get all user creations
        creations = await creation_recorder.get_user_creations(user_id=user_id, limit=1000)
        
        # Organize by category
        categories = {}
        for creation in creations:
            category = creation.metadata.category.value
            if category not in categories:
                categories[category] = {
                    "name": category,
                    "count": 0,
                    "recent_items": [],
                    "creation_types": set()
                }
            
            categories[category]["count"] += 1
            categories[category]["creation_types"].add(creation.metadata.creation_type.value)
            
            # Add to recent items (keep only most recent 5)
            if len(categories[category]["recent_items"]) < 5:
                categories[category]["recent_items"].append({
                    "creation_id": creation.metadata.creation_id,
                    "title": creation.metadata.title,
                    "created_at": creation.metadata.created_at,
                    "symbols": creation.metadata.symbols
                })
        
        # Convert sets to lists for JSON serialization
        for category in categories.values():
            category["creation_types"] = list(category["creation_types"])
        
        return {
            "categories": list(categories.values()),
            "total_creations": len(creations)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")


@router.get("/creations/{user_id}/portfolio-context")
async def get_portfolio_context_creations(user_id: str, symbols: str = Query(..., description="Comma-separated symbols")):
    """
    Get all creations related to specific portfolio symbols
    Enables portfolio-centric view of all analysis and research
    """
    
    try:
        symbol_list = symbols.split(",")
        
        creations = await creation_recorder.get_user_creations(
            user_id=user_id,
            symbols=symbol_list,
            limit=200
        )
        
        # Group by symbol and creation type
        portfolio_context = {}
        for symbol in symbol_list:
            portfolio_context[symbol] = {
                "symbol": symbol,
                "total_creations": 0,
                "by_type": {},
                "recent_analysis": []
            }
        
        for creation in creations:
            for symbol in creation.metadata.symbols:
                if symbol in portfolio_context:
                    portfolio_context[symbol]["total_creations"] += 1
                    
                    creation_type = creation.metadata.creation_type.value
                    if creation_type not in portfolio_context[symbol]["by_type"]:
                        portfolio_context[symbol]["by_type"][creation_type] = 0
                    portfolio_context[symbol]["by_type"][creation_type] += 1
                    
                    # Add to recent analysis
                    if len(portfolio_context[symbol]["recent_analysis"]) < 10:
                        portfolio_context[symbol]["recent_analysis"].append({
                            "creation_id": creation.metadata.creation_id,
                            "title": creation.metadata.title,
                            "type": creation_type,
                            "created_at": creation.metadata.created_at,
                            "chart_url": creation.metadata.chart_url
                        })
        
        return {
            "portfolio_context": list(portfolio_context.values()),
            "symbols_analyzed": symbol_list,
            "total_creations": len(creations)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get portfolio context: {str(e)}")


@router.get("/creation-types")
async def get_available_creation_types():
    """Get all available creation types and categories"""
    return {
        "creation_types": [ct.value for ct in CreationType],
        "categories": [cc.value for cc in CreationCategory]
    }