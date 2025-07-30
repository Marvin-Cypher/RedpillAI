# Tavily API Integration Design for RedPill VC

## Overview

This document outlines the integration strategy for Tavily API to replace mockup data with real-time company information, market intelligence, and competitive research data across the RedPill VC platform.

## Current Data Requirements Analysis

Based on frontend component analysis, our platform requires the following data types:

### Dashboard Data (StatsCards.tsx)
- **Active Deals**: Number of companies in pipeline
- **Pipeline Value**: Total value across all deals
- **Portfolio Performance**: Total portfolio value and returns
- **Monthly Activity**: New deals, exits, transactions

### Company Profile Data (ProjectDetail.tsx)
- **Basic Info**: Company name, sector, stage, description
- **Financial Data**: Valuation, funding history, round size
- **Team Data**: Team size, key personnel, founders
- **Market Data**: Website, founded date, headquarters
- **Key Metrics**: TVL, transactions, users, revenue (where applicable)
- **Investor Information**: Previous investors, funding rounds

### Deal Pipeline Data (DealPipeline.tsx)
- **Deal Status**: Planned, meeting, research, deal, track
- **Company Details**: Name, sector, stage, round size
- **Market Position**: Hot deals, trending indicators
- **Activity Data**: Conversations, documents, recent updates

### Widget Data Requirements
- **Token Price Data** (TokenPriceWidget.tsx):
  - Current price, 24h change, market cap, volume
  - Market cap rank, circulating supply, price range
- **Key Metrics** (KeyMetricsWidget.tsx):
  - Revenue, growth rate, burn rate, runway
  - Employee count, customer count, ARR, gross margin
- **Fundamentals**: Financial ratios, valuation multiples
- **News & Market Intelligence**: Recent news, sentiment analysis

## Tavily API Integration Strategy

### 1. Data Source Allocation

Based on research findings, we'll implement a dual-source strategy:

**Tavily API**: Primary source for company intelligence
- Company profiles and background information
- Team and founder information
- Funding history and investor data  
- Market sentiment and news analysis
- Competitive intelligence
- General business information

**OpenBB Platform**: Financial and market data
- Public company stock prices and fundamentals
- Crypto token prices and market data
- Market indices and economic indicators
- Financial ratios and valuation metrics
- Trading volumes and technical indicators

### 2. Backend Architecture

#### Database Schema Extensions

```sql
-- Extend companies table with enrichment tracking
ALTER TABLE companies ADD COLUMN enrichment_source VARCHAR(50);
ALTER TABLE companies ADD COLUMN last_enriched_at TIMESTAMP;
ALTER TABLE companies ADD COLUMN enrichment_status VARCHAR(20); -- 'pending', 'completed', 'failed'

-- Create enrichment log table
CREATE TABLE data_enrichments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    source VARCHAR(50), -- 'tavily', 'openbb', 'manual'
    data_type VARCHAR(50), -- 'profile', 'funding', 'team', 'financial'
    status VARCHAR(20), -- 'success', 'failed', 'partial'
    response_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create market intelligence table
CREATE TABLE market_intelligence (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    intelligence_type VARCHAR(50), -- 'news', 'sentiment', 'competitor', 'funding'
    content TEXT,
    source_url VARCHAR(255),
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### API Service Architecture

```python
# backend/app/services/data_enrichment_service.py
from typing import Dict, Any, Optional, List
from tavily import TavilyClient
import asyncio
import logging

class DataEnrichmentService:
    def __init__(self):
        self.tavily_client = TavilyClient(api_key=settings.TAVILY_API_KEY)
        self.logger = logging.getLogger(__name__)
    
    async def enrich_company_profile(self, company: Company) -> Dict[str, Any]:
        """Main enrichment orchestrator"""
        enrichment_tasks = [
            self._fetch_company_overview(company),
            self._fetch_funding_history(company),
            self._fetch_team_information(company),
            self._fetch_market_intelligence(company)
        ]
        
        results = await asyncio.gather(*enrichment_tasks, return_exceptions=True)
        return self._consolidate_enrichment_data(results)
    
    async def _fetch_company_overview(self, company: Company) -> Dict[str, Any]:
        """Fetch basic company information"""
        query = f"{company.name} company profile founded headquarters"
        response = await self.tavily_client.search(
            query=query,
            search_depth="basic",
            include_domains=["crunchbase.com", "pitchbook.com", "linkedin.com"],
            max_results=5
        )
        return self._extract_company_profile(response)
    
    async def _fetch_funding_history(self, company: Company) -> Dict[str, Any]:
        """Fetch funding rounds and investor information"""
        query = f"{company.name} funding history investors Series A B C seed"
        response = await self.tavily_client.search(
            query=query,
            search_depth="advanced",
            include_domains=["crunchbase.com", "techcrunch.com", "venturebeat.com"],
            max_results=10
        )
        return self._extract_funding_data(response)
    
    async def _fetch_team_information(self, company: Company) -> Dict[str, Any]:
        """Fetch team and leadership information"""
        query = f"{company.name} founders CEO team leadership"
        response = await self.tavily_client.search(
            query=query,
            search_depth="basic",
            include_domains=["linkedin.com", "crunchbase.com"],
            max_results=5
        )
        return self._extract_team_data(response)
    
    async def _fetch_market_intelligence(self, company: Company) -> Dict[str, Any]:
        """Fetch market sentiment and competitive intelligence"""
        query = f"{company.name} news market analysis competition recent"
        response = await self.tavily_client.search(
            query=query,
            search_depth="advanced",
            max_results=15,
            include_answer=True
        )
        return self._extract_market_intelligence(response)
```

### 3. Real-time Data Integration

#### API Endpoints

```python
# backend/app/api/v1/enrichment.py
from fastapi import APIRouter, Depends, BackgroundTasks
from app.services.data_enrichment_service import DataEnrichmentService

router = APIRouter()

@router.post("/companies/{company_id}/enrich")
async def enrich_company_data(
    company_id: int,
    background_tasks: BackgroundTasks,
    enrichment_service: DataEnrichmentService = Depends()
):
    """Trigger comprehensive company data enrichment"""
    company = await get_company(company_id)
    background_tasks.add_task(
        enrichment_service.enrich_company_profile,
        company
    )
    return {"status": "enrichment_started", "company_id": company_id}

@router.get("/companies/{company_id}/intelligence")
async def get_market_intelligence(
    company_id: int,
    intelligence_type: Optional[str] = None
):
    """Get market intelligence for a company"""
    intelligence = await get_company_intelligence(
        company_id, 
        intelligence_type
    )
    return intelligence

@router.post("/batch-enrich")
async def batch_enrich_companies(
    company_ids: List[int],
    background_tasks: BackgroundTasks
):
    """Enrich multiple companies in batch"""
    for company_id in company_ids:
        background_tasks.add_task(
            enrich_single_company,
            company_id
        )
    return {"status": "batch_enrichment_started", "count": len(company_ids)}
```

### 4. Data Processing Pipeline

#### Enrichment Workflow

```python
# backend/app/tasks/enrichment_tasks.py
from celery import Celery
from app.services.data_enrichment_service import DataEnrichmentService

@celery.task
async def enrich_company_task(company_id: int):
    """Background task for company enrichment"""
    try:
        company = await Company.get(company_id)
        enrichment_service = DataEnrichmentService()
        
        # Perform enrichment
        enrichment_data = await enrichment_service.enrich_company_profile(company)
        
        # Update company record
        await update_company_with_enrichment(company, enrichment_data)
        
        # Store enrichment log
        await log_enrichment_success(company_id, enrichment_data)
        
        # Trigger vector database update for AI search
        await update_company_embeddings(company_id, enrichment_data)
        
    except Exception as e:
        await log_enrichment_failure(company_id, str(e))
        raise

async def update_company_with_enrichment(company: Company, data: Dict[str, Any]):
    """Update company record with enriched data"""
    update_fields = {}
    
    if data.get('founded_year'):
        update_fields['founded_year'] = data['founded_year']
    if data.get('headquarters'):
        update_fields['headquarters'] = data['headquarters']
    if data.get('employee_count'):
        update_fields['employee_count'] = data['employee_count']
    if data.get('description'):
        update_fields['description'] = data['description']
    if data.get('total_funding'):
        update_fields['total_funding'] = data['total_funding']
    
    update_fields['enrichment_status'] = 'completed'
    update_fields['last_enriched_at'] = datetime.utcnow()
    
    await company.update(**update_fields)
```

### 5. Frontend Integration

#### Data Fetching Hooks

```typescript
// frontend/src/hooks/useEnrichedCompanyData.ts
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export function useEnrichedCompanyData(companyId: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Check if enrichment is needed
        const company = await apiClient.get(`/companies/${companyId}`);
        
        if (shouldTriggerEnrichment(company)) {
          // Trigger background enrichment
          await apiClient.post(`/companies/${companyId}/enrich`);
        }
        
        // Fetch current data (may be enriched or mock)
        setData(company);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [companyId]);

  const triggerRefresh = async () => {
    await apiClient.post(`/companies/${companyId}/enrich`);
    // Poll for updates
    setTimeout(() => window.location.reload(), 5000);
  };

  return { data, loading, error, triggerRefresh };
}

function shouldTriggerEnrichment(company: any): boolean {
  if (!company.last_enriched_at) return true;
  
  const lastEnriched = new Date(company.last_enriched_at);
  const daysSinceEnrichment = (Date.now() - lastEnriched.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceEnrichment > 7; // Re-enrich weekly
}
```

#### Real Data Widget Updates

```typescript
// frontend/src/components/widgets/EnhancedKeyMetricsWidget.tsx
import { useEnrichedCompanyData } from '@/hooks/useEnrichedCompanyData';

const EnhancedKeyMetricsWidget: React.FC<WidgetProps> = ({
  widget,
  companyId,
  ...props
}) => {
  const { data: companyData, loading, error, triggerRefresh } = useEnrichedCompanyData(companyId);
  
  const metricsData = {
    // Use real data when available, fall back to mock
    revenue_current: companyData?.metrics?.revenue || 450000,
    revenue_growth: companyData?.metrics?.revenue_growth || 15.2,
    burn_rate: companyData?.metrics?.burn_rate || 180000,
    runway_months: companyData?.metrics?.runway || 18,
    employees: companyData?.employee_count || 45,
    customers: companyData?.metrics?.customers || 1250,
    arr: companyData?.metrics?.arr || 5400000,
    gross_margin: companyData?.metrics?.gross_margin || 72.5
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Key Performance Metrics</CardTitle>
        {companyData?.enrichment_status === 'pending' && (
          <div className="flex items-center space-x-2">
            <Spinner className="w-4 h-4" />
            <span className="text-xs text-gray-500">Updating...</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={triggerRefresh}
          className="text-xs"
        >
          Refresh Data
        </Button>
      </CardHeader>
      {/* Rest of component using metricsData */}
    </Card>
  );
};
```

### 6. AI Agent Integration

#### Enhanced Search Tools

```python
# backend/app/services/ai_service.py
class EnhancedAIService:
    def __init__(self):
        self.tavily_client = TavilyClient(api_key=settings.TAVILY_API_KEY)
    
    async def research_company(self, company_name: str, research_focus: str = None) -> str:
        """AI agent tool for real-time company research"""
        query = f"{company_name} {research_focus or 'company analysis investment'}"
        
        search_response = await self.tavily_client.search(
            query=query,
            search_depth="advanced",
            include_answer=True,
            include_raw_content=True,
            max_results=10
        )
        
        # Process and structure the research
        research_summary = await self._summarize_research(search_response)
        
        # Store in vector database for future reference
        await self._store_research_embeddings(company_name, research_summary)
        
        return research_summary
    
    async def get_market_sentiment(self, company_name: str) -> Dict[str, Any]:
        """Get current market sentiment and news"""
        query = f"{company_name} news sentiment analysis recent market reaction"
        
        response = await self.tavily_client.search(
            query=query,
            search_depth="advanced",
            include_domains=["techcrunch.com", "coindesk.com", "bloomberg.com"],
            max_results=15
        )
        
        return await self._analyze_sentiment(response)
```

### 7. Implementation Phases

#### Phase 1: Foundation (Week 1-2)
- [ ] Set up Tavily API integration
- [ ] Extend database schema for enrichment tracking
- [ ] Create basic enrichment service
- [ ] Implement company profile enrichment

#### Phase 2: Data Pipeline (Week 3-4)
- [ ] Build background enrichment tasks
- [ ] Create batch enrichment endpoints
- [ ] Implement data validation and quality checks
- [ ] Set up enrichment monitoring and logging

#### Phase 3: Frontend Integration (Week 5-6)
- [ ] Update widgets to use real data
- [ ] Implement data refresh mechanisms
- [ ] Add enrichment status indicators
- [ ] Create fallback handling for missing data

#### Phase 4: AI Enhancement (Week 7-8)
- [ ] Integrate Tavily with AI agents
- [ ] Implement real-time research tools
- [ ] Add market intelligence features
- [ ] Optimize for performance and cost

### 8. Cost and Performance Considerations

#### Expected API Usage
- **Daily Company Enrichments**: ~50-100 companies
- **AI Agent Queries**: ~200-500 searches
- **Real-time Updates**: ~100-200 searches
- **Monthly Total**: ~15,000-25,000 API calls

#### Cost Estimates (Tavily Pricing)
- Estimated monthly cost: $120-200 (based on $8 per 1000 queries)
- Cost per company enrichment: ~$0.40-0.80
- Cost per AI agent query: ~$0.008

#### Performance Optimizations
- Cache enrichment results for 7 days
- Use background tasks for non-urgent enrichments
- Implement intelligent refresh based on data staleness
- Rate limit API calls to stay within quotas

### 9. Data Quality and Validation

#### Quality Assurance Pipeline
- Validate extracted data against known formats
- Cross-reference multiple sources for accuracy
- Flag inconsistencies for manual review
- Track confidence scores for enriched data

#### Fallback Strategies
- Use cached data when API is unavailable
- Maintain mock data as ultimate fallback
- Graceful degradation for missing fields
- Manual override capabilities for incorrect data

## Conclusion

This integration strategy will transform RedPill VC from a mock-data platform to a real-time intelligence system, providing accurate, up-to-date company information while maintaining performance and cost-effectiveness. The phased approach ensures stable deployment while building comprehensive data capabilities.