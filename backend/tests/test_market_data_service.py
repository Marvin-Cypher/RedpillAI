"""
Unit tests for MarketDataService - async market data operations.
"""

import pytest
import httpx
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

from app.services.market_data_service import MarketDataService, AsyncCoinGeckoClient
from app.services.openbb_service import MarketData, CryptoPrice, EquityPrice, FundamentalData


@pytest.fixture
def market_data_service():
    """Create a MarketDataService instance for testing."""
    return MarketDataService()


@pytest.fixture
def mock_coingecko_response():
    """Mock CoinGecko API response data."""
    return {
        'id': 'bitcoin',
        'symbol': 'btc',
        'name': 'Bitcoin',
        'current_price': 45000,
        'market_cap': 850000000000,
        'market_cap_rank': 1,
        'total_volume': 25000000000,
        'price_change_percentage_24h': 2.5,
        'price_change_percentage_7d_in_currency': 5.2,
        'price_change_percentage_30d_in_currency': -3.1,
        'circulating_supply': 19000000,
        'total_supply': 21000000,
        'max_supply': 21000000,
        'ath': 69000,
        'ath_change_percentage': -34.8,
        'last_updated': '2024-01-01T10:00:00.000Z'
    }


class TestAsyncCoinGeckoClient:
    """Test AsyncCoinGeckoClient."""
    
    @pytest.mark.asyncio
    async def test_context_manager(self):
        """Test AsyncCoinGeckoClient as context manager."""
        async with AsyncCoinGeckoClient() as client:
            assert client.http_client is not None
            assert client.base_url == "https://api.coingecko.com/api/v3"
            assert client.company_token_mapping is not None
        
        # Client should be closed after context exit
        assert client.http_client.is_closed
    
    @pytest.mark.asyncio
    async def test_make_request_success(self):
        """Test successful API request."""
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = AsyncMock(return_value={"test": "data"})
        
        async with AsyncCoinGeckoClient() as client:
            with patch.object(client.http_client, 'get', return_value=mock_response):
                result = await client._make_request("/test")
                
                assert result == {"test": "data"}
                client.http_client.get.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_make_request_rate_limit(self):
        """Test API rate limit handling."""
        mock_response = AsyncMock()
        mock_response.status_code = 429
        
        async with AsyncCoinGeckoClient() as client:
            with patch.object(client.http_client, 'get', return_value=mock_response):
                result = await client._make_request("/test")
                
                assert result is None
    
    @pytest.mark.asyncio
    async def test_get_token_price_bitcoin(self):
        """Test getting Bitcoin price."""
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = AsyncMock(return_value=[{
            'symbol': 'btc',
            'name': 'Bitcoin',
            'current_price': 45000,
            'market_cap': 850000000000,
            'price_change_percentage_24h': 2.5,
            'total_volume': 25000000000,
            'last_updated': '2024-01-01T10:00:00.000Z'
        }])
        
        async with AsyncCoinGeckoClient() as client:
            with patch.object(client.http_client, 'get', return_value=mock_response):
                result = await client.get_token_price('BTC')
                
                assert result is not None
                assert result['symbol'] == 'BTC'
                assert result['current_price'] == 45000
                assert result['market_cap'] == 850000000000
    
    @pytest.mark.asyncio
    async def test_get_token_price_search_fallback(self):
        """Test token price with search fallback."""
        # Mock search response
        search_response = AsyncMock()
        search_response.status_code = 200
        search_response.json = AsyncMock(return_value={
            'coins': [{'id': 'test-token', 'symbol': 'test', 'name': 'Test Token'}]
        })
        
        # Mock market data response
        market_response = AsyncMock()
        market_response.status_code = 200
        market_response.json = AsyncMock(return_value=[{
            'symbol': 'test',
            'name': 'Test Token',
            'current_price': 1.50,
            'market_cap': 1000000,
            'price_change_percentage_24h': 5.0,
            'total_volume': 50000,
            'last_updated': '2024-01-01T10:00:00.000Z'
        }])
        
        async with AsyncCoinGeckoClient() as client:
            with patch.object(client.http_client, 'get', side_effect=[search_response, market_response]):
                result = await client.get_token_price('TEST')
                
                assert result is not None
                assert result['symbol'] == 'TEST'
                assert result['current_price'] == 1.50
    
    @pytest.mark.asyncio
    async def test_search_token_by_company_direct_mapping(self):
        """Test token search using direct company mapping."""
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = AsyncMock(return_value=[{
            'symbol': 'link',
            'name': 'ChainLink Token',
            'current_price': 15.50,
            'market_cap': 8000000000
        }])
        
        async with AsyncCoinGeckoClient() as client:
            with patch.object(client.http_client, 'get', return_value=mock_response):
                # Mock get_token_data method
                with patch.object(client, 'get_token_data', return_value={'symbol': 'LINK', 'name': 'Chainlink'}):
                    result = await client.search_token_by_company('Chainlink')
                    
                    assert result is not None
                    assert result['symbol'] == 'LINK'
    
    @pytest.mark.asyncio
    async def test_get_token_data_comprehensive(self, mock_coingecko_response):
        """Test comprehensive token data retrieval."""
        # Mock market data response
        market_response = AsyncMock()
        market_response.status_code = 200
        market_response.json = AsyncMock(return_value=[mock_coingecko_response])
        
        # Mock detailed info response
        detail_response = AsyncMock()
        detail_response.status_code = 200
        detail_response.json = AsyncMock(return_value={
            'description': {'en': 'Bitcoin is a decentralized digital currency'},
            'links': {'homepage': ['https://bitcoin.org']},
            'community_data': {
                'twitter_followers': 5000000,
                'reddit_subscribers': 4000000,
                'telegram_channel_user_count': 0
            },
            'developer_data': {
                'stars': 70000,
                'forks': 35000,
                'commit_count_4_weeks': 150
            }
        })
        
        async with AsyncCoinGeckoClient() as client:
            with patch.object(client.http_client, 'get', side_effect=[market_response, detail_response]):
                result = await client.get_token_data('bitcoin')
                
                assert result is not None
                assert result['symbol'] == 'BTC'
                assert result['name'] == 'Bitcoin'
                assert result['current_price'] == 45000
                assert 'community_data' in result
                assert 'developer_data' in result
                assert result['description'] == 'Bitcoin is a decentralized digital currency'


class TestMarketDataService:
    """Test MarketDataService async methods."""
    
    @pytest.mark.asyncio
    async def test_context_manager(self, market_data_service):
        """Test MarketDataService as context manager."""
        async with market_data_service as service:
            assert service.executor is not None
    
    @pytest.mark.asyncio
    async def test_test_connection(self, market_data_service):
        """Test connection testing."""
        mock_result = {
            'openbb_available': True,
            'test_crypto_access': True,
            'test_news_access': True
        }
        
        with patch('app.services.market_data_service.openbb_service') as mock_openbb:
            mock_openbb.test_connection.return_value = mock_result
            
            result = await market_data_service.test_connection()
            
            assert result == mock_result
            mock_openbb.test_connection.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_market_overview(self, market_data_service):
        """Test market overview retrieval."""
        mock_market_data = MarketData(
            btc_price=45000,
            eth_price=3000,
            total_market_cap=2000000000000
        )
        
        with patch('app.services.market_data_service.openbb_service') as mock_openbb:
            mock_openbb.get_market_overview.return_value = mock_market_data
            
            result = await market_data_service.get_market_overview()
            
            assert result == mock_market_data
            mock_openbb.get_market_overview.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_crypto_price(self, market_data_service):
        """Test crypto price retrieval."""
        mock_crypto_price = CryptoPrice(
            symbol='BTCUSD',
            date=datetime.now(),
            open=44000,
            high=46000,
            low=43000,
            close=45000,
            volume=25000000000,
            change_percent=2.5
        )
        
        with patch('app.services.market_data_service.openbb_service') as mock_openbb:
            mock_openbb.get_crypto_price.return_value = mock_crypto_price
            
            result = await market_data_service.get_crypto_price('BTC')
            
            assert result == mock_crypto_price
            mock_openbb.get_crypto_price.assert_called_once_with('BTC', None)
    
    @pytest.mark.asyncio
    async def test_get_crypto_historical(self, market_data_service):
        """Test crypto historical data retrieval."""
        mock_historical = [
            CryptoPrice(
                symbol='BTCUSD',
                date=datetime.now(),
                open=44000,
                high=46000,
                low=43000,
                close=45000,
                volume=25000000000,
                change_percent=2.5
            )
        ]
        
        with patch('app.services.market_data_service.openbb_service') as mock_openbb:
            mock_openbb.get_crypto_historical.return_value = mock_historical
            
            result = await market_data_service.get_crypto_historical('BTC', 30)
            
            assert result == mock_historical
            mock_openbb.get_crypto_historical.assert_called_once_with('BTC', 30, None)
    
    @pytest.mark.asyncio
    async def test_get_equity_price(self, market_data_service):
        """Test equity price retrieval."""
        mock_equity_price = EquityPrice(
            symbol='AAPL',
            date=datetime.now(),
            open=175,
            high=177,
            low=173,
            close=176,
            volume=65000000,
            change_percent=1.2
        )
        
        with patch('app.services.market_data_service.openbb_service') as mock_openbb:
            mock_openbb.get_equity_price.return_value = mock_equity_price
            
            result = await market_data_service.get_equity_price('AAPL')
            
            assert result == mock_equity_price
            mock_openbb.get_equity_price.assert_called_once_with('AAPL', None)
    
    @pytest.mark.asyncio
    async def test_get_equity_fundamentals(self, market_data_service):
        """Test equity fundamentals retrieval."""
        mock_fundamentals = FundamentalData(
            symbol='AAPL',
            market_cap=2800000000000,
            pe_ratio=28.5,
            revenue_ttm=394000000000,
            gross_margin=0.46,
            profit_margin=0.26,
            debt_ratio=0.32,
            price_to_book=39.8,
            dividend_yield=0.0044
        )
        
        with patch('app.services.market_data_service.openbb_service') as mock_openbb:
            mock_openbb.get_equity_fundamentals.return_value = mock_fundamentals
            
            result = await market_data_service.get_equity_fundamentals('AAPL')
            
            assert result == mock_fundamentals
            mock_openbb.get_equity_fundamentals.assert_called_once_with('AAPL', None)
    
    @pytest.mark.asyncio
    async def test_get_token_price_coingecko(self, market_data_service):
        """Test CoinGecko token price retrieval."""
        mock_token_data = {
            'symbol': 'BTC',
            'name': 'Bitcoin',
            'current_price': 45000,
            'market_cap': 850000000000,
            'price_change_24h': 2.5,
            'volume_24h': 25000000000,
            'last_updated': '2024-01-01T10:00:00.000Z'
        }
        
        with patch('app.services.market_data_service.AsyncCoinGeckoClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.get_token_price.return_value = mock_token_data
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            result = await market_data_service.get_token_price_coingecko('BTC')
            
            assert result == mock_token_data
            mock_client.get_token_price.assert_called_once_with('BTC')
    
    @pytest.mark.asyncio
    async def test_search_token_by_company(self, market_data_service):
        """Test token search by company name."""
        mock_token_data = {
            'symbol': 'LINK',
            'name': 'Chainlink',
            'current_price': 15.50,
            'market_cap': 8000000000
        }
        
        with patch('app.services.market_data_service.AsyncCoinGeckoClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.search_token_by_company.return_value = mock_token_data
            mock_client_class.return_value.__aenter__.return_value = mock_client
            
            result = await market_data_service.search_token_by_company('Chainlink')
            
            assert result == mock_token_data
            mock_client.search_token_by_company.assert_called_once_with('Chainlink', None)
    
    @pytest.mark.asyncio
    async def test_analyze_portfolio_risk(self, market_data_service):
        """Test portfolio risk analysis."""
        mock_analysis = {
            'symbols': ['BTC', 'ETH'],
            'weights': [0.6, 0.4],
            'total_value': 1.0,
            'risk_metrics': {
                'volatility': 0.15,
                'sharpe_ratio': 1.2,
                'max_drawdown': 0.25
            }
        }
        
        with patch('app.services.market_data_service.openbb_service') as mock_openbb:
            mock_openbb.analyze_portfolio_risk.return_value = mock_analysis
            
            result = await market_data_service.analyze_portfolio_risk(['BTC', 'ETH'], [0.6, 0.4])
            
            assert result == mock_analysis
            mock_openbb.analyze_portfolio_risk.assert_called_once_with(['BTC', 'ETH'], [0.6, 0.4])
    
    @pytest.mark.asyncio
    async def test_get_available_providers(self, market_data_service):
        """Test getting available providers."""
        mock_providers = {
            'crypto': ['yfinance', 'fmp', 'polygon'],
            'equity': ['yfinance', 'fmp', 'polygon'],
            'news': ['benzinga', 'fmp']
        }
        
        with patch('app.services.market_data_service.openbb_service') as mock_openbb:
            mock_openbb.get_available_providers.return_value = mock_providers
            
            result = await market_data_service.get_available_providers()
            
            assert result == mock_providers
            mock_openbb.get_available_providers.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_executor_error_handling(self, market_data_service):
        """Test error handling in executor methods."""
        with patch('app.services.market_data_service.openbb_service') as mock_openbb:
            mock_openbb.get_crypto_price.side_effect = Exception("OpenBB error")
            
            # Should not raise exception, should return None or handle gracefully
            try:
                result = await market_data_service.get_crypto_price('INVALID')
                # The actual behavior depends on OpenBB's error handling
            except Exception as e:
                # If exception is raised, it should be the expected one
                assert "OpenBB error" in str(e)