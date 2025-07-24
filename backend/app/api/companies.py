from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select

from ..database import get_db
from ..models.companies import Company, CompanyCreate, CompanyUpdate, CompanyRead, CompanySector
from ..models.users import User
from ..core.auth import get_current_active_user

router = APIRouter()


@router.post("/", response_model=CompanyRead)
async def create_company(
    company: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new company."""
    db_company = Company(**company.model_dump())
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company


@router.get("/", response_model=List[CompanyRead])
async def list_companies(
    sector: Optional[CompanySector] = Query(None, description="Filter by sector"),
    search: Optional[str] = Query(None, description="Search by name"),
    skip: int = Query(0, ge=0, description="Number of companies to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of companies to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List companies with optional filtering."""
    statement = select(Company)
    
    # Apply filters
    if sector:
        statement = statement.where(Company.sector == sector)
    
    if search:
        statement = statement.where(Company.name.ilike(f"%{search}%"))
    
    # Add pagination
    statement = statement.offset(skip).limit(limit)
    
    companies = db.exec(statement).all()
    return companies


@router.get("/{company_id}", response_model=CompanyRead)
async def get_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific company by ID."""
    statement = select(Company).where(Company.id == company_id)
    company = db.exec(statement).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    return company


@router.put("/{company_id}", response_model=CompanyRead)
async def update_company(
    company_id: str,
    company_update: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a company."""
    statement = select(Company).where(Company.id == company_id)
    db_company = db.exec(statement).first()
    
    if not db_company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Update fields
    update_data = company_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_company, field, value)
    
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    
    return db_company


@router.delete("/{company_id}")
async def delete_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a company."""
    statement = select(Company).where(Company.id == company_id)
    company = db.exec(statement).first()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    db.delete(company)
    db.commit()
    
    return {"message": "Company deleted successfully"}


@router.get("/sectors/list")
async def list_sectors(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of available company sectors."""
    return {
        "sectors": [sector.value for sector in CompanySector],
        "descriptions": {
            "defi": "Decentralized Finance",
            "infrastructure": "Blockchain Infrastructure",
            "layer1": "Layer 1 Blockchains",
            "layer2": "Layer 2 Scaling Solutions", 
            "gaming": "Blockchain Gaming",
            "nfts": "NFTs and Digital Collectibles",
            "tools": "Developer Tools and APIs",
            "privacy": "Privacy and Security",
            "trading": "Trading and DEXs",
            "lending": "Lending and Credit",
            "derivatives": "Derivatives and Futures",
            "oracles": "Oracle Networks",
            "dao": "DAOs and Governance",
            "metaverse": "Metaverse and Virtual Worlds",
            "ai": "AI and Machine Learning",
            "other": "Other"
        }
    }