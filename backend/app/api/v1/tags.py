from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func
from typing import List, Optional
from datetime import datetime

from ...database import get_session
from ...models import (
    Tag, TagCreate, TagUpdate, TagRead, TagReadWithUsage, TAG_CATEGORIES,
    CompanyTag, DealTag, PersonTag, Company, Deal, Person
)
from ...core.auth import get_current_user_optional
from ...models.users import User

router = APIRouter()


@router.get("/", response_model=List[TagReadWithUsage])
def list_tags(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    category: Optional[str] = Query(None, description="Filter by category"),
    skip: int = Query(0, ge=0, description="Number of tags to skip"),
    limit: int = Query(100, le=1000, description="Number of tags to return")
):
    """List all tags with usage statistics."""
    query = select(Tag)
    
    if category:
        query = query.where(Tag.category == category)
    
    query = query.offset(skip).limit(limit)
    tags = session.exec(query).all()
    
    # Add usage statistics
    result = []
    for tag in tags:
        # Count usage across entities
        companies_count = session.scalar(
            select(func.count(CompanyTag.company_id)).where(CompanyTag.tag_id == tag.id)
        ) or 0
        deals_count = session.scalar(
            select(func.count(DealTag.deal_id)).where(DealTag.tag_id == tag.id)
        ) or 0
        persons_count = session.scalar(
            select(func.count(PersonTag.person_id)).where(PersonTag.tag_id == tag.id)
        ) or 0
        
        tag_dict = tag.dict()
        tag_dict.update({
            "companies_count": companies_count,
            "deals_count": deals_count,
            "persons_count": persons_count
        })
        
        result.append(TagReadWithUsage(**tag_dict))
    
    return result


@router.get("/categories", response_model=dict)
def get_tag_categories():
    """Get available tag categories."""
    return {"categories": TAG_CATEGORIES}


@router.get("/{tag_id}", response_model=TagRead)
def get_tag(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    tag_id: str
):
    """Get a specific tag by ID."""
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    return tag


@router.post("/", response_model=TagRead)
def create_tag(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    tag_in: TagCreate
):
    """Create a new tag."""
    # Validate category
    if tag_in.category not in TAG_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {list(TAG_CATEGORIES.keys())}"
        )
    
    # Check if tag name already exists (case insensitive)
    existing_tag = session.exec(
        select(Tag).where(func.lower(Tag.name) == tag_in.name.lower())
    ).first()
    
    if existing_tag:
        raise HTTPException(
            status_code=400,
            detail="Tag with this name already exists"
        )
    
    tag_data = tag_in.dict()
    tag_data["created_at"] = datetime.utcnow()
    tag_data["usage_count"] = 0
    
    if current_user:
        tag_data["created_by"] = current_user.id
    
    tag = Tag(**tag_data)
    session.add(tag)
    session.commit()
    session.refresh(tag)
    
    return tag


@router.put("/{tag_id}", response_model=TagRead)
def update_tag(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    tag_id: str,
    tag_in: TagUpdate
):
    """Update a tag."""
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Validate category if provided
    if tag_in.category and tag_in.category not in TAG_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {list(TAG_CATEGORIES.keys())}"
        )
    
    # Check name uniqueness if name is being updated
    if tag_in.name and tag_in.name.lower() != tag.name.lower():
        existing_tag = session.exec(
            select(Tag).where(func.lower(Tag.name) == tag_in.name.lower())
        ).first()
        
        if existing_tag:
            raise HTTPException(
                status_code=400,
                detail="Tag with this name already exists"
            )
    
    tag_data = tag_in.dict(exclude_unset=True)
    
    for field, value in tag_data.items():
        setattr(tag, field, value)
    
    session.add(tag)
    session.commit()
    session.refresh(tag)
    
    return tag


@router.delete("/{tag_id}")
def delete_tag(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    tag_id: str
):
    """Delete a tag."""
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Check if tag is in use
    companies_using = session.scalar(
        select(func.count(CompanyTag.company_id)).where(CompanyTag.tag_id == tag_id)
    ) or 0
    deals_using = session.scalar(
        select(func.count(DealTag.deal_id)).where(DealTag.tag_id == tag_id)
    ) or 0
    persons_using = session.scalar(
        select(func.count(PersonTag.person_id)).where(PersonTag.tag_id == tag_id)
    ) or 0
    
    total_usage = companies_using + deals_using + persons_using
    
    if total_usage > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete tag. It is used by {total_usage} entities. Remove all associations first."
        )
    
    session.delete(tag)
    session.commit()
    
    return {"message": "Tag deleted successfully"}


# Company tagging endpoints
@router.post("/companies/{company_id}/tags/{tag_id}")
def assign_tag_to_company(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    company_id: str,
    tag_id: str
):
    """Assign a tag to a company."""
    # Verify company and tag exist
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    tag = session.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Check if association already exists
    existing = session.exec(
        select(CompanyTag).where(
            CompanyTag.company_id == company_id,
            CompanyTag.tag_id == tag_id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Tag already assigned to company")
    
    # Create association
    company_tag = CompanyTag(
        company_id=company_id,
        tag_id=tag_id,
        assigned_at=datetime.utcnow(),
        assigned_by=current_user.id if current_user else None
    )
    
    session.add(company_tag)
    
    # Update tag usage count
    tag.usage_count += 1
    session.add(tag)
    
    session.commit()
    
    return {"message": "Tag assigned to company successfully"}


@router.delete("/companies/{company_id}/tags/{tag_id}")
def remove_tag_from_company(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    company_id: str,
    tag_id: str
):
    """Remove a tag from a company."""
    # Find association
    association = session.exec(
        select(CompanyTag).where(
            CompanyTag.company_id == company_id,
            CompanyTag.tag_id == tag_id
        )
    ).first()
    
    if not association:
        raise HTTPException(status_code=404, detail="Tag not assigned to company")
    
    session.delete(association)
    
    # Update tag usage count
    tag = session.get(Tag, tag_id)
    if tag and tag.usage_count > 0:
        tag.usage_count -= 1
        session.add(tag)
    
    session.commit()
    
    return {"message": "Tag removed from company successfully"}


@router.get("/companies/{company_id}", response_model=List[TagRead])
def get_company_tags(
    *,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user_optional),
    company_id: str
):
    """Get all tags for a specific company."""
    company = session.get(Company, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    query = select(Tag).join(CompanyTag).where(CompanyTag.company_id == company_id)
    tags = session.exec(query).all()
    
    return tags