"""
Workflow Management API
Handles workflow execution, data persistence, and retrieval
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from datetime import datetime

from ..services.workflow_service import workflow_service
from ..models.workflows import (
    WorkflowExecution, WorkflowExecutionResponse, 
    InvestmentMemo, InvestmentMemoResponse,
    WorkflowSummary
)

router = APIRouter()


# Request Models
class CreateWorkflowRequest(BaseModel):
    workflow_type: str
    company_name: str
    selected_tokens: Optional[List[str]] = []
    investment_amount: Optional[float] = None
    valuation: Optional[float] = None


class UpdateProgressRequest(BaseModel):
    current_step: str
    progress_percentage: int
    status: Optional[str] = "running"


class SaveMarketDataRequest(BaseModel):
    market_data: Dict[str, Dict[str, Any]]


class SaveResearchRequest(BaseModel):
    company_name: str
    research_data: Dict[str, str]
    processing_time: Optional[float] = None


class SaveMemoRequest(BaseModel):
    company_name: str
    memo_content: str
    investment_amount: Optional[float] = None
    valuation: Optional[float] = None
    recommendation: Optional[str] = "TBD"
    status: Optional[str] = "draft"


# API Endpoints
@router.get("/test")
async def workflow_test():
    """Test endpoint for workflow API"""
    return {
        "status": "success",
        "message": "Workflow management system ready",
        "timestamp": datetime.now().isoformat(),
        "features": [
            "workflow_execution_tracking",
            "market_data_persistence",
            "research_analysis_storage",
            "investment_memo_generation"
        ]
    }


@router.post("/workflows", response_model=WorkflowExecutionResponse)
async def create_workflow(request: CreateWorkflowRequest):
    """Create a new workflow execution"""
    try:
        workflow = workflow_service.create_workflow(
            workflow_type=request.workflow_type,
            company_name=request.company_name,
            selected_tokens=request.selected_tokens,
            investment_amount=request.investment_amount,
            valuation=request.valuation
        )
        
        return WorkflowExecutionResponse(
            id=workflow.id,
            workflow_id=workflow.workflow_id,
            workflow_type=workflow.workflow_type,
            company_name=workflow.company_name,
            status=workflow.status,
            progress_percentage=workflow.progress_percentage,
            current_step=workflow.current_step,
            created_at=workflow.created_at,
            completed_at=workflow.completed_at
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create workflow: {str(e)}")


@router.put("/workflows/{workflow_id}/progress")
async def update_workflow_progress(workflow_id: str, request: UpdateProgressRequest):
    """Update workflow progress"""
    try:
        success = workflow_service.update_workflow_progress(
            workflow_id=workflow_id,
            current_step=request.current_step,
            progress_percentage=request.progress_percentage,
            status=request.status
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Workflow not found")
            
        return {"status": "success", "message": "Progress updated"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update progress: {str(e)}")


@router.put("/workflows/{workflow_id}/complete")
async def complete_workflow(workflow_id: str, success: bool = Query(True)):
    """Mark workflow as completed"""
    try:
        result = workflow_service.complete_workflow(workflow_id, success)
        
        if not result:
            raise HTTPException(status_code=404, detail="Workflow not found")
            
        return {"status": "success", "message": "Workflow completed"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete workflow: {str(e)}")


@router.post("/workflows/{workflow_id}/market-data")
async def save_market_data(workflow_id: str, request: SaveMarketDataRequest):
    """Save market data for a workflow"""
    try:
        snapshots = workflow_service.save_market_data(
            workflow_id=workflow_id,
            market_data=request.market_data
        )
        
        return {
            "status": "success",
            "message": "Market data saved",
            "snapshots_created": len(snapshots)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save market data: {str(e)}")


@router.post("/workflows/{workflow_id}/research")
async def save_research_analysis(workflow_id: str, request: SaveResearchRequest):
    """Save AI research analysis for a workflow"""
    try:
        analysis = workflow_service.save_research_analysis(
            workflow_id=workflow_id,
            company_name=request.company_name,
            research_data=request.research_data,
            processing_time=request.processing_time
        )
        
        return {
            "status": "success",
            "message": "Research analysis saved",
            "analysis_id": analysis.id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save research: {str(e)}")


@router.post("/workflows/{workflow_id}/memo")
async def save_investment_memo(workflow_id: str, request: SaveMemoRequest):
    """Save generated investment memo for a workflow"""
    try:
        memo = workflow_service.save_investment_memo(
            workflow_id=workflow_id,
            company_name=request.company_name,
            memo_content=request.memo_content,
            investment_amount=request.investment_amount,
            valuation=request.valuation,
            recommendation=request.recommendation,
            status=request.status
        )
        
        return {
            "status": "success",
            "message": "Investment memo saved",
            "memo_id": memo.id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save memo: {str(e)}")


@router.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    """Get workflow details with all related data"""
    try:
        workflow = workflow_service.get_workflow(workflow_id)
        
        if not workflow:
            raise HTTPException(status_code=404, detail="Workflow not found")
            
        return {
            "workflow": {
                "id": workflow.id,
                "workflow_id": workflow.workflow_id,
                "workflow_type": workflow.workflow_type,
                "company_name": workflow.company_name,
                "status": workflow.status,
                "progress_percentage": workflow.progress_percentage,
                "current_step": workflow.current_step,
                "created_at": workflow.created_at,
                "completed_at": workflow.completed_at,
                "investment_amount": workflow.investment_amount,
                "valuation": workflow.valuation
            },
            "market_data": [
                {
                    "symbol": data.symbol,
                    "current_price": data.current_price,
                    "change_percent": data.change_percent,
                    "volume_24h": data.volume_24h,
                    "collected_at": data.collected_at
                } for data in workflow.market_data
            ],
            "research_analysis": [
                {
                    "id": analysis.id,
                    "summary": analysis.summary,
                    "technical_analysis": analysis.technical_analysis,
                    "team_assessment": analysis.team_assessment,
                    "competitive_position": analysis.competitive_position,
                    "generated_at": analysis.generated_at
                } for analysis in workflow.research_analysis
            ],
            "investment_memos": [
                {
                    "id": memo.id,
                    "memo_title": memo.memo_title,
                    "recommendation": memo.recommendation,
                    "executive_summary": memo.executive_summary,
                    "status": memo.status,
                    "generated_at": memo.generated_at
                } for memo in workflow.investment_memos
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get workflow: {str(e)}")


@router.get("/workflows")
async def get_workflows(
    company_name: Optional[str] = Query(None),
    workflow_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100)
):
    """Get workflows with optional filtering"""
    try:
        workflows = workflow_service.get_workflows(
            company_name=company_name,
            workflow_type=workflow_type,
            status=status,
            limit=limit
        )
        
        return {
            "workflows": [
                {
                    "id": workflow.id,
                    "workflow_id": workflow.workflow_id,
                    "workflow_type": workflow.workflow_type,
                    "company_name": workflow.company_name,
                    "status": workflow.status,
                    "progress_percentage": workflow.progress_percentage,
                    "created_at": workflow.created_at,
                    "completed_at": workflow.completed_at
                } for workflow in workflows
            ],
            "count": len(workflows)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get workflows: {str(e)}")


@router.get("/memos", response_model=List[InvestmentMemoResponse])
async def get_investment_memos(
    company_name: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=50)
):
    """Get investment memos with optional filtering"""
    try:
        memos = workflow_service.get_investment_memos(
            company_name=company_name,
            status=status,
            limit=limit
        )
        
        return [
            InvestmentMemoResponse(
                id=memo.id,
                workflow_id=memo.workflow_id,
                company_name=memo.company_name,
                memo_title=memo.memo_title,
                recommendation=memo.recommendation,
                investment_amount=memo.investment_amount,
                valuation=memo.valuation,
                overall_score=memo.overall_score,
                status=memo.status,
                generated_at=memo.generated_at
            ) for memo in memos
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get memos: {str(e)}")


@router.get("/summary", response_model=WorkflowSummary)
async def get_workflow_summary():
    """Get workflow summary statistics for dashboard"""
    try:
        summary = workflow_service.get_workflow_summary()
        return summary
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")


@router.get("/search")
async def search_workflows(
    query: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50)
):
    """Search workflows by company name or type"""
    try:
        workflows = workflow_service.search_workflows(query, limit)
        
        return {
            "query": query,
            "workflows": [
                {
                    "id": workflow.id,
                    "workflow_id": workflow.workflow_id,
                    "workflow_type": workflow.workflow_type,
                    "company_name": workflow.company_name,
                    "status": workflow.status,
                    "created_at": workflow.created_at
                } for workflow in workflows
            ],
            "count": len(workflows)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete workflow and all related data"""
    try:
        success = workflow_service.delete_workflow(workflow_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Workflow not found")
            
        return {"status": "success", "message": "Workflow deleted"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete workflow: {str(e)}")


@router.get("/memos/{memo_id}/download")
async def download_memo(memo_id: int):
    """Download investment memo as text file"""
    try:
        from sqlmodel import Session
        from ..database import engine
        
        with Session(engine) as session:
            memo = session.get(InvestmentMemo, memo_id)
            
            if not memo:
                raise HTTPException(status_code=404, detail="Memo not found")
                
            return {
                "filename": f"{memo.company_name}_Investment_Memo_{memo.generated_at.strftime('%Y%m%d')}.txt",
                "content": memo.full_content,
                "content_type": "text/plain"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download memo: {str(e)}")