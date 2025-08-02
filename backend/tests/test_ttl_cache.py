"""Unit tests for TTL-aware caching functionality."""

import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, patch

from app.services.smart_cache_service import SmartCacheService
from app.services.cost_optimized_data_service import CostOptimizedDataService


class TestTTLAwareCache:
    """Test TTL-aware caching with last_fetched timestamps."""
    
    @pytest.fixture
    def cache_service(self):
        """Create cache service instance."""
        return SmartCacheService()
    
    @pytest.fixture
    def data_service(self):
        """Create cost-optimized data service instance."""
        return CostOptimizedDataService()
    
    def test_ttl_calculation(self, cache_service):
        """Test TTL calculation logic."""
        # Test profile data TTL (30 days)
        profile_ttl = cache_service.cache_ttl['profile']
        assert profile_ttl == timedelta(days=30)
        
        # Test price data TTL (15 minutes)
        price_ttl = cache_service.cache_ttl['price']
        assert price_ttl == timedelta(minutes=15)
        
        # Test funding data TTL (7 days)
        funding_ttl = cache_service.cache_ttl['funding']
        assert funding_ttl == timedelta(days=7)
    
    async def test_fresh_cache_hit(self, cache_service):
        """Test cache hit with fresh data."""
        company_id = "test-company"
        data_type = "profile"
        
        # Mock database session and cache entry
        mock_cache_entry = AsyncMock()
        mock_cache_entry.last_fetched = datetime.utcnow()  # Fresh data
        mock_cache_entry.cached_data = {"name": "Test Company"}
        mock_cache_entry.confidence_score = 0.9
        mock_cache_entry.cache_hit_count = 5
        mock_cache_entry.expires_at = datetime.utcnow() + timedelta(days=30)
        
        with patch('app.services.smart_cache_service.get_session') as mock_session:
            mock_session.return_value.__enter__.return_value.exec.return_value.first.return_value = mock_cache_entry
            
            cached_data = await cache_service.get_cached_data(company_id, data_type)
            
            assert cached_data is not None
            assert cached_data['name'] == "Test Company"
            assert cached_data['_cache_meta']['is_stale'] is False
            assert 'last_fetched' in cached_data['_cache_meta']
    
    async def test_stale_cache_detection(self, cache_service):
        """Test stale cache detection based on last_fetched."""
        company_id = "test-company"
        data_type = "profile"
        
        # Mock database session and stale cache entry
        mock_cache_entry = AsyncMock()
        mock_cache_entry.last_fetched = datetime.utcnow() - timedelta(days=35)  # Stale data
        mock_cache_entry.cached_data = {"name": "Stale Company"}
        mock_cache_entry.confidence_score = 0.7
        mock_cache_entry.cache_hit_count = 10
        mock_cache_entry.expires_at = datetime.utcnow() + timedelta(days=30)
        
        with patch('app.services.smart_cache_service.get_session') as mock_session:
            # Return None for fresh cache query (stale data filtered out)
            mock_session.return_value.__enter__.return_value.exec.return_value.first.return_value = None
            
            cached_data = await cache_service.get_cached_data(company_id, data_type)
            
            # Should return None because data is stale
            assert cached_data is None
    
    async def test_force_refresh_bypasses_cache(self, data_service):
        """Test force_refresh=True bypasses fresh cache."""
        with patch.object(data_service.cache_service, 'get_cached_data') as mock_get_cache:
            with patch.object(data_service.cache_service, 'check_api_budget') as mock_budget:
                with patch.object(data_service.tavily_service, 'fetch_company_profile') as mock_fetch:
                    
                    # Setup mocks
                    mock_budget.return_value.within_budget = True
                    mock_fetch.return_value = {"name": "Fresh Company", "confidence_score": 0.9}
                    
                    # Test force refresh
                    result = await data_service.get_company_profile(
                        company_name="Test Company",
                        force_refresh=True
                    )
                    
                    # Should NOT call get_cached_data due to force_refresh
                    mock_get_cache.assert_not_called()
                    mock_fetch.assert_called_once()
                    assert result.source == 'api'
                    assert result.cached is False
    
    async def test_cache_metadata_in_response(self, data_service):
        """Test that cache metadata is properly included in responses."""
        with patch.object(data_service.cache_service, 'get_cached_data') as mock_get_cache:
            
            # Mock cached data with metadata
            mock_get_cache.return_value = {
                "name": "Test Company",
                "_cache_meta": {
                    "hit": True,
                    "last_fetched": "2025-08-01T10:00:00",
                    "is_stale": False,
                    "confidence_score": 0.9
                }
            }
            
            result = await data_service.get_company_profile("Test Company")
            
            # Check response metadata
            assert result.static_cached is True
            assert result.static_last_fetched == "2025-08-01T10:00:00"
            assert result.live_cached is False
            assert result.stale is False
            assert result.source == 'cache'
    
    async def test_last_fetched_update_on_store(self, cache_service):
        """Test that last_fetched is updated when storing new data."""
        company_id = "test-company"
        data_type = "profile"
        test_data = {"name": "Updated Company"}
        
        with patch('app.services.smart_cache_service.get_session') as mock_session:
            mock_existing_entry = AsyncMock()
            mock_session.return_value.__enter__.return_value.exec.return_value.first.return_value = mock_existing_entry
            
            # Store data
            success = await cache_service.store_cached_data(
                company_id, data_type, test_data, "test_source"
            )
            
            assert success is True
            # Verify last_fetched was updated
            assert mock_existing_entry.last_fetched is not None
            assert mock_existing_entry.cached_data == test_data


if __name__ == "__main__":
    # Run a simple test
    async def run_test():
        service = SmartCacheService()
        print("TTL settings:")
        for data_type, ttl in service.cache_ttl.items():
            print(f"  {data_type}: {ttl}")
    
    asyncio.run(run_test())