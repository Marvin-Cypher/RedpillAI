# RedPill Customizable Dashboard Architecture
**OpenBB-Powered Portfolio Company Widgets**

## System Overview

Transform static company detail pages (`/portfolio/[companyId]`) into customizable financial dashboards with drag-and-drop OpenBB-powered widgets, creating a personalized investment analysis platform.

## Current State Analysis

### Existing Architecture
- **Backend**: FastAPI + SQLModel + OpenBB SDK integration
- **Frontend**: Next.js 14 + TypeScript + Shadcn/UI + Tailwind
- **Database**: PostgreSQL/SQLite with existing models (Company, Deal, User, Conversation)
- **OpenBB Integration**: Functional market API with crypto endpoints (`/market/crypto/*`)
- **Company Pages**: Static tabs (Updates, Deals, Documents, Board, Analytics-placeholder)

### Identified Gaps
1. **Empty Analytics Tab**: Currently shows "coming soon" placeholder
2. **No Equity Data**: OpenBB equity endpoints missing (only crypto implemented)
3. **Static Content**: No customizable layouts or widgets
4. **Limited Market Integration**: Company pages don't use OpenBB data

## Target Architecture

### Widget System Design

```typescript
// Core Widget Interface
interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  config: WidgetConfig;
  position: GridPosition;
  dataSource: OpenBBDataSource;
  refreshInterval?: number;
}

interface WidgetConfig {
  [key: string]: any; // Widget-specific configuration
}

interface GridPosition {
  x: number;
  y: number;
  w: number; // width in grid units
  h: number; // height in grid units
}

enum WidgetType {
  PRICE_CHART = 'price_chart',
  FUNDAMENTALS = 'fundamentals', 
  NEWS_FEED = 'news_feed',
  PEER_COMPARISON = 'peer_comparison',
  TECHNICAL_ANALYSIS = 'technical_analysis',
  PORTFOLIO_ALLOCATION = 'portfolio_allocation'
}
```

### Database Schema Extensions

```sql
-- Dashboard layouts per company per user
CREATE TABLE dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  layout_name VARCHAR(255) DEFAULT 'Default Dashboard',
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, company_id, is_default) WHERE is_default = true
);

-- Widget configurations within layouts
CREATE TABLE widget_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_layout_id UUID NOT NULL REFERENCES dashboard_layouts(id) ON DELETE CASCADE,
  widget_type VARCHAR(50) NOT NULL,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Company widget data sources (ticker mapping)
CREATE TABLE company_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  ticker_symbol VARCHAR(10),
  exchange VARCHAR(20),
  asset_type VARCHAR(20) DEFAULT 'equity', -- equity, crypto, token
  is_primary BOOLEAN DEFAULT true,
  peer_tickers JSONB DEFAULT '[]', -- Array of competitor tickers
  sector_index VARCHAR(20), -- For benchmarking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Widget data cache for performance
CREATE TABLE widget_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_cache_key_expires (cache_key, expires_at)
);
```

### Backend API Extensions

#### New OpenBB Equity Endpoints
```python
# /backend/app/api/market.py - Add equity support

@router.get("/equity/{ticker}/fundamentals")
async def get_equity_fundamentals(ticker: str):
    """Get fundamental financial data for equity"""
    try:
        overview = obb.equity.fundamental.overview(symbol=ticker)
        income = obb.equity.fundamental.income(symbol=ticker, period="annual", limit=5)
        balance = obb.equity.fundamental.balance(symbol=ticker, period="annual", limit=5)
        
        return {
            "symbol": ticker,
            "overview": overview.results[0] if overview.results else None,
            "financials": {
                "income_statements": income.results if income.results else [],
                "balance_sheets": balance.results if balance.results else []
            },
            "source": "OpenBB Platform"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/equity/{ticker}/historical")
async def get_equity_historical(ticker: str, period: str = "1y"):
    """Get historical price data for equity"""
    try:
        data = obb.equity.price.historical(symbol=ticker)
        return {
            "symbol": ticker,
            "data": [{"date": d.date, "close": d.close, "volume": d.volume} 
                    for d in data.results[-252:]], # Last year
            "source": "OpenBB Platform"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/equity/compare")
async def compare_equities(tickers: str = Query(..., description="Comma-separated tickers")):
    """Compare fundamental metrics across equities"""
    ticker_list = [t.strip() for t in tickers.split(',')]
    comparisons = {}
    
    for ticker in ticker_list:
        try:
            overview = obb.equity.fundamental.overview(symbol=ticker)
            if overview.results:
                comparisons[ticker] = {
                    "market_cap": overview.results[0].market_cap,
                    "pe_ratio": overview.results[0].pe_ratio,
                    "revenue": overview.results[0].revenue_ttm
                }
        except:
            continue
    
    return {"comparisons": comparisons, "source": "OpenBB Platform"}
```

#### Widget Management API
```python
# /backend/app/api/widgets.py - New file

@router.get("/layouts/{company_id}")
async def get_dashboard_layout(company_id: str, user: User = Depends(get_current_user)):
    """Get user's dashboard layout for company"""
    # Query dashboard_layouts and widget_configurations
    pass

@router.post("/layouts/{company_id}")
async def save_dashboard_layout(company_id: str, layout: DashboardLayout, user: User = Depends(get_current_user)):
    """Save dashboard layout for company"""
    # Save layout and widget configurations
    pass

@router.get("/widgets/library")
async def get_widget_library():
    """Get available widget types with metadata"""
    return {
        "widgets": [
            {
                "type": "price_chart",
                "name": "Price Chart",
                "description": "Interactive price chart with technical indicators",
                "default_size": {"w": 6, "h": 4},
                "config_schema": {...}
            },
            # ... other widgets
        ]
    }
```

### Frontend Widget Architecture

#### Widget Registry Pattern
```typescript
// /frontend/src/lib/widgets/registry.ts
class WidgetRegistry {
  private widgets = new Map<WidgetType, WidgetComponent>;
  
  register(type: WidgetType, component: WidgetComponent) {
    this.widgets.set(type, component);
  }
  
  create(type: WidgetType, props: WidgetProps): React.ComponentType {
    const WidgetComponent = this.widgets.get(type);
    if (!WidgetComponent) throw new Error(`Widget ${type} not found`);
    return <WidgetComponent {...props} />;
  }
  
  getAvailable(): WidgetMetadata[] {
    return Array.from(this.widgets.keys()).map(type => ({
      type,
      name: this.getDisplayName(type),
      defaultSize: this.getDefaultSize(type)
    }));
  }
}

export const widgetRegistry = new WidgetRegistry();
```

#### Base Widget Component
```typescript
// /frontend/src/components/widgets/BaseWidget.tsx
interface BaseWidgetProps {
  widget: Widget;
  onUpdate?: (config: WidgetConfig) => void;
  onRemove?: () => void;
  isEditing?: boolean;
}

export const BaseWidget: React.FC<BaseWidgetProps> = ({ 
  widget, 
  onUpdate, 
  onRemove, 
  isEditing,
  children 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  return (
    <Card className="widget-container h-full">
      <CardHeader className="flex flex-row items-center justify-between py-2">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        {isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onUpdate?.(widget.config)}>
                Configure
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRemove} className="text-red-600">
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className="p-2 h-[calc(100%-4rem)]">
        {loading && <div className="flex items-center justify-center h-full">Loading...</div>}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {!loading && !error && children}
      </CardContent>
    </Card>
  );
};
```

#### Drag-and-Drop Dashboard
```typescript
// /frontend/src/components/dashboard/CustomizableDashboard.tsx
import { Responsive, WidthProvider } from 'react-grid-layout';
const ResponsiveGridLayout = WidthProvider(Responsive);

interface CustomizableDashboardProps {
  companyId: string;
  isEditing: boolean;
}

export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  companyId,
  isEditing
}) => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layouts, setLayouts] = useState({});
  
  const handleLayoutChange = (layout: any, layouts: any) => {
    setLayouts(layouts);
    // Auto-save layout changes
    saveDashboardLayout(companyId, layouts);
  };
  
  const addWidget = (widgetType: WidgetType) => {
    const newWidget: Widget = {
      id: generateId(),
      type: widgetType,
      title: getWidgetTitle(widgetType),
      config: getDefaultConfig(widgetType),
      position: findNextPosition(),
      dataSource: getDataSourceForCompany(companyId)
    };
    setWidgets([...widgets, newWidget]);
  };
  
  return (
    <div className="dashboard-container">
      {isEditing && (
        <WidgetLibrary onAddWidget={addWidget} />
      )}
      
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditing}
        isResizable={isEditing}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={60}
      >
        {widgets.map(widget => (
          <div key={widget.id}>
            {widgetRegistry.create(widget.type, {
              widget,
              onUpdate: (config) => updateWidget(widget.id, config),
              onRemove: () => removeWidget(widget.id),
              isEditing
            })}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};
```

### Core Widget Components

#### 1. Price Chart Widget
```typescript
// /frontend/src/components/widgets/PriceChartWidget.tsx
export const PriceChartWidget: React.FC<WidgetProps> = ({ widget }) => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [timeframe, setTimeframe] = useState('1M');
  
  useEffect(() => {
    const fetchData = async () => {
      const ticker = widget.dataSource.ticker;
      const endpoint = widget.dataSource.asset_type === 'crypto' 
        ? `/api/market/crypto/${ticker}/historical`
        : `/api/market/equity/${ticker}/historical`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      setPriceData(data.data);
    };
    
    fetchData();
  }, [widget.dataSource, timeframe]);
  
  return (
    <BaseWidget widget={widget}>
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <div className="text-lg font-bold">
            {widget.dataSource.ticker} - ${priceData[priceData.length - 1]?.close || 'Loading...'}
          </div>
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option value="1M">1M</option>
            <option value="3M">3M</option>
            <option value="1Y">1Y</option>
          </select>
        </div>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="close" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </BaseWidget>
  );
};
```

#### 2. Fundamentals Widget
```typescript
// /frontend/src/components/widgets/FundamentalsWidget.tsx
export const FundamentalsWidget: React.FC<WidgetProps> = ({ widget }) => {
  const [fundamentals, setFundamentals] = useState<FundamentalData | null>(null);
  
  useEffect(() => {
    const fetchFundamentals = async () => {
      const response = await fetch(`/api/market/equity/${widget.dataSource.ticker}/fundamentals`);
      const data = await response.json();
      setFundamentals(data);
    };
    
    fetchFundamentals();
  }, [widget.dataSource]);
  
  if (!fundamentals) return <BaseWidget widget={widget}>Loading...</BaseWidget>;
  
  return (
    <BaseWidget widget={widget}>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold">${fundamentals.overview.market_cap / 1e9}B</div>
          <div className="text-gray-600">Market Cap</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{fundamentals.overview.pe_ratio}x</div>
          <div className="text-gray-600">P/E Ratio</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">${fundamentals.overview.revenue_ttm / 1e9}B</div>
          <div className="text-gray-600">Revenue (TTM)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{fundamentals.overview.gross_margin}%</div>
          <div className="text-gray-600">Gross Margin</div>
        </div>
      </div>
    </BaseWidget>
  );
};
```

#### 3. News Widget
```typescript
// /frontend/src/components/widgets/NewsWidget.tsx
export const NewsWidget: React.FC<WidgetProps> = ({ widget }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  
  useEffect(() => {
    const fetchNews = async () => {
      const response = await fetch(`/api/market/news?symbol=${widget.dataSource.ticker}`);
      const data = await response.json();
      setNews(data.news.slice(0, 5)); // Top 5 news items
    };
    
    fetchNews();
  }, [widget.dataSource]);
  
  return (
    <BaseWidget widget={widget}>
      <div className="space-y-3">
        {news.map((item, index) => (
          <div key={index} className="border-b pb-2 last:border-b-0">
            <a href={item.url} target="_blank" rel="noopener noreferrer" 
               className="text-sm font-medium hover:text-blue-600 line-clamp-2">
              {item.title}
            </a>
            <div className="text-xs text-gray-500 mt-1">
              {item.source} • {formatDate(item.published_at)}
            </div>
          </div>
        ))}
      </div>
    </BaseWidget>
  );
};
```

#### 4. Peer Comparison Widget
```typescript
// /frontend/src/components/widgets/PeerComparisonWidget.tsx
export const PeerComparisonWidget: React.FC<WidgetProps> = ({ widget }) => {
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  
  useEffect(() => {
    const fetchComparison = async () => {
      const tickers = [widget.dataSource.ticker, ...widget.dataSource.peer_tickers].join(',');
      const response = await fetch(`/api/market/equity/compare?tickers=${tickers}`);
      const data = await response.json();
      setComparison(data);
    };
    
    fetchComparison();
  }, [widget.dataSource]);
  
  return (
    <BaseWidget widget={widget}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Company</th>
              <th className="text-right py-2">Market Cap</th>
              <th className="text-right py-2">P/E</th>
              <th className="text-right py-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {comparison && Object.entries(comparison.comparisons).map(([ticker, data]) => (
              <tr key={ticker} className={ticker === widget.dataSource.ticker ? 'bg-blue-50' : ''}>
                <td className="py-2 font-medium">{ticker}</td>
                <td className="text-right">${(data.market_cap / 1e9).toFixed(1)}B</td>
                <td className="text-right">{data.pe_ratio}x</td>
                <td className="text-right">${(data.revenue / 1e9).toFixed(1)}B</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BaseWidget>
  );
};
```

### Data Flow Architecture

```
User Action (Add Widget) 
  ↓
Widget Library Component
  ↓
Dashboard Layout Update
  ↓
Database (Save Layout)
  ↓
Widget Render
  ↓
OpenBB API Call
  ↓
Cache Layer (Redis)
  ↓
Widget Display
```

### Performance Optimizations

1. **Data Caching**: Redis cache for OpenBB API responses (5-15 min depending on data type)
2. **Lazy Loading**: Widgets load data only when visible
3. **Batch Requests**: Combine multiple API calls where possible
4. **Virtual Scrolling**: For large datasets in widgets
5. **Error Boundaries**: Isolated widget failures don't crash dashboard

### Configuration Management

```typescript
// Widget configuration schemas
const WIDGET_CONFIGS = {
  price_chart: {
    schema: {
      timeframe: { type: 'select', options: ['1M', '3M', '6M', '1Y'], default: '3M' },
      indicators: { type: 'multi-select', options: ['SMA', 'EMA', 'RSI', 'MACD'], default: ['SMA'] },
      chart_type: { type: 'select', options: ['line', 'candlestick'], default: 'line' }
    }
  },
  fundamentals: {
    schema: {
      metrics: { 
        type: 'multi-select', 
        options: ['market_cap', 'pe_ratio', 'revenue', 'profit_margin', 'debt_ratio'], 
        default: ['market_cap', 'pe_ratio', 'revenue'] 
      }
    }
  }
};
```

This architecture provides a scalable, maintainable foundation for the customizable dashboard system that can grow with additional widget types and data sources while maintaining performance and user experience.