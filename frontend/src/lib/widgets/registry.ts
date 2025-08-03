/**
 * Widget Registry
 * Central registry for managing widget types and components
 */

import { 
  WidgetType, 
  WidgetComponent, 
  WidgetMetadata, 
  WidgetRegistryEntry,
  Widget,
  GridPosition,
  WidgetConfig,
  WidgetConfigSchema
} from './types';

class WidgetRegistry {
  private widgets = new Map<WidgetType, WidgetRegistryEntry>();

  /**
   * Register a new widget type with its component and metadata
   */
  register(type: WidgetType, component: WidgetComponent, metadata: WidgetMetadata) {
    this.widgets.set(type, { component, metadata });
  }

  /**
   * Get a widget component by type
   */
  getComponent(type: WidgetType): WidgetComponent | null {
    const entry = this.widgets.get(type);
    return entry ? entry.component : null;
  }

  /**
   * Get widget metadata by type
   */
  getMetadata(type: WidgetType): WidgetMetadata | null {
    const entry = this.widgets.get(type);
    return entry ? entry.metadata : null;
  }

  /**
   * Get all available widget types
   */
  getAvailableTypes(): WidgetType[] {
    return Array.from(this.widgets.keys());
  }

  /**
   * Get all widget metadata for the widget library
   */
  getAvailableWidgets(): WidgetMetadata[] {
    return Array.from(this.widgets.values()).map(entry => entry.metadata);
  }

  /**
   * Get widgets by category
   */
  getWidgetsByCategory(category: string): WidgetMetadata[] {
    return this.getAvailableWidgets().filter(widget => widget.category === category);
  }

  /**
   * Create a new widget instance with default configuration
   */
  createWidget(
    type: WidgetType, 
    companyId: string,
    dataSource: any,
    position?: Partial<GridPosition>
  ): Widget | null {
    const metadata = this.getMetadata(type);
    if (!metadata) return null;

    return {
      id: this.generateWidgetId(),
      type,
      title: metadata.name,
      config: this.getDefaultConfig(type),
      position: {
        ...metadata.defaultSize,
        ...position
      },
      dataSource,
      refreshInterval: this.getDefaultRefreshInterval(type),
      isVisible: true
    };
  }

  /**
   * Get default configuration for a widget type
   */
  getDefaultConfig(type: WidgetType): WidgetConfig {
    const defaultConfigs: Record<WidgetType, WidgetConfig> = {
      [WidgetType.PRICE_CHART]: {
        timeframe: '3M',
        indicators: ['SMA'],
        chart_type: 'line',
        show_volume: true
      },
      [WidgetType.FUNDAMENTALS]: {
        metrics: ['market_cap', 'pe_ratio', 'revenue_ttm', 'gross_margin'],
        display_format: 'cards'
      },
      [WidgetType.NEWS_FEED]: {
        max_items: 5,
        show_source: true,
        auto_refresh: true
      },
      [WidgetType.PEER_COMPARISON]: {
        max_peers: 4,
        metrics: ['market_cap', 'pe_ratio', 'revenue_ttm'],
        highlight_company: true
      },
      [WidgetType.TECHNICAL_ANALYSIS]: {
        indicators: ['RSI', 'MACD'],
        period: '1Y'
      },
      [WidgetType.PORTFOLIO_ALLOCATION]: {
        chart_type: 'pie',
        show_percentages: true
      },
      [WidgetType.STARTUP_METRICS]: {
        companyName: 'Unknown Company',
        show_trends: true,
        metric_period: 'monthly'
      },
      [WidgetType.OPERATIONAL_METRICS]: {
        show_trends: true,
        metrics: ['revenue_per_employee', 'operating_cash_flow']
      },
      [WidgetType.RUNWAY_BURN_RATE]: {
        runway_threshold_days: 180,
        show_warning: true
      },
      [WidgetType.TOKEN_ECONOMY_DASHBOARD]: {
        show_vesting: true,
        show_tvl: true,
        show_yield: true
      },
      [WidgetType.SEC_FILINGS_VIEWER]: {
        default_filing_type: '10-K',
        max_documents: 5
      },
      [WidgetType.RISK_SENTIMENT_HEATMAP]: {
        components: ['news_sentiment', 'onchain_alerts', 'dev_activity']
      },
      [WidgetType.CAP_TABLE_EVOLUTION]: {
        time_window: 'all',
        highlight_shareholders: ['founders', 'vcs']
      },
      [WidgetType.ESG_IMPACT_METRICS]: {
        show_environmental: true,
        show_social: true,
        show_governance: true
      },
      [WidgetType.TOKEN_PRICE]: {
        refresh_interval: '60',
        show_market_cap: true,
        show_volume: true
      },
      [WidgetType.INVESTMENT_SUMMARY]: {
        show_details: true,
        currency_format: 'USD'
      }
    };

    return defaultConfigs[type] || {};
  }

  /**
   * Get default refresh interval for widget type (in seconds)
   */
  getDefaultRefreshInterval(type: WidgetType): number {
    const refreshIntervals: Record<WidgetType, number> = {
      [WidgetType.PRICE_CHART]: 60, // 1 minute
      [WidgetType.FUNDAMENTALS]: 3600, // 1 hour
      [WidgetType.NEWS_FEED]: 300, // 5 minutes
      [WidgetType.PEER_COMPARISON]: 1800, // 30 minutes
      [WidgetType.TECHNICAL_ANALYSIS]: 300, // 5 minutes
      [WidgetType.PORTFOLIO_ALLOCATION]: 3600, // 1 hour
      [WidgetType.STARTUP_METRICS]: 1800, // 30 minutes
      [WidgetType.OPERATIONAL_METRICS]: 1800, // 30 minutes
      [WidgetType.RUNWAY_BURN_RATE]: 3600, // 1 hour
      [WidgetType.TOKEN_ECONOMY_DASHBOARD]: 1800, // 30 minutes
      [WidgetType.SEC_FILINGS_VIEWER]: 86400, // 24 hours
      [WidgetType.RISK_SENTIMENT_HEATMAP]: 900, // 15 minutes
      [WidgetType.CAP_TABLE_EVOLUTION]: 86400, // 24 hours
      [WidgetType.ESG_IMPACT_METRICS]: 86400, // 24 hours
      [WidgetType.TOKEN_PRICE]: 60, // 1 minute
      [WidgetType.INVESTMENT_SUMMARY]: 3600 // 1 hour
    };

    return refreshIntervals[type] || 300;
  }

  /**
   * Get configuration schema for widget type
   */
  getConfigSchema(type: WidgetType): WidgetConfigSchema {
    const schemas: Record<WidgetType, WidgetConfigSchema> = {
      [WidgetType.PRICE_CHART]: {
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
        show_volume: {
          type: 'boolean',
          label: 'Show Volume',
          default: true
        }
      },
      [WidgetType.FUNDAMENTALS]: {
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
      [WidgetType.NEWS_FEED]: {
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
      [WidgetType.PEER_COMPARISON]: {
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
      [WidgetType.TECHNICAL_ANALYSIS]: {
        indicators: {
          type: 'multi-select',
          label: 'Technical Indicators',
          options: [
            { value: 'RSI', label: 'RSI' },
            { value: 'MACD', label: 'MACD' },
            { value: 'BB', label: 'Bollinger Bands' },
            { value: 'STOCH', label: 'Stochastic' }
          ],
          default: ['RSI', 'MACD']
        },
        period: {
          type: 'select',
          label: 'Analysis Period',
          options: [
            { value: '3M', label: '3 Months' },
            { value: '6M', label: '6 Months' },
            { value: '1Y', label: '1 Year' }
          ],
          default: '1Y'
        }
      },
      [WidgetType.PORTFOLIO_ALLOCATION]: {
        chart_type: {
          type: 'select',
          label: 'Chart Type',
          options: [
            { value: 'pie', label: 'Pie Chart' },
            { value: 'donut', label: 'Donut Chart' },
            { value: 'bar', label: 'Bar Chart' }
          ],
          default: 'pie'
        },
        show_percentages: {
          type: 'boolean',
          label: 'Show Percentages',
          default: true
        }
      }
    };

    return schemas[type] || {};
  }

  /**
   * Validate widget configuration against schema
   */
  validateConfig(type: WidgetType, config: WidgetConfig): boolean {
    const schema = this.getConfigSchema(type);
    
    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      const value = config[fieldName];
      
      // Check required fields
      if (fieldSchema.required && (value === undefined || value === null)) {
        return false;
      }
      
      // Check number constraints
      if (fieldSchema.type === 'number' && typeof value === 'number') {
        if (fieldSchema.min !== undefined && value < fieldSchema.min) return false;
        if (fieldSchema.max !== undefined && value > fieldSchema.max) return false;
      }
    }
    
    return true;
  }

  /**
   * Find optimal position for a new widget
   */
  findNextPosition(existingWidgets: Widget[], widgetSize: GridPosition): GridPosition {
    const gridCols = 12; // Standard 12-column grid
    const occupied = new Set<string>();
    
    // Mark occupied positions
    existingWidgets.forEach(widget => {
      for (let x = widget.position.x; x < widget.position.x + widget.position.w; x++) {
        for (let y = widget.position.y; y < widget.position.y + widget.position.h; y++) {
          occupied.add(`${x},${y}`);
        }
      }
    });
    
    // Find first available position
    for (let y = 0; y < 100; y++) { // Limit to prevent infinite loop
      for (let x = 0; x <= gridCols - widgetSize.w; x++) {
        let canPlace = true;
        
        for (let dx = 0; dx < widgetSize.w && canPlace; dx++) {
          for (let dy = 0; dy < widgetSize.h && canPlace; dy++) {
            if (occupied.has(`${x + dx},${y + dy}`)) {
              canPlace = false;
            }
          }
        }
        
        if (canPlace) {
          return { x, y, w: widgetSize.w, h: widgetSize.h };
        }
      }
    }
    
    // Fallback: place at bottom
    const maxY = Math.max(0, ...existingWidgets.map(w => w.position.y + w.position.h));
    return { x: 0, y: maxY, w: widgetSize.w, h: widgetSize.h };
  }

  /**
   * Generate unique widget ID
   */
  private generateWidgetId(): string {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const widgetRegistry = new WidgetRegistry();