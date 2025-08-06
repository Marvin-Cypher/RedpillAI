"use client"

/**
 * Token Price Widget
 * Shows real-time token price and market data for crypto companies
 */

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  // Self-sufficient data fetching state (for WidgetGrid system)
  const [selfData, setSelfData] = useState<TokenPriceData | null>(null);
  const [selfLoading, setSelfLoading] = useState(false);
  const [selfError, setSelfError] = useState<string | null>(null);

  // Self-sufficient data fetching (when no data is provided)
  useEffect(() => {
    if (!data && !loading && companyId) {
      console.log('🪙 TokenPriceWidget: No data provided, fetching self-sufficiently');
      setSelfLoading(true);
      setSelfError(null);
      
      // Import fetchWidgetData dynamically to avoid circular imports
      import('@/lib/widgets/data').then(({ fetchWidgetData }) => {
        return fetchWidgetData(widget, companyId);
      })
        .then((fetchedData) => {
          console.log('✅ TokenPriceWidget: Self-fetched data:', fetchedData);
          setSelfData(fetchedData);
        })
        .catch((fetchError) => {
          console.error('❌ TokenPriceWidget: Self-fetch failed:', fetchError);
          setSelfError(fetchError.message || 'Failed to fetch token price data');
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
      return 'text-muted-foreground';
    }
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPriceChangeIcon = (change: number | null | undefined) => {
    if (change === null || change === undefined || isNaN(change)) {
      return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
    return change >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  // Mock data for demonstration when no real data available
  const mockTokenData: TokenPriceData = {
    symbol: 'DEMO',
    name: 'Demo Token',
    current_price: 1.25,
    price_change_24h: 0.05,
    price_change_percentage_24h: 4.2,
    market_cap: 125000000,
    market_cap_rank: 45,
    volume_24h: 8500000,
    circulating_supply: 100000000,
    total_supply: 150000000,
    high_24h: 1.32,
    low_24h: 1.18,
    last_updated: new Date().toISOString()
  };

  const tokenData: TokenPriceData = actualData || mockTokenData;

  const renderContent = () => {
    if (actualLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading token data...</p>
          </div>
        </div>
      );
    }

    if (actualError) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-destructive">
            <DollarSign className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Failed to load token data</p>
            <p className="text-xs text-muted-foreground mt-1">{actualError}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Token Title */}
        <div className="flex items-center space-x-2 mb-4">
          <h3 className="text-lg font-semibold text-foreground">
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
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(tokenData.current_price, (tokenData.current_price && tokenData.current_price < 1) ? 4 : 2)}
            </div>
            <div className={`flex items-center space-x-1 text-sm font-medium ${getPriceChangeColor(tokenData.price_change_percentage_24h)}`}>
              {getPriceChangeIcon(tokenData.price_change_percentage_24h)}
              <span>{formatCurrency(tokenData.price_change_24h ? Math.abs(tokenData.price_change_24h) : undefined, 2)}</span>
              <span>({formatPercentage(tokenData.price_change_percentage_24h)})</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">24h Range</div>
            <div className="text-sm font-mono">
              <div className="text-muted-foreground">{formatCurrency(tokenData.low_24h)}</div>
              <div className="text-muted-foreground/50">-</div>
              <div className="text-muted-foreground">{formatCurrency(tokenData.high_24h)}</div>
            </div>
          </div>
        </div>

        {/* Market Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-1 mb-1">
              <DollarSign className="w-3 h-3 text-blue-500" />
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Market Cap</span>
            </div>
            <div className="text-sm font-bold text-foreground">
              {formatCurrency(tokenData.market_cap)}
            </div>
          </div>
          
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center space-x-1 mb-1">
              <Volume2 className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">24h Volume</span>
            </div>
            <div className="text-sm font-bold text-foreground">
              {formatCurrency(tokenData.volume_24h)}
            </div>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center space-x-1 mb-1">
              <Users className="w-3 h-3 text-purple-500" />
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Circulating</span>
            </div>
            <div className="text-sm font-bold text-foreground">
              {formatNumber(tokenData.circulating_supply)}
            </div>
            <div className="text-xs text-muted-foreground">
              {(tokenData.symbol || 'N/A').toUpperCase()}
            </div>
          </div>

          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-1 mb-1">
              <Activity className="w-3 h-3 text-orange-500" />
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Total Supply</span>
            </div>
            <div className="text-sm font-bold text-foreground">
              {formatNumber(tokenData.total_supply)}
            </div>
            <div className="text-xs text-muted-foreground">
              {(tokenData.symbol || 'N/A').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-3 pt-2 border-t border-border">
          <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Updated: {tokenData.last_updated ? new Date(tokenData.last_updated).toLocaleTimeString() : 'Unknown'}</span>
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
      <div className="space-y-4">
        {/* Token symbol badge if available */}
        {tokenData.symbol && (
          <Badge variant="outline" className="text-xs">
            {tokenData.symbol.toUpperCase()}
          </Badge>
        )}
        {renderContent()}
      </div>
    </BaseWidget>
  );
};

export default TokenPriceWidget;