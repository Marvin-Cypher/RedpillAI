from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import BigInteger, Column
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid


# Ownership type constants for validation
OWNERSHIP_TYPES = {
    "FOUNDER": "Company founder",
    "EMPLOYEE": "Company employee",
    "ADVISOR": "Company advisor", 
    "INVESTOR": "Investor in company",
    "BOARD_MEMBER": "Board member",
    "OTHER": "Other ownership type"
}


class OwnershipBase(SQLModel):
    """Base ownership model with shared fields."""
    ownership_type: str = Field(max_length=50)
    percentage: Optional[float] = Field(default=None, ge=0, le=100)  # Percentage ownership
    shares: Optional[int] = Field(default=None, sa_column=Column(BigInteger))  # Number of shares
    share_class: Optional[str] = Field(default="common", max_length=50)  # common, preferred, etc.
    vesting_schedule: Optional[str] = None  # Description of vesting terms
    exercise_price: Optional[float] = Field(default=None)  # For options
    grant_date: Optional[datetime] = None
    notes: Optional[str] = None


class Ownership(OwnershipBase, table=True):
    """Ownership/equity tracking for cap table."""
    __tablename__ = "ownerships"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    
    # Foreign keys
    company_id: str = Field(foreign_key="companies.id", index=True)
    person_id: str = Field(foreign_key="persons.id", index=True)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    
    # Data source tracking
    source: Optional[str] = Field(default="manual")  # "manual", "pitch_deck", "legal_docs"
    confidence_score: Optional[int] = Field(default=None, ge=0, le=100)
    
    # Status
    is_active: bool = Field(default=True)  # False for historical/transferred stakes
    
    # Relationships
    company: "Company" = Relationship(back_populates="ownerships")
    person: "Person" = Relationship(back_populates="ownerships")


class OwnershipCreate(OwnershipBase):
    """Ownership creation model."""
    company_id: str
    person_id: str


class OwnershipUpdate(SQLModel):
    """Ownership update model."""
    ownership_type: Optional[str] = None
    percentage: Optional[float] = None
    shares: Optional[int] = None
    share_class: Optional[str] = None
    vesting_schedule: Optional[str] = None
    exercise_price: Optional[float] = None
    grant_date: Optional[datetime] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    confidence_score: Optional[int] = None


class OwnershipRead(OwnershipBase):
    """Ownership read model with metadata."""
    id: str
    company_id: str
    person_id: str
    created_at: datetime
    updated_at: datetime
    source: Optional[str]
    confidence_score: Optional[int]
    is_active: bool


class OwnershipReadWithDetails(OwnershipRead):
    """Ownership read model with person and company details."""
    person: Optional["PersonRead"] = None
    company: Optional["CompanyRead"] = None