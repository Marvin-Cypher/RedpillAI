/**
 * Widget Components Index
 * Export all migrated widget components and register them
 */

// Core widget components (migrated to shadcn)
export { default as NewsWidget } from './NewsWidget'
export { default as FundamentalsWidget } from './FundamentalsWidget'
export { default as PeerComparisonWidget } from './PeerComparisonWidget'
export { default as PriceChartWidget } from './PriceChartWidget'
export { default as TokenPriceWidget } from './TokenPriceWidget'
export { default as KeyMetricsWidget } from './KeyMetricsWidget'
export { default as BaseWidget } from './BaseWidget'

// Widget management components
export { WidgetManager } from './WidgetManager'
export { WidgetGrid } from './WidgetGrid'

// Widget types and utilities
export * from '@/lib/widgets/types'
export * from '@/lib/widgets/registry'

// Import widget registration to register all widgets
import '@/lib/widgets/registerWidgets'