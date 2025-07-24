from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application configuration settings."""
    
    # Application
    app_name: str = "Redpill VC CRM"
    version: str = "1.0.0"
    debug: bool = True
    
    # Database
    database_url: str = "postgresql://redpill:redpill@localhost:5432/redpill"
    database_echo: bool = False
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # Security
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # AI Services
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    pinecone_api_key: Optional[str] = None
    pinecone_environment: str = "us-east-1"
    pinecone_index_name: str = "redpill-documents"
    
    # External APIs
    coingecko_api_key: Optional[str] = None
    messari_api_key: Optional[str] = None
    etherscan_api_key: Optional[str] = None
    
    # File Storage
    upload_directory: str = "./uploads"
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    
    # CORS
    allowed_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()