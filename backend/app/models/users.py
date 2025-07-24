from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid


class UserRole(str, Enum):
    """User roles in the VC platform."""
    ADMIN = "admin"
    PARTNER = "partner"
    PRINCIPAL = "principal"
    ASSOCIATE = "associate"
    ANALYST = "analyst"
    OBSERVER = "observer"


class UserBase(SQLModel):
    """Base user model with shared fields."""
    email: str = Field(unique=True, index=True, max_length=255)
    full_name: str = Field(max_length=255)
    role: UserRole = Field(default=UserRole.ANALYST)
    is_active: bool = Field(default=True)
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    investment_focus: Optional[str] = None  # JSON string of focus areas


class User(UserBase, table=True):
    """User model for database."""
    __tablename__ = "users"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None


class UserCreate(SQLModel):
    """User creation model."""
    email: str
    password: str
    full_name: str
    role: UserRole = UserRole.ANALYST


class UserUpdate(SQLModel):
    """User update model."""
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    investment_focus: Optional[str] = None


class UserRead(UserBase):
    """User read model without sensitive information."""
    id: str
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None


class UserLogin(SQLModel):
    """User login model."""
    email: str
    password: str


class Token(SQLModel):
    """Token model for authentication."""
    access_token: str
    token_type: str = "bearer"


class TokenData(SQLModel):
    """Token data model."""
    user_id: Optional[str] = None