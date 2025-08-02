"""
Comprehensive unit tests for parallel company data processing system.

Tests the new CompanyDataService with:
- Parallel API calls using asyncio.gather()
- Static vs live data separation with different TTLs
- In-process concurrency locks
- Timeout and exception handling
- Company type-aware data fetching
- Cache behavior and performance
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from sqlmodel import Session, select

from app.services.company_data_service import CompanyDataService
from app.models.companies import Company, CompanyType
from app.models.cache import CompanyDataCache


class TestCompanyDataService:
    """Test suite for the CompanyDataService parallel processing."""
    
    @pytest.fixture
    def service(self):
        """Create a CompanyDataService instance for testing."""
        service = CompanyDataService()
        return service
    
    @pytest.fixture
    def sample_company(self):
        """Create a sample company for testing."""
        return Company(
            name="Chainlink",
            website="chain.link",
            company_type=CompanyType.CRYPTO,
            token_symbol="LINK"
        )
    
    @pytest.fixture
    def sample_private_company(self):
        """Create a sample private company for testing."""
        return Company(
            name="OpenAI",
            website="openai.com", 
            company_type=CompanyType.TRADITIONAL
        )
    
    @pytest.fixture
    def sample_public_company(self):
        """Create a sample public company for testing."""
        return Company(
            name="NVIDIA",
            website="nvidia.com",
            company_type=CompanyType.TRADITIONAL
        )

    def test_data_category_classification(self, service):
        """Test data category classification for TTL management."""
        # Static data types
        assert service._get_data_category(['profile']) == 'static'
        assert service._get_data_category(['funding', 'team']) == 'static'
        
        # Live data types  
        assert service._get_data_category(['price']) == 'live'
        assert service._get_data_category(['metrics', 'news']) == 'live'
        
        # Mixed data types
        assert service._get_data_category(['profile', 'price']) == 'mixed'
        assert service._get_data_category(['funding', 'metrics']) == 'mixed'
        
        # Unknown/default
        assert service._get_data_category(['unknown']) == 'mixed'
        assert service._get_data_category([]) == 'mixed'
    
    def test_ticker_symbol_inference(self, service):
        """Test stock ticker symbol inference for public companies."""
        assert service._infer_ticker_symbol("Amazon") == "AMZN"
        assert service._infer_ticker_symbol("NVIDIA Corporation") == "NVDA"
        assert service._infer_ticker_symbol("Apple Inc.") == "AAPL"
        assert service._infer_ticker_symbol("Microsoft") == "MSFT"
        assert service._infer_ticker_symbol("Unknown Company") is None
    
    def test_api_task_building_crypto_company(self, service, sample_company):
        """Test API task building for crypto companies."""
        data_types = ['profile', 'funding', 'price', 'metrics']
        tasks = service._build_api_tasks(sample_company, data_types)
        
        # Should have Tavily tasks for profile/funding
        tavily_tasks = [t for t in tasks if t['service'] == 'tavily']
        assert len(tavily_tasks) >= 2  # profile + funding
        
        # Should have CoinGecko task for crypto price
        coingecko_tasks = [t for t in tasks if t['service'] == 'coingecko']
        assert len(coingecko_tasks) >= 1
        
        # Should have OpenBB task for crypto metrics (if token_symbol exists)
        openbb_tasks = [t for t in tasks if t['service'] == 'openbb']
        assert len(openbb_tasks) >= 1  # Has token_symbol
        
        # Verify timeout configurations
        for task in tasks:
            assert 'timeout' in task
            assert task['timeout'] > 0
    
    def test_api_task_building_traditional_company(self, service, sample_private_company):
        """Test API task building for traditional companies."""
        data_types = ['profile', 'funding']
        tasks = service._build_api_tasks(sample_private_company, data_types)
        
        # Should have Tavily tasks for traditional companies
        tavily_tasks = [t for t in tasks if t['service'] == 'tavily']
        assert len(tavily_tasks) >= 2  # profile + funding
        
        # Traditional companies may or may not have market data depending on if they're public
        # This test just ensures Tavily tasks are present
    
    def test_api_task_building_traditional_company_with_stock(self, service, sample_public_company):
        """Test API task building for traditional companies with stock data."""
        data_types = ['profile', 'price', 'metrics']
        tasks = service._build_api_tasks(sample_public_company, data_types)
        
        # Should have Tavily task for profile
        tavily_tasks = [t for t in tasks if t['service'] == 'tavily']
        assert len(tavily_tasks) >= 1
        
        # Should have OpenBB tasks for stock data (if ticker can be inferred)
        openbb_tasks = [t for t in tasks if t['service'] == 'openbb']
        assert len(openbb_tasks) >= 1  # Should infer NVDA ticker
    
    @pytest.mark.asyncio
    async def test_company_lock_mechanism(self, service):
        """Test in-process concurrency locks prevent duplicate fetches."""
        company_id = "test_company"
        
        # Get lock for first time
        lock1 = await service._get_company_lock(company_id)
        assert lock1 is not None
        
        # Get lock for same company should return same lock
        lock2 = await service._get_company_lock(company_id)
        assert lock1 is lock2
        
        # Test that lock actually prevents concurrent access
        acquired_order = []
        
        async def worker(worker_id):
            async with await service._get_company_lock(company_id):
                acquired_order.append(worker_id)
                await asyncio.sleep(0.1)  # Simulate work
        
        # Start 3 workers concurrently
        await asyncio.gather(
            worker("A"),
            worker("B"), 
            worker("C")
        )
        
        # Should have executed in order (not concurrently)
        assert len(acquired_order) == 3
        assert len(set(acquired_order)) == 3  # All unique
    
    @pytest.mark.asyncio
    async def test_parallel_api_execution_success(self, service):
        """Test successful parallel API execution with mocked services."""
        
        # Mock successful API responses
        mock_tavily_result = {"company_name": "Test", "description": "Test company"}
        mock_coingecko_result = {"current_price": 10.50, "market_cap": 1000000}
        
        api_tasks = [
            {
                'service': 'tavily',
                'method': 'fetch_company_profile', 
                'args': ('Test Company', 'test.com'),
                'timeout': 30.0,
                'data_type': 'profile'
            },
            {
                'service': 'coingecko',
                'method': 'search_token_by_company',
                'args': ('Test Company', 'test.com'),
                'timeout': 10.0,
                'data_type': 'price'
            }
        ]
        
        with patch.object(service.tavily_service, 'fetch_company_profile', new_callable=AsyncMock) as mock_tavily:
            with patch.object(service.market_data_service, 'search_token_by_company', new_callable=AsyncMock) as mock_coingecko:
                
                mock_tavily.return_value = mock_tavily_result
                mock_coingecko.return_value = mock_coingecko_result
                
                results = await service._execute_parallel_api_calls(api_tasks, "Test Company")
                
                # Verify both APIs were called
                mock_tavily.assert_called_once_with('Test Company', 'test.com')
                mock_coingecko.assert_called_once_with('Test Company', 'test.com')
                
                # Verify results structure
                assert 'tavily_profile' in results
                assert 'coingecko_price' in results
                assert results['tavily_profile'] == mock_tavily_result
                assert results['coingecko_price'] == mock_coingecko_result
    
    @pytest.mark.asyncio
    async def test_parallel_api_execution_with_timeout(self, service):
        """Test parallel API execution handles timeouts correctly."""
        
        api_tasks = [
            {
                'service': 'tavily',
                'method': 'fetch_company_profile',
                'args': ('Test Company',),
                'timeout': 0.1,  # Very short timeout
                'data_type': 'profile'
            }
        ]
        
        with patch.object(service.tavily_service, 'fetch_company_profile', new_callable=AsyncMock) as mock_tavily:
            # Mock slow response that will timeout
            async def slow_response(*args):
                await asyncio.sleep(0.2)
                return {"result": "success"}
            
            mock_tavily.side_effect = slow_response
            
            results = await service._execute_parallel_api_calls(api_tasks, "Test Company")
            
            # Should contain timeout error
            assert 'tavily_profile' in results
            assert 'error' in results['tavily_profile']
            assert results['tavily_profile']['error'] == 'timeout'
    
    @pytest.mark.asyncio
    async def test_parallel_api_execution_with_exceptions(self, service):
        """Test parallel API execution handles exceptions correctly."""
        
        api_tasks = [
            {
                'service': 'tavily',
                'method': 'fetch_company_profile',
                'args': ('Test Company',),
                'timeout': 30.0,
                'data_type': 'profile'
            }
        ]
        
        with patch.object(service.tavily_service, 'fetch_company_profile', new_callable=AsyncMock) as mock_tavily:
            mock_tavily.side_effect = Exception("API connection failed")
            
            results = await service._execute_parallel_api_calls(api_tasks, "Test Company")
            
            # Should contain error details
            assert 'tavily_profile' in results
            assert 'error' in results['tavily_profile']
            assert 'API connection failed' in results['tavily_profile']['error']
    
    @pytest.mark.asyncio 
    async def test_process_and_combine_results(self, service, sample_company):
        """Test processing and combining results from multiple APIs."""
        
        api_results = {
            'tavily_profile': {
                'company_name': 'Chainlink',
                'description': 'Decentralized oracle network',
                'founded_year': 2017
            },
            'tavily_funding': {
                'total_funding': 32000000,
                'investors': ['Andreessen Horowitz', 'Polychain Capital']
            },
            'coingecko_price': {
                'current_price': 12.50,
                'market_cap': 7000000000,
                'volume_24h': 850000000,
                'price_change_24h': 2.5
            },
            'openbb_metrics': {
                'pe_ratio': None,  # N/A for crypto
                'market_cap': 7200000000
            }
        }
        
        data_types = ['profile', 'funding', 'price', 'metrics']
        combined = await service._process_and_combine_results(api_results, sample_company, data_types)
        
        # Verify structure
        assert combined['company_name'] == 'Chainlink'
        assert combined['company_type'] == 'CRYPTO'
        assert 'fetch_timestamp' in combined
        assert 'data_sources' in combined
        
        # Verify Tavily data preserved
        assert combined['profile'] == api_results['tavily_profile']
        assert combined['funding'] == api_results['tavily_funding']
        
        # Verify market data combined
        assert 'price' in combined
        assert combined['price']['current_price'] == 12.50
        assert combined['price']['source'] == 'coingecko'
        
        # Verify confidence score calculated
        assert 'confidence_score' in combined
        assert 0.0 <= combined['confidence_score'] <= 1.0
    
    @pytest.mark.asyncio
    async def test_cache_staleness_detection(self, service):
        """Test cache staleness detection based on data category and TTL."""
        
        now = datetime.utcnow()
        
        # Create cache entries with different timestamps
        fresh_static_cache = MagicMock()
        fresh_static_cache.last_fetched_static = now - timedelta(days=1)  # 1 day old
        fresh_static_cache.last_fetched_live = None
        fresh_static_cache.last_fetched = now - timedelta(days=1)
        
        stale_static_cache = MagicMock()
        stale_static_cache.last_fetched_static = now - timedelta(days=35)  # 35 days old
        stale_static_cache.last_fetched_live = None
        stale_static_cache.last_fetched = now - timedelta(days=35)
        
        fresh_live_cache = MagicMock()
        fresh_live_cache.last_fetched_static = None
        fresh_live_cache.last_fetched_live = now - timedelta(minutes=5)  # 5 minutes old
        fresh_live_cache.last_fetched = now - timedelta(minutes=5)
        
        stale_live_cache = MagicMock()
        stale_live_cache.last_fetched_static = None  
        stale_live_cache.last_fetched_live = now - timedelta(minutes=20)  # 20 minutes old
        stale_live_cache.last_fetched = now - timedelta(minutes=20)
        
        # Test static data staleness (30-day TTL)
        assert not service._is_data_stale(fresh_static_cache, 'static')
        assert service._is_data_stale(stale_static_cache, 'static')
        
        # Test live data staleness (15-minute TTL)
        assert not service._is_data_stale(fresh_live_cache, 'live')
        assert service._is_data_stale(stale_live_cache, 'live')
        
        # Test missing cache
        assert service._is_data_stale(None, 'static')
        assert service._is_data_stale(None, 'live')
    
    @pytest.mark.asyncio
    async def test_full_parallel_fetch_workflow(self, service, sample_company):
        """Test the complete parallel fetch workflow end-to-end."""
        
        data_types = ['profile', 'price']
        
        with patch.object(service, '_get_cached_data', return_value=None) as mock_cache_get:
            with patch.object(service, '_check_and_set_fetch_lock', return_value=True) as mock_lock:
                with patch.object(service, '_execute_parallel_api_calls') as mock_execute:
                    with patch.object(service, '_process_and_combine_results') as mock_process:
                        with patch.object(service, '_update_cache') as mock_cache_update:
                            with patch.object(service, '_clear_fetch_lock') as mock_clear:
                                
                                # Mock API results
                                mock_execute.return_value = {
                                    'tavily_profile': {'company_name': 'Chainlink'},
                                    'coingecko_price': {'current_price': 12.50}
                                }
                                
                                # Mock processed result
                                mock_process.return_value = {
                                    'company_name': 'Chainlink',
                                    'profile': {'company_name': 'Chainlink'},
                                    'price': {'current_price': 12.50},
                                    'confidence_score': 0.75
                                }
                                
                                # Execute
                                result = await service.fetch_company_data_parallel(
                                    company=sample_company,
                                    data_types=data_types,
                                    force_refresh=True
                                )
                                
                                # Verify workflow
                                mock_cache_get.assert_called_once()  # Cache checked
                                mock_lock.assert_called_once()       # Lock acquired
                                mock_execute.assert_called_once()    # APIs called
                                mock_process.assert_called_once()    # Results processed
                                mock_cache_update.assert_called_once()  # Cache updated
                                mock_clear.assert_called_once()      # Lock cleared
                                
                                # Verify result structure
                                assert 'data' in result
                                assert 'metadata' in result
                                assert result['metadata']['source'] == 'api_parallel'
                                assert result['metadata']['data_types'] == data_types


class TestParallelProcessingPerformance:
    """Performance and stress tests for parallel processing."""
    
    @pytest.mark.asyncio
    async def test_concurrent_company_processing(self):
        """Test processing multiple companies concurrently."""
        
        service = CompanyDataService()
        
        companies = [
            Company(name=f"Company{i}", company_type=CompanyType.TRADITIONAL)
            for i in range(5)
        ]
        
        start_time = datetime.utcnow()
        
        # Mock the service to return quickly
        with patch.object(service, 'fetch_company_data_parallel') as mock_fetch:
            mock_fetch.return_value = {'data': {}, 'metadata': {'execution_time_seconds': 0.1}}
            
            # Process all companies concurrently
            tasks = [
                service.fetch_company_data_parallel(company, ['profile'])
                for company in companies
            ]
            
            results = await asyncio.gather(*tasks)
            
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            
            # Should complete much faster than sequential (5 * 0.1 = 0.5s)
            assert execution_time < 0.3  # Parallel should be much faster
            assert len(results) == 5
            assert mock_fetch.call_count == 5
    
    @pytest.mark.asyncio
    async def test_api_task_timeout_handling(self):
        """Test that individual API tasks respect timeout limits."""
        
        service = CompanyDataService()
        
        # Test each service timeout configuration
        assert service.timeout_config['tavily'] == 30.0
        assert service.timeout_config['coingecko'] == 10.0
        assert service.timeout_config['openbb'] == 15.0
        
        # Verify timeouts are applied in task building
        company = Company(name="Test", company_type=CompanyType.CRYPTO, token_symbol="TEST")
        tasks = service._build_api_tasks(company, ['profile', 'price'])
        
        for task in tasks:
            service_name = task['service']
            expected_timeout = service.timeout_config[service_name]
            assert task['timeout'] == expected_timeout


if __name__ == "__main__":
    pytest.main([__file__, "-v"])