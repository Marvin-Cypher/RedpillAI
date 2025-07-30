/**
 * Widget Data Fetching
 * Centralized data fetching utilities for widgets
 */

import { Widget, PriceData, FundamentalData, NewsItem, ComparisonData } from './types';

const API_BASE = '/api/market';

// Generic API client with error handling
class ApiClient {
  private async request<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`API endpoint ${endpoint} returned ${response.status}: ${response.statusText}`);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.warn(`Failed to fetch from ${endpoint}:`, error);
      throw error;
    }
  }

  // Price data endpoints
  async getCryptoPrice(symbol: string): Promise<any> {
    return this.request(`/crypto/${symbol}/price`);
  }

  async getCryptoHistorical(symbol: string, days: number = 30): Promise<{ data: PriceData[] }> {
    return this.request(`/crypto/${symbol}/historical?days=${days}`);
  }

  async getEquityPrice(ticker: string): Promise<any> {
    return this.request(`/equity/${ticker}/price`);
  }

  async getEquityHistorical(ticker: string, days: number = 252): Promise<{ data: PriceData[] }> {
    return this.request(`/equity/${ticker}/historical?days=${days}`);
  }

  // Fundamental data
  async getEquityFundamentals(ticker: string): Promise<FundamentalData> {
    return this.request(`/equity/${ticker}/fundamentals`);
  }

  async compareEquities(tickers: string[]): Promise<ComparisonData> {
    const tickerString = tickers.join(',');
    return this.request(`/equity/compare?tickers=${tickerString}`);
  }

  // News data
  async getCryptoNews(symbol?: string, limit: number = 10): Promise<{ news: NewsItem[] }> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (symbol) params.append('symbol', symbol);
    return this.request(`/news?${params}`);
  }

  async getEquityNews(ticker: string, limit: number = 10): Promise<{ news: NewsItem[] }> {
    return this.request(`/equity/${ticker}/news?limit=${limit}`);
  }

  // Market overview
  async getMarketOverview(): Promise<any> {
    return this.request('/overview');
  }
}

const apiClient = new ApiClient();

// Mock data generators for development
const generateMockPriceData = (ticker: string, days: number): { data: PriceData[] } => {
  const data: PriceData[] = [];
  const now = new Date();
  let basePrice = ticker === 'BTC' ? 43000 : ticker === 'ETH' ? 2600 : Math.random() * 1000 + 100;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const volatility = 0.05; // 5% daily volatility
    const change = (Math.random() - 0.5) * volatility * basePrice;
    basePrice = Math.max(basePrice + change, basePrice * 0.8); // Prevent negative prices
    
    const open = basePrice;
    const close = basePrice + (Math.random() - 0.5) * volatility * basePrice * 0.5;
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    
    data.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      change_percent: ((close - open) / open) * 100
    });
    
    basePrice = close;
  }
  
  return { data };
};

// Widget-specific data fetchers
export const widgetDataFetchers = {
  price_chart: async (widget: Widget, companyId: string) => {
    const { ticker, asset_type } = widget.dataSource;
    if (!ticker) throw new Error('No ticker specified for price chart');

    const days = getDaysFromTimeframe(widget.config.timeframe || '3M');
    
    try {
      if (asset_type === 'crypto') {
        return await apiClient.getCryptoHistorical(ticker, days);
      } else {
        return await apiClient.getEquityHistorical(ticker, days);
      }
    } catch (error) {
      console.warn(`Using mock data for price chart (${ticker}):`, error);
      return generateMockPriceData(ticker, days);
    }
  },

  fundamentals: async (widget: Widget, companyId: string) => {
    const { ticker, asset_type } = widget.dataSource;
    if (!ticker) throw new Error('No ticker specified for fundamentals');
    
    try {
      if (asset_type === 'equity') {
        return await apiClient.getEquityFundamentals(ticker);
      } else {
        throw new Error('Fundamental data only available for equities');
      }
    } catch (error) {
      console.warn(`Using mock data for fundamentals (${ticker}):`, error);
      return {
        symbol: ticker,
        market_cap: Math.floor(Math.random() * 500000000000) + 10000000000,
        pe_ratio: Math.random() * 50 + 10,
        revenue_ttm: Math.floor(Math.random() * 100000000000) + 1000000000,
        gross_margin: Math.random() * 0.4 + 0.3,
        profit_margin: Math.random() * 0.2 + 0.05,
        debt_ratio: Math.random() * 0.5 + 0.1,
        price_to_book: Math.random() * 5 + 1,
        dividend_yield: Math.random() * 0.05
      };
    }
  },

  news_feed: async (widget: Widget, companyId: string) => {
    const { ticker, asset_type } = widget.dataSource;
    const limit = widget.config.max_items || 5;

    try {
      if (asset_type === 'crypto') {
        return await apiClient.getCryptoNews(ticker, limit);
      } else if (asset_type === 'equity') {
        if (!ticker) throw new Error('No ticker specified for news');
        return await apiClient.getEquityNews(ticker, limit);
      } else {
        throw new Error('News not available for this asset type');
      }
    } catch (error) {
      console.warn(`Using mock data for news (${ticker}):`, error);
      const mockNews = Array.from({ length: limit }, (_, i) => ({
        title: `${ticker || 'Market'} News Update ${i + 1}`,
        summary: `Latest developments and market analysis for ${ticker || 'the market'}. This is a mock news item for development purposes.`,
        source: ['Bloomberg', 'Reuters', 'CoinDesk', 'Yahoo Finance'][Math.floor(Math.random() * 4)],
        published_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        url: `https://example.com/news/${i + 1}`,
        ticker: ticker
      }));
      
      return { news: mockNews };
    }
  },

  peer_comparison: async (widget: Widget, companyId: string) => {
    const { ticker, peer_tickers } = widget.dataSource;
    if (!ticker) throw new Error('No ticker specified for comparison');
    
    const allTickers = [ticker, ...(peer_tickers || [])];
    if (allTickers.length < 2) {
      throw new Error('At least one peer ticker required for comparison');
    }

    try {
      return await apiClient.compareEquities(allTickers.slice(0, widget.config.max_peers || 4));
    } catch (error) {
      console.warn(`Using mock data for peer comparison (${ticker}):`, error);
      const comparisons: Record<string, Partial<FundamentalData>> = {};
      
      allTickers.slice(0, widget.config.max_peers || 4).forEach(t => {
        comparisons[t] = {
          symbol: t,
          market_cap: Math.floor(Math.random() * 500000000000) + 10000000000,
          pe_ratio: Math.random() * 50 + 10,
          revenue_ttm: Math.floor(Math.random() * 100000000000) + 1000000000,
          gross_margin: Math.random() * 0.4 + 0.3,
          profit_margin: Math.random() * 0.2 + 0.05
        };
      });
      
      return {
        comparisons,
        ticker_count: allTickers.length,
        analysis_note: "Mock comparison data for development"
      };
    }
  },

  technical_analysis: async (widget: Widget, companyId: string) => {
    const { ticker, asset_type } = widget.dataSource;
    if (!ticker) throw new Error('No ticker specified for technical analysis');

    const days = getDaysFromTimeframe(widget.config.period || '1Y');
    
    try {
      // Get historical data and calculate indicators
      let historicalData;
      if (asset_type === 'crypto') {
        historicalData = await apiClient.getCryptoHistorical(ticker, days);
      } else {
        historicalData = await apiClient.getEquityHistorical(ticker, days);
      }

      // Calculate technical indicators based on config
      const indicators = calculateTechnicalIndicators(
        historicalData.data,
        widget.config.indicators || ['RSI', 'MACD']
      );

      return {
        historical: historicalData.data,
        indicators,
        symbol: ticker
      };
    } catch (error) {
      console.warn(`Using mock data for technical analysis (${ticker}):`, error);
      const mockHistorical = generateMockPriceData(ticker, days);
      const indicators = calculateTechnicalIndicators(
        mockHistorical.data,
        widget.config.indicators || ['RSI', 'MACD']
      );

      return {
        historical: mockHistorical.data,
        indicators,
        symbol: ticker
      };
    }
  },

  portfolio_allocation: async (widget: Widget, companyId: string) => {
    // This would fetch portfolio data from your backend
    // For now, return mock data structure
    return {
      allocations: [
        { name: 'Equity Holdings', value: 65, color: '#3B82F6' },
        { name: 'Crypto Holdings', value: 25, color: '#10B981' },
        { name: 'Cash', value: 10, color: '#6B7280' }
      ],
      total_value: 1500000,
      currency: 'USD'
    };
  },

  investment_summary: async (widget: Widget, companyId: string) => {
    // This would fetch investment data from your backend
    // For now, return mock data structure
    return {
      investment_amount: 2500000,
      valuation: 50000000,
      ownership_percentage: 12.5,
      lead_partner: 'John Partner',
      round_type: 'Series A',
      investment_date: '2024-03-15'
    };
  },

  key_metrics: async (widget: Widget, companyId: string) => {
    // This would fetch metrics data from your backend
    // For now, return mock data structure
    return {
      revenue_current: 450000,
      revenue_growth: 15.2,
      burn_rate: 180000,
      runway_months: 18,
      employees: 45,
      customers: 1250,
      arr: 5400000,
      gross_margin: 72.5
    };
  },

  token_price: async (widget: Widget, companyId: string) => {
    const { ticker, asset_type } = widget.dataSource;
    
    // Improved validation with fallback logic
    if (asset_type !== 'crypto') {
      console.warn(`Token price widget expects crypto asset_type, got: ${asset_type}. Using fallback.`);
      // Fall through to use fallback data
    }
    
    if (!ticker) {
      console.warn('Token price widget missing ticker. Using BTC as fallback.');
      // Fall through with BTC as fallback ticker
    }
    
    const fallbackTicker = ticker || 'BTC';

    try {
      // Try to fetch real crypto data
      const priceData = await apiClient.getCryptoPrice(fallbackTicker);
      return priceData;
    } catch (error) {
      // Fallback to mock data if API fails
      console.warn(`Failed to fetch token price for ${fallbackTicker}, using mock data:`, error);
      
      // Generate realistic mock data based on ticker
      const mockPrices: Record<string, any> = {
        'BTC': {
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 43250.00 + (Math.random() - 0.5) * 2000,
          price_change_24h: 1150.50 + (Math.random() - 0.5) * 500,
          price_change_percentage_24h: 2.73 + (Math.random() - 0.5) * 5,
          market_cap: 845000000000,
          market_cap_rank: 1,
          volume_24h: 25600000000,
          circulating_supply: 19500000,
          total_supply: 21000000,
          high_24h: 44100.00,
          low_24h: 42000.00,
        },
        'ETH': {
          symbol: 'eth',
          name: 'Ethereum',
          current_price: 2650.00 + (Math.random() - 0.5) * 300,
          price_change_24h: 85.30 + (Math.random() - 0.5) * 50,
          price_change_percentage_24h: 3.32 + (Math.random() - 0.5) * 4,
          market_cap: 318000000000,
          market_cap_rank: 2,
          volume_24h: 15200000000,
          circulating_supply: 120000000,
          total_supply: 120000000,
          high_24h: 2720.00,
          low_24h: 2580.00,
        },
        'LINK': {
          symbol: 'link',
          name: 'Chainlink',
          current_price: 14.50 + (Math.random() - 0.5) * 2,
          price_change_24h: 0.45 + (Math.random() - 0.5) * 1,
          price_change_percentage_24h: 3.21 + (Math.random() - 0.5) * 6,
          market_cap: 8500000000,
          market_cap_rank: 15,
          volume_24h: 450000000,
          circulating_supply: 556849970,
          total_supply: 1000000000,
          high_24h: 15.10,
          low_24h: 14.20,
        }
      };

      const symbol = fallbackTicker.toUpperCase();
      const mockData = mockPrices[symbol] || {
        symbol: fallbackTicker.toLowerCase(),
        name: `${fallbackTicker.toUpperCase()} Token`,
        current_price: 1.25 + Math.random() * 10,
        price_change_24h: (Math.random() - 0.5) * 0.5,
        price_change_percentage_24h: (Math.random() - 0.5) * 10,
        market_cap: 50000000 + Math.random() * 200000000,
        market_cap_rank: Math.floor(Math.random() * 100) + 50,
        volume_24h: 1000000 + Math.random() * 10000000,
        circulating_supply: 100000000 + Math.random() * 900000000,
        total_supply: 1000000000,
        high_24h: 1.35 + Math.random() * 10,
        low_24h: 1.15 + Math.random() * 10,
      };

      return {
        ...mockData,
        last_updated: new Date().toISOString()
      };
    }
  }
};

// Utility functions
function getDaysFromTimeframe(timeframe: string): number {
  const timeframes: Record<string, number> = {
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 252,
    '2Y': 504
  };
  return timeframes[timeframe] || 90;
}

function calculateTechnicalIndicators(data: PriceData[], indicators: string[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  indicators.forEach(indicator => {
    switch (indicator) {
      case 'RSI':
        result.rsi = calculateRSI(data);
        break;
      case 'MACD':
        result.macd = calculateMACD(data);
        break;
      case 'SMA':
        result.sma = calculateSMA(data, 20);
        break;
      case 'EMA':
        result.ema = calculateEMA(data, 20);
        break;
    }
  });
  
  return result;
}

// Technical indicator calculations (simplified)
function calculateRSI(data: PriceData[], period: number = 14): number[] {
  // Simplified RSI calculation
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  const rsi: number[] = [];
  for (let i = period; i < gains.length; i++) {
    const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
}

function calculateMACD(data: PriceData[]): { macd: number[], signal: number[], histogram: number[] } {
  // Simplified MACD calculation
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  
  const macd = ema12.map((val, i) => val - ema26[i]);
  const signal = calculateEMAFromArray(macd, 9);
  const histogram = macd.map((val, i) => val - signal[i]);
  
  return { macd, signal, histogram };
}

function calculateSMA(data: PriceData[], period: number): number[] {
  const sma: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
    sma.push(sum / period);
  }
  return sma;
}

function calculateEMA(data: PriceData[], period: number): number[] {
  const multiplier = 2 / (period + 1);
  const ema: number[] = [];
  
  // Start with SMA for first value
  const sma = data.slice(0, period).reduce((sum, val) => sum + val.close, 0) / period;
  ema.push(sma);
  
  for (let i = period; i < data.length; i++) {
    const value = (data[i].close * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
    ema.push(value);
  }
  
  return ema;
}

function calculateEMAFromArray(data: number[], period: number): number[] {
  const multiplier = 2 / (period + 1);
  const ema: number[] = [];
  
  // Start with simple average for first value
  const firstValue = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  ema.push(firstValue);
  
  for (let i = period; i < data.length; i++) {
    const value = (data[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
    ema.push(value);
  }
  
  return ema;
}

// Cache management
class DataCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttlSeconds: number = 300) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear() {
    this.cache.clear();
  }
}

export const dataCache = new DataCache();

// Enhanced data fetcher with caching
export async function fetchWidgetData(widget: Widget, companyId: string): Promise<any> {
  const cacheKey = `${widget.type}_${widget.dataSource.ticker}_${JSON.stringify(widget.config)}`;
  
  // Check cache first
  const cachedData = dataCache.get(cacheKey);
  if (cachedData) return cachedData;

  // Fetch fresh data
  const fetcher = widgetDataFetchers[widget.type];
  if (!fetcher) {
    throw new Error(`No data fetcher found for widget type: ${widget.type}`);
  }

  const data = await fetcher(widget, companyId);
  
  // Cache the result
  const ttl = widget.refreshInterval || 300; // Use widget refresh interval or default 5 minutes
  dataCache.set(cacheKey, data, ttl);

  return data;
}