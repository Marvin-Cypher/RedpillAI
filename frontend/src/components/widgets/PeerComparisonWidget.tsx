/**
 * Peer Comparison Widget
 * Compare company metrics with competitor companies
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  GitCompare,
  TrendingUp,
  TrendingDown,
  Crown,
  Info,
  Plus,
  X,
  RefreshCw
} from 'lucide-react';
import { WidgetProps } from '@/lib/widgets/types';

const PeerComparisonWidget: React.FC<WidgetProps> = ({
  widget,
  data,
  loading,
  error,
  companyId,
  isEditing,
  onUpdate,
  onRemove
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    widget.config.metrics || ['market_cap', 'pe_ratio', 'revenue_ttm']
  );
  const [maxPeers, setMaxPeers] = useState(widget.config.max_peers || 4);
  const [highlightCompany, setHighlightCompany] = useState(
    widget.config.highlight_company ?? true
  );
  const [newPeerTicker, setNewPeerTicker] = useState('');

  // Available metrics for comparison
  const metricDefinitions = {
    market_cap: {
      label: 'Market Cap',
      description: 'Total market value of outstanding shares',
      format: 'currency_billions',
      unit: 'B'
    },
    pe_ratio: {
      label: 'P/E Ratio',
      description: 'Price-to-earnings ratio',
      format: 'ratio',
      unit: 'x'
    },
    revenue_ttm: {
      label: 'Revenue (TTM)',
      description: 'Trailing twelve months revenue',
      format: 'currency_billions',
      unit: 'B'
    },
    gross_margin: {
      label: 'Gross Margin',
      description: 'Gross profit as percentage of revenue',
      format: 'percentage',
      unit: '%'
    },
    profit_margin: {
      label: 'Profit Margin',
      description: 'Net income as percentage of revenue',
      format: 'percentage',
      unit: '%'
    },
    price_to_book: {
      label: 'P/B Ratio',
      description: 'Price-to-book value ratio',
      format: 'ratio',
      unit: 'x'
    },
    dividend_yield: {
      label: 'Dividend Yield',
      description: 'Annual dividend as percentage of stock price',
      format: 'percentage',
      unit: '%'
    }
  };

  // Format values based on type
  const formatValue = (value: number | null, format: string): string => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';

    switch (format) {
      case 'currency_billions':
        return `$${(value / 1e9).toFixed(1)}B`;
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'ratio':
        return `${value.toFixed(1)}x`;
      default:
        return value.toLocaleString();
    }
  };

  // Get comparison data sorted by metrics
  const sortedComparisons = useMemo(() => {
    if (!data?.comparisons) return [];

    const companies = Object.entries(data.comparisons).map(([ticker, metrics]) => ({
      ticker,
      ...metrics,
      isMainCompany: ticker === widget.dataSource.ticker
    }));

    // Sort by first selected metric (descending)
    const primaryMetric = selectedMetrics[0];
    if (primaryMetric && metricDefinitions[primaryMetric as keyof typeof metricDefinitions]) {
      companies.sort((a, b) => {
        const aVal = a[primaryMetric as keyof typeof a] as number || 0;
        const bVal = b[primaryMetric as keyof typeof b] as number || 0;
        return bVal - aVal;
      });
    }

    return companies;
  }, [data, selectedMetrics, widget.dataSource.ticker]);

  // Get rank for main company
  const getCompanyRank = (metric: string) => {
    const mainCompany = widget.dataSource.ticker;
    const index = sortedComparisons.findIndex(comp => comp.ticker === mainCompany);
    return index >= 0 ? index + 1 : '-';
  };

  // Handle metric selection
  const toggleMetric = (metric: string) => {
    const newMetrics = selectedMetrics.includes(metric)
      ? selectedMetrics.filter(m => m !== metric)
      : [...selectedMetrics, metric];
    
    setSelectedMetrics(newMetrics);
    onUpdate?.({ ...widget.config, metrics: newMetrics });
  };

  // Handle peer management
  const addPeerTicker = () => {
    if (!newPeerTicker.trim()) return;
    
    const currentPeers = widget.dataSource.peer_tickers || [];
    const updatedPeers = [...currentPeers, newPeerTicker.toUpperCase()].slice(0, maxPeers - 1);
    
    onUpdate?.({
      ...widget.config,
      dataSource: {
        ...widget.dataSource,
        peer_tickers: updatedPeers
      }
    });
    
    setNewPeerTicker('');
  };

  const removePeerTicker = (ticker: string) => {
    const currentPeers = widget.dataSource.peer_tickers || [];
    const updatedPeers = currentPeers.filter(t => t !== ticker);
    
    onUpdate?.({
      ...widget.config,
      dataSource: {
        ...widget.dataSource,
        peer_tickers: updatedPeers
      }
    });
  };

  // Render comparison table
  const renderComparisonTable = () => {
    if (!sortedComparisons.length) return null;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 font-medium text-foreground">Company</th>
              {selectedMetrics.map(metric => {
                const definition = metricDefinitions[metric as keyof typeof metricDefinitions];
                return (
                  <th key={metric} className="text-right py-2 px-2 font-medium text-foreground">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-end space-x-1 cursor-help">
                            <span>{definition?.label}</span>
                            <Info className="w-3 h-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-sm">{definition?.description}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedComparisons.slice(0, maxPeers).map((company, index) => (
              <tr
                key={company.ticker}
                className={`border-b border-border hover:bg-accent ${
                  highlightCompany && company.isMainCompany ? 'bg-blue-50' : ''
                }`}
              >
                <td className="py-2 px-2">
                  <div className="flex items-center space-x-2">
                    {index === 0 && (
                      <Crown className="w-3 h-3 text-yellow-500" />
                    )}
                    <span className={`font-medium ${
                      highlightCompany && company.isMainCompany ? 'text-blue-700' : 'text-foreground'
                    }`}>
                      {company.ticker}
                    </span>
                    {company.isMainCompany && (
                      <Badge variant="outline" className="text-xs">
                        Main
                      </Badge>
                    )}
                  </div>
                </td>
                {selectedMetrics.map(metric => {
                  const definition = metricDefinitions[metric as keyof typeof metricDefinitions];
                  const value = company[metric as keyof typeof company] as number;
                  const formattedValue = formatValue(value, definition?.format || 'number');
                  
                  return (
                    <td key={metric} className="py-2 px-2 text-right">
                      <span className={`font-medium ${
                        highlightCompany && company.isMainCompany ? 'text-blue-700' : 'text-foreground'
                      }`}>
                        {formattedValue}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading comparison data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-red-600">
            <GitCompare className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Failed to load comparison</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      );
    }

    if (!data?.comparisons || Object.keys(data.comparisons).length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-gray-500">
            <GitCompare className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No comparison data available</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add peer companies to enable comparison
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <GitCompare className="w-4 h-4 text-blue-600" />
            <div>
              <h4 className="text-sm font-medium text-foreground">Peer Comparison</h4>
              <p className="text-xs text-muted-foreground">
                {widget.dataSource.ticker} vs {Object.keys(data.comparisons).length - 1} peers
              </p>
            </div>
          </div>

          {/* Controls */}
          {isEditing && (
            <div className="flex items-center space-x-2">
              <Select value={maxPeers.toString()} onValueChange={(value) => setMaxPeers(parseInt(value))}>
                <SelectTrigger className="w-16 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Metric Selection */}
        {isEditing && (
          <div className="space-y-3 mb-4">
            <div className="flex flex-wrap gap-1">
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

            {/* Add Peer Ticker */}
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Add peer ticker..."
                value={newPeerTicker}
                onChange={(e) => setNewPeerTicker(e.target.value.toUpperCase())}
                className="flex-1 h-8 text-xs"
                onKeyPress={(e) => e.key === 'Enter' && addPeerTicker()}
              />
              <Button
                size="sm"
                onClick={addPeerTicker}
                disabled={!newPeerTicker.trim()}
                className="h-8 px-2"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            {/* Current Peers */}
            {widget.dataSource.peer_tickers && widget.dataSource.peer_tickers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {widget.dataSource.peer_tickers.map(ticker => (
                  <Badge
                    key={ticker}
                    variant="secondary"
                    className="text-xs flex items-center space-x-1"
                  >
                    <span>{ticker}</span>
                    <X
                      className="w-3 h-3 cursor-pointer hover:text-red-600"
                      onClick={() => removePeerTicker(ticker)}
                    />
                  </Badge>
                ))}
              </div>
            )}

            {/* Options */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="highlight-company"
                checked={highlightCompany}
                onCheckedChange={(checked: boolean) => {
                  setHighlightCompany(checked);
                  onUpdate?.({ ...widget.config, highlight_company: checked });
                }}
              />
              <label htmlFor="highlight-company" className="text-xs text-muted-foreground cursor-pointer">
                Highlight main company
              </label>
            </div>
          </div>
        )}

        {/* Ranking Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {selectedMetrics.slice(0, 3).map(metric => {
            const definition = metricDefinitions[metric as keyof typeof metricDefinitions];
            const rank = getCompanyRank(metric);
            return (
              <div key={metric} className="bg-muted rounded-lg p-2 text-center">
                <div className="text-xs text-muted-foreground">{definition?.label}</div>
                <div className="font-bold text-sm">
                  #{rank} of {sortedComparisons.length}
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-auto">
          {renderComparisonTable()}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Comparing {Object.keys(data.comparisons).length} companies</span>
            <Badge variant="outline" className="text-xs">
              Live Data
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
          <CardTitle className="text-lg font-semibold">Peer Comparison</CardTitle>
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
              className="h-6 w-6 p-0 hover:bg-accent"
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


export default PeerComparisonWidget;