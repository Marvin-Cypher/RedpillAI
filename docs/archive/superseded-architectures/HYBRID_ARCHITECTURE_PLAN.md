# Hybrid Architecture: VC CRM + Suna Platform

## Overview: Best of Both Worlds

- **Suna**: AI chat, research, document generation, web tools
- **VC CRM**: Deal pipeline, portfolio tracking, custom workflows
- **Shared**: Data sync, unified auth, seamless navigation

## Architecture Diagram

```
┌─────────────────────────┐     ┌─────────────────────────┐
│     VC CRM (Next.js)    │     │    Suna Platform        │
├─────────────────────────┤     ├─────────────────────────┤
│ • Deal Pipeline UI      │     │ • AI Chat Interface     │
│ • Portfolio Dashboard   │     │ • Research Tools        │
│ • Custom Dashboards     │     │ • Document Generation   │
│ • Quick Actions         │     │ • Web Scraping          │
└──────────┬──────────────┘     └──────────┬──────────────┘
           │                                 │
           └────────────┬────────────────────┘
                        │
                  ┌─────┴─────┐
                  │   Shared   │
                  ├───────────┤
                  │ • Database │
                  │ • Auth     │
                  │ • Storage  │
                  └───────────┘
```

## Implementation Strategy

### 1. Shared Database Architecture

Use Supabase (Suna's choice) as the single source of truth:

```sql
-- Suna's existing tables
public.threads
public.messages
public.users

-- Add VC-specific schema
CREATE SCHEMA vc_crm;

-- VC tables in separate schema
CREATE TABLE vc_crm.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'sourced',
    round TEXT,
    valuation DECIMAL,
    -- Link to Suna chat threads
    suna_thread_id UUID REFERENCES public.threads(id),
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE vc_crm.deals (
    id UUID PRIMARY KEY,
    project_id UUID REFERENCES vc_crm.projects(id),
    stage TEXT, -- 'first_meeting', 'due_diligence', etc
    next_step TEXT,
    assigned_partner UUID REFERENCES public.users(id)
);

-- Bridge table for unified experience
CREATE TABLE vc_crm.project_research (
    project_id UUID REFERENCES vc_crm.projects(id),
    suna_message_id UUID REFERENCES public.messages(id),
    research_type TEXT, -- 'due_diligence', 'market_analysis', etc
    created_at TIMESTAMP DEFAULT now()
);
```

### 2. Unified Authentication

Both apps use the same Supabase auth:

```typescript
// shared-auth-config.ts
export const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  // Same config for both apps
}

// In VC CRM app
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey)

// In Suna (already configured)
// Uses same Supabase instance
```

### 3. Seamless Navigation

Create unified navigation between apps:

```typescript
// VC CRM Header Component
export function VCHeader({ currentUser }) {
  return (
    <nav className="flex items-center justify-between">
      <div className="flex space-x-4">
        {/* VC CRM Pages */}
        <Link href="/pipeline">Deal Pipeline</Link>
        <Link href="/portfolio">Portfolio</Link>
        
        {/* Link to Suna */}
        <a 
          href={`${SUNA_URL}/chat?context=vc`}
          className="flex items-center"
        >
          <IconAI className="mr-2" />
          AI Research
        </a>
      </div>
      
      {/* Shared user menu */}
      <UserMenu user={currentUser} />
    </nav>
  )
}

// Suna Custom Navigation (add to Suna)
export function SunaVCNavigation() {
  return (
    <div className="vc-quick-links">
      <a href={`${VC_CRM_URL}/pipeline`}>
        Back to Pipeline
      </a>
    </div>
  )
}
```

### 4. Context Passing

Pass context between apps without complex APIs:

```typescript
// From VC CRM to Suna
function openSunaChat(project: Project) {
  // Pass context via URL params
  const context = {
    project_id: project.id,
    project_name: project.name,
    context_type: 'due_diligence'
  }
  
  const sunaUrl = `${SUNA_URL}/chat?context=${encodeURIComponent(JSON.stringify(context))}`
  window.open(sunaUrl, '_blank')
}

// In Suna, read context
function ChatPage({ searchParams }) {
  const context = searchParams.context ? JSON.parse(searchParams.context) : null
  
  if (context?.project_id) {
    // Load project data from shared database
    const project = await supabase
      .from('vc_crm.projects')
      .select('*')
      .eq('id', context.project_id)
      .single()
    
    // Set initial prompt
    setInitialPrompt(`Conduct due diligence research on ${project.name}`)
  }
}
```

### 5. Data Sync Strategy

Real-time sync using Supabase subscriptions:

```typescript
// In VC CRM - Listen for Suna research updates
useEffect(() => {
  const subscription = supabase
    .channel('research-updates')
    .on('postgres_changes', 
      { 
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `metadata->>project_id=eq.${projectId}`
      },
      (payload) => {
        // New research from Suna
        addResearchToProject(payload.new)
      }
    )
    .subscribe()
    
  return () => subscription.unsubscribe()
}, [projectId])

// In Suna - Tag messages with project context
async function sendMessage(content: string, context?: any) {
  await supabase.from('messages').insert({
    content,
    thread_id: currentThread.id,
    metadata: {
      project_id: context?.project_id,
      research_type: context?.type
    }
  })
}
```

### 6. Minimal API Endpoints

Only create APIs for specific actions:

```typescript
// VC CRM API - Trigger Suna workflows
app.post('/api/trigger-research', async (req, res) => {
  const { projectId, researchType } = req.body
  
  // Option 1: Direct database trigger
  await supabase.from('workflow_triggers').insert({
    workflow: 'vc_due_diligence',
    params: { project_id: projectId },
    requested_by: req.user.id
  })
  
  // Option 2: Suna webhook (if needed)
  // await fetch(`${SUNA_URL}/api/workflows/trigger`, {...})
})

// Suna Custom Tool - Access VC data
class VCDataTool {
  async getProjectData(projectId: string) {
    return await supabase
      .from('vc_crm.projects')
      .select('*, deals(*)')
      .eq('id', projectId)
  }
}
```

## Deployment Architecture

```yaml
# docker-compose.yml for local dev
services:
  # Shared services
  supabase-db:
    image: supabase/postgres
    environment:
      POSTGRES_DB: postgres
    volumes:
      - ./init-scripts:/docker-entrypoint-initdb.d
      
  supabase-auth:
    image: supabase/gotrue
    depends_on:
      - supabase-db
      
  # VC CRM
  vc-crm:
    build: ./vc-crm-frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
      NEXT_PUBLIC_SUNA_URL: http://localhost:3001
      
  # Suna Platform
  suna-frontend:
    build: ./suna/frontend
    ports:
      - "3001:3000"
    environment:
      NEXT_PUBLIC_VC_CRM_URL: http://localhost:3000
      
  suna-backend:
    build: ./suna/backend
    ports:
      - "8001:8000"
```

## Benefits of This Approach

1. **No Complex APIs**: Direct database access from both apps
2. **Unified Auth**: Single sign-on experience
3. **Real-time Sync**: Supabase subscriptions
4. **Independent Deploy**: Each app can be updated separately
5. **Shared Context**: Seamless data flow

## Migration Path

### Phase 1: Setup (Week 1)
- Deploy Suna with standard setup
- Configure shared Supabase
- Add VC schema to database

### Phase 2: Integration (Week 2-3)
- Add navigation links between apps
- Implement context passing
- Create basic data sync

### Phase 3: Enhancement (Week 4+)
- Custom Suna tools for VC
- Workflow automation
- Advanced analytics

## Example User Flow

1. **VC Partner** views deal in Pipeline (VC CRM)
2. Clicks "AI Research" → Opens Suna with context
3. **In Suna**: "Analyze this deal for Series A investment"
4. Suna performs research using all its tools
5. Research automatically linked to deal in VC CRM
6. **Back in VC CRM**: See research summary in deal view

This hybrid approach gives you Suna's powerful AI chat while maintaining your specialized VC interfaces!