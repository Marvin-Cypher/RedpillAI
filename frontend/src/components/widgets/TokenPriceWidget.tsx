/**
 * Token Price Widget
 * Shows real-time token price and market data for crypto companies
 */

import React, { useState, useEffect } from 'react';
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
import { BaseWidget } from './BaseWidget';
import { fetchWidgetData } from '@/lib/widgets/data';

interface TokenPriceData {
  symbol?: string;
  name?: string;
  current_price?: number;
  price_change_24h?: number;
  price_change_percentage_24h?: number;
  market_cap?: number;
  market_cap_rank?: number;
  volume_24h?: number;
  circulating_supply?: number;
  total_supply?: number;
  high_24h?: number;
  low_24h?: number;
  last_updated?: string;
}

const TokenPriceWidget: React.FC<WidgetProps> = ({
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
  // Self-sufficient data fetching when no data is provided (WidgetGrid system)
  const [selfFetchedData, setSelfFetchedData] = useState<TokenPriceData | null>(null);
  const [selfLoading, setSelfLoading] = useState(false);
  const [selfError, setSelfError] = useState<string | null>(null);

  const fetchSelfData = async (skipCache: boolean = false) => {
    if (!companyId) return;
    
    setSelfLoading(true);
    setSelfError(null);
    
    try {
      console.log('🪙 TokenPriceWidget self-fetching data for companyId:', companyId);
      const result = await fetchWidgetData(widget, companyId, skipCache);
      setSelfFetchedData(result);
      console.log('🪙 TokenPriceWidget self-fetch result:', result);
    } catch (err) {
      console.error('🪙 TokenPriceWidget self-fetch error:', err);
      setSelfError(err instanceof Error ? err.message : 'Failed to fetch token data');
    } finally {
      setSelfLoading(false);
    }
  };

  // Fetch data on mount if no data is provided from parent
  useEffect(() => {
    if (!data && !loading && companyId) {
      console.log('🪙 No data provided to TokenPriceWidget, self-fetching...');
      fetchSelfData();
    }
  }, [companyId, data, loading]);

  // Use provided data or self-fetched data
  const activeData = data || selfFetchedData;
  const activeLoading = loading || selfLoading;
  const activeError = error || selfError;

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      // Self-refresh when no onRefresh provided
      fetchSelfData(true);
    }
  };
  const formatCurrency = (amount: number | null | undefined, decimals: number = 2) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'N/A';
    }
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

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined || isNaN(num)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getPriceChangeColor = (change: number | null | undefined) => {
    if (change === null || change === undefined || isNaN(change)) {
      return 'text-gray-500';
    }
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPriceChangeIcon = (change: number | null | undefined) => {
    if (change === null || change === undefined || isNaN(change)) {
      return <Activity className="w-4 h-4 text-gray-500" />;
    }
    return change >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  // Use activeData or fallback to empty data (no more BTC hardcoding)
  const tokenData: TokenPriceData = activeData || {};

  if (activeLoading) {
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

  if (activeError) {
    return (
      <Card className="h-full border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Token Price</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-red-600 text-sm">Error: {activeError}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="mt-2"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <BaseWidget
      widget={widget}
      onUpdate={onUpdate}
      onRemove={onRemove}
      isEditing={isEditing}
      companyId={companyId}
      onRefresh={handleRefresh}
    >
      <div className="space-y-4">
        {/* Token Title */}
        <div className="flex items-center space-x-2 mb-4">
          <h3 className="text-lg font-semibold">
            {tokenData.name || 'Unknown Token'} ({(tokenData.symbol || 'N/A').toUpperCase()})
          </h3>
          {tokenData.market_cap_rank && (
            <Badge variant="outline" className="text-xs">
              #{tokenData.market_cap_rank}
            </Badge>
          )}
        </div>

        {/* Main Price Display */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(tokenData.current_price, (tokenData.current_price && tokenData.current_price < 1) ? 4 : 2)}
            </div>
            <div className={`flex items-center space-x-1 text-sm font-medium ${getPriceChangeColor(tokenData.price_change_percentage_24h)}`}>
              {getPriceChangeIcon(tokenData.price_change_percentage_24h)}
              <span>{formatCurrency(tokenData.price_change_24h ? Math.abs(tokenData.price_change_24h) : undefined, 2)}</span>
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
              {(tokenData.symbol || 'N/A').toUpperCase()}
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
              {(tokenData.symbol || 'N/A').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Updated: {tokenData.last_updated ? new Date(tokenData.last_updated).toLocaleTimeString() : 'Unknown'}</span>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
};

export default TokenPriceWidget;