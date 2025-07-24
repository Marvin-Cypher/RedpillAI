from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime, date
from enum import Enum
from decimal import Decimal
import uuid


class PortfolioStatus(str, Enum):
    """Portfolio company status."""
    ACTIVE = "active"
    EXITED = "exited"
    WRITTEN_OFF = "written_off"
    ACQUIRED = "acquired"
    IPO = "ipo"
    TGE = "tge"  # Token Generation Event


class ExitType(str, Enum):
    """Types of exits."""
    ACQUISITION = "acquisition"
    IPO = "ipo"
    SECONDARY = "secondary"
    BUYBACK = "buyback"
    TOKEN_SALE = "token_sale"
    WRITE_OFF = "write_off"


class PortfolioCompanyBase(SQLModel):
    """Base portfolio company model."""
    entry_date: date
    entry_valuation: Optional[int] = None  # Valuation at entry in USD
    entry_price_per_share: Optional[Decimal] = None
    shares_owned: Optional[int] = None
    ownership_percentage: Optional[Decimal] = Field(default=None, ge=0, le=100)
    liquidation_preference: Optional[str] = None  # "1x non-participating preferred"
    board_seat: bool = Field(default=False)
    pro_rata_rights: bool = Field(default=True)
    status: PortfolioStatus = Field(default=PortfolioStatus.ACTIVE)


class PortfolioCompany(PortfolioCompanyBase, table=True):
    """Portfolio company model."""
    __tablename__ = "portfolio_companies"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    deal_id: str = Field(foreign_key="deals.id", index=True)
    company_id: str = Field(foreign_key="companies.id", index=True)
    current_valuation: Optional[int] = None  # Current valuation estimate
    last_valuation_date: Optional[date] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    company: "Company" = Relationship(back_populates="portfolio_companies")
    performance_metrics: list["PerformanceMetric"] = Relationship(back_populates="portfolio_company")
    distributions: list["Distribution"] = Relationship(back_populates="portfolio_company")


class PortfolioCompanyCreate(PortfolioCompanyBase):
    """Portfolio company creation model."""
    deal_id: str
    company_id: str


class PortfolioCompanyUpdate(SQLModel):
    """Portfolio company update model."""
    current_valuation: Optional[int] = None
    last_valuation_date: Optional[date] = None
    ownership_percentage: Optional[Decimal] = None
    status: Optional[PortfolioStatus] = None


class PortfolioCompanyRead(PortfolioCompanyBase):
    """Portfolio company read model."""
    id: str
    deal_id: str
    company_id: str
    current_valuation: Optional[int] = None
    last_valuation_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime


# Performance metrics
class MetricType(str, Enum):
    """Types of performance metrics."""
    REVENUE = "revenue"
    ARR = "arr"  # Annual Recurring Revenue
    MRR = "mrr"  # Monthly Recurring Revenue
    GMV = "gmv"  # Gross Merchandise Value
    TVL = "tvl"  # Total Value Locked (DeFi)
    ACTIVE_USERS = "active_users"
    TRANSACTION_VOLUME = "transaction_volume"
    TOKEN_PRICE = "token_price"
    MARKET_CAP = "market_cap"
    VALUATION = "valuation"
    BURN_RATE = "burn_rate"
    RUNWAY = "runway"
    TEAM_SIZE = "team_size"
    CUSTOM = "custom"


class PerformanceMetric(SQLModel, table=True):
    """Performance metrics for portfolio companies."""
    __tablename__ = "performance_metrics"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    portfolio_company_id: str = Field(foreign_key="portfolio_companies.id", index=True)
    metric_type: MetricType
    metric_name: Optional[str] = None  # For custom metrics
    value: Decimal
    currency: str = Field(default="USD", max_length=3)
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    source: Optional[str] = None  # Where the data came from
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    portfolio_company: PortfolioCompany = Relationship(back_populates="performance_metrics")


class PerformanceMetricCreate(SQLModel):
    """Performance metric creation model."""
    portfolio_company_id: str
    metric_type: MetricType
    metric_name: Optional[str] = None
    value: Decimal
    currency: str = "USD"
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    source: Optional[str] = None


# Distributions and returns
class Distribution(SQLModel, table=True):
    """Distributions received from portfolio companies."""
    __tablename__ = "distributions"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    portfolio_company_id: str = Field(foreign_key="portfolio_companies.id", index=True)
    distribution_date: date
    amount_usd: Decimal  # Amount in USD
    amount_shares: Optional[int] = None  # Number of shares sold
    distribution_type: str = Field(max_length=50)  # "dividend", "liquidation", "partial_exit"
    share_price: Optional[Decimal] = None
    notes: Optional[str] = None
    
    # Relationships
    portfolio_company: PortfolioCompany = Relationship(back_populates="distributions")


class DistributionCreate(SQLModel):
    """Distribution creation model."""
    portfolio_company_id: str
    distribution_date: date
    amount_usd: Decimal
    amount_shares: Optional[int] = None
    distribution_type: str
    share_price: Optional[Decimal] = None
    notes: Optional[str] = None


# Exit tracking
class Exit(SQLModel, table=True):
    """Exit events for portfolio companies."""
    __tablename__ = "exits"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    portfolio_company_id: str = Field(foreign_key="portfolio_companies.id", index=True)
    exit_date: date
    exit_type: ExitType
    exit_valuation: Optional[int] = None  # Company valuation at exit
    our_proceeds: Optional[Decimal] = None  # Our total proceeds
    shares_sold: Optional[int] = None
    exit_multiple: Optional[Decimal] = None  # Multiple of our investment
    irr: Optional[Decimal] = None  # Internal Rate of Return
    acquirer: Optional[str] = None  # For acquisitions
    notes: Optional[str] = None


# Token tracking for crypto investments
class TokenMetric(SQLModel, table=True):
    """Token-specific metrics for crypto investments."""
    __tablename__ = "token_metrics"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    portfolio_company_id: str = Field(foreign_key="portfolio_companies.id", index=True)
    token_symbol: str = Field(max_length=10, index=True)
    price_usd: Decimal
    market_cap: Optional[int] = None
    volume_24h: Optional[int] = None
    circulating_supply: Optional[int] = None
    total_supply: Optional[int] = None
    fdv: Optional[int] = None  # Fully Diluted Valuation
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    source: str = Field(default="coingecko")  # Data source


class TokenMetricCreate(SQLModel):
    """Token metric creation model."""
    portfolio_company_id: str
    token_symbol: str
    price_usd: Decimal
    market_cap: Optional[int] = None
    volume_24h: Optional[int] = None
    circulating_supply: Optional[int] = None
    total_supply: Optional[int] = None
    fdv: Optional[int] = None
    source: str = "coingecko"