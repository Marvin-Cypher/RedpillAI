"""
Configuration API - API key management and .env file generation
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
import os
import json
from datetime import datetime
from pathlib import Path

router = APIRouter()

class APIKeyConfig(BaseModel):
    """API key configuration model"""
    key: str
    value: str
    category: str
    required: bool = False

class ConfigurationRequest(BaseModel):
    """Request model for saving configuration"""
    api_keys: Dict[str, str]

class ConfigurationResponse(BaseModel):
    """Response model for configuration operations"""
    success: bool
    message: str
    env_content: Optional[str] = None

API_KEY_CONFIGS = {
    "ai": {
        "title": "AI Services",
        "description": "Services for natural language understanding and AI-powered analysis",
        "keys": [
            {
                "name": "OpenAI",
                "key": "OPENAI_API_KEY",
                "description": "Required for AI-powered natural language understanding and command processing",
                "url": "https://platform.openai.com/api-keys",
                "required": True,
                "placeholder": "sk-..."
            },
            {
                "name": "Redpill AI",
                "key": "REDPILL_API_KEY", 
                "description": "Primary AI provider with specialized VC prompts and investment intelligence",
                "url": "https://redpill.ai/api-keys",
                "required": False,
                "placeholder": "rp_..."
            }
        ]
    },
    "market": {
        "title": "Market Data Providers",
        "description": "Real-time and historical financial data for stocks, crypto, and more",
        "keys": [
            {
                "name": "Alpha Vantage",
                "key": "ALPHA_VANTAGE_API_KEY",
                "description": "Stock prices, financial statements, earnings data, and technical indicators",
                "url": "https://www.alphavantage.co/support/#api-key",
                "required": False,
                "placeholder": "DEMO_KEY"
            },
            {
                "name": "Financial Modeling Prep",
                "key": "FMP_API_KEY",
                "description": "Comprehensive financial data, company metrics, SEC filings, and valuations",
                "url": "https://financialmodelingprep.com/developer/docs#authentication",
                "required": False,
                "placeholder": "demo"
            },
            {
                "name": "Polygon.io",
                "key": "POLYGON_API_KEY",
                "description": "Real-time and historical market data for stocks, options, forex, and crypto",
                "url": "https://polygon.io/dashboard/api-keys",
                "required": False,
                "placeholder": "your-polygon-key"
            },
            {
                "name": "CoinGecko Pro",
                "key": "COINGECKO_API_KEY",
                "description": "Enhanced crypto data with higher rate limits and priority support",
                "url": "https://www.coingecko.com/en/api/pricing",
                "required": False,
                "placeholder": "CG-..."
            }
        ]
    },
    "news": {
        "title": "News & Intelligence",
        "description": "Latest market news, company research, and sentiment analysis",
        "keys": [
            {
                "name": "News API",
                "key": "NEWS_API_KEY",
                "description": "Latest financial news, market updates, and sentiment analysis",
                "url": "https://newsapi.org/register",
                "required": False,
                "placeholder": "your-news-api-key"
            },
            {
                "name": "Google Search API",
                "key": "GOOGLE_API_KEY",
                "description": "Company research, news search, and real-time information gathering",
                "url": "https://console.developers.google.com/apis",
                "required": False,
                "placeholder": "your-google-api-key"
            },
            {
                "name": "Google Search Engine ID",
                "key": "GOOGLE_CSE_ID",
                "description": "Custom Search Engine ID for Google Search API integration",
                "url": "https://programmablesearchengine.google.com/",
                "required": False,
                "placeholder": "your-search-engine-id"
            }
        ]
    },
    "other": {
        "title": "Other Services",
        "description": "Additional services and platform integrations",
        "keys": [
            {
                "name": "OpenBB Personal Access Token",
                "key": "OPENBB_PAT",
                "description": "Access to OpenBB Platform with 350+ financial data providers",
                "url": "https://my.openbb.co/app/platform/pat",
                "required": False,
                "placeholder": "your-openbb-pat"
            }
        ]
    }
}

@router.get("/api-keys/schema")
async def get_api_keys_schema():
    """Get the API keys configuration schema"""
    return {
        "categories": API_KEY_CONFIGS,
        "total_keys": sum(len(cat["keys"]) for cat in API_KEY_CONFIGS.values()),
        "required_keys": [
            key["key"] for cat in API_KEY_CONFIGS.values() 
            for key in cat["keys"] if key["required"]
        ]
    }

@router.post("/api-keys/save", response_model=ConfigurationResponse)
async def save_api_keys(config: ConfigurationRequest):
    """Save API keys configuration"""
    try:
        # Generate .env file content
        env_content = generate_env_file(config.api_keys)
        
        # Save to project root (optional - user can copy/paste)
        project_root = Path(__file__).parent.parent.parent.parent
        env_file_path = project_root / ".env.generated"
        
        try:
            with open(env_file_path, "w") as f:
                f.write(env_content)
        except Exception as e:
            # Continue even if file write fails - user can still copy content
            pass
        
        return ConfigurationResponse(
            success=True,
            message="API keys configuration saved successfully",
            env_content=env_content
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to save API keys configuration: {str(e)}"
        )

@router.post("/api-keys/generate-env", response_model=ConfigurationResponse)
async def generate_env_file_endpoint(config: ConfigurationRequest):
    """Generate .env file content from API keys"""
    try:
        env_content = generate_env_file(config.api_keys)
        
        return ConfigurationResponse(
            success=True,
            message=".env file content generated successfully",
            env_content=env_content
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate .env file: {str(e)}"
        )

@router.get("/api-keys/current")
async def get_current_api_keys():
    """Get currently configured API keys (without values for security)"""
    current_keys = {}
    
    # Check environment variables
    all_keys = [
        key["key"] for cat in API_KEY_CONFIGS.values() 
        for key in cat["keys"]
    ]
    
    for key in all_keys:
        env_value = os.getenv(key)
        current_keys[key] = {
            "configured": bool(env_value),
            "masked_value": mask_api_key(env_value) if env_value else None
        }
    
    return {
        "configured_keys": current_keys,
        "total_configured": sum(1 for info in current_keys.values() if info["configured"])
    }

def generate_env_file(api_keys: Dict[str, str]) -> str:
    """Generate .env file content from API keys"""
    lines = [
        "# RedPill AI Terminal Configuration",
        "# Generated by RedPill Settings UI",
        f"# Created: {datetime.utcnow().isoformat()}Z",
        "",
        "# === REQUIRED FOR CLI ===",
        ""
    ]
    
    # Required keys first
    required_keys = [
        key for cat in API_KEY_CONFIGS.values() 
        for key in cat["keys"] if key["required"]
    ]
    
    for key_config in required_keys:
        key = key_config["key"]
        value = api_keys.get(key, "")
        lines.append(f"# {key_config['name']}: {key_config['description']}")
        if value:
            lines.append(f"{key}={value}")
        else:
            lines.append(f"# {key}=your-api-key-here")
        lines.append("")
    
    lines.extend([
        "# === OPTIONAL ENHANCEMENTS ===",
        ""
    ])
    
    # Optional keys by category
    for category, cat_info in API_KEY_CONFIGS.items():
        optional_keys = [key for key in cat_info["keys"] if not key["required"]]
        
        if optional_keys:
            lines.append(f"# {cat_info['title']}")
            for key_config in optional_keys:
                key = key_config["key"]
                value = api_keys.get(key, "")
                if value:
                    lines.append(f"{key}={value}")
                else:
                    lines.append(f"# {key}=your-api-key-here")
            lines.append("")
    
    lines.extend([
        "# === REDPILL BACKEND ===",
        "# REDPILL_API_URL=http://localhost:8000/api/v1",
        "",
        "# === ADDITIONAL CONFIG ===",
        "# NODE_ENV=development",
        "# LOG_LEVEL=info",
        "# CLI_MODE=enhanced"
    ])
    
    return "\n".join(lines)

def mask_api_key(api_key: str) -> str:
    """Mask API key for security"""
    if not api_key or len(api_key) < 8:
        return "***"
    
    return api_key[:4] + "*" * (len(api_key) - 8) + api_key[-4:]

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "config-api"}