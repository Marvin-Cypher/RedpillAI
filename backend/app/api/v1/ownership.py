from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime

from ...database import get_session
from ...models import (
    Ownership, OwnershipCreate, OwnershipUpdate, OwnershipRead, OwnershipReadWithDetails,
    OWNERSHIP_TYPES, Company, Person
)
from ...core.auth import get_current_user_optional
from ...models.users import User

router = APIRouter()


@router.get("/", response_model=List[OwnershipReadWithDetails])
def list_ownerships(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    company_id: Optional[str] = Query(None, description="Filter by company ID"),
    person_id: Optional[str] = Query(None, description="Filter by person ID"),
    ownership_type: Optional[str] = Query(None, description="Filter by ownership type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0, description="Number of ownerships to skip"),
    limit: int = Query(100, le=1000, description="Number of ownerships to return")
):
    """List all ownership records with optional filtering."""
    query = select(Ownership)
    
    if company_id:
        query = query.where(Ownership.company_id == company_id)
        
    if person_id:
        query = query.where(Ownership.person_id == person_id)
        
    if ownership_type:
        query = query.where(Ownership.ownership_type == ownership_type)
        
    if is_active is not None:
        query = query.where(Ownership.is_active == is_active)
    
    query = query.offset(skip).limit(limit)
    ownerships = session.exec(query).all()
    
    # Load related data
    result = []
    for ownership in ownerships:
        company = session.get(Company, ownership.company_id)
        person = session.get(Person, ownership.person_id)
        
        ownership_dict = ownership.dict()
        if company:
            ownership_dict["company"] = company.dict()
        if person:
            ownership_dict["person"] = person.dict()
        
        result.append(OwnershipReadWithDetails(**ownership_dict))
    
    return result


@router.get("/types", response_model=dict)
def get_ownership_types():
    """Get available ownership types."""
    return {"types": OWNERSHIP_TYPES}


@router.get("/{ownership_id}", response_model=OwnershipReadWithDetails)
def get_ownership(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    ownership_id: str
):
    """Get a specific ownership record by ID."""
    ownership = session.get(Ownership, ownership_id)
    if not ownership:
        raise HTTPException(status_code=404, detail="Ownership record not found")
    
    # Load related data
    company = session.get(Company, ownership.company_id)
    person = session.get(Person, ownership.person_id)
    
    ownership_dict = ownership.dict()
    if company:
        ownership_dict["company"] = company.dict()
    if person:
        ownership_dict["person"] = person.dict()
    
    return OwnershipReadWithDetails(**ownership_dict)


@router.post("/", response_model=OwnershipRead)
def create_ownership(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    ownership_in: OwnershipCreate
):
    """Create a new ownership record."""
    # Validate ownership type
    if ownership_in.ownership_type not in OWNERSHIP_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid ownership type. Must be one of: {list(OWNERSHIP_TYPES.keys())}"
        )
    
    # Validate company exists
    company = session.get(Company, ownership_in.company_id)
    if not company:
        raise HTTPException(status_code=400, detail="Company not found")
    
    # Validate person exists
    person = session.get(Person, ownership_in.person_id)
    if not person:
        raise HTTPException(status_code=400, detail="Person not found")
    
    # Check for duplicate ownership
    existing = session.exec(
        select(Ownership).where(
            Ownership.company_id == ownership_in.company_id,
            Ownership.person_id == ownership_in.person_id,
            Ownership.ownership_type == ownership_in.ownership_type,
            Ownership.is_active == True
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Active ownership record already exists for this person/company/type combination"
        )
    
    # Validate percentage if provided
    if ownership_in.percentage is not None and (ownership_in.percentage < 0 or ownership_in.percentage > 100):
        raise HTTPException(
            status_code=400,
            detail="Ownership percentage must be between 0 and 100"
        )
    
    ownership_data = ownership_in.dict()
    ownership_data["created_at"] = datetime.utcnow()
    ownership_data["updated_at"] = datetime.utcnow()
    ownership_data["is_active"] = True
    
    if current_user:
        ownership_data["created_by"] = current_user.id
    
    ownership = Ownership(**ownership_data)
    session.add(ownership)
    session.commit()
    session.refresh(ownership)
    
    return ownership


@router.put("/{ownership_id}", response_model=OwnershipRead)
def update_ownership(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    ownership_id: str,
    ownership_in: OwnershipUpdate
):
    """Update an ownership record."""
    ownership = session.get(Ownership, ownership_id)
    if not ownership:
        raise HTTPException(status_code=404, detail="Ownership record not found")
    
    # Validate ownership type if provided
    if ownership_in.ownership_type and ownership_in.ownership_type not in OWNERSHIP_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid ownership type. Must be one of: {list(OWNERSHIP_TYPES.keys())}"
        )
    
    # Validate percentage if provided
    if ownership_in.percentage is not None and (ownership_in.percentage < 0 or ownership_in.percentage > 100):
        raise HTTPException(
            status_code=400,
            detail="Ownership percentage must be between 0 and 100"
        )
    
    ownership_data = ownership_in.dict(exclude_unset=True)
    ownership_data["updated_at"] = datetime.utcnow()
    
    for field, value in ownership_data.items():
        setattr(ownership, field, value)
    
    session.add(ownership)
    session.commit()
    session.refresh(ownership)
    
    return ownership


@router.delete("/{ownership_id}")
def delete_ownership(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    ownership_id: str
):
    """Delete an ownership record."""
    ownership = session.get(Ownership, ownership_id)
    if not ownership:
        raise HTTPException(status_code=404, detail="Ownership record not found")
    
    session.delete(ownership)
    session.commit()
    
    return {"message": "Ownership record deleted successfully"}


@router.get("/company/{company_id}", response_model=List[OwnershipReadWithDetails])
def get_company_ownership(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    company_id: str,
    is_active: Optional[bool] = Query(True, description="Filter by active status")
):
    """Get all ownership records for a specific company."""
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    query = select(Ownership).where(Ownership.company_id == company_id)
    
    if is_active is not None:
        query = query.where(Ownership.is_active == is_active)
    
    ownerships = session.exec(query).all()
    
    # Load person data
    result = []
    for ownership in ownerships:
        person = session.get(Person, ownership.person_id)
        
        ownership_dict = ownership.dict()
        ownership_dict["company"] = company.dict()
        if person:
            ownership_dict["person"] = person.dict()
        
        result.append(OwnershipReadWithDetails(**ownership_dict))
    
    return result


@router.get("/person/{person_id}", response_model=List[OwnershipReadWithDetails])
def get_person_ownership(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    person_id: str,
    is_active: Optional[bool] = Query(True, description="Filter by active status")
):
    """Get all ownership records for a specific person."""
    person = session.get(Person, person_id)
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    query = select(Ownership).where(Ownership.person_id == person_id)
    
    if is_active is not None:
        query = query.where(Ownership.is_active == is_active)
    
    ownerships = session.exec(query).all()
    
    # Load company data
    result = []
    for ownership in ownerships:
        company = session.get(Company, ownership.company_id)
        
        ownership_dict = ownership.dict()
        ownership_dict["person"] = person.dict()
        if company:
            ownership_dict["company"] = company.dict()
        
        result.append(OwnershipReadWithDetails(**ownership_dict))
    
    return result


@router.post("/company/{company_id}/cap-table", response_model=List[OwnershipReadWithDetails])
def get_company_cap_table(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    company_id: str,
    share_class: Optional[str] = Query(None, description="Filter by share class")
):
    """Get company cap table with ownership breakdown."""
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    query = select(Ownership).where(
        Ownership.company_id == company_id,
        Ownership.is_active == True
    )
    
    if share_class:
        query = query.where(Ownership.share_class == share_class)
    
    # Order by ownership percentage (descending) and then by ownership type
    query = query.order_by(Ownership.percentage.desc(), Ownership.ownership_type)
    
    ownerships = session.exec(query).all()
    
    # Load person data and add company info
    result = []
    for ownership in ownerships:
        person = session.get(Person, ownership.person_id)
        
        ownership_dict = ownership.dict()
        ownership_dict["company"] = company.dict()
        if person:
            ownership_dict["person"] = person.dict()
        
        result.append(OwnershipReadWithDetails(**ownership_dict))
    
    return result