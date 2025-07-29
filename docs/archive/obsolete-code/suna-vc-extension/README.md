# Suna VC Extension

This is a VC CRM extension for Suna that adds venture capital specific features without modifying Suna's core.

## Architecture

```
Suna (Core Platform)
  ↑
  | API/Extension Points
  ↓
VC Extension Layer
  - Custom Tools
  - VC Workflows  
  - Portfolio UI
  - Deal Pipeline
```

## Installation

1. First, deploy Suna following their standard setup
2. Then add our VC extensions:

```bash
# In Suna's backend directory
cp -r /path/to/suna-vc-extension/tools/* ./agent/tools/
cp -r /path/to/suna-vc-extension/workflows/* ./workflows/

# In Suna's frontend directory  
cp -r /path/to/suna-vc-extension/pages/* ./pages/
```

## Custom VC Tools

### 1. Deal Analyzer
Analyzes potential investments using Suna's web search and AI.

### 2. Portfolio Monitor
Tracks portfolio companies using Suna's scraping capabilities.

### 3. LP Report Generator
Creates investor reports using Suna's document generation.

### 4. Cap Table Manager
Manages ownership and dilution using Suna's data tools.

## VC Workflows

### Due Diligence Workflow
```yaml
trigger: "Analyze [Company Name] for investment"
steps:
  - web_search: company news, funding, team
  - linkedin_scrape: founder profiles
  - deal_analyzer: market and competition
  - document_create: investment memo
```

### Portfolio Monitoring Workflow
```yaml
trigger: "Weekly portfolio update"
schedule: "every Monday 9am"
steps:
  - portfolio_monitor: get all companies
  - web_search: news for each company
  - alert: significant updates
  - lp_report: generate if needed
```

## UI Extensions

We add VC-specific pages to Suna's UI:
- `/vc/pipeline` - Deal pipeline kanban
- `/vc/portfolio` - Portfolio dashboard
- `/vc/reports` - LP reporting
- `/vc/analytics` - VC metrics

These pages use Suna's existing:
- Authentication (Supabase)
- AI Chat interface
- Tool execution system
- Workflow engine

## Benefits

1. **No Suna modifications** - Easy updates
2. **Full AI power** - All Suna capabilities
3. **VC specialization** - Purpose-built for VCs
4. **Maintain compatibility** - Works with future Suna versions