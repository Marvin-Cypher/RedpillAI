"""
Portfolio Management API Routes
Integrates with OpenProject for VC portfolio tracking
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from ..services.openproject_service import openproject_service, ProjectStatus, DealStage, PortfolioProject
from ..core.auth import get_current_user

router = APIRouter()

# Simple test endpoint
@router.get("/test")
async def portfolio_test():
    """Simple test endpoint for portfolio system"""
    return {
        "status": "success",
        "message": "Portfolio management system ready",
        "timestamp": datetime.now().isoformat(),
        "backend": "OpenProject integration",
        "available_features": [
            "project_management",
            "document_collaboration",
            "deal_pipeline",
            "investment_tracking"
        ]
    }

# Pydantic Models
class CreateProjectRequest(BaseModel):
    company_name: str
    description: Optional[str] = ""
    investment_amount: Optional[float] = None
    valuation: Optional[float] = None
    ownership_percentage: Optional[float] = None
    lead_partner: Optional[str] = None
    sector: Optional[str] = None
    deal_stage: Optional[str] = "sourcing"

class UpdateProjectRequest(BaseModel):
    status: Optional[str] = None
    deal_stage: Optional[str] = None
    investment_amount: Optional[float] = None
    valuation: Optional[float] = None
    ownership_percentage: Optional[float] = None
    lead_partner: Optional[str] = None
    sector: Optional[str] = None

class CreateDocumentRequest(BaseModel):
    title: str
    content: str
    document_type: Optional[str] = "notes"

class AddMemoRequest(BaseModel):
    content: str
    memo_type: Optional[str] = "investment_memo"

class ProjectResponse(BaseModel):
    id: str
    name: str
    company_name: str
    status: str
    deal_stage: str
    description: str
    created_at: datetime
    updated_at: datetime
    investment_amount: Optional[float]
    valuation: Optional[float]
    ownership_percentage: Optional[float]
    lead_partner: Optional[str]
    sector: Optional[str]
    custom_fields: Dict[str, Any]

# Health Check
@router.get("/health")
async def portfolio_health():
    """Check portfolio management system health"""
    is_healthy = await openproject_service.health_check()
    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "service": "OpenProject",
        "timestamp": datetime.now().isoformat()
    }

# Portfolio Projects
@router.post("/projects", response_model=ProjectResponse)
async def create_portfolio_project(
    request: CreateProjectRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new portfolio project"""
    try:
        project_data = {
            "company_name": request.company_name,
            "description": request.description,
            "investment_amount": request.investment_amount,
            "valuation": request.valuation,
            "ownership_percentage": request.ownership_percentage,
            "lead_partner": request.lead_partner,
            "sector": request.sector,
            "deal_stage": request.deal_stage
        }
        
        project = await openproject_service.create_portfolio_project(project_data)
        
        if not project:
            raise HTTPException(status_code=500, detail="Failed to create project")
        
        return ProjectResponse(
            id=project.id,
            name=project.name,
            company_name=project.company_name,
            status=project.status.value,
            deal_stage=project.deal_stage.value,
            description=project.description,
            created_at=project.created_at,
            updated_at=project.updated_at,
            investment_amount=project.investment_amount,
            valuation=project.valuation,
            ownership_percentage=project.ownership_percentage,
            lead_partner=project.lead_partner,
            sector=project.sector,
            custom_fields=project.custom_fields
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")

@router.get("/projects", response_model=List[ProjectResponse])
async def get_portfolio_projects(
    status: Optional[str] = Query(None, description="Filter by project status"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    current_user: dict = Depends(get_current_user)
):
    """Get all portfolio projects with optional filtering"""
    try:
        filters = {}
        if status:
            filters['status'] = status
        if sector:
            filters['sector'] = sector
        
        projects = await openproject_service.get_portfolio_projects(filters)
        
        return [
            ProjectResponse(
                id=project.id,
                name=project.name,
                company_name=project.company_name,
                status=project.status.value,
                deal_stage=project.deal_stage.value,
                description=project.description,
                created_at=project.created_at,
                updated_at=project.updated_at,
                investment_amount=project.investment_amount,
                valuation=project.valuation,
                ownership_percentage=project.ownership_percentage,
                lead_partner=project.lead_partner,
                sector=project.sector,
                custom_fields=project.custom_fields
            )
            for project in projects
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching projects: {str(e)}")

@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project_details(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed information about a specific project"""
    try:
        projects = await openproject_service.get_portfolio_projects()
        project = next((p for p in projects if p.id == project_id), None)
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return ProjectResponse(
            id=project.id,
            name=project.name,
            company_name=project.company_name,
            status=project.status.value,
            deal_stage=project.deal_stage.value,
            description=project.description,
            created_at=project.created_at,
            updated_at=project.updated_at,
            investment_amount=project.investment_amount,
            valuation=project.valuation,
            ownership_percentage=project.ownership_percentage,
            lead_partner=project.lead_partner,
            sector=project.sector,
            custom_fields=project.custom_fields
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching project: {str(e)}")

@router.patch("/projects/{project_id}")
async def update_project(
    project_id: str,
    request: UpdateProjectRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update project information"""
    try:
        success = True
        
        # Update status and deal stage if provided
        if request.status or request.deal_stage:
            status = ProjectStatus(request.status) if request.status else None
            deal_stage = DealStage(request.deal_stage) if request.deal_stage else None
            success = await openproject_service.update_project_status(project_id, status, deal_stage)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update project")
        
        return {"message": "Project updated successfully", "project_id": project_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating project: {str(e)}")

# Document Management
@router.post("/projects/{project_id}/documents")
async def create_project_document(
    project_id: str,
    request: CreateDocumentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new document for a project"""
    try:
        doc_data = {
            "title": request.title,
            "content": request.content,
            "document_type": request.document_type,
            "created_by": current_user.get("email", "unknown")
        }
        
        document = await openproject_service.create_project_document(project_id, doc_data)
        
        if not document:
            raise HTTPException(status_code=500, detail="Failed to create document")
        
        return {
            "id": document.id,
            "project_id": document.project_id,
            "title": document.title,
            "document_type": document.document_type,
            "created_at": document.created_at.isoformat(),
            "created_by": document.created_by
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating document: {str(e)}")

@router.get("/projects/{project_id}/documents")
async def get_project_documents(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all documents for a project"""
    try:
        documents = await openproject_service.get_project_documents(project_id)
        
        return [
            {
                "id": doc.id,
                "project_id": doc.project_id,
                "title": doc.title,
                "content": doc.content,
                "document_type": doc.document_type,
                "created_by": doc.created_by,
                "created_at": doc.created_at.isoformat(),
                "attachments": doc.attachments
            }
            for doc in documents
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching documents: {str(e)}")

@router.post("/projects/{project_id}/memo")
async def add_project_memo(
    project_id: str,
    request: AddMemoRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add an investment memo or analysis to a project"""
    try:
        success = await openproject_service.add_project_memo(
            project_id, 
            request.content, 
            request.memo_type
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to add memo")
        
        return {
            "message": "Memo added successfully",
            "project_id": project_id,
            "memo_type": request.memo_type
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding memo: {str(e)}")

# Analytics
@router.get("/analytics")
async def get_portfolio_analytics(
    current_user: dict = Depends(get_current_user)
):
    """Get portfolio-wide analytics and metrics"""
    try:
        analytics = await openproject_service.get_portfolio_analytics()
        return analytics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating analytics: {str(e)}")

# Deal Pipeline
@router.get("/pipeline")
async def get_deal_pipeline(
    current_user: dict = Depends(get_current_user)
):
    """Get deal pipeline view with stages"""
    try:
        projects = await openproject_service.get_portfolio_projects()
        
        pipeline = {
            "sourcing": [],
            "initial_meeting": [],
            "deep_dive": [],
            "term_sheet": [],
            "due_diligence": [],
            "closing": [],
            "portfolio_monitoring": []
        }
        
        for project in projects:
            stage = project.deal_stage.value
            if stage in pipeline:
                pipeline[stage].append({
                    "id": project.id,
                    "company_name": project.company_name,
                    "sector": project.sector,
                    "lead_partner": project.lead_partner,
                    "updated_at": project.updated_at.isoformat()
                })
        
        return {
            "pipeline": pipeline,
            "total_deals": len(projects),
            "updated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching pipeline: {str(e)}")

# Search
@router.get("/search")
async def search_portfolio(
    q: str = Query(..., description="Search query"),
    current_user: dict = Depends(get_current_user)
):
    """Search across portfolio projects and documents"""
    try:
        projects = await openproject_service.get_portfolio_projects()
        
        # Simple text search across project names and descriptions
        results = []
        query_lower = q.lower()
        
        for project in projects:
            if (query_lower in project.company_name.lower() or 
                query_lower in project.description.lower() or
                (project.sector and query_lower in project.sector.lower()) or
                (project.lead_partner and query_lower in project.lead_partner.lower())):
                
                results.append({
                    "id": project.id,
                    "type": "project",
                    "title": project.company_name,
                    "description": project.description,
                    "sector": project.sector,
                    "deal_stage": project.deal_stage.value,
                    "relevance_score": 1.0  # Simple scoring for now
                })
        
        return {
            "query": q,
            "results": results,
            "total_results": len(results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching portfolio: {str(e)}")