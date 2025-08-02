"""Metrics API endpoint for monitoring system performance."""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from ..models.users import User
from ..core.auth import get_current_active_user
from ..middleware.metrics import get_metrics_middleware

router = APIRouter()


@router.get("/", response_model=Dict[str, Any])
async def get_metrics(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get system performance metrics.
    
    Requires authentication. Provides insights into:
    - Request processing performance
    - Cache hit/miss rates
    - Error rates by endpoint
    - System uptime and throughput
    """
    
    # Get metrics middleware instance
    middleware = get_metrics_middleware()
    
    if not middleware:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Metrics collection not available"
        )
    
    # Get current metrics
    metrics_data = middleware.get_metrics()
    
    # Add user context
    metrics_data['requested_by'] = {
        'user_id': current_user.id,
        'user_email': current_user.email
    }
    
    return metrics_data


@router.post("/reset")
async def reset_metrics(
    current_user: User = Depends(get_current_active_user)
):
    """
    Reset all metrics counters.
    
    Useful for testing or starting fresh monitoring.
    Requires admin privileges.
    """
    
    # Only allow admin users to reset metrics
    if current_user.role.value not in ['admin', 'partner']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can reset metrics"
        )
    
    middleware = get_metrics_middleware()
    
    if not middleware:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Metrics collection not available"
        )
    
    middleware.reset_metrics()
    
    return {
        "message": "Metrics reset successfully",
        "reset_by": current_user.email,
        "reset_at": middleware.get_metrics()['collected_at']
    }


@router.get("/health")
async def health_check():
    """
    Simple health check endpoint for monitoring.
    
    No authentication required.
    """
    middleware = get_metrics_middleware()
    
    if not middleware:
        return {
            "status": "healthy",
            "metrics": "disabled",
            "timestamp": "2025-08-01T18:00:00Z"
        }
    
    metrics = middleware.get_metrics()
    
    return {
        "status": "healthy",
        "uptime_seconds": metrics['uptime_seconds'],
        "total_requests": metrics['requests']['total'],
        "cache_hit_rate": metrics['performance']['cache_hit_rate'],
        "error_rate": metrics['errors']['error_rate'],
        "timestamp": metrics['collected_at']
    }