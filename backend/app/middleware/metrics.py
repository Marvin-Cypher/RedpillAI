"""Metrics middleware for tracking query performance and cache hits."""

import time
from typing import Dict, Any
from collections import defaultdict, deque
from datetime import datetime, timedelta
import threading
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class MetricsMiddleware(BaseHTTPMiddleware):
    """
    Simple metrics middleware that tracks:
    - Request processing time
    - Cache hit/miss rates  
    - API endpoint usage
    - Response times per endpoint
    """
    
    def __init__(self, app):
        super().__init__(app)
        self._metrics = {
            'requests_total': 0,
            'requests_by_endpoint': defaultdict(int),
            'response_times': defaultdict(deque),  # Last 100 response times per endpoint
            'cache_hits': 0,
            'cache_misses': 0,
            'errors_total': 0,
            'errors_by_status': defaultdict(int),
            'start_time': datetime.utcnow()
        }
        self._lock = threading.Lock()
    
    async def dispatch(self, request: Request, call_next):
        """Process request and collect metrics."""
        start_time = time.time()
        
        # Extract endpoint pattern for grouping
        endpoint = self._get_endpoint_pattern(request.url.path)
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Update metrics
            with self._lock:
                self._metrics['requests_total'] += 1
                self._metrics['requests_by_endpoint'][endpoint] += 1
                
                # Track response times (keep last 100 per endpoint)
                response_times = self._metrics['response_times'][endpoint]
                response_times.append(process_time)
                if len(response_times) > 100:
                    response_times.popleft()
                
                # Track cache metrics from response headers
                if hasattr(response, 'headers'):
                    if response.headers.get('X-Cache-Status') == 'HIT':
                        self._metrics['cache_hits'] += 1
                    elif response.headers.get('X-Cache-Status') == 'MISS':
                        self._metrics['cache_misses'] += 1
                
                # Track errors
                if response.status_code >= 400:
                    self._metrics['errors_total'] += 1
                    self._metrics['errors_by_status'][response.status_code] += 1
            
            # Add processing time to response headers
            response.headers['X-Process-Time'] = str(process_time)
            
            return response
            
        except Exception as e:
            # Track exceptions
            with self._lock:
                self._metrics['errors_total'] += 1
                self._metrics['errors_by_status'][500] += 1
            
            raise e
    
    def _get_endpoint_pattern(self, path: str) -> str:
        """Convert URL path to endpoint pattern for grouping."""
        # Remove query parameters
        path = path.split('?')[0]
        
        # Group common patterns
        if path.startswith('/api/v1/data/companies/'):
            return '/api/v1/data/companies/{id}/*'
        elif path.startswith('/api/v1/companies/'):
            return '/api/v1/companies/{id}'
        elif path.startswith('/api/v1/deals/'):
            return '/api/v1/deals/{id}'
        elif path.startswith('/api/v1/chat/'):
            return '/api/v1/chat/*'
        
        return path
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics snapshot."""
        with self._lock:
            # Calculate uptime
            uptime = datetime.utcnow() - self._metrics['start_time']
            
            # Calculate cache hit rate
            total_cache_requests = self._metrics['cache_hits'] + self._metrics['cache_misses']
            cache_hit_rate = self._metrics['cache_hits'] / total_cache_requests if total_cache_requests > 0 else 0
            
            # Calculate average response times per endpoint
            avg_response_times = {}
            for endpoint, times in self._metrics['response_times'].items():
                if times:
                    avg_response_times[endpoint] = sum(times) / len(times)
            
            return {
                'uptime_seconds': int(uptime.total_seconds()),
                'requests': {
                    'total': self._metrics['requests_total'],
                    'by_endpoint': dict(self._metrics['requests_by_endpoint']),
                    'requests_per_second': self._metrics['requests_total'] / uptime.total_seconds() if uptime.total_seconds() > 0 else 0
                },
                'performance': {
                    'avg_response_time_by_endpoint': avg_response_times,
                    'cache_hit_rate': round(cache_hit_rate, 3),
                    'cache_hits': self._metrics['cache_hits'],
                    'cache_misses': self._metrics['cache_misses']
                },
                'errors': {
                    'total': self._metrics['errors_total'],
                    'by_status_code': dict(self._metrics['errors_by_status']),
                    'error_rate': self._metrics['errors_total'] / self._metrics['requests_total'] if self._metrics['requests_total'] > 0 else 0
                },
                'collected_at': datetime.utcnow().isoformat()
            }
    
    def reset_metrics(self):
        """Reset all metrics (useful for testing)."""
        with self._lock:
            self._metrics = {
                'requests_total': 0,
                'requests_by_endpoint': defaultdict(int),
                'response_times': defaultdict(deque),
                'cache_hits': 0,
                'cache_misses': 0,
                'errors_total': 0,
                'errors_by_status': defaultdict(int),
                'start_time': datetime.utcnow()
            }


# Global metrics instance
metrics_middleware = None

def get_metrics_middleware() -> MetricsMiddleware:
    """Get the global metrics middleware instance."""
    global metrics_middleware
    return metrics_middleware

def set_metrics_middleware(middleware: MetricsMiddleware):
    """Set the global metrics middleware instance."""
    global metrics_middleware
    metrics_middleware = middleware