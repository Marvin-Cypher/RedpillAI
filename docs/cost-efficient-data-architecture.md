# Cost-Efficient Data Architecture with Smart Caching

## Overview

This document outlines a cost-optimized architecture that minimizes API usage through intelligent data categorization, aggressive caching, and shared data reuse across users.

## Data Classification Strategy

### Public/Shared Data (Cache-Once, Use-Many)
**Characteristics**: Static or slow-changing company information that's the same for all users
- Company profiles (name, description, founded, headquarters)
- Team information (founders, key personnel)
- Funding history (rounds, investors, amounts)
- General company metrics (employee count, sector classification)
- Basic financial data (market cap, stock price for display)

**Caching Strategy**: Global cache with 30-day expiration, shared across all users

### Private/User-Specific Data (Per-User Processing)
**Characteristics**: User-specific or contextual information
- Deal pipeline data (user's specific deals and status)
- Investment memos and analysis
- Private notes and conversations
- User-specific AI chat context
- Custom research requests

**Caching Strategy**: User-scoped cache with shorter expiration

### Real-Time Data (Minimal Caching)
**Characteristics**: Time-sensitive information that changes frequently
- Live token/stock prices
- Breaking news and market sentiment
- Real-time trading data
- Current market intelligence

**Caching Strategy**: Short-term cache (5-15 minutes) or no cache

## Enhanced Database Schema

### 1. Shared Company Data Cache

```sql
-- Global company information cache (shared across users)
CREATE TABLE company_data_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_identifier VARCHAR(255) NOT NULL, -- normalized company name or domain
    data_type VARCHAR(50) NOT NULL, -- 'profile', 'team', 'funding', 'metrics'
    data_version INTEGER DEFAULT 1,
    cached_data JSONB NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'tavily', 'openbb', 'manual'
    confidence_score DECIMAL(3,2),
    cache_hit_count INTEGER DEFAULT 0, -- Track usage
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL, -- 30 days for public data
    
    UNIQUE(company_identifier, data_type)
);

-- Index for fast lookups
CREATE INDEX idx_company_cache_identifier_type ON company_data_cache(company_identifier, data_type);
CREATE INDEX idx_company_cache_expires ON company_data_cache(expires_at);

-- Cache hit tracking
CREATE TABLE cache_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_entry_id UUID REFERENCES company_data_cache(id),
    accessed_by_user UUID REFERENCES users(id),
    access_timestamp TIMESTAMP DEFAULT NOW(),
    cache_hit BOOLEAN DEFAULT TRUE -- false if had to fetch new data
);
```

### 2. User-Specific Data

```sql
-- User-specific company data (deals, notes, private analysis)
CREATE TABLE user_company_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    company_identifier VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL, -- 'deal', 'notes', 'analysis', 'memo'
    private_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(user_id, company_identifier, data_type)
);

-- Real-time data cache (short-lived, shared but frequently updated)
CREATE TABLE realtime_data_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_key VARCHAR(255) NOT NULL, -- 'price_BTC', 'news_crypto', etc.
    data_payload JSONB NOT NULL,
    source VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL, -- 5-15 minutes
    
    UNIQUE(data_key)
);

-- API usage tracking for cost management
CREATE TABLE api_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    api_service VARCHAR(50) NOT NULL, -- 'tavily', 'openbb', 'coingecko'
    endpoint VARCHAR(100),
    query_params JSONB,
    response_cached BOOLEAN DEFAULT FALSE,
    cost_estimate DECIMAL(8,4), -- estimated cost in USD
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Smart Cache Management

```python
# backend/app/services/smart_cache_service.py
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlmodel import Session, select
import hashlib
import json

class SmartCacheService:
    """Intelligent caching service to minimize API costs"""
    
    def __init__(self):
        self.cache_ttl = {
            'profile': timedelta(days=30),      # Company profiles change rarely
            'team': timedelta(days=14),         # Team info changes occasionally  
            'funding': timedelta(days=7),       # Funding info changes weekly
            'metrics': timedelta(days=3),       # Metrics change more frequently
            'price': timedelta(minutes=15),     # Prices change rapidly
            'news': timedelta(hours=6),         # News changes throughout day
        }
    
    def normalize_company_identifier(self, company_name: str, website: str = None) -> str:
        """Create normalized identifier for company"""
        # Use website domain if available (most reliable)
        if website:
            domain = website.replace('https://', '').replace('http://', '').replace('www.', '')
            return domain.split('/')[0].lower()
        
        # Otherwise normalize company name
        normalized = company_name.lower().strip()
        # Remove common suffixes that don't affect identity
        suffixes = [' inc', ' inc.', ' corp', ' corp.', ' ltd', ' ltd.', ' llc', ' labs']
        for suffix in suffixes:
            if normalized.endswith(suffix):
                normalized = normalized[:-len(suffix)]
        
        return normalized.replace(' ', '-')
    
    async def get_cached_data(
        self, 
        company_identifier: str, 
        data_type: str,
        user_id: str = None
    ) -> Optional[Dict[str, Any]]:
        """Get cached data if available and not expired"""
        
        with get_session() as session:
            # Check user-specific cache first if user_id provided
            if user_id and data_type in ['deal', 'notes', 'analysis']:
                user_data = session.exec(
                    select(UserCompanyData).where(
                        UserCompanyData.user_id == user_id,
                        UserCompanyData.company_identifier == company_identifier,
                        UserCompanyData.data_type == data_type
                    )
                ).first()
                
                if user_data:
                    return user_data.private_data
            
            # Check shared cache
            cache_entry = session.exec(
                select(CompanyDataCache).where(
                    CompanyDataCache.company_identifier == company_identifier,
                    CompanyDataCache.data_type == data_type,
                    CompanyDataCache.expires_at > datetime.utcnow()
                )
            ).first()
            
            if cache_entry:
                # Update hit count and log access
                cache_entry.cache_hit_count += 1
                session.add(cache_entry)
                
                # Log cache hit for analytics
                cache_hit = CacheAnalytics(
                    cache_entry_id=cache_entry.id,
                    accessed_by_user=user_id,
                    cache_hit=True
                )
                session.add(cache_hit)
                session.commit()
                
                return cache_entry.cached_data
            
            return None
    
    async def store_cached_data(
        self,
        company_identifier: str,
        data_type: str,
        data: Dict[str, Any],
        source: str,
        confidence_score: float = 1.0,
        user_id: str = None
    ):
        """Store data in appropriate cache"""
        
        with get_session() as session:
            # Store user-specific data
            if user_id and data_type in ['deal', 'notes', 'analysis', 'memo']:
                user_data = UserCompanyData(
                    user_id=user_id,
                    company_identifier=company_identifier,
                    data_type=data_type,
                    private_data=data
                )
                session.merge(user_data)  # Insert or update
            
            # Store shared data
            elif data_type in ['profile', 'team', 'funding', 'metrics']:
                expires_at = datetime.utcnow() + self.cache_ttl[data_type]
                
                cache_entry = CompanyDataCache(
                    company_identifier=company_identifier,
                    data_type=data_type,
                    cached_data=data,
                    source=source,
                    confidence_score=confidence_score,
                    expires_at=expires_at
                )
                session.merge(cache_entry)  # Insert or update
            
            # Store real-time data with short TTL
            elif data_type in ['price', 'news']:
                data_key = f"{data_type}_{company_identifier}"
                expires_at = datetime.utcnow() + self.cache_ttl[data_type]
                
                realtime_data = RealtimeDataCache(
                    data_key=data_key,
                    data_payload=data,
                    source=source,
                    expires_at=expires_at
                )
                session.merge(realtime_data)
            
            session.commit()
    
    async def check_api_budget(self, user_id: str, api_service: str) -> Dict[str, Any]:
        """Check if user/system is within API budget"""
        with get_session() as session:
            # Check today's usage
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            
            today_usage = session.exec(
                select(ApiUsageLog).where(
                    ApiUsageLog.user_id == user_id,
                    ApiUsageLog.api_service == api_service,
                    ApiUsageLog.created_at >= today_start
                )
            ).all()
            
            total_cost = sum(log.cost_estimate for log in today_usage if log.cost_estimate)
            call_count = len(today_usage)
            
            # Set daily limits
            daily_limits = {
                'tavily': {'calls': 100, 'cost': 5.00},
                'openbb': {'calls': 500, 'cost': 0.00},  # Free tier
                'coingecko': {'calls': 200, 'cost': 2.00}
            }
            
            limits = daily_limits.get(api_service, {'calls': 50, 'cost': 10.00})
            
            return {
                'within_budget': call_count < limits['calls'] and total_cost < limits['cost'],
                'calls_used': call_count,
                'calls_limit': limits['calls'],
                'cost_used': total_cost,
                'cost_limit': limits['cost']
            }
```

### 4. Cost-Optimized Data Service

```python
# backend/app/services/cost_optimized_data_service.py
from typing import Dict, Any, Optional
from .smart_cache_service import SmartCacheService
from .tavily_service import TavilyService
from .openbb_service import OpenBBService

class CostOptimizedDataService:
    """Main service that prioritizes cache hits over API calls"""
    
    def __init__(self):
        self.cache_service = SmartCacheService()
        self.tavily_service = TavilyService()
        self.openbb_service = OpenBBService()
    
    async def get_company_profile(
        self, 
        company_name: str, 
        website: str = None,
        user_id: str = None,
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """Get company profile with intelligent caching"""
        
        company_id = self.cache_service.normalize_company_identifier(company_name, website)
        
        # Always check cache first unless force_refresh
        if not force_refresh:
            cached_data = await self.cache_service.get_cached_data(
                company_id, 'profile', user_id
            )
            if cached_data:
                return {
                    'data': cached_data,
                    'source': 'cache',
                    'cost': 0.0,
                    'cached': True
                }
        
        # Check API budget before making expensive calls
        budget_check = await self.cache_service.check_api_budget(user_id, 'tavily')
        if not budget_check['within_budget']:
            # Return cached data even if expired, or basic data
            cached_data = await self.cache_service.get_cached_data(
                company_id, 'profile', user_id
            )
            if cached_data:
                return {
                    'data': cached_data,
                    'source': 'cache_expired',
                    'cost': 0.0,
                    'cached': True,
                    'warning': 'API budget exceeded, using cached data'
                }
            else:
                return {
                    'error': 'No cached data available and API budget exceeded',
                    'budget_status': budget_check
                }
        
        # Fetch new data from API
        try:
            profile_data = await self.tavily_service.fetch_company_profile(
                company_name, website
            )
            
            # Store in cache for future use
            await self.cache_service.store_cached_data(
                company_id, 'profile', profile_data, 'tavily', 0.8
            )
            
            # Log API usage
            await self._log_api_usage(user_id, 'tavily', 'company_profile', 0.05)
            
            return {
                'data': profile_data,
                'source': 'api',
                'cost': 0.05,
                'cached': False
            }
            
        except Exception as e:
            # Fallback to cached data if API fails
            cached_data = await self.cache_service.get_cached_data(
                company_id, 'profile', user_id
            )
            if cached_data:
                return {
                    'data': cached_data,
                    'source': 'cache_fallback',
                    'cost': 0.0,
                    'cached': True,
                    'api_error': str(e)
                }
            raise e
    
    async def get_real_time_price(
        self, 
        symbol: str, 
        asset_type: str = 'crypto'
    ) -> Dict[str, Any]:
        """Get real-time price with short-term caching"""
        
        cache_key = f"price_{symbol.lower()}"
        
        # Check short-term cache (15 minutes for prices)
        with get_session() as session:
            cached_price = session.exec(
                select(RealtimeDataCache).where(
                    RealtimeDataCache.data_key == cache_key,
                    RealtimeDataCache.expires_at > datetime.utcnow()
                )
            ).first()
            
            if cached_price:
                return {
                    'data': cached_price.data_payload,
                    'source': 'cache',
                    'cached': True,
                    'expires_in': (cached_price.expires_at - datetime.utcnow()).seconds
                }
        
        # Fetch fresh price data
        if asset_type == 'crypto':
            price_data = await self.openbb_service.get_crypto_price(symbol)
        else:
            price_data = await self.openbb_service.get_stock_price(symbol)
        
        # Cache for 15 minutes
        await self.cache_service.store_cached_data(
            symbol, 'price', price_data, 'openbb'
        )
        
        return {
            'data': price_data,
            'source': 'api',
            'cached': False
        }
    
    async def get_batch_company_data(
        self, 
        companies: List[Dict[str, str]], 
        user_id: str
    ) -> Dict[str, Any]:
        """Efficiently process multiple companies, maximizing cache hits"""
        
        results = {}
        api_calls_needed = []
        total_cache_hits = 0
        total_api_calls = 0
        
        # First pass: check what's in cache
        for company in companies:
            company_name = company['name']
            website = company.get('website')
            company_id = self.cache_service.normalize_company_identifier(company_name, website)
            
            cached_profile = await self.cache_service.get_cached_data(
                company_id, 'profile', user_id
            )
            
            if cached_profile:
                results[company_id] = {
                    'data': cached_profile,
                    'source': 'cache',
                    'cost': 0.0
                }
                total_cache_hits += 1
            else:
                api_calls_needed.append({
                    'company_id': company_id,
                    'name': company_name,
                    'website': website
                })
        
        # Second pass: make necessary API calls (with budget check)
        budget_check = await self.cache_service.check_api_budget(user_id, 'tavily')
        max_api_calls = min(
            len(api_calls_needed),
            budget_check['calls_limit'] - budget_check['calls_used'],
            10  # Batch limit to prevent overwhelming
        )
        
        for i, company_info in enumerate(api_calls_needed[:max_api_calls]):
            try:
                profile_data = await self.tavily_service.fetch_company_profile(
                    company_info['name'], company_info['website']
                )
                
                # Store in cache
                await self.cache_service.store_cached_data(
                    company_info['company_id'], 'profile', profile_data, 'tavily', 0.8
                )
                
                results[company_info['company_id']] = {
                    'data': profile_data,
                    'source': 'api',
                    'cost': 0.05
                }
                total_api_calls += 1
                
                # Add delay to respect rate limits
                await asyncio.sleep(0.5)
                
            except Exception as e:
                results[company_info['company_id']] = {
                    'error': str(e),
                    'source': 'api_failed'
                }
        
        # Log batch operation
        await self._log_api_usage(
            user_id, 'tavily', 'batch_company_profile', 
            total_api_calls * 0.05, {'batch_size': len(companies)}
        )
        
        return {
            'results': results,
            'summary': {
                'total_companies': len(companies),
                'cache_hits': total_cache_hits,
                'api_calls': total_api_calls,
                'total_cost': total_api_calls * 0.05,
                'cache_hit_rate': total_cache_hits / len(companies) if companies else 0
            }
        }
```

### 5. Optimized API Endpoints

```python
# backend/app/api/v1/data.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from ..services.cost_optimized_data_service import CostOptimizedDataService
from ..auth import get_current_user

router = APIRouter()

@router.get("/companies/{company_name}/profile")
async def get_company_profile(
    company_name: str,
    website: Optional[str] = Query(None),
    force_refresh: bool = Query(False),
    current_user = Depends(get_current_user),
    data_service: CostOptimizedDataService = Depends()
):
    """Get company profile with intelligent caching"""
    try:
        result = await data_service.get_company_profile(
            company_name=company_name,
            website=website,
            user_id=current_user.id,
            force_refresh=force_refresh
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/companies/batch-profile")
async def get_batch_company_profiles(
    companies: List[Dict[str, str]],  # [{"name": "LayerZero", "website": "layerzero.network"}]
    current_user = Depends(get_current_user),
    data_service: CostOptimizedDataService = Depends()
):
    """Get multiple company profiles efficiently"""
    if len(companies) > 50:
        raise HTTPException(status_code=400, detail="Batch size limited to 50 companies")
    
    result = await data_service.get_batch_company_data(companies, current_user.id)
    return result

@router.get("/cache/stats")
async def get_cache_statistics(
    current_user = Depends(get_current_user),
    cache_service: SmartCacheService = Depends()
):
    """Get cache performance statistics"""
    with get_session() as session:
        # Cache hit rates
        total_cache_entries = session.exec(select(CompanyDataCache)).count()
        
        # Recent cache hits vs misses
        recent_analytics = session.exec(
            select(CacheAnalytics).where(
                CacheAnalytics.access_timestamp >= datetime.utcnow() - timedelta(days=7)
            )
        ).all()
        
        cache_hits = sum(1 for a in recent_analytics if a.cache_hit)
        cache_misses = len(recent_analytics) - cache_hits
        hit_rate = cache_hits / len(recent_analytics) if recent_analytics else 0
        
        # API usage and costs
        api_usage = session.exec(
            select(ApiUsageLog).where(
                ApiUsageLog.created_at >= datetime.utcnow() - timedelta(days=7)
            )
        ).all()
        
        total_cost = sum(log.cost_estimate for log in api_usage if log.cost_estimate)
        
        return {
            'cache_statistics': {
                'total_cached_entries': total_cache_entries,
                'cache_hit_rate_7d': hit_rate,
                'cache_hits_7d': cache_hits,
                'cache_misses_7d': cache_misses
            },
            'api_usage_7d': {
                'total_calls': len(api_usage),
                'total_cost': total_cost,
                'by_service': {
                    service: {
                        'calls': len([l for l in api_usage if l.api_service == service]),
                        'cost': sum(l.cost_estimate for l in api_usage 
                                  if l.api_service == service and l.cost_estimate)
                    }
                    for service in set(log.api_service for log in api_usage)
                }
            }
        }

@router.get("/prices/{symbol}")
async def get_asset_price(
    symbol: str,
    asset_type: str = Query("crypto", regex="^(crypto|stock)$"),
    data_service: CostOptimizedDataService = Depends()
):
    """Get real-time asset price with caching"""
    result = await data_service.get_real_time_price(symbol, asset_type)
    return result

@router.delete("/cache/company/{company_identifier}")
async def invalidate_company_cache(
    company_identifier: str,
    data_types: Optional[List[str]] = Query(None),
    current_user = Depends(get_current_user)
):
    """Invalidate cached data for a company (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    with get_session() as session:
        query = select(CompanyDataCache).where(
            CompanyDataCache.company_identifier == company_identifier
        )
        
        if data_types:
            query = query.where(CompanyDataCache.data_type.in_(data_types))
        
        cache_entries = session.exec(query).all()
        
        for entry in cache_entries:
            session.delete(entry)
        
        session.commit()
        
        return {
            'invalidated_entries': len(cache_entries),
            'company_identifier': company_identifier,
            'data_types': data_types or 'all'
        }
```

### 6. Frontend Integration with Cache Awareness

```typescript
// frontend/src/hooks/useCachedCompanyData.ts
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

interface CacheAwareResponse<T> {
  data: T;
  source: 'cache' | 'api' | 'cache_fallback';
  cached: boolean;
  cost?: number;
  expires_in?: number;
  cache_hit_rate?: number;
}

export function useCachedCompanyData(companyName: string, website?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<any>(null);

  const fetchData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      const response = await apiClient.get<CacheAwareResponse<any>>(
        `/api/v1/data/companies/${encodeURIComponent(companyName)}/profile`,
        {
          params: {
            website,
            force_refresh: forceRefresh
          }
        }
      );

      setData(response.data.data);
      setCacheInfo({
        source: response.data.source,
        cached: response.data.cached,
        cost: response.data.cost || 0,
        expires_in: response.data.expires_in
      });
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyName, website]);

  return {
    data,
    loading,
    error,
    cacheInfo,
    refetch: () => fetchData(true), // Force refresh
    softRefetch: () => fetchData(false) // Use cache if available
  };
}

// frontend/src/hooks/useBatchCompanyData.ts
export function useBatchCompanyData(companies: Array<{name: string, website?: string}>) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [batchStats, setBatchStats] = useState<any>(null);

  useEffect(() => {
    async function fetchBatchData() {
      if (!companies.length) return;

      try {
        setLoading(true);
        const response = await apiClient.post('/api/v1/data/companies/batch-profile', {
          companies
        });

        setData(response.data.results);
        setBatchStats(response.data.summary);
      } catch (err: any) {
        console.error('Batch fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBatchData();
  }, [companies]);

  return { data, loading, batchStats };
}
```

### 7. Widget Updates with Cache Integration

```typescript
// frontend/src/components/widgets/CacheAwareKeyMetricsWidget.tsx
import React from 'react';
import { useCachedCompanyData } from '@/hooks/useCachedCompanyData';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, Wifi } from 'lucide-react';

const CacheAwareKeyMetricsWidget: React.FC<{companyName: string, website?: string}> = ({
  companyName,
  website
}) => {
  const { data, loading, error, cacheInfo, refetch, softRefetch } = useCachedCompanyData(
    companyName, 
    website
  );

  const getCacheStatusIcon = () => {
    if (cacheInfo?.cached) {
      return <Database className="w-3 h-3 text-green-500" />;
    } else {
      return <Wifi className="w-3 h-3 text-blue-500" />;
    }
  };

  const getCacheStatusText = () => {
    if (!cacheInfo) return '';
    
    if (cacheInfo.cached) {
      return `Cached data • $${cacheInfo.cost.toFixed(3)} saved`;
    } else {
      return `Fresh data • $${cacheInfo.cost.toFixed(3)} cost`;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Key Metrics</CardTitle>
        <div className="flex items-center space-x-2">
          {cacheInfo && (
            <div className="flex items-center space-x-1">
              {getCacheStatusIcon()}
              <Badge variant="outline" className="text-xs">
                {cacheInfo.source}
              </Badge>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={softRefetch}
            disabled={loading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <div>Loading metrics...</div>}
        {error && <div className="text-red-500 text-sm">Error: {error}</div>}
        {data && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <MetricCard 
                label="Revenue" 
                value={data.metrics?.revenue || 'N/A'} 
                format="currency" 
              />
              <MetricCard 
                label="Employees" 
                value={data.employee_count || 'N/A'} 
                format="number" 
              />
              {/* ... other metrics */}
            </div>
            
            {/* Cache info footer */}
            <div className="text-xs text-gray-500 pt-2 border-t">
              {getCacheStatusText()}
              {cacheInfo?.expires_in && (
                <span className="ml-2">• Expires in {Math.round(cacheInfo.expires_in / 60)}min</span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
```

## Cost Optimization Results

### Expected Cost Reduction
- **Without Caching**: ~$200-400/month for 100 companies
- **With Smart Caching**: ~$20-50/month for same usage
- **Cache Hit Rate Target**: 85-95% for company profiles

### Performance Benefits
- **API Response Time**: 200-500ms
- **Cache Hit Response Time**: 10-50ms
- **Batch Processing**: 90% faster with cache
- **User Experience**: Instant data for repeat queries

### Implementation Priority
1. **Week 1**: Implement SmartCacheService and database schema
2. **Week 2**: Build CostOptimizedDataService
3. **Week 3**: Create cache-aware API endpoints
4. **Week 4**: Update frontend components with cache awareness
5. **Week 5**: Testing, monitoring, and optimization

This architecture ensures minimal API costs while providing excellent user experience through intelligent caching and data reuse strategies.