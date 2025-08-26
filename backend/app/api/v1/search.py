"""
AI-powered search endpoints using Exa.ai Websets
Enables natural language search for companies, founders, and market intelligence
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import logging

from ...services.exa_service import ExaService
# Removed: company enrichment service
# Removed: unified company service
from ...models.users import User
from ...core.auth import get_current_active_user, get_current_user_optional
from ...database import get_session
from sqlmodel import Session, select
from ...models.companies import Company

logger = logging.getLogger(__name__)

router = APIRouter(tags=["AI Search"])

# Initialize Exa service (will use API if key is configured, otherwise fallback to mock)
exa_service = ExaService(use_mock=False)


# Request/Response Models

class CompanySearchRequest(BaseModel):
    """Request model for company search."""
    query: str = Field(..., description="Natural language search query", min_length=3, max_length=500)
    filters: Optional[Dict[str, Any]] = Field(None, description="Optional filters (location, founded_after, etc.)")
    limit: int = Field(50, description="Maximum number of results", ge=1, le=100)


class FounderSearchRequest(BaseModel):
    """Request model for founder/person search."""
    query: str = Field(..., description="Natural language search query", min_length=3, max_length=500)
    filters: Optional[Dict[str, Any]] = Field(None, description="Optional filters")
    limit: int = Field(30, description="Maximum number of results", ge=1, le=50)


class DomainIntelligenceRequest(BaseModel):
    """Request model for domain intelligence."""
    domain: str = Field(..., description="Domain to analyze (e.g., example.com)")
    intel_type: str = Field("overview", description="Type of intelligence: overview, team, products")


class MonitorRequest(BaseModel):
    """Request model for creating a monitor."""
    company_id: str = Field(..., description="Company ID to monitor")
    webhook_url: Optional[str] = Field(None, description="Webhook URL for notifications")


class SearchResult(BaseModel):
    """Generic search result model."""
    query: str
    total_results: int
    results: List[Dict[str, Any]]
    webset_id: Optional[str] = None
    credits_used: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ImportCompaniesRequest(BaseModel):
    """Request model for importing companies from search results."""
    companies: List[Dict[str, Any]] = Field(..., description="List of company data to import")
    source: str = Field("exa_search", description="Source of the data")
    webset_id: Optional[str] = Field(None, description="Webset ID from search")


# Endpoints

@router.post("/companies", response_model=SearchResult)
async def search_companies(
    request: CompanySearchRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_session)
):
    """
    AI-powered company search using natural language queries.
    
    Examples:
    - "Fintech startups in Europe founded after 2020"
    - "AI companies with more than 100 employees"
    - "Crypto exchanges based in Singapore"
    - "B2B SaaS companies that raised Series A in 2024"
    
    This endpoint uses Exa.ai's advanced search capabilities to find companies
    matching complex criteria that traditional search can't handle.
    """
    try:
        logger.info(f"Company search request: {request.query}")
        
        # Check if Exa is configured (skip check in mock mode)
        if not exa_service.use_mock and not exa_service.client:
            raise HTTPException(
                status_code=503,
                detail="AI search service not configured. Please contact support."
            )
        
        # Perform the search
        search_results = await exa_service.search_companies(
            search_query=request.query,
            filters=request.filters
        )
        
        if search_results.get('error'):
            raise HTTPException(
                status_code=500,
                detail=f"Search failed: {search_results['error']}"
            )
        
        # Track usage if user is logged in
        if current_user:
            credits_used = search_results.get('_meta', {}).get('cost_estimate', 0.02)
            # TODO: Deduct credits from user account
            logger.info(f"User {current_user.email} used {credits_used} credits for company search")
        
        # Optionally save interesting results to database
        if current_user and len(search_results.get('results', [])) > 0:
            background_tasks.add_task(
                _save_search_results_to_db,
                search_results['results'][:5],  # Save top 5
                current_user.id,
                db
            )
        
        return SearchResult(
            query=request.query,
            total_results=search_results.get('total_results', 0),
            results=search_results.get('results', []),
            webset_id=search_results.get('webset_id'),
            credits_used=search_results.get('_meta', {}).get('cost_estimate', 0.02)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Company search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


@router.post("/founders", response_model=SearchResult)
async def search_founders(
    request: FounderSearchRequest,
    current_user: User = Depends(get_current_user_optional)
):
    """
    Search for founders and executives using natural language.
    
    Examples:
    - "Female founders in AI who have raised funding"
    - "CTOs in Berlin with blockchain experience"
    - "Serial entrepreneurs who have exited companies"
    - "Founders of unicorn companies in Southeast Asia"
    
    Returns people profiles with their roles, companies, and relevant information.
    """
    try:
        logger.info(f"Founder search request: {request.query}")
        
        if not exa_service.client:
            raise HTTPException(
                status_code=503,
                detail="AI search service not configured"
            )
        
        # Perform the search
        search_results = await exa_service.search_founders(
            search_query=request.query,
            filters=request.filters
        )
        
        if search_results.get('error'):
            raise HTTPException(
                status_code=500,
                detail=f"Search failed: {search_results['error']}"
            )
        
        # Track usage
        if current_user:
            credits_used = search_results.get('_meta', {}).get('cost_estimate', 0.01)
            logger.info(f"User {current_user.email} used {credits_used} credits for founder search")
        
        return SearchResult(
            query=request.query,
            total_results=search_results.get('total_results', 0),
            results=search_results.get('results', []),
            webset_id=search_results.get('webset_id'),
            credits_used=search_results.get('_meta', {}).get('cost_estimate', 0.01)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Founder search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


@router.post("/domain-intelligence")
async def get_domain_intelligence(
    request: DomainIntelligenceRequest,
    current_user: User = Depends(get_current_user_optional)
):
    """
    Analyze a company's domain to extract intelligence.
    
    Provide a domain (e.g., "stripe.com") and get:
    - Company overview and mission
    - Team and leadership information
    - Products and services
    - Recent updates from their site
    
    This is useful for competitive analysis or researching companies
    that aren't in traditional databases.
    """
    try:
        logger.info(f"Domain intelligence request for: {request.domain}")
        
        if not exa_service.client:
            raise HTTPException(
                status_code=503,
                detail="AI search service not configured"
            )
        
        # Get domain intelligence
        intelligence = await exa_service.get_domain_intelligence(
            domain=request.domain,
            intel_type=request.intel_type
        )
        
        if intelligence.get('error'):
            raise HTTPException(
                status_code=500,
                detail=f"Analysis failed: {intelligence['error']}"
            )
        
        # Track usage
        if current_user:
            credits_used = intelligence.get('_meta', {}).get('cost_estimate', 0.01)
            logger.info(f"User {current_user.email} used {credits_used} credits for domain analysis")
        
        return intelligence
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Domain intelligence error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


@router.post("/monitor/create")
async def create_company_monitor(
    request: MonitorRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_session)
):
    """
    Create a monitor to track news and updates about a company.
    
    Monitors run daily and can:
    - Track news mentions
    - Monitor funding announcements
    - Watch for product launches
    - Alert on leadership changes
    
    Optional webhook URL receives real-time notifications.
    """
    try:
        logger.info(f"Creating monitor for company {request.company_id}")
        
        if not exa_service.client:
            raise HTTPException(
                status_code=503,
                detail="Monitoring service not configured"
            )
        
        # Get company from database
        company = db.get(Company, request.company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Create the monitor
        result = await company_enrichment_service_exa.setup_company_monitor(
            company,
            request.webhook_url
        )
        
        if result.get('error'):
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create monitor: {result['error']}"
            )
        
        # Save monitor info to database
        company.monitor_id = result.get('monitor_id')
        company.monitor_enabled = True
        company.monitor_webhook = request.webhook_url
        db.add(company)
        db.commit()
        
        # Track usage
        monthly_cost = result.get('_meta', {}).get('monthly_cost_estimate', 0.15)
        logger.info(f"Created monitor for {company.name}, estimated monthly cost: ${monthly_cost}")
        
        return {
            "status": "success",
            "monitor_id": result.get('monitor_id'),
            "company": company.name,
            "webhook_enabled": bool(request.webhook_url),
            "estimated_monthly_cost": monthly_cost
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Monitor creation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Monitor error: {str(e)}")


@router.get("/monitor/{company_id}/status")
async def get_monitor_status(
    company_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_session)
):
    """Get the status of a company monitor."""
    company = db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return {
        "company": company.name,
        "monitor_enabled": company.monitor_enabled,
        "monitor_id": company.monitor_id,
        "webhook_url": company.monitor_webhook,
        "last_update": company.data_last_refreshed
    }


@router.delete("/monitor/{company_id}")
async def delete_monitor(
    company_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_session)
):
    """Delete a company monitor."""
    company = db.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # TODO: Call Exa API to delete the actual monitor
    
    # Update database
    company.monitor_enabled = False
    company.monitor_id = None
    company.monitor_webhook = None
    db.add(company)
    db.commit()
    
    return {"status": "success", "message": f"Monitor deleted for {company.name}"}


@router.post("/import-companies")
async def import_companies(
    request: ImportCompaniesRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_session)
):
    """
    Import companies from search results into the companies database.
    
    This endpoint uses the unified company creation service to ensure
    consistent data enrichment and founder extraction for all imported companies.
    """
    try:
        logger.info(f"Importing {len(request.companies)} companies from {request.source}")
        
        # Use unified company service for consistent import process
        unified_service = get_unified_company_service(db)
        
        # Process enriched data for unified service format
        processed_companies = []
        for company_data in request.companies:
            enriched = company_data.get('enriched_data', {})
            
            # Convert to unified format
            processed_company = {
                'name': company_data.get('name'),
                'website': company_data.get('url'),
                'description': company_data.get('description'),
                'sector': enriched.get('sector', 'other'),
                'founded_year': enriched.get('founded_year'),
                'headquarters': enriched.get('headquarters'),
                'employee_count': enriched.get('employee_count'),
                'token_symbol': enriched.get('token_symbol'),
                # Preserve original enriched data
                'enriched_data': {
                    'exa_search_data': company_data,
                    'confidence_score': company_data.get('confidence_score', 0),
                    'matched_criteria': company_data.get('matched_criteria', []),
                    # Include any founder data from search results
                    'founders': enriched.get('founders', []),
                    'team': enriched.get('team', []),
                    'leadership': enriched.get('leadership', [])
                },
                # Extract key metrics for widgets
                'key_metrics': {
                    'revenue': enriched.get('revenue', 0),
                    'burn_rate': enriched.get('burn_rate', 0),
                    'runway_months': enriched.get('runway_months', 0),
                    'total_funding': enriched.get('total_funding', 0),
                    'latest_round': enriched.get('latest_round', ''),
                    'website_traffic': enriched.get('website_traffic', 0),
                    'social_media_followers': enriched.get('social_media_followers', 0),
                    'news_mentions': enriched.get('news_mentions', 0),
                    'market_cap': enriched.get('market_cap'),
                    'tvl': enriched.get('tvl'),
                    'investors': enriched.get('investors', [])
                }
            }
            processed_companies.append(processed_company)
        
        # Bulk import using unified service
        result = await unified_service.bulk_import_companies(
            companies_data=processed_companies,
            current_user_id=current_user.id,
            source=request.source
        )
        
        return {
            'status': 'success',
            'imported_count': result['imported_count'],
            'skipped_count': result['skipped_count'],
            'founders_created': result['founders_created'],
            'imported_companies': result['imported_companies'],
            'skipped_companies': result['skipped_companies'],
            'source': result['source'],
            'webset_id': request.webset_id,
            'message': f"Imported {result['imported_count']} companies with {result['founders_created']} founders"
        }
        
    except Exception as e:
        logger.error(f"Import failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.get("/trending")
async def get_trending_searches(
    category: Optional[str] = Query(None, description="Category: companies, founders, or all"),
    current_user: User = Depends(get_current_user_optional)
):
    """
    Get trending searches and hot topics in the VC ecosystem.
    
    This endpoint returns popular search queries and emerging trends
    that other users are searching for.
    """
    # TODO: Implement trending searches based on user activity
    trending = {
        "companies": [
            "AI startups with ARR over $10M",
            "Fintech companies in Southeast Asia",
            "Climate tech startups that raised in 2024"
        ],
        "founders": [
            "Female founders in deep tech",
            "Second-time founders in Europe",
            "YC alumni starting new companies"
        ],
        "topics": [
            "Generative AI applications",
            "Digital health post-pandemic",
            "Web3 infrastructure"
        ]
    }
    
    if category and category in trending:
        return {category: trending[category]}
    
    return trending


# Helper functions

def _map_sector_to_type(sector: str) -> str:
    """Map sector to company type enum."""
    sector_lower = sector.lower()
    
    if any(term in sector_lower for term in ['crypto', 'defi', 'blockchain', 'token']):
        return "CRYPTO"
    elif any(term in sector_lower for term in ['ai', 'ml', 'artificial']):
        return "AI"
    elif any(term in sector_lower for term in ['public', 'listed', 'nasdaq', 'nyse']):
        return "PUBLIC"
    else:
        return "PRIVATE"

async def _save_search_results_to_db(
    results: List[Dict],
    user_id: str,
    db: Session
):
    """Background task to save interesting search results to database."""
    try:
        for result in results:
            # Check if company already exists
            existing = db.exec(
                select(Company).where(Company.name == result.get('name'))
            ).first()
            
            if not existing:
                # Create new company record from search result
                company = Company(
                    name=result.get('name'),
                    website=result.get('url'),
                    description=result.get('description'),
                    company_type="UNKNOWN",  # Will be enriched later
                    created_by=user_id,
                    data_source="exa_search"
                )
                db.add(company)
        
        db.commit()
        logger.info(f"Saved {len(results)} search results to database")
        
    except Exception as e:
        logger.error(f"Failed to save search results: {str(e)}")
        db.rollback()