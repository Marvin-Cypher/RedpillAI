from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, timedelta

from ...database import get_session
from ...models import (
    Activity, ActivityCreate, ActivityRead, ActivityReadWithDetails,
    ActivityFilter, ACTIVITY_TYPES, Company, Deal, Person
)
from ...core.auth import get_current_user_optional
from ...models.users import User

router = APIRouter()


@router.get("/", response_model=List[ActivityReadWithDetails])
def list_activities(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    company_id: Optional[str] = Query(None, description="Filter by company ID"),
    deal_id: Optional[str] = Query(None, description="Filter by deal ID"),
    person_id: Optional[str] = Query(None, description="Filter by person ID"),
    activity_type: Optional[str] = Query(None, description="Filter by activity type"),
    performed_by: Optional[str] = Query(None, description="Filter by user who performed activity"),
    date_from: Optional[datetime] = Query(None, description="Filter activities from this date"),
    date_to: Optional[datetime] = Query(None, description="Filter activities to this date"),
    skip: int = Query(0, ge=0, description="Number of activities to skip"),
    limit: int = Query(100, le=1000, description="Number of activities to return")
):
    """List activities with optional filtering."""
    query = select(Activity)
    
    if company_id:
        query = query.where(Activity.company_id == company_id)
        
    if deal_id:
        query = query.where(Activity.deal_id == deal_id)
        
    if person_id:
        query = query.where(Activity.person_id == person_id)
        
    if activity_type:
        query = query.where(Activity.activity_type == activity_type)
        
    if performed_by:
        query = query.where(Activity.performed_by == performed_by)
        
    if date_from:
        query = query.where(Activity.occurred_at >= date_from)
        
    if date_to:
        query = query.where(Activity.occurred_at <= date_to)
    
    # Order by most recent first
    query = query.order_by(Activity.occurred_at.desc())
    query = query.offset(skip).limit(limit)
    
    activities = session.exec(query).all()
    
    # Load related data
    result = []
    for activity in activities:
        activity_dict = activity.dict()
        
        # Load related entities
        if activity.company_id:
            company = session.get(Company, activity.company_id)
            if company:
                activity_dict["company"] = company.dict()
                
        if activity.deal_id:
            deal = session.get(Deal, activity.deal_id)
            if deal:
                activity_dict["deal"] = deal.dict()
                
        if activity.person_id:
            person = session.get(Person, activity.person_id)
            if person:
                activity_dict["person"] = person.dict()
                
        if activity.performed_by:
            user = session.get(User, activity.performed_by)
            if user:
                activity_dict["user"] = user.dict()
        
        result.append(ActivityReadWithDetails(**activity_dict))
    
    return result


@router.get("/types", response_model=dict)
def get_activity_types():
    """Get available activity types."""
    return {"types": ACTIVITY_TYPES}


@router.get("/{activity_id}", response_model=ActivityReadWithDetails)
def get_activity(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    activity_id: str
):
    """Get a specific activity by ID."""
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Load related data
    activity_dict = activity.dict()
    
    if activity.company_id:
        company = session.get(Company, activity.company_id)
        if company:
            activity_dict["company"] = company.dict()
            
    if activity.deal_id:
        deal = session.get(Deal, activity.deal_id)
        if deal:
            activity_dict["deal"] = deal.dict()
            
    if activity.person_id:
        person = session.get(Person, activity.person_id)
        if person:
            activity_dict["person"] = person.dict()
            
    if activity.performed_by:
        user = session.get(User, activity.performed_by)
        if user:
            activity_dict["user"] = user.dict()
    
    return ActivityReadWithDetails(**activity_dict)


@router.post("/", response_model=ActivityRead)
def create_activity(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    activity_in: ActivityCreate
):
    """Create a new activity record."""
    # Validate activity type
    if activity_in.activity_type not in ACTIVITY_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid activity type. Must be one of: {list(ACTIVITY_TYPES.keys())}"
        )
    
    # Validate that at least one entity is referenced
    if not any([activity_in.company_id, activity_in.deal_id, activity_in.person_id]):
        raise HTTPException(
            status_code=400,
            detail="Activity must be associated with at least one entity (company, deal, or person)"
        )
    
    # Validate referenced entities exist
    if activity_in.company_id:
        company = session.get(Company, activity_in.company_id)
        if not company:
            raise HTTPException(status_code=400, detail="Company not found")
    
    if activity_in.deal_id:
        deal = session.get(Deal, activity_in.deal_id)
        if not deal:
            raise HTTPException(status_code=400, detail="Deal not found")
    
    if activity_in.person_id:
        person = session.get(Person, activity_in.person_id)
        if not person:
            raise HTTPException(status_code=400, detail="Person not found")
    
    if activity_in.performed_by:
        user = session.get(User, activity_in.performed_by)
        if not user:
            raise HTTPException(status_code=400, detail="User not found")
    
    activity_data = activity_in.dict()
    activity_data["created_at"] = datetime.utcnow()
    
    # Set occurred_at to now if not provided
    if not activity_data.get("occurred_at"):
        activity_data["occurred_at"] = datetime.utcnow()
    
    # Set performed_by to current user if not provided and user is authenticated
    if not activity_data.get("performed_by") and current_user:
        activity_data["performed_by"] = current_user.id
    
    activity = Activity(**activity_data)
    session.add(activity)
    session.commit()
    session.refresh(activity)
    
    return activity


@router.delete("/{activity_id}")
def delete_activity(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    activity_id: str
):
    """Delete an activity record."""
    activity = session.get(Activity, activity_id)
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    session.delete(activity)
    session.commit()
    
    return {"message": "Activity deleted successfully"}


@router.get("/company/{company_id}", response_model=List[ActivityReadWithDetails])
def get_company_activities(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    company_id: str,
    activity_type: Optional[str] = Query(None, description="Filter by activity type"),
    days: Optional[int] = Query(30, description="Number of days back to fetch activities")
):
    """Get all activities for a specific company."""
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    query = select(Activity).where(Activity.company_id == company_id)
    
    if activity_type:
        query = query.where(Activity.activity_type == activity_type)
    
    if days:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = query.where(Activity.occurred_at >= cutoff_date)
    
    query = query.order_by(Activity.occurred_at.desc())
    activities = session.exec(query).all()
    
    # Load related data
    result = []
    for activity in activities:
        activity_dict = activity.dict()
        activity_dict["company"] = company.dict()
        
        if activity.deal_id:
            deal = session.get(Deal, activity.deal_id)
            if deal:
                activity_dict["deal"] = deal.dict()
                
        if activity.person_id:
            person = session.get(Person, activity.person_id)
            if person:
                activity_dict["person"] = person.dict()
                
        if activity.performed_by:
            user = session.get(User, activity.performed_by)
            if user:
                activity_dict["user"] = user.dict()
        
        result.append(ActivityReadWithDetails(**activity_dict))
    
    return result


@router.get("/deal/{deal_id}", response_model=List[ActivityReadWithDetails])
def get_deal_activities(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    deal_id: str,
    activity_type: Optional[str] = Query(None, description="Filter by activity type"),
    days: Optional[int] = Query(30, description="Number of days back to fetch activities")
):
    """Get all activities for a specific deal."""
    deal = session.get(Deal, deal_id)
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    query = select(Activity).where(Activity.deal_id == deal_id)
    
    if activity_type:
        query = query.where(Activity.activity_type == activity_type)
    
    if days:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = query.where(Activity.occurred_at >= cutoff_date)
    
    query = query.order_by(Activity.occurred_at.desc())
    activities = session.exec(query).all()
    
    # Load related data
    result = []
    for activity in activities:
        activity_dict = activity.dict()
        activity_dict["deal"] = deal.dict()
        
        if activity.company_id:
            company = session.get(Company, activity.company_id)
            if company:
                activity_dict["company"] = company.dict()
                
        if activity.person_id:
            person = session.get(Person, activity.person_id)
            if person:
                activity_dict["person"] = person.dict()
                
        if activity.performed_by:
            user = session.get(User, activity.performed_by)
            if user:
                activity_dict["user"] = user.dict()
        
        result.append(ActivityReadWithDetails(**activity_dict))
    
    return result


@router.get("/person/{person_id}", response_model=List[ActivityReadWithDetails])
def get_person_activities(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str,
    activity_type: Optional[str] = Query(None, description="Filter by activity type"),
    days: Optional[int] = Query(30, description="Number of days back to fetch activities")
):
    """Get all activities for a specific person."""
    person = session.get(Person, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    query = select(Activity).where(Activity.person_id == person_id)
    
    if activity_type:
        query = query.where(Activity.activity_type == activity_type)
    
    if days:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        query = query.where(Activity.occurred_at >= cutoff_date)
    
    query = query.order_by(Activity.occurred_at.desc())
    activities = session.exec(query).all()
    
    # Load related data
    result = []
    for activity in activities:
        activity_dict = activity.dict()
        activity_dict["person"] = person.dict()
        
        if activity.company_id:
            company = session.get(Company, activity.company_id)
            if company:
                activity_dict["company"] = company.dict()
                
        if activity.deal_id:
            deal = session.get(Deal, activity.deal_id)
            if deal:
                activity_dict["deal"] = deal.dict()
                
        if activity.performed_by:
            user = session.get(User, activity.performed_by)
            if user:
                activity_dict["user"] = user.dict()
        
        result.append(ActivityReadWithDetails(**activity_dict))
    
    return result