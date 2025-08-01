"""
Unit tests for consolidated AI Chat API
Tests the merged functionality from chat.py and ai_chat.py
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from datetime import datetime
import json

from app.main import app
from app.database import get_db
from app.models.conversations import Conversation, Message, MessageRole, ConversationType
from app.models.companies import Company
from app.models.deals import Deal
from app.services.ai_service import ai_service


@pytest.fixture
def test_db():
    """Create test database."""
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        yield session


@pytest.fixture
def client(test_db):
    """Create test client with test database."""
    def get_test_db():
        return test_db
    
    app.dependency_overrides[get_db] = get_test_db
    return TestClient(app)


@pytest.fixture
def sample_company(test_db):
    """Create sample company for testing."""
    company = Company(
        id="test-company-1",
        name="Test Blockchain Corp",
        sector="Blockchain/Crypto",
        stage="Series A"
    )
    test_db.add(company)
    test_db.commit()
    return company


@pytest.fixture
def sample_deal(test_db, sample_company):
    """Create sample deal for testing."""
    deal = Deal(
        id="test-deal-1",
        company_id=sample_company.id,
        company_name=sample_company.name,
        stage="RESEARCH",
        deal_size=1000000,
        ownership_percentage=10.0
    )
    test_db.add(deal)
    test_db.commit()
    return deal


class TestConsolidatedAIChat:
    """Test consolidated AI chat functionality."""
    
    @pytest.mark.asyncio
    async def test_ai_chat_basic(self, client):
        """Test basic AI chat endpoint."""
        with patch.object(ai_service, 'chat', new_callable=AsyncMock) as mock_chat:
            mock_chat.return_value = {
                "content": "Hello! How can I help you with your VC analysis?",
                "model": "gpt-4",
                "usage": {"total_tokens": 25}
            }
            
            response = client.post("/api/v1/chat/chat", json={
                "message": "Hello, I need help with blockchain analysis",
                "project_id": None,
                "project_type": None,
                "conversation_history": []
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            assert "chat_id" in data
            assert "Hello! How can I help you" in data["content"]
            mock_chat.assert_called_once()
    
    @pytest.mark.asyncio 
    async def test_ai_chat_with_company_context(self, client, sample_company):
        """Test AI chat with company context."""
        with patch.object(ai_service, 'chat', new_callable=AsyncMock) as mock_chat:
            mock_chat.return_value = {
                "content": f"I can help analyze {sample_company.name}. What specific aspects would you like to explore?",
                "model": "gpt-4",
                "usage": {"total_tokens": 30}
            }
            
            response = client.post("/api/v1/chat/chat", json={
                "message": "Analyze this company",
                "project_id": sample_company.id,
                "project_type": "company",
                "conversation_history": []
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            assert sample_company.name in data["content"]
    
    @pytest.mark.asyncio
    async def test_ai_chat_with_deal_context(self, client, sample_deal):
        """Test AI chat with deal context."""
        with patch.object(ai_service, 'chat', new_callable=AsyncMock) as mock_chat:
            mock_chat.return_value = {
                "content": f"Let me analyze the {sample_deal.company_name} deal. Based on the RESEARCH stage...",
                "model": "gpt-4",
                "usage": {"total_tokens": 35}
            }
            
            response = client.post("/api/v1/chat/chat", json={
                "message": "What do you think about this deal?",
                "project_id": sample_deal.id,
                "project_type": "deal",
                "conversation_history": []
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            assert sample_deal.company_name in data["content"]
    
    def test_ai_chat_invalid_company(self, client):
        """Test AI chat with non-existent company."""
        response = client.post("/api/v1/chat/chat", json={
            "message": "Analyze this company",
            "project_id": "non-existent-company",
            "project_type": "company",
            "conversation_history": []
        })
        
        assert response.status_code == 404
        assert "not found in our database" in response.json()["detail"]
    
    def test_ai_chat_invalid_deal(self, client):
        """Test AI chat with non-existent deal."""
        response = client.post("/api/v1/chat/chat", json={
            "message": "What about this deal?",
            "project_id": "non-existent-deal", 
            "project_type": "deal",
            "conversation_history": []
        })
        
        assert response.status_code == 404
        assert "not found in our database" in response.json()["detail"]
    
    @pytest.mark.asyncio
    async def test_conversation_debug_endpoint(self, client, test_db, sample_company):
        """Test conversation debugging endpoint."""
        # First create a conversation via chat
        with patch.object(ai_service, 'chat', new_callable=AsyncMock) as mock_chat:
            mock_chat.return_value = {
                "content": "Debug test response",
                "model": "gpt-4",
                "usage": {"total_tokens": 15}
            }
            
            chat_response = client.post("/api/v1/chat/chat", json={
                "message": "Test message for debugging",
                "project_id": sample_company.id,
                "project_type": "company",
                "conversation_history": []
            })
            
            chat_id = chat_response.json()["chat_id"]
            
            # Now test debug endpoint
            debug_response = client.get(f"/api/v1/chat/debug/{chat_id}")
            
            assert debug_response.status_code == 200
            debug_data = debug_response.json()
            assert debug_data["chat_id"] == chat_id
            assert debug_data["conversation"]["context_name"] == sample_company.name
            assert len(debug_data["messages"]) >= 2  # User + AI messages
            assert debug_data["summary"]["total_messages"] >= 2
    
    def test_list_conversations(self, client):
        """Test conversation listing endpoint."""
        response = client.get("/api/v1/chat/conversations")
        
        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        assert isinstance(data["conversations"], list)
    
    @pytest.mark.asyncio  
    async def test_ai_service_error_handling(self, client):
        """Test AI service error handling."""
        with patch.object(ai_service, 'chat', new_callable=AsyncMock) as mock_chat:
            mock_chat.side_effect = Exception("AI service temporarily unavailable")
            
            response = client.post("/api/v1/chat/chat", json={
                "message": "This will cause an error",
                "conversation_history": []
            })
            
            assert response.status_code == 500
            error_data = response.json()["detail"]
            assert "AI service error" in error_data["message"]
            assert "chat_" in error_data["chat_id"]  # Chat ID should be provided for debugging
    
    def test_test_ai_connection_endpoint(self, client):
        """Test AI connection testing endpoint - requires auth."""
        # This test would require proper authentication setup
        # For now, just test that the endpoint exists and requires auth
        response = client.get("/api/v1/chat/test-ai")
        
        # Should return 401 (unauthorized) without proper auth
        assert response.status_code == 401


class TestDealSpecificFeatures:
    """Test deal-specific chat features from original chat.py."""
    
    def test_quick_analysis_endpoint_exists(self, client):
        """Test that quick analysis endpoint exists."""
        # Without auth, should return 401
        response = client.post("/api/v1/chat/quick-analysis", params={
            "deal_id": "test-deal",
            "analysis_type": "risk"
        })
        assert response.status_code == 401
    
    def test_investment_memo_endpoint_exists(self, client):
        """Test that investment memo endpoint exists."""
        # Without auth, should return 401  
        response = client.post("/api/v1/chat/investment-memo", params={
            "deal_id": "test-deal"
        })
        assert response.status_code == 401
    
    def test_websocket_endpoint_no_op(self, client):
        """Test WebSocket endpoint returns no-op message."""
        with client.websocket_connect("/api/v1/chat/ws/test-deal") as websocket:
            data = websocket.receive_json()
            assert data["type"] == "no_op"
            assert "not integrated" in data["message"]


def test_conversation_model_fields():
    """Test that Conversation model has required fields."""
    conversation = Conversation(
        conversation_type=ConversationType.OPEN,
        user_id="test-user",
        title="Test Conversation",
        context_name="Dashboard",
        chat_id="chat_12345678"
    )
    
    assert conversation.conversation_type == ConversationType.OPEN
    assert conversation.user_id == "test-user"
    assert conversation.chat_id == "chat_12345678"
    assert conversation.is_active == True  # Default value


def test_message_model_fields():
    """Test that Message model has required fields."""
    message = Message(
        conversation_id="conv-123",
        role=MessageRole.USER,
        content="Test message content"
    )
    
    assert message.role == MessageRole.USER
    assert message.content == "Test message content"
    assert message.conversation_id == "conv-123"