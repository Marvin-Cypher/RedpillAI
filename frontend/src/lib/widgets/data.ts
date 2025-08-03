/**
 * Widget Data Fetching
 * Centralized data fetching utilities for widgets
 */

import { Widget, PriceData, FundamentalData, NewsItem, ComparisonData } from './types';
import { apiClient as centralApiClient } from '@/lib/api';
import { getCompanyCategory } from '@/lib/companyDatabase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ? 
  `${process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')}/api/v1` : 
  'http://localhost:8000/api/v1';

// Generate realistic news URLs based on source
const generateNewsUrl = (company: string, title: string, source: string): string => {
  // Create search terms from company name and key words from title
  const companyTerm = company.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '+');
  const titleTerms = title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter(word => word.length > 3) // Filter out small words
    .slice(0, 3) // Take first 3 meaningful words
    .join('+');
  
  const searchQuery = `${companyTerm}+${titleTerms}`;
  
  const sourceUrls: Record<string, string> = {
    'Reuters': `https://www.reuters.com/search/news?query=${searchQuery}`,
    'Bloomberg': `https://www.bloomberg.com/search?query=${searchQuery}`,
    'CoinDesk': `https://www.coindesk.com/search?query=${searchQuery}`,
    'The Block': `https://www.theblock.co/search?query=${searchQuery}`,
    'CoinTelegraph': `https://cointelegraph.com/search?query=${searchQuery}`,
    'TechCrunch': `https://search.techcrunch.com/search;?query=${searchQuery}`,
    'WSJ': `https://www.wsj.com/search?query=${searchQuery}`,
    'CNBC': `https://www.cnbc.com/search/?query=${searchQuery}`
  };
  
  return sourceUrls[source] || `https://news.google.com/search?q=${searchQuery}`;
};

// Widget-specific API client for market data (no auth required)
class WidgetApiClient {
  private async request<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Failed to fetch from ${endpoint}:`, error);
      throw error;
    }
  }

  // Price data endpoints
  async getCryptoPrice(symbol: string): Promise<any> {
    return this.request(`/market/crypto/${symbol}/price`);
  }

  async getCryptoHistorical(symbol: string, days: number = 30): Promise<{ data: PriceData[] }> {
    return this.request(`/market/crypto/${symbol}/historical?days=${days}`);
  }

  async getEquityPrice(ticker: string): Promise<any> {
    return this.request(`/market/equity/${ticker}/price`);
  }

  async getEquityHistorical(ticker: string, days: number = 252): Promise<{ data: PriceData[] }> {
    return this.request(`/market/equity/${ticker}/historical?days=${days}`);
  }

  // Fundamental data
  async getEquityFundamentals(ticker: string): Promise<FundamentalData> {
    return this.request(`/market/equity/${ticker}/fundamentals`);
  }

  async compareEquities(tickers: string[]): Promise<ComparisonData> {
    const tickerString = tickers.join(',');
    return this.request(`/market/equity/compare?tickers=${tickerString}`);
  }

  // News data
  async getCryptoNews(symbol?: string, limit: number = 10): Promise<{ news: NewsItem[] }> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (symbol) params.append('symbol', symbol);
    return this.request(`/market/news?${params}`);
  }

  async getEquityNews(ticker: string, limit: number = 10): Promise<{ news: NewsItem[] }> {
    return this.request(`/market/equity/${ticker}/news?limit=${limit}`);
  }

  // Market overview
  async getMarketOverview(): Promise<any> {
    return this.request('/market/overview');
  }
}

const widgetApiClient = new WidgetApiClient();

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

// Company name to token symbol mapping for crypto companies
const mapCompanyNameToTokenSymbol = (companyName: string): string | null => {
  const name = companyName.toLowerCase().trim();
  
  // Common company name to token mappings
  const companyToTokenMap: Record<string, string> = {
    // Popular tokens
    'chainlink': 'LINK',
    'chainlink labs': 'LINK',
    'solana': 'SOL', 
    'solana labs': 'SOL',
    'solana foundation': 'SOL',
    'uniswap': 'UNI',
    'uniswap labs': 'UNI',
    'polygon': 'MATIC',
    'polygon technology': 'MATIC',
    'polygon labs': 'MATIC',
    'avalanche': 'AVAX',
    'ava labs': 'AVAX',
    'near': 'NEAR',
    'near protocol': 'NEAR',
    'near foundation': 'NEAR',
    'the graph': 'GRT',
    'graph protocol': 'GRT',
    'aave': 'AAVE',
    'compound': 'COMP',
    'makerdao': 'MKR',
    'maker': 'MKR',
    'cosmos': 'ATOM',
    'cosmos network': 'ATOM',
    'polkadot': 'DOT',
    'web3 foundation': 'DOT',
    'algorand': 'ALGO',
    'algorand foundation': 'ALGO',
    'cardano': 'ADA',
    'iohk': 'ADA',
    'input output': 'ADA',
    'ethereum': 'ETH',
    'ethereum foundation': 'ETH',
    'fantom': 'FTM',
    'fantom foundation': 'FTM',
    'phala network': 'PHA',
    'phala': 'PHA',
    // Add more mappings as needed
  };
  
  // Direct lookup
  if (companyToTokenMap[name]) {
    return companyToTokenMap[name];
  }
  
  // Fuzzy matching - check if company name contains token name
  for (const [companyKey, token] of Object.entries(companyToTokenMap)) {
    if (name.includes(companyKey) || companyKey.includes(name.split(' ')[0])) {
      return token;
    }
  }
  
  return null;
};

// Widget-specific data fetchers
export const widgetDataFetchers = {
  price_chart: async (widget: Widget, companyId: string) => {
    const { ticker, asset_type } = widget.dataSource;
    if (!ticker) throw new Error('No ticker specified for price chart');

    const days = getDaysFromTimeframe(widget.config.timeframe || '3M');
    
    try {
      if (asset_type === 'crypto') {
        return await widgetApiClient.getCryptoHistorical(ticker, days);
      } else {
        return await widgetApiClient.getEquityHistorical(ticker, days);
      }
    } catch (error) {
      console.warn(`Using mock data for price chart (${ticker}):`, error);
      return generateMockPriceData(ticker, days);
    }
  },

  fundamentals: async (widget: Widget, companyId: string) => {
    const companyName = widget.config.companyName;
    const ticker = widget.dataSource.ticker;
    const website = widget.config.website;
    
    console.log('🏢 Fundamentals widget data fetch:', { companyName, companyId, ticker });
    
    if (!companyName) {
      console.error('No company name provided to fundamentals widget');
      throw new Error('Company name is required for fundamentals widget');
    }
    
    try {
      // First, get company information from database to determine type
      console.log('📡 Fetching company info to determine type...');
      const response = await fetch(`http://localhost:8000/api/v1/data/companies/${encodeURIComponent(companyId)}/profile?${website ? `website=${encodeURIComponent(website)}` : ''}`);
      
      if (!response.ok) {
        console.error(`❌ API request failed for ${companyName}: ${response.status} ${response.statusText}`);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      const companyData = result.data;
      
      // Determine company type from backend data or widget config
      let companyType: 'public' | 'crypto' | 'private' = 'private'; // default
      
      // Check if backend returned company_type
      if (companyData.company_type) {
        companyType = companyData.company_type.toLowerCase() as 'public' | 'crypto' | 'private';
      } else {
        // Fallback to categorization logic
        const mockCompany = {
          name: companyData.name,
          company_type: companyData.company_type,
          sector: companyData.industry || '',
          employee_count: parseInt(companyData.employee_count?.replace(/[^0-9]/g, '') || '0'),
          metrics: companyData.key_metrics
        };
        companyType = getCompanyCategory(mockCompany as any);
      }
      
      console.log(`🏷️ Determined company type: ${companyType} for ${companyName}`);
      
      // Route data fetching based on company type
      if (companyType === 'public' && ticker) {
        console.log('📊 Fetching PUBLIC company fundamentals from market API...');
        try {
          const fundamentalsData = await widgetApiClient.getEquityFundamentals(ticker);
          console.log(`✅ Market fundamentals data fetched for ${ticker}:`, fundamentalsData);
          return {
            ...fundamentalsData,
            company_category: 'public',
            data_source: 'market_api'
          };
        } catch (marketError) {
          console.warn(`⚠️ Market API failed for ${ticker}, falling back to company database:`, marketError);
        }
      }
      
      if (companyType === 'crypto') {
        console.log('🪙 Using CRYPTO company fundamentals from database...');
        // For crypto companies, transform crypto_data if available
        const cryptoData = companyData.crypto_data;
        if (cryptoData) {
          return {
            symbol: cryptoData.symbol || ticker || companyName,
            name: companyData.name,
            market_cap: cryptoData.market_cap || 0,
            pe_ratio: null, // Not applicable for crypto
            revenue_ttm: null, // Not applicable for crypto
            gross_margin: null,
            profit_margin: null,
            debt_ratio: null,
            price_to_book: null,
            dividend_yield: null,
            current_price: cryptoData.current_price,
            price_change_24h: cryptoData.price_change_percentage_24h,
            volume_24h: cryptoData.volume_24h,
            circulating_supply: cryptoData.circulating_supply,
            employee_count: companyData.employee_count,
            founded_year: companyData.founded_year,
            industry: companyData.industry,
            company_category: 'crypto',
            data_source: result.source
          };
        }
      }
      
      // For private companies or fallback, use company database
      console.log('🏢 Using PRIVATE company fundamentals from database...');
      return {
        symbol: ticker || companyName,
        name: companyData.name,
        market_cap: companyData.key_metrics?.valuation || 0,
        pe_ratio: null, // Not available for private companies
        revenue_ttm: companyData.key_metrics?.revenue || 0,
        gross_margin: (companyData.key_metrics?.gross_margin || 0) / 100,
        profit_margin: null, // Calculate if needed
        debt_ratio: null, // Not available for private companies
        price_to_book: null, // Not available for private companies
        dividend_yield: null, // Not available for private companies
        employee_count: companyData.employee_count,
        founded_year: companyData.founded_year,
        industry: companyData.industry,
        funding_total: companyData.total_funding,
        burn_rate: companyData.key_metrics?.burn_rate,
        runway_months: companyData.key_metrics?.runway,
        company_category: companyType,
        data_source: result.source,
        cached: result.cached,
        cost: result.cost
      };
      
    } catch (error) {
      console.warn(`⚠️ Failed to fetch fundamentals for ${companyName}, using fallback:`, error);
      
      // Enhanced fallback with realistic data
      return {
        symbol: ticker || companyName,
        name: companyName,
        market_cap: 50000000, // Default private company scale
        pe_ratio: null,
        revenue_ttm: 10000000,
        gross_margin: 0.65,
        profit_margin: null,
        debt_ratio: null,
        price_to_book: null,
        dividend_yield: null,
        company_category: 'private',
        data_source: 'fallback'
      };
    }
  },

  news_feed: async (widget: Widget, companyId: string) => {
    const companyName = widget.config.companyName;
    const ticker = widget.dataSource.ticker;
    const limit = widget.config.max_items || 5;

    console.log('📰 News feed widget data fetch:', { companyName, companyId, ticker });

    if (!companyName) {
      console.error('No company name provided to news feed widget');
      throw new Error('Company name is required for news feed widget');  
    }

    try {
      // First, get company information from database to determine type
      const response = await fetch(`http://localhost:8000/api/v1/data/companies/${encodeURIComponent(companyId)}/profile`);
      
      let companyType: 'public' | 'crypto' | 'private' = 'private'; // default
      
      if (response.ok) {
        const result = await response.json();
        const companyData = result.data;
        
        if (companyData.company_type) {
          companyType = companyData.company_type.toLowerCase() as 'public' | 'crypto' | 'private';
        }
      }
      
      console.log(`🏷️ Determined company type: ${companyType} for news feed`);

      // Route news fetching based on company type
      if (companyType === 'crypto' && ticker) {
        console.log('🪙 Fetching CRYPTO news...');
        return await widgetApiClient.getCryptoNews(ticker, limit);
      } else if (companyType === 'public' && ticker) {
        console.log('📊 Fetching PUBLIC company news...');
        return await widgetApiClient.getEquityNews(ticker, limit);
      } else {
        console.log('🏢 PRIVATE company - trying generic news API...');
        // Try generic news for private companies
        return await widgetApiClient.getCryptoNews(undefined, limit);
      }
    } catch (error) {
      console.warn(`🔄 Using enhanced mock data for news (${ticker || companyName}):`, error);
      
      // Enhanced mock news based on company/ticker
      const companyNameLower = (companyName || ticker || '').toLowerCase();
      let newsTopics: string[] = [];
      let newsSource = 'TechCrunch';
      
      if (companyNameLower.includes('nvidia')) {
        newsTopics = [
          'NVIDIA announces record Q3 earnings driven by AI chip demand',
          'New GeForce RTX 5090 breaks performance records in gaming benchmarks',
          'NVIDIA partners with Microsoft on next-gen AI infrastructure',
          'Stock hits new all-time high as AI revenue surges 300%',
          'CUDA platform updates enable faster machine learning workflows'
        ];
        newsSource = 'Reuters';
      } else if (companyNameLower.includes('chainlink')) {
        newsTopics = [
          'Chainlink announces integration with major DeFi protocol',
          'Oracle network reaches 1000+ data feeds milestone',
          'LINK token sees increased adoption in cross-chain applications',
          'New partnership brings real-world data to blockchain',
          'Chainlink Labs expands team with key blockchain engineers'
        ];
        newsSource = 'CoinDesk';
      } else if (companyNameLower.includes('phala')) {
        newsTopics = [
          'Phala Network launches new confidential computing features',
          'PHA token utility expands with new staking mechanisms',
          'Partnership announced with leading Web3 infrastructure provider',
          'Developer grants program sees 200% increase in applications',
          'New privacy-preserving smart contracts go live on mainnet'
        ];
        newsSource = 'The Block';
      } else if (companyNameLower.includes('polygon') || companyNameLower.includes('matic')) {
        newsTopics = [
          'Polygon zkEVM processes over 1M transactions in first week',
          'Major enterprise adopts Polygon for supply chain transparency',
          'MATIC staking rewards increase as network usage grows',
          'New partnership brings institutional DeFi to Polygon',
          'Layer 2 scaling solution sees 400% growth in active addresses'
        ];
        newsSource = 'CoinTelegraph';
      } else if (companyNameLower.includes('amazon')) {
        newsTopics = [
          'Amazon Web Services announces new AI/ML services',
          'Q3 earnings show continued growth in cloud revenue',
          'Prime membership benefits expanded to include new services',
          'Amazon invests $4B in Anthropic AI partnership',
          'New fulfillment centers use advanced robotics technology'
        ];
        newsSource = 'Bloomberg';
      } else {
        // Generic tech/crypto news
        newsTopics = [
          `${companyName || ticker} announces strategic partnership`,
          `New product launch drives user growth for ${companyName || ticker}`,
          `${companyName || ticker} secures additional funding round`,
          `Platform updates enhance user experience at ${companyName || ticker}`,
          `${companyName || ticker} expands into new markets`
        ];
      }
      
      const mockNews = Array.from({ length: Math.min(limit, newsTopics.length) }, (_, i) => ({
        title: newsTopics[i] || `${companyName || ticker} News Update ${i + 1}`,
        summary: `Latest developments and market analysis for ${companyName || ticker}. ${newsTopics[i] ? 'Recent activity shows strong momentum in key business areas.' : 'This is a mock news item for development purposes.'}`,
        source: newsSource,
        published_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        url: generateNewsUrl(companyName || ticker || '', newsTopics[i] || '', newsSource),
        ticker: ticker || companyName
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
      return await widgetApiClient.compareEquities(allTickers.slice(0, widget.config.max_peers || 4));
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
        historicalData = await widgetApiClient.getCryptoHistorical(ticker, days);
      } else {
        historicalData = await widgetApiClient.getEquityHistorical(ticker, days);
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
    console.log('🔍 Key metrics widget data fetch using companyId:', { companyId, widgetType: widget.type });
    
    if (!companyId) {
      throw new Error('Company ID is required for key metrics widget');
    }
    
    // Use companyId (UUID) directly for API call
    try {
      console.log('📡 Fetching company data using UUID...');
      const response = await fetch(`${API_BASE}/data/companies/${encodeURIComponent(companyId)}/profile`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const companyData = result.data;
      
      console.log(`✅ Key metrics data fetched for ${companyData.name}:`, {
        has_key_metrics: !!companyData.key_metrics,
        company_type: companyData.company_type,
        data_source: result.source
      });
      
      // Use the enhanced cached data from our backend
      return {
        revenue_current: companyData.key_metrics?.revenue || companyData.revenue_current || 0,
        revenue_growth: companyData.key_metrics?.revenue_growth || companyData.revenue_growth || 0,
        burn_rate: companyData.key_metrics?.burn_rate || companyData.burn_rate || 0,
        runway_months: companyData.key_metrics?.runway || companyData.runway_months || 0,
        employees: parseInt(companyData.employee_count?.replace(/[^\d]/g, '') || '0') || companyData.key_metrics?.employees || companyData.employees || 0,
        customers: companyData.key_metrics?.customers || companyData.customers || 0,
        arr: companyData.key_metrics?.arr || companyData.arr || 0,
        gross_margin: companyData.key_metrics?.gross_margin || companyData.gross_margin || 0,
        // Additional enriched metadata
        founded_year: companyData.founded_year,
        headquarters: companyData.headquarters,
        description: companyData.description,
        total_funding: companyData.total_funding,
        industry: companyData.industry,
        valuation: companyData.key_metrics?.valuation || 0,
        // Cache metadata
        data_quality: companyData.data_quality || 'unknown',
        last_updated: companyData.last_updated,
        source: result.source
      };
    } catch (error) {
      console.error(`❌ Failed to fetch key metrics for company ${companyId}:`, error);
      throw error;
    }
  },

  token_price: async (widget: Widget, companyId: string) => {
    console.log('🪙 Token price widget data fetch using companyId:', { companyId, widgetType: widget.type });
    console.log('🪙 Widget config:', widget.config);
    console.log('🪙 Widget dataSource:', widget.dataSource);
    
    if (!companyId) {
      throw new Error('Company ID is required for token price widget');
    }

    // Use companyId (UUID) directly for API call - much simpler and more reliable
    try {
      console.log('📡 Fetching company profile using UUID...');
      const profileResponse = await fetch(`${API_BASE}/data/companies/${encodeURIComponent(companyId)}/profile`);
      
      if (!profileResponse.ok) {
        throw new Error(`Profile API Error: ${profileResponse.status} ${profileResponse.statusText}`);
      }

      const profileResult = await profileResponse.json();
      const companyData = profileResult.data;
      
      console.log(`✅ Company profile fetched for ${companyData.name}:`, {
        company_type: companyData.company_type,
        has_crypto_data: !!companyData.crypto_data,
        crypto_symbol: companyData.crypto_data?.symbol
      });
      console.log('🪙 Full crypto_data:', companyData.crypto_data);
      
      // Smart crypto company detection and token mapping
      let tokenSymbol = null;
      
      // First, try to get token from existing crypto_data
      if (companyData.crypto_data && companyData.crypto_data.symbol) {
        tokenSymbol = companyData.crypto_data.symbol;
        console.log(`🪙 ${companyData.name} has existing crypto_data with token: ${tokenSymbol}`);
      }
      // If no crypto_data but company is crypto type, try to map company name to token
      else if (companyData.company_type === 'crypto') {
        tokenSymbol = mapCompanyNameToTokenSymbol(companyData.name);
        console.log(`🪙 ${companyData.name} is crypto company, mapped to token: ${tokenSymbol}`);
      }
      
      if (tokenSymbol) {
        
        try {
          // Fetch REAL-TIME crypto price from market API
          console.log(`📈 Fetching real-time price for ${tokenSymbol}...`);
          const priceResponse = await fetch(`${API_BASE}/market/crypto/${tokenSymbol}/price`);
          
          if (priceResponse.ok) {
            const realTimePrice = await priceResponse.json();
            console.log(`✅ Real-time price fetched for ${tokenSymbol}:`, {
              current_price: realTimePrice.current_price,
              change_percent: realTimePrice.change_percent
            });
            console.log('🪙 Full real-time price data:', realTimePrice);
            
            // Merge real-time price data with company crypto_data (if available)
            const result = {
              symbol: tokenSymbol,
              name: companyData.name,
              current_price: realTimePrice.current_price,
              price_change_24h: realTimePrice.current_price - realTimePrice.open_price,
              price_change_percentage_24h: realTimePrice.change_percent,
              market_cap: companyData.crypto_data?.market_cap || null,
              market_cap_rank: companyData.crypto_data?.market_cap_rank || null,
              volume_24h: realTimePrice.volume_24h,
              circulating_supply: companyData.crypto_data?.circulating_supply || null,
              total_supply: companyData.crypto_data?.total_supply || null,
              high_24h: realTimePrice.high_24h,
              low_24h: realTimePrice.low_24h,
              last_updated: realTimePrice.last_updated,
              data_source: companyData.crypto_data ? 'real_time_with_cached_data' : 'real_time_only'
            };
            console.log('🪙 Final token price result:', result);
            return result;
          } else {
            console.warn(`⚠️ Real-time price API failed for ${tokenSymbol}, using fallback`);
            // Fallback to cached crypto_data if available, otherwise basic structure
            if (companyData.crypto_data) {
              return {
                ...companyData.crypto_data,
                name: companyData.name,
                last_updated: new Date().toISOString(),
                data_source: 'cached_fallback'
              };
            } else {
              return {
                symbol: tokenSymbol,
                name: companyData.name,
                current_price: 0,
                message: `Unable to fetch price data for ${tokenSymbol}`,
                data_source: 'fallback_no_data'
              };
            }
          }
        } catch (marketError) {
          console.warn(`⚠️ Market API error for ${tokenSymbol}:`, marketError);
          // Fallback to cached crypto_data if available, otherwise basic structure
          if (companyData.crypto_data) {
            return {
              ...companyData.crypto_data,
              name: companyData.name,
              last_updated: new Date().toISOString(),
              data_source: 'cached_fallback'
            };
          } else {
            return {
              symbol: tokenSymbol,
              name: companyData.name,
              current_price: 0,
              message: `Market API error for ${tokenSymbol}`,
              data_source: 'error_fallback'
            };
          }
        }
      } else {
        console.warn(`${companyData.name} is not a crypto company or has no token data`);
        // Generate fallback for non-crypto companies
        return {
          symbol: 'N/A',
          name: companyData.name,
          current_price: 0,
          market_cap: companyData.key_metrics?.valuation || 0,
          message: `${companyData.name} is not a crypto company`,
          data_source: 'fallback'
        };
      }
    } catch (error) {
      console.error(`❌ Failed to fetch token price for company ${companyId}:`, error);
      throw error;
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
export async function fetchWidgetData(widget: Widget, companyId: string, skipCache: boolean = false): Promise<any> {
  const cacheKey = `${widget.type}_${widget.dataSource.ticker}_${JSON.stringify(widget.config)}`;
  
  console.log(`🚀 fetchWidgetData called:`, { 
    widgetType: widget.type, 
    companyId, 
    skipCache,
    ticker: widget.dataSource.ticker,
    cacheKey
  });
  
  // Check cache first (unless skipCache is true for refresh)
  if (!skipCache) {
    const cachedData = dataCache.get(cacheKey);
    if (cachedData) {
      console.log(`📋 Using cached data for widget ${widget.type}`, { cacheKey });
      return cachedData;
    }
  } else {
    console.log(`🔄 Skipping cache for widget refresh ${widget.type}`, { cacheKey });
    // Clear existing cache entry when refreshing
    dataCache.clear();
  }

  // Fetch fresh data
  const fetcher = widgetDataFetchers[widget.type];
  if (!fetcher) {
    throw new Error(`No data fetcher found for widget type: ${widget.type}`);
  }

  console.log(`📡 Fetching fresh data for widget ${widget.type}`, { companyId, skipCache });
  const data = await fetcher(widget, companyId);
  
  // Cache the result
  const ttl = widget.refreshInterval || 300; // Use widget refresh interval or default 5 minutes
  dataCache.set(cacheKey, data, ttl);

  return data;
}