"""
Unit tests for PortfolioService - async portfolio management operations.
"""

import pytest
import httpx
from unittest.mock import AsyncMock, patch
from datetime import datetime

from app.services.portfolio_service import PortfolioService, AsyncOpenProjectClient
from app.services.openproject_service import ProjectStatus, DealStage


@pytest.fixture
def portfolio_service():
    """Create a PortfolioService instance for testing."""
    return PortfolioService()


@pytest.fixture
def mock_project_data():
    """Mock OpenProject API response data."""
    return {
        'id': 123,
        'name': 'Test Company',
        'description': {'raw': 'Test description'},
        'createdAt': '2024-01-01T10:00:00Z',
        'updatedAt': '2024-01-01T10:00:00Z',
        'customField1': 1000000.0,  # investment_amount
        'customField2': 10000000.0,  # valuation
        'customField3': 10.0,  # ownership_percentage
        'customField4': 'John Partner',  # lead_partner
        'customField5': 'FinTech',  # sector
        'customField6': 'sourcing'  # deal_stage
    }


class TestAsyncOpenProjectClient:
    """Test AsyncOpenProjectClient."""
    
    @pytest.mark.asyncio
    async def test_context_manager(self):
        """Test AsyncOpenProjectClient as context manager."""
        async with AsyncOpenProjectClient() as client:
            assert client.http_client is not None
            assert client.base_url
            assert client.headers
        
        # Client should be closed after context exit
        assert client.http_client.is_closed
    
    @pytest.mark.asyncio
    async def test_get_request(self):
        """Test GET request method."""
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = AsyncMock(return_value={"test": "data"})
        
        async with AsyncOpenProjectClient() as client:
            with patch.object(client.http_client, 'get', return_value=mock_response):
                response = await client.get("/projects")
                
                assert response.status_code == 200
                client.http_client.get.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_post_request(self):
        """Test POST request method."""
        mock_response = AsyncMock()
        mock_response.status_code = 201
        
        async with AsyncOpenProjectClient() as client:
            with patch.object(client.http_client, 'post', return_value=mock_response):
                response = await client.post("/projects", json={"name": "Test"})
                
                assert response.status_code == 201
                client.http_client.post.assert_called_once()


class TestPortfolioService:
    """Test PortfolioService async methods."""
    
    @pytest.mark.asyncio
    async def test_health_check_success(self, portfolio_service):
        """Test successful health check."""
        mock_response = AsyncMock()
        mock_response.status_code = 200
        
        with patch('app.services.portfolio_service.AsyncOpenProjectClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            is_healthy = await portfolio_service.health_check()
            
            assert is_healthy is True
            mock_client.get.assert_called_once_with("/projects", timeout=5.0)
    
    @pytest.mark.asyncio
    async def test_health_check_failure(self, portfolio_service):
        """Test health check failure."""
        with patch('app.services.portfolio_service.AsyncOpenProjectClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.side_effect = httpx.RequestError("Connection failed")
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            is_healthy = await portfolio_service.health_check()
            
            assert is_healthy is False
    
    @pytest.mark.asyncio
    async def test_create_portfolio_project_success(self, portfolio_service, mock_project_data):
        """Test successful project creation."""
        project_input = {
            'company_name': 'Test Company',
            'description': 'Test description',
            'investment_amount': 1000000.0,
            'valuation': 10000000.0,
            'ownership_percentage': 10.0,
            'lead_partner': 'John Partner',
            'sector': 'FinTech',
            'deal_stage': 'sourcing'
        }
        
        mock_response = AsyncMock()
        mock_response.status_code = 201
        mock_response.json = AsyncMock(return_value=mock_project_data)
        
        with patch('app.services.portfolio_service.AsyncOpenProjectClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            project = await portfolio_service.create_portfolio_project(project_input)
            
            assert project is not None
            assert project.name == 'Test Company'
            assert project.investment_amount == 1000000.0
            assert project.sector == 'FinTech'
            mock_client.post.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_portfolio_project_failure(self, portfolio_service):
        """Test project creation failure."""
        project_input = {'company_name': 'Test Company'}
        
        mock_response = AsyncMock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"
        
        with patch('app.services.portfolio_service.AsyncOpenProjectClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            project = await portfolio_service.create_portfolio_project(project_input)
            
            assert project is None
    
    @pytest.mark.asyncio
    async def test_get_portfolio_projects_success(self, portfolio_service, mock_project_data):
        """Test successful portfolio projects retrieval."""
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = AsyncMock(return_value={
            '_embedded': {
                'elements': [mock_project_data]
            }
        })
        
        with patch('app.services.portfolio_service.AsyncOpenProjectClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            projects = await portfolio_service.get_portfolio_projects()
            
            assert len(projects) == 1
            assert projects[0].name == 'Test Company'
            mock_client.get.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_portfolio_projects_with_filters(self, portfolio_service):
        """Test portfolio projects retrieval with filters."""
        filters = {'status': 'pipeline', 'limit': 10}
        
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = AsyncMock(return_value={'_embedded': {'elements': []}})
        
        with patch('app.services.portfolio_service.AsyncOpenProjectClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get.return_value = mock_response
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            projects = await portfolio_service.get_portfolio_projects(filters)
            
            assert len(projects) == 0
            # Verify filters were passed to the request
            call_args = mock_client.get.call_args
            assert 'params' in call_args.kwargs
    
    @pytest.mark.asyncio
    async def test_update_project_status_success(self, portfolio_service):
        """Test successful project status update."""
        mock_response = AsyncMock()
        mock_response.status_code = 200
        
        with patch('app.services.portfolio_service.AsyncOpenProjectClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.patch.return_value = mock_response
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            success = await portfolio_service.update_project_status(
                "123", ProjectStatus.DILIGENCE, DealStage.DEEP_DIVE
            )
            
            assert success is True
            mock_client.patch.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_project_document_success(self, portfolio_service):
        """Test successful document creation."""
        doc_data = {
            'title': 'Investment Memo',
            'content': 'This is a test memo',
            'document_type': 'memo',
            'created_by': 'test@example.com'
        }
        
        mock_wp_data = {
            'id': 456,
            'subject': 'Investment Memo',
            'description': {'raw': 'This is a test memo'},
            'createdAt': '2024-01-01T10:00:00Z',
            'customField9': 'memo'
        }
        
        mock_response = AsyncMock()
        mock_response.status_code = 201
        mock_response.json = AsyncMock(return_value=mock_wp_data)
        
        with patch('app.services.portfolio_service.AsyncOpenProjectClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            document = await portfolio_service.create_project_document("123", doc_data)
            
            assert document is not None
            assert document.title == 'Investment Memo'
            assert document.document_type == 'memo'
            mock_client.post.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_portfolio_analytics(self, portfolio_service, mock_project_data):
        """Test portfolio analytics calculation."""
        # Mock get_portfolio_projects to return test data
        with patch.object(portfolio_service, 'get_portfolio_projects') as mock_get_projects:
            mock_project = portfolio_service._map_openproject_to_portfolio(mock_project_data)
            mock_get_projects.return_value = [mock_project]
            
            analytics = await portfolio_service.get_portfolio_analytics()
            
            assert analytics is not None
            assert analytics['total_projects'] == 1
            assert analytics['total_investment'] == 1000000.0
            assert 'status_breakdown' in analytics
            assert 'sector_breakdown' in analytics
            assert 'pipeline_health' in analytics
    
    def test_map_openproject_to_portfolio(self, portfolio_service, mock_project_data):
        """Test mapping OpenProject data to PortfolioProject."""
        project = portfolio_service._map_openproject_to_portfolio(mock_project_data)
        
        assert project is not None
        assert project.id == "123"
        assert project.name == "Test Company"
        assert project.investment_amount == 1000000.0
        assert project.valuation == 10000000.0
        assert project.ownership_percentage == 10.0
        assert project.lead_partner == "John Partner"
        assert project.sector == "FinTech"
    
    def test_get_status_id(self, portfolio_service):
        """Test status mapping to OpenProject IDs."""
        assert portfolio_service._get_status_id(ProjectStatus.PIPELINE) == "1"
        assert portfolio_service._get_status_id(ProjectStatus.DILIGENCE) == "2"
        assert portfolio_service._get_status_id(ProjectStatus.PORTFOLIO) == "5"