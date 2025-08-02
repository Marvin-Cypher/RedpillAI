"""Smart caching service for cost-efficient data management."""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlmodel import Session, select
import hashlib
import json
import logging
import re

from ..database import get_session
from ..models.cache import (
    CompanyDataCache, 
    CacheAnalytics, 
    UserCompanyData, 
    RealtimeDataCache, 
    ApiUsageLog,
    BudgetStatus
)


class SmartCacheService:
    """
    Intelligent caching service to minimize API costs through:
    - Global shared cache for public company data
    - User-specific cache for private data
    - Short-term cache for real-time data
    - Aggressive budget management
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Cache TTL settings optimized for cost vs freshness
        self.cache_ttl = {
            'profile': timedelta(days=30),      # Company profiles rarely change
            'team': timedelta(days=14),         # Team changes occasionally
            'funding': timedelta(days=7),       # Funding updates weekly
            'metrics': timedelta(days=3),       # Business metrics change frequently
            'price': timedelta(minutes=15),     # Prices change rapidly
            'news': timedelta(hours=6),         # News updates throughout day
            'intelligence': timedelta(hours=12), # Market intelligence
        }
        
        # Daily API budget limits (calls and cost in USD)
        self.daily_limits = {
            'tavily': {'calls': 100, 'cost': 5.00},
            'openbb': {'calls': 500, 'cost': 0.00},  # Free tier
            'coingecko': {'calls': 200, 'cost': 2.00}
        }
    
    def normalize_company_identifier(self, company_name: str, website: str = None) -> str:
        """
        Create normalized, consistent identifier for company caching.
        This ensures we don't cache the same company multiple times.
        """
        # Prefer website domain (most reliable identifier)
        if website:
            domain = website.replace('https://', '').replace('http://', '').replace('www.', '')
            return domain.split('/')[0].lower()
        
        # Normalize company name as fallback
        normalized = company_name.lower().strip()
        
        # Remove common corporate suffixes
        suffixes_to_remove = [
            ' inc', ' inc.', ' corp', ' corp.', ' ltd', ' ltd.', 
            ' llc', ' labs', ' technologies', ' tech', ' systems'
        ]
        
        for suffix in suffixes_to_remove:
            if normalized.endswith(suffix):
                normalized = normalized[:-len(suffix)]
                break
        
        # Replace spaces and special characters
        normalized = re.sub(r'[^a-z0-9]', '-', normalized)
        normalized = re.sub(r'-+', '-', normalized)  # Remove multiple dashes
        normalized = normalized.strip('-')
        
        return normalized
    
    async def get_cached_data(
        self, 
        company_identifier: str, 
        data_type: str,
        user_id: Optional[str] = None,
        include_expired: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached data with intelligent fallback strategy.
        
        Priority order:
        1. User-specific cache (for private data)
        2. Fresh shared cache
        3. Expired shared cache (if include_expired=True)
        """
        
        with get_session() as session:
            # Check user-specific cache first for private data types
            if user_id and data_type in ['deal', 'notes', 'analysis', 'memo']:
                user_data = session.exec(
                    select(UserCompanyData).where(
                        UserCompanyData.user_id == user_id,
                        UserCompanyData.company_identifier == company_identifier,
                        UserCompanyData.data_type == data_type
                    )
                ).first()
                
                if user_data:
                    self.logger.debug(f"Cache HIT (user-specific): {company_identifier}/{data_type}")
                    return user_data.private_data
            
            # Check shared cache with TTL-aware logic
            cache_query = select(CompanyDataCache).where(
                CompanyDataCache.company_identifier == company_identifier,
                CompanyDataCache.data_type == data_type
            )
            
            if not include_expired:
                # Use last_fetched + TTL for staleness check instead of just expires_at
                ttl_cutoff = datetime.utcnow() - self.cache_ttl.get(data_type, timedelta(days=30))
                cache_query = cache_query.where(
                    CompanyDataCache.last_fetched > ttl_cutoff
                )
            
            cache_entry = session.exec(cache_query).first()
            
            if cache_entry:
                # Update hit count and log access
                cache_entry.cache_hit_count += 1
                session.add(cache_entry)
                
                # Log cache analytics
                analytics = CacheAnalytics(
                    cache_entry_id=cache_entry.id,
                    accessed_by_user=user_id,
                    cache_hit=True
                )
                session.add(analytics)
                
                try:
                    session.commit()
                except Exception as e:
                    session.rollback()
                    self.logger.error(f"Failed to update cache analytics: {e}")
                
                # Calculate staleness based on last_fetched + TTL
                ttl_cutoff = datetime.utcnow() - self.cache_ttl.get(data_type, timedelta(days=30))
                is_stale = cache_entry.last_fetched <= ttl_cutoff
                cache_status = "FRESH" if not is_stale else "STALE"
                self.logger.debug(f"Cache HIT ({cache_status}): {company_identifier}/{data_type}")
                
                # Add cache metadata to response with TTL info
                response_data = dict(cache_entry.cached_data)
                response_data['_cache_meta'] = {
                    'hit': True,
                    'last_fetched': cache_entry.last_fetched.isoformat(),
                    'expires_at': cache_entry.expires_at.isoformat(),
                    'confidence_score': cache_entry.confidence_score,
                    'hit_count': cache_entry.cache_hit_count,
                    'is_stale': is_stale,
                    'ttl_seconds': int(self.cache_ttl.get(data_type, timedelta(days=30)).total_seconds())
                }
                
                return response_data
            
            # Cache miss - log for analytics
            if user_id:
                analytics = CacheAnalytics(
                    cache_entry_id=None,
                    accessed_by_user=user_id,
                    cache_hit=False
                )
                session.add(analytics)
                try:
                    session.commit()
                except Exception as e:
                    session.rollback()
                    self.logger.error(f"Failed to log cache miss: {e}")
            
            self.logger.debug(f"Cache MISS: {company_identifier}/{data_type}")
            return None
    
    async def store_cached_data(
        self,
        company_identifier: str,
        data_type: str,
        data: Dict[str, Any],
        source: str,
        confidence_score: float = 1.0,
        user_id: Optional[str] = None
    ) -> bool:
        """
        Store data in appropriate cache with intelligent TTL.
        Returns True if successfully cached.
        """
        
        try:
            with get_session() as session:
                # Clean metadata from data before caching
                clean_data = {k: v for k, v in data.items() if not k.startswith('_')}
                
                # Store user-specific data
                if user_id and data_type in ['deal', 'notes', 'analysis', 'memo']:
                    user_data = UserCompanyData(
                        user_id=user_id,
                        company_identifier=company_identifier,
                        data_type=data_type,
                        private_data=clean_data
                    )
                    session.merge(user_data)  # Insert or update
                    self.logger.debug(f"Cached user data: {company_identifier}/{data_type}")
                
                # Store shared data for public information
                elif data_type in ['profile', 'team', 'funding', 'metrics']:
                    expires_at = datetime.utcnow() + self.cache_ttl.get(data_type, timedelta(days=1))
                    now = datetime.utcnow()
                    
                    # Check if entry exists to update last_fetched
                    existing_entry = session.exec(
                        select(CompanyDataCache).where(
                            CompanyDataCache.company_identifier == company_identifier,
                            CompanyDataCache.data_type == data_type
                        )
                    ).first()
                    
                    if existing_entry:
                        # Update existing entry with fresh data and last_fetched
                        existing_entry.cached_data = clean_data
                        existing_entry.source = source
                        existing_entry.confidence_score = min(max(confidence_score, 0.0), 1.0)
                        existing_entry.expires_at = expires_at
                        existing_entry.last_fetched = now  # Critical: update last_fetched
                        existing_entry.updated_at = now
                        session.add(existing_entry)
                    else:
                        # Create new entry
                        cache_entry = CompanyDataCache(
                            company_identifier=company_identifier,
                            data_type=data_type,
                            cached_data=clean_data,
                            source=source,
                            confidence_score=min(max(confidence_score, 0.0), 1.0),
                            expires_at=expires_at,
                            last_fetched=now
                        )
                        session.add(cache_entry)
                    
                    self.logger.debug(f"Cached shared data: {company_identifier}/{data_type} (expires: {expires_at}, last_fetched: {now})")
                
                # Store real-time data with short TTL
                elif data_type in ['price', 'news', 'intelligence']:
                    data_key = f"{data_type}_{company_identifier}"
                    expires_at = datetime.utcnow() + self.cache_ttl.get(data_type, timedelta(minutes=15))
                    
                    realtime_data = RealtimeDataCache(
                        data_key=data_key,
                        data_payload=clean_data,
                        source=source,
                        expires_at=expires_at
                    )
                    session.merge(realtime_data)
                    self.logger.debug(f"Cached real-time data: {data_key} (expires: {expires_at})")
                
                session.commit()
                return True
                
        except Exception as e:
            self.logger.error(f"Failed to cache data for {company_identifier}/{data_type}: {e}")
            return False
    
    async def check_api_budget(self, user_id: str, api_service: str) -> BudgetStatus:
        """
        Check if user/system is within API budget for the day.
        Returns budget status with usage details.
        """
        
        with get_session() as session:
            # Calculate today's usage
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            usage_logs = session.exec(
                select(ApiUsageLog).where(
                    ApiUsageLog.user_id == user_id,
                    ApiUsageLog.api_service == api_service,
                    ApiUsageLog.created_at >= today_start
                )
            ).all()
            
            total_cost = sum(log.cost_estimate for log in usage_logs if log.cost_estimate) or 0.0
            call_count = len(usage_logs)
            
            # Get limits for service
            limits = self.daily_limits.get(api_service, {'calls': 50, 'cost': 10.00})
            
            within_budget = (
                call_count < limits['calls'] and 
                total_cost < limits['cost']
            )
            
            return BudgetStatus(
                within_budget=within_budget,
                calls_used=call_count,
                calls_limit=limits['calls'],
                cost_used=total_cost,
                cost_limit=limits['cost']
            )
    
    async def log_api_usage(
        self,
        user_id: Optional[str],
        api_service: str,
        endpoint: str,
        cost_estimate: float,
        query_params: Optional[Dict[str, Any]] = None,
        execution_time_ms: Optional[int] = None,
        response_cached: bool = False
    ) -> None:
        """Log API usage for cost tracking and analytics."""
        
        try:
            with get_session() as session:
                usage_log = ApiUsageLog(
                    user_id=user_id,
                    api_service=api_service,
                    endpoint=endpoint,
                    query_params=query_params,
                    response_cached=response_cached,
                    cost_estimate=cost_estimate,
                    execution_time_ms=execution_time_ms
                )
                session.add(usage_log)
                session.commit()
                
        except Exception as e:
            self.logger.error(f"Failed to log API usage: {e}")
    
    async def get_cache_statistics(self, days: int = 7) -> Dict[str, Any]:
        """Get comprehensive cache performance statistics."""
        
        with get_session() as session:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Overall cache statistics
            total_cache_entries = session.exec(select(CompanyDataCache)).count()
            
            # Cache analytics for the period
            analytics = session.exec(
                select(CacheAnalytics).where(
                    CacheAnalytics.access_timestamp >= cutoff_date
                )
            ).all()
            
            cache_hits = sum(1 for a in analytics if a.cache_hit)
            cache_misses = len(analytics) - cache_hits
            hit_rate = cache_hits / len(analytics) if analytics else 0
            
            # API usage statistics
            api_usage = session.exec(
                select(ApiUsageLog).where(
                    ApiUsageLog.created_at >= cutoff_date
                )
            ).all()
            
            total_cost = sum(log.cost_estimate for log in api_usage if log.cost_estimate) or 0.0
            
            # Group by service
            usage_by_service = {}
            for log in api_usage:
                service = log.api_service
                if service not in usage_by_service:
                    usage_by_service[service] = {'calls': 0, 'cost': 0.0}
                
                usage_by_service[service]['calls'] += 1
                if log.cost_estimate:
                    usage_by_service[service]['cost'] += log.cost_estimate
            
            # Calculate cost savings from caching
            estimated_cost_without_cache = cache_hits * 0.006  # Average cost per API call
            cost_savings = estimated_cost_without_cache - total_cost
            
            return {
                'period_days': days,
                'cache_statistics': {
                    'total_cached_entries': total_cache_entries,
                    'cache_hit_rate': round(hit_rate, 3),
                    'cache_hits': cache_hits,
                    'cache_misses': cache_misses,
                    'total_requests': len(analytics)
                },
                'api_usage': {
                    'total_calls': len(api_usage),
                    'total_cost': round(total_cost, 4),
                    'by_service': usage_by_service,
                    'average_cost_per_call': round(total_cost / len(api_usage), 4) if api_usage else 0
                },
                'cost_optimization': {
                    'estimated_savings': round(cost_savings, 4),
                    'cache_efficiency': round((cache_hits / (cache_hits + len(api_usage))) * 100, 1) if (cache_hits + len(api_usage)) > 0 else 0
                }
            }
    
    async def cleanup_expired_cache(self) -> Dict[str, int]:
        """Clean up expired cache entries to free up storage."""
        
        cleanup_stats = {
            'company_cache_cleaned': 0,
            'realtime_cache_cleaned': 0,
            'analytics_cleaned': 0
        }
        
        try:
            with get_session() as session:
                now = datetime.utcnow()
                
                # Clean expired company cache
                expired_company_cache = session.exec(
                    select(CompanyDataCache).where(
                        CompanyDataCache.expires_at < now
                    )
                ).all()
                
                for entry in expired_company_cache:
                    session.delete(entry)
                    cleanup_stats['company_cache_cleaned'] += 1
                
                # Clean expired real-time cache
                expired_realtime_cache = session.exec(
                    select(RealtimeDataCache).where(
                        RealtimeDataCache.expires_at < now
                    )
                ).all()
                
                for entry in expired_realtime_cache:
                    session.delete(entry)
                    cleanup_stats['realtime_cache_cleaned'] += 1
                
                # Clean old analytics (keep 30 days)
                old_analytics_cutoff = now - timedelta(days=30)
                old_analytics = session.exec(
                    select(CacheAnalytics).where(
                        CacheAnalytics.access_timestamp < old_analytics_cutoff
                    )
                ).all()
                
                for entry in old_analytics:
                    session.delete(entry)
                    cleanup_stats['analytics_cleaned'] += 1
                
                session.commit()
                
                self.logger.info(f"Cache cleanup completed: {cleanup_stats}")
                
        except Exception as e:
            self.logger.error(f"Cache cleanup failed: {e}")
            
        return cleanup_stats
    
    async def invalidate_company_cache(
        self, 
        company_identifier: str, 
        data_types: Optional[List[str]] = None
    ) -> int:
        """
        Invalidate cached data for a specific company.
        Returns number of entries invalidated.
        """
        
        try:
            with get_session() as session:
                query = select(CompanyDataCache).where(
                    CompanyDataCache.company_identifier == company_identifier
                )
                
                if data_types:
                    query = query.where(CompanyDataCache.data_type.in_(data_types))
                
                cache_entries = session.exec(query).all()
                invalidated_count = len(cache_entries)
                
                for entry in cache_entries:
                    session.delete(entry)
                
                session.commit()
                
                self.logger.info(f"Invalidated {invalidated_count} cache entries for {company_identifier}")
                return invalidated_count
                
        except Exception as e:
            self.logger.error(f"Cache invalidation failed for {company_identifier}: {e}")
            return 0
    
    async def get_company_cache_status(self, company_identifier: str) -> Dict[str, Any]:
        """Get detailed cache status for a specific company."""
        
        with get_session() as session:
            cache_entries = session.exec(
                select(CompanyDataCache).where(
                    CompanyDataCache.company_identifier == company_identifier
                )
            ).all()
            
            status = {
                'company_identifier': company_identifier,
                'cached_data_types': [],
                'total_entries': len(cache_entries),
                'fresh_entries': 0,
                'expired_entries': 0
            }
            
            now = datetime.utcnow()
            
            for entry in cache_entries:
                is_fresh = entry.expires_at > now
                
                entry_info = {
                    'data_type': entry.data_type,
                    'source': entry.source,
                    'cached_at': entry.created_at.isoformat(),
                    'expires_at': entry.expires_at.isoformat(),
                    'is_fresh': is_fresh,
                    'hit_count': entry.cache_hit_count,
                    'confidence_score': entry.confidence_score
                }
                
                status['cached_data_types'].append(entry_info)
                
                if is_fresh:
                    status['fresh_entries'] += 1
                else:
                    status['expired_entries'] += 1
            
            return status