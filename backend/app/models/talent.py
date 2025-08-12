"""
Talent Intelligence Models for RedPill CRM
Handles talent profiles, achievements, and multi-platform data
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import Field, SQLModel, Relationship, JSON, Column
from sqlalchemy.dialects.postgresql import JSON as PostgreSQL_JSON
import uuid

# Talent Categories Constants
TALENT_CATEGORIES = {
    "EX_FAANG": "Former FAANG employee",
    "EX_OPENAI": "Former OpenAI team member",
    "EX_ANTHROPIC": "Former Anthropic team member", 
    "EX_DEEPMIND": "Former DeepMind team member",
    "SERIAL_FOUNDER": "Serial entrepreneur",
    "HACKATHON_WINNER": "Hackathon winner",
    "OSS_CONTRIBUTOR": "Open source contributor",
    "CONFERENCE_SPEAKER": "Conference speaker",
    "PUBLISHED_AUTHOR": "Published author",
    "TOP_UNIVERSITY": "Top university graduate",
    "VC_BACKED_FOUNDER": "VC-backed founder",
    "ACQUIHIRE": "Previously acquihired",
    "PATENT_HOLDER": "Patent holder",
    "KAGGLE_MASTER": "Kaggle master/grandmaster",
    "YC_ALUM": "Y Combinator alumnus",
    "THIEL_FELLOW": "Thiel Fellowship recipient",
}

# Achievement Types Constants
ACHIEVEMENT_TYPES = {
    "HACKATHON": "Hackathon participation/win",
    "PUBLICATION": "Academic/industry publication",
    "OPEN_SOURCE": "Open source contribution",
    "SPEAKING": "Conference speaking",
    "AWARD": "Award or recognition",
    "PATENT": "Patent filing/grant",
    "STARTUP": "Startup founding",
    "EXIT": "Successful exit",
    "CERTIFICATION": "Professional certification",
    "COMPETITION": "Competition win",
}

# Platform Types Constants
PLATFORM_TYPES = {
    "LINKEDIN": "LinkedIn",
    "GITHUB": "GitHub",
    "TWITTER": "Twitter/X",
    "ANGELLIST": "AngelList",
    "CRUNCHBASE": "Crunchbase",
    "PRODUCTHUNT": "Product Hunt",
    "STACKOVERFLOW": "Stack Overflow",
    "MEDIUM": "Medium",
    "SUBSTACK": "Substack",
    "YOUTUBE": "YouTube",
}

# Verification Status Constants
VERIFICATION_STATUS = {
    "VERIFIED": "Verified",
    "UNVERIFIED": "Unverified",
    "DISPUTED": "Disputed",
    "PENDING": "Pending verification",
}


# Base models for API operations
class TalentProfileBase(SQLModel):
    """Base model for talent profile data"""
    is_talent: bool = Field(default=False, description="Whether person is classified as talent")
    talent_score: Optional[float] = Field(default=None, ge=0, le=100, description="AI-calculated talent score")
    talent_categories: Optional[List[str]] = Field(default=None, sa_column=Column(PostgreSQL_JSON), description="List of talent categories")
    manual_classification: Optional[str] = Field(default=None, max_length=500, description="User-defined talent classification")
    suggested_by_ai: bool = Field(default=False, description="Whether suggested by AI")
    suggestion_confidence: Optional[float] = Field(default=None, ge=0, le=1, description="AI suggestion confidence")
    achievement_summary: Optional[str] = Field(default=None, description="Summary of key achievements")
    career_highlights: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(PostgreSQL_JSON), description="Notable career highlights")


class PersonProfessionalBase(SQLModel):
    """Base model for professional profile data"""
    linkedin_url: Optional[str] = Field(default=None, max_length=500)
    github_url: Optional[str] = Field(default=None, max_length=500)
    twitter_url: Optional[str] = Field(default=None, max_length=500)
    personal_website: Optional[str] = Field(default=None, max_length=500)
    current_title: Optional[str] = Field(default=None, max_length=200)
    current_company: Optional[str] = Field(default=None, max_length=200)
    experience_years: Optional[int] = Field(default=None, ge=0)
    previous_roles: Optional[List[Dict[str, Any]]] = Field(default=None, sa_column=Column(PostgreSQL_JSON), description="Previous work experience")
    education: Optional[List[Dict[str, Any]]] = Field(default=None, sa_column=Column(PostgreSQL_JSON), description="Educational background")
    skills: Optional[List[str]] = Field(default=None, sa_column=Column(PostgreSQL_JSON), description="Professional skills")
    languages: Optional[List[str]] = Field(default=None, sa_column=Column(PostgreSQL_JSON), description="Programming/spoken languages")
    professional_summary: Optional[str] = Field(default=None, description="Professional bio/summary")
    location: Optional[str] = Field(default=None, max_length=200)
    remote_preference: Optional[bool] = Field(default=None)


class AchievementBase(SQLModel):
    """Base model for achievement data"""
    achievement_type: str = Field(description="Type of achievement")
    title: str = Field(max_length=500, description="Achievement title")
    description: Optional[str] = Field(default=None, description="Detailed description")
    date_achieved: Optional[datetime] = Field(default=None)
    source_url: Optional[str] = Field(default=None, max_length=1000)
    verification_status: str = Field(default="UNVERIFIED", max_length=50)
    impact_score: Optional[float] = Field(default=None, ge=0, le=100, description="Impact/importance score")
    tags: Optional[List[str]] = Field(default=None, sa_column=Column(PostgreSQL_JSON), description="Achievement tags")
    achievement_metadata: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(PostgreSQL_JSON), description="Additional metadata")


class PlatformProfileBase(SQLModel):
    """Base model for platform profile data"""
    platform: str = Field(max_length=50, description="Platform name")
    profile_url: str = Field(max_length=1000, description="Profile URL")
    username: Optional[str] = Field(default=None, max_length=200)
    display_name: Optional[str] = Field(default=None, max_length=200)
    followers_count: Optional[int] = Field(default=None, ge=0)
    following_count: Optional[int] = Field(default=None, ge=0)
    posts_count: Optional[int] = Field(default=None, ge=0)
    engagement_score: Optional[float] = Field(default=None, ge=0, description="Platform engagement score")
    verified_account: bool = Field(default=False)
    bio: Optional[str] = Field(default=None, description="Profile bio/description")
    last_activity: Optional[datetime] = Field(default=None)
    profile_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(PostgreSQL_JSON), description="Platform-specific data")
    scrape_frequency: str = Field(default="weekly", max_length=50)


class DataSourceBase(SQLModel):
    """Base model for data source tracking"""
    source_name: str = Field(max_length=100, description="Data source name")
    source_type: str = Field(max_length=50, description="Type of source (api, scraper, manual)")
    source_url: Optional[str] = Field(default=None, max_length=1000)
    api_identifier: Optional[str] = Field(default=None, max_length=200)
    confidence_score: Optional[float] = Field(default=None, ge=0, le=1)
    data_quality: Optional[str] = Field(default=None, max_length=50)
    is_primary: bool = Field(default=False, description="Whether this is primary source")


# Database models
class TalentProfile(TalentProfileBase, table=True):
    """Talent profile database model"""
    __tablename__ = "talent_profiles"
    
    person_id: str = Field(primary_key=True, foreign_key="persons.id")
    classified_by: Optional[str] = Field(default=None, foreign_key="users.id")
    classified_at: Optional[datetime] = Field(default=None)
    last_scored_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    # person: "Person" = Relationship(back_populates="talent_profile")
    # classifier: Optional["User"] = Relationship()


class PersonProfessional(PersonProfessionalBase, table=True):
    """Professional profile database model"""
    __tablename__ = "person_professionals"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    person_id: str = Field(foreign_key="persons.id", index=True)
    data_sources: List[str] = Field(default_factory=list, sa_column=Column(PostgreSQL_JSON), description="List of data source IDs")
    last_updated_from_sources: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    # person: "Person" = Relationship(back_populates="professional_profile")


class Achievement(AchievementBase, table=True):
    """Achievement database model"""
    __tablename__ = "achievements"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    person_id: str = Field(foreign_key="persons.id", index=True)
    data_source_id: Optional[str] = Field(default=None, foreign_key="data_sources.id")
    verified_by: Optional[str] = Field(default=None, foreign_key="users.id")
    verified_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    # person: "Person" = Relationship(back_populates="achievements")
    # data_source: Optional["DataSource"] = Relationship()
    # verifier: Optional["User"] = Relationship()


class PlatformProfile(PlatformProfileBase, table=True):
    """Platform profile database model"""
    __tablename__ = "platform_profiles"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    person_id: str = Field(foreign_key="persons.id", index=True)
    data_source_id: Optional[str] = Field(default=None, foreign_key="data_sources.id")
    last_scraped: Optional[datetime] = Field(default=None)
    next_scrape_scheduled: Optional[datetime] = Field(default=None)
    scrape_errors: Optional[List[Dict[str, Any]]] = Field(default=None, sa_column=Column(PostgreSQL_JSON))
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    # person: "Person" = Relationship(back_populates="platform_profiles")
    # data_source: Optional["DataSource"] = Relationship()


class DataSource(DataSourceBase, table=True):
    """Data source tracking database model"""
    __tablename__ = "data_sources"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    last_fetched: Optional[datetime] = Field(default=None)
    fetch_frequency: Optional[str] = Field(default="daily", max_length=50)
    is_active: bool = Field(default=True)
    error_count: int = Field(default=0)
    last_error: Optional[str] = Field(default=None)
    source_metadata: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(PostgreSQL_JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class CompanyDataSourceTalent(SQLModel, table=True):
    """Junction table for company data sources (talent intelligence)"""
    __tablename__ = "company_data_sources_talent"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    company_id: str = Field(foreign_key="companies.id", index=True)
    data_source_id: str = Field(foreign_key="data_sources.id", index=True)
    data_fields: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(PostgreSQL_JSON), description="Data from this source")
    conflict_resolution: Optional[str] = Field(default="latest", max_length=50)
    priority: int = Field(default=0, description="Priority for conflict resolution")
    last_synced: Optional[datetime] = Field(default=None)
    sync_status: Optional[str] = Field(default=None, max_length=50)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PersonDataSource(SQLModel, table=True):
    """Junction table for person data sources"""
    __tablename__ = "person_data_sources"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    person_id: str = Field(foreign_key="persons.id", index=True)
    data_source_id: str = Field(foreign_key="data_sources.id", index=True)
    data_fields: Dict[str, Any] = Field(default_factory=dict, sa_column=Column(PostgreSQL_JSON), description="Data from this source")
    confidence_score: Optional[float] = Field(default=None, ge=0, le=1)
    last_verified: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# API Response models
class TalentProfileRead(TalentProfileBase):
    """Talent profile read model"""
    person_id: str
    classified_by: Optional[str]
    classified_at: Optional[datetime]
    last_scored_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class TalentProfileCreate(TalentProfileBase):
    """Talent profile create model"""
    pass


class TalentProfileUpdate(SQLModel):
    """Talent profile update model"""
    is_talent: Optional[bool] = None
    talent_score: Optional[float] = None
    talent_categories: Optional[List[str]] = None
    manual_classification: Optional[str] = None
    achievement_summary: Optional[str] = None
    career_highlights: Optional[Dict[str, Any]] = None


class PersonProfessionalRead(PersonProfessionalBase):
    """Professional profile read model"""
    id: str
    person_id: str
    data_sources: List[str]
    last_updated_from_sources: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class PersonProfessionalCreate(PersonProfessionalBase):
    """Professional profile create model"""
    person_id: str


class PersonProfessionalUpdate(SQLModel):
    """Professional profile update model"""
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    twitter_url: Optional[str] = None
    personal_website: Optional[str] = None
    current_title: Optional[str] = None
    current_company: Optional[str] = None
    experience_years: Optional[int] = None
    previous_roles: Optional[List[Dict[str, Any]]] = None
    education: Optional[List[Dict[str, Any]]] = None
    skills: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    professional_summary: Optional[str] = None
    location: Optional[str] = None
    remote_preference: Optional[bool] = None


class AchievementRead(AchievementBase):
    """Achievement read model"""
    id: str
    person_id: str
    data_source_id: Optional[str]
    verified_by: Optional[str]
    verified_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class AchievementCreate(AchievementBase):
    """Achievement create model"""
    person_id: str
    data_source_id: Optional[str] = None


class AchievementUpdate(SQLModel):
    """Achievement update model"""
    title: Optional[str] = None
    description: Optional[str] = None
    date_achieved: Optional[datetime] = None
    source_url: Optional[str] = None
    verification_status: Optional[str] = None
    impact_score: Optional[float] = None
    tags: Optional[List[str]] = None
    achievement_metadata: Optional[Dict[str, Any]] = None


class PlatformProfileRead(PlatformProfileBase):
    """Platform profile read model"""
    id: str
    person_id: str
    data_source_id: Optional[str]
    last_scraped: Optional[datetime]
    next_scrape_scheduled: Optional[datetime]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PlatformProfileCreate(PlatformProfileBase):
    """Platform profile create model"""
    person_id: str


class PlatformProfileUpdate(SQLModel):
    """Platform profile update model"""
    profile_url: Optional[str] = None
    username: Optional[str] = None
    display_name: Optional[str] = None
    followers_count: Optional[int] = None
    following_count: Optional[int] = None
    posts_count: Optional[int] = None
    engagement_score: Optional[float] = None
    verified_account: Optional[bool] = None
    bio: Optional[str] = None
    last_activity: Optional[datetime] = None
    profile_data: Optional[Dict[str, Any]] = None
    scrape_frequency: Optional[str] = None


class DataSourceRead(DataSourceBase):
    """Data source read model"""
    id: str
    last_fetched: Optional[datetime]
    fetch_frequency: Optional[str]
    is_active: bool
    error_count: int
    last_error: Optional[str]
    source_metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime


class DataSourceCreate(DataSourceBase):
    """Data source create model"""
    pass


class DataSourceUpdate(SQLModel):
    """Data source update model"""
    source_name: Optional[str] = None
    source_type: Optional[str] = None
    source_url: Optional[str] = None
    api_identifier: Optional[str] = None
    confidence_score: Optional[float] = None
    data_quality: Optional[str] = None
    is_primary: Optional[bool] = None
    fetch_frequency: Optional[str] = None
    is_active: Optional[bool] = None