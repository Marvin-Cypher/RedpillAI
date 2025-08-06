"use client"

/**
 * Fundamentals Widget
 * Display key financial metrics and ratios
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building,
  Percent,
  Info,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { WidgetProps } from '@/lib/widgets/types';
import { BaseWidget } from './BaseWidget';
import { fetchWidgetData } from '@/lib/widgets/data';

// Helper function to detect company type from data (fallback only)
function detectCompanyType(data: any): 'public' | 'crypto' | 'private' {
  if (!data) return 'private';
  
  const name = (data.name || '').toLowerCase();
  const industry = (data.industry || '').toLowerCase();
  
  // First check for well-known public companies (most reliable)
  const publicCompanies = ['amazon', 'nvidia', 'apple', 'microsoft', 'google', 'meta', 'tesla'];
  if (publicCompanies.some(company => name.includes(company))) {
    return 'public';
  }
  
  // Check if it has explicit crypto data (most reliable crypto indicator)
  if (data.crypto_data || data.token_market_cap || data.token_price || data.circulating_supply) {
    return 'crypto';
  }
  
  // Check industry/sector for crypto indicators
  if (industry.includes('blockchain') || industry.includes('crypto') || 
      name.includes('protocol') || name.includes('network') || name.includes('chain')) {
    return 'crypto';
  }
  
  // Check if it has public company indicators (but not crypto indicators)
  if (!data.crypto_data && (data.pe_ratio || data.dividend_yield || data.debt_ratio)) {
    return 'public';
  }
  
  // Check for very large valuations that suggest public companies
  if (data.key_metrics?.valuation && data.key_metrics.valuation > 500000000000) { // $500B+
    return 'public';
  }
  
  // Default to private
  return 'private';
}

const FundamentalsWidget: React.FC<WidgetProps> = ({
  widget,
  data,
  loading,
  error,
  isEditing,
  onUpdate,
  onRemove,
  companyId,
  onRefresh
}) => {
  // Self-sufficient data fetching state (for WidgetGrid system)
  const [selfData, setSelfData] = useState<any>(null);
  const [selfLoading, setSelfLoading] = useState(false);
  const [selfError, setSelfError] = useState<string | null>(null);

  // Self-sufficient data fetching (when no data is provided)
  useEffect(() => {
    if (!data && !loading && companyId) {
      console.log('🔄 FundamentalsWidget: No data provided, fetching self-sufficiently');
      setSelfLoading(true);
      setSelfError(null);
      
      fetchWidgetData(widget, companyId)
        .then((fetchedData) => {
          console.log('✅ FundamentalsWidget: Self-fetched data:', fetchedData);
          setSelfData(fetchedData);
        })
        .catch((fetchError) => {
          console.error('❌ FundamentalsWidget: Self-fetch failed:', fetchError);
          setSelfError(fetchError.message || 'Failed to fetch fundamentals data');
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

  // Create mock data for testing if no real data available (memoized to prevent re-renders)
  const mockData = useMemo(() => (!actualData ? {
    company_type: 'private',
    key_metrics: {
      valuation: 2500000000, // $2.5B
      revenue: 150000000, // $150M
      gross_margin: 0.75, // 75%
      burn_rate: 8000000 // $8M/month
    },
    total_funding: 350000000 // $350M
  } : null), [actualData]);

  const finalData = actualData || mockData;

  // Determine company type from data fetcher or widget config or fallback detection
  const companyType = finalData?.company_category || widget.config?.companyType || detectCompanyType(finalData);
  
  // Debug company type detection
  console.log(`🏷️ FundamentalsWidget company type detection:`, {
    company_name: finalData?.name || 'Unknown',
    detected_type: companyType,
    company_category: finalData?.company_category,
    widget_config_type: widget.config?.companyType,
    fallback_detection: detectCompanyType(finalData)
  });
  
  // Select default metrics based on company type (memoized to prevent re-renders)
  const getDefaultMetrics = useMemo(() => {
    switch (companyType) {
      case 'public':
        // Public companies: Focus on stock metrics and financial performance from public reports
        return ['market_cap', 'pe_ratio', 'revenue_ttm', 'profit_margin', 'debt_ratio', 'dividend_yield'];
      case 'crypto':
        // Crypto companies: True fundamentals (not price metrics)
        return ['listing_exchanges', 'founders_count', 'tokenomics_chart', 'github_repo', 'tge_date', 'twitter_followers'];
      case 'private':
        // Private companies: Focus on startup/growth metrics from Tavily data
        return ['valuation', 'revenue_ttm', 'burn_rate', 'runway', 'total_funding', 'gross_margin'];
      default:
        return ['valuation', 'revenue_ttm', 'gross_margin', 'runway'];
    }
  }, [companyType]);
  
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    widget.config?.metrics || ['valuation', 'revenue_ttm', 'gross_margin', 'burn_rate'] // Default fallback
  );
  const [displayFormat, setDisplayFormat] = useState(
    widget.config?.display_format || 'cards'
  );

  // Update metrics when company type changes (after data loads) - only run once per company type change
  useEffect(() => {
    if (!widget.config?.metrics && finalData && companyType) {
      console.log(`🔄 FundamentalsWidget: Updating metrics for ${companyType} company (${finalData.name}):`, getDefaultMetrics);
      console.log(`📊 Company data:`, { 
        company_category: finalData.company_category, 
        has_crypto_data: !!finalData.crypto_data,
        has_pe_ratio: !!finalData.pe_ratio,
        name: finalData.name 
      });
      setSelectedMetrics(getDefaultMetrics);
    }
  }, [companyType, getDefaultMetrics, widget.config?.metrics]);

  // Available metrics with descriptions - includes both traditional and crypto metrics
  const metricDefinitions = {
    // Public company metrics
    market_cap: {
      label: 'Stock Market Cap',
      icon: Building,
      description: 'Total market value of outstanding shares',
      format: 'currency_billions',
      color: 'text-blue-600',
      category: 'public'
    },
    pe_ratio: {
      label: 'P/E Ratio',
      icon: BarChart3,
      description: 'Price-to-earnings ratio',
      format: 'ratio',
      color: 'text-green-600',
      category: 'public'
    },
    price_to_book: {
      label: 'P/B Ratio',
      icon: BarChart3,
      description: 'Price-to-book value ratio',
      format: 'ratio',
      color: 'text-indigo-600',
      category: 'public'
    },
    debt_ratio: {
      label: 'Debt Ratio',
      icon: TrendingDown,
      description: 'Total debt divided by total assets',
      format: 'percentage',
      color: 'text-red-600',
      category: 'public'
    },
    dividend_yield: {
      label: 'Dividend Yield',
      icon: Percent,
      description: 'Annual dividends per share divided by stock price',
      format: 'percentage',
      color: 'text-green-600',
      category: 'public'
    },
    // Crypto fundamentals (proper fundamental analysis, not price metrics)
    listing_exchanges: {
      label: 'Listed Exchanges',
      icon: Building,
      description: 'Number of exchanges and top 5 by volume',
      format: 'exchanges',
      color: 'text-blue-600',
      category: 'crypto'
    },
    founders_count: {
      label: 'Founders',
      icon: DollarSign,
      description: 'Key founders with LinkedIn profiles',
      format: 'founders',
      color: 'text-green-600',
      category: 'crypto'
    },
    tokenomics_chart: {
      label: 'Tokenomics',
      icon: BarChart3,
      description: 'Token distribution breakdown',
      format: 'tokenomics',
      color: 'text-purple-600',
      category: 'crypto'
    },
    github_repo: {
      label: 'GitHub Repository',
      icon: TrendingUp,
      description: 'Official project repository',
      format: 'github',
      color: 'text-orange-600',
      category: 'crypto'
    },
    tge_date: {
      label: 'TGE Date',
      icon: TrendingUp,
      description: 'Token Generation Event date',
      format: 'date',
      color: 'text-indigo-600',
      category: 'crypto'
    },
    twitter_followers: {
      label: 'Twitter Following',
      icon: BarChart3,
      description: 'Twitter handle and follower count',
      format: 'twitter',
      color: 'text-blue-600',
      category: 'crypto'
    },
    // Private company metrics
    valuation: {
      label: 'Last Valuation',
      icon: Building,
      description: 'Most recent funding round valuation',
      format: 'currency_billions',
      color: 'text-blue-600',
      category: 'private'
    },
    burn_rate: {
      label: 'Burn Rate',
      icon: TrendingDown,
      description: 'Monthly cash burn rate',
      format: 'currency',
      color: 'text-red-600',
      category: 'private'
    },
    runway: {
      label: 'Runway',
      icon: BarChart3,
      description: 'Months of runway remaining',
      format: 'months',
      color: 'text-orange-600',
      category: 'private'
    },
    total_funding: {
      label: 'Total Funding',
      icon: DollarSign,
      description: 'Total funding raised to date',
      format: 'currency_millions',
      color: 'text-purple-600',
      category: 'private'
    },
    // Shared metrics
    revenue_ttm: {
      label: 'Revenue (TTM)',
      icon: DollarSign,
      description: 'Trailing twelve months revenue',
      format: 'currency_billions',
      color: 'text-purple-600',
      category: 'all'
    },
    gross_margin: {
      label: 'Gross Margin',
      icon: TrendingUp,
      description: 'Gross profit as percentage of revenue',
      format: 'percentage',
      color: 'text-orange-600',
      category: 'all'
    },
    profit_margin: {
      label: 'Profit Margin',
      icon: Percent,
      description: 'Net income as percentage of revenue',
      format: 'percentage',
      color: 'text-green-600',
      category: 'all'
    }
  };

  // Format values based on type
  const formatValue = (value: number | null, format: string): string => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';

    switch (format) {
      case 'currency_billions':
        return `$${(value / 1e9).toFixed(1)}B`;
      case 'currency_millions':
        return `$${(value / 1e6).toFixed(1)}M`;
      case 'currency':
        if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
        if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
        return `$${value.toFixed(2)}`;
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'ratio':
        return `${value.toFixed(1)}x`;
      case 'number':
        if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
        if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
        if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
        return value.toLocaleString();
      case 'months':
        return `${value.toFixed(0)} months`;
      case 'rank':
        return `#${value}`;
      case 'exchanges':
        return typeof value === 'object' ? `${value.count || 0} exchanges` : 'N/A';
      case 'founders':
        return typeof value === 'object' ? `${value.length || 0} founders` : 'N/A';
      case 'tokenomics':
        return 'View Chart';
      case 'github':
        return typeof value === 'string' ? 'View Repository' : 'N/A';
      case 'date':
        return value ? new Date(value).toLocaleDateString() : 'N/A';
      case 'twitter':
        return typeof value === 'object' ? `@${value.handle} (${value.followers?.toLocaleString() || 0})` : 'N/A';
      default:
        return value.toLocaleString();
    }
  };

  // Map data sources to metric values based on company type
  const getMetricValue = (metric: string): any => {
    if (!finalData) return null;
    
    // Debug logging for crypto fundamentals
    if (companyType === 'crypto' && ['listing_exchanges', 'founders_count', 'tokenomics_chart', 'github_repo', 'tge_date', 'twitter_followers'].includes(metric)) {
      console.log(`🔍 Debug fundamentals metric ${metric} for ${finalData.name}:`, {
        metric,
        direct_value: finalData[metric],
        crypto_fundamentals_value: finalData.crypto_fundamentals?.[metric],
        final_result: finalData[metric] || finalData.crypto_fundamentals?.[metric] || null
      });
    }

    // Debug crypto data mapping
    if (companyType === 'crypto' && ['token_market_cap', 'token_price', 'total_supply'].includes(metric)) {
      console.log(`🔍 Debug crypto metric ${metric} for ${finalData.name}:`, {
        metric,
        finalData_field: finalData[metric.replace('token_', '')],
        crypto_data_field: finalData.crypto_data?.[metric.replace('token_', '')],
        final_value: metric === 'token_market_cap' ? (finalData.market_cap || finalData.crypto_data?.market_cap) :
                     metric === 'token_price' ? (finalData.current_price || finalData.crypto_data?.current_price) :
                     metric === 'total_supply' ? (finalData.total_supply || finalData.crypto_data?.total_supply) : 'unknown'
      });
    }

    switch (metric) {
      // Public company metrics (from stock data)
      case 'market_cap':
        return finalData.stock_data?.market_cap || finalData.market_cap || finalData.key_metrics?.valuation || null;
      case 'pe_ratio':
        return finalData.stock_data?.pe_ratio || finalData.pe_ratio || null;
      case 'price_to_book':
        return finalData.stock_data?.price_to_book || finalData.price_to_book || null;
      case 'debt_ratio':
        return finalData.stock_data?.debt_ratio || finalData.debt_ratio || null;
      case 'dividend_yield':
        return finalData.stock_data?.dividend_yield || finalData.dividend_yield || null;

      // Crypto fundamentals (proper fundamental data, not price metrics)
      case 'listing_exchanges':
        return finalData.exchanges || finalData.crypto_fundamentals?.exchanges || null;
      case 'founders_count':
        return finalData.founders || finalData.crypto_fundamentals?.founders || null;
      case 'tokenomics_chart':
        return finalData.tokenomics || finalData.crypto_fundamentals?.tokenomics || null;
      case 'github_repo':
        return finalData.github_repo || finalData.crypto_fundamentals?.github_repo || null;
      case 'tge_date':
        return finalData.tge_date || finalData.crypto_fundamentals?.tge_date || null;
      case 'twitter_followers':
        return finalData.twitter || finalData.crypto_fundamentals?.twitter || null;

      // Private company metrics (from company data)
      case 'valuation':
        return finalData.valuation || finalData.key_metrics?.valuation || finalData.investment?.valuation || null;
      case 'burn_rate':
        return finalData.burn_rate || finalData.key_metrics?.burn_rate || null;
      case 'runway':
        return finalData.runway_months || finalData.key_metrics?.runway || null;
      case 'total_funding':
        return finalData.total_funding || finalData.funding_total || null;

      // Shared metrics
      case 'revenue_ttm':
        return finalData.revenue_current || finalData.key_metrics?.revenue || finalData.revenue_ttm || null;
      case 'gross_margin':
        return finalData.gross_margin || finalData.key_metrics?.gross_margin || null;
      case 'profit_margin':
        return finalData.profit_margin || finalData.key_metrics?.profit_margin || null;

      default:
        return finalData?.[metric] || null;
    }
  };

  // Handle metrics selection change
  const toggleMetric = (metric: string) => {
    const newMetrics = selectedMetrics.includes(metric)
      ? selectedMetrics.filter(m => m !== metric)
      : [...selectedMetrics, metric];
    
    setSelectedMetrics(newMetrics);
    onUpdate?.({ ...(widget.config || {}), metrics: newMetrics });
  };

  // Handle display format change
  const handleFormatChange = (format: string) => {
    setDisplayFormat(format);
    onUpdate?.({ ...(widget.config || {}), display_format: format });
  };

  // Render metric card
  const renderMetricCard = (metric: string) => {
    const definition = metricDefinitions[metric as keyof typeof metricDefinitions];
    if (!definition) return null;

    const value = getMetricValue(metric);
    const IconComponent = definition.icon;
    const formattedValue = formatValue(value, definition.format);

    // Special rendering for complex crypto data
    if (metric === 'listing_exchanges' && value?.top_5) {
      return (
        <div key={metric} className="bg-muted rounded-lg p-3 hover:bg-accent transition-colors">
          <div className="flex items-center space-x-2 mb-2">
            <IconComponent className={`w-4 h-4 ${definition.color}`} />
            <span className="text-sm font-medium text-foreground">
              {definition.label}
            </span>
          </div>
          <div className="text-lg font-bold text-foreground mb-1">
            {value.count} exchanges
          </div>
          <div className="text-xs text-muted-foreground">
            {value.top_5.slice(0, 3).map((ex: any) => ex.name).join(', ')}
          </div>
        </div>
      );
    }

    if (metric === 'founders_count' && Array.isArray(value)) {
      return (
        <div key={metric} className="bg-muted rounded-lg p-3 hover:bg-accent transition-colors">
          <div className="flex items-center space-x-2 mb-2">
            <IconComponent className={`w-4 h-4 ${definition.color}`} />
            <span className="text-sm font-medium text-foreground">
              {definition.label}
            </span>
          </div>
          <div className="text-lg font-bold text-foreground mb-1">
            {value.length} founders
          </div>
          <div className="text-xs text-muted-foreground">
            {value.slice(0, 2).map((founder: any) => founder.name).join(', ')}
          </div>
        </div>
      );
    }

    return (
      <div key={metric} className="bg-muted rounded-lg p-3 hover:bg-accent transition-colors">
        <div className="flex items-center space-x-2 mb-2">
          <IconComponent className={`w-4 h-4 ${definition.color}`} />
          <span className="text-sm font-medium text-foreground">
            {definition.label}
          </span>
        </div>
        <div className="text-lg font-bold text-foreground">
          {formattedValue}
        </div>
      </div>
    );
  };

  // Render table row
  const renderTableRow = (metric: string) => {
    const definition = metricDefinitions[metric as keyof typeof metricDefinitions];
    if (!definition) return null;

    const value = getMetricValue(metric);
    const IconComponent = definition.icon;
    const formattedValue = formatValue(value, definition.format);

    return (
      <tr key={metric} className="border-b border-border hover:bg-accent">
        <td className="py-2 px-3">
          <div className="flex items-center space-x-2">
            <IconComponent className={`w-4 h-4 ${definition.color}`} />
            <span className="text-sm font-medium">{definition.label}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{definition.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </td>
        <td className="py-2 px-3 text-right">
          <span className="font-bold text-foreground">{formattedValue}</span>
        </td>
      </tr>
    );
  };

  const renderContent = () => {
    if (actualLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading fundamentals...</p>
          </div>
        </div>
      );
    }

    if (actualError) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-red-600">
            <BarChart3 className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Failed to load fundamentals</p>
            <p className="text-xs text-gray-600 mt-1">{actualError}</p>
          </div>
        </div>
      );
    }

    // finalData is already defined at component level
    if (!finalData) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-gray-500">
            <BarChart3 className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No fundamental data available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div>
              <h4 className="text-sm font-medium text-foreground">
                {widget.config?.companyName || widget.dataSource?.ticker || 'Company'} Fundamentals
              </h4>
              <p className="text-xs text-muted-foreground">
                {companyType === 'public' ? 'Public company metrics' :
                 companyType === 'crypto' ? 'Token & crypto metrics' :
                 'Private company metrics'}
              </p>
            </div>
            <Badge variant="outline" className="text-xs capitalize">
              {companyType}
            </Badge>
          </div>

          {/* Controls */}
          {isEditing && (
            <div className="flex items-center space-x-2">
              <Select value={displayFormat} onValueChange={handleFormatChange}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cards">Cards</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Metric Selection */}
        {isEditing && (
          <div className="flex flex-wrap gap-1 mb-4">
            {Object.keys(metricDefinitions).map(metric => (
              <Badge
                key={metric}
                variant={selectedMetrics.includes(metric) ? 'default' : 'outline'}
                className="text-xs cursor-pointer"
                onClick={() => toggleMetric(metric)}
              >
                {metricDefinitions[metric as keyof typeof metricDefinitions].label}
              </Badge>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {displayFormat === 'cards' ? (
            // Cards Layout
            <div className="grid grid-cols-2 gap-3">
              {selectedMetrics.map(metric => 
                renderMetricCard(metric)
              )}
            </div>
          ) : (
            // Table Layout
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-2 px-3 font-medium text-foreground">Metric</th>
                    <th className="text-right py-2 px-3 font-medium text-foreground">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMetrics.map(metric =>
                    renderTableRow(metric)
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last updated: {new Date().toLocaleDateString()}</span>
            <Badge variant="outline" className="text-xs">
              TTM Data
            </Badge>
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

export default FundamentalsWidget;