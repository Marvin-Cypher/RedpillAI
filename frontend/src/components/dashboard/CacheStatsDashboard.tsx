/**
 * Cache Statistics Dashboard
 * Displays cost optimization metrics and cache performance
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  Wifi, 
  DollarSign, 
  TrendingUp, 
  Clock,
  RefreshCw,
  BarChart3,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useBudgetStatus, cacheUtils } from '@/hooks/useCachedCompanyData';

const CacheStatsDashboard: React.FC = () => {
  const { budgetStatus, cacheStats, loading, error, refresh } = useBudgetStatus();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="h-32">
            <CardContent className="flex items-center justify-center h-full">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex flex-col items-center justify-center h-32 space-y-2">
          <p className="text-red-600 text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getCacheEfficiencyColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-600';
    if (rate >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBudgetStatusColor = (status: boolean) => {
    return status ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Data Optimization Dashboard</h2>
          <p className="text-sm text-gray-400">Cache performance and cost management</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Cache Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cache Hit Rate */}
        <Card className="redpill-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {cacheStats ? `${Math.round(cacheStats.cache_performance?.cache_statistics?.cache_hit_rate * 100)}%` : 'N/A'}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-xs text-gray-400">
                {cacheStats?.cache_performance?.cache_statistics?.cache_hits || 0} hits
              </p>
              <Badge 
                variant="secondary" 
                className={`text-xs ${getCacheEfficiencyColor(cacheStats?.cache_performance?.cache_statistics?.cache_hit_rate || 0)}`}
              >
                {cacheStats?.cache_performance?.cache_statistics?.cache_hit_rate >= 0.8 ? 'Excellent' : 
                 cacheStats?.cache_performance?.cache_statistics?.cache_hit_rate >= 0.6 ? 'Good' : 'Poor'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Cost Savings */}
        <Card className="redpill-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Cost Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {cacheStats ? cacheUtils.formatCost(cacheStats.cache_performance?.cost_optimization?.estimated_savings || 0) : '$0.00'}
            </div>
            <p className="text-xs text-gray-400">
              vs. no caching ({cacheStats?.period_days || 7} days)
            </p>
          </CardContent>
        </Card>

        {/* Total API Calls */}
        <Card className="redpill-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">API Calls</CardTitle>
            <Activity className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {cacheStats?.cache_performance?.api_usage?.total_calls || 0}
            </div>
            <p className="text-xs text-gray-400">
              {cacheUtils.formatCost(cacheStats?.cache_performance?.api_usage?.total_cost || 0)} total cost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Status */}
      {budgetStatus && (
        <Card className="redpill-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">API Budget Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(budgetStatus.budgets || {}).map(([service, budget]: [string, any]) => (
                <div key={service} className="p-4 bg-dark-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-white capitalize">{service}</h4>
                    <div className="flex items-center space-x-1">
                      {budget.within_budget ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      )}
                      <Badge 
                        variant={budget.within_budget ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {budget.within_budget ? 'OK' : 'Over'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Calls Usage */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Calls</span>
                        <span>{budget.calls_used}/{budget.calls_limit}</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            budget.calls_used / budget.calls_limit > 0.8 ? 'bg-red-500' :
                            budget.calls_used / budget.calls_limit > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, (budget.calls_used / budget.calls_limit) * 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Cost Usage */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Cost</span>
                        <span>{cacheUtils.formatCost(budget.cost_used)}/{cacheUtils.formatCost(budget.cost_limit)}</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            budget.cost_used / budget.cost_limit > 0.8 ? 'bg-red-500' :
                            budget.cost_used / budget.cost_limit > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, (budget.cost_used / budget.cost_limit) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Usage Breakdown */}
      {cacheStats?.cache_performance?.api_usage?.by_service && (
        <Card className="redpill-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">API Usage by Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(cacheStats.cache_performance.api_usage.by_service).map(([service, usage]: [string, any]) => (
                <div key={service} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {service === 'tavily' && <Wifi className="w-4 h-4 text-blue-400" />}
                      {service === 'openbb' && <BarChart3 className="w-4 h-4 text-green-400" />}
                      {service === 'coingecko' && <TrendingUp className="w-4 h-4 text-orange-400" />}
                      <span className="text-sm font-medium text-white capitalize">{service}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{usage.calls} calls</div>
                    <div className="text-xs text-gray-400">{cacheUtils.formatCost(usage.cost)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cache Efficiency Timeline */}
      <Card className="redpill-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Cache Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {cacheStats?.cache_performance?.cache_statistics?.total_cached_entries || 0}
              </div>
              <p className="text-xs text-gray-400">Cached Entries</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {cacheStats?.cache_performance?.cache_statistics?.total_requests || 0}
              </div>
              <p className="text-xs text-gray-400">Total Requests</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {cacheStats?.cache_performance?.cache_statistics?.cache_hits || 0}
              </div>
              <p className="text-xs text-gray-400">Cache Hits</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {cacheStats?.cache_performance?.cache_statistics?.cache_misses || 0}
              </div>
              <p className="text-xs text-gray-400">Cache Misses</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CacheStatsDashboard;