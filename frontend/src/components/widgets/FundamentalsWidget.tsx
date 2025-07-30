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

const FundamentalsWidget: React.FC<WidgetProps> = ({
  widget,
  data,
  loading,
  error,
  isEditing,
  onUpdate,
  onRemove
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    widget.config.metrics || ['market_cap', 'pe_ratio', 'revenue_ttm', 'gross_margin']
  );
  const [displayFormat, setDisplayFormat] = useState(
    widget.config.display_format || 'cards'
  );

  // Available metrics with descriptions
  const metricDefinitions = {
    market_cap: {
      label: 'Market Cap',
      icon: Building,
      description: 'Total market value of outstanding shares',
      format: 'currency_billions',
      color: 'text-blue-600'
    },
    pe_ratio: {
      label: 'P/E Ratio',
      icon: BarChart3,
      description: 'Price-to-earnings ratio',
      format: 'ratio',
      color: 'text-green-600'
    },
    revenue_ttm: {
      label: 'Revenue (TTM)',
      icon: DollarSign,
      description: 'Trailing twelve months revenue',
      format: 'currency_billions',
      color: 'text-purple-600'
    },
    gross_margin: {
      label: 'Gross Margin',
      icon: TrendingUp,
      description: 'Gross profit as percentage of revenue',
      format: 'percentage',
      color: 'text-orange-600'
    },
    profit_margin: {
      label: 'Profit Margin',
      icon: Percent,
      description: 'Net income as percentage of revenue',
      format: 'percentage',
      color: 'text-green-600'
    },
    debt_ratio: {
      label: 'Debt Ratio',
      icon: TrendingDown,
      description: 'Total debt divided by total assets',
      format: 'percentage',
      color: 'text-red-600'
    },
    price_to_book: {
      label: 'P/B Ratio',
      icon: BarChart3,
      description: 'Price-to-book value ratio',
      format: 'ratio',
      color: 'text-indigo-600'
    },
    dividend_yield: {
      label: 'Dividend Yield',
      icon: Percent,
      description: 'Annual dividend as percentage of stock price',
      format: 'percentage',
      color: 'text-blue-600'
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
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'ratio':
        return `${value.toFixed(1)}x`;
      default:
        return value.toLocaleString();
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
  const renderMetricCard = (metric: string, value: any) => {
    const definition = metricDefinitions[metric as keyof typeof metricDefinitions];
    if (!definition) return null;

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
  const renderTableRow = (metric: string, value: any) => {
    const definition = metricDefinitions[metric as keyof typeof metricDefinitions];
    if (!definition) return null;

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
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {widget.dataSource.ticker} Fundamentals
            </h4>
            <p className="text-xs text-gray-600">Key financial metrics</p>
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
                renderMetricCard(metric, data[metric as keyof typeof data])
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
                    renderTableRow(metric, data[metric as keyof typeof data])
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