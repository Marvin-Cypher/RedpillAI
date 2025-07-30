/**
 * Widget System Types
 * Type definitions for the customizable dashboard widget system
 */

export enum WidgetType {
  PRICE_CHART = 'price_chart',
  FUNDAMENTALS = 'fundamentals',
  NEWS_FEED = 'news_feed',
  PEER_COMPARISON = 'peer_comparison',
  TECHNICAL_ANALYSIS = 'technical_analysis',
  PORTFOLIO_ALLOCATION = 'portfolio_allocation',
  INVESTMENT_SUMMARY = 'investment_summary',
  KEY_METRICS = 'key_metrics',
  TOKEN_PRICE = 'token_price'
}

export interface GridPosition {
  x: number;
  y: number;
  w: number; // width in grid units
  h: number; // height in grid units
}

export interface WidgetConfig {
  [key: string]: any;
}

export interface OpenBBDataSource {
  ticker?: string;
  asset_type: 'equity' | 'crypto' | 'index';
  exchange?: string;
  peer_tickers?: string[];
  sector_index?: string;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  config: WidgetConfig;
  position: GridPosition;
  dataSource: OpenBBDataSource;
  refreshInterval?: number;
  isVisible: boolean;
}

export interface WidgetMetadata {
  type: WidgetType;
  name: string;
  description: string;
  defaultSize: GridPosition;
  configSchema: Record<string, any>;
  icon: string;
  category: 'market' | 'analysis' | 'news' | 'portfolio' | 'company';
}

export interface DashboardLayout {
  id: string;
  companyId: string;
  userId: string;
  layoutName: string;
  isDefault: boolean;
  widgets: Widget[];
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change_percent?: number;
}

export interface FundamentalData {
  symbol: string;
  market_cap: number;
  pe_ratio: number;
  revenue_ttm: number;
  gross_margin: number;
  profit_margin: number;
  debt_ratio: number;
  price_to_book: number;
  dividend_yield: number;
}

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  published_at: string;
  url: string;
  ticker?: string;
}

export interface ComparisonData {
  comparisons: Record<string, Partial<FundamentalData>>;
  ticker_count: number;
  analysis_note: string;
}

// Widget Component Props
export interface BaseWidgetProps {
  widget: Widget;
  onUpdate?: (config: WidgetConfig) => void;
  onRemove?: () => void;
  onResize?: (size: { w: number; h: number }) => void;
  isEditing?: boolean;
  companyId: string;
}

export interface WidgetComponentProps extends BaseWidgetProps {
  data?: any;
  loading?: boolean;
  error?: string | null;
}

// Alias for backward compatibility
export type WidgetProps = WidgetComponentProps;

// Widget Registry Types
export type WidgetComponent = React.ComponentType<WidgetComponentProps>;

export interface WidgetRegistryEntry {
  component: WidgetComponent;
  metadata: WidgetMetadata;
}

// Configuration Schema Types
export interface ConfigFieldSchema {
  type: 'text' | 'select' | 'multi-select' | 'number' | 'boolean' | 'color';
  label: string;
  description?: string;
  options?: Array<{ value: string; label: string }>;
  default?: any;
  min?: number;
  max?: number;
  required?: boolean;
}

export interface WidgetConfigSchema {
  [fieldName: string]: ConfigFieldSchema;
}