# GP Dashboard Widget Specifications
**Detailed Widget Design for Seven-Module Dashboard System**

## Overview

This document provides comprehensive specifications for all widgets across the seven GP dashboard modules, including design patterns, data requirements, interactive features, and technical implementation details.

## Widget Design Principles

### 1. Consistent Visual Language
- **Card-based design** with subtle shadows and rounded corners
- **Color coding** for status indicators (green = healthy, yellow = warning, red = critical)
- **Typography hierarchy** with clear headings and readable metrics
- **Responsive layouts** that adapt to widget sizes and screen dimensions

### 2. Data-Driven Interactivity
- **Drill-down capabilities** from summary to detailed views
- **Time period controls** for historical analysis
- **Filtering options** for segment-specific insights
- **Export functionality** for further analysis

### 3. Performance Optimization
- **Lazy loading** for complex visualizations
- **Incremental updates** for real-time data changes
- **Caching strategies** for frequently accessed data
- **Progressive enhancement** from basic to advanced features

---

## Module 1: Fund Performance Dashboard Widgets

### 1.1 IRR Trend Chart Widget

#### Visual Design
```typescript
interface IRRTrendWidgetConfig {
  timeframe: '1Y' | '2Y' | '3Y' | 'ITD' // Since inception
  showBenchmark: boolean
  chartType: 'line' | 'area'
  showQuarterly: boolean
}
```

#### Data Requirements
- Historical IRR calculations by quarter
- Benchmark IRR data for comparison
- Attribution data for performance drivers

#### Features
- **Interactive timeline** with zoom and pan
- **Benchmark overlay** showing peer median and quartiles
- **Tooltip details** with quarterly performance breakdown
- **Click to drill down** to portfolio company contributors

#### Implementation Notes
```tsx
export const IRRTrendWidget: React.FC<WidgetProps<IRRTrendWidgetConfig>> = ({
  widget,
  companyId, // In this case, fundId
  onUpdate,
  isEditing
}) => {
  const { data: irrData, loading } = useFundMetrics(companyId as string, {
    metric: 'irr_trend',
    timeframe: widget.config.timeframe
  })
  
  const chartData = useMemo(() => 
    processIRRTrendData(irrData, widget.config), 
    [irrData, widget.config]
  )
  
  return (
    <BaseWidget widget={widget} onUpdate={onUpdate} isEditing={isEditing}>
      <div className="p-4">
        <WidgetHeader 
          title="Fund IRR Trend" 
          subtitle={`${widget.config.timeframe} Performance`}
          controls={<TimeframeSelector value={widget.config.timeframe} onChange={handleTimeframeChange} />}
        />
        
        {loading ? (
          <ChartSkeleton height={200} />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="quarter" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={formatIRRTooltip} />
              <Line dataKey="fund_irr" stroke="#2563eb" strokeWidth={2} />
              {widget.config.showBenchmark && (
                <Line dataKey="benchmark_irr" stroke="#6b7280" strokeDasharray="5 5" />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </BaseWidget>
  )
}
```

### 1.2 TVPI Display Widget

#### Visual Design
- **Large central metric** with current TVPI value
- **Trend indicator** showing change from previous period
- **Target progress bar** showing progress toward fund target multiple
- **Breakdown pie chart** showing realized vs. unrealized value

#### Data Requirements
```typescript
interface TVPIData {
  current_tvpi: number
  previous_period_tvpi: number
  target_tvpi: number
  realized_value: number
  unrealized_value: number
  total_invested_capital: number
  top_contributors: Array<{
    company_name: string
    contribution_to_tvpi: number
  }>
}
```

#### Features
- **Animated counter** for TVPI value changes
- **Progress indicator** toward target multiple
- **Component breakdown** of realized/unrealized contributions
- **Top contributors list** with company names and impact

### 1.3 Fund Health Score Widget

#### Visual Design
- **Circular progress indicator** with composite health score (0-100)
- **Component scores** displayed as horizontal bars
- **Status indicator** with color-coded health level
- **Alert panel** for critical issues requiring attention

#### Health Score Components
1. **Portfolio Performance** (30% weight)
   - Average company growth rates
   - Number of companies exceeding targets
   - Milestone achievement rates

2. **Capital Efficiency** (25% weight)
   - Capital deployment pace
   - Average time to first revenue
   - Cost per investment metrics

3. **Risk Management** (25% weight)
   - Portfolio concentration levels
   - Companies at risk (runway < 6 months)
   - Sector diversification score

4. **Market Position** (20% weight)
   - Relative performance vs. benchmarks
   - Exit pipeline strength
   - LP satisfaction metrics

#### Implementation Pattern
```tsx
const HealthScoreWidget: React.FC<WidgetProps<HealthScoreConfig>> = ({ widget, companyId }) => {
  const { data: healthData } = useFundHealth(companyId as string)
  
  const scoreComponents = [
    { name: 'Portfolio Performance', score: healthData?.portfolio_score, weight: 0.3 },
    { name: 'Capital Efficiency', score: healthData?.efficiency_score, weight: 0.25 },
    { name: 'Risk Management', score: healthData?.risk_score, weight: 0.25 },
    { name: 'Market Position', score: healthData?.market_score, weight: 0.2 }
  ]
  
  const compositeScore = scoreComponents.reduce((sum, component) => 
    sum + (component.score * component.weight), 0
  )
  
  return (
    <BaseWidget widget={widget}>
      <div className="p-6 text-center">
        <CircularProgress 
          value={compositeScore} 
          size={120}
          color={getHealthColor(compositeScore)}
          className="mb-4"
        />
        <h3 className="text-2xl font-bold mb-2">{Math.round(compositeScore)}</h3>
        <p className="text-muted-foreground mb-4">Fund Health Score</p>
        
        <div className="space-y-2">
          {scoreComponents.map(component => (
            <div key={component.name} className="flex items-center justify-between">
              <span className="text-sm">{component.name}</span>
              <div className="flex items-center space-x-2">
                <Progress value={component.score} className="w-20 h-2" />
                <span className="text-sm font-medium">{component.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </BaseWidget>
  )
}
```

---

## Module 2: Portfolio Company Performance Widgets

### 2.1 Portfolio Overview Heat Map Widget

#### Visual Design
- **Grid layout** with company tiles sized by investment amount
- **Color coding** based on performance metrics (green/yellow/red)
- **Company logos** and key metrics overlay
- **Interactive hover** with detailed company information

#### Data Requirements
```typescript
interface PortfolioOverviewData {
  companies: Array<{
    id: string
    name: string
    logo_url: string
    investment_amount: number
    current_valuation: number
    growth_rate: number
    health_score: number
    last_funding_date: string
    stage: string
    sector: string
  }>
  total_portfolio_value: number
  portfolio_growth_rate: number
}
```

#### Features
- **Treemap visualization** with company sizes proportional to investment
- **Multi-metric coloring** (performance, growth, health score)
- **Sector grouping** with expandable categories
- **Quick filters** for stage, sector, performance level

### 2.2 Company Performance Rankings Widget

#### Visual Design
- **Leaderboard table** with ranking positions
- **Performance metrics** in sortable columns
- **Trend indicators** showing movement up/down
- **Action buttons** for detailed company views

#### Key Metrics Displayed
1. **Growth Score** (composite of revenue, user, market growth)
2. **Financial Health** (burn rate, runway, unit economics)
3. **Market Position** (competitive advantage, market share)
4. **Execution Quality** (milestone achievement, team performance)

#### Interactive Features
```tsx
const CompanyRankingsWidget: React.FC<WidgetProps<RankingsConfig>> = ({ widget }) => {
  const [sortBy, setSortBy] = useState<string>('growth_score')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const { data: rankings } = usePortfolioRankings({
    sortBy,
    sortDirection,
    limit: widget.config.maxCompanies || 20
  })
  
  const columns = [
    { key: 'rank', label: 'Rank', sortable: false },
    { key: 'company_name', label: 'Company', sortable: true },
    { key: 'growth_score', label: 'Growth Score', sortable: true },
    { key: 'financial_health', label: 'Financial Health', sortable: true },
    { key: 'market_position', label: 'Market Position', sortable: true }
  ]
  
  return (
    <BaseWidget widget={widget}>
      <div className="p-4">
        <DataTable
          data={rankings}
          columns={columns}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={(key, direction) => {
            setSortBy(key)
            setSortDirection(direction)
          }}
          renderRow={(company, index) => (
            <CompanyRankingRow 
              key={company.id}
              company={company}
              rank={index + 1}
              previousRank={company.previous_rank}
            />
          )}
        />
      </div>
    </BaseWidget>
  )
}
```

### 2.3 Sector Allocation Performance Widget

#### Visual Design
- **Donut chart** showing portfolio allocation by sector
- **Performance overlay** with sector-specific returns
- **Comparison table** showing sector performance vs. market benchmarks
- **Rebalancing suggestions** based on performance and market trends

#### Features
- **Interactive segments** with sector drill-down
- **Performance heatmap** overlaying sector allocation
- **Benchmark comparison** with sector-specific indices
- **Rebalancing alerts** for overweight/underweight positions

---

## Module 3: Deal Flow & Pipeline Widgets

### 3.1 Pipeline Funnel Widget

#### Visual Design
- **Funnel visualization** with stage-by-stage conversion
- **Deal counts** and percentages at each stage
- **Conversion rate indicators** between stages
- **Time-based comparison** with previous periods

#### Implementation
```tsx
const PipelineFunnelWidget: React.FC<WidgetProps<FunnelConfig>> = ({ widget }) => {
  const { data: pipelineData } = usePipelineMetrics({
    period: widget.config.period || 'current_quarter'
  })
  
  const funnelStages = [
    { name: 'Sourced', count: pipelineData?.sourced || 0, color: '#3b82f6' },
    { name: 'Screened', count: pipelineData?.screened || 0, color: '#10b981' },
    { name: 'Due Diligence', count: pipelineData?.due_diligence || 0, color: '#f59e0b' },
    { name: 'Term Sheet', count: pipelineData?.term_sheet || 0, color: '#ef4444' },
    { name: 'Closed', count: pipelineData?.closed || 0, color: '#8b5cf6' }
  ]
  
  return (
    <BaseWidget widget={widget}>
      <div className="p-4">
        <div className="space-y-4">
          {funnelStages.map((stage, index) => {
            const nextStage = funnelStages[index + 1]
            const conversionRate = nextStage ? (nextStage.count / stage.count) * 100 : null
            
            return (
              <div key={stage.name} className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <span className="font-medium">{stage.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{stage.count}</div>
                    {conversionRate && (
                      <div className="text-sm text-muted-foreground">
                        {conversionRate.toFixed(1)}% convert
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-2 mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        backgroundColor: stage.color,
                        width: `${(stage.count / funnelStages[0].count) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </BaseWidget>
  )
}
```

### 3.2 Deal Velocity Tracking Widget

#### Visual Design
- **Timeline chart** showing average cycle times
- **Stage breakdown** of time spent in each phase
- **Trend analysis** comparing current vs. historical velocity
- **Bottleneck identification** highlighting slowest stages

#### Data Structure
```typescript
interface DealVelocityData {
  average_total_cycle_days: number
  stage_breakdowns: {
    source_to_screen: number
    screen_to_due_diligence: number
    due_diligence_to_term_sheet: number
    term_sheet_to_close: number
  }
  historical_comparison: {
    current_quarter: number
    previous_quarter: number
    year_over_year: number
  }
  bottleneck_stage: string
  improvement_suggestions: string[]
}
```

### 3.3 Sourcing Channel Analytics Widget

#### Visual Design
- **Bar chart** showing deal volume by channel
- **Conversion rate overlay** for channel effectiveness
- **ROI calculation** for paid channels vs. organic
- **Channel performance trends** over time

#### Features
- **Interactive bars** with channel-specific drill-down
- **Success rate heatmap** overlay
- **Cost-per-deal analysis** for paid channels
- **Optimization recommendations** based on performance

---

## Module 4: Market & Sector Trends Widgets

### 4.1 VC Funding Trends Widget

#### Visual Design
- **Multi-line chart** showing funding trends across sectors
- **Deal count vs. funding amount** dual-axis visualization
- **Geographic breakdown** with interactive map overlay
- **Stage-wise funding analysis** with stacked areas

#### Data Integration
```typescript
interface FundingTrendsData {
  quarterly_data: Array<{
    quarter: string
    total_deals: number
    total_funding: number
    by_sector: Record<string, {
      deals: number
      funding: number
      avg_deal_size: number
    }>
    by_stage: Record<string, {
      deals: number
      funding: number
    }>
  }>
  market_trends: {
    hot_sectors: string[]
    emerging_trends: string[]
    cooling_sectors: string[]
  }
}
```

### 4.2 Valuation Multiple Tracking Widget

#### Visual Design
- **Bubble chart** with deal size, valuation, and stage dimensions
- **Trend lines** showing valuation inflation/deflation
- **Percentile bands** for market positioning
- **Sector comparison** with benchmark overlays

#### Interactive Features
- **Time period slider** for historical analysis
- **Stage filtering** for relevant comparisons
- **Sector highlighting** for focused analysis
- **Outlier identification** with deal details

### 4.3 Exit Activity Monitor Widget

#### Visual Design
- **Calendar heatmap** showing exit frequency
- **Exit multiple distribution** histogram
- **M&A vs. IPO breakdown** with market conditions overlay
- **Sector exit analysis** with timing patterns

---

## Module 5: LP Reporting Widgets

### 5.1 LP Performance Summary Widget

#### Visual Design
- **Dashboard card layout** with key LP metrics
- **Waterfall chart** showing fee and carry calculations
- **Distribution timeline** with capital calls and distributions
- **Benchmarking section** comparing LP returns to indices

#### LP-Specific Data
```typescript
interface LPPerformanceData {
  lp_id: string
  lp_name: string
  commitment: number
  called_capital: number
  distributions: number
  nav_value: number
  lp_irr: number
  lp_tvpi: number
  lp_dpi: number
  fees_paid: {
    management_fees: number
    carried_interest: number
  }
  distribution_history: Array<{
    date: string
    amount: number
    type: 'capital_call' | 'distribution'
    description: string
  }>
}
```

### 5.2 Capital Call & Distribution Tracker Widget

#### Visual Design
- **Timeline visualization** with capital events
- **Predictive modeling** for future capital calls
- **LP communication log** with notification history
- **Commitment utilization** progress tracking

---

## Module 6: Operations & Team Widgets

### 6.1 Team Productivity Dashboard Widget

#### Visual Design
- **Individual performance cards** for team members
- **Activity heatmap** showing work patterns
- **Goal tracking** with achievement percentages
- **Collaboration metrics** showing cross-team interactions

#### Team Metrics
```typescript
interface TeamProductivityData {
  team_members: Array<{
    user_id: string
    name: string
    role: string
    productivity_score: number
    activities: {
      deals_reviewed: number
      companies_contacted: number
      meetings_attended: number
      board_meetings: number
    }
    goals: Array<{
      description: string
      target: number
      current: number
      due_date: string
    }>
  }>
  team_collaboration: {
    cross_functional_projects: number
    shared_deal_activities: number
    knowledge_sharing_sessions: number
  }
}
```

### 6.2 Portfolio Reporting Compliance Widget

#### Visual Design
- **Compliance status grid** showing reporting rates by company
- **Trend analysis** of reporting quality over time
- **Alert system** for overdue reports
- **Automated follow-up tracking** with communication logs

---

## Module 7: Risk & Compliance Widgets

### 7.1 Portfolio Risk Heat Map Widget

#### Visual Design
- **Risk matrix** plotting probability vs. impact
- **Company risk scores** with color-coded indicators
- **Concentration analysis** with sector/geography breakdowns
- **Early warning alerts** for emerging risks

#### Risk Categories
1. **Financial Risk** - Cash runway, burn rate, revenue volatility
2. **Market Risk** - Competitive pressure, market size changes
3. **Operational Risk** - Key person risk, execution challenges
4. **Regulatory Risk** - Compliance issues, regulatory changes

### 7.2 Compliance Status Tracker Widget

#### Visual Design
- **Compliance checklist** with status indicators
- **Regulatory deadline calendar** with upcoming requirements
- **Audit trail** showing compliance history
- **Documentation status** with missing items highlighted

---

## Widget Development Standards

### 1. Component Structure
```typescript
// Standard widget component structure
interface WidgetProps<T = any> {
  widget: Widget & { config: T }
  companyId: string // Can be fundId for fund-level widgets
  onUpdate?: (config: Partial<T>) => void
  onRemove?: () => void
  onResize?: (size: { w: number; h: number }) => void
  isEditing?: boolean
  onRefresh?: () => void
}

export const ExampleWidget: React.FC<WidgetProps<ExampleConfig>> = ({
  widget,
  companyId,
  onUpdate,
  isEditing,
  onRefresh
}) => {
  // Widget implementation
}
```

### 2. Error Handling Pattern
```typescript
const ErrorBoundaryWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={({ error }) => (
        <div className="p-4 border border-red-200 bg-red-50 rounded">
          <h4 className="font-medium text-red-800">Widget Error</h4>
          <p className="text-sm text-red-600">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
            Reload Widget
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
```

### 3. Data Loading States
```typescript
const useWidgetData = (endpoint: string, params?: any) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await api.get(endpoint, { params })
        setData(response.data)
        setError(null)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [endpoint, JSON.stringify(params)])
  
  return { data, loading, error }
}
```

This widget specification provides a comprehensive foundation for building professional, interactive, and scalable dashboard widgets that serve the specific needs of venture capital fund management while maintaining consistency and performance across the platform.