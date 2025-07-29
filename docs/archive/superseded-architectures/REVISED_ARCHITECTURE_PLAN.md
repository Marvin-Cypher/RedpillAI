# Revised Architecture: VC CRM Shell on Suna Core

## New Approach: Build on Top of Suna

Instead of integrating Suna into our app, we'll use Suna as the core platform and build our VC-specific features as extensions.

## Architecture Overview

```
┌─────────────────────────────────────┐
│      VC CRM UI Shell                │  <- Our custom VC interface
├─────────────────────────────────────┤
│      VC-Specific Features           │  <- Our added value
│  - Deal Pipeline                    │
│  - Portfolio Management             │
│  - Investment Memos                 │
│  - VC Analytics                     │
├─────────────────────────────────────┤
│      Suna Core Platform             │  <- Unchanged Suna
│  - AI Agent Engine                  │
│  - Web Search/Scraping              │
│  - Tool System                      │
│  - Workflow Engine                  │
└─────────────────────────────────────┘
```

## Implementation Strategy

### Option 1: Suna Plugin/Extension System
Build our VC features as Suna plugins:
- Custom tools for VC operations
- Custom UI components
- Custom workflows

### Option 2: Wrapper Application
Deploy Suna and build a separate VC app that:
- Uses Suna's API for all AI operations
- Manages VC-specific data separately
- Provides specialized UI for VCs

### Option 3: Fork and Maintain
Fork Suna and add VC features directly:
- Pros: Deep integration
- Cons: Maintenance burden, merge conflicts

## Recommended Approach: Suna Extension Method

### 1. Deploy Vanilla Suna
```bash
# Use Suna as-is
cd suna
python setup.py
# Deploy with their standard setup
```

### 2. Create VC Extension Package
```
suna-vc-extension/
├── tools/           # Custom VC tools
│   ├── deal_analyzer.py
│   ├── portfolio_tracker.py
│   └── investor_matcher.py
├── workflows/       # VC workflows
│   ├── due_diligence.yaml
│   └── fundraising.yaml
├── ui/             # Custom UI components
│   └── vc_dashboard/
└── data/           # VC-specific models
    └── models.py
```

### 3. Use Suna's Extension Points

#### Custom Tools (Suna Format)
```python
# suna-vc-extension/tools/deal_analyzer.py
from agentpress.tool import Tool

class DealAnalyzerTool(Tool):
    """Analyze potential investment deals"""
    
    def __init__(self):
        super().__init__(
            name="analyze_deal",
            description="Analyze a potential VC investment"
        )
    
    def execute(self, company_name: str, sector: str):
        # Use Suna's existing tools internally
        search_results = self.call_tool("web_search", {
            "query": f"{company_name} funding revenue team"
        })
        
        # VC-specific analysis
        return {
            "market_size": self.analyze_market(sector),
            "competitive_landscape": self.analyze_competition(search_results),
            "investment_thesis": self.generate_thesis(search_results)
        }
```

#### Custom Workflows
```yaml
# suna-vc-extension/workflows/due_diligence.yaml
name: VC Due Diligence
description: Comprehensive due diligence for investment decisions

steps:
  - name: company_research
    tool: web_search
    parameters:
      query: "{{company_name}} latest news funding"
      
  - name: founder_analysis
    tool: linkedin_scraper
    parameters:
      profiles: "{{founder_names}}"
      
  - name: market_analysis
    tool: analyze_deal  # Our custom tool
    parameters:
      company_name: "{{company_name}}"
      sector: "{{sector}}"
      
  - name: generate_memo
    tool: document_creator
    template: investment_memo.md
```

### 4. Minimal UI Customization

Instead of replacing Suna's UI, add VC-specific pages:

```typescript
// suna/frontend/pages/vc/portfolio.tsx
import { SunaLayout } from '@/components/Layout'
import { useSupabase } from '@/hooks/useSupabase'

export default function VCPortfolio() {
  // Use Suna's existing auth and data systems
  const { user, supabase } = useSupabase()
  
  // Add VC-specific views
  return (
    <SunaLayout>
      <VCDashboard />
      <DealPipeline />
    </SunaLayout>
  )
}
```

## Benefits of This Approach

### 1. **Maintainability**
- Suna updates don't break our features
- Clear separation of concerns
- Easy to upgrade Suna core

### 2. **Leverage Suna's Power**
- All AI capabilities out of the box
- Existing tool ecosystem
- Battle-tested infrastructure

### 3. **Focus on VC Value**
- We build only VC-specific features
- No need to maintain AI infrastructure
- Faster time to market

## Migration Path

### Phase 1: Basic Integration
1. Deploy Suna with standard setup
2. Create basic VC tools
3. Test with simple workflows

### Phase 2: Data Integration
1. Add VC-specific tables to Supabase
2. Create data sync between our CRM and Suna
3. Build portfolio tracking

### Phase 3: Advanced Features
1. Custom AI agents for VC tasks
2. Automated deal flow management
3. LP reporting automation

## Example: Portfolio Tracker as Suna Extension

```python
# Register with Suna
from suna.tools import register_tool

@register_tool
class PortfolioTrackerTool:
    """Track and analyze VC portfolio companies"""
    
    async def execute(self, action: str, params: dict):
        if action == "update_metrics":
            # Use Suna's web scraping
            for company in params["companies"]:
                data = await self.scrape_metrics(company)
                await self.update_database(company, data)
                
        elif action == "generate_report":
            # Use Suna's document generation
            return await self.create_lp_report(params["quarter"])
```

## Database Schema Extension

```sql
-- Add VC-specific tables to Suna's Supabase
CREATE TABLE vc_portfolios (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    company_name TEXT,
    investment_date DATE,
    amount DECIMAL,
    ownership_percentage DECIMAL,
    -- Link to Suna's threads for AI conversations
    suna_thread_id UUID REFERENCES threads(id)
);

CREATE TABLE vc_deal_flow (
    id UUID PRIMARY KEY,
    status TEXT, -- 'sourced', 'analyzing', 'partner_review', etc
    suna_workflow_id UUID, -- Link to Suna workflow
    created_at TIMESTAMP
);
```

## Recommended Next Steps

1. **Keep our current frontend** for deal pipeline UI
2. **Deploy Suna** for AI/agent capabilities  
3. **Build bridge** between our PostgreSQL and Suna's Supabase
4. **Create custom tools** for VC-specific operations
5. **Gradually migrate** features to use Suna's engine

This approach gives us the best of both worlds:
- Suna's powerful AI capabilities
- Our specialized VC features
- Clean upgrade path
- Reduced maintenance burden