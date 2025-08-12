"""
Exa.ai Websets API endpoints for AI-powered semantic search and company intelligence
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlmodel import Session
from pydantic import BaseModel
from datetime import datetime

from ...database import get_session
from ...core.auth import get_current_user_optional
from ...models.users import User
from ...services.exa_service import ExaService
from ...models.companies import Company
from ...services.enhanced_company_service import EnhancedCompanyService


router = APIRouter()


# Request/Response Models
class ExaSearchRequest(BaseModel):
    """Request model for Exa searches."""
    query: str
    entity_type: str = "company"  # company, person, article
    count: int = 20
    criteria: Optional[List[str]] = None
    include_domains: Optional[List[str]] = None
    exclude_domains: Optional[List[str]] = None


class ExaEnrichmentRequest(BaseModel):
    """Request model for company enrichment."""
    company_name: str
    company_domain: Optional[str] = None
    update_database: bool = False


class ExaMonitorRequest(BaseModel):
    """Request model for creating monitors."""
    company_name: str
    monitor_type: str = "news"  # news, funding, team
    schedule: str = "daily"  # daily, weekly
    webhook_url: Optional[str] = None


class ExaDomainIntelRequest(BaseModel):
    """Request model for domain intelligence."""
    domain: str
    intel_type: str = "overview"  # overview, team, products


# Discovery Search Endpoints

@router.post("/search/companies", response_model=Dict[str, Any])
async def search_companies_ai(
    request: ExaSearchRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    """
    AI-powered company search using natural language queries.
    
    This is the killer feature - allows complex queries like:
    - "Fintech startups in Europe founded after 2020"
    - "AI companies with female founders that raised Series A"
    - "Crypto exchanges with more than 100 employees"
    """
    try:
        # Initialize Exa service
        exa_service = ExaService(use_mock=True)  # Use mock for development
        
        # Build filters from criteria
        filters = {}
        if request.criteria:
            for criterion in request.criteria:
                if "founded after" in criterion.lower():
                    # Extract year from criterion
                    import re
                    year_match = re.search(r'\d{4}', criterion)
                    if year_match:
                        filters["founded_after"] = int(year_match.group())
                elif "employees" in criterion.lower():
                    # Extract employee count
                    import re
                    num_match = re.search(r'(\d+)', criterion)
                    if num_match:
                        filters["min_employees"] = int(num_match.group())
                elif any(location in criterion.lower() for location in ["europe", "asia", "america", "africa"]):
                    filters["location"] = criterion
        
        # Perform search
        search_results = await exa_service.search_companies(
            search_query=request.query,
            filters=filters
        )
        
        # Add search metadata
        search_results["search_metadata"] = {
            "user_id": current_user.id if current_user else None,
            "timestamp": datetime.utcnow().isoformat(),
            "entity_type": request.entity_type,
            "requested_count": request.count,
            "actual_count": len(search_results.get("results", []))
        }
        
        return search_results
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI company search failed: {str(e)}"
        )


@router.post("/search/people", response_model=Dict[str, Any])
async def search_people_ai(
    request: ExaSearchRequest,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    AI-powered people/founder search.
    
    Examples:
    - "Female founders in AI who have raised funding"
    - "CTOs in Berlin with blockchain experience"
    - "Serial entrepreneurs who have exited companies"
    """
    try:
        exa_service = ExaService(use_mock=True)
        
        # Perform founder/people search
        search_results = await exa_service.search_founders(
            search_query=request.query,
            filters={}
        )
        
        search_results["search_metadata"] = {
            "user_id": current_user.id if current_user else None,
            "timestamp": datetime.utcnow().isoformat(),
            "entity_type": "person",
            "requested_count": request.count
        }
        
        return search_results
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI people search failed: {str(e)}"
        )


# Company Enrichment Endpoints

@router.post("/enrich/company", response_model=Dict[str, Any])
async def enrich_company_with_exa(
    request: ExaEnrichmentRequest,
    background_tasks: BackgroundTasks,
    current_user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    """
    Comprehensive company enrichment using Exa.ai Websets.
    Replaces Tavily with more powerful AI-driven data collection.
    """
    try:
        exa_service = ExaService(use_mock=True)
        
        # Perform comprehensive enrichment
        enrichment_data = await exa_service.enrich_company_data(
            company_name=request.company_name,
            company_domain=request.company_domain
        )
        
        # If update_database is True, update/create company record
        if request.update_database:
            background_tasks.add_task(
                _update_company_with_exa_data,
                session,
                request.company_name,
                enrichment_data,
                current_user.id if current_user else None
            )
        
        return {
            "status": "success",
            "company_name": request.company_name,
            "enrichment_data": enrichment_data,
            "database_update_queued": request.update_database,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Company enrichment failed: {str(e)}"
        )


@router.get("/enrich/company/{company_id}", response_model=Dict[str, Any])
async def enrich_existing_company(
    company_id: str,
    update_record: bool = Query(True, description="Update company record with enriched data"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    session: Session = Depends(get_session)
):
    """Enrich an existing company in the database using Exa.ai."""
    try:
        # Get company from database
        company = session.get(Company, company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Enrich using Exa
        exa_service = ExaService(use_mock=True)
        enrichment_data = await exa_service.enrich_company_data(
            company_name=company.name,
            company_domain=company.website.replace("https://", "").replace("http://", "") if company.website else None
        )
        
        # Update company record if requested
        if update_record:
            await _update_company_with_exa_data(
                session,
                company.name,
                enrichment_data,
                current_user.id if current_user else None,
                company_id=company_id
            )
        
        # Get updated company with structured data
        enhanced_service = EnhancedCompanyService(session)
        company_data = await enhanced_service.get_company_detailed(
            company_id=company_id,
            include_level="intelligence"
        )
        
        return {
            "status": "success",
            "company": company_data,
            "exa_enrichment": enrichment_data,
            "updated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Company enrichment failed: {str(e)}"
        )


# Monitor Endpoints

@router.post("/monitors", response_model=Dict[str, Any])
async def create_monitor(
    request: ExaMonitorRequest,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Create a monitor for continuous company intelligence updates.
    Monitors automatically track news, funding, team changes, etc.
    """
    try:
        exa_service = ExaService(use_mock=True)
        
        # Create news monitor
        monitor_result = await exa_service.create_news_monitor(
            company_name=request.company_name,
            webhook_url=request.webhook_url
        )
        
        return {
            "status": "success",
            "monitor": monitor_result,
            "company_name": request.company_name,
            "monitor_type": request.monitor_type,
            "schedule": request.schedule,
            "created_by": current_user.id if current_user else None,
            "created_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Monitor creation failed: {str(e)}"
        )


@router.get("/monitors", response_model=List[Dict[str, Any]])
async def list_monitors(
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """List all active monitors for the user."""
    try:
        # In production, this would query the monitors database
        # For now, return mock data
        monitors = [
            {
                "id": "monitor_1",
                "company_name": "Example Corp",
                "monitor_type": "news",
                "schedule": "daily",
                "status": "active",
                "last_run": "2025-01-15T08:00:00Z",
                "items_found_today": 3
            }
        ]
        
        return monitors
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list monitors: {str(e)}"
        )


# Domain Intelligence Endpoints

@router.post("/intelligence/domain", response_model=Dict[str, Any])
async def get_domain_intelligence(
    request: ExaDomainIntelRequest,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get intelligence about a company from their domain.
    Competitive analysis tool - enter a website, get comprehensive intel.
    """
    try:
        exa_service = ExaService(use_mock=True)
        
        intelligence = await exa_service.get_domain_intelligence(
            domain=request.domain,
            intel_type=request.intel_type
        )
        
        return {
            "status": "success",
            "domain_intelligence": intelligence,
            "analyzed_at": datetime.utcnow().isoformat(),
            "analyzed_by": current_user.id if current_user else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Domain intelligence failed: {str(e)}"
        )


# Webhook Endpoint for Monitor Updates

@router.post("/webhook/monitor-update")
async def monitor_webhook(
    webhook_data: Dict[str, Any],
    session: Session = Depends(get_session)
):
    """
    Webhook endpoint to receive monitor updates from Exa.ai.
    This is called when monitors find new items.
    """
    try:
        # Process webhook data
        webset_id = webhook_data.get("webset_id")
        company_name = webhook_data.get("company_name")
        new_items = webhook_data.get("items", [])
        
        # Store new items in database (news, funding updates, etc.)
        # This would integrate with your Activity or News models
        
        return {
            "status": "received",
            "webset_id": webset_id,
            "company_name": company_name,
            "items_processed": len(new_items),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


# Utility Endpoints

@router.get("/status", response_model=Dict[str, Any])
async def exa_service_status():
    """Check Exa.ai service status and configuration."""
    try:
        exa_service = ExaService(use_mock=True)
        
        return {
            "status": "operational",
            "service": "exa_websets",
            "mock_mode": exa_service.use_mock,
            "api_configured": bool(exa_service.api_key),
            "features": {
                "company_search": True,
                "people_search": True,
                "company_enrichment": True,
                "monitors": True,
                "domain_intelligence": True
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }


# Helper Functions

async def _update_company_with_exa_data(
    session: Session,
    company_name: str,
    enrichment_data: Dict[str, Any],
    user_id: Optional[str] = None,
    company_id: Optional[str] = None
) -> None:
    """Update or create company record with Exa enrichment data."""
    try:
        # Find or create company
        if company_id:
            company = session.get(Company, company_id)
        else:
            # Search by name
            from sqlmodel import select
            statement = select(Company).where(Company.name.ilike(f"%{company_name}%"))
            company = session.exec(statement).first()
        
        if not company:
            # Create new company
            company = Company(
                name=company_name,
                created_by=user_id,
                owner_user_id=user_id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(company)
        
        # Update with Exa data
        if enrichment_data.get("data"):
            exa_data = enrichment_data["data"]
            
            # Update basic fields from profile data
            if "profile" in exa_data and exa_data["profile"].get("answer"):
                company.description = exa_data["profile"]["answer"][:1000]
            
            # Store full Exa data in enriched_data
            if not company.enriched_data:
                company.enriched_data = {}
            
            company.enriched_data["exa_enrichment"] = {
                "data": enrichment_data,
                "enriched_at": datetime.utcnow().isoformat(),
                "enriched_by": user_id,
                "source": "exa_websets"
            }
            
            company.data_last_refreshed = datetime.utcnow()
            company.updated_at = datetime.utcnow()
        
        session.commit()
        session.refresh(company)
        
    except Exception as e:
        session.rollback()
        raise Exception(f"Failed to update company with Exa data: {str(e)}")


# Configuration endpoint for development
@router.get("/config", response_model=Dict[str, Any])
async def get_exa_config(
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Get Exa.ai service configuration (for admin users)."""
    return {
        "service": "exa_websets",
        "version": "1.0.0",
        "endpoints": {
            "company_search": "/search/companies",
            "people_search": "/search/people", 
            "company_enrichment": "/enrich/company",
            "monitors": "/monitors",
            "domain_intelligence": "/intelligence/domain"
        },
        "features": {
            "ai_powered_search": "Search companies/people with natural language",
            "semantic_enrichment": "Rich company data via AI websets",
            "continuous_monitoring": "Auto-track news/updates",
            "domain_intelligence": "Competitive analysis from websites"
        },
        "cost_model": "Credit-based usage tracking",
        "status": "active"
    }