from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlmodel import Session, select
from sqlalchemy.orm import Query
from datetime import datetime
import json

from ..database import get_db
from ..models.conversations import (
    Conversation, ConversationCreate, ConversationRead,
    Message, MessageCreate, MessageRead, MessageRole,
    AIInsight, AIInsightType, ConversationType
)
from ..models.deals import Deal
from ..models.companies import Company
from ..models.users import User
from ..core.auth import get_current_active_user
from ..services.ai_service import ai_service

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
    
    # Get deal and company information for AI context
    deal_statement = select(Deal, Company).join(Company).where(Deal.id == conversation.deal_id)
    deal_result = db.exec(deal_statement).first()
    
    if not deal_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found for conversation"
        )
    
    deal, company = deal_result
    
    # Get conversation history for context
    history_statement = select(Message).where(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).limit(20)
    
    history_messages = db.exec(history_statement).all()
    conversation_history = [
        {"role": msg.role, "content": msg.content} 
        for msg in history_messages
    ]
    
    # Generate AI response using OpenAI
    try:
        ai_response_content = await ai_service.generate_chat_response(
            user_message=message.content,
            conversation_history=conversation_history,
            deal=deal,
            company=company
        )
        
        # Determine which model was used
        model_used = "phala/qwen-2.5-7b-instruct" if ai_service.use_redpill else "gpt-4" if ai_service.client else "mock"
        
        ai_message = Message(
            conversation_id=conversation_id,
            role=MessageRole.ASSISTANT,
            content=ai_response_content,
            context=json.dumps({
                "generated": True, 
                "model": model_used,
                "company": company.name,
                "deal_stage": deal.stage
            })
        )
        
    except Exception as e:
        print(f"AI generation error: {e}")
        ai_message = Message(
            conversation_id=conversation_id,
            role=MessageRole.ASSISTANT,
            content=f"I apologize, but I'm experiencing technical difficulties analyzing {company.name if deal_result else 'this deal'}. Please try again.",
            context=json.dumps({"error": True, "message": str(e)[:200]})
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
    # Get deal and company information
    deal_statement = select(Deal, Company).join(Company).where(Deal.id == deal_id)
    deal_result = db.exec(deal_statement).first()
    
    if not deal_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    deal, company = deal_result
    
    # Generate AI analysis
    try:
        analysis_result = await ai_service.generate_quick_analysis(
            analysis_type=analysis_type,
            deal=deal,
            company=company
        )
        
        # Store as AI insight if successful
        if "error" not in analysis_result:
            insight = AIInsight(
                deal_id=deal_id,
                insight_type=analysis_type,
                title=f"{analysis_type.title()} Analysis - {company.name}",
                content=analysis_result["content"],
                confidence_score=analysis_result.get("confidence", 80),
                generated_by="ai_agent",
                extra_metadata=json.dumps({
                    "model": analysis_result.get("model", "gpt-4"),
                    "word_count": analysis_result.get("word_count", 0),
                    "analysis_type": analysis_type
                })
            )
            db.add(insight)
            db.commit()
        
        return analysis_result
        
    except Exception as e:
        print(f"Quick analysis error: {e}")
        return {
            "error": f"Failed to generate analysis: {str(e)[:100]}",
            "deal_id": deal_id,
            "analysis_type": analysis_type,
            "company": company.name
        }


@router.post("/investment-memo")
async def generate_investment_memo(
    deal_id: str,
    additional_context: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate a comprehensive investment memo for a deal."""
    # Get deal and company information
    deal_statement = select(Deal, Company).join(Company).where(Deal.id == deal_id)
    deal_result = db.exec(deal_statement).first()
    
    if not deal_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found"
        )
    
    deal, company = deal_result
    
    try:
        memo_result = await ai_service.generate_investment_memo(
            deal=deal,
            company=company,
            additional_context=additional_context
        )
        
        # Store as research memo if successful
        if "error" not in memo_result:
            from ..models.deals import ResearchMemo
            
            research_memo = ResearchMemo(
                deal_id=deal_id,
                title=memo_result["title"],
                content=memo_result["content"],
                summary=memo_result["content"][:500] + "..." if len(memo_result["content"]) > 500 else memo_result["content"],
                confidence_score=85,
                generated_by="ai_agent"
            )
            db.add(research_memo)
            db.commit()
            db.refresh(research_memo)
            
            memo_result["memo_id"] = research_memo.id
        
        return memo_result
        
    except Exception as e:
        print(f"Investment memo generation error: {e}")
        return {
            "error": f"Failed to generate investment memo: {str(e)[:100]}",
            "deal_id": deal_id,
            "company": company.name
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


@router.get("/test-ai")
async def test_ai_connection(
    current_user: User = Depends(get_current_active_user)
):
    """Test AI connection and configuration."""
    try:
        # Test message
        test_messages = [
            {"role": "system", "content": "You are a helpful VC analyst."},
            {"role": "user", "content": "What are the key factors to consider when evaluating a crypto startup?"}
        ]
        
        if ai_service.use_redpill:
            # Test redpill.ai
            response = await ai_service._call_redpill_api(test_messages, max_tokens=200)
            content = response["choices"][0]["message"]["content"]
            
            return {
                "status": "success",
                "provider": "redpill.ai",
                "model": ai_service.default_model,
                "api_url": ai_service.base_url,
                "response": content[:200] + "..." if len(content) > 200 else content,
                "message": "Redpill.ai API is connected and working!"
            }
        elif ai_service.client:
            # Test OpenAI
            response = ai_service.client.chat.completions.create(
                model="gpt-3.5-turbo",  # Use cheaper model for testing
                messages=test_messages,
                max_tokens=100
            )
            
            return {
                "status": "success", 
                "provider": "OpenAI",
                "model": "gpt-3.5-turbo",
                "response": response.choices[0].message.content,
                "message": "OpenAI API is connected and working!"
            }
        else:
            # Mock mode
            return {
                "status": "mock",
                "provider": "Mock",
                "model": "mock",
                "response": ai_service._generate_mock_response("crypto startup evaluation", "TestStartup"),
                "message": "AI is running in mock mode. Add API keys to enable real AI."
            }
            
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "provider": "redpill.ai" if ai_service.use_redpill else "OpenAI",
            "message": "AI API connection failed. Please check your configuration."
        }


# New comprehensive chat endpoint with logging
@router.post("/ai-chat")
async def ai_chat_with_logging(
    request: dict,
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user_optional)  # Removed for now
):
    """
    AI chat endpoint with comprehensive logging for debugging.
    Records all conversations with chat_id for easy debugging.
    """
    import time
    import uuid
    
    start_time = time.time()
    chat_id = f"chat_{uuid.uuid4().hex[:8]}"
    
    # Extract request data
    message = request.get("message", "")
    project_id = request.get("project_id")
    project_type = request.get("project_type")  # "company" or "deal"
    conversation_history = request.get("conversation_history", [])
    
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
            try:
                company = db.exec(select(Company).where(Company.id == project_id)).first()
                if company:
                    context_name = company.name
                else:
                    context_name = f"Company: {project_id}"
            except Exception as e:
                print(f"Warning: Could not find company {project_id}: {e}")
                context_name = f"Company: {project_id}"
        elif project_type == "deal":
            conversation_type = ConversationType.DEAL
            deal_id = project_id
            # Get deal name
            try:
                deal = db.exec(select(Deal).where(Deal.id == project_id)).first()
                if deal:
                    context_name = deal.company_name
                else:
                    context_name = f"Deal: {project_id}"
            except Exception as e:
                print(f"Warning: Could not find deal {project_id}: {e}")
                context_name = f"Deal: {project_id}"
    
    # Create conversation record
    conversation = Conversation(
        conversation_type=conversation_type,
        deal_id=deal_id,
        company_id=company_id,
        user_id="anonymous",  # current_user.id if current_user else "anonymous",
        title=message[:100] if message else "New conversation",
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
        extra_metadata=json.dumps({
            "project_type": project_type,
            "project_id": project_id,
            "context_name": context_name
        })
    )
    db.add(user_message)
    
    # Track research steps
    research_steps = []
    
    try:
        # Call AI service
        response = await ai_service.chat(
            message=message,
            project_context={
                "project_id": project_id,
                "project_name": context_name,
                "project_type": project_type
            } if project_id else None,
            conversation_history=conversation_history
        )
        
        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Create AI response message record
        ai_message = Message(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=response.get("content", ""),
            model_used=response.get("model", "unknown"),
            processing_time_ms=processing_time_ms,
            tokens_used=response.get("usage", {}).get("total_tokens") if response.get("usage") else None,
            extra_metadata=json.dumps({
                "reasoning_content": response.get("reasoning_content"),
                "project_context": response.get("projectContext")
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
            "usage": response.get("usage"),
            "model": response.get("model"),
            "projectContext": response.get("projectContext")
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
                "message": f"AI service error - use chat_id '{chat_id}' for debugging"
            }
        )


@router.get("/debug/{chat_id}")
async def debug_conversation(
    chat_id: str,
    db: Session = Depends(get_db)
    # current_user = Depends(get_current_user_optional)  # Removed for now
):
    """
    Get conversation details by chat_id for debugging.
    Perfect for troubleshooting specific conversations.
    """
    conversation = db.exec(
        select(Conversation).where(Conversation.chat_id == chat_id)
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail=f"Conversation with chat_id '{chat_id}' not found")
    
    # Get all messages
    messages = db.exec(
        select(Message).where(Message.conversation_id == conversation.id).order_by(Message.created_at)
    ).all()
    
    # Format response for debugging
    return {
        "chat_id": chat_id,
        "conversation": {
            "id": conversation.id,
            "type": conversation.conversation_type,
            "context_name": conversation.context_name,
            "deal_id": conversation.deal_id,
            "company_id": conversation.company_id,
            "created_at": conversation.created_at.isoformat(),
            "updated_at": conversation.updated_at.isoformat()
        },
        "messages": [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.created_at.isoformat(),
                "processing_time_ms": msg.processing_time_ms,
                "model_used": msg.model_used,
                "tokens_used": msg.tokens_used,
                "error_message": msg.error_message,
                "metadata": json.loads(msg.extra_metadata) if msg.extra_metadata else None,
                "research_steps": json.loads(msg.research_steps) if msg.research_steps else None
            }
            for msg in messages
        ],
        "summary": {
            "total_messages": len(messages),
            "total_processing_time_ms": sum(msg.processing_time_ms or 0 for msg in messages),
            "total_tokens": sum(msg.tokens_used or 0 for msg in messages),
            "has_errors": any(msg.error_message for msg in messages)
        }
    }