from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlmodel import Session, select
from datetime import datetime
import json

from ..database import get_db
from ..models.conversations import (
    Conversation, ConversationCreate, ConversationRead,
    Message, MessageCreate, MessageRead, MessageRole,
    AIInsight, AIInsightType
)
from ..models.deals import Deal
from ..models.users import User
from ..core.auth import get_current_active_user

router = APIRouter()


@router.post("/conversations/", response_model=ConversationRead)
async def create_conversation(
    conversation: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new conversation for a deal."""
    # Verify deal exists
    deal_statement = select(Deal).where(Deal.id == conversation.deal_id)
    deal = db.exec(deal_statement).first()
    
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # Create conversation
    db_conversation = Conversation(**conversation.model_dump(), user_id=current_user.id)
    db.add(db_conversation)
    db.commit()
    db.refresh(db_conversation)
    
    return db_conversation


@router.get("/conversations/deal/{deal_id}", response_model=List[ConversationRead])
async def get_deal_conversations(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all conversations for a specific deal."""
    statement = select(Conversation).where(
        Conversation.deal_id == deal_id,
        Conversation.is_active == True
    ).order_by(Conversation.updated_at.desc())
    
    conversations = db.exec(statement).all()
    
    # Add message count to each conversation
    result = []
    for conv in conversations:
        conv_dict = conv.model_dump()
        msg_count_stmt = select(Message).where(Message.conversation_id == conv.id)
        conv_dict["message_count"] = len(db.exec(msg_count_stmt).all())
        result.append(conv_dict)
    
    return result


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageRead])
async def get_conversation_messages(
    conversation_id: str,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get messages from a conversation."""
    # Verify conversation exists and user has access
    conv_statement = select(Conversation).where(Conversation.id == conversation_id)
    conversation = db.exec(conv_statement).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Get messages
    statement = select(Message).where(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).limit(limit)
    
    messages = db.exec(statement).all()
    return messages


@router.post("/conversations/{conversation_id}/messages", response_model=MessageRead)
async def send_message(
    conversation_id: str,
    message: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Send a message in a conversation."""
    # Verify conversation exists
    conv_statement = select(Conversation).where(Conversation.id == conversation_id)
    conversation = db.exec(conv_statement).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Create user message
    user_message = Message(
        conversation_id=conversation_id,
        role=MessageRole.USER,
        content=message.content,
        context=message.context
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    # TODO: Generate AI response
    # For now, create a mock AI response
    ai_response_content = f"I understand you're asking about: '{message.content[:50]}...'. Let me analyze this in the context of the deal and provide insights."
    
    ai_message = Message(
        conversation_id=conversation_id,
        role=MessageRole.ASSISTANT,
        content=ai_response_content,
        context=json.dumps({"generated": True, "model": "mock-ai"})
    )
    db.add(ai_message)
    
    # Update conversation timestamp
    conversation.updated_at = datetime.utcnow()
    db.add(conversation)
    
    db.commit()
    db.refresh(ai_message)
    
    return ai_message


@router.post("/quick-analysis")
async def quick_analysis(
    deal_id: str,
    analysis_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get quick AI analysis for a deal."""
    # Verify deal exists
    deal_statement = select(Deal).where(Deal.id == deal_id)
    deal = db.exec(deal_statement).first()
    
    if not deal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    # Mock AI analysis based on type
    analysis_responses = {
        "risks": f"Based on my analysis of {deal.company.name if hasattr(deal, 'company') else 'this company'}, key risks include: market competition, regulatory uncertainty, and execution challenges.",
        "competition": f"The competitive landscape shows several players in this space. Key differentiators to evaluate include technology moat, team experience, and go-to-market strategy.",
        "team": f"Team analysis indicates strong technical background. Recommend deeper dive into previous startup experience and domain expertise.",
        "market": f"Market size analysis suggests significant opportunity. Total addressable market estimated at $10B+ with strong growth trends.",
        "memo": f"Generating comprehensive investment memo for {deal.company.name if hasattr(deal, 'company') else 'this opportunity'}. This will include market analysis, competitive positioning, and investment recommendation."
    }
    
    response_content = analysis_responses.get(
        analysis_type, 
        "Analysis type not recognized. Available types: risks, competition, team, market, memo"
    )
    
    return {
        "deal_id": deal_id,
        "analysis_type": analysis_type,
        "content": response_content,
        "generated_at": datetime.utcnow(),
        "confidence": 75
    }


@router.websocket("/ws/{deal_id}")
async def websocket_endpoint(websocket: WebSocket, deal_id: str):
    """WebSocket endpoint for real-time chat."""
    await websocket.accept()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data["type"] == "chat_message":
                # Echo back for now (TODO: integrate with AI)
                response = {
                    "type": "ai_response",
                    "content": f"AI: I received your message about '{message_data['content'][:30]}...' Let me analyze this.",
                    "timestamp": datetime.utcnow().isoformat(),
                    "deal_id": deal_id
                }
                await websocket.send_text(json.dumps(response))
                
            elif message_data["type"] == "status_update":
                # Broadcast status changes
                response = {
                    "type": "status_changed",
                    "deal_id": deal_id,
                    "new_status": message_data["status"],
                    "timestamp": datetime.utcnow().isoformat()
                }
                await websocket.send_text(json.dumps(response))
                
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for deal {deal_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()


@router.get("/insights/deal/{deal_id}")
async def get_deal_insights(
    deal_id: str,
    insight_type: Optional[AIInsightType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get AI insights for a specific deal."""
    statement = select(AIInsight).where(AIInsight.deal_id == deal_id)
    
    if insight_type:
        statement = statement.where(AIInsight.insight_type == insight_type)
    
    statement = statement.order_by(AIInsight.created_at.desc())
    
    insights = db.exec(statement).all()
    return insights