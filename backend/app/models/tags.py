from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


# Tag category constants for validation
TAG_CATEGORIES = {
    "SECTOR": "Industry/sector tags (fintech, defi, ai)",
    "STAGE": "Development stage (mvp, product, scaling)", 
    "THEME": "Investment themes (web3, climate, health)",
    "GEOGRAPHY": "Location tags (us, europe, asia)",
    "STATUS": "Deal status tags (hot, cold, watchlist)",
    "CUSTOM": "User-defined custom tags"
}


class TagBase(SQLModel):
    """Base tag model with shared fields."""
    name: str = Field(max_length=50, index=True)
    description: Optional[str] = Field(default=None, max_length=255)
    category: str = Field(default="CUSTOM", max_length=20)
    color: Optional[str] = Field(default=None, max_length=7)  # Hex color code


class Tag(TagBase, table=True):
    """Tag model for categorizing entities."""
    __tablename__ = "tags"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = Field(default=None, foreign_key="users.id")
    
    # Usage tracking
    usage_count: int = Field(default=0)  # Auto-incremented when assigned
    
    # Relationships will be defined after all classes are created


# Association tables for many-to-many relationships
class CompanyTag(SQLModel, table=True):
    """Association table for Company-Tag many-to-many."""
    __tablename__ = "company_tags"
    
    company_id: str = Field(foreign_key="companies.id", primary_key=True)
    tag_id: str = Field(foreign_key="tags.id", primary_key=True)
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_by: Optional[str] = Field(default=None, foreign_key="users.id")


class DealTag(SQLModel, table=True):
    """Association table for Deal-Tag many-to-many."""
    __tablename__ = "deal_tags"
    
    deal_id: str = Field(foreign_key="deals.id", primary_key=True)
    tag_id: str = Field(foreign_key="tags.id", primary_key=True)
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_by: Optional[str] = Field(default=None, foreign_key="users.id")


class PersonTag(SQLModel, table=True):
    """Association table for Person-Tag many-to-many."""
    __tablename__ = "person_tags"
    
    person_id: str = Field(foreign_key="persons.id", primary_key=True)
    tag_id: str = Field(foreign_key="tags.id", primary_key=True)
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_by: Optional[str] = Field(default=None, foreign_key="users.id")


class TagCreate(TagBase):
    """Tag creation model."""
    pass


class TagUpdate(SQLModel):
    """Tag update model."""
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None


class TagRead(TagBase):
    """Tag read model with metadata."""
    id: str
    created_at: datetime
    usage_count: int


class TagReadWithUsage(TagRead):
    """Tag read model with usage statistics."""
    companies_count: int = 0
    deals_count: int = 0
    persons_count: int = 0