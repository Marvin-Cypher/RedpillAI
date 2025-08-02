"""SQLModel classes for caching system."""

from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import BigInteger, TIMESTAMP, text, JSON
import sqlalchemy as sa
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class CompanyDataCache(SQLModel, table=True):
    """Global company information cache shared across users."""
    __tablename__ = "company_data_cache"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    company_identifier: str = Field(max_length=255, index=True)
    data_type: str = Field(max_length=50, index=True)  # 'profile', 'team', 'funding', 'metrics'
    data_version: int = Field(default=1)
    cached_data: Dict[str, Any] = Field(sa_column=Column('cached_data', type_=JSON))
    source: str = Field(max_length=50)  # 'tavily', 'openbb', 'manual'
    confidence_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    cache_hit_count: int = Field(default=0)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column('created_at', TIMESTAMP, server_default=text('now()'))
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column('updated_at', TIMESTAMP, server_default=text('now()'))
    )
    expires_at: datetime = Field(sa_column=Column('expires_at', TIMESTAMP))
    last_fetched: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column('last_fetched', TIMESTAMP, server_default=text('now()'))
    )
    
    # New parallel processing columns
    last_fetched_static: Optional[datetime] = Field(
        default=None,
        sa_column=Column('last_fetched_static', TIMESTAMP)
    )
    last_fetched_live: Optional[datetime] = Field(
        default=None, 
        sa_column=Column('last_fetched_live', TIMESTAMP)
    )
    data_category: Optional[str] = Field(
        default=None,
        max_length=20  # 'static', 'live', 'mixed'
    )
    parallel_fetch_lock: Optional[datetime] = Field(
        default=None,
        sa_column=Column('parallel_fetch_lock', TIMESTAMP)
    )
    
    # Relationships
    analytics: list["CacheAnalytics"] = Relationship(back_populates="cache_entry")


class CacheAnalytics(SQLModel, table=True):
    """Track cache usage for analytics and optimization."""
    __tablename__ = "cache_analytics"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    cache_entry_id: Optional[str] = Field(
        default=None, 
        foreign_key="company_data_cache.id"
    )
    accessed_by_user: Optional[str] = Field(
        default=None,
        foreign_key="users.id"
    )
    access_timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column('access_timestamp', TIMESTAMP, server_default=text('now()'))
    )
    cache_hit: bool = Field(default=True)
    
    # Relationships
    cache_entry: Optional[CompanyDataCache] = Relationship(back_populates="analytics")


class UserCompanyData(SQLModel, table=True):
    """User-specific private company data."""
    __tablename__ = "user_company_data"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    user_id: str = Field(foreign_key="users.id")
    company_identifier: str = Field(max_length=255)
    data_type: str = Field(max_length=50)  # 'deal', 'notes', 'analysis', 'memo'
    private_data: Dict[str, Any] = Field(sa_column=Column('private_data', type_=JSON))
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column('created_at', TIMESTAMP, server_default=text('now()'))
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column('updated_at', TIMESTAMP, server_default=text('now()'))
    )


class RealtimeDataCache(SQLModel, table=True):
    """Short-lived cache for real-time data like prices and news."""
    __tablename__ = "realtime_data_cache"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    data_key: str = Field(max_length=255, unique=True)  # 'price_BTC', 'news_crypto'
    data_payload: Dict[str, Any] = Field(sa_column=Column('data_payload', type_=JSON))
    source: Optional[str] = Field(default=None, max_length=50)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column('created_at', TIMESTAMP, server_default=text('now()'))
    )
    expires_at: datetime = Field(sa_column=Column('expires_at', TIMESTAMP))


class ApiUsageLog(SQLModel, table=True):
    """Track API usage for cost management and analytics."""
    __tablename__ = "api_usage_log"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    user_id: Optional[str] = Field(
        default=None,
        foreign_key="users.id"
    )
    api_service: str = Field(max_length=50)  # 'tavily', 'openbb', 'coingecko'
    endpoint: Optional[str] = Field(default=None, max_length=100)
    query_params: Optional[Dict[str, Any]] = Field(
        default=None,
        sa_column=Column('query_params', type_=JSON)
    )
    response_cached: bool = Field(default=False)
    cost_estimate: Optional[float] = Field(default=None, ge=0.0)
    execution_time_ms: Optional[int] = Field(default=None, ge=0)
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column('created_at', TIMESTAMP, server_default=text('now()'))
    )


# Pydantic models for API responses
class CacheResponse(SQLModel):
    """Response model for cached data."""
    data: Dict[str, Any]
    source: str  # 'cache', 'api', 'cache_fallback'
    cached: bool
    cost: float = 0.0
    expires_in: Optional[int] = None  # seconds until expiration
    confidence_score: Optional[float] = None
    
    # New TTL-aware cache metadata
    static_cached: Optional[bool] = None  # Whether static data is cached
    static_last_fetched: Optional[str] = None  # ISO timestamp of last fetch
    live_cached: Optional[bool] = None  # Whether live data is cached
    stale: Optional[bool] = None  # Whether cached data is stale (past TTL)


class BatchResponse(SQLModel):
    """Response model for batch operations."""
    results: Dict[str, Dict[str, Any]]
    summary: Dict[str, Any]


class CacheStats(SQLModel):
    """Cache performance statistics."""
    total_cached_entries: int
    cache_hit_rate_7d: float
    cache_hits_7d: int
    cache_misses_7d: int
    api_usage_7d: Dict[str, Any]


class BudgetStatus(SQLModel):
    """API budget status for a user."""
    within_budget: bool
    calls_used: int
    calls_limit: int
    cost_used: float
    cost_limit: float