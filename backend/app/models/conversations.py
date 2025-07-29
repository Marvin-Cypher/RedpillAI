from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid
import json


class MessageRole(str, Enum):
    """Message roles in conversation."""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ConversationType(str, Enum):
    """Type of conversation context."""
    DEAL = "deal"
    COMPANY = "company"
    OPEN = "open"


class ConversationBase(SQLModel):
    """Base conversation model."""
    conversation_type: ConversationType = Field(default=ConversationType.OPEN)
    deal_id: Optional[str] = Field(default=None, foreign_key="deals.id", index=True)
    company_id: Optional[str] = Field(default=None, foreign_key="companies.id", index=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    title: Optional[str] = Field(default=None, max_length=255)
    is_active: bool = Field(default=True)
    
    # Additional context
    context_name: Optional[str] = None  # e.g., "Anthropic", "Dashboard", etc.
    chat_id: Optional[str] = Field(default_factory=lambda: f"chat_{uuid.uuid4().hex[:8]}", index=True)


class Conversation(ConversationBase, table=True):
    """Conversation model for deal-specific AI chats."""
    __tablename__ = "conversations"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    deal: Optional["Deal"] = Relationship(back_populates="conversations")
    company: Optional["Company"] = Relationship(back_populates="conversations")
    messages: list["Message"] = Relationship(back_populates="conversation")


class ConversationCreate(ConversationBase):
    """Conversation creation model."""
    pass


class ConversationRead(ConversationBase):
    """Conversation read model with metadata."""
    id: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0


class MessageBase(SQLModel):
    """Base message model."""
    role: MessageRole
    content: str
    context: Optional[str] = None  # JSON string for additional context
    tokens_used: Optional[int] = None
    processing_time_ms: Optional[int] = None
    
    # Research and debugging fields
    research_steps: Optional[str] = None  # JSON array of research progress
    search_results: Optional[str] = None  # JSON array of search results
    model_used: Optional[str] = None  # Which AI model was used
    error_message: Optional[str] = None  # Any errors that occurred
    extra_metadata: Optional[str] = None  # Additional metadata as JSON


class Message(MessageBase, table=True):
    """Message model for conversation messages."""
    __tablename__ = "messages"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    conversation_id: str = Field(foreign_key="conversations.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationships
    conversation: Conversation = Relationship(back_populates="messages")


class MessageCreate(MessageBase):
    """Message creation model."""
    conversation_id: str


class MessageRead(MessageBase):
    """Message read model with metadata."""
    id: str
    conversation_id: str
    created_at: datetime


# AI Insights and Analysis
class AIInsightType(str, Enum):
    """Types of AI insights."""
    RISK_ASSESSMENT = "risk_assessment"
    MARKET_ANALYSIS = "market_analysis"
    COMPETITIVE_ANALYSIS = "competitive_analysis"
    TEAM_ANALYSIS = "team_analysis"
    FINANCIAL_ANALYSIS = "financial_analysis"
    TECHNICAL_ANALYSIS = "technical_analysis"
    RECOMMENDATION = "recommendation"


class AIInsight(SQLModel, table=True):
    """AI-generated insights for deals."""
    __tablename__ = "ai_insights"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    deal_id: str = Field(foreign_key="deals.id", index=True)
    conversation_id: Optional[str] = Field(default=None, foreign_key="conversations.id")
    insight_type: AIInsightType
    title: str = Field(max_length=255)
    content: str
    confidence_score: Optional[int] = Field(default=None, ge=0, le=100)
    meta_data: Optional[str] = None  # JSON string for additional data
    generated_by: str = Field(default="ai_agent")  # Which AI agent generated this
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Helper methods
    def get_metadata(self) -> Dict[str, Any]:
        """Parse meta_data JSON string."""
        if self.meta_data:
            try:
                return json.loads(self.meta_data)
            except json.JSONDecodeError:
                return {}
        return {}
    
    def set_metadata(self, data: Dict[str, Any]):
        """Set meta_data as JSON string."""
        self.meta_data = json.dumps(data)


# Research context and memory
class ResearchContext(SQLModel, table=True):
    """Research context and memory for AI agents."""
    __tablename__ = "research_context"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    deal_id: str = Field(foreign_key="deals.id", index=True)
    context_type: str = Field(max_length=50)  # "market_data", "team_info", "technical_spec"
    content: str
    source: Optional[str] = None  # URL or document reference
    confidence: Optional[int] = Field(default=None, ge=0, le=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None  # For time-sensitive data


# Alerts and notifications
class AlertType(str, Enum):
    """Types of alerts."""
    STATUS_CHANGE = "status_change"
    NEW_MESSAGE = "new_message"
    DOCUMENT_UPLOADED = "document_uploaded"
    MEETING_SCHEDULED = "meeting_scheduled"
    AI_INSIGHT = "ai_insight"
    MARKET_UPDATE = "market_update"
    PORTFOLIO_ALERT = "portfolio_alert"


class Alert(SQLModel, table=True):
    """Alerts and notifications for users."""
    __tablename__ = "alerts"
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True
    )
    user_id: str = Field(foreign_key="users.id", index=True)
    deal_id: Optional[str] = Field(default=None, foreign_key="deals.id")
    alert_type: AlertType
    title: str = Field(max_length=255)
    message: str
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = None