"use client"

/**
 * Price Chart Widget
 * Interactive price chart with technical indicators
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
import { WidgetProps, PriceData } from '@/lib/widgets/types';
import { BaseWidget } from './BaseWidget';
import { format, parseISO } from 'date-fns';

interface PriceChartData {
  data: PriceData[];
  symbol: string;
}

const PriceChartWidget: React.FC<WidgetProps> = ({
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
  const [selfData, setSelfData] = useState<PriceChartData | null>(null);
  const [selfLoading, setSelfLoading] = useState(false);
  const [selfError, setSelfError] = useState<string | null>(null);

  // Self-sufficient data fetching (when no data is provided)
  useEffect(() => {
    if (!data && !loading && companyId) {
      console.log('📈 PriceChartWidget: No data provided, fetching self-sufficiently');
      setSelfLoading(true);
      setSelfError(null);
      
      // Import fetchWidgetData dynamically to avoid circular imports
      import('@/lib/widgets/data').then(({ fetchWidgetData }) => {
        return fetchWidgetData(widget, companyId);
      })
        .then((fetchedData) => {
          console.log('✅ PriceChartWidget: Self-fetched data:', fetchedData);
          setSelfData(fetchedData);
        })
        .catch((fetchError) => {
          console.error('❌ PriceChartWidget: Self-fetch failed:', fetchError);
          setSelfError(fetchError.message || 'Failed to fetch price chart data');
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
  // Mock data for demonstration when no real data available
  const mockData = !actualData ? {
    data: Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const basePrice = 45.50;
      const volatility = 0.1;
      const trend = 0.002;
      const price = basePrice * (1 + trend * i) * (1 + (Math.random() - 0.5) * volatility);
      
      return {
        date: date.toISOString().split('T')[0],
        timestamp: date.toISOString(),
        close: Math.round(price * 100) / 100,
        price: Math.round(price * 100) / 100,
        volume: Math.floor(Math.random() * 1000000) + 500000,
        high: Math.round((price * 1.03) * 100) / 100,
        low: Math.round((price * 0.97) * 100) / 100
      };
    }),
    current_price: 47.25,
    change_24h: 1.75,
    change_percent_24h: 3.85
  } : null;

  const finalData = actualData || mockData;
  const [selectedTimeframe, setSelectedTimeframe] = useState(
    widget.config.timeframe || '3M'
  );
  const [selectedIndicators, setSelectedIndicators] = useState(
    widget.config.indicators || ['SMA']
  );

  // Calculate Simple Moving Average
  const calculateSMA = (data: any[], period: number): number[] => {
    const sma: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(undefined);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  };

  // Calculate Exponential Moving Average
  const calculateEMA = (data: any[], period: number): number[] => {
    const multiplier = 2 / (period + 1);
    const ema: number[] = [];
    
    if (data.length === 0) return ema;
    
    // Start with first value
    ema.push(data[0].close);
    
    for (let i = 1; i < data.length; i++) {
      const value = (data[i].close * multiplier) + (ema[i - 1] * (1 - multiplier));
      ema.push(value);
    }
    
    return ema;
  };

  // Process chart data with technical indicators
  const chartData = useMemo(() => {
    if (!finalData?.data || !Array.isArray(finalData.data)) return [];

    const priceData = finalData.data.map((item: PriceData) => ({
      ...item,
      date: typeof item.date === 'string' ? item.date : item.date.toString(),
      formattedDate: format(parseISO(item.date), 'MMM dd')
    }));

    // Calculate technical indicators
    if (selectedIndicators.includes('SMA')) {
      const sma20 = calculateSMA(priceData, 20);
      priceData.forEach((item, index) => {
        if (sma20[index] !== undefined) {
          item.sma20 = sma20[index];
        }
      });
    }

    if (selectedIndicators.includes('EMA')) {
      const ema20 = calculateEMA(priceData, 20);
      priceData.forEach((item, index) => {
        if (ema20[index] !== undefined) {
          item.ema20 = ema20[index];
        }
      });
    }

    return priceData;
  }, [finalData, selectedIndicators]);

  // Get current price and change
  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1] : null;
  const previousPrice = chartData.length > 1 ? chartData[chartData.length - 2] : null;
  const priceChange = currentPrice && previousPrice 
    ? currentPrice.close - previousPrice.close 
    : 0;
  const priceChangePercent = currentPrice && previousPrice 
    ? ((currentPrice.close - previousPrice.close) / previousPrice.close) * 100 
    : 0;

  // Handle timeframe change
  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    onUpdate?.({ ...widget.config, timeframe });
  };

  // Handle indicators change
  const toggleIndicator = (indicator: string) => {
    const newIndicators = selectedIndicators.includes(indicator)
      ? selectedIndicators.filter(i => i !== indicator)
      : [...selectedIndicators, indicator];
    
    setSelectedIndicators(newIndicators);
    onUpdate?.({ ...widget.config, indicators: newIndicators });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background p-3 border border-border rounded-lg shadow-lg">
          <p className="font-medium text-sm text-foreground">{format(parseISO(data.date), 'MMM dd, yyyy')}</p>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Close:</span>
              <span className="text-sm font-medium text-foreground">${data.close.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Volume:</span>
              <span className="text-sm text-foreground">{(data.volume / 1000000).toFixed(1)}M</span>
            </div>
            {data.sma20 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">SMA(20):</span>
                <span className="text-sm text-foreground">${data.sma20.toFixed(2)}</span>
              </div>
            )}
            {data.ema20 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">EMA(20):</span>
                <span className="text-sm text-foreground">${data.ema20.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading price data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-destructive">
            <TrendingDown className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Failed to load price data</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      );
    }

    if (!chartData.length) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-muted-foreground">
            <DollarSign className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No price data available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col">
        {/* Price Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-foreground">
                  ${currentPrice?.close.toFixed(2) || '---'}
                </span>
                {priceChange !== 0 && (
                  <div className={`flex items-center space-x-1 text-sm ${
                    priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {priceChange >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>
                      {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} 
                      ({priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {widget.dataSource?.ticker || 'TICKER'} • {selectedTimeframe}
              </div>
            </div>
          </div>

          {/* Controls */}
          {isEditing && (
            <div className="flex items-center space-x-2">
              <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
                <SelectTrigger className="w-20 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1M">1M</SelectItem>
                  <SelectItem value="3M">3M</SelectItem>
                  <SelectItem value="6M">6M</SelectItem>
                  <SelectItem value="1Y">1Y</SelectItem>
                  <SelectItem value="2Y">2Y</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Technical Indicators */}
        {isEditing && (
          <div className="flex flex-wrap gap-1 mb-3">
            {['SMA', 'EMA'].map(indicator => (
              <Badge
                key={indicator}
                variant={selectedIndicators.includes(indicator) ? 'default' : 'outline'}
                className="text-xs cursor-pointer"
                onClick={() => toggleIndicator(indicator)}
              >
                {indicator}
              </Badge>
            ))}
          </div>
        )}

        {/* Chart */}
        <div className="flex-1 min-h-0">
          <ChartContainer 
            config={{
              price: {
                label: "Price",
                color: priceChange >= 0 ? "hsl(142, 76%, 36%)" : "hsl(346, 87%, 43%)",
              },
              sma20: {
                label: "SMA(20)",
                color: "hsl(38, 92%, 50%)",
              },
              ema20: {
                label: "EMA(20)",
                color: "hsl(142, 76%, 36%)",
              },
            } as ChartConfig}
            className="h-full w-full"
          >
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="5%" 
                    stopColor={priceChange >= 0 ? '#10b981' : '#ef4444'} 
                    stopOpacity={0.3}
                  />
                  <stop 
                    offset="95%" 
                    stopColor={priceChange >= 0 ? '#10b981' : '#ef4444'} 
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                className="text-muted-foreground"
                domain={['dataMin * 0.98', 'dataMax * 1.02']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value: any, name: string) => {
                      const formattedValue = typeof value === 'number' ? `$${value.toFixed(2)}` : value;
                      return (
                        <div className="flex justify-between gap-2">
                          <span>{name}:</span>
                          <span className="font-medium">{formattedValue}</span>
                        </div>
                      );
                    }}
                  />
                }
              />
              
              {/* Price Area */}
              <Area
                type="monotone"
                dataKey="close"
                stroke={priceChange >= 0 ? '#10b981' : '#ef4444'}
                fill="url(#colorPrice)"
                strokeWidth={2}
              />
              
              {/* Technical Indicators */}
              {selectedIndicators.includes('SMA') && (
                <Line
                  type="monotone"
                  dataKey="sma20"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
              
              {selectedIndicators.includes('EMA') && (
                <Line
                  type="monotone"
                  dataKey="ema20"
                  stroke="#10B981"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Legend */}
        {selectedIndicators.length > 0 && (
          <div className="flex items-center justify-center space-x-4 mt-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-primary"></div>
              <span className="text-muted-foreground">Price</span>
            </div>
            {selectedIndicators.includes('SMA') && (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-0.5 bg-amber-500 border-dashed border-t"></div>
                <span className="text-muted-foreground">SMA(20)</span>
              </div>
            )}
            {selectedIndicators.includes('EMA') && (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-0.5 bg-green-500 border-dashed border-t"></div>
                <span className="text-muted-foreground">EMA(20)</span>
              </div>
            )}
          </div>
        )}
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
        {/* Ticker badge if available */}
        {widget.dataSource?.ticker && (
          <Badge variant="outline" className="text-xs">
            {widget.dataSource.ticker.toUpperCase()}
          </Badge>
        )}
        {renderContent()}
      </div>
    </BaseWidget>
  );
};

export default PriceChartWidget;