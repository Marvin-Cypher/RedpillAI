"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Users,
  Plus,
  Filter,
  Search,
  FileText,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { threePillarBridge, PortfolioProject, IntegratedWorkflow } from '@/lib/integrations/three-pillar-bridge'

interface PortfolioManagerProps {
  className?: string
}

export function PortfolioManager({ className }: PortfolioManagerProps) {
  const [projects, setProjects] = useState<PortfolioProject[]>([])
  const [workflows, setWorkflows] = useState<IntegratedWorkflow[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [pipeline, setPipeline] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null)
  const [activeTab, setActiveTab] = useState('projects')

  useEffect(() => {
    loadPortfolioData()
    setupEventListeners()
  }, [])

  const setupEventListeners = () => {
    threePillarBridge.on('workflow_started', (workflow) => {
      setWorkflows(prev => [...prev, workflow])
    })

    threePillarBridge.on('workflow_completed', (workflow) => {
      setWorkflows(prev => prev.map(w => w.id === workflow.id ? workflow : w))
    })

    threePillarBridge.on('project_created', (project) => {
      setProjects(prev => [...prev, project])
    })
  }

  const loadPortfolioData = async () => {
    setLoading(true)
    try {
      const [projectsData, analyticsData, pipelineData] = await Promise.all([
        threePillarBridge.getPortfolioProjects(),
        threePillarBridge.getPortfolioAnalytics(),
        threePillarBridge.getDealPipeline()
      ])

      setProjects(projectsData)
      setAnalytics(analyticsData)
      setPipeline(pipelineData)
      setWorkflows(threePillarBridge.getAllWorkflows())
    } catch (error) {
      console.error('Error loading portfolio data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startDueDiligence = async (project: PortfolioProject) => {
    const workflowId = await threePillarBridge.startDueDiligenceWorkflow(project.id, project.company_name)
    console.log(`Started due diligence workflow: ${workflowId}`)
  }

  const startInvestmentMemo = async (project: PortfolioProject) => {
    const workflowId = await threePillarBridge.startInvestmentMemoWorkflow(project.id)
    console.log(`Started investment memo workflow: ${workflowId}`)
  }

  const updateProjectStatus = async (projectId: string, status: string, dealStage?: string) => {
    const success = await threePillarBridge.updateProjectStatus(projectId, status, dealStage)
    if (success) {
      await loadPortfolioData()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pipeline': return 'bg-blue-100 text-blue-800'
      case 'diligence': return 'bg-yellow-100 text-yellow-800'
      case 'negotiation': return 'bg-orange-100 text-orange-800'
      case 'closed': return 'bg-green-100 text-green-800'
      case 'portfolio': return 'bg-purple-100 text-purple-800'
      case 'exited': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getWorkflowStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock
      case 'running': return TrendingUp
      case 'completed': return CheckCircle
      case 'failed': return AlertCircle
      default: return Clock
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Portfolio Management</h2>
          <p className="text-gray-600">Powered by OpenProject + AG-UI Workflows</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={loadPortfolioData} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold">{analytics.total_projects}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Investment</p>
                <p className="text-2xl font-bold">
                  ${(analytics.total_investment / 1000000).toFixed(1)}M
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Portfolio Value</p>
                <p className="text-2xl font-bold">
                  ${(analytics.total_valuation / 1000000).toFixed(1)}M
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold">
                  {workflows.filter(w => w.status === 'running').length}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          {/* Projects List */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Portfolio Projects</h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-1" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 mr-1" />
                  Search
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-lg">{project.company_name}</h4>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        <Badge variant="outline">
                          {project.deal_stage.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {project.sector && (
                          <span>Sector: {project.sector}</span>
                        )}
                        {project.lead_partner && (
                          <span>Lead: {project.lead_partner}</span>
                        )}
                        {project.investment_amount && (
                          <span>Investment: ${(project.investment_amount / 1000000).toFixed(1)}M</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          startDueDiligence(project)
                        }}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        DD
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          startInvestmentMemo(project)
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Memo
                      </Button>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          {/* Deal Pipeline */}
          {pipeline && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {Object.entries(pipeline.pipeline).map(([stage, deals]: [string, any[]]) => (
                <Card key={stage} className="p-4">
                  <h3 className="font-semibold mb-3 capitalize">
                    {stage.replace('_', ' ')} ({deals.length})
                  </h3>
                  <div className="space-y-2">
                    {deals.map((deal) => (
                      <div key={deal.id} className="border rounded p-3 text-sm">
                        <div className="font-medium">{deal.company_name}</div>
                        <div className="text-gray-500">{deal.sector}</div>
                        <div className="text-gray-400 text-xs">{deal.lead_partner}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          {/* AI Workflows */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Workflows</h3>
            <div className="space-y-3">
              {workflows.map((workflow) => {
                const StatusIcon = getWorkflowStatusIcon(workflow.status)
                const project = projects.find(p => p.id === workflow.project_id)
                
                return (
                  <div key={workflow.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`w-5 h-5 ${
                          workflow.status === 'completed' ? 'text-green-500' :
                          workflow.status === 'running' ? 'text-blue-500' :
                          workflow.status === 'failed' ? 'text-red-500' :
                          'text-gray-500'
                        }`} />
                        <span className="font-medium">
                          {workflow.workflow_type.replace('_', ' ')}
                        </span>
                        <Badge variant="outline">{workflow.status}</Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {workflow.created_at.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      Company: {project?.company_name || 'Unknown'}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Agents: {workflow.agents_involved.join(', ')}</span>
                      <span>Results: {workflow.results.length}</span>
                      <span>Sources: {workflow.data_sources.join(', ')}</span>
                    </div>
                  </div>
                )
              })}
              
              {workflows.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No workflows started yet. Click "DD" or "Memo" on a project to begin.
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Portfolio Analytics */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">By Status</h3>
                <div className="space-y-2">
                  {Object.entries(analytics.by_status).map(([status, count]: [string, any]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="capitalize">{status.replace('_', ' ')}</span>
                      <Badge className={getStatusColor(status)}>{count}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">By Sector</h3>
                <div className="space-y-2">
                  {Object.entries(analytics.by_sector).map(([sector, count]: [string, any]) => (
                    <div key={sector} className="flex justify-between items-center">
                      <span>{sector}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">By Deal Stage</h3>
                <div className="space-y-2">
                  {Object.entries(analytics.by_stage).map(([stage, count]: [string, any]) => (
                    <div key={stage} className="flex justify-between items-center">
                      <span className="capitalize">{stage.replace('_', ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Financial Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Investment:</span>
                    <span className="font-semibold">
                      ${(analytics.total_investment / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Valuation:</span>
                    <span className="font-semibold">
                      ${(analytics.total_valuation / 1000000).toFixed(1)}M
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Multiple:</span>
                    <span className="font-semibold text-green-600">
                      {(analytics.total_valuation / analytics.total_investment).toFixed(2)}x
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}