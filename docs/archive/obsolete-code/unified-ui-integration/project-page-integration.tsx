// Complete Project Page with Native Redpill Chat Integration
// This shows how the final implementation looks

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'

// Import shared UI components (copied from Suna)
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Main Project Detail Page
export default function ProjectDetailPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<any>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMode, setChatMode] = useState<'slide' | 'inline' | 'fullscreen'>('slide')
  const [researchHistory, setResearchHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProject()
    loadResearchHistory()
  }, [projectId])

  async function loadProject() {
    const { data } = await supabase
      .from('vc_crm.projects')
      .select('*')
      .eq('id', projectId)
      .single()
    
    setProject(data)
    setLoading(false)
  }

  async function loadResearchHistory() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('metadata->>project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    setResearchHistory(data || [])
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 animate-pulse" />
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content - Adjusts based on chat mode */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        chatOpen && chatMode === 'inline' ? 'mr-[600px]' : ''
      )}>
        
        {/* Project Header */}
        <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex items-center justify-between h-20">
            <div className="flex items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                  <Badge variant={getStatusVariant(project.status)}>
                    {project.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{project.sector}</span>
                  <span>•</span>
                  <span>{project.round}</span>
                  <span>•</span>
                  <span>${project.valuation}M valuation</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status indicator for research */}
              {researchHistory.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>{researchHistory.length} research sessions</span>
                </div>
              )}

              {/* Main Redpill AI Button */}
              <Button
                onClick={() => setChatOpen(true)}
                size="lg"
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <BrainIcon className="w-5 h-5 mr-2" />
                Start AI Research
              </Button>
            </div>
          </div>
        </div>

        {/* Project Content */}
        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Project Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Project Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {project.description}
                  </p>
                </CardContent>
              </Card>

              {/* Research History */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>AI Research History</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChatOpen(true)}
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    New Research
                  </Button>
                </CardHeader>
                <CardContent>
                  {researchHistory.length > 0 ? (
                    <div className="space-y-4">
                      {researchHistory.slice(0, 3).map((research: any) => (
                        <div
                          key={research.id}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setChatOpen(true)
                            // Open specific research thread
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">
                              {research.metadata?.research_type || 'General Research'}
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              {new Date(research.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {research.content.substring(0, 150)}...
                          </p>
                        </div>
                      ))}
                      
                      {researchHistory.length > 3 && (
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={() => setChatOpen(true)}
                        >
                          View all {researchHistory.length} research sessions
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BrainIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium mb-2">No research yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start your first AI research session for this project
                      </p>
                      <Button
                        onClick={() => setChatOpen(true)}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      >
                        Begin Research
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Research Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Research</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <ResearchQuickAction
                      icon="🔍"
                      title="Due Diligence"
                      description="Comprehensive investment analysis"
                      onClick={() => startResearch('due_diligence')}
                    />
                    <ResearchQuickAction
                      icon="🎯"
                      title="Competitive Analysis"
                      description="Market position and competitors"
                      onClick={() => startResearch('competition')}
                    />
                    <ResearchQuickAction
                      icon="👥"
                      title="Team Research"
                      description="Founder and team backgrounds"
                      onClick={() => startResearch('team')}
                    />
                    <ResearchQuickAction
                      icon="⚠️"
                      title="Risk Assessment"
                      description="Investment risks and mitigation"
                      onClick={() => startResearch('risks')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Valuation</span>
                    <span className="text-sm">${project.valuation}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Round</span>
                    <span className="text-sm">{project.round}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Sector</span>
                    <span className="text-sm">{project.sector}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    No recent activity
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Chat - Fixed Right Side */}
      <AnimatePresence>
        {chatOpen && chatMode === 'inline' && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 w-[600px] h-screen bg-background border-l shadow-2xl z-50"
          >
            <RedpillChatPanel
              project={project}
              onClose={() => setChatOpen(false)}
              onModeChange={setChatMode}
              mode="inline"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over Chat */}
      <Sheet open={chatOpen && chatMode === 'slide'} onOpenChange={(open) => !open && setChatOpen(false)}>
        <SheetContent side="right" className="w-[600px] p-0">
          <RedpillChatPanel
            project={project}
            onClose={() => setChatOpen(false)}
            onModeChange={setChatMode}
            mode="slide"
          />
        </SheetContent>
      </Sheet>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {chatOpen && chatMode === 'fullscreen' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background z-50"
          >
            <RedpillChatPanel
              project={project}
              onClose={() => setChatOpen(false)}
              onModeChange={setChatMode}
              mode="fullscreen"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  function startResearch(type: string) {
    setChatOpen(true)
    // Auto-start research with specific prompt
    // This will be handled by the chat component
  }
}

// Research Quick Action Component
function ResearchQuickAction({ 
  icon, 
  title, 
  description, 
  onClick 
}: {
  icon: string
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <Button
      variant="outline"
      className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-muted/50"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="font-medium text-sm">{title}</span>
      </div>
      <p className="text-xs text-muted-foreground text-left">
        {description}
      </p>
    </Button>
  )
}

// Redpill Chat Panel Component (embedded Suna)
function RedpillChatPanel({ 
  project, 
  onClose, 
  onModeChange, 
  mode 
}: {
  project: any
  onClose: () => void
  onModeChange: (mode: 'slide' | 'inline' | 'fullscreen') => void
  mode: 'slide' | 'inline' | 'fullscreen'
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loading, setLoading] = useState(true)

  // Build Suna embed URL with full branding
  const embedUrl = `${process.env.NEXT_PUBLIC_SUNA_URL}/chat/embed?` + 
    new URLSearchParams({
      project_id: project.id,
      project_name: project.name,
      brand: 'redpill',
      hide_nav: 'true',
      hide_logo: 'true',
      theme: 'system'
    }).toString()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <div>
            <h3 className="font-semibold">Redpill AI Research</h3>
            <p className="text-sm text-muted-foreground">{project.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Selector */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={mode === 'slide' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onModeChange('slide')}
              className="h-7 px-2"
            >
              <PanelRightIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={mode === 'inline' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onModeChange('inline')}
              className="h-7 px-2"
            >
              <SplitIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={mode === 'fullscreen' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onModeChange('fullscreen')}
              className="h-7 px-2"
            >
              <MaximizeIcon className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Embedded Chat */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 animate-pulse" />
              <p className="text-sm text-muted-foreground">Initializing Redpill AI...</p>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={embedUrl}
          className="w-full h-full border-0 bg-background"
          onLoad={() => setLoading(false)}
          allow="clipboard-write"
        />
      </div>
    </div>
  )
}

// Utility Functions
function getStatusVariant(status: string) {
  switch (status) {
    case 'active': return 'default'
    case 'due_diligence': return 'secondary'
    case 'portfolio': return 'success'
    case 'passed': return 'destructive'
    default: return 'outline'
  }
}

// Icons (using same library as Suna)
const BrainIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
)

const PanelRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M9 11h.01M4 20V7a3 3 0 013-3h10a3 3 0 013 3v13H4z" />
  </svg>
)

const SplitIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h2m6-16h2a2 2 0 012 2v12a2 2 0 01-2 2h-2m-6-8h8" />
  </svg>
)

const MaximizeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
)