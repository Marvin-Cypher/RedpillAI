"""
Dashboard and Widget Models
Database models for customizable dashboard system
"""

from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid
import json


class WidgetType(str, Enum):
    """Available widget types"""
    PRICE_CHART = "price_chart"
    FUNDAMENTALS = "fundamentals"
    NEWS_FEED = "news_feed"
    PEER_COMPARISON = "peer_comparison"
    TECHNICAL_ANALYSIS = "technical_analysis"
    PORTFOLIO_ALLOCATION = "portfolio_allocation"


class AssetType(str, Enum):
    """Asset types for data sources"""
    EQUITY = "equity"
    CRYPTO = "crypto"
    INDEX = "index"


class DashboardLayoutBase(SQLModel):
    """Base dashboard layout model"""
    company_id: str = Field(foreign_key="companies.id", index=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    layout_name: str = Field(default="Default Dashboard", max_length=255)
    is_default: bool = Field(default=True)


class DashboardLayout(DashboardLayoutBase, table=True):
    """Dashboard layout model for database"""
    __tablename__ = "dashboard_layouts"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    widgets: List["WidgetConfiguration"] = Relationship(back_populates="layout")
    company: Optional["Company"] = Relationship()
    user: Optional["User"] = Relationship()


class WidgetConfigurationBase(SQLModel):
    """Base widget configuration model"""
    dashboard_layout_id: str = Field(foreign_key="dashboard_layouts.id", index=True)
    widget_type: WidgetType
    position_x: int = Field(ge=0)
    position_y: int = Field(ge=0)
    width: int = Field(ge=1, le=12)  # Grid width (1-12)
    height: int = Field(ge=1, le=20)  # Grid height
    is_visible: bool = Field(default=True)
    
    # JSON field for widget-specific configuration
    config: Optional[str] = Field(default="{}", description="JSON string for widget configuration")


class WidgetConfiguration(WidgetConfigurationBase, table=True):
    """Widget configuration model for database"""
    __tablename__ = "widget_configurations"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    layout: Optional[DashboardLayout] = Relationship(back_populates="widgets")


class CompanyDataSourceBase(SQLModel):
    """Base company data source model"""
    company_id: str = Field(foreign_key="companies.id", index=True)
    ticker_symbol: Optional[str] = Field(default=None, max_length=10, index=True)
    exchange: Optional[str] = Field(default=None, max_length=20)
    asset_type: AssetType = Field(default=AssetType.EQUITY)
    is_primary: bool = Field(default=True)
    sector_index: Optional[str] = Field(default=None, max_length=20)
    
    # JSON field for peer tickers array
    peer_tickers: Optional[str] = Field(default="[]", description="JSON string for peer ticker list")


class CompanyDataSource(CompanyDataSourceBase, table=True):
    """Company data source model for database"""
    __tablename__ = "company_data_sources"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    company: Optional["Company"] = Relationship()


class WidgetDataCacheBase(SQLModel):
    """Base widget data cache model"""
    cache_key: str = Field(max_length=255, index=True)
    expires_at: datetime = Field(index=True)
    
    # JSON field for cached data
    data: Optional[str] = Field(default="{}", description="JSON string for cached data")


class WidgetDataCache(WidgetDataCacheBase, table=True):
    """Widget data cache model for database"""
    __tablename__ = "widget_data_cache"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Pydantic models for API responses
class DashboardLayoutCreate(DashboardLayoutBase):
    """Create dashboard layout model"""
    pass


class DashboardLayoutUpdate(SQLModel):
    """Update dashboard layout model"""
    layout_name: Optional[str] = None
    is_default: Optional[bool] = None


class DashboardLayoutRead(DashboardLayoutBase):
    """Read dashboard layout model"""
    id: str
    created_at: datetime
    updated_at: datetime
    widgets: List["WidgetConfigurationRead"] = []


class WidgetConfigurationCreate(WidgetConfigurationBase):
    """Create widget configuration model"""
    pass


class WidgetConfigurationUpdate(SQLModel):
    """Update widget configuration model"""
    widget_type: Optional[WidgetType] = None
    position_x: Optional[int] = None
    position_y: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    is_visible: Optional[bool] = None
    config: Optional[Dict[str, Any]] = None


class WidgetConfigurationRead(WidgetConfigurationBase):
    """Read widget configuration model"""
    id: str
    created_at: datetime
    updated_at: datetime


class CompanyDataSourceCreate(CompanyDataSourceBase):
    """Create company data source model"""
    pass


class CompanyDataSourceUpdate(SQLModel):
    """Update company data source model"""
    ticker_symbol: Optional[str] = None
    exchange: Optional[str] = None
    asset_type: Optional[AssetType] = None
    is_primary: Optional[bool] = None
    peer_tickers: Optional[List[str]] = None
    sector_index: Optional[str] = None


class CompanyDataSourceRead(CompanyDataSourceBase):
    """Read company data source model"""
    id: str
    created_at: datetime
    updated_at: datetime


class DashboardStats(SQLModel):
    """Dashboard statistics model"""
    total_layouts: int
    total_widgets: int
    widget_types: Dict[str, int]
    most_used_widgets: List[Dict[str, Any]]
    last_updated: datetime


class WidgetLibraryItem(SQLModel):
    """Widget library item for frontend"""
    type: WidgetType
    name: str
    description: str
    icon: str
    category: str
    default_size: Dict[str, int]
    config_schema: Dict[str, Any]


# Widget configuration schemas for different widget types
WIDGET_CONFIG_SCHEMAS = {
    WidgetType.PRICE_CHART: {
        "timeframe": {
            "type": "select",
            "label": "Time Frame",
            "options": [
                {"value": "1M", "label": "1 Month"},
                {"value": "3M", "label": "3 Months"},
                {"value": "6M", "label": "6 Months"},
                {"value": "1Y", "label": "1 Year"},
                {"value": "2Y", "label": "2 Years"}
            ],
            "default": "3M"
        },
        "indicators": {
            "type": "multi-select",
            "label": "Technical Indicators",
            "options": [
                {"value": "SMA", "label": "Simple Moving Average"},
                {"value": "EMA", "label": "Exponential Moving Average"},
                {"value": "RSI", "label": "RSI"},
                {"value": "MACD", "label": "MACD"}
            ],
            "default": ["SMA"]
        },
        "chart_type": {
            "type": "select",
            "label": "Chart Type",
            "options": [
                {"value": "line", "label": "Line Chart"},
                {"value": "candlestick", "label": "Candlestick"}
            ],
            "default": "line"
        }
    },
    WidgetType.FUNDAMENTALS: {
        "metrics": {
            "type": "multi-select",
            "label": "Metrics to Display",
            "options": [
                {"value": "market_cap", "label": "Market Cap"},
                {"value": "pe_ratio", "label": "P/E Ratio"},
                {"value": "revenue_ttm", "label": "Revenue (TTM)"},
                {"value": "gross_margin", "label": "Gross Margin"},
                {"value": "profit_margin", "label": "Profit Margin"},
                {"value": "debt_ratio", "label": "Debt Ratio"}
            ],
            "default": ["market_cap", "pe_ratio", "revenue_ttm"]
        },
        "display_format": {
            "type": "select",
            "label": "Display Format",
            "options": [
                {"value": "cards", "label": "Cards"},
                {"value": "table", "label": "Table"}
            ],
            "default": "cards"
        }
    },
    WidgetType.NEWS_FEED: {
        "max_items": {
            "type": "number",
            "label": "Max News Items",
            "min": 3,
            "max": 10,
            "default": 5
        },
        "show_source": {
            "type": "boolean",
            "label": "Show Source",
            "default": True
        }
    },
    WidgetType.PEER_COMPARISON: {
        "max_peers": {
            "type": "number",
            "label": "Max Peers to Compare",
            "min": 2,
            "max": 6,
            "default": 4
        },
        "metrics": {
            "type": "multi-select",
            "label": "Comparison Metrics",
            "options": [
                {"value": "market_cap", "label": "Market Cap"},
                {"value": "pe_ratio", "label": "P/E Ratio"},
                {"value": "revenue_ttm", "label": "Revenue (TTM)"},
                {"value": "gross_margin", "label": "Gross Margin"}
            ],
            "default": ["market_cap", "pe_ratio", "revenue_ttm"]
        }
    }
}

# Widget library metadata
WIDGET_LIBRARY = [
    WidgetLibraryItem(
        type=WidgetType.PRICE_CHART,
        name="Price Chart",
        description="Interactive price chart with technical indicators",
        icon="TrendingUp",
        category="market",
        default_size={"w": 6, "h": 4},
        config_schema=WIDGET_CONFIG_SCHEMAS[WidgetType.PRICE_CHART]
    ),
    WidgetLibraryItem(
        type=WidgetType.FUNDAMENTALS,
        name="Fundamentals",
        description="Key financial metrics and ratios",
        icon="BarChart3",
        category="analysis",
        default_size={"w": 6, "h": 3},
        config_schema=WIDGET_CONFIG_SCHEMAS[WidgetType.FUNDAMENTALS]
    ),
    WidgetLibraryItem(
        type=WidgetType.NEWS_FEED,
        name="News Feed",
        description="Latest news and updates",
        icon="Newspaper",
        category="news",
        default_size={"w": 4, "h": 4},
        config_schema=WIDGET_CONFIG_SCHEMAS[WidgetType.NEWS_FEED]
    ),
    WidgetLibraryItem(
        type=WidgetType.PEER_COMPARISON,
        name="Peer Comparison",
        description="Compare with competitor companies",
        icon="GitCompare",
        category="analysis",
        default_size={"w": 8, "h": 3},
        config_schema=WIDGET_CONFIG_SCHEMAS[WidgetType.PEER_COMPARISON]
    ),
    WidgetLibraryItem(
        type=WidgetType.TECHNICAL_ANALYSIS,
        name="Technical Analysis",
        description="Advanced technical indicators and analysis",
        icon="Activity",
        category="analysis",
        default_size={"w": 6, "h": 4},
        config_schema={}
    ),
    WidgetLibraryItem(
        type=WidgetType.PORTFOLIO_ALLOCATION,
        name="Portfolio Allocation",
        description="Portfolio composition and allocation breakdown",
        icon="PieChart",
        category="portfolio",
        default_size={"w": 4, "h": 3},
        config_schema={}
    )
]