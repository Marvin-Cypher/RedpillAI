// VC Assistant using Suna AI Backend
// This is a drop-in replacement for our current vc-assistant.ts

import { SunaClient, createSunaClient } from './suna-client'
import { MockSunaClient } from './suna-mock'
import { Project } from '@/lib/types/project'
import { MarketData } from '@/lib/services/market-service'

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning_content?: string
  thought_process?: Array<{
    id: string
    type: string
    title: string
    content: string
    status: string
    reasoning?: string
    timestamp: string
  }>
}

export class VCAssistantSuna {
  private sunaClient: SunaClient | MockSunaClient
  private threadCache: Map<string, string> = new Map()

  constructor() {
    // Use mock client for testing, real client when fully configured
    const useMock = process.env.NEXT_PUBLIC_USE_SUNA_MOCK === 'true' || 
                   !process.env.NEXT_PUBLIC_SUNA_API_URL

    if (useMock) {
      console.log('🎭 Using Mock Suna Client for testing')
      this.sunaClient = new MockSunaClient()
    } else {
      console.log('🚀 Using Real Suna Client')
      this.sunaClient = createSunaClient()
    }
  }

  async chat(
    messages: Message[],
    currentProject?: Project | null,
    allProjects?: Project[],
    marketData?: MarketData | null,
    onStepUpdate?: (step: any) => void
  ): Promise<Message> {
    try {
      // Get or create thread for this project
      const threadId = await this.getOrCreateThread(currentProject)

      // Build context from current state
      const context = this.buildContext(currentProject, allProjects, marketData)
      
      // Get the latest user message
      const userMessage = messages[messages.length - 1].content

      // Detect query type and route accordingly
      if (this.isDeepResearchQuery(userMessage)) {
        return await this.handleDeepResearch(threadId, userMessage, context, onStepUpdate)
      } else if (this.isProjectAnalysisQuery(userMessage)) {
        return await this.handleProjectAnalysis(threadId, userMessage, currentProject, onStepUpdate)
      } else {
        return await this.handleGeneralQuery(threadId, userMessage, context)
      }

    } catch (error) {
      console.error('Suna VC Assistant error:', error)
      return {
        role: 'assistant',
        content: 'I apologize, but I encountered an error connecting to the AI service. Please ensure Suna is properly configured and running.'
      }
    }
  }

  private async getOrCreateThread(project?: Project | null): Promise<string> {
    const cacheKey = project?.id || 'general'
    
    if (this.threadCache.has(cacheKey)) {
      return this.threadCache.get(cacheKey)!
    }

    const thread = await this.sunaClient.createThread({
      type: 'vc_assistant',
      project: project ? {
        id: project.id,
        name: project.name,
        description: project.description
      } : undefined
    })

    this.threadCache.set(cacheKey, thread.id)
    return thread.id
  }

  private buildContext(
    currentProject?: Project | null,
    allProjects?: Project[],
    marketData?: MarketData | null
  ): string {
    let context = 'You are RedPill AI, a specialized venture capital assistant.\n\n'

    if (currentProject) {
      context += `Current Project: ${currentProject.name}\n`
      context += `Description: ${currentProject.description}\n`
      context += `Stage: ${currentProject.round || 'Unknown'}\n`
      context += `Status: ${currentProject.status}\n\n`
    }

    if (allProjects && allProjects.length > 0) {
      context += `Portfolio Overview: ${allProjects.length} projects\n`
      const byStatus = allProjects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      Object.entries(byStatus).forEach(([status, count]) => {
        context += `- ${status}: ${count} projects\n`
      })
      context += '\n'
    }

    if (marketData) {
      context += 'Market Conditions:\n'
      context += `- BTC: $${marketData.btc_price?.toLocaleString() || 'N/A'}\n`
      context += `- ETH: $${marketData.eth_price?.toLocaleString() || 'N/A'}\n`
      context += `- Total Crypto Market Cap: $${marketData.total_market_cap?.toLocaleString() || 'N/A'}\n\n`
    }

    return context
  }

  private async handleDeepResearch(
    threadId: string,
    query: string,
    context: string,
    onStepUpdate?: (step: any) => void
  ): Promise<Message> {
    // Notify UI about research starting
    onStepUpdate?.({
      type: 'reasoning',
      title: 'Initiating Deep Research',
      content: 'Activating Suna\'s advanced research capabilities...',
      status: 'active',
      timestamp: new Date().toISOString()
    })

    // Use Suna's research capabilities
    const research = await this.sunaClient.conductResearch(query, context)

    // Build thought process from research
    const thoughtSteps = [
      {
        id: '1',
        type: 'search',
        title: 'Web Research',
        content: `Searched ${research.sources.length} sources`,
        status: 'complete',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'analysis',
        title: 'Information Analysis',
        content: research.findings.join('\n'),
        status: 'complete',
        timestamp: new Date().toISOString()
      },
      {
        id: '3',
        type: 'synthesis',
        title: 'Report Generation',
        content: 'Comprehensive analysis complete',
        status: 'complete',
        timestamp: new Date().toISOString()
      }
    ]

    return {
      role: 'assistant',
      content: research.summary,
      thought_process: thoughtSteps,
      reasoning_content: `Research confidence: ${Math.round(research.confidence * 100)}%\n\nSources analyzed: ${research.sources.length}`
    }
  }

  private async handleProjectAnalysis(
    threadId: string,
    query: string,
    project?: Project | null,
    onStepUpdate?: (step: any) => void
  ): Promise<Message> {
    if (!project) {
      return {
        role: 'assistant',
        content: 'Please select a project first to perform analysis.'
      }
    }

    onStepUpdate?.({
      type: 'reasoning',
      title: 'Project Analysis',
      content: `Analyzing ${project.name} using Suna\'s tools...`,
      status: 'active',
      timestamp: new Date().toISOString()
    })

    const response = await this.sunaClient.analyzeProject(
      project.name,
      `${project.description}\nUser query: ${query}`
    )

    return {
      role: 'assistant',
      content: response.content
    }
  }

  private async handleGeneralQuery(
    threadId: string,
    query: string,
    context: string
  ): Promise<Message> {
    // Prepend context to the query
    const fullQuery = `${context}\n\nUser: ${query}`

    const response = await this.sunaClient.sendMessage(threadId, fullQuery, {
      tools: ['web_search', 'calculator', 'file_ops']
    })

    return {
      role: 'assistant',
      content: response.content
    }
  }

  private isDeepResearchQuery(message: string): boolean {
    const deepResearchKeywords = [
      'comprehensive', 'research', 'analyze', 'due diligence',
      'deep dive', 'investigate', 'detailed analysis', 'market research',
      'competitor analysis', 'investment memo', 'latest developments'
    ]
    
    const lowercaseMessage = message.toLowerCase()
    return deepResearchKeywords.some(keyword => lowercaseMessage.includes(keyword))
  }

  private isProjectAnalysisQuery(message: string): boolean {
    const projectKeywords = [
      'this project', 'current project', 'analyze project',
      'tell me about', 'what is', 'evaluate', 'assessment'
    ]
    
    const lowercaseMessage = message.toLowerCase()
    return projectKeywords.some(keyword => lowercaseMessage.includes(keyword))
  }

  // Specialized VC methods using Suna

  async generateInvestmentMemo(project: Project): Promise<string> {
    const response = await this.sunaClient.generateMemo(project)
    return response.content
  }

  async searchInvestors(criteria: string): Promise<string> {
    const response = await this.sunaClient.searchInvestors(criteria)
    return response.content
  }

  async monitorPortfolio(projects: Project[]): Promise<string> {
    const companies = projects.map(p => p.name)
    const response = await this.sunaClient.monitorPortfolio(companies)
    return response.content
  }

  async analyzeMarketTrends(sector: string): Promise<string> {
    const thread = await this.sunaClient.createThread({ type: 'market_analysis' })
    
    const response = await this.sunaClient.sendMessage(
      thread.id,
      `Analyze current market trends in the ${sector} sector. Include market size, growth rate, key players, and investment opportunities.`,
      { tools: ['web_search', 'tavily_search', 'data_analysis'] }
    )
    
    return response.content
  }
}

// Export as default for easy migration
export default VCAssistantSuna