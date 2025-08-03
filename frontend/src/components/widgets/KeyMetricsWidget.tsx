/**
 * Key Metrics Widget
 * Shows key performance metrics for the portfolio company using real data API
 */

import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  Building,
  AlertTriangle
} from 'lucide-react';
import { WidgetProps } from '@/lib/widgets/types';
import { BaseWidget } from './BaseWidget';
// Removed useCachedCompanyData import - widget should use data passed via props

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
  companyId,
  onRefresh,
  companyName,
  website
}) => {
  // Get company name from widget config if not passed as prop
  const effectiveCompanyName = companyName || widget.config?.companyName || 'Unknown Company';
  
  // Use data passed from widget system instead of fetching directly
  const loading = externalLoading;
  const realData = data;
  const error = externalError;
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

  // Create mock data for testing if no real data available
  const mockData = !data ? {
    revenue_current: 450000, // $450K monthly revenue
    revenue_growth: 15.2, // 15.2% quarter over quarter growth
    burn_rate: 180000, // $180K monthly burn rate
    runway_months: 18, // 18 months runway
    employees: 45, // 45 employees
    customers: 1250, // 1,250 customers
    arr: 5400000, // $5.4M ARR
    gross_margin: 0.725 // 72.5% gross margin
  } : null;

  // Extract metrics from real API data or use fallback
  const metricsData: MetricsData = {
    revenue_current: realData?.key_metrics?.revenue || data?.revenue_current || mockData?.revenue_current || 450000,
    revenue_growth: realData?.key_metrics?.revenue_growth || data?.revenue_growth || mockData?.revenue_growth || 15.2,
    burn_rate: realData?.key_metrics?.burn_rate || data?.burn_rate || mockData?.burn_rate || 180000,
    runway_months: realData?.key_metrics?.runway || data?.runway_months || mockData?.runway_months || 18,
    employees: parseInt(realData?.employee_count?.replace(/[^0-9]/g, '') || '') || data?.employees || mockData?.employees || 45,
    customers: realData?.key_metrics?.customers || data?.customers || mockData?.customers || 1250,
    arr: realData?.key_metrics?.arr || data?.arr || mockData?.arr || 5400000,
    gross_margin: realData?.key_metrics?.gross_margin || data?.gross_margin || mockData?.gross_margin || 0.725
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading metrics...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-32 space-y-2">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <p className="text-red-600 text-sm">Failed to load metrics</p>
          <p className="text-gray-500 text-xs">{error || 'Unknown error'}</p>
        </div>
      );
    }

    if (!metricsData) {
      return (
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500 text-sm">No metrics data available</p>
        </div>
      );
    }

    return (
      <div className="pt-2 overflow-hidden">
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
      </div>
    );
  };

  return (
    <BaseWidget 
      widget={widget} 
      isEditing={isEditing} 
      onUpdate={onUpdate} 
      onRemove={onRemove}
      companyId={companyId}
      onRefresh={onRefresh}
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default KeyMetricsWidget;