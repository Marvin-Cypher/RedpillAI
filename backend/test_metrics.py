#!/usr/bin/env python3
"""Test metrics middleware functionality."""

import time
from app.middleware.metrics import MetricsMiddleware
from unittest.mock import AsyncMock, MagicMock


class MockApp:
    """Mock FastAPI app for testing."""
    pass


class MockRequest:
    """Mock request for testing."""
    def __init__(self, path: str):
        self.url = MagicMock()
        self.url.path = path


class MockResponse:
    """Mock response for testing."""
    def __init__(self, status_code: int = 200):
        self.status_code = status_code
        self.headers = {}


async def test_metrics_middleware():
    """Test metrics middleware functionality."""
    
    print("📊 Testing Metrics Middleware...")
    
    # 1. Create middleware instance
    app = MockApp()
    middleware = MetricsMiddleware(app)
    
    print(f"   ✅ Middleware created")
    
    # 2. Test initial metrics
    initial_metrics = middleware.get_metrics()
    print(f"   📈 Initial requests: {initial_metrics['requests']['total']}")
    print(f"   📈 Initial cache hits: {initial_metrics['performance']['cache_hits']}")
    print(f"   📈 Initial errors: {initial_metrics['errors']['total']}")
    
    # 3. Mock a successful request
    async def mock_successful_call_next(request):
        time.sleep(0.01)  # Simulate processing time
        response = MockResponse(200)
        response.headers['X-Cache-Status'] = 'HIT'
        return response
    
    request = MockRequest("/api/v1/companies/123")
    response = await middleware.dispatch(request, mock_successful_call_next)
    
    print(f"   ✅ Processed successful request")
    print(f"   📊 Response time header: {response.headers.get('X-Process-Time')}")
    
    # 4. Mock an error request
    async def mock_error_call_next(request):
        time.sleep(0.005)  # Simulate processing time
        return MockResponse(404)
    
    request_error = MockRequest("/api/v1/companies/nonexistent")
    error_response = await middleware.dispatch(request_error, mock_error_call_next)
    
    print(f"   ✅ Processed error request")
    
    # 5. Check updated metrics
    final_metrics = middleware.get_metrics()
    
    print(f"\n📊 Final Metrics:")
    print(f"   📈 Total requests: {final_metrics['requests']['total']}")
    print(f"   📈 Requests per second: {final_metrics['requests']['requests_per_second']:.2f}")
    print(f"   📈 Cache hits: {final_metrics['performance']['cache_hits']}")
    print(f"   📈 Cache hit rate: {final_metrics['performance']['cache_hit_rate']}")
    print(f"   📈 Total errors: {final_metrics['errors']['total']}")
    print(f"   📈 Error rate: {final_metrics['errors']['error_rate']:.2f}")
    print(f"   📈 Uptime: {final_metrics['uptime_seconds']} seconds")
    
    # 6. Test endpoint grouping
    for endpoint, count in final_metrics['requests']['by_endpoint'].items():
        print(f"   📋 {endpoint}: {count} requests")
    
    # 7. Test performance tracking
    for endpoint, avg_time in final_metrics['performance']['avg_response_time_by_endpoint'].items():
        print(f"   ⏱️ {endpoint}: {avg_time:.4f}s avg response time")
    
    print(f"\n🎉 Metrics middleware test complete!")


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_metrics_middleware())