from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from sqlalchemy import Text
import uuid


# Person role constants for validation
PERSON_ROLES = {
    "FOUNDER": "Company founder",
    "CO_FOUNDER": "Company co-founder",
    "CEO": "Chief Executive Officer",
    "CTO": "Chief Technology Officer", 
    "CFO": "Chief Financial Officer",
    "VP_ENGINEERING": "VP of Engineering",
    "VP_PRODUCT": "VP of Product",
    "VP_MARKETING": "VP of Marketing",
    "ADVISOR": "Company advisor",
    "BOARD_MEMBER": "Board member",
    "EMPLOYEE": "Company employee",
    "INVESTOR": "Investor",
    "OTHER": "Other role"
}


class PersonBase(SQLModel):
    """Base person model with shared fields."""
    name: str = Field(max_length=255, index=True)
    title: Optional[str] = Field(default=None, max_length=255)
    email: Optional[str] = Field(default=None, max_length=255)
    linkedin_url: Optional[str] = Field(default=None, max_length=255) 
    twitter_handle: Optional[str] = Field(default=None, max_length=50)
    github_username: Optional[str] = Field(default=None, max_length=50)
    bio: Optional[str] = None
    avatar_url: Optional[str] = Field(default=None, max_length=255)
    location: Optional[str] = Field(default=None, max_length=100)
    
    # Talent Tracking Fields
    is_tracked: bool = Field(default=False, index=True)
    track_reason: Optional[str] = None
    is_founder: bool = Field(default=False, index=True)
    founder_since: Optional[datetime] = None
    startup_stage: Optional[str] = None  # ideation, building, launched, funded
    
    # Activity Signals
    last_activity_check: Optional[datetime] = None
    activity_signals: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    signal_strength: Optional[float] = None  # 0-100 current activity signal
    
    # Professional Background
    previous_companies: Optional[List[Dict[str, Any]]] = Field(default=None, sa_column=Column(JSON))
    expertise_areas: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    achievements: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))


class Person(PersonBase, table=True):
    """Person model for founders, executives, contacts."""
    __tablename__ = "persons"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    
    # Primary company affiliation (nullable for flexible relationships)
    company_id: Optional[str] = Field(
        default=None, 
        foreign_key="companies.id", 
        index=True
    )
    
    # Role at primary company
    primary_role: Optional[str] = Field(default=None, max_length=50)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    
    # Data source tracking
    source: Optional[str] = Field(default="manual")  # "manual", "tavily", "exa", "linkedin"
    confidence_score: Optional[int] = Field(default=None, ge=0, le=100)
    
    # Relationships
    company: Optional["Company"] = Relationship(back_populates="people")
    deals_as_contact: List["Deal"] = Relationship(back_populates="contact_person")
    ownerships: List["Ownership"] = Relationship(back_populates="person")


class PersonCreate(PersonBase):
    """Person creation model."""
    company_id: Optional[str] = None
    primary_role: Optional[str] = None


class PersonUpdate(SQLModel):
    """Person update model."""
    name: Optional[str] = None
    title: Optional[str] = None
    email: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_handle: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    location: Optional[str] = None
    primary_role: Optional[str] = None
    confidence_score: Optional[int] = None


class PersonRead(PersonBase):
    """Person read model with metadata."""
    id: str
    company_id: Optional[str]
    primary_role: Optional[str]
    created_at: datetime
    updated_at: datetime
    source: Optional[str]
    confidence_score: Optional[int]
    

class PersonReadWithCompany(PersonRead):
    """Person read model with company details."""
    company: Optional["CompanyRead"] = None


class PersonReadWithOwnerships(PersonRead):
    """Person read model with ownership details."""
    ownerships: List["OwnershipRead"] = []