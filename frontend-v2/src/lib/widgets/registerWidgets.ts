/**
 * Widget Registration
 * Register all available widget components with the registry
 */

import { widgetRegistry } from './registry'
import { WidgetType } from './types'

// Import widget components
import NewsWidget from '@/components/widgets/NewsWidget'
import FundamentalsWidget from '@/components/widgets/FundamentalsWidget'
import PeerComparisonWidget from '@/components/widgets/PeerComparisonWidget'
import PriceChartWidget from '@/components/widgets/PriceChartWidget'
import TokenPriceWidget from '@/components/widgets/TokenPriceWidget'
import KeyMetricsWidget from '@/components/widgets/KeyMetricsWidget'

// Register all widgets with their metadata
export function registerAllWidgets() {
  // Key Metrics Widget
  widgetRegistry.register(
    WidgetType.KEY_METRICS,
    KeyMetricsWidget,
    {
      type: WidgetType.KEY_METRICS,
      name: 'Key Metrics',
      description: 'Key business and financial metrics',
      defaultSize: { x: 0, y: 0, w: 6, h: 4 },
      configSchema: {},
      icon: 'TrendingUp',
      category: 'metrics',
      compatibleAssetTypes: ['private', 'public', 'crypto']
    }
  )

  // Fundamentals Widget
  widgetRegistry.register(
    WidgetType.FUNDAMENTALS,
    FundamentalsWidget,
    {
      type: WidgetType.FUNDAMENTALS,
      name: 'Company Fundamentals',
      description: 'Financial ratios and company fundamentals',
      defaultSize: { x: 0, y: 0, w: 6, h: 4 },
      configSchema: {},
      icon: 'PieChart',
      category: 'financial',
      compatibleAssetTypes: ['public', 'crypto']
    }
  )

  // Price Chart Widget
  widgetRegistry.register(
    WidgetType.PRICE_CHART,
    PriceChartWidget,
    {
      type: WidgetType.PRICE_CHART,
      name: 'Price Chart',
      description: 'Historical price data and trends',
      defaultSize: { x: 0, y: 0, w: 8, h: 6 },
      configSchema: {},
      icon: 'BarChart3',
      category: 'market',
      compatibleAssetTypes: ['public', 'crypto']
    }
  )

  // Token Price Widget
  widgetRegistry.register(
    WidgetType.TOKEN_PRICE,
    TokenPriceWidget,
    {
      type: WidgetType.TOKEN_PRICE,
      name: 'Token Price',
      description: 'Real-time token price and market data',
      defaultSize: { x: 0, y: 0, w: 4, h: 3 },
      configSchema: {},
      icon: 'Activity',
      category: 'market',
      compatibleAssetTypes: ['crypto']
    }
  )

  // Peer Comparison Widget
  widgetRegistry.register(
    WidgetType.PEER_COMPARISON,
    PeerComparisonWidget,
    {
      type: WidgetType.PEER_COMPARISON,
      name: 'Peer Comparison',
      description: 'Compare metrics with peer companies',
      defaultSize: { x: 0, y: 0, w: 8, h: 5 },
      configSchema: {},
      icon: 'BarChart3',
      category: 'market',
      compatibleAssetTypes: ['public', 'crypto']
    }
  )

  // News Feed Widget
  widgetRegistry.register(
    WidgetType.NEWS_FEED,
    NewsWidget,
    {
      type: WidgetType.NEWS_FEED,
      name: 'Latest News',
      description: 'Recent news and updates about the company',
      defaultSize: { x: 0, y: 0, w: 6, h: 5 },
      configSchema: {},
      icon: 'FileText',
      category: 'research',
      compatibleAssetTypes: ['private', 'public', 'crypto']
    }
  )
}

// Auto-register widgets when this module is imported
registerAllWidgets()