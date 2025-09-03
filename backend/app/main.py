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
        "environment": "development" if settings.debug else "production",
        "claude_code_architecture": True,
        "features": [
            "Declarative intent parsing",
            "Tool contracts with validation",
            "Observable execution",
            "Graceful degradation"
        ]
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
from .api import auth, companies, deals, ai_chat, market, config, creations
from .api import terminal  # AI-first terminal (legacy)
from .api import claude_terminal_api  # New Claude Code-style terminal
from .api.v2 import terminal as terminal_v2  # V2 Terminal with Claude Code intelligence
from .api.v1 import search
from .api import intelligence  # Investment intelligence service

# Temporarily disable routers with forward reference issues until we fix Pydantic models
# from .api import portfolio, workflows, metrics, gp_dashboard, dashboards  
# from .api.v1 import data, tags, ownership, activities, talent
from .api.v1 import persons

# Essential routers for Exa.ai integration
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(companies.router, prefix="/api/v1/companies", tags=["companies"])
app.include_router(deals.router, prefix="/api/v1/deals", tags=["deals"])
app.include_router(ai_chat.router, prefix="/api/v1/chat", tags=["ai-chat"])
app.include_router(market.router, prefix="/api/v1/market", tags=["market-data"])
app.include_router(search.router, prefix="/api/v1/search", tags=["search"])
app.include_router(terminal.router, prefix="/api/v1/terminal", tags=["terminal-legacy"])  # Legacy broken system
app.include_router(claude_terminal_api.router, prefix="/api/v1/claude", tags=["claude-terminal"])  # New Claude Code system
app.include_router(terminal_v2.router, prefix="/api/v2/terminal", tags=["terminal-v2"])  # V2 Production system
app.include_router(config.router, prefix="/api/v1/config", tags=["configuration"])
app.include_router(creations.router, prefix="/api/v1", tags=["investment-crm"])  # Universal Creation Recording System
app.include_router(intelligence.router, tags=["intelligence"])  # Investment Intelligence API

# Temporarily disabled routers until Pydantic forward reference issues are fixed
# app.include_router(portfolio.router, prefix="/api/v1/portfolio", tags=["portfolio"])
# app.include_router(workflows.router, prefix="/api/v1/workflows", tags=["workflows"])
# app.include_router(data.router, prefix="/api/v1/data", tags=["data-optimization"])
# app.include_router(metrics.router, prefix="/api/v1/metrics", tags=["metrics"])
# app.include_router(dashboards.router, prefix="/api/v1/dashboards", tags=["dashboards"])
# app.include_router(gp_dashboard.router, prefix="/api/v1/gp", tags=["gp-dashboard"])
app.include_router(persons.router, prefix="/api/v1/persons", tags=["persons"])
# app.include_router(tags.router, prefix="/api/v1/tags", tags=["tags"])
# app.include_router(ownership.router, prefix="/api/v1/ownership", tags=["ownership"])
# app.include_router(activities.router, prefix="/api/v1/activities", tags=["activities"])
# app.include_router(talent.router, prefix="/api/v1/talent", tags=["talent-intelligence"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info"
    )