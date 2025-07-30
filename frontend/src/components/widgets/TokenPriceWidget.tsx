/**
 * Token Price Widget
 * Shows real-time token price and market data for crypto companies
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  Volume2,
  Users,
  Clock
} from 'lucide-react';
import { WidgetProps } from '@/lib/widgets/types';

interface TokenPriceData {
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  volume_24h: number;
  circulating_supply: number;
  total_supply: number;
  high_24h: number;
  low_24h: number;
  last_updated: string;
}

const TokenPriceWidget: React.FC<WidgetProps> = ({
  widget,
  data,
  loading,
  error,
  isEditing,
  onUpdate,
  onRemove
}) => {
  const formatCurrency = (amount: number, decimals: number = 2) => {
    if (amount >= 1e9) {
      return `$${(amount / 1e9).toFixed(1)}B`;
    } else if (amount >= 1e6) {
      return `$${(amount / 1e6).toFixed(1)}M`;
    } else if (amount >= 1e3) {
      return `$${(amount / 1e3).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPriceChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const tokenData: TokenPriceData = data || {
    symbol: 'BTC',
    name: 'Bitcoin',
    current_price: 43250.00,
    price_change_24h: 1150.50,
    price_change_percentage_24h: 2.73,
    market_cap: 845000000000,
    market_cap_rank: 1,
    volume_24h: 25600000000,
    circulating_supply: 19500000,
    total_supply: 21000000,
    high_24h: 44100.00,
    low_24h: 42000.00,
    last_updated: new Date().toISOString()
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Token Price</CardTitle>
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
          <CardTitle className="text-red-600">Token Price</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-red-600 text-sm">Error loading token data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-lg font-semibold">
            {tokenData.name} ({tokenData.symbol.toUpperCase()})
          </CardTitle>
          {tokenData.market_cap_rank && (
            <Badge variant="outline" className="text-xs">
              #{tokenData.market_cap_rank}
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
              <Activity className="h-3 w-3" />
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
        {/* Main Price Display */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(tokenData.current_price, tokenData.current_price < 1 ? 4 : 2)}
            </div>
            <div className={`flex items-center space-x-1 text-sm font-medium ${getPriceChangeColor(tokenData.price_change_percentage_24h)}`}>
              {getPriceChangeIcon(tokenData.price_change_percentage_24h)}
              <span>{formatCurrency(Math.abs(tokenData.price_change_24h), 2)}</span>
              <span>({formatPercentage(tokenData.price_change_percentage_24h)})</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">24h Range</div>
            <div className="text-sm font-mono">
              <div className="text-gray-600">{formatCurrency(tokenData.low_24h)}</div>
              <div className="text-gray-400">-</div>
              <div className="text-gray-600">{formatCurrency(tokenData.high_24h)}</div>
            </div>
          </div>
        </div>

        {/* Market Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-1 mb-1">
              <DollarSign className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-600 font-medium">Market Cap</span>
            </div>
            <div className="text-sm font-bold text-gray-900">
              {formatCurrency(tokenData.market_cap)}
            </div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-1 mb-1">
              <Volume2 className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">24h Volume</span>
            </div>
            <div className="text-sm font-bold text-gray-900">
              {formatCurrency(tokenData.volume_24h)}
            </div>
          </div>

          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-1 mb-1">
              <Users className="w-3 h-3 text-purple-500" />
              <span className="text-xs text-purple-600 font-medium">Circulating</span>
            </div>
            <div className="text-sm font-bold text-gray-900">
              {formatNumber(tokenData.circulating_supply)}
            </div>
            <div className="text-xs text-gray-500">
              {tokenData.symbol.toUpperCase()}
            </div>
          </div>

          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center space-x-1 mb-1">
              <Activity className="w-3 h-3 text-orange-500" />
              <span className="text-xs text-orange-600 font-medium">Total Supply</span>
            </div>
            <div className="text-sm font-bold text-gray-900">
              {formatNumber(tokenData.total_supply)}
            </div>
            <div className="text-xs text-gray-500">
              {tokenData.symbol.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Updated: {new Date(tokenData.last_updated).toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenPriceWidget;