from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid


class DealStatus(str, Enum):
    """Deal status enum for VC pipeline."""
    PLANNED = "planned"
    MEETING = "meeting"
    RESEARCH = "research" 
    DEAL = "deal"
    TRACK = "track"
    PASSED = "passed"
    CLOSED = "closed"


class InvestmentStage(str, Enum):
    """Investment stage enum."""
    PRE_SEED = "pre_seed"
    SEED = "seed"
    SERIES_A = "series_a"
    SERIES_B = "series_b"
    SERIES_C = "series_c"
    SERIES_D_PLUS = "series_d_plus"
    PRE_TGE = "pre_tge"
    POST_TGE = "post_tge"


class DealBase(SQLModel):
    """Base deal model with shared fields."""
    status: DealStatus = Field(default=DealStatus.PLANNED, index=True)
    stage: InvestmentStage = Field(index=True)
    valuation: Optional[int] = None  # Pre-money valuation in USD
    round_size: Optional[int] = None  # Total round size in USD
    our_investment: Optional[int] = None  # Our actual investment in USD
    our_target: Optional[int] = None  # Our target investment in USD
    probability: Optional[int] = Field(default=None, ge=0, le=100)  # Success probability %
    next_milestone: Optional[str] = None
    next_meeting_date: Optional[datetime] = None
    internal_notes: Optional[str] = None


class Deal(DealBase, table=True):
    """Deal model for database."""
    __tablename__ = "deals"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    company_id: str = Field(foreign_key="companies.id", index=True)
    created_by: str = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    company: "Company" = Relationship(back_populates="deals")
    conversations: List["Conversation"] = Relationship(back_populates="deal")
    documents: List["Document"] = Relationship(back_populates="deal")
    meetings: List["Meeting"] = Relationship(back_populates="deal")
    research_memos: List["ResearchMemo"] = Relationship(back_populates="deal")


class DealCreate(DealBase):
    """Deal creation model."""
    company_id: str
    stage: InvestmentStage


class DealUpdate(SQLModel):
    """Deal update model."""
    status: Optional[DealStatus] = None
    stage: Optional[InvestmentStage] = None
    valuation: Optional[int] = None
    round_size: Optional[int] = None
    our_investment: Optional[int] = None
    our_target: Optional[int] = None
    probability: Optional[int] = None
    next_milestone: Optional[str] = None
    next_meeting_date: Optional[datetime] = None
    internal_notes: Optional[str] = None


class DealRead(DealBase):
    """Deal read model with metadata and relationships."""
    id: str
    company_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    # company: Optional["CompanyRead"] = None  # We'll handle this separately


# Status change tracking
class DealStatusHistory(SQLModel, table=True):
    """Track deal status changes for audit trail."""
    __tablename__ = "deal_status_history"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    deal_id: str = Field(foreign_key="deals.id", index=True)
    previous_status: Optional[DealStatus] = None
    new_status: DealStatus
    changed_by: str = Field(foreign_key="users.id")
    changed_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None


# Meeting tracking
class Meeting(SQLModel, table=True):
    """Meeting model for tracking founder/team meetings."""
    __tablename__ = "meetings"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    deal_id: str = Field(foreign_key="deals.id", index=True)
    meeting_type: str = Field(max_length=50)  # "founder_call", "diligence", "partner_meeting"
    scheduled_date: datetime
    duration_minutes: Optional[int] = None
    attendees: Optional[str] = None  # JSON string of attendees
    notes: Optional[str] = None
    recording_url: Optional[str] = None
    created_by: str = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    deal: Deal = Relationship(back_populates="meetings")


# Research memo tracking
class ResearchMemo(SQLModel, table=True):
    """AI-generated research memos for deals."""
    __tablename__ = "research_memos"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    deal_id: str = Field(foreign_key="deals.id", index=True)
    title: str = Field(max_length=255)
    content: str  # Full memo content
    summary: Optional[str] = None  # Executive summary
    confidence_score: Optional[int] = Field(default=None, ge=0, le=100)
    version: int = Field(default=1)
    generated_by: str = Field(default="ai_agent")  # AI agent that generated it
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_by: Optional[str] = Field(default=None, foreign_key="users.id")
    reviewed_at: Optional[datetime] = None
    
    # Relationships
    deal: Deal = Relationship(back_populates="research_memos")


# Document management
class DocumentType(str, Enum):
    """Document types for deals."""
    PITCH_DECK = "pitch_deck"
    WHITEPAPER = "whitepaper"
    FINANCIAL_MODEL = "financial_model"
    LEGAL_DOC = "legal_doc"
    RESEARCH_REPORT = "research_report"
    TERM_SHEET = "term_sheet"
    OTHER = "other"


class Document(SQLModel, table=True):
    """Document model for deal-related files."""
    __tablename__ = "documents"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    deal_id: str = Field(foreign_key="deals.id", index=True)
    filename: str = Field(max_length=255)
    original_filename: str = Field(max_length=255)
    file_path: str = Field(max_length=500)
    file_size: int
    mime_type: str = Field(max_length=100)
    document_type: DocumentType = Field(default=DocumentType.OTHER)
    analysis_summary: Optional[str] = None  # AI-generated summary
    uploaded_by: str = Field(foreign_key="users.id")
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None
    
    # Relationships
    deal: Deal = Relationship(back_populates="documents")