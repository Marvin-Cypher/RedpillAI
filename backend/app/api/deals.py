from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlmodel import Session, select
from datetime import datetime

from ..database import get_db
from ..models.deals import (
    Deal, DealCreate, DealUpdate, DealRead, DealStatus, InvestmentStage,
    DealStatusHistory, Meeting, ResearchMemo, Document
)
from ..models.companies import Company
from ..models.users import User
from ..core.auth import get_current_active_user

router = APIRouter()


@router.post("/", response_model=DealRead)
async def create_deal(
    deal: DealCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new deal."""
    # Verify company exists
    company_statement = select(Company).where(Company.id == deal.company_id)
    company = db.exec(company_statement).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Create deal
    db_deal = Deal(**deal.model_dump(), created_by=current_user.id)
    db.add(db_deal)
    db.commit()
    db.refresh(db_deal)
    
    # Create status history entry
    status_history = DealStatusHistory(
        deal_id=db_deal.id,
        previous_status=None,
        new_status=db_deal.status,
        changed_by=current_user.id,
        notes="Deal created"
    )
    db.add(status_history)
    db.commit()
    
    # Add background task for AI analysis
    # background_tasks.add_task(trigger_ai_analysis, db_deal.id)
    
    return db_deal


@router.get("/", response_model=List[DealRead])
async def list_deals(
    status: Optional[DealStatus] = Query(None, description="Filter by status"),
    stage: Optional[InvestmentStage] = Query(None, description="Filter by investment stage"),
    company_sector: Optional[str] = Query(None, description="Filter by company sector"),
    skip: int = Query(0, ge=0, description="Number of deals to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of deals to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List deals with optional filtering."""
    statement = select(Deal, Company).join(Company, Deal.company_id == Company.id)
    
    # Apply filters
    if status:
        statement = statement.where(Deal.status == status)
    
    if stage:
        statement = statement.where(Deal.stage == stage)
    
    if company_sector:
        statement = statement.where(Company.sector == company_sector)
    
    # Order by updated_at desc
    statement = statement.order_by(Deal.updated_at.desc())
    
    # Add pagination
    statement = statement.offset(skip).limit(limit)
    
    results = db.exec(statement).all()
    
    # Transform results to include company data
    deals = []
    for deal, company in results:
        deal_dict = deal.model_dump()
        deal_dict["company"] = company.model_dump()
        deals.append(deal_dict)
    
    return deals


@router.get("/{deal_id}", response_model=DealRead)
async def get_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific deal by ID."""
    statement = select(Deal, Company).join(Company).where(Deal.id == deal_id)
    result = db.exec(statement).first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    deal, company = result
    deal_dict = deal.model_dump()
    deal_dict["company"] = company.model_dump()
    
    return deal_dict


@router.put("/{deal_id}", response_model=DealRead)
async def update_deal(
    deal_id: str,
    deal_update: DealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a deal."""
    statement = select(Deal).where(Deal.id == deal_id)
    db_deal = db.exec(statement).first()
    
    if not db_deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # Store previous status for history
    previous_status = db_deal.status
    
    # Update fields
    update_data = deal_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_deal, field, value)
    
    db_deal.updated_at = datetime.utcnow()
    db.add(db_deal)
    db.commit()
    db.refresh(db_deal)
    
    # Create status history if status changed
    if "status" in update_data and previous_status != db_deal.status:
        status_history = DealStatusHistory(
            deal_id=db_deal.id,
            previous_status=previous_status,
            new_status=db_deal.status,
            changed_by=current_user.id,
            notes=f"Status changed from {previous_status} to {db_deal.status}"
        )
        db.add(status_history)
        db.commit()
    
    return db_deal


@router.put("/{deal_id}/status")
async def update_deal_status(
    deal_id: str,
    new_status: DealStatus,
    notes: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update deal status and trigger AI workflows."""
    statement = select(Deal).where(Deal.id == deal_id)
    deal = db.exec(statement).first()
    
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    previous_status = deal.status
    deal.status = new_status
    deal.updated_at = datetime.utcnow()
    
    db.add(deal)
    db.commit()
    
    # Create status history
    status_history = DealStatusHistory(
        deal_id=deal.id,
        previous_status=previous_status,
        new_status=new_status,
        changed_by=current_user.id,
        notes=notes or f"Status updated to {new_status}"
    )
    db.add(status_history)
    db.commit()
    
    # Trigger status-specific AI workflows
    if background_tasks:
        # background_tasks.add_task(trigger_status_workflow, deal.id, new_status)
        pass
    
    return {
        "message": f"Deal status updated to {new_status}",
        "deal_id": deal.id,
        "previous_status": previous_status,
        "new_status": new_status
    }


@router.get("/{deal_id}/status-history")
async def get_deal_status_history(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get deal status change history."""
    statement = select(DealStatusHistory).where(
        DealStatusHistory.deal_id == deal_id
    ).order_by(DealStatusHistory.changed_at.desc())
    
    history = db.exec(statement).all()
    return history


@router.delete("/{deal_id}")
async def delete_deal(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a deal."""
    statement = select(Deal).where(Deal.id == deal_id)
    deal = db.exec(statement).first()
    
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    db.delete(deal)
    db.commit()
    
    return {"message": "Deal deleted successfully"}


@router.get("/stats/pipeline")
async def get_pipeline_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get pipeline statistics."""
    # Count deals by status
    stats = {}
    for status in DealStatus:
        count_statement = select(Deal).where(Deal.status == status)
        count = len(db.exec(count_statement).all())
        stats[status.value] = count
    
    # Calculate total pipeline value
    value_statement = select(Deal).where(Deal.our_target.isnot(None))
    deals_with_targets = db.exec(value_statement).all()
    total_pipeline_value = sum(deal.our_target or 0 for deal in deals_with_targets)
    
    return {
        "status_counts": stats,
        "total_pipeline_value": total_pipeline_value,
        "total_deals": sum(stats.values())
    }