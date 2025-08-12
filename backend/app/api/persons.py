"""
API endpoints for managing persons (founders, executives, talent).
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from datetime import datetime

from ..database import get_db
from ..models.persons import (
    Person, PersonCreate, PersonUpdate, PersonRead, PersonReadWithCompany
)
from ..models.companies import Company
from ..models.users import User
from ..core.auth import get_current_active_user

router = APIRouter()


@router.post("/", response_model=PersonRead)
async def create_person(
    person: PersonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new person (founder, executive, contact)."""
    db_person = Person(
        **person.model_dump(),
        created_by=current_user.id
    )
    db.add(db_person)
    db.commit()
    db.refresh(db_person)
    return db_person


@router.get("/", response_model=List[PersonReadWithCompany])
async def list_persons(
    is_tracked: Optional[bool] = Query(None, description="Filter by tracking status"),
    is_founder: Optional[bool] = Query(None, description="Filter by founder status"),
    company_id: Optional[str] = Query(None, description="Filter by company"),
    search: Optional[str] = Query(None, description="Search by name or title"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all persons with optional filtering."""
    query = select(Person)
    
    if is_tracked is not None:
        query = query.where(Person.is_tracked == is_tracked)
    
    if is_founder is not None:
        query = query.where(Person.is_founder == is_founder)
    
    if company_id:
        query = query.where(Person.company_id == company_id)
    
    if search:
        search_term = f"%{search.lower()}%"
        query = query.where(
            (Person.name.ilike(search_term)) |
            (Person.title.ilike(search_term)) |
            (Person.bio.ilike(search_term))
        )
    
    query = query.offset(skip).limit(limit)
    persons = db.exec(query).all()
    
    # Enrich with company data
    result = []
    for person in persons:
        person_dict = person.model_dump()
        if person.company_id:
            company = db.get(Company, person.company_id)
            if company:
                person_dict["company"] = {
                    "id": company.id,
                    "name": company.name,
                    "sector": company.sector,
                    "company_type": company.company_type
                }
        result.append(person_dict)
    
    return result


@router.get("/tracked", response_model=List[Dict[str, Any]])
async def get_tracked_talent(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all tracked talent with activity signals."""
    query = select(Person).where(Person.is_tracked == True)
    persons = db.exec(query).all()
    
    result = []
    for person in persons:
        # Calculate signal strength based on recent activity
        signal_strength = person.signal_strength or 0
        
        # Determine status based on signals
        status = "monitoring"
        if person.is_founder and person.startup_stage:
            status = f"founder_{person.startup_stage}"
        elif signal_strength > 70:
            status = "high_signal"
        elif signal_strength > 40:
            status = "medium_signal"
        
        person_data = {
            "id": person.id,
            "name": person.name,
            "title": person.title,
            "company": None,
            "status": status,
            "signal_strength": signal_strength,
            "is_founder": person.is_founder,
            "startup_stage": person.startup_stage,
            "track_reason": person.track_reason,
            "last_activity": person.last_activity_check,
            "linkedin_url": person.linkedin_url,
            "twitter_handle": person.twitter_handle,
            "github_username": person.github_username,
            "activity_signals": person.activity_signals or {}
        }
        
        if person.company_id:
            company = db.get(Company, person.company_id)
            if company:
                person_data["company"] = {
                    "id": company.id,
                    "name": company.name
                }
        
        result.append(person_data)
    
    # Sort by signal strength (highest first)
    result.sort(key=lambda x: x["signal_strength"], reverse=True)
    
    return result


@router.get("/{person_id}", response_model=PersonReadWithCompany)
async def get_person(
    person_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific person by ID."""
    person = db.get(Person, person_id)
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    
    result = person.model_dump()
    if person.company_id:
        company = db.get(Company, person.company_id)
        if company:
            result["company"] = {
                "id": company.id,
                "name": company.name,
                "sector": company.sector,
                "company_type": company.company_type
            }
    
    return result


@router.put("/{person_id}", response_model=PersonRead)
async def update_person(
    person_id: str,
    person_update: PersonUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a person's information."""
    person = db.get(Person, person_id)
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    
    update_data = person_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(person, field, value)
    
    person.updated_at = datetime.utcnow()
    db.add(person)
    db.commit()
    db.refresh(person)
    
    return person


@router.post("/{person_id}/track", response_model=Dict[str, Any])
async def track_person(
    person_id: str,
    track_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Start tracking a person for founder signals."""
    person = db.get(Person, person_id)
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    
    person.is_tracked = True
    person.track_reason = track_data.get("reason", "High potential talent")
    person.last_activity_check = datetime.utcnow()
    
    # Initialize activity signals
    person.activity_signals = {
        "linkedin": {"last_checked": None, "changes_detected": False},
        "github": {"last_checked": None, "activity_spike": False},
        "twitter": {"last_checked": None, "founder_keywords": []},
        "manual_notes": []
    }
    
    db.add(person)
    db.commit()
    
    return {
        "status": "success",
        "message": f"Now tracking {person.name}",
        "person_id": person.id
    }


@router.post("/{person_id}/untrack", response_model=Dict[str, Any])
async def untrack_person(
    person_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Stop tracking a person."""
    person = db.get(Person, person_id)
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    
    person.is_tracked = False
    person.track_reason = None
    person.signal_strength = None
    
    db.add(person)
    db.commit()
    
    return {
        "status": "success",
        "message": f"Stopped tracking {person.name}",
        "person_id": person.id
    }


@router.post("/{person_id}/signals", response_model=Dict[str, Any])
async def update_person_signals(
    person_id: str,
    signal_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update activity signals for a tracked person."""
    person = db.get(Person, person_id)
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    
    if not person.is_tracked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Person is not being tracked"
        )
    
    # Update signals
    if not person.activity_signals:
        person.activity_signals = {}
    
    person.activity_signals.update(signal_data.get("signals", {}))
    person.last_activity_check = datetime.utcnow()
    
    # Calculate signal strength
    signals = person.activity_signals
    strength = 0
    
    # LinkedIn bio change to founder
    if signals.get("linkedin", {}).get("founder_detected"):
        strength += 40
    
    # GitHub activity spike
    if signals.get("github", {}).get("activity_spike"):
        strength += 30
    
    # Twitter hints
    if len(signals.get("twitter", {}).get("founder_keywords", [])) > 0:
        strength += 20
    
    # Manual notes
    if len(signals.get("manual_notes", [])) > 0:
        strength += 10
    
    person.signal_strength = min(strength, 100)
    
    # Update founder status if signals indicate it
    if strength > 60 and not person.is_founder:
        person.is_founder = True
        person.founder_since = datetime.utcnow()
        person.startup_stage = "ideation"
    
    db.add(person)
    db.commit()
    
    return {
        "status": "success",
        "person_id": person.id,
        "signal_strength": person.signal_strength,
        "is_founder": person.is_founder,
        "signals": person.activity_signals
    }


@router.delete("/{person_id}")
async def delete_person(
    person_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a person."""
    person = db.get(Person, person_id)
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    
    db.delete(person)
    db.commit()
    
    return {"message": "Person deleted successfully"}


@router.get("/company/{company_id}/founders", response_model=List[PersonRead])
async def get_company_founders(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all founders for a specific company."""
    query = select(Person).where(
        (Person.company_id == company_id) &
        ((Person.primary_role == "FOUNDER") | 
         (Person.primary_role == "CO_FOUNDER") |
         (Person.is_founder == True))
    )
    
    founders = db.exec(query).all()
    return founders