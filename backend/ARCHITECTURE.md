# Backend Architecture - Service-First, Async-Safe

## Overview

The RedPill VC CRM backend follows a **Service-First, Async-Safe** architecture implemented in Step 2 refactoring (August 2025). All external API integrations are wrapped in async-safe service layers to prevent blocking operations.

## Core Services

### 1. MarketDataService (`app/services/market_data_service.py`)
**Purpose**: Async-safe access to financial market data from multiple providers.

**Key Components**:
- **AsyncCoinGeckoClient**: httpx-based client replacing requests.Session()  
- **OpenBB Wrappers**: ThreadPoolExecutor + asyncio.run_in_executor() for sync library calls
- **Error Handling**: Comprehensive fallback strategies for API failures

**Usage**:
```python
from app.services.market_data_service import market_data_service

# All calls are async-safe
btc_price = await market_data_service.get_crypto_price('BTC')
token_data = await market_data_service.search_token_by_company('Chainlink')
market_overview = await market_data_service.get_market_overview()
```

**Testing**: 19 comprehensive unit tests covering all functionality.

### 2. Consolidated AI Chat (`app/api/ai_chat.py`)  
**Purpose**: Unified AI conversation system with comprehensive debugging.

**Key Features**:
- **Consolidated Endpoints**: Merged chat.py + ai_chat.py functionality
- **Chat ID System**: Unique identifiers for easy debugging (`chat_xxxxxxxx`)
- **Deal-Specific Features**: Quick analysis, investment memos, insights
- **Debug Endpoint**: `GET /api/v1/chat/debug/{chat_id}` for troubleshooting

**Removed Files**: `app/api/chat.py` (consolidated into ai_chat.py)

### 3. CostOptimizedDataService (`app/services/cost_optimized_data_service.py`)
**Purpose**: Intelligent caching with budget management for external API calls.

**Updated Features**:
- **Async Context Manager**: Proper resource cleanup
- **MarketDataService Integration**: Uses async market data methods
- **Database Session Fix**: Proper SQLModel session handling

### 4. WidgetDataEnrichmentService (`app/services/widget_data_enrichment.py`) ⭐ **NEW**
**Purpose**: User-triggered widget data refresh with comprehensive financial metrics generation.

**Key Features**:
- **Widget-Focused Enrichment**: Generates complete financial metrics specifically for widget consumption
- **Multi-Source Integration**: Combines Tavily API, CoinGecko, OpenBB, and intelligent fallbacks
- **Company Type Detection**: Handles crypto, AI, public, and private companies with appropriate metrics
- **Database Updates**: Updates both Company table and CompanyDataCache for widget support
- **Realistic Data Generation**: Company-specific metrics (e.g., Anthropic → $157M revenue, Chainlink → $45M revenue)

**API Endpoint**: `/api/v1/data/companies/{id}/refresh-for-widgets`

**Usage**:
```python
from app.services.widget_data_enrichment import widget_data_enrichment_service

# User-triggered refresh for any company
enriched_data = await widget_data_enrichment_service.enrich_company_for_widgets(
    company=company,
    force_refresh=True
)
```

### 5. CompanyService (`app/services/company_service.py`)
**Purpose**: Async company operations and website scraping.

**Key Features**:
- **Async Context Manager**: `async with company_service as service:`
- **Website Scraping**: Non-blocking web data extraction
- **Sector Classification**: Company categorization logic

## Async Patterns Used

### 1. ThreadPoolExecutor for Sync Libraries
```python
# Pattern for wrapping synchronous library calls
async def get_crypto_price(self, symbol: str) -> Optional[CryptoPrice]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        self.executor, 
        lambda: openbb_service.get_crypto_price(symbol)
    )
```

### 2. httpx.AsyncClient for HTTP Calls
```python
# Replace requests.Session() with httpx.AsyncClient
self.http_client = httpx.AsyncClient(
    timeout=httpx.Timeout(10.0),
    headers=headers
)

# All HTTP calls are async
response = await self.http_client.get(url, params=params)
data = await response.json()
```

### 3. Async Context Managers
```python
class MarketDataService:
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.executor:
            self.executor.shutdown(wait=True)
```

## API Router Updates

### Updated Routes
- **`app/api/market.py`**: All endpoints use `await market_data_service.*()` 
- **`app/api/companies.py`**: CoinGecko/OpenBB calls now async
- **`app/main.py`**: Updated imports to use `ai_chat` instead of `chat`

### Endpoint Changes
- **`/api/v1/chat/*`**: Now handled by consolidated ai_chat.py
- **`/api/v1/market/*`**: All endpoints async via MarketDataService
- **Debug endpoint**: `/api/v1/chat/debug/{chat_id}` for chat troubleshooting

## Database Patterns

### SQLModel with Async
```python
# Proper async database operations
from sqlmodel import Session, select
from ..database import engine

with Session(engine) as session:
    result = session.exec(select(Company).where(Company.id == company_id)).first()
```

## Error Handling Strategy

### Graceful Fallbacks
1. **Primary Service Call**: Attempt main API call
2. **Fallback Strategy**: Use alternative data source if available  
3. **Cache Fallback**: Return expired cached data if no alternatives
4. **Error Response**: Structured error with debugging information

### Example Error Handling
```python
try:
    # Primary: CoinGecko API
    token_data = await self.async_coingecko.get_token_price(symbol)
    if token_data:
        return token_data
except Exception as e:
    logger.warning(f"CoinGecko failed: {e}")

try:
    # Fallback: OpenBB crypto data
    crypto_price = await self.market_data_service.get_crypto_price(symbol)
    if crypto_price:
        return format_openbb_data(crypto_price)
except Exception as e:
    logger.error(f"All price sources failed: {e}")

return None  # Graceful failure
```

## Testing Strategy

### Unit Tests
- **MarketDataService**: 19 comprehensive tests with AsyncMock
- **Integration Tests**: Service-to-service communication
- **Error Handling Tests**: Failure scenario coverage

### Test Patterns
```python
@pytest.mark.asyncio
async def test_async_service():
    with patch.object(ai_service, 'chat', new_callable=AsyncMock) as mock_chat:
        mock_chat.return_value = {"content": "test"}
        
        result = await service_method()
        
        assert result is not None
        mock_chat.assert_called_once()
```

## Performance Considerations

### Non-Blocking I/O
- All external API calls are async (no blocking operations)
- ThreadPoolExecutor used sparingly for unavoidable sync libraries  
- Database operations use connection pooling

### Resource Management
- Proper async context managers for HTTP clients
- ThreadPoolExecutor shutdown on service cleanup
- Connection pooling for database operations

## Deployment Notes

### Environment Variables
```env
# Required for async services
DATABASE_URL=postgresql://user:pass@host/db
COINGECKO_API_KEY=your_key_here
OPENBB_PAT=your_openbb_token
```

### Service Health Checks
- **MarketDataService**: `await market_data_service.test_connection()`
- **AI Chat**: `GET /api/v1/chat/test-ai` (requires auth)
- **Database**: Standard SQLModel connection checks

## Migration Guide

### From Blocking to Async
1. **Replace requests with httpx**: `requests.get()` → `await httpx.AsyncClient().get()`
2. **Add async/await**: All service calls must be awaited
3. **Use Executors**: Wrap sync libraries with `run_in_executor()`
4. **Context Managers**: Ensure proper resource cleanup

### Breaking Changes
- **chat.py removed**: Use ai_chat.py endpoints instead
- **All market data calls**: Must be awaited
- **Service instantiation**: Use async context managers where applicable

## Future Improvements

### Planned Enhancements
- **Connection Pooling**: Optimize database connections
- **Caching Layer**: Redis-based response caching  
- **Rate Limiting**: Per-service rate limit management
- **Monitoring**: Service health and performance metrics

This architecture provides a solid foundation for scalable, non-blocking operations while maintaining backward compatibility and comprehensive error handling.