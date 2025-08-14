from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional, Dict, Any
from datetime import datetime

from ...database import get_session
from ...models import (
    Person, PersonCreate, PersonUpdate, PersonRead,
    PERSON_ROLES, Company
)
from ...core.auth import get_current_user_optional
from ...models.users import User

router = APIRouter()


@router.get("/", response_model=List[PersonRead])
def list_persons(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    company_id: Optional[str] = Query(None, description="Filter by company ID"),
    role: Optional[str] = Query(None, description="Filter by role"),
    skip: int = Query(0, ge=0, description="Number of persons to skip"),
    limit: int = Query(100, le=1000, description="Number of persons to return")
):
    """List all persons with optional filtering."""
    query = select(Person)
    
    if company_id:
        query = query.where(Person.company_id == company_id)
        
    if role:
        query = query.where(Person.primary_role == role)
    
    query = query.offset(skip).limit(limit)
    persons = session.exec(query).all()
    return persons


@router.get("/roles", response_model=dict)
def get_person_roles():
    """Get available person roles."""
    return {"roles": PERSON_ROLES}


@router.get("/{person_id}", response_model=PersonRead)
def get_person(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str
):
    """Get a specific person by ID."""
    query = select(Person).where(Person.id == person_id)
    person = session.exec(query).first()
    
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    return person


@router.post("/", response_model=PersonRead)
def create_person(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_in: PersonCreate
):
    """Create a new person."""
    # Validate role if provided
    if person_in.primary_role and person_in.primary_role not in PERSON_ROLES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid role. Must be one of: {list(PERSON_ROLES.keys())}"
        )
    
    # Validate company exists if company_id provided
    if person_in.company_id:
        company = session.get(Company, person_in.company_id)
        if not company:
            raise HTTPException(status_code=400, detail="Company not found")
    
    person_data = person_in.dict()
    person_data["created_at"] = datetime.utcnow()
    person_data["updated_at"] = datetime.utcnow()
    
    if current_user:
        person_data["created_by"] = current_user.id
    
    person = Person(**person_data)
    session.add(person)
    session.commit()
    session.refresh(person)
    
    return person


@router.put("/{person_id}", response_model=PersonRead)
def update_person(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str,
    person_in: PersonUpdate
):
    """Update a person."""
    person = session.get(Person, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Validate role if provided
    if person_in.primary_role and person_in.primary_role not in PERSON_ROLES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid role. Must be one of: {list(PERSON_ROLES.keys())}"
        )
    
    person_data = person_in.dict(exclude_unset=True)
    person_data["updated_at"] = datetime.utcnow()
    
    for field, value in person_data.items():
        setattr(person, field, value)
    
    session.add(person)
    session.commit()
    session.refresh(person)
    
    return person


@router.delete("/{person_id}")
def delete_person(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str
):
    """Delete a person."""
    person = session.get(Person, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    session.delete(person)
    session.commit()
    
    return {"message": "Person deleted successfully"}


@router.post("/{person_id}/track", response_model=Dict[str, Any])
def track_person(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str,
    track_data: Dict[str, Any]
):
    """Start tracking a person for founder signals."""
    person = session.get(Person, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Update tracking status
    person.is_tracked = True
    person.track_reason = track_data.get("reason", "High potential talent")
    person.updated_at = datetime.utcnow()
    
    # Initialize activity signals if not already set
    if not person.activity_signals:
        person.activity_signals = {
            "linkedin": {"last_checked": None, "changes_detected": False},
            "github": {"last_checked": None, "activity_spike": False},
            "twitter": {"last_checked": None, "founder_keywords": []}
        }
    
    session.add(person)
    session.commit()
    session.refresh(person)
    
    return {
        "success": True,
        "message": f"Now tracking {person.name}",
        "person_id": person_id,
        "tracking_status": "active"
    }


@router.post("/{person_id}/untrack", response_model=Dict[str, Any])
def untrack_person(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str
):
    """Stop tracking a person."""
    person = session.get(Person, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    # Update tracking status
    person.is_tracked = False
    person.track_reason = None
    person.updated_at = datetime.utcnow()
    
    session.add(person)
    session.commit()
    session.refresh(person)
    
    return {
        "success": True,
        "message": f"Stopped tracking {person.name}",
        "person_id": person_id,
        "tracking_status": "inactive"
    }


@router.get("/company/{company_id}", response_model=List[PersonRead])
def list_company_persons(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    company_id: str
):
    """List all persons for a specific company."""
    # Verify company exists
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    query = select(Person).where(Person.company_id == company_id)
    persons = session.exec(query).all()
    
    return persons


@router.get("/company/{company_id}/founders", response_model=List[PersonRead])
def list_company_founders(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    company_id: str
):
    """List all founders for a specific company."""
    # Verify company exists
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Query for persons who are founders or have founder-related roles
    query = select(Person).where(
        Person.company_id == company_id,
        Person.is_founder.is_(True)
    )
    founders = session.exec(query).all()
    
    # If no founders found, also check for CEO, CTO, Founder roles
    if not founders:
        query = select(Person).where(
            Person.company_id == company_id,
            Person.primary_role.in_(['CEO', 'CTO', 'Founder', 'Co-Founder', 'President', 'FOUNDER'])
        )
        founders = session.exec(query).all()
    
    return founders


@router.post("/company/{company_id}", response_model=PersonRead)
def add_person_to_company(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    company_id: str,
    person_in: PersonCreate
):
    """Add a person to a specific company."""
    # Verify company exists
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Override company_id from URL
    person_data = person_in.dict()
    person_data["company_id"] = company_id
    person_data["created_at"] = datetime.utcnow()
    person_data["updated_at"] = datetime.utcnow()
    
    if current_user:
        person_data["created_by"] = current_user.id
    
    # Validate role if provided
    if person_data.get("primary_role") and person_data["primary_role"] not in PERSON_ROLES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid role. Must be one of: {list(PERSON_ROLES.keys())}"
        )
    
    person = Person(**person_data)
    session.add(person)
    session.commit()
    session.refresh(person)
    
    return person