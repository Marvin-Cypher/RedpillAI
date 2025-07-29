from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool
import redis.asyncio as redis
from typing import AsyncGenerator
from .config import settings


# Database engine
engine = create_engine(
    settings.database_url,
    echo=settings.database_echo,
    # For SQLite compatibility (remove for PostgreSQL production)
    poolclass=StaticPool if "sqlite" in settings.database_url else None,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
)

# Redis connection
redis_client = redis.from_url(settings.redis_url)


def create_db_and_tables():
    """Create database tables."""
    from .models.users import User
    from .models.deals import Deal
    from .models.companies import Company
    from .models.conversations import Conversation, Message
    from .models.workflows import (
        WorkflowExecution, MarketDataSnapshot, ResearchAnalysis,
        InvestmentMemo, WorkflowTemplate, AnalyticsEvent
    )
    
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    """Get database session."""
    with Session(engine) as session:
        yield session


async def get_redis() -> redis.Redis:
    """Get Redis client."""
    return redis_client


# Database dependency for FastAPI
def get_db():
    """Database dependency for FastAPI routes."""
    with Session(engine) as session:
        yield session