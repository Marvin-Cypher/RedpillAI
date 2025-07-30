/**
 * Price Chart Widget
 * Interactive price chart with technical indicators
 */

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
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
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';
import { WidgetProps, PriceData } from '@/lib/widgets/types';
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
  onRemove
}) => {
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
    if (!data?.data || !Array.isArray(data.data)) return [];

    const priceData = data.data.map((item: PriceData) => ({
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
  }, [data, selectedIndicators]);

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
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-sm">{format(parseISO(data.date), 'MMM dd, yyyy')}</p>
          <div className="space-y-1 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Close:</span>
              <span className="text-sm font-medium">${data.close.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Volume:</span>
              <span className="text-sm">{(data.volume / 1000000).toFixed(1)}M</span>
            </div>
            {data.sma20 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">SMA(20):</span>
                <span className="text-sm">${data.sma20.toFixed(2)}</span>
              </div>
            )}
            {data.ema20 && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-600">EMA(20):</span>
                <span className="text-sm">${data.ema20.toFixed(2)}</span>
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
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading price data...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-red-600">
            <TrendingDown className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Failed to load price data</p>
            <p className="text-xs text-gray-600 mt-1">{error}</p>
          </div>
        </div>
      );
    }

    if (!chartData.length) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-gray-500">
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
                <span className="text-lg font-bold">
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
              <div className="text-xs text-gray-600">
                {widget.dataSource.ticker} • {selectedTimeframe}
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
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                domain={['dataMin - 5', 'dataMax + 5']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Price Line */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              
              {/* Technical Indicators */}
              {selectedIndicators.includes('SMA') && (
                <Line
                  type="monotone"
                  dataKey="sma20"
                  stroke="#F59E0B"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
              
              {selectedIndicators.includes('EMA') && (
                <Line
                  type="monotone"
                  dataKey="ema20"
                  stroke="#10B981"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        {selectedIndicators.length > 0 && (
          <div className="flex items-center justify-center space-x-4 mt-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span>Price</span>
            </div>
            {selectedIndicators.includes('SMA') && (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-0.5 bg-amber-500 border-dashed border-t"></div>
                <span>SMA(20)</span>
              </div>
            )}
            {selectedIndicators.includes('EMA') && (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-0.5 bg-green-500 border-dashed border-t"></div>
                <span>EMA(20)</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-lg font-semibold">Price Chart</CardTitle>
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

export default PriceChartWidget;