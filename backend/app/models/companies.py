from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class CompanyType(str, Enum):
    """Company type for determining investment classification and data enrichment strategy."""
    PUBLIC = "PUBLIC"        # Public companies - use stock APIs, show stock data
    CRYPTO = "CRYPTO"        # Blockchain/crypto companies - use CoinGecko, show token data
    PRIVATE = "PRIVATE"      # Private companies - use company database, show private metrics


class CompanySector(str, Enum):
    """Company sectors/categories for all company types."""
    # AI & Technology
    AI = "ai"
    MACHINE_LEARNING = "machine_learning"
    SEMICONDUCTORS = "semiconductors"
    CLOUD_INFRASTRUCTURE = "cloud_infrastructure"
    CYBERSECURITY = "cybersecurity"
    
    # Crypto/Blockchain (previously separate)
    DEFI = "defi"
    INFRASTRUCTURE = "infrastructure"
    LAYER1 = "layer1"
    LAYER2 = "layer2"
    GAMING = "gaming"
    NFTS = "nfts"
    TOOLS = "tools"
    PRIVACY = "privacy"
    TRADING = "trading"
    LENDING = "lending"
    DERIVATIVES = "derivatives"
    ORACLES = "oracles"
    DAO = "dao"
    METAVERSE = "metaverse"
    
    # Traditional Sectors
    FINTECH = "fintech"
    HEALTHCARE = "healthcare"
    ECOMMERCE = "ecommerce"
    ENTERPRISE_SOFTWARE = "enterprise_software"
    CONSUMER_APPS = "consumer_apps"
    CLEANTECH = "cleantech"
    BIOTECH = "biotech"
    MOBILITY = "mobility"
    
    # General
    OTHER = "other"


class CompanyBase(SQLModel):
    """Base company model with shared fields."""
    name: str = Field(max_length=255, index=True)
    description: Optional[str] = None
    website: Optional[str] = Field(default=None, max_length=255)
    company_type: CompanyType = Field(default=CompanyType.PRIVATE)
    sector: str = Field(default="other")
    token_symbol: Optional[str] = Field(default=None, max_length=10)
    twitter_handle: Optional[str] = Field(default=None, max_length=50)
    github_repo: Optional[str] = Field(default=None, max_length=255)
    whitepaper_url: Optional[str] = Field(default=None, max_length=255)
    founded_year: Optional[int] = None
    employee_count: Optional[str] = Field(default=None, max_length=50)
    headquarters: Optional[str] = Field(default=None, max_length=100)
    logo_url: Optional[str] = Field(default=None, max_length=255)


class Company(CompanyBase, table=True):
    """Company model for database."""
    __tablename__ = "companies"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # User assignment fields
    created_by: Optional[str] = Field(default=None, foreign_key="users.id", index=True)
    owner_user_id: Optional[str] = Field(default=None, foreign_key="users.id", index=True)
    
    # Enriched data fields
    enriched_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    market_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    key_metrics: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    # Data freshness tracking
    data_last_refreshed: Optional[datetime] = Field(default=None)
    tavily_last_updated: Optional[datetime] = Field(default=None)
    market_data_last_updated: Optional[datetime] = Field(default=None)
    
    # Relationships
    deals: List["Deal"] = Relationship(back_populates="company")
    conversations: List["Conversation"] = Relationship(back_populates="company")
    people: List["Person"] = Relationship(back_populates="company")
    ownerships: List["Ownership"] = Relationship(back_populates="company")


class CompanyCreate(CompanyBase):
    """Company creation model."""
    pass


class CompanyUpdate(SQLModel):
    """Company update model."""
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    company_type: Optional[CompanyType] = None
    sector: Optional[CompanySector] = None
    token_symbol: Optional[str] = None
    twitter_handle: Optional[str] = None
    github_repo: Optional[str] = None
    whitepaper_url: Optional[str] = None
    founded_year: Optional[int] = None
    team_size: Optional[int] = None
    headquarters: Optional[str] = None


class CompanyRead(CompanyBase):
    """Company read model with metadata."""
    id: str
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None
    owner_user_id: Optional[str] = None
    data_last_refreshed: Optional[datetime] = None


class CompanyDetailed(CompanyRead):
    """Detailed company model with relationships."""
    # Structured relationship data
    founders: Optional[List[Dict[str, Any]]] = None
    key_people: Optional[List[Dict[str, Any]]] = None
    tags: Optional[List[Dict[str, Any]]] = None
    deals: Optional[List[Dict[str, Any]]] = None
    ownership_structure: Optional[List[Dict[str, Any]]] = None
    recent_activities: Optional[List[Dict[str, Any]]] = None
    
    # Multi-source data attribution
    data_sources: Optional[List[Dict[str, Any]]] = None
    data_freshness: Optional[Dict[str, str]] = None
    
    # Market & financial data
    market_data: Optional[Dict[str, Any]] = None
    recent_news: Optional[List[Dict[str, Any]]] = None
    
    # Talent intelligence metrics
    talent_metrics: Optional[Dict[str, Any]] = None
    
    # AI-generated insights
    ai_insights: Optional[Dict[str, Any]] = None
    
    # Legacy compatibility
    enriched_data: Optional[Dict[str, Any]] = None
    key_metrics: Optional[Dict[str, Any]] = None