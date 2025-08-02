from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .database import create_db_and_tables
from .middleware.metrics import MetricsMiddleware, set_metrics_middleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    print("🚀 Starting Redpill VC CRM...")
    create_db_and_tables()
    print("✅ Database tables created")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Redpill VC CRM...")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="AI-powered VC deal flow management and research platform",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)


# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.redpill.vc"] if not settings.debug else ["*"]
)

# Add metrics middleware
metrics_middleware_instance = MetricsMiddleware(app)
app.add_middleware(MetricsMiddleware)
set_metrics_middleware(metrics_middleware_instance)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.version,
        "environment": "development" if settings.debug else "production"
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.version,
        "docs": "/docs" if settings.debug else "Contact admin for API documentation",
        "features": [
            "Deal flow management",
            "AI-powered research",
            "Portfolio tracking", 
            "Fund administration",
            "Document analysis",
            "Real-time collaboration"
        ]
    }


# Import and include routers
from .api import auth, companies, deals, ai_chat, market, portfolio, workflows, metrics
from .api.v1 import data

app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(companies.router, prefix="/api/v1/companies", tags=["companies"])
app.include_router(deals.router, prefix="/api/v1/deals", tags=["deals"])
app.include_router(ai_chat.router, prefix="/api/v1/chat", tags=["ai-chat"])
app.include_router(market.router, prefix="/api/v1/market", tags=["market-data"])
app.include_router(portfolio.router, prefix="/api/v1/portfolio", tags=["portfolio"])
app.include_router(workflows.router, prefix="/api/v1/workflows", tags=["workflows"])
app.include_router(data.router, prefix="/api/v1/data", tags=["data-optimization"])
app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["metrics"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info"
    )