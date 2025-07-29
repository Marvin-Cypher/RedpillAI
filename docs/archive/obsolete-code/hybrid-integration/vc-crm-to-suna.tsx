// VC CRM Integration with Suna
// This shows how to seamlessly connect both apps

import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'

// Shared Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Configuration
const SUNA_URL = process.env.NEXT_PUBLIC_SUNA_URL || 'http://localhost:3001'

// 1. Project Card with Suna Integration
export function ProjectCard({ project }: { project: any }) {
  const [latestResearch, setLatestResearch] = useState<any>(null)
  const [researchCount, setResearchCount] = useState(0)

  // Listen for research updates from Suna
  useEffect(() => {
    // Get existing research
    loadProjectResearch()

    // Subscribe to new research
    const subscription = supabase
      .channel(`project-${project.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `metadata->>project_id=eq.${project.id}`
      }, handleResearchUpdate)
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [project.id])

  async function loadProjectResearch() {
    // Query Suna's messages table for project research
    const { data, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('metadata->>project_id', project.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (data?.[0]) {
      setLatestResearch(data[0])
    }
    setResearchCount(count || 0)
  }

  function handleResearchUpdate(payload: any) {
    if (payload.eventType === 'INSERT') {
      setLatestResearch(payload.new)
      setResearchCount(prev => prev + 1)
    }
  }

  // Open Suna with project context
  function openSunaResearch() {
    const context = {
      source: 'vc_crm',
      project_id: project.id,
      project_name: project.name,
      project_description: project.description,
      current_status: project.status,
      metadata: {
        round: project.round,
        valuation: project.valuation,
        sector: project.sector
      }
    }

    // Create or get Suna thread for this project
    if (project.suna_thread_id) {
      // Open existing thread
      window.open(`${SUNA_URL}/chat/${project.suna_thread_id}`, '_blank')
    } else {
      // Create new thread with context
      const contextParam = encodeURIComponent(JSON.stringify(context))
      window.open(`${SUNA_URL}/chat/new?context=${contextParam}`, '_blank')
    }
  }

  // Quick research actions
  async function quickResearch(type: string) {
    const prompts = {
      due_diligence: `Conduct comprehensive due diligence on ${project.name}`,
      competitors: `Analyze main competitors of ${project.name} in ${project.sector}`,
      team: `Research the founding team of ${project.name}`,
      market: `Analyze market size and trends for ${project.sector}`
    }

    const context = {
      project_id: project.id,
      project_name: project.name,
      research_type: type,
      auto_prompt: prompts[type]
    }

    const contextParam = encodeURIComponent(JSON.stringify(context))
    window.open(`${SUNA_URL}/chat/new?context=${contextParam}&auto_send=true`, '_blank')
  }

  return (
    <div className="project-card border rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{project.name}</h3>
          <p className="text-gray-600">{project.sector} • {project.round}</p>
        </div>
        
        <div className="flex gap-2">
          {/* Main Suna button */}
          <button
            onClick={openSunaResearch}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <AIIcon />
            Open in Suna
            {researchCount > 0 && (
              <span className="bg-purple-800 px-2 py-1 rounded text-xs">
                {researchCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Quick research actions */}
      <div className="border-t pt-4">
        <p className="text-sm text-gray-600 mb-2">Quick Research:</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => quickResearch('due_diligence')}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            📊 Due Diligence
          </button>
          <button
            onClick={() => quickResearch('competitors')}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            🎯 Competitors
          </button>
          <button
            onClick={() => quickResearch('team')}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            👥 Team Research
          </button>
          <button
            onClick={() => quickResearch('market')}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
          >
            📈 Market Analysis
          </button>
        </div>
      </div>

      {/* Latest research preview */}
      {latestResearch && (
        <div className="mt-4 p-3 bg-purple-50 rounded">
          <p className="text-sm font-medium text-purple-900">Latest Research:</p>
          <p className="text-sm text-purple-700 truncate">
            {latestResearch.content.substring(0, 100)}...
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {new Date(latestResearch.created_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  )
}

// 2. Deal Pipeline with Suna Integration
export function DealPipeline() {
  const [needsResearch, setNeedsResearch] = useState<string[]>([])

  // Check which deals need research
  useEffect(() => {
    checkResearchStatus()
  }, [])

  async function checkResearchStatus() {
    // Find projects without recent research
    const { data: projects } = await supabase
      .from('vc_crm.projects')
      .select('id, name, updated_at')
      .eq('status', 'due_diligence')

    if (projects) {
      const projectsNeedingResearch = []
      
      for (const project of projects) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('metadata->>project_id', project.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

        if (!count || count === 0) {
          projectsNeedingResearch.push(project.id)
        }
      }
      
      setNeedsResearch(projectsNeedingResearch)
    }
  }

  // Bulk research trigger
  async function triggerBulkResearch() {
    const projects = needsResearch.slice(0, 5) // Limit to 5 at a time
    
    // Create Suna workflow trigger
    await supabase.from('workflow_triggers').insert({
      workflow_name: 'bulk_due_diligence',
      params: {
        project_ids: projects,
        research_depth: 'comprehensive'
      },
      triggered_by: (await supabase.auth.getUser()).data.user?.id
    })

    // Open Suna to monitor progress
    window.open(`${SUNA_URL}/workflows/active`, '_blank')
  }

  return (
    <div className="deal-pipeline">
      {needsResearch.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 rounded-lg flex justify-between items-center">
          <div>
            <p className="font-medium text-yellow-900">
              {needsResearch.length} deals need research updates
            </p>
            <p className="text-sm text-yellow-700">
              No research in the past 7 days
            </p>
          </div>
          <button
            onClick={triggerBulkResearch}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Run Bulk Research in Suna
          </button>
        </div>
      )}
      
      {/* Rest of pipeline UI */}
    </div>
  )
}

// 3. Unified Navigation Bar
export function UnifiedNavBar({ currentApp }: { currentApp: 'vc_crm' | 'suna' }) {
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    // Get user from shared auth
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })

    // Subscribe to cross-app notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user?.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          {/* App Switcher */}
          <div className="flex items-center gap-2">
            <a
              href={process.env.NEXT_PUBLIC_VC_CRM_URL}
              className={`px-3 py-1 rounded ${
                currentApp === 'vc_crm' ? 'bg-gray-700' : 'hover:bg-gray-800'
              }`}
            >
              VC CRM
            </a>
            <a
              href={SUNA_URL}
              className={`px-3 py-1 rounded ${
                currentApp === 'suna' ? 'bg-gray-700' : 'hover:bg-gray-800'
              }`}
            >
              Suna AI
            </a>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4">
            <button className="hover:text-gray-300">
              New Deal
            </button>
            <button 
              onClick={() => window.open(`${SUNA_URL}/chat/new`, '_blank')}
              className="hover:text-gray-300"
            >
              New Research
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <BellIcon />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <span>{user?.email}</span>
            <button onClick={() => supabase.auth.signOut()}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

// 4. Helper: Embed Suna Chat in Modal
export function SunaResearchModal({ 
  project, 
  isOpen, 
  onClose 
}: { 
  project: any
  isOpen: boolean
  onClose: () => void 
}) {
  if (!isOpen) return null

  const iframeSrc = `${SUNA_URL}/chat/embed?project_id=${project.id}&project_name=${encodeURIComponent(project.name)}`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[90%] h-[90%] max-w-6xl flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">AI Research: {project.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <iframe
          src={iframeSrc}
          className="flex-1 w-full"
          allow="clipboard-write"
        />
      </div>
    </div>
  )
}