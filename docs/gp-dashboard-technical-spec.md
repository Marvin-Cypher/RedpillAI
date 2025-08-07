# GP Dashboard Technical Specification
**Database Models, API Design, and Data Architecture**

## Overview

This document provides detailed technical specifications for implementing the seven-module GP dashboard system, including database schema design, API endpoints, service architecture, and data flow patterns.

## Database Schema Design

### Fund-Level Performance Models

#### FundMetrics Model
```python
class FundMetrics(SQLModel, table=True):
    __tablename__ = "fund_metrics"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    fund_id: str = Field(foreign_key="funds.id", index=True)
    metric_date: date = Field(index=True)
    
    # Core Performance Metrics
    irr: Optional[float] = Field(description="Internal Rate of Return (%)")
    tvpi: Optional[float] = Field(description="Total Value to Paid-In multiple")
    dpi: Optional[float] = Field(description="Distributions to Paid-In multiple")
    moic: Optional[float] = Field(description="Multiple on Invested Capital")
    
    # Capital Deployment
    total_committed: Decimal = Field(description="Total fund commitment")
    capital_called: Decimal = Field(description="Capital called to date")
    capital_deployed: Decimal = Field(description="Capital invested in companies")
    dry_powder: Decimal = Field(description="Remaining undeployed capital")
    
    # Valuation Metrics
    nav: Decimal = Field(description="Net Asset Value")
    unrealized_value: Decimal = Field(description="Unrealized portfolio value")
    realized_value: Decimal = Field(description="Cumulative realized value")
    
    # Performance Attribution  
    top_performer_contribution: Optional[float] = Field(description="% of returns from top performer")
    sector_concentration: Optional[Dict[str, float]] = Field(sa_column=Column(JSON))
    vintage_year: int = Field(description="Fund vintage year")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

#### PortfolioAggregations Model
```python
class PortfolioAggregations(SQLModel, table=True):
    __tablename__ = "portfolio_aggregations"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    fund_id: str = Field(foreign_key="funds.id", index=True)
    aggregation_date: date = Field(index=True)
    
    # Portfolio Health Metrics
    total_companies: int = Field(description="Total portfolio companies")
    active_companies: int = Field(description="Currently active companies")
    exited_companies: int = Field(description="Successfully exited companies")
    failed_companies: int = Field(description="Failed/written-off companies")
    
    # Financial Health Aggregations
    total_revenue_ttm: Optional[Decimal] = Field(description="Sum of portfolio TTM revenue")
    avg_growth_rate: Optional[float] = Field(description="Average revenue growth rate")
    median_burn_rate: Optional[Decimal] = Field(description="Median monthly burn rate")
    avg_runway_months: Optional[float] = Field(description="Average runway in months")
    
    # Unit Economics Aggregations
    avg_ltv_cac_ratio: Optional[float] = Field(description="Average LTV:CAC across portfolio")
    median_gross_margin: Optional[float] = Field(description="Median gross margin %")
    
    # Risk Metrics
    companies_at_risk: int = Field(description="Companies with <6mo runway")
    high_burn_companies: int = Field(description="Companies with burn >$500k/mo")
    
    # Sector Distribution
    sector_distribution: Optional[Dict[str, int]] = Field(sa_column=Column(JSON))
    stage_distribution: Optional[Dict[str, int]] = Field(sa_column=Column(JSON))
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

#### BenchmarkData Model
```python
class BenchmarkData(SQLModel, table=True):
    __tablename__ = "benchmark_data"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    benchmark_type: str = Field(index=True, description="e.g., 'cambridge_associates', 'preqin'")
    vintage_year: int = Field(index=True)
    fund_strategy: str = Field(index=True, description="e.g., 'early_stage', 'growth'")
    geography: str = Field(index=True, description="e.g., 'north_america', 'global'")
    
    # Benchmark Metrics
    median_irr: Optional[float] = Field(description="Median IRR for peer group")
    top_quartile_irr: Optional[float] = Field(description="Top quartile IRR")
    median_tvpi: Optional[float] = Field(description="Median TVPI for peer group")
    top_quartile_tvpi: Optional[float] = Field(description="Top quartile TVPI")
    
    # Market Data
    total_funds_in_cohort: int = Field(description="Number of funds in benchmark")
    as_of_date: date = Field(description="Benchmark data as of date")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### Deal Analytics Models

#### PipelineMetrics Model
```python
class PipelineMetrics(SQLModel, table=True):
    __tablename__ = "pipeline_metrics"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    fund_id: str = Field(foreign_key="funds.id", index=True)
    period_start: date = Field(index=True)
    period_end: date = Field(index=True)
    
    # Volume Metrics
    total_deals_sourced: int = Field(description="Total new deals in period")
    deals_screened: int = Field(description="Deals that passed initial screen")
    deals_term_sheet: int = Field(description="Deals that received term sheet")
    deals_closed: int = Field(description="Deals successfully closed")
    
    # Conversion Rates
    screen_conversion_rate: float = Field(description="Screened / Sourced")
    term_sheet_conversion_rate: float = Field(description="Term Sheet / Screened") 
    close_conversion_rate: float = Field(description="Closed / Term Sheet")
    overall_conversion_rate: float = Field(description="Closed / Sourced")
    
    # Velocity Metrics
    avg_source_to_screen_days: Optional[int] = Field(description="Days from source to screen")
    avg_screen_to_term_days: Optional[int] = Field(description="Days from screen to term sheet")
    avg_term_to_close_days: Optional[int] = Field(description="Days from term sheet to close")
    avg_total_cycle_days: Optional[int] = Field(description="Total cycle time")
    
    # Source Attribution
    sourcing_channels: Optional[Dict[str, int]] = Field(sa_column=Column(JSON), 
                                                       description="Deal count by channel")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### Market Intelligence Models

#### SectorTrends Model
```python
class SectorTrends(SQLModel, table=True):
    __tablename__ = "sector_trends"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    sector: str = Field(index=True)
    quarter: str = Field(index=True, description="e.g., '2025Q1'")
    
    # Funding Metrics
    total_deals: int = Field(description="Total deals in sector/quarter")
    total_funding: Decimal = Field(description="Total funding amount")
    median_deal_size: Optional[Decimal] = Field(description="Median deal size")
    median_pre_money: Optional[Decimal] = Field(description="Median pre-money valuation")
    
    # Stage Breakdown
    seed_deals: int = Field(default=0)
    series_a_deals: int = Field(default=0)  
    series_b_deals: int = Field(default=0)
    growth_deals: int = Field(default=0)
    
    # Geographic Distribution
    geographic_distribution: Optional[Dict[str, int]] = Field(sa_column=Column(JSON))
    
    # Market Dynamics
    hot_subsectors: Optional[List[str]] = Field(sa_column=Column(JSON))
    emerging_trends: Optional[List[str]] = Field(sa_column=Column(JSON))
    
    data_source: str = Field(description="e.g., 'crunchbase', 'pitchbook'")
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### LP Reporting Models  

#### LPReporting Model
```python
class LPReporting(SQLModel, table=True):
    __tablename__ = "lp_reporting"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    fund_id: str = Field(foreign_key="funds.id", index=True)
    lp_id: str = Field(foreign_key="limited_partners.id", index=True)
    report_date: date = Field(index=True)
    report_type: str = Field(description="'quarterly', 'annual', 'ad_hoc'")
    
    # LP-Specific Metrics
    lp_commitment: Decimal = Field(description="LP's total commitment")
    lp_called_capital: Decimal = Field(description="Capital called from this LP")
    lp_distributions: Decimal = Field(description="Distributions to this LP")
    lp_nav: Decimal = Field(description="LP's share of NAV")
    
    # LP Returns
    lp_irr: Optional[float] = Field(description="LP-specific IRR")
    lp_tvpi: Optional[float] = Field(description="LP-specific TVPI")
    lp_dpi: Optional[float] = Field(description="LP-specific DPI")
    
    # Waterfall Analysis
    management_fees_paid: Decimal = Field(description="Cumulative management fees")
    carried_interest_accrued: Decimal = Field(description="Carried interest accrued")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### Operations & Risk Models

#### TeamMetrics Model
```python
class TeamMetrics(SQLModel, table=True):
    __tablename__ = "team_metrics"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    user_id: str = Field(foreign_key="users.id", index=True)
    period_start: date = Field(index=True)
    period_end: date = Field(index=True)
    
    # Activity Metrics
    deals_reviewed: int = Field(default=0)
    companies_contacted: int = Field(default=0) 
    meetings_attended: int = Field(default=0)
    board_meetings: int = Field(default=0)
    
    # Portfolio Engagement
    portfolio_check_ins: int = Field(default=0)
    update_responses: int = Field(default=0)
    avg_response_time_hours: Optional[float] = Field(description="Avg response time")
    
    # Deal Sourcing
    deals_sourced: int = Field(default=0)
    deals_referred: int = Field(default=0)
    successful_referrals: int = Field(default=0)
    
    # Productivity Score (calculated)
    productivity_score: Optional[float] = Field(description="Composite productivity score")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

## API Endpoint Design

### Fund Performance Module (`/api/v1/dashboards/fund-performance/`)

#### Fund Metrics Endpoints
```python
# Get current fund performance metrics
GET /api/v1/dashboards/fund-performance/metrics
Response: {
    "irr": 25.4,
    "tvpi": 2.8,
    "dpi": 1.2,
    "nav": 45000000,
    "dry_powder": 15000000,
    "top_performers": [...],
    "as_of_date": "2025-08-07"
}

# Get historical fund performance trend
GET /api/v1/dashboards/fund-performance/trend?period=24m
Response: {
    "data_points": [
        {"date": "2023-08-01", "irr": 18.2, "tvpi": 1.8},
        {"date": "2024-02-01", "irr": 22.1, "tvpi": 2.3},
        ...
    ]
}

# Get benchmark comparison
GET /api/v1/dashboards/fund-performance/benchmarks
Response: {
    "fund_metrics": {...},
    "peer_median": {...},
    "top_quartile": {...},
    "percentile_rank": 75
}
```

#### Portfolio Analytics Endpoints  
```python
# Get portfolio health overview
GET /api/v1/dashboards/portfolio-analytics/overview
Response: {
    "total_companies": 24,
    "healthy_companies": 18,
    "at_risk_companies": 4,
    "failed_companies": 2,
    "sector_distribution": {...},
    "stage_distribution": {...}
}

# Get company performance rankings
GET /api/v1/dashboards/portfolio-analytics/rankings
Response: {
    "rankings": [
        {"company_id": "...", "rank": 1, "growth_score": 95},
        {"company_id": "...", "rank": 2, "growth_score": 88},
        ...
    ]
}

# Get portfolio risk analysis
GET /api/v1/dashboards/portfolio-analytics/risk-analysis
Response: {
    "concentration_risk": {
        "top_company_weight": 0.22,
        "top_3_weight": 0.48,
        "sector_concentration": {...}
    },
    "runway_analysis": {...},
    "burn_rate_concerns": [...]
}
```

### Deal Flow Module (`/api/v1/dashboards/deal-flow/`)

#### Pipeline Analytics
```python
# Get pipeline funnel metrics
GET /api/v1/dashboards/deal-flow/pipeline-funnel
Response: {
    "current_period": {
        "sourced": 125,
        "screened": 45,
        "term_sheet": 8,
        "closed": 3
    },
    "conversion_rates": {
        "source_to_screen": 0.36,
        "screen_to_term": 0.18,
        "term_to_close": 0.375
    },
    "comparison_to_previous": {...}
}

# Get deal velocity metrics  
GET /api/v1/dashboards/deal-flow/velocity
Response: {
    "average_cycle_time": 67,
    "by_stage": {
        "source_to_screen": 14,
        "screen_to_term": 28,
        "term_to_close": 25
    },
    "trend_data": [...]
}

# Get sourcing channel analytics
GET /api/v1/dashboards/deal-flow/sourcing-analytics
Response: {
    "channels": [
        {"name": "Network Referrals", "deals": 45, "success_rate": 0.12},
        {"name": "Cold Outreach", "deals": 32, "success_rate": 0.06},
        {"name": "Events/Conferences", "deals": 28, "success_rate": 0.18},
        ...
    ],
    "roi_analysis": {...}
}
```

### Market Intelligence Module (`/api/v1/dashboards/market-intelligence/`)

#### Market Trends
```python
# Get sector funding trends
GET /api/v1/dashboards/market-intelligence/sector-trends
Response: {
    "current_quarter": "2025Q3",
    "sectors": [
        {
            "name": "AI/ML",
            "total_deals": 234,
            "total_funding": 12500000000,
            "growth_vs_previous": 0.23
        },
        ...
    ]
}

# Get valuation trends
GET /api/v1/dashboards/market-intelligence/valuations
Response: {
    "by_stage": {
        "seed": {"median_pre": 8000000, "median_post": 12000000},
        "series_a": {"median_pre": 25000000, "median_post": 40000000},
        ...
    },
    "trend_data": [...],
    "geographic_comparison": {...}
}

# Get exit activity  
GET /api/v1/dashboards/market-intelligence/exit-activity
Response: {
    "current_quarter": {
        "ipo_count": 12,
        "ma_count": 145,
        "median_exit_multiple": 4.2
    },
    "by_sector": [...],
    "exit_timeline_analysis": {...}
}
```

## Service Layer Architecture

### Fund Performance Service
```python
class FundPerformanceService:
    def __init__(self, db: Session):
        self.db = db
        
    async def calculate_fund_metrics(self, fund_id: str, as_of_date: date = None) -> FundMetrics:
        """Calculate comprehensive fund performance metrics"""
        # Get all deals and their current valuations
        deals = await self.get_fund_deals(fund_id)
        
        # Calculate cash flows for IRR
        cash_flows = await self.build_cash_flow_timeline(deals)
        irr = self.calculate_irr(cash_flows)
        
        # Calculate TVPI (current value / invested capital)
        total_invested = sum(deal.invested_amount for deal in deals)
        current_portfolio_value = await self.get_portfolio_current_value(deals)
        tvpi = current_portfolio_value / total_invested if total_invested > 0 else 0
        
        # Calculate DPI (distributions / invested capital) 
        total_distributions = sum(deal.distributions for deal in deals)
        dpi = total_distributions / total_invested if total_invested > 0 else 0
        
        return FundMetrics(
            fund_id=fund_id,
            metric_date=as_of_date or date.today(),
            irr=irr,
            tvpi=tvpi,
            dpi=dpi,
            # ... additional metrics
        )
    
    def calculate_irr(self, cash_flows: List[CashFlow]) -> float:
        """Calculate Internal Rate of Return using XIRR algorithm"""
        # Implementation of XIRR calculation
        pass
        
    async def get_benchmark_comparison(self, fund_id: str) -> Dict:
        """Compare fund performance to industry benchmarks"""
        fund_metrics = await self.get_current_metrics(fund_id)
        fund = await self.get_fund(fund_id)
        
        benchmark = await self.get_benchmark_data(
            vintage_year=fund.vintage_year,
            strategy=fund.strategy,
            geography=fund.geography
        )
        
        return {
            "fund_metrics": fund_metrics,
            "benchmark_median": benchmark.median_metrics,
            "percentile_rank": self.calculate_percentile_rank(fund_metrics, benchmark)
        }
```

### Portfolio Analytics Service
```python
class PortfolioAnalyticsService:
    def __init__(self, db: Session, market_data_service: MarketDataService):
        self.db = db
        self.market_data_service = market_data_service
        
    async def calculate_portfolio_health_scores(self, fund_id: str) -> Dict:
        """Calculate health scores for all portfolio companies"""
        companies = await self.get_portfolio_companies(fund_id)
        health_scores = {}
        
        for company in companies:
            score = await self.calculate_company_health_score(company)
            health_scores[company.id] = score
            
        return health_scores
    
    async def calculate_company_health_score(self, company: Company) -> Dict:
        """Calculate comprehensive health score for a company"""
        # Get latest financial metrics
        latest_metrics = await self.get_latest_company_metrics(company.id)
        
        # Calculate component scores
        growth_score = self.score_growth_metrics(latest_metrics)
        efficiency_score = self.score_efficiency_metrics(latest_metrics)
        runway_score = self.score_runway_risk(latest_metrics)
        market_score = await self.score_market_position(company)
        
        # Weighted composite score
        composite_score = (
            growth_score * 0.3 +
            efficiency_score * 0.25 +
            runway_score * 0.25 +
            market_score * 0.2
        )
        
        return {
            "composite_score": composite_score,
            "growth_score": growth_score,
            "efficiency_score": efficiency_score,
            "runway_score": runway_score,
            "market_score": market_score,
            "risk_level": self.categorize_risk_level(composite_score)
        }
    
    async def analyze_portfolio_concentration(self, fund_id: str) -> Dict:
        """Analyze portfolio concentration risk"""
        companies = await self.get_portfolio_companies_with_valuations(fund_id)
        total_portfolio_value = sum(c.current_valuation for c in companies)
        
        # Calculate concentration metrics
        company_weights = [c.current_valuation / total_portfolio_value for c in companies]
        company_weights.sort(reverse=True)
        
        return {
            "top_company_weight": company_weights[0] if company_weights else 0,
            "top_3_weight": sum(company_weights[:3]) if len(company_weights) >= 3 else sum(company_weights),
            "top_5_weight": sum(company_weights[:5]) if len(company_weights) >= 5 else sum(company_weights),
            "herfindahl_index": sum(w**2 for w in company_weights),
            "concentration_risk_level": self.assess_concentration_risk(company_weights)
        }
```

## Caching Strategy

### Redis Caching Patterns

#### Fund-Level Metrics Caching
```python
class FundMetricsCache:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.ttl_seconds = 3600  # 1 hour cache
    
    async def get_fund_metrics(self, fund_id: str) -> Optional[Dict]:
        """Get cached fund metrics"""
        cache_key = f"fund_metrics:{fund_id}"
        cached_data = await self.redis.get(cache_key)
        
        if cached_data:
            return json.loads(cached_data)
        return None
    
    async def set_fund_metrics(self, fund_id: str, metrics: Dict):
        """Cache fund metrics with TTL"""
        cache_key = f"fund_metrics:{fund_id}"
        await self.redis.setex(
            cache_key, 
            self.ttl_seconds, 
            json.dumps(metrics, default=str)
        )
    
    async def invalidate_fund_cache(self, fund_id: str):
        """Invalidate all fund-related cache entries"""
        pattern = f"fund_*:{fund_id}"
        cache_keys = await self.redis.keys(pattern)
        if cache_keys:
            await self.redis.delete(*cache_keys)
```

#### Portfolio Aggregation Caching
```python
class PortfolioCacheManager:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        
    async def cache_portfolio_aggregations(self, fund_id: str, aggregations: Dict):
        """Cache portfolio-level aggregations"""
        cache_key = f"portfolio_agg:{fund_id}"
        await self.redis.setex(cache_key, 1800, json.dumps(aggregations, default=str))  # 30 min
    
    async def cache_company_health_scores(self, fund_id: str, health_scores: Dict):
        """Cache individual company health scores"""
        cache_key = f"company_health:{fund_id}"
        await self.redis.setex(cache_key, 900, json.dumps(health_scores))  # 15 min
```

## Real-Time Data Updates

### WebSocket Integration for Live Updates
```python
class DashboardWebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, fund_id: str, user_id: str):
        """Connect client to fund-specific updates"""
        await websocket.accept()
        if fund_id not in self.active_connections:
            self.active_connections[fund_id] = []
        self.active_connections[fund_id].append(websocket)
    
    async def broadcast_fund_update(self, fund_id: str, update_type: str, data: Dict):
        """Broadcast update to all connected clients for a fund"""
        if fund_id in self.active_connections:
            message = {
                "type": update_type,
                "data": data,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            for websocket in self.active_connections[fund_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                except ConnectionClosedOK:
                    self.active_connections[fund_id].remove(websocket)
    
    async def trigger_fund_metrics_update(self, fund_id: str):
        """Trigger recalculation and broadcast of fund metrics"""
        # Recalculate metrics
        fund_service = FundPerformanceService(get_db())
        new_metrics = await fund_service.calculate_fund_metrics(fund_id)
        
        # Broadcast to connected clients
        await self.broadcast_fund_update(
            fund_id, 
            "fund_metrics_updated", 
            new_metrics.dict()
        )
```

## Performance Optimization

### Database Indexing Strategy
```sql
-- Fund metrics performance indexes
CREATE INDEX CONCURRENTLY idx_fund_metrics_fund_date ON fund_metrics(fund_id, metric_date DESC);
CREATE INDEX CONCURRENTLY idx_fund_metrics_date ON fund_metrics(metric_date DESC);

-- Portfolio aggregation indexes  
CREATE INDEX CONCURRENTLY idx_portfolio_agg_fund_date ON portfolio_aggregations(fund_id, aggregation_date DESC);

-- Deal pipeline indexes
CREATE INDEX CONCURRENTLY idx_pipeline_metrics_fund_period ON pipeline_metrics(fund_id, period_start DESC, period_end DESC);

-- Team metrics indexes
CREATE INDEX CONCURRENTLY idx_team_metrics_user_period ON team_metrics(user_id, period_start DESC, period_end DESC);

-- Benchmark data indexes
CREATE INDEX CONCURRENTLY idx_benchmark_vintage_strategy ON benchmark_data(vintage_year, fund_strategy, geography);
```

### Query Optimization Patterns
```python
# Efficient portfolio health score calculation
async def get_portfolio_health_efficiently(self, fund_id: str):
    """Optimized portfolio health calculation with minimal queries"""
    
    # Single query to get all required company data with metrics
    query = (
        select(Company, CompanyMetrics, Deal)
        .join(Deal, Company.id == Deal.company_id)
        .join(CompanyMetrics, Company.id == CompanyMetrics.company_id) 
        .where(Deal.fund_id == fund_id)
        .where(CompanyMetrics.is_latest == True)  # Only latest metrics
    )
    
    results = await self.db.execute(query)
    companies_data = results.all()
    
    # Calculate all health scores in memory to avoid N+1 queries
    health_scores = {}
    for company, metrics, deal in companies_data:
        health_scores[company.id] = self.calculate_health_score_from_data(
            company, metrics, deal
        )
    
    return health_scores
```

This technical specification provides the foundation for implementing a production-ready seven-module GP dashboard system that scales efficiently while maintaining data integrity and performance standards.