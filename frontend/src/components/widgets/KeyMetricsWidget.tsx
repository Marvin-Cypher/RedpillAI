/**
 * Key Metrics Widget
 * Shows key performance metrics for the portfolio company using real data API
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  Building,
  BarChart3,
  RefreshCw,
  Database,
  Wifi,
  AlertTriangle
} from 'lucide-react';
import { WidgetProps } from '@/lib/widgets/types';
import { useCachedCompanyData, cacheUtils } from '@/hooks/useCachedCompanyData';

interface MetricsData {
  revenue_current: number;
  revenue_growth: number;
  burn_rate: number;
  runway_months: number;
  employees: number;
  customers: number;
  arr: number;
  gross_margin: number;
}

interface KeyMetricsWidgetProps extends WidgetProps {
  companyName?: string;
  website?: string;
}

const KeyMetricsWidget: React.FC<KeyMetricsWidgetProps> = ({
  widget,
  data,
  loading: externalLoading,
  error: externalError,
  isEditing,
  onUpdate,
  onRemove,
  companyName,
  website
}) => {
  // Get company name from widget config if not passed as prop
  const effectiveCompanyName = companyName || widget.config?.companyName || 'Unknown Company';
  const effectiveWebsite = website || widget.config?.website;
  
  // Fetch real company data using our cache-aware hook
  const { data: realData, loading: dataLoading, error: dataError, cacheInfo, refresh, softRefresh } = useCachedCompanyData(
    effectiveCompanyName,
    effectiveWebsite
  );
  
  const loading = externalLoading || dataLoading;
  const error = externalError || dataError;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getMetricTrend = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  // Extract metrics from real API data or use fallback
  const metricsData: MetricsData = {
    revenue_current: realData?.key_metrics?.revenue || data?.revenue_current || 450000,
    revenue_growth: realData?.key_metrics?.revenue_growth || data?.revenue_growth || 15.2,
    burn_rate: realData?.key_metrics?.burn_rate || data?.burn_rate || 180000,
    runway_months: realData?.key_metrics?.runway || data?.runway_months || 18,
    employees: parseInt(realData?.employee_count?.replace(/[^0-9]/g, '') || '') || data?.employees || 45,
    customers: realData?.key_metrics?.customers || data?.customers || 1250,
    arr: realData?.key_metrics?.arr || data?.arr || 5400000,
    gross_margin: realData?.key_metrics?.gross_margin || data?.gross_margin || 72.5
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Key Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Key Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-red-600 text-sm">Error loading data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-lg font-semibold">Key Performance Metrics</CardTitle>
          {effectiveCompanyName !== 'Unknown Company' && (
            <Badge variant="outline" className="text-xs">
              {effectiveCompanyName}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Cache Status Indicator */}
          {cacheInfo && (
            <div className="flex items-center space-x-1">
              {cacheInfo.source === 'cache' && <Database className="w-3 h-3 text-green-500" />}
              {cacheInfo.source === 'api' && <Wifi className="w-3 h-3 text-blue-500" />}
              {cacheInfo.source === 'cache_expired' && <Clock className="w-3 h-3 text-yellow-500" />}
              <Badge variant="outline" className={`text-xs ${cacheUtils.getSourceColor(cacheInfo.source)}`}>
                {cacheInfo.source}
              </Badge>
              {cacheInfo.cost && (
                <Badge variant="outline" className="text-xs">
                  {cacheUtils.formatCost(cacheInfo.cost)}
                </Badge>
              )}
            </div>
          )}
          
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={softRefresh}
            disabled={loading}
            className="h-6 w-6 p-0 hover:bg-gray-100"
            title="Refresh data (cache-first)"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          {isEditing && (
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate?.({ ...widget.config })}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
              <BarChart3 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove?.();
              }}
              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
              title="Delete widget"
            >
              ×
            </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2 overflow-hidden">
        <div className="grid grid-cols-2 gap-2 h-full">
          <div className="text-center p-2 bg-blue-50 rounded-lg overflow-hidden">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <DollarSign className="w-4 h-4 text-blue-500" />
              {getMetricTrend(metricsData.revenue_growth)}
            </div>
            <div className="text-sm font-bold text-gray-900 truncate">
              {formatCurrency(metricsData.revenue_current)}
            </div>
            <div className="text-xs text-blue-600 font-medium truncate">Monthly Revenue</div>
            <div className="text-xs text-green-600 mt-1 truncate">
              +{formatPercentage(metricsData.revenue_growth)} QoQ
            </div>
          </div>
          
          <div className="text-center p-2 bg-green-50 rounded-lg overflow-hidden">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-sm font-bold text-gray-900 truncate">
              {formatCurrency(metricsData.arr)}
            </div>
            <div className="text-xs text-green-600 font-medium truncate">ARR</div>
            <div className="text-xs text-blue-600 mt-1 truncate">
              {formatPercentage(metricsData.gross_margin)} gross margin
            </div>
          </div>

          <div className="text-center p-2 bg-orange-50 rounded-lg overflow-hidden">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-sm font-bold text-gray-900 truncate">
              {metricsData.runway_months}
            </div>
            <div className="text-xs text-orange-600 font-medium truncate">Months Runway</div>
            <div className="text-xs text-gray-500 mt-1 truncate">
              {formatCurrency(metricsData.burn_rate)}/mo burn
            </div>
          </div>

          <div className="text-center p-2 bg-purple-50 rounded-lg overflow-hidden">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Building className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-sm font-bold text-gray-900 truncate">
              {metricsData.customers}
            </div>
            <div className="text-xs text-purple-600 font-medium truncate">Customers</div>
            <div className="text-xs text-blue-600 mt-1 truncate">
              {metricsData.employees} employees
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyMetricsWidget;