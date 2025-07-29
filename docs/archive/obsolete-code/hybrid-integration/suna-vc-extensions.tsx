// Suna Side: VC Extensions
// Add these to Suna to integrate with VC CRM

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const VC_CRM_URL = process.env.NEXT_PUBLIC_VC_CRM_URL || 'http://localhost:3000'

// 1. Modified Suna Chat Page with VC Context
export function SunaChatPage({ searchParams }) {
  const [context, setContext] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [initialPrompt, setInitialPrompt] = useState('')

  useEffect(() => {
    // Parse context from VC CRM
    if (searchParams.context) {
      try {
        const ctx = JSON.parse(decodeURIComponent(searchParams.context))
        setContext(ctx)
        
        // Load project data if provided
        if (ctx.project_id) {
          loadProject(ctx.project_id)
        }

        // Set auto prompt if provided
        if (ctx.auto_prompt) {
          setInitialPrompt(ctx.auto_prompt)
          
          // Auto-send if requested
          if (searchParams.auto_send === 'true') {
            setTimeout(() => {
              sendMessage(ctx.auto_prompt)
            }, 500)
          }
        }
      } catch (e) {
        console.error('Failed to parse context:', e)
      }
    }
  }, [searchParams])

  async function loadProject(projectId: string) {
    const { data } = await supabase
      .from('vc_crm.projects')
      .select('*')
      .eq('id', projectId)
      .single()
    
    if (data) {
      setProject(data)
      
      // Update thread association if new
      if (!data.suna_thread_id && currentThread?.id) {
        await supabase
          .from('vc_crm.projects')
          .update({ suna_thread_id: currentThread.id })
          .eq('id', projectId)
      }
    }
  }

  async function sendMessage(content: string) {
    // Include project context in metadata
    const metadata = context ? {
      source: 'vc_crm',
      project_id: context.project_id,
      project_name: context.project_name,
      research_type: context.research_type
    } : {}

    await sunaChat.sendMessage(content, { metadata })
  }

  return (
    <div className="suna-chat-page">
      {/* VC Context Bar */}
      {project && (
        <div className="bg-purple-50 border-b border-purple-200 p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-purple-900">
                Researching: {project.name}
              </h3>
              <p className="text-sm text-purple-700">
                {project.sector} • {project.round} • ${project.valuation}M
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(`${VC_CRM_URL}/projects/${project.id}`, '_blank')}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                View in VC CRM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick VC Prompts */}
      {project && (
        <div className="max-w-4xl mx-auto mt-4 mb-2">
          <div className="flex gap-2 flex-wrap">
            <QuickPromptButton
              prompt={`What are the key risks investing in ${project.name}?`}
              label="🚨 Risk Analysis"
            />
            <QuickPromptButton
              prompt={`Compare ${project.name} with top 3 competitors`}
              label="🎯 Competitive Analysis"
            />
            <QuickPromptButton
              prompt={`Analyze ${project.name}'s business model and unit economics`}
              label="💰 Business Model"
            />
            <QuickPromptButton
              prompt={`Research the founding team of ${project.name}`}
              label="👥 Team Deep Dive"
            />
          </div>
        </div>
      )}

      {/* Regular Suna Chat Interface */}
      <SunaChat 
        initialPrompt={initialPrompt}
        onMessageSent={sendMessage}
        customTools={['vc_deal_analyzer', 'portfolio_monitor']}
      />
    </div>
  )
}

// 2. VC Dashboard Widget for Suna Home
export function VCDashboardWidget() {
  const [stats, setStats] = useState({
    activeDeals: 0,
    portfolioCompanies: 0,
    recentResearch: 0,
    pendingTasks: 0
  })

  useEffect(() => {
    loadVCStats()
  }, [])

  async function loadVCStats() {
    // Load stats from VC CRM tables
    const [deals, portfolio, research] = await Promise.all([
      supabase.from('vc_crm.projects').select('*', { count: 'exact' }).eq('status', 'active'),
      supabase.from('vc_crm.projects').select('*', { count: 'exact' }).eq('status', 'portfolio'),
      supabase.from('messages').select('*', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .not('metadata->>project_id', 'is', null)
    ])

    setStats({
      activeDeals: deals.count || 0,
      portfolioCompanies: portfolio.count || 0,
      recentResearch: research.count || 0,
      pendingTasks: 0 // Would come from workflow system
    })
  }

  return (
    <div className="vc-dashboard-widget p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">VC Operations</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.activeDeals}</div>
          <div className="text-sm text-gray-600">Active Deals</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.portfolioCompanies}</div>
          <div className="text-sm text-gray-600">Portfolio</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.recentResearch}</div>
          <div className="text-sm text-gray-600">Research (24h)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.pendingTasks}</div>
          <div className="text-sm text-gray-600">Pending Tasks</div>
        </div>
      </div>

      <div className="space-y-2">
        <a
          href={`${VC_CRM_URL}/pipeline`}
          className="block w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-center"
        >
          Open Deal Pipeline
        </a>
        <button
          onClick={() => window.location.href = '/chat/new?preset=vc_portfolio_update'}
          className="w-full px-4 py-2 border border-purple-600 text-purple-600 rounded hover:bg-purple-50"
        >
          Generate Portfolio Update
        </button>
      </div>
    </div>
  )
}

// 3. Custom VC Tool Registration
export const vcTools = {
  vc_deal_analyzer: {
    name: 'VC Deal Analyzer',
    description: 'Analyze investment opportunities',
    parameters: {
      company_name: { type: 'string', required: true },
      sector: { type: 'string' },
      stage: { type: 'string' }
    },
    execute: async (params) => {
      // Implementation would call various Suna tools
      const research = await Promise.all([
        sunaTools.web_search({ query: `${params.company_name} funding news` }),
        sunaTools.linkedin_scraper({ query: `${params.company_name} founders` }),
        sunaTools.web_search({ query: `${params.sector} market size trends` })
      ])
      
      return {
        company: params.company_name,
        research_summary: 'Analysis based on web research...',
        recommendation: 'Investment recommendation...'
      }
    }
  },
  
  portfolio_monitor: {
    name: 'Portfolio Monitor',
    description: 'Monitor portfolio company updates',
    parameters: {
      company_ids: { type: 'array' },
      timeframe: { type: 'string', default: 'week' }
    },
    execute: async (params) => {
      const updates = []
      
      for (const companyId of params.company_ids) {
        const company = await supabase
          .from('vc_crm.projects')
          .select('*')
          .eq('id', companyId)
          .single()
        
        if (company.data) {
          const news = await sunaTools.web_search({
            query: `${company.data.name} news ${params.timeframe}`
          })
          
          updates.push({
            company: company.data.name,
            updates: news.results
          })
        }
      }
      
      return { portfolio_updates: updates }
    }
  }
}

// 4. VC-Specific Workflow Templates
export const vcWorkflows = {
  weekly_portfolio_review: {
    name: 'Weekly Portfolio Review',
    schedule: 'every Monday 9am',
    steps: [
      {
        tool: 'portfolio_monitor',
        params: { timeframe: 'week' }
      },
      {
        tool: 'ai_chat',
        prompt: 'Summarize key portfolio updates and flag any concerns'
      },
      {
        tool: 'document_create',
        template: 'portfolio_update.md'
      },
      {
        tool: 'email_send',
        to: '{{vc_partners_list}}'
      }
    ]
  },
  
  new_deal_analysis: {
    name: 'New Deal Analysis',
    trigger: 'manual',
    steps: [
      {
        tool: 'vc_deal_analyzer',
        params: { 
          company_name: '{{company}}',
          sector: '{{sector}}'
        }
      },
      {
        tool: 'web_search',
        query: '{{company}} competitors analysis'
      },
      {
        tool: 'document_create',
        template: 'investment_memo.md'
      }
    ]
  }
}

// 5. Embed Mode for VC CRM
export function SunaEmbedChat({ projectId, projectName }) {
  // Minimal UI for embedding in VC CRM
  return (
    <div className="suna-embed h-full">
      <div className="p-2 bg-gray-50 border-b text-sm">
        Researching: {projectName}
      </div>
      <SunaChat
        minimal={true}
        metadata={{ project_id: projectId }}
        hideNavigation={true}
      />
    </div>
  )
}

// Helper Components
function QuickPromptButton({ prompt, label, onClick }) {
  return (
    <button
      onClick={() => onClick?.(prompt)}
      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
    >
      {label}
    </button>
  )
}