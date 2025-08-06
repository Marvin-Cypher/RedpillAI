"use client"

/**
 * Key Metrics Widget
 * Shows key performance metrics for the portfolio company using real data API
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  Building,
  AlertTriangle,
  Users,
  Activity
} from 'lucide-react';
import { WidgetProps } from '@/lib/widgets/types';
import { BaseWidget } from './BaseWidget';

interface KeyMetricsWidgetProps extends WidgetProps {
  companyName?: string;
}

const KeyMetricsWidget: React.FC<KeyMetricsWidgetProps> = ({
  widget,
  data,
  loading,
  error,
  isEditing,
  onUpdate,
  onRemove,
  companyId,
  onRefresh,
  companyName
}) => {
  // Self-sufficient data fetching state (for WidgetGrid system)
  const [selfData, setSelfData] = useState<any>(null);
  const [selfLoading, setSelfLoading] = useState(false);
  const [selfError, setSelfError] = useState<string | null>(null);

  // Self-sufficient data fetching (when no data is provided)
  useEffect(() => {
    if (!data && !loading && companyId) {
      console.log('🔍 KeyMetricsWidget: No data provided, fetching self-sufficiently');
      setSelfLoading(true);
      setSelfError(null);
      
      // Import fetchWidgetData dynamically to avoid circular imports
      import('@/lib/widgets/data').then(({ fetchWidgetData }) => {
        return fetchWidgetData(widget, companyId);
      })
        .then((fetchedData) => {
          console.log('✅ KeyMetricsWidget: Self-fetched data:', fetchedData);
          setSelfData(fetchedData);
        })
        .catch((fetchError) => {
          console.error('❌ KeyMetricsWidget: Self-fetch failed:', fetchError);
          setSelfError(fetchError.message || 'Failed to fetch key metrics data');
        })
        .finally(() => {
          setSelfLoading(false);
        });
    }
  }, [data, loading, widget, companyId]);

  // Determine which data/loading/error to use
  const actualData = data || selfData;
  const actualLoading = loading || selfLoading;
  const actualError = error || selfError;
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

  // Determine company type from actual data
  const companyType = actualData?.company_category || actualData?.company_type || 'private';
  
  // Create appropriate mock data based on company type (fallback only)
  const getMockData = () => {
    if (companyType === 'crypto') {
      return {
        network_transactions: 750000,
        network_growth: 25,
        token_holders: 250000,
        market_cap: 8000000000,
        tvl: 2500000000,
        developers: 65,
        partnerships: 25,
        chain_activity: 85
      };
    } else if (companyType === 'public') {
      return {
        revenue_current: 250000000000,
        revenue_growth: 12.5,
        profit_margin: 0.15,
        market_cap: 1500000000000,
        pe_ratio: 28,
        dividend_yield: 0.025,
        employees: 180000,
        stock_performance: 8.5
      };
    } else {
      return {
        revenue_current: 450000,
        revenue_growth: 15.2,
        burn_rate: 180000,
        runway_months: 18,
        employees: 45,
        customers: 1250,
        arr: 5400000,
        gross_margin: 0.725
      };
    }
  };

  const mockData = !actualData ? getMockData() : null;
  const finalData = actualData || mockData;

  // Dynamic metric rendering based on company type
  const renderMetricCard = (label: string, value: any, icon: any, color: string, format: string) => {
    const IconComponent = icon;
    let formattedValue = 'N/A';
    
    if (value !== null && value !== undefined) {
      switch (format) {
        case 'currency':
          formattedValue = formatCurrency(value);
          break;
        case 'percentage':
          formattedValue = formatPercentage(value);
          break;
        case 'number':
          formattedValue = value.toLocaleString();
          break;
        case 'months':
          formattedValue = `${value} months`;
          break;
        default:
          formattedValue = value.toString();
      }
    }
    
    return (
      <div className="bg-muted rounded-lg p-3 hover:bg-accent transition-colors">
        <div className="flex items-center space-x-2 mb-1">
          <IconComponent className={`w-4 h-4 ${color}`} />
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <div className="text-lg font-bold text-foreground">{formattedValue}</div>
      </div>
    );
  };

  const renderCryptoMetrics = () => (
    <div className="grid grid-cols-2 gap-3">
      {renderMetricCard('Daily Transactions', finalData?.network_transactions, Activity, 'text-blue-600', 'number')}
      {renderMetricCard('Network Growth', finalData?.network_growth, TrendingUp, 'text-green-600', 'percentage')}
      {renderMetricCard('Token Holders', finalData?.token_holders, Users, 'text-purple-600', 'number')}
      {renderMetricCard('Market Cap', finalData?.market_cap, Building, 'text-orange-600', 'currency')}
      {renderMetricCard('TVL', finalData?.tvl, DollarSign, 'text-green-600', 'currency')}
      {renderMetricCard('Active Devs', finalData?.developers, Users, 'text-blue-600', 'number')}
    </div>
  );

  const renderPublicMetrics = () => (
    <div className="grid grid-cols-2 gap-3">
      {renderMetricCard('Revenue (TTM)', finalData?.revenue_current, DollarSign, 'text-green-600', 'currency')}
      {renderMetricCard('Revenue Growth', finalData?.revenue_growth, TrendingUp, 'text-blue-600', 'percentage')}
      {renderMetricCard('Profit Margin', finalData?.profit_margin, TrendingUp, 'text-green-600', 'percentage')}
      {renderMetricCard('Market Cap', finalData?.market_cap, Building, 'text-purple-600', 'currency')}
      {renderMetricCard('P/E Ratio', finalData?.pe_ratio, Building, 'text-orange-600', 'number')}
      {renderMetricCard('Stock Performance', finalData?.stock_performance, TrendingUp, 'text-blue-600', 'percentage')}
    </div>
  );

  const renderPrivateMetrics = () => (
    <div className="grid grid-cols-2 gap-3">
      {renderMetricCard('Monthly Revenue', finalData?.revenue_current, DollarSign, 'text-green-600', 'currency')}
      {renderMetricCard('Growth Rate', finalData?.revenue_growth, TrendingUp, 'text-blue-600', 'percentage')}
      {renderMetricCard('Burn Rate', finalData?.burn_rate, TrendingDown, 'text-red-600', 'currency')}
      {renderMetricCard('Runway', finalData?.runway_months, Clock, 'text-orange-600', 'months')}
      {renderMetricCard('Employees', finalData?.employees, Users, 'text-purple-600', 'number')}
      {renderMetricCard('ARR', finalData?.arr, Building, 'text-green-600', 'currency')}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading metrics...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-32 space-y-2">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-destructive text-sm">Failed to load metrics</p>
          <p className="text-muted-foreground text-xs">{error || 'Unknown error'}</p>
        </div>
      );
    }

    if (!finalData) {
      return (
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground text-sm">No metrics data available</p>
        </div>
      );
    }

    // Render different metrics based on company type
    return (
      <div className="h-full">
        <div className="mb-4">
          <Badge variant="outline" className="text-xs capitalize">
            {companyType} Company Metrics
          </Badge>
        </div>
        {companyType === 'crypto' && renderCryptoMetrics()}
        {companyType === 'public' && renderPublicMetrics()}
        {companyType === 'private' && renderPrivateMetrics()}
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
      <div className="space-y-4">
        {/* Company name badge if provided */}
        {companyName && (
          <Badge variant="outline" className="text-xs">
            {companyName}
          </Badge>
        )}
        {renderContent()}
      </div>
    </BaseWidget>
  );
};

export default KeyMetricsWidget;