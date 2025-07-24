# Suna AI Integration Plan for RedpillAI

## Overview
Instead of building deep search from scratch, we'll integrate Suna as our AI backend while maintaining our VC-specific UI and features.

## Architecture Strategy

### Current State
- **Frontend**: Next.js 14 with VC CRM UI
- **Backend**: FastAPI for project/deal management 
- **AI**: Custom DeepSeek integration with homegrown search

### Target State
- **Frontend**: Keep our Next.js VC CRM UI
- **AI Backend**: Suna for all AI operations
- **Integration**: API bridge between our app and Suna

## Integration Approach

### Phase 1: Minimal Integration (Recommended Start)
1. **Deploy Suna separately** (can be on different subdomain)
2. **Create API Bridge** in our Next.js app:
   ```typescript
   // src/lib/ai/suna-client.ts
   class SunaClient {
     async createThread(projectContext: Project)
     async sendMessage(threadId: string, message: string)
     async getWebResearch(query: string)
   }
   ```
3. **Keep our UI**, but route AI requests to Suna

### Phase 2: Deep Integration
1. **Shared Authentication** via Supabase
2. **Custom Suna Tools** for VC-specific operations:
   - Portfolio analysis tool
   - Deal flow research tool
   - Competitor analysis tool
3. **Workflow Automation** using Suna's QStash integration

## Implementation Steps

### 1. Deploy Suna Instance
```bash
# Option A: Docker Compose (Easiest)
cd /Users/marvin/redpill-project/suna
python setup.py  # Run their setup wizard

# Option B: Vercel + Supabase (Cloud)
# Deploy Suna backend to Railway/Render
# Deploy Suna frontend to Vercel
```

### 2. Create Integration Layer
```typescript
// src/app/api/suna-proxy/route.ts
export async function POST(req: Request) {
  const { action, data } = await req.json()
  
  // Proxy to Suna API
  const sunaResponse = await fetch(`${SUNA_API_URL}/api/${action}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUNA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  
  return Response.json(await sunaResponse.json())
}
```

### 3. Modify Our AI Components
```typescript
// src/lib/ai/vc-assistant.ts
import { SunaClient } from './suna-client'

export class VCAssistant {
  private suna: SunaClient
  
  async chat(message: string, project: Project) {
    // Use Suna for AI processing
    const thread = await this.suna.createThread({
      context: `VC Project: ${project.name}`,
      metadata: project
    })
    
    return this.suna.sendMessage(thread.id, message)
  }
}
```

## Benefits of This Approach

1. **Immediate Advanced Features**:
   - Web browsing and scraping
   - File management
   - API integrations
   - Command execution
   - Multi-step workflows

2. **Focus on VC Features**:
   - We build VC-specific UI/UX
   - Suna handles complex AI operations
   - No need to maintain AI infrastructure

3. **Scalability**:
   - Suna handles agent orchestration
   - Built-in job queuing with QStash
   - Isolated execution environments

## Required Services

### For Minimal Setup:
1. **Supabase** (free tier works)
2. **Redis** (Upstash free tier)
3. **Anthropic/OpenAI API**
4. **Tavily** (search API)
5. **Daytona** (agent execution)

### Optional Enhancements:
- **Firecrawl** for web scraping
- **RapidAPI** for LinkedIn data
- **QStash** for workflows

## Next Steps

1. **Decision Point**: 
   - Option A: Full Suna deployment (more control, more setup)
   - Option B: Use Suna Cloud when available (easier)
   - Option C: Fork Suna and customize for VC use case

2. **Quick Win**: Start with API integration only
   - Keep our frontend exactly as is
   - Route complex queries to Suna
   - Gradually migrate features

3. **VC-Specific Tools**: Build custom Suna tools
   - Portfolio analysis
   - Due diligence automation
   - Investor matching
   - Market research

## Example VC Workflows with Suna

1. **Due Diligence Research**:
   ```
   User: "Research [Project Name] - check founders, funding, competitors"
   Suna: - Scrapes LinkedIn for founder profiles
         - Searches Crunchbase for funding data
         - Analyzes competitor landscape
         - Generates comprehensive report
   ```

2. **Market Analysis**:
   ```
   User: "Analyze DeFi lending market size and top players"
   Suna: - Searches multiple sources
         - Extracts market data
         - Creates comparison table
         - Identifies investment opportunities
   ```

3. **Portfolio Monitoring**:
   ```
   User: "Check recent news for all portfolio companies"
   Suna: - Searches news for each company
         - Summarizes key developments
         - Flags important updates
         - Sends alerts for major events
   ```

## Cost Comparison

### Current Approach:
- Multiple API keys (search, AI, etc.)
- Complex timeout handling
- Limited capabilities

### With Suna:
- Single integration point
- Professional-grade features
- Community support
- Open source (can self-host)

## Recommendation

Start with **Phase 1 Minimal Integration**:
1. Keep our VC CRM UI unchanged
2. Deploy Suna separately 
3. Create simple API bridge
4. Route complex AI tasks to Suna
5. Gradually expand integration

This gives us immediate advanced AI capabilities while maintaining full control over our VC-specific features and UI.