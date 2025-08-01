"""
Unit tests for CompanyService - async website scraping and classification.
"""

import pytest
import httpx
from unittest.mock import AsyncMock, patch

from app.services.company_service import CompanyService


@pytest.fixture
def company_service():
    """Create a CompanyService instance for testing."""
    return CompanyService()


class TestCompanyService:
    """Test CompanyService async methods."""
    
    @pytest.mark.asyncio
    async def test_scrape_website_info_success(self, company_service):
        """Test successful website scraping with mocked httpx response."""
        # Mock response content
        mock_html = """
        <html>
        <body>
        <h1>NVIDIA Corporation</h1>
        <p>Founded in 1993, NVIDIA has over 26,000 employees worldwide.</p>
        <p>GPU computing and AI acceleration leader.</p>
        </body>
        </html>
        """
        
        # Mock httpx response
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.text = mock_html
        
        with patch.object(company_service.http_client, 'get', return_value=mock_response):
            result = await company_service.scrape_website_info("nvidia.com")
            
            assert result is not None
            assert result["founded_year"] == 1993
            assert result["employee_count"] == 26000
            assert result["sector"] == "Semiconductors/Hardware"
    
    @pytest.mark.asyncio
    async def test_scrape_website_info_failure(self, company_service):
        """Test website scraping with HTTP error."""
        # Mock httpx to raise an exception
        with patch.object(company_service.http_client, 'get', side_effect=httpx.RequestError("Connection failed")):
            result = await company_service.scrape_website_info("invalid-domain.com")
            
            assert result is None
    
    @pytest.mark.asyncio
    async def test_scrape_website_info_404(self, company_service):
        """Test website scraping with 404 response."""
        # Mock httpx response
        mock_response = AsyncMock()
        mock_response.status_code = 404
        
        with patch.object(company_service.http_client, 'get', return_value=mock_response):
            result = await company_service.scrape_website_info("nonexistent.com")
            
            assert result is None
    
    def test_classify_company_sector_crypto(self, company_service):
        """Test crypto company classification."""
        result = company_service.classify_company_sector("CryptoTech Solutions", "cryptotech.com")
        assert result == "Blockchain/Crypto"
        
        result = company_service.classify_company_sector("DeFi Protocol", "defi-proto.org")
        assert result == "Blockchain/Crypto"
    
    def test_classify_company_sector_ai(self, company_service):
        """Test AI/ML company classification."""
        result = company_service.classify_company_sector("AI Solutions Inc", "ai-solutions.com")
        assert result == "AI/ML"
        
        result = company_service.classify_company_sector("Machine Learning Corp", "ml-corp.com")
        assert result == "AI/ML"
    
    def test_classify_company_sector_fintech(self, company_service):
        """Test FinTech company classification."""
        result = company_service.classify_company_sector("Financial Services Co", "finserv.com")
        assert result == "FinTech"
        
        result = company_service.classify_company_sector("PaymentTech", "paytech.com")
        assert result == "FinTech"
    
    def test_classify_company_sector_saas(self, company_service):
        """Test SaaS company classification."""
        result = company_service.classify_company_sector("Software Solutions", "software.com")
        assert result == "SaaS"
        
        result = company_service.classify_company_sector("Platform Tech", "platform.com")
        assert result == "SaaS"
    
    def test_classify_company_sector_healthtech(self, company_service):
        """Test HealthTech company classification."""
        result = company_service.classify_company_sector("HealthCare Solutions", "healthcare.com")
        assert result == "HealthTech"
        
        result = company_service.classify_company_sector("MedTech Corp", "medtech.com")
        assert result == "HealthTech"
    
    def test_classify_company_sector_default(self, company_service):
        """Test default classification for unknown sectors."""
        result = company_service.classify_company_sector("Generic Company", "generic.com")
        assert result == "Technology"
    
    @pytest.mark.asyncio
    async def test_context_manager(self):
        """Test CompanyService as async context manager."""
        async with CompanyService() as service:
            assert service.http_client is not None
            # Service should be usable within context
            result = service.classify_company_sector("Test Company")
            assert result == "Technology"
        
        # HTTP client should be closed after context exit
        assert service.http_client.is_closed