"""
Workflow and Analysis Data Models
Stores workflow executions, research data, and investment memos
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlmodel import SQLModel, Field, Column, JSON, Relationship


class WorkflowExecution(SQLModel, table=True):
    """Track workflow executions and their status"""
    __tablename__ = "workflow_executions"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    workflow_id: str = Field(unique=True, index=True)  # UUID for tracking
    workflow_type: str = Field(index=True)  # "due_diligence", "market_analysis", etc.
    company_name: str = Field(index=True)
    status: str = Field(default="pending")  # pending, running, completed, failed
    
    # Workflow configuration
    selected_tokens: List[str] = Field(default=[], sa_column=Column(JSON))
    investment_amount: Optional[float] = None
    valuation: Optional[float] = None
    
    # Progress tracking
    current_step: Optional[str] = None
    progress_percentage: int = Field(default=0)
    steps_completed: List[str] = Field(default=[], sa_column=Column(JSON))
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Relationships
    market_data: List["MarketDataSnapshot"] = Relationship(back_populates="workflow")
    research_analysis: List["ResearchAnalysis"] = Relationship(back_populates="workflow")
    investment_memos: List["InvestmentMemo"] = Relationship(back_populates="workflow")


class MarketDataSnapshot(SQLModel, table=True):
    """Store market data snapshots from workflows"""
    __tablename__ = "market_data_snapshots"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    workflow_id: str = Field(foreign_key="workflow_executions.workflow_id", index=True)
    
    # Token information
    symbol: str = Field(index=True)
    current_price: float
    open_price: Optional[float] = None
    high_24h: Optional[float] = None
    low_24h: Optional[float] = None
    volume_24h: Optional[float] = None
    change_percent: Optional[float] = None
    market_cap: Optional[float] = None
    
    # Data source
    provider: str = Field(default="unknown")
    source: str = Field(default="OpenBB")
    
    # Metadata
    collected_at: datetime = Field(default_factory=datetime.utcnow)
    raw_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    # Relationships
    workflow: Optional[WorkflowExecution] = Relationship(back_populates="market_data")


class ResearchAnalysis(SQLModel, table=True):
    """Store AI research analysis results"""
    __tablename__ = "research_analyses"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    workflow_id: str = Field(foreign_key="workflow_executions.workflow_id", index=True)
    
    # Company information
    company_name: str = Field(index=True)
    analysis_type: str = Field(default="comprehensive")  # comprehensive, technical, market, team
    
    # Research content
    summary: str
    technical_analysis: str
    team_assessment: str
    competitive_position: str
    
    # Analysis metadata
    confidence_score: Optional[float] = None  # 0-1 confidence in analysis
    sources_count: int = Field(default=0)
    analysis_depth: str = Field(default="standard")  # basic, standard, deep
    
    # Agent information
    agent_model: str = Field(default="gpt-4")
    processing_time_seconds: Optional[float] = None
    
    # Timestamps
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Raw data storage
    raw_research_data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    
    # Relationships
    workflow: Optional[WorkflowExecution] = Relationship(back_populates="research_analysis")


class InvestmentMemo(SQLModel, table=True):
    """Store generated investment memos"""
    __tablename__ = "investment_memos"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    workflow_id: str = Field(foreign_key="workflow_executions.workflow_id", index=True)
    
    # Memo metadata
    company_name: str = Field(index=True)
    memo_title: str
    memo_type: str = Field(default="due_diligence")  # due_diligence, market_analysis, risk_assessment
    
    # Investment details
    investment_amount: Optional[float] = None
    valuation: Optional[float] = None
    ownership_percentage: Optional[float] = None
    recommendation: str = Field(default="TBD")  # PROCEED, DECLINE, DEFER
    
    # Memo content
    executive_summary: str
    full_content: str  # Complete memo in markdown format
    
    # Analysis scores (0-10 scale)
    technical_score: Optional[float] = None
    team_score: Optional[float] = None
    market_score: Optional[float] = None
    risk_score: Optional[float] = None
    overall_score: Optional[float] = None
    
    # Document management
    version: int = Field(default=1)
    status: str = Field(default="draft")  # draft, review, approved, archived
    approved_by: Optional[str] = None
    
    # Timestamps
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    last_modified: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = None
    
    # File management
    exported_formats: List[str] = Field(default=[], sa_column=Column(JSON))  # pdf, docx, etc.
    file_paths: Dict[str, str] = Field(default={}, sa_column=Column(JSON))
    
    # Relationships
    workflow: Optional[WorkflowExecution] = Relationship(back_populates="investment_memos")


class WorkflowTemplate(SQLModel, table=True):
    """Reusable workflow templates for different analysis types"""
    __tablename__ = "workflow_templates"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: str
    workflow_type: str = Field(index=True)
    
    # Template configuration
    steps: List[Dict[str, Any]] = Field(sa_column=Column(JSON))  # Step definitions
    default_tokens: List[str] = Field(default=[], sa_column=Column(JSON))
    default_settings: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    
    # Template metadata
    category: str = Field(default="general")  # general, crypto, equity, defi
    difficulty: str = Field(default="standard")  # basic, standard, advanced
    estimated_duration_minutes: int = Field(default=15)
    
    # Usage tracking
    usage_count: int = Field(default=0)
    success_rate: float = Field(default=0.0)  # Percentage of successful completions
    
    # Management
    is_active: bool = Field(default=True)
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class AnalyticsEvent(SQLModel, table=True):
    """Track user interactions and system performance"""
    __tablename__ = "analytics_events"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Event information
    event_type: str = Field(index=True)  # workflow_started, memo_generated, etc.
    event_category: str = Field(index=True)  # workflow, ui, api, system
    
    # Context
    workflow_id: Optional[str] = Field(index=True)
    company_name: Optional[str] = Field(index=True)
    user_session: Optional[str] = Field(index=True)
    
    # Event data
    event_data: Dict[str, Any] = Field(default={}, sa_column=Column(JSON))
    
    # Performance metrics
    duration_ms: Optional[int] = None
    success: bool = Field(default=True)
    error_message: Optional[str] = None
    
    # Metadata
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Pydantic models for API responses
class WorkflowExecutionResponse(SQLModel):
    """Response model for workflow execution data"""
    id: int
    workflow_id: str
    workflow_type: str
    company_name: str
    status: str
    progress_percentage: int
    current_step: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]


class InvestmentMemoResponse(SQLModel):
    """Response model for investment memo data"""
    id: int
    workflow_id: str
    company_name: str
    memo_title: str
    recommendation: str
    investment_amount: Optional[float]
    valuation: Optional[float]
    overall_score: Optional[float]
    status: str
    generated_at: datetime
    

class WorkflowSummary(SQLModel):
    """Summary statistics for dashboards"""
    total_workflows: int
    completed_workflows: int
    success_rate: float
    average_duration_minutes: float
    companies_analyzed: int
    total_investment_amount: float
    memos_generated: int