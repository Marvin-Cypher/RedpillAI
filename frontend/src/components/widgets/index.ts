/**
 * Widget Components Index
 * Register all widget components with the widget registry
 */

import { WidgetType } from '@/lib/widgets/types';
import { widgetRegistry } from '@/lib/widgets/registry';

// Import widget components
import PriceChartWidget from './PriceChartWidget';
import FundamentalsWidget from './FundamentalsWidget';
import NewsWidget from './NewsWidget';
import PeerComparisonWidget from './PeerComparisonWidget';
import InvestmentSummaryWidget from './InvestmentSummaryWidget';
import KeyMetricsWidget from './KeyMetricsWidget';
import TokenPriceWidget from './TokenPriceWidget';

// Widget metadata for registration
const WIDGET_METADATA = {
  [WidgetType.PRICE_CHART]: {
    type: WidgetType.PRICE_CHART,
    name: 'Price Chart',
    description: 'Interactive price chart with technical indicators',
    defaultSize: { x: 0, y: 0, w: 6, h: 4 },
    configSchema: {
      timeframe: {
        type: 'select',
        label: 'Time Frame',
        options: [
          { value: '1M', label: '1 Month' },
          { value: '3M', label: '3 Months' },
          { value: '6M', label: '6 Months' },
          { value: '1Y', label: '1 Year' },
          { value: '2Y', label: '2 Years' }
        ],
        default: '3M'
      },
      indicators: {
        type: 'multi-select',
        label: 'Technical Indicators',
        options: [
          { value: 'SMA', label: 'Simple Moving Average' },
          { value: 'EMA', label: 'Exponential Moving Average' },
          { value: 'RSI', label: 'RSI' },
          { value: 'MACD', label: 'MACD' }
        ],
        default: ['SMA']
      },
      chart_type: {
        type: 'select',
        label: 'Chart Type',
        options: [
          { value: 'line', label: 'Line Chart' },
          { value: 'candlestick', label: 'Candlestick' }
        ],
        default: 'line'
      }
    },
    icon: 'TrendingUp',
    category: 'market'
  },
  [WidgetType.FUNDAMENTALS]: {
    type: WidgetType.FUNDAMENTALS,
    name: 'Fundamentals',
    description: 'Key financial metrics and ratios',
    defaultSize: { x: 0, y: 0, w: 6, h: 3 },
    configSchema: {
      metrics: {
        type: 'multi-select',
        label: 'Metrics to Display',
        options: [
          { value: 'market_cap', label: 'Market Cap' },
          { value: 'pe_ratio', label: 'P/E Ratio' },
          { value: 'revenue_ttm', label: 'Revenue (TTM)' },
          { value: 'gross_margin', label: 'Gross Margin' },
          { value: 'profit_margin', label: 'Profit Margin' },
          { value: 'debt_ratio', label: 'Debt Ratio' }
        ],
        default: ['market_cap', 'pe_ratio', 'revenue_ttm']
      },
      display_format: {
        type: 'select',
        label: 'Display Format',
        options: [
          { value: 'cards', label: 'Cards' },
          { value: 'table', label: 'Table' }
        ],
        default: 'cards'
      }
    },
    icon: 'BarChart3',
    category: 'analysis'
  },
  [WidgetType.NEWS_FEED]: {
    type: WidgetType.NEWS_FEED,
    name: 'News Feed',
    description: 'Latest news and updates',
    defaultSize: { x: 0, y: 0, w: 4, h: 4 },
    configSchema: {
      max_items: {
        type: 'number',
        label: 'Max News Items',
        min: 3,
        max: 10,
        default: 5
      },
      show_source: {
        type: 'boolean',
        label: 'Show Source',
        default: true
      },
      auto_refresh: {
        type: 'boolean',
        label: 'Auto Refresh',
        default: true
      }
    },
    icon: 'Newspaper',
    category: 'news'
  },
  [WidgetType.PEER_COMPARISON]: {
    type: WidgetType.PEER_COMPARISON,
    name: 'Peer Comparison',
    description: 'Compare with competitor companies',
    defaultSize: { x: 0, y: 0, w: 8, h: 3 },
    configSchema: {
      max_peers: {
        type: 'number',
        label: 'Max Peers to Compare',
        min: 2,
        max: 6,
        default: 4
      },
      metrics: {
        type: 'multi-select',
        label: 'Comparison Metrics',
        options: [
          { value: 'market_cap', label: 'Market Cap' },
          { value: 'pe_ratio', label: 'P/E Ratio' },
          { value: 'revenue_ttm', label: 'Revenue (TTM)' },
          { value: 'gross_margin', label: 'Gross Margin' }
        ],
        default: ['market_cap', 'pe_ratio', 'revenue_ttm']
      },
      highlight_company: {
        type: 'boolean',
        label: 'Highlight Main Company',
        default: true
      }
    },
    icon: 'GitCompare',
    category: 'analysis'
  },
  [WidgetType.INVESTMENT_SUMMARY]: {
    type: WidgetType.INVESTMENT_SUMMARY,
    name: 'Investment Summary',
    description: 'Investment details and ownership information',
    defaultSize: { x: 0, y: 0, w: 6, h: 3 },
    configSchema: {
      show_details: {
        type: 'boolean',
        label: 'Show Investment Details',
        default: true
      },
      currency_format: {
        type: 'select',
        label: 'Currency Format',
        options: [
          { value: 'USD', label: 'US Dollar' },
          { value: 'EUR', label: 'Euro' },
          { value: 'GBP', label: 'British Pound' }
        ],
        default: 'USD'
      }
    },
    icon: 'DollarSign',
    category: 'company'
  },
  [WidgetType.KEY_METRICS]: {
    type: WidgetType.KEY_METRICS,
    name: 'Key Metrics',
    description: 'Key performance metrics and KPIs',
    defaultSize: { x: 0, y: 0, w: 6, h: 4 },
    configSchema: {
      show_trends: {
        type: 'boolean',
        label: 'Show Trend Indicators',
        default: true
      },
      metric_period: {
        type: 'select',
        label: 'Metric Period',
        options: [
          { value: 'monthly', label: 'Monthly' },
          { value: 'quarterly', label: 'Quarterly' },
          { value: 'yearly', label: 'Yearly' }
        ],
        default: 'monthly'
      }
    },
    icon: 'BarChart3',
    category: 'company'
  },
  [WidgetType.TOKEN_PRICE]: {
    type: WidgetType.TOKEN_PRICE,
    name: 'Token Price',
    description: 'Real-time token price and market data for crypto companies',
    defaultSize: { x: 0, y: 0, w: 4, h: 4 },
    configSchema: {
      refresh_interval: {
        type: 'select',
        label: 'Refresh Interval',
        options: [
          { value: '30', label: '30 seconds' },
          { value: '60', label: '1 minute' },
          { value: '300', label: '5 minutes' },
          { value: '900', label: '15 minutes' }
        ],
        default: '60'
      },
      show_market_cap: {
        type: 'boolean',
        label: 'Show Market Cap',
        default: true
      },
      show_volume: {
        type: 'boolean',
        label: 'Show 24h Volume',
        default: true
      },
      show_supply_info: {
        type: 'boolean',
        label: 'Show Supply Information',
        default: true
      },
      price_decimals: {
        type: 'select',
        label: 'Price Decimal Places',
        options: [
          { value: '2', label: '2 decimals' },
          { value: '4', label: '4 decimals' },
          { value: '6', label: '6 decimals' },
          { value: 'auto', label: 'Auto' }
        ],
        default: 'auto'
      }
    },
    icon: 'Activity',
    category: 'market'
  }
};

// Register all widgets
export function registerWidgets() {
  // Register Price Chart Widget
  widgetRegistry.register(
    WidgetType.PRICE_CHART,
    PriceChartWidget,
    WIDGET_METADATA[WidgetType.PRICE_CHART]
  );

  // Register Fundamentals Widget
  widgetRegistry.register(
    WidgetType.FUNDAMENTALS,
    FundamentalsWidget,
    WIDGET_METADATA[WidgetType.FUNDAMENTALS]
  );

  // Register News Widget
  widgetRegistry.register(
    WidgetType.NEWS_FEED,
    NewsWidget,
    WIDGET_METADATA[WidgetType.NEWS_FEED]
  );

  // Register Peer Comparison Widget
  widgetRegistry.register(
    WidgetType.PEER_COMPARISON,
    PeerComparisonWidget,
    WIDGET_METADATA[WidgetType.PEER_COMPARISON]
  );

  // Register Investment Summary Widget
  widgetRegistry.register(
    WidgetType.INVESTMENT_SUMMARY,
    InvestmentSummaryWidget,
    WIDGET_METADATA[WidgetType.INVESTMENT_SUMMARY]
  );

  // Register Key Metrics Widget
  widgetRegistry.register(
    WidgetType.KEY_METRICS,
    KeyMetricsWidget,
    WIDGET_METADATA[WidgetType.KEY_METRICS]
  );

  // Register Token Price Widget
  widgetRegistry.register(
    WidgetType.TOKEN_PRICE,
    TokenPriceWidget,
    WIDGET_METADATA[WidgetType.TOKEN_PRICE]
  );
}

// Auto-register widgets when module is imported
registerWidgets();

// Export components for direct use
export {
  PriceChartWidget,
  FundamentalsWidget,
  NewsWidget,
  PeerComparisonWidget,
  InvestmentSummaryWidget,
  KeyMetricsWidget,
  TokenPriceWidget
};

// Export widget library data
export const WIDGET_LIBRARY_DATA = Object.values(WIDGET_METADATA);