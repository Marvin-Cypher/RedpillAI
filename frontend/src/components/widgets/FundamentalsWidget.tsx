/**
 * Fundamentals Widget
 * Display key financial metrics and ratios
 */

import React, { useState } from 'react';
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

// Helper function to detect company type from data
function detectCompanyType(data: any): 'public' | 'crypto' | 'private' {
  if (!data) return 'private';
  
  // Check if it has crypto data (token info)
  if (data.crypto_data || data.symbol || data.current_price || data.market_cap_rank) {
    return 'crypto';
  }
  
  // Check industry/sector for crypto indicators
  const industry = (data.industry || '').toLowerCase();
  const name = (data.name || '').toLowerCase();
  if (industry.includes('blockchain') || industry.includes('crypto') || 
      name.includes('protocol') || name.includes('network') || name.includes('chain')) {
    return 'crypto';
  }
  
  // Check for well-known public companies
  const publicCompanies = ['amazon', 'nvidia', 'apple', 'microsoft', 'google', 'meta', 'tesla'];
  if (publicCompanies.some(company => name.includes(company))) {
    return 'public';
  }
  
  // Check if it has public company indicators (large market cap, public company metrics)
  if (data.pe_ratio || data.dividend_yield || 
      (data.key_metrics?.valuation && data.key_metrics.valuation > 100000000000) ||
      data.total_funding === 0) { // Public companies typically don't have "funding"
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
  onRemove
}) => {
  // Determine company type from widget config or data
  const companyType = widget.config.companyType || detectCompanyType(data);
  
  // Select default metrics based on company type
  const getDefaultMetrics = () => {
    switch (companyType) {
      case 'public':
        return ['market_cap', 'pe_ratio', 'revenue_ttm', 'gross_margin'];
      case 'crypto':
        return ['token_market_cap', 'token_price', 'circulating_supply', 'volume_24h'];
      case 'private':
        return ['valuation', 'revenue_ttm', 'gross_margin', 'burn_rate'];
      default:
        return ['valuation', 'revenue_ttm', 'gross_margin', 'runway'];
    }
  };
  
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    widget.config.metrics || getDefaultMetrics()
  );
  const [displayFormat, setDisplayFormat] = useState(
    widget.config.display_format || 'cards'
  );

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
    // Crypto metrics
    token_market_cap: {
      label: 'Token Market Cap',
      icon: Building,
      description: 'Total market value of circulating tokens',
      format: 'currency_billions',
      color: 'text-blue-600',
      category: 'crypto'
    },
    token_price: {
      label: 'Token Price',
      icon: DollarSign,
      description: 'Current token price in USD',
      format: 'currency',
      color: 'text-green-600',
      category: 'crypto'
    },
    circulating_supply: {
      label: 'Circulating Supply',
      icon: BarChart3,
      description: 'Number of tokens in circulation',
      format: 'number',
      color: 'text-purple-600',
      category: 'crypto'
    },
    volume_24h: {
      label: '24h Volume',
      icon: TrendingUp,
      description: 'Trading volume in last 24 hours',
      format: 'currency_millions',
      color: 'text-orange-600',
      category: 'crypto'
    },
    market_cap_rank: {
      label: 'Market Cap Rank',
      icon: TrendingUp,
      description: 'Ranking by market capitalization',
      format: 'rank',
      color: 'text-indigo-600',
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
      default:
        return value.toLocaleString();
    }
  };

  // Map data sources to metric values based on company type
  const getMetricValue = (metric: string): any => {
    if (!data) return null;

    switch (metric) {
      // Public company metrics (from stock data)
      case 'market_cap':
        return data.stock_data?.market_cap || data.market_cap || data.key_metrics?.valuation || null;
      case 'pe_ratio':
        return data.stock_data?.pe_ratio || data.pe_ratio || null;
      case 'price_to_book':
        return data.stock_data?.price_to_book || data.price_to_book || null;
      case 'debt_ratio':
        return data.stock_data?.debt_ratio || data.debt_ratio || null;
      case 'dividend_yield':
        return data.stock_data?.dividend_yield || data.dividend_yield || null;

      // Crypto metrics (from token data)
      case 'token_market_cap':
        return data.market_cap || data.crypto_data?.market_cap || null;
      case 'token_price':
        return data.current_price || data.crypto_data?.current_price || null;
      case 'circulating_supply':
        return data.circulating_supply || data.crypto_data?.circulating_supply || null;
      case 'volume_24h':
        return data.volume_24h || data.crypto_data?.volume_24h || null;
      case 'market_cap_rank':
        return data.market_cap_rank || data.crypto_data?.market_cap_rank || null;

      // Private company metrics (from company data)
      case 'valuation':
        return data.valuation || data.key_metrics?.valuation || data.investment?.valuation || null;
      case 'burn_rate':
        return data.burn_rate || data.key_metrics?.burn_rate || null;
      case 'runway':
        return data.runway_months || data.key_metrics?.runway || null;
      case 'total_funding':
        return data.total_funding || data.funding_total || null;

      // Shared metrics
      case 'revenue_ttm':
        return data.revenue_current || data.key_metrics?.revenue || data.revenue_ttm || null;
      case 'gross_margin':
        return data.gross_margin || data.key_metrics?.gross_margin || null;
      case 'profit_margin':
        return data.profit_margin || data.key_metrics?.profit_margin || null;

      default:
        return data[metric] || null;
    }
  };

  // Handle metrics selection change
  const toggleMetric = (metric: string) => {
    const newMetrics = selectedMetrics.includes(metric)
      ? selectedMetrics.filter(m => m !== metric)
      : [...selectedMetrics, metric];
    
    setSelectedMetrics(newMetrics);
    onUpdate?.({ ...widget.config, metrics: newMetrics });
  };

  // Handle display format change
  const handleFormatChange = (format: string) => {
    setDisplayFormat(format);
    onUpdate?.({ ...widget.config, display_format: format });
  };

  // Render metric card
  const renderMetricCard = (metric: string) => {
    const definition = metricDefinitions[metric as keyof typeof metricDefinitions];
    if (!definition) return null;

    const value = getMetricValue(metric);
    const IconComponent = definition.icon;
    const formattedValue = formatValue(value, definition.format);

    return (
      <TooltipProvider key={metric}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-help">
              <div className="flex items-center space-x-2 mb-2">
                <IconComponent className={`w-4 h-4 ${definition.color}`} />
                <span className="text-sm font-medium text-gray-700">
                  {definition.label}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formattedValue}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{definition.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
      <tr key={metric} className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-2 px-3">
          <div className="flex items-center space-x-2">
            <IconComponent className={`w-4 h-4 ${definition.color}`} />
            <span className="text-sm font-medium">{definition.label}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{definition.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </td>
        <td className="py-2 px-3 text-right">
          <span className="font-bold text-gray-900">{formattedValue}</span>
        </td>
      </tr>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading fundamentals...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-red-600">
            <BarChart3 className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Failed to load fundamentals</p>
            <p className="text-xs text-gray-600 mt-1">{error}</p>
          </div>
        </div>
      );
    }

    if (!data) {
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
              <h4 className="text-sm font-medium text-gray-900">
                {widget.config.companyName || widget.dataSource.ticker} Fundamentals
              </h4>
              <p className="text-xs text-gray-600">
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
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-700">Metric</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-700">Value</th>
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
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
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
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-lg font-semibold">Fundamentals</CardTitle>
          {widget.dataSource.ticker && (
            <Badge variant="outline" className="text-xs">
              {widget.dataSource.ticker.toUpperCase()}
            </Badge>
          )}
        </div>
        {isEditing && (
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdate?.({ ...widget.config })}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <RefreshCw className="h-3 w-3" />
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
      </CardHeader>
      <CardContent className="pt-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default FundamentalsWidget;