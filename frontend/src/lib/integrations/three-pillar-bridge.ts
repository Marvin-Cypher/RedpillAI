// Three-Pillar Integration Bridge
// Connects AG-UI Agents + OpenBB Financial Data + OpenProject Portfolio Management

import { redpillAgents } from '@/lib/agents/ag-ui-client'
import { agentOpenBBBridge } from './agent-openbb-bridge'
import { EventEmitter } from 'events'

export interface PortfolioProject {
  id: string
  company_name: string
  status: string
  deal_stage: string
  description: string
  sector?: string
  lead_partner?: string
  investment_amount?: number
  valuation?: number
  ownership_percentage?: number
  created_at: string
  updated_at: string
}

export interface ProjectDocument {
  id: string
  project_id: string
  title: string
  content: string
  document_type: string
  created_by: string
  created_at: string
}

export interface IntegratedWorkflow {
  id: string
  project_id: string
  workflow_type: 'due_diligence' | 'market_analysis' | 'risk_assessment' | 'investment_memo'
  status: 'pending' | 'running' | 'completed' | 'failed'
  agents_involved: string[]
  data_sources: string[]
  results: any[]
  created_at: Date
}

export class ThreePillarBridge extends EventEmitter {
  private portfolioApiUrl: string
  private workflows: Map<string, IntegratedWorkflow> = new Map()

  constructor(portfolioApiUrl: string = 'http://localhost:8000/api/v1/portfolio') {
    super()
    this.portfolioApiUrl = portfolioApiUrl
    this.setupIntegrations()
  }

  private setupIntegrations() {
    // Listen for agent completions and save to portfolio
    redpillAgents.on('research_result', this.handleResearchComplete.bind(this))
    redpillAgents.on('market_update', this.handleMarketAnalysisComplete.bind(this))
    redpillAgents.on('risk_alert', this.handleRiskAssessmentComplete.bind(this))

    // Listen for portfolio updates and trigger relevant agents
    this.on('project_created', this.handleNewProject.bind(this))
    this.on('project_status_changed', this.handleProjectStatusChange.bind(this))
  }

  // Portfolio Project Management
  async createPortfolioProject(projectData: {
    company_name: string
    description?: string
    sector?: string
    lead_partner?: string
    investment_amount?: number
    valuation?: number
  }): Promise<PortfolioProject | null> {
    try {
      const response = await fetch(`${this.portfolioApiUrl}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(projectData)
      })

      if (response.ok) {
        const project = await response.json()
        this.emit('project_created', project)
        return project
      }
      return null
    } catch (error) {
      console.error('Error creating portfolio project:', error)
      return null
    }
  }

  async getPortfolioProjects(filters?: { status?: string; sector?: string }): Promise<PortfolioProject[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.sector) params.append('sector', filters.sector)

      const response = await fetch(`${this.portfolioApiUrl}/projects?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        return await response.json()
      }
      return []
    } catch (error) {
      console.error('Error fetching portfolio projects:', error)
      return []
    }
  }

  async updateProjectStatus(projectId: string, status: string, dealStage?: string): Promise<boolean> {
    try {
      const updateData: any = { status }
      if (dealStage) updateData.deal_stage = dealStage

      const response = await fetch(`${this.portfolioApiUrl}/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        this.emit('project_status_changed', { projectId, status, dealStage })
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating project status:', error)
      return false
    }
  }

  // Document Management
  async addProjectMemo(projectId: string, content: string, memoType: string = 'investment_memo'): Promise<boolean> {
    try {
      const response = await fetch(`${this.portfolioApiUrl}/projects/${projectId}/memo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ content, memo_type: memoType })
      })

      return response.ok
    } catch (error) {
      console.error('Error adding project memo:', error)
      return false
    }
  }

  async getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    try {
      const response = await fetch(`${this.portfolioApiUrl}/projects/${projectId}/documents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        return await response.json()
      }
      return []
    } catch (error) {
      console.error('Error fetching project documents:', error)
      return []
    }
  }

  // Integrated Workflows
  async startDueDiligenceWorkflow(projectId: string, companyName: string): Promise<string> {
    const workflowId = `dd_${projectId}_${Date.now()}`
    
    const workflow: IntegratedWorkflow = {
      id: workflowId,
      project_id: projectId,
      workflow_type: 'due_diligence',
      status: 'running',
      agents_involved: ['research-agent', 'market-agent', 'risk-agent'],
      data_sources: ['openbb', 'openproject'],
      results: [],
      created_at: new Date()
    }

    this.workflows.set(workflowId, workflow)

    try {
      // 1. Start research agent for company background
      await redpillAgents.startResearch(
        `Conduct due diligence research on ${companyName}`,
        { project_id: projectId, workflow_id: workflowId, company_name: companyName }
      )

      // 2. Request market data for sector analysis
      await agentOpenBBBridge.requestResearch('market-agent', `Market analysis for ${companyName}`)

      // 3. Start risk assessment if we have investment data
      const projects = await this.getPortfolioProjects()
      const project = projects.find(p => p.id === projectId)
      
      if (project && project.investment_amount) {
        await agentOpenBBBridge.requestRiskAnalysis('risk-agent', {
          assets: ['BTC', 'ETH'], // Default or derived from sector
          allocation: [0.6, 0.4]
        })
      }

      this.emit('workflow_started', workflow)
      return workflowId

    } catch (error) {
      console.error('Error starting due diligence workflow:', error)
      workflow.status = 'failed'
      this.workflows.set(workflowId, workflow)
      return workflowId
    }
  }

  async startInvestmentMemoWorkflow(projectId: string): Promise<string> {
    const workflowId = `memo_${projectId}_${Date.now()}`
    
    const workflow: IntegratedWorkflow = {
      id: workflowId,
      project_id: projectId,
      workflow_type: 'investment_memo',
      status: 'running',
      agents_involved: ['research-agent'],
      data_sources: ['openproject', 'openbb'],
      results: [],
      created_at: new Date()
    }

    this.workflows.set(workflowId, workflow)

    try {
      // Get existing project documents for context
      const documents = await this.getProjectDocuments(projectId)
      const projects = await this.getPortfolioProjects()
      const project = projects.find(p => p.id === projectId)

      if (project) {
        // Start memo generation with full context
        await redpillAgents.startResearch(
          `Generate investment memo for ${project.company_name}`,
          { 
            project_id: projectId, 
            workflow_id: workflowId,
            project_data: project,
            existing_documents: documents
          }
        )

        this.emit('workflow_started', workflow)
      }

      return workflowId

    } catch (error) {
      console.error('Error starting investment memo workflow:', error)
      workflow.status = 'failed'
      this.workflows.set(workflowId, workflow)
      return workflowId
    }
  }

  // Event Handlers
  private async handleResearchComplete(result: any) {
    try {
      const workflowId = result.context?.workflow_id
      const projectId = result.context?.project_id

      if (workflowId && projectId) {
        const workflow = this.workflows.get(workflowId)
        if (workflow) {
          workflow.results.push({
            type: 'research',
            data: result,
            timestamp: new Date()
          })

          // Save research results as project document
          if (result.summary) {
            await this.addProjectMemo(projectId, result.summary, 'research_summary')
          }

          // Check if workflow is complete
          await this.checkWorkflowCompletion(workflowId)
        }
      }
    } catch (error) {
      console.error('Error handling research completion:', error)
    }
  }

  private async handleMarketAnalysisComplete(result: any) {
    try {
      const workflowId = result.context?.workflow_id
      const projectId = result.context?.project_id

      if (workflowId && projectId) {
        const workflow = this.workflows.get(workflowId)
        if (workflow) {
          workflow.results.push({
            type: 'market_analysis',
            data: result,
            timestamp: new Date()
          })

          // Save market analysis
          if (result.analysis) {
            await this.addProjectMemo(projectId, JSON.stringify(result.analysis, null, 2), 'market_analysis')
          }

          await this.checkWorkflowCompletion(workflowId)
        }
      }
    } catch (error) {
      console.error('Error handling market analysis completion:', error)
    }
  }

  private async handleRiskAssessmentComplete(result: any) {
    try {
      const workflowId = result.context?.workflow_id
      const projectId = result.context?.project_id

      if (workflowId && projectId) {
        const workflow = this.workflows.get(workflowId)
        if (workflow) {
          workflow.results.push({
            type: 'risk_assessment',
            data: result,
            timestamp: new Date()
          })

          // Save risk assessment
          if (result.risk_metrics) {
            await this.addProjectMemo(projectId, JSON.stringify(result.risk_metrics, null, 2), 'risk_assessment')
          }

          await this.checkWorkflowCompletion(workflowId)
        }
      }
    } catch (error) {
      console.error('Error handling risk assessment completion:', error)
    }
  }

  private async handleNewProject(project: PortfolioProject) {
    console.log(`🆕 New project created: ${project.company_name}`)
    
    // Automatically trigger initial market research for new projects
    if (project.sector) {
      await agentOpenBBBridge.requestMarketData('market-agent', ['BTC', 'ETH'], 'price')
    }
  }

  private async handleProjectStatusChange(change: { projectId: string; status: string; dealStage?: string }) {
    console.log(`📊 Project status changed: ${change.projectId} -> ${change.status}`)
    
    // Trigger appropriate workflows based on status changes
    if (change.dealStage === 'due_diligence') {
      const projects = await this.getPortfolioProjects()
      const project = projects.find(p => p.id === change.projectId)
      if (project) {
        await this.startDueDiligenceWorkflow(change.projectId, project.company_name)
      }
    }
  }

  private async checkWorkflowCompletion(workflowId: string) {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) return

    const expectedResults = workflow.agents_involved.length
    const completedResults = workflow.results.length

    if (completedResults >= expectedResults) {
      workflow.status = 'completed'
      this.workflows.set(workflowId, workflow)
      
      this.emit('workflow_completed', workflow)
      
      // Generate final summary document
      if (workflow.workflow_type === 'investment_memo') {
        await this.generateFinalInvestmentMemo(workflow)
      }
    }
  }

  private async generateFinalInvestmentMemo(workflow: IntegratedWorkflow) {
    try {
      const allResults = workflow.results.map(r => r.data).join('\n\n')
      const finalMemo = `
# Investment Memo - ${new Date().toISOString().split('T')[0]}

## Executive Summary
Generated from comprehensive AI analysis including research, market data, and risk assessment.

## Research Summary
${workflow.results.find(r => r.type === 'research')?.data?.summary || 'No research data available'}

## Market Analysis  
${workflow.results.find(r => r.type === 'market_analysis')?.data?.analysis || 'No market analysis available'}

## Risk Assessment
${workflow.results.find(r => r.type === 'risk_assessment')?.data?.risk_metrics || 'No risk assessment available'}

## Recommendation
[AI-generated recommendation based on analysis]

---
*Generated by RedpillAI Three-Pillar System*
*Workflow ID: ${workflow.id}*
*Generated: ${new Date().toISOString()}*
      `

      await this.addProjectMemo(workflow.project_id, finalMemo, 'final_investment_memo')
      
    } catch (error) {
      console.error('Error generating final investment memo:', error)
    }
  }

  // Public Methods
  getWorkflowStatus(workflowId: string): IntegratedWorkflow | undefined {
    return this.workflows.get(workflowId)
  }

  getAllWorkflows(): IntegratedWorkflow[] {
    return Array.from(this.workflows.values())
  }

  async getPortfolioAnalytics(): Promise<any> {
    try {
      const response = await fetch(`${this.portfolioApiUrl}/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        return await response.json()
      }
      return null
    } catch (error) {
      console.error('Error fetching portfolio analytics:', error)
      return null
    }
  }

  async getDealPipeline(): Promise<any> {
    try {
      const response = await fetch(`${this.portfolioApiUrl}/pipeline`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        return await response.json()
      }
      return null
    } catch (error) {
      console.error('Error fetching deal pipeline:', error)
      return null
    }
  }
}

// Export singleton instance
export const threePillarBridge = new ThreePillarBridge()

// Initialize the bridge
export const initializeThreePillarBridge = async (): Promise<void> => {
  console.log('🏗️ Initializing Three-Pillar Bridge...')
  
  // Setup event logging
  threePillarBridge.on('workflow_started', (workflow) => {
    console.log(`🚀 Workflow started: ${workflow.workflow_type} for project ${workflow.project_id}`)
  })
  
  threePillarBridge.on('workflow_completed', (workflow) => {
    console.log(`✅ Workflow completed: ${workflow.workflow_type} with ${workflow.results.length} results`)
  })
  
  threePillarBridge.on('project_created', (project) => {
    console.log(`📋 New portfolio project: ${project.company_name}`)
  })

  console.log('🎯 Three-Pillar Bridge initialized: AG-UI + OpenBB + OpenProject')
}