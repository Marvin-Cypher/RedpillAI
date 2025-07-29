from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import time
import uuid

from app.database import get_db
from app.models import (
    Conversation, ConversationCreate, ConversationType,
    Message, MessageRole, 
    Company, Deal
)
from app.core.auth import get_current_user_optional
from app.services.ai_service import ai_service

router = APIRouter()


@router.post("/chat")
async def ai_chat(
    request: Request,
    message: str,
    project_id: Optional[str] = None,
    project_type: Optional[str] = None,  # "company", "deal", or None
    conversation_history: Optional[List[Dict[str, Any]]] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """
    AI chat endpoint with comprehensive logging
    """
    start_time = time.time()
    chat_id = f"chat_{uuid.uuid4().hex[:8]}"
    
    print(f"🚀 AI Chat Request - {chat_id}")
    print(f"📝 Message: {message[:100]}...")
    print(f"🏷️ Project: {project_type}/{project_id}")
    
    # Get request metadata
    user_agent = request.headers.get("user-agent", "")
    ip_address = request.client.host if request.client else ""
    
    # Determine conversation type and context
    conversation_type = ConversationType.OPEN
    deal_id = None
    company_id = None
    context_name = "Dashboard"
    
    if project_id and project_type:
        if project_type == "company":
            conversation_type = ConversationType.COMPANY
            company_id = project_id
            # Get company name
            company = db.query(Company).filter(Company.id == project_id).first()
            if company:
                context_name = company.name
        elif project_type == "deal":
            conversation_type = ConversationType.DEAL
            deal_id = project_id
            # Get deal name
            deal = db.query(Deal).filter(Deal.id == project_id).first()
            if deal:
                context_name = deal.company_name
    
    # Create conversation record
    conversation = Conversation(
        conversation_type=conversation_type,
        deal_id=deal_id,
        company_id=company_id,
        user_id=current_user.id if current_user else "anonymous",
        title=message[:100],  # First 100 chars as title
        context_name=context_name,
        chat_id=chat_id
    )
    db.add(conversation)
    db.commit()
    
    # Create user message record
    user_message = Message(
        conversation_id=conversation.id,
        role=MessageRole.USER,
        content=message,
        metadata=json.dumps({
            "user_agent": user_agent,
            "ip_address": ip_address,
            "project_type": project_type,
            "project_id": project_id
        })
    )
    db.add(user_message)
    
    # Track research steps and search results
    research_steps = []
    search_results = []
    
    def on_step_update(step):
        """Callback to track research progress"""
        research_steps.append({
            "type": step.get("type"),
            "title": step.get("title"),
            "content": step.get("content"),
            "status": step.get("status"),
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def on_search_result(results):
        """Callback to track search results"""
        search_results.extend(results)
    
    try:
        # Call AI service with callbacks
        response = await ai_service.chat(
            message=message,
            project_id=project_id,
            project_name=context_name,
            conversation_history=conversation_history,
            on_step_update=on_step_update,
            on_search_result=on_search_result
        )
        
        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Create AI response message record
        ai_message = Message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=response.get("content", ""),
            research_steps=json.dumps(research_steps) if research_steps else None,
            search_results=json.dumps(search_results) if search_results else None,
            model_used=response.get("model", "unknown"),
            processing_time_ms=processing_time_ms,
            tokens_used=response.get("usage", {}).get("total_tokens"),
            metadata=json.dumps({
                "reasoning_content": response.get("reasoning_content"),
                "confidence_score": response.get("confidence_score"),
                "sources_cited": response.get("sources_cited", [])
            })
        )
        db.add(ai_message)
        
        # Update conversation
        conversation.updated_at = datetime.utcnow()
        db.commit()
        
        # Return response with chat_id for debugging
        return {
            "success": True,
            "chat_id": chat_id,
            "content": response.get("content", ""),
            "reasoning_content": response.get("reasoning_content"),
            "research_steps": research_steps,
            "usage": response.get("usage"),
            "model": response.get("model"),
            "project_context": {
                "type": project_type,
                "id": project_id,
                "name": context_name
            }
        }
        
    except Exception as e:
        # Log error
        error_message = Message(
            conversation_id=conversation.id,
            role=MessageRole.SYSTEM,
            content=f"Error: {str(e)}",
            error_message=str(e),
            processing_time_ms=int((time.time() - start_time) * 1000)
        )
        db.add(error_message)
        db.commit()
        
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "chat_id": chat_id,
                "message": "AI service error - check chat_id for debugging"
            }
        )


@router.get("/chat/{chat_id}")
async def get_chat_by_id(
    chat_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """
    Get conversation by chat_id for debugging
    """
    conversation = db.query(Conversation).filter(
        Conversation.chat_id == chat_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get all messages
    messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at).all()
    
    # Format response
    return {
        "chat_id": chat_id,
        "conversation_type": conversation.conversation_type,
        "context_name": conversation.context_name,
        "created_at": conversation.created_at.isoformat(),
        "messages": [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.created_at.isoformat(),
                "processing_time_ms": msg.processing_time_ms,
                "research_steps": json.loads(msg.research_steps) if msg.research_steps else None,
                "search_results": json.loads(msg.search_results) if msg.search_results else None,
                "error_message": msg.error_message,
                "model_used": msg.model_used,
                "metadata": json.loads(msg.metadata) if msg.metadata else None
            }
            for msg in messages
        ]
    }


@router.get("/conversations")
async def list_conversations(
    conversation_type: Optional[ConversationType] = None,
    project_id: Optional[str] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user_optional)
):
    """
    List recent conversations with filtering
    """
    query = db.query(Conversation)
    
    if conversation_type:
        query = query.filter(Conversation.conversation_type == conversation_type)
    
    if project_id:
        query = query.filter(
            (Conversation.company_id == project_id) | 
            (Conversation.deal_id == project_id)
        )
    
    if current_user:
        query = query.filter(Conversation.user_id == current_user.id)
    
    conversations = query.order_by(
        Conversation.updated_at.desc()
    ).limit(limit).all()
    
    return {
        "conversations": [
            {
                "chat_id": conv.chat_id,
                "type": conv.conversation_type,
                "context_name": conv.context_name,
                "title": conv.title,
                "created_at": conv.created_at.isoformat(),
                "updated_at": conv.updated_at.isoformat()
            }
            for conv in conversations
        ]
    }