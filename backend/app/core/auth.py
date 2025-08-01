from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select

from ..config import settings
from ..database import get_db
from ..models.users import User, TokenData

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token scheme
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


def verify_token(token: str) -> TokenData:
    """Verify and decode a JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
    
    return token_data


async def get_current_user(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(lambda: None if settings.debug else security)
) -> User:
    """Get the current authenticated user."""
    # In debug mode, skip authentication and return mock user
    if settings.debug:
        from ..models.users import User
        import uuid
        
        mock_user = User(
            id=str(uuid.uuid4()),
            email="demo@redpill.vc",
            full_name="Demo User",
            role="partner",
            is_active=True,
            hashed_password="mock-password"
        )
        return mock_user
    
    token_data = verify_token(credentials.credentials)
    
    statement = select(User).where(User.id == token_data.user_id)
    user = db.exec(statement).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> User:
    """Get the current active user."""
    # In debug mode, create a mock user for development
    if settings.debug:
        from ..models.users import User
        import uuid
        
        mock_user = User(
            id=str(uuid.uuid4()),
            email="demo@redpill.vc",
            full_name="Demo User",
            role="partner",
            is_active=True,
            hashed_password="mock-password"
        )
        return mock_user
    
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_user_optional(
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(lambda: None)
) -> Optional[User]:
    """Get the current user if authenticated, otherwise return None."""
    # In debug mode, always return mock user
    if settings.debug:
        from ..models.users import User
        import uuid
        
        mock_user = User(
            id=str(uuid.uuid4()),
            email="demo@redpill.vc",
            full_name="Demo User",
            role="partner",
            is_active=True,
            hashed_password="mock-password"
        )
        return mock_user
    
    # If no credentials provided, return None
    if not credentials:
        return None
    
    try:
        token_data = verify_token(credentials.credentials)
        statement = select(User).where(User.id == token_data.user_id)
        user = db.exec(statement).first()
        
        if user and user.is_active:
            return user
        return None
    except HTTPException:
        return None


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user with email and password."""
    statement = select(User).where(User.email == email)
    user = db.exec(statement).first()
    
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user