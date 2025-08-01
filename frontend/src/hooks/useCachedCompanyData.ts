/**
 * React hooks for cache-aware company data fetching
 * Integrates with cost-optimized backend API
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

interface CacheAwareResponse<T> {
  data: T;
  source: 'cache' | 'api' | 'cache_fallback' | 'cache_expired';
  cached: boolean;
  cost?: number;
  expires_in?: number;
  confidence_score?: number;
}

interface BatchResponse {
  results: Record<string, Record<string, any>>;
  summary: {
    total_companies: number;
    cache_hits: number;
    api_calls: number;
    budget_limited: number;
    total_cost: number;
    cache_hit_rate: number;
    processing_time_ms: number;
  };
}

interface CacheInfo {
  source: string;
  cached: boolean;
  cost: number;
  expires_in?: number;
  confidence_score?: number;
  last_updated?: string;
}

// Hook for individual company data
export function useCachedCompanyData(companyName: string, website?: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);

  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<CacheAwareResponse<any>>(
        `/data/companies/${encodeURIComponent(companyName)}/profile`,
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
        expires_in: response.data.expires_in,
        confidence_score: response.data.confidence_score,
        last_updated: new Date().toISOString()
      });
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch company data';
      setError(errorMessage);
      
      // Handle specific error cases
      if (err.response?.status === 429) {
        setError('API budget exceeded. Using cached data when available.');
      }
    } finally {
      setLoading(false);
    }
  }, [companyName, website]);

  useEffect(() => {
    if (companyName) {
      fetchData();
    }
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);
  const softRefresh = useCallback(() => fetchData(false), [fetchData]);

  return {
    data,
    loading,
    error,
    cacheInfo,
    refresh,        // Force API call
    softRefresh     // Use cache if available
  };
}

// Hook for batch company data
export function useBatchCompanyData(companies: Array<{name: string, website?: string}>, dataTypes: string[] = ['profile']) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batchStats, setBatchStats] = useState<any>(null);

  useEffect(() => {
    async function fetchBatchData() {
      if (!companies.length) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.post<BatchResponse>('/data/companies/batch-profile', 
          companies,
          {
            params: {
              data_types: dataTypes
            }
          }
        );

        setData(response.data.results);
        setBatchStats(response.data.summary);
        
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || err.message || 'Batch fetch failed';
        setError(errorMessage);
        console.error('Batch fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBatchData();
  }, [companies, dataTypes]);

  return { 
    data, 
    loading, 
    error, 
    batchStats,
    // Convenience methods for accessing results
    getCompanyData: (companyName: string, dataType: string = 'profile') => {
      if (!data) return null;
      const normalizedName = companyName.toLowerCase().replace(/\s+/g, '-');
      return data[normalizedName]?.[dataType]?.data;
    },
    getCompanySource: (companyName: string, dataType: string = 'profile') => {
      if (!data) return null;
      const normalizedName = companyName.toLowerCase().replace(/\s+/g, '-');
      return data[normalizedName]?.[dataType]?.source;
    }
  };
}

// Hook for real-time price data
export function useAssetPrice(symbol: string, assetType: 'crypto' | 'stock' = 'crypto') {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);

  useEffect(() => {
    async function fetchPrice() {
      if (!symbol) return;

      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get<CacheAwareResponse<any>>(
          `/data/prices/${symbol.toUpperCase()}`,
          {
            params: { asset_type: assetType }
          }
        );

        setData(response.data.data);
        setCacheInfo({
          source: response.data.source,
          cached: response.data.cached,
          cost: response.data.cost || 0,
          expires_in: response.data.expires_in,
          last_updated: new Date().toISOString()
        });

      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch price data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchPrice();
    
    // Set up auto-refresh for prices (every 15 minutes)
    const interval = setInterval(fetchPrice, 15 * 60 * 1000);
    return () => clearInterval(interval);
    
  }, [symbol, assetType]);

  return { data, loading, error, cacheInfo };
}

// Hook for budget and cache statistics
export function useBudgetStatus() {
  const [budgetStatus, setBudgetStatus] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [budgetResponse, statsResponse] = await Promise.all([
        apiClient.get('/api/v1/data/budget/status'),
        apiClient.get('/api/v1/data/cache/stats')
      ]);

      setBudgetStatus(budgetResponse.data);
      setCacheStats(statsResponse.data);

    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch status';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    budgetStatus,
    cacheStats,
    loading,
    error,
    refresh: fetchStats
  };
}

// Hook for company cache status
export function useCompanyCacheStatus(companyIdentifier: string) {
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCacheStatus() {
      if (!companyIdentifier) return;

      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get(
          `/api/v1/data/companies/${encodeURIComponent(companyIdentifier)}/cache-status`
        );

        setCacheStatus(response.data);

      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch cache status';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchCacheStatus();
  }, [companyIdentifier]);

  return { cacheStatus, loading, error };
}

// Utility functions
export const cacheUtils = {
  formatCost: (cost: number) => `$${cost.toFixed(4)}`,
  
  formatExpiresIn: (seconds?: number) => {
    if (!seconds || seconds <= 0) return 'Expired';
    
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  },
  
  getSourceIcon: (source: string) => {
    switch (source) {
      case 'cache': return '💾';
      case 'api': return '🌐';
      case 'cache_expired': return '⏰';
      case 'cache_fallback': return '🔄';
      default: return '❓';
    }
  },
  
  getSourceColor: (source: string) => {
    switch (source) {
      case 'cache': return 'text-green-600';
      case 'api': return 'text-blue-600';
      case 'cache_expired': return 'text-yellow-600';
      case 'cache_fallback': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  },
  
  getConfidenceColor: (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  }
};