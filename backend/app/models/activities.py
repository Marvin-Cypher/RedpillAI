from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import uuid
from sqlalchemy import Column, JSON


# Activity type constants for validation
ACTIVITY_TYPES = {
    # Company activities
    "COMPANY_CREATED": "Company created",
    "COMPANY_UPDATED": "Company updated", 
    "COMPANY_VIEWED": "Company viewed",
    "COMPANY_TAGGED": "Company tagged",
    "COMPANY_UNTAGGED": "Company untagged",
    # Deal activities
    "DEAL_CREATED": "Deal created",
    "DEAL_UPDATED": "Deal updated",
    "DEAL_STATUS_CHANGED": "Deal status changed",
    "DEAL_VIEWED": "Deal viewed",
    "DEAL_TAGGED": "Deal tagged",
    # Person activities  
    "PERSON_CREATED": "Person created",
    "PERSON_UPDATED": "Person updated",
    "PERSON_CONTACTED": "Person contacted",
    # Meeting activities
    "MEETING_SCHEDULED": "Meeting scheduled",
    "MEETING_COMPLETED": "Meeting completed",
    "MEETING_CANCELLED": "Meeting cancelled",
    # Document activities
    "DOCUMENT_UPLOADED": "Document uploaded",
    "DOCUMENT_ANALYZED": "Document analyzed",
    # Research activities
    "RESEARCH_MEMO_GENERATED": "Research memo generated",
    "RESEARCH_MEMO_REVIEWED": "Research memo reviewed",
    # Communication activities
    "EMAIL_SENT": "Email sent",
    "NOTE_ADDED": "Note added",
    # System activities
    "DATA_REFRESHED": "Data refreshed",
    "INTEGRATION_SYNCED": "Integration synced"
}


class ActivityBase(SQLModel):
    """Base activity model with shared fields."""
    activity_type: str = Field(max_length=50)
    title: str = Field(max_length=255)  # Human-readable activity title
    description: Optional[str] = None   # Detailed description
    activity_metadata: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    

class Activity(ActivityBase, table=True):
    """Activity log for tracking all interactions and changes."""
    __tablename__ = "activities"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    
    # Polymorphic entity reference (one of these will be set)
    company_id: Optional[str] = Field(default=None, foreign_key="companies.id", index=True)
    deal_id: Optional[str] = Field(default=None, foreign_key="deals.id", index=True)
    person_id: Optional[str] = Field(default=None, foreign_key="persons.id", index=True)
    
    # Actor who performed the activity
    performed_by: Optional[str] = Field(default=None, foreign_key="users.id", index=True)
    performed_by_system: Optional[str] = Field(default=None)  # For system/AI activities
    
    # Timestamps
    occurred_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships (optional, based on which entity this relates to)
    company: Optional["Company"] = Relationship()
    deal: Optional["Deal"] = Relationship()  
    person: Optional["Person"] = Relationship()
    user: Optional["User"] = Relationship()


class ActivityCreate(ActivityBase):
    """Activity creation model."""
    company_id: Optional[str] = None
    deal_id: Optional[str] = None
    person_id: Optional[str] = None
    performed_by: Optional[str] = None
    performed_by_system: Optional[str] = None
    occurred_at: Optional[datetime] = None


class ActivityRead(ActivityBase):
    """Activity read model with metadata."""
    id: str
    company_id: Optional[str]
    deal_id: Optional[str] 
    person_id: Optional[str]
    performed_by: Optional[str]
    performed_by_system: Optional[str]
    occurred_at: datetime
    created_at: datetime


class ActivityReadWithDetails(ActivityRead):
    """Activity read model with related entity details."""
    company: Optional["CompanyRead"] = None
    deal: Optional["DealRead"] = None
    person: Optional["PersonRead"] = None
    user: Optional["UserRead"] = None


# Helper models for activity filtering
class ActivityFilter(SQLModel):
    """Filter model for activity queries."""
    activity_types: Optional[List[str]] = None
    company_id: Optional[str] = None
    deal_id: Optional[str] = None
    person_id: Optional[str] = None
    performed_by: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    limit: Optional[int] = Field(default=50, le=1000)
    offset: Optional[int] = Field(default=0)