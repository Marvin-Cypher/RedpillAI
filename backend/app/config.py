from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application configuration settings."""
    
    # Application
    app_name: str = "Redpill VC CRM"
    version: str = "1.0.0"
    debug: bool = True
    
    # Database (PostgreSQL only)
    database_url: str = "postgresql://marvin@localhost:5432/redpill_db"
    database_echo: bool = False
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # Security
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # AI Services
    openai_api_key: Optional[str] = "sk-9JABKD0bYW6s8VN6PoIG0LUOj1uo44TrXm0MNJWXe7GWP1wR"
    anthropic_api_key: Optional[str] = None
    pinecone_api_key: Optional[str] = None
    pinecone_environment: str = "us-east-1"
    pinecone_index_name: str = "redpill-documents"
    
    # Redpill.ai Configuration
    redpill_api_key: Optional[str] = None
    redpill_api_url: str = "https://api.redpill.ai/v1"
    use_redpill_ai: bool = True  # Prefer redpill.ai over OpenAI when available
    
    # External APIs
    coingecko_api_key: Optional[str] = None
    messari_api_key: Optional[str] = None
    etherscan_api_key: Optional[str] = None
    
    # Google Search API for news
    google_search_api_key: Optional[str] = "AIzaSyD5ZA1xwhdaaaxzueX1IzZRAhkz8Oa3XC4"
    google_search_cx_id: Optional[str] = "7459ee20295754f7f"
    
    # Tavily API for company data enrichment
    TAVILY_API_KEY: Optional[str] = None
    
    # OpenBB Platform API Keys
    fmp_api_key: Optional[str] = None
    polygon_api_key: Optional[str] = None
    alpha_vantage_api_key: Optional[str] = None
    quandl_api_key: Optional[str] = None
    benzinga_api_key: Optional[str] = None
    
    # Company Enrichment Settings
    enable_web_scraping: bool = True
    enrichment_timeout_seconds: int = 30
    max_enrichment_sources: int = 5
    
    # Rate Limiting
    api_rate_limit_per_minute: int = 100
    
    # File Storage
    upload_directory: str = "./uploads"
    max_file_size: int = 50 * 1024 * 1024  # 50MB
    
    # CORS
    allowed_origins: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3004,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002,http://127.0.0.1:3004"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Allow extra fields in .env without validation errors


settings = Settings()