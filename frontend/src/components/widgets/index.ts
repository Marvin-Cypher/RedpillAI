/**
 * Widget Components Index
 * Register all widget components with the widget registry
 */

import { WidgetType, WidgetMetadata } from '@/lib/widgets/types';
import { widgetRegistry } from '@/lib/widgets/registry';

// Import existing widget components
import PriceChartWidget from './PriceChartWidget';
import FundamentalsWidget from './FundamentalsWidget';
import NewsWidget from './NewsWidget';
import PeerComparisonWidget from './PeerComparisonWidget';
import InvestmentSummaryWidget from './InvestmentSummaryWidget';
import KeyMetricsWidget from './KeyMetricsWidget';
import TokenPriceWidget from './TokenPriceWidget';

// Import new widget components
import RunwayBurnRateWidget from './RunwayBurnRateWidget';
import TokenEconomyDashboardWidget from './TokenEconomyDashboardWidget';
import SECFilingsViewerWidget from './SECFilingsViewerWidget';
import RiskSentimentHeatmapWidget from './RiskSentimentHeatmapWidget';
import CapTableEvolutionWidget from './CapTableEvolutionWidget';
import ESGImpactMetricsWidget from './ESGImpactMetricsWidget';
import StartupMetricsWidget from './StartupMetricsWidget';
import OperationalMetricsWidget from './OperationalMetricsWidget';

// Widget metadata for registration
const WIDGET_METADATA: Partial<Record<WidgetType, WidgetMetadata>> = {
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
      },
      show_runway: {
        type: 'boolean',
        label: 'Show Runway Projection',
        default: false,
        description: 'Display cash runway for private companies'
      },
      compare_to_index: {
        type: 'boolean',
        label: 'Compare to Market Index',
        default: false,
        description: 'Overlay S&P 500 or relevant index'
      }
    },
    icon: 'TrendingUp',
    category: 'market',
    compatibleAssetTypes: ['private', 'public']
  },
  [WidgetType.FUNDAMENTALS]: {
    type: WidgetType.FUNDAMENTALS,
    name: 'Fundamentals',
    description: 'Key financial metrics and ratios for public companies',
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
          { value: 'debt_ratio', label: 'Debt Ratio' },
          { value: 'ev_to_ebitda', label: 'EV/EBITDA' },
          { value: 'roe', label: 'Return on Equity' },
          { value: 'current_ratio', label: 'Current Ratio' }
        ],
        default: ['market_cap', 'pe_ratio', 'revenue_ttm', 'ev_to_ebitda']
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
    category: 'analysis',
    compatibleAssetTypes: ['public']
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
      },
      filter_by_source: {
        type: 'select',
        label: 'Filter by Source',
        options: [
          { value: 'all', label: 'All Sources' },
          { value: 'press', label: 'Press Releases' },
          { value: 'blogs', label: 'Industry Blogs' },
          { value: 'sec', label: 'SEC Filings' }
        ],
        default: 'all'
      }
    },
    icon: 'Newspaper',
    category: 'news',
    compatibleAssetTypes: ['private', 'crypto', 'public']
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
      metrics_private: {
        type: 'multi-select',
        label: 'Private Company Metrics',
        options: [
          { value: 'valuation', label: 'Valuation' },
          { value: 'revenue_growth', label: 'Revenue Growth' },
          { value: 'burn_rate', label: 'Burn Rate' },
          { value: 'runway_months', label: 'Runway (months)' }
        ],
        default: ['valuation', 'revenue_growth', 'runway_months']
      },
      metrics_public: {
        type: 'multi-select',
        label: 'Public Company Metrics',
        options: [
          { value: 'market_cap', label: 'Market Cap' },
          { value: 'pe_ratio', label: 'P/E Ratio' },
          { value: 'revenue_ttm', label: 'Revenue (TTM)' },
          { value: 'gross_margin', label: 'Gross Margin' },
          { value: 'ev_to_ebitda', label: 'EV/EBITDA' }
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
    category: 'analysis',
    compatibleAssetTypes: ['private', 'public']
  },
  [WidgetType.INVESTMENT_SUMMARY]: {
    type: WidgetType.INVESTMENT_SUMMARY,
    name: 'Investment Summary',
    description: 'Investment details, ownership, and dilution history for startups',
    defaultSize: { x: 0, y: 0, w: 6, h: 3 },
    configSchema: {
      show_details: {
        type: 'boolean',
        label: 'Show Investment Details',
        default: true
      },
      show_dilution_history: {
        type: 'boolean',
        label: 'Show Dilution History',
        default: true,
        description: 'Display ownership changes across funding rounds'
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
    category: 'company',
    compatibleAssetTypes: ['private']
  },
  [WidgetType.STARTUP_METRICS]: {
    type: WidgetType.STARTUP_METRICS,
    name: 'Startup Metrics',
    description: 'Key performance metrics for private companies (MRR, CAC, LTV)',
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
    category: 'company',
    compatibleAssetTypes: ['private']
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
      show_fully_diluted_mc: {
        type: 'boolean',
        label: 'Show Fully Diluted Market Cap',
        default: true,
        description: 'Display FDV based on max supply'
      },
      show_inflation_rate: {
        type: 'boolean',
        label: 'Show Token Inflation Rate',
        default: false,
        description: 'Display annual inflation/emission rate'
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
    category: 'market',
    compatibleAssetTypes: ['crypto']
  },
  
  // New Widgets
  [WidgetType.OPERATIONAL_METRICS]: {
    type: WidgetType.OPERATIONAL_METRICS,
    name: 'Operational Metrics',
    description: 'Operational KPIs for public companies',
    defaultSize: { x: 0, y: 0, w: 6, h: 4 },
    configSchema: {
      show_trends: {
        type: 'boolean',
        label: 'Show Trend Indicators',
        default: true
      },
      metrics: {
        type: 'multi-select',
        label: 'Metrics to Display',
        options: [
          { value: 'revenue_per_employee', label: 'Revenue per Employee' },
          { value: 'operating_cash_flow', label: 'Operating Cash Flow' },
          { value: 'free_cash_flow', label: 'Free Cash Flow' },
          { value: 'working_capital', label: 'Working Capital' }
        ],
        default: ['revenue_per_employee', 'operating_cash_flow']
      }
    },
    icon: 'TrendingUp',
    category: 'company',
    compatibleAssetTypes: ['public']
  },

  [WidgetType.RUNWAY_BURN_RATE]: {
    type: WidgetType.RUNWAY_BURN_RATE,
    name: 'Runway & Burn Rate',
    description: 'Plots cash runway vs burn rate and next funding milestone',
    defaultSize: { x: 0, y: 0, w: 6, h: 4 },
    configSchema: {
      runway_threshold_days: {
        type: 'number',
        label: 'Runway Warning Threshold (days)',
        min: 30,
        max: 365,
        default: 180,
        description: 'Alert when runway drops below this threshold'
      },
      show_warning: {
        type: 'boolean',
        label: 'Show Runway Warnings',
        default: true
      }
    },
    compatibleAssetTypes: ['private'],
    icon: 'Clock',
    category: 'finance'
  },

  [WidgetType.TOKEN_ECONOMY_DASHBOARD]: {
    type: WidgetType.TOKEN_ECONOMY_DASHBOARD,
    name: 'Token Economy',
    description: 'Visualizes token supply, vesting, TVL and staking yields',
    defaultSize: { x: 0, y: 0, w: 8, h: 5 },
    configSchema: {
      show_vesting: {
        type: 'boolean',
        label: 'Show Vesting Schedule',
        default: true,
        description: 'Display token unlock schedule'
      },
      show_tvl: {
        type: 'boolean',
        label: 'Show Total Value Locked',
        default: true,
        description: 'Display TVL across protocols'
      },
      show_yield: {
        type: 'boolean',
        label: 'Show Staking Yields',
        default: true,
        description: 'Display current staking APY'
      }
    },
    compatibleAssetTypes: ['crypto'],
    icon: 'Network',
    category: 'crypto'
  },

  [WidgetType.SEC_FILINGS_VIEWER]: {
    type: WidgetType.SEC_FILINGS_VIEWER,
    name: 'SEC Filings',
    description: 'Embeds 10-K/10-Q and earnings transcripts with search',
    defaultSize: { x: 0, y: 0, w: 6, h: 6 },
    configSchema: {
      default_filing_type: {
        type: 'select',
        label: 'Default Filing Type',
        options: [
          { value: '10-K', label: '10-K (Annual)' },
          { value: '10-Q', label: '10-Q (Quarterly)' },
          { value: '8-K', label: '8-K (Current)' },
          { value: 'DEF-14A', label: 'Proxy Statement' }
        ],
        default: '10-K'
      },
      max_documents: {
        type: 'number',
        label: 'Max Documents to Display',
        min: 1,
        max: 10,
        default: 5
      }
    },
    compatibleAssetTypes: ['public'],
    icon: 'FileText',
    category: 'regulatory'
  },

  [WidgetType.RISK_SENTIMENT_HEATMAP]: {
    type: WidgetType.RISK_SENTIMENT_HEATMAP,
    name: 'Risk & Sentiment Heatmap',
    description: 'Aggregates news, on-chain alerts, credit-risk, dev activity',
    defaultSize: { x: 0, y: 0, w: 8, h: 4 },
    configSchema: {
      components: {
        type: 'multi-select',
        label: 'Risk Components',
        options: [
          { value: 'news_sentiment', label: 'News Sentiment' },
          { value: 'social_sentiment', label: 'Social Media Sentiment' },
          { value: 'onchain_alerts', label: 'On-chain Alerts' },
          { value: 'credit_risk', label: 'Credit Risk' },
          { value: 'dev_activity', label: 'Developer Activity' }
        ],
        default: ['news_sentiment', 'onchain_alerts', 'dev_activity']
      }
    },
    compatibleAssetTypes: ['private', 'crypto', 'public'],
    icon: 'AlertTriangle',
    category: 'risk'
  },

  [WidgetType.CAP_TABLE_EVOLUTION]: {
    type: WidgetType.CAP_TABLE_EVOLUTION,
    name: 'Cap-Table Evolution',
    description: 'Interactive timeline of ownership, rounds, and dilution',
    defaultSize: { x: 0, y: 0, w: 6, h: 4 },
    configSchema: {
      time_window: {
        type: 'select',
        label: 'Time Window',
        options: [
          { value: 'all', label: 'All Time' },
          { value: '2y', label: 'Last 2 Years' },
          { value: '5y', label: 'Last 5 Years' }
        ],
        default: 'all'
      },
      highlight_shareholders: {
        type: 'multi-select',
        label: 'Highlight Shareholders',
        options: [
          { value: 'founders', label: 'Founders' },
          { value: 'employees', label: 'Employee Pool' },
          { value: 'vcs', label: 'VC Funds' },
          { value: 'strategic', label: 'Strategic Investors' }
        ],
        default: ['founders', 'vcs']
      }
    },
    compatibleAssetTypes: ['private'],
    icon: 'GitBranch',
    category: 'ownership'
  },

  [WidgetType.ESG_IMPACT_METRICS]: {
    type: WidgetType.ESG_IMPACT_METRICS,
    name: 'ESG & Impact Metrics',
    description: 'Environmental, Social & Governance KPIs for sustainability',
    defaultSize: { x: 0, y: 0, w: 6, h: 4 },
    configSchema: {
      show_environmental: {
        type: 'boolean',
        label: 'Show Environmental Metrics',
        default: true,
        description: 'Carbon footprint, renewable energy usage'
      },
      show_social: {
        type: 'boolean',
        label: 'Show Social Metrics',
        default: true,
        description: 'Diversity, employee satisfaction, community impact'
      },
      show_governance: {
        type: 'boolean',
        label: 'Show Governance Metrics',
        default: true,
        description: 'Board diversity, ethics violations, transparency'
      }
    },
    compatibleAssetTypes: ['private', 'crypto', 'public'],
    icon: 'Globe',
    category: 'impact'
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

  // Register Startup Metrics Widget
  widgetRegistry.register(
    WidgetType.STARTUP_METRICS,
    StartupMetricsWidget,
    WIDGET_METADATA[WidgetType.STARTUP_METRICS]
  );

  // Register Token Price Widget
  widgetRegistry.register(
    WidgetType.TOKEN_PRICE,
    TokenPriceWidget,
    WIDGET_METADATA[WidgetType.TOKEN_PRICE]
  );

  // Register new widgets
  widgetRegistry.register(
    WidgetType.OPERATIONAL_METRICS,
    OperationalMetricsWidget,
    WIDGET_METADATA[WidgetType.OPERATIONAL_METRICS]
  );

  widgetRegistry.register(
    WidgetType.RUNWAY_BURN_RATE,
    RunwayBurnRateWidget,
    WIDGET_METADATA[WidgetType.RUNWAY_BURN_RATE]
  );

  widgetRegistry.register(
    WidgetType.TOKEN_ECONOMY_DASHBOARD,
    TokenEconomyDashboardWidget,
    WIDGET_METADATA[WidgetType.TOKEN_ECONOMY_DASHBOARD]
  );

  widgetRegistry.register(
    WidgetType.SEC_FILINGS_VIEWER,
    SECFilingsViewerWidget,
    WIDGET_METADATA[WidgetType.SEC_FILINGS_VIEWER]
  );

  widgetRegistry.register(
    WidgetType.RISK_SENTIMENT_HEATMAP,
    RiskSentimentHeatmapWidget,
    WIDGET_METADATA[WidgetType.RISK_SENTIMENT_HEATMAP]
  );

  widgetRegistry.register(
    WidgetType.CAP_TABLE_EVOLUTION,
    CapTableEvolutionWidget,
    WIDGET_METADATA[WidgetType.CAP_TABLE_EVOLUTION]
  );

  widgetRegistry.register(
    WidgetType.ESG_IMPACT_METRICS,
    ESGImpactMetricsWidget,
    WIDGET_METADATA[WidgetType.ESG_IMPACT_METRICS]
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
  TokenPriceWidget,
  StartupMetricsWidget,
  OperationalMetricsWidget,
  RunwayBurnRateWidget,
  TokenEconomyDashboardWidget,
  SECFilingsViewerWidget,
  RiskSentimentHeatmapWidget,
  CapTableEvolutionWidget,
  ESGImpactMetricsWidget
};

// Export widget library data
export const WIDGET_LIBRARY_DATA = Object.values(WIDGET_METADATA);