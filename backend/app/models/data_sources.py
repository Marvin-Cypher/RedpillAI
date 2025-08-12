"""
Data source tracking and attribution models
"""

from sqlmodel import SQLModel, Field, Column, JSON
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class SourceType(str, Enum):
    """Types of data sources."""
    API = "API"
    SCRAPER = "SCRAPER" 
    MANUAL = "MANUAL"
    EXA_AI = "EXA_AI"
    TAVILY = "TAVILY"
    COINGECKO = "COINGECKO"
    OPENBB = "OPENBB"
    LINKEDIN = "LINKEDIN"
    GITHUB = "GITHUB"
    TWITTER = "TWITTER"


# Association table for Company-DataSource relationships
class CompanyDataSources(SQLModel, table=True):
    """Association table linking companies to their data sources."""
    __tablename__ = "company_data_sources_new"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    company_id: str = Field(foreign_key="companies.id", index=True)
    data_source_id: str = Field(foreign_key="data_sources.id", index=True)
    
    # Attribution metadata
    confidence_score: Optional[float] = Field(default=None, ge=0, le=1)
    data_fields: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    last_updated: Optional[datetime] = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Association table for Person-DataSource relationships  
class PersonDataSources(SQLModel, table=True):
    """Association table linking persons to their data sources."""
    __tablename__ = "person_data_sources_new"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    person_id: str = Field(foreign_key="persons.id", index=True)
    data_source_id: str = Field(foreign_key="data_sources.id", index=True)
    
    # Attribution metadata
    confidence_score: Optional[float] = Field(default=None, ge=0, le=1)
    data_fields: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    last_updated: Optional[datetime] = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Create/Update/Read models for API responses
class CompanyDataSourceCreate(SQLModel):
    """Model for creating company data source links."""
    company_id: str
    data_source_id: str
    confidence_score: Optional[float] = None
    data_fields: Optional[List[str]] = None
    is_active: bool = True


class CompanyDataSourceUpdate(SQLModel):
    """Model for updating company data source links."""
    confidence_score: Optional[float] = None
    data_fields: Optional[List[str]] = None
    is_active: Optional[bool] = None


class CompanyDataSourceRead(SQLModel):
    """Model for reading company data source links."""
    id: str
    company_id: str
    data_source_id: str
    confidence_score: Optional[float] = None
    data_fields: Optional[List[str]] = None
    last_updated: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PersonDataSourceCreate(SQLModel):
    """Model for creating person data source links."""
    person_id: str
    data_source_id: str
    confidence_score: Optional[float] = None
    data_fields: Optional[List[str]] = None
    is_active: bool = True


class PersonDataSourceUpdate(SQLModel):
    """Model for updating person data source links."""
    confidence_score: Optional[float] = None
    data_fields: Optional[List[str]] = None
    is_active: Optional[bool] = None


class PersonDataSourceRead(SQLModel):
    """Model for reading person data source links."""
    id: str
    person_id: str
    data_source_id: str
    confidence_score: Optional[float] = None
    data_fields: Optional[List[str]] = None
    last_updated: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime