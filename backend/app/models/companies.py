from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


class CompanySector(str, Enum):
    """Company sectors for crypto/blockchain companies."""
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
    AI = "ai"
    OTHER = "other"


class CompanyBase(SQLModel):
    """Base company model with shared fields."""
    name: str = Field(max_length=255, index=True)
    description: Optional[str] = None
    website: Optional[str] = Field(default=None, max_length=255)
    sector: CompanySector = Field(default=CompanySector.OTHER)
    token_symbol: Optional[str] = Field(default=None, max_length=10)
    twitter_handle: Optional[str] = Field(default=None, max_length=50)
    github_repo: Optional[str] = Field(default=None, max_length=255)
    whitepaper_url: Optional[str] = Field(default=None, max_length=255)
    founded_year: Optional[int] = None
    team_size: Optional[int] = None
    headquarters: Optional[str] = Field(default=None, max_length=100)


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
    
    # Relationships
    deals: List["Deal"] = Relationship(back_populates="company")
    portfolio_companies: List["PortfolioCompany"] = Relationship(back_populates="company")


class CompanyCreate(CompanyBase):
    """Company creation model."""
    pass


class CompanyUpdate(SQLModel):
    """Company update model."""
    name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
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