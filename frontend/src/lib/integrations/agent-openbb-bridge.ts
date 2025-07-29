// AG-UI + OpenBB Integration Bridge
// Connects AI agents with financial data services

import { redpillAgents, AgentTask } from '@/lib/agents/ag-ui-client'
import { EventEmitter } from 'events'

export interface OpenBBMarketData {
  symbol: string
  current_price: number
  change_percent: number
  volume_24h: number
  high_24h: number
  low_24h: number
  last_updated: string
}

export interface AgentRequest {
  id: string
  agentId: string
  type: 'market_data' | 'historical_data' | 'technical_analysis' | 'news' | 'portfolio_analysis'
  parameters: any
  timestamp: Date
}

export interface AgentResponse {
  requestId: string
  agentId: string
  data: any
  status: 'success' | 'error'
  error?: string
  timestamp: Date
}

export class AgentOpenBBBridge extends EventEmitter {
  private openbbApiUrl: string
  private pendingRequests: Map<string, AgentRequest> = new Map()

  constructor(openbbApiUrl: string = 'http://localhost:8000/api/v1/market') {
    super()
    this.openbbApiUrl = openbbApiUrl
    this.setupAgentListeners()
  }

  private setupAgentListeners() {
    // Listen for agent events that require financial data
    redpillAgents.on('market_data_request', this.handleMarketDataRequest.bind(this))
    redpillAgents.on('research_request', this.handleResearchRequest.bind(this))
    redpillAgents.on('risk_analysis_request', this.handleRiskAnalysisRequest.bind(this))
  }

  // Market Data Requests
  async handleMarketDataRequest(request: {
    agentId: string
    taskId: string
    symbols: string[]
    type: 'price' | 'historical' | 'analysis'
  }) {
    const requestId = `market_${Date.now()}`
    
    try {
      const results = await Promise.all(
        request.symbols.map(symbol => this.fetchMarketData(symbol, request.type))
      )
      
      const response: AgentResponse = {
        requestId,
        agentId: request.agentId,
        data: {
          symbols: request.symbols,
          type: request.type,
          results: results.filter(Boolean)
        },
        status: 'success',
        timestamp: new Date()
      }

      this.emit('agent_response', response)
      
      // Send back to agent
      await redpillAgents.sendRawEvent({
        type: 'market.update',
        agentId: request.agentId,
        taskId: request.taskId,
        data: response.data,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Market data request failed:', error)
      
      const errorResponse: AgentResponse = {
        requestId,
        agentId: request.agentId,
        data: null,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }

      this.emit('agent_response', errorResponse)
    }
  }

  // Research Requests
  async handleResearchRequest(request: {
    agentId: string
    taskId: string
    query: string
    context?: any
  }) {
    const requestId = `research_${Date.now()}`
    
    try {
      // Combine market data with news for research
      const [marketOverview, newsData] = await Promise.all([
        this.fetchMarketOverview(),
        this.fetchMarketNews()
      ])

      const researchData = {
        query: request.query,
        context: request.context,
        market_overview: marketOverview,
        recent_news: newsData,
        timestamp: new Date().toISOString()
      }

      const response: AgentResponse = {
        requestId,
        agentId: request.agentId,
        data: researchData,
        status: 'success',
        timestamp: new Date()
      }

      this.emit('agent_response', response)

      // Send back to agent
      await redpillAgents.sendRawEvent({
        type: 'research.result',
        agentId: request.agentId,
        taskId: request.taskId,
        data: researchData,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Research request failed:', error)
      
      const errorResponse: AgentResponse = {
        requestId,
        agentId: request.agentId,
        data: null,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }

      this.emit('agent_response', errorResponse)
    }
  }

  // Risk Analysis Requests
  async handleRiskAnalysisRequest(request: {
    agentId: string
    taskId: string
    portfolio: { assets: string[], allocation: number[] }
  }) {
    const requestId = `risk_${Date.now()}`
    
    try {
      // Fetch current prices for portfolio assets
      const assetPrices = await Promise.all(
        request.portfolio.assets.map(asset => this.fetchMarketData(asset, 'price'))
      )

      // Calculate basic portfolio metrics
      const totalValue = assetPrices.reduce((sum, price, index) => {
        if (price && price.current_price) {
          return sum + (price.current_price * request.portfolio.allocation[index])
        }
        return sum
      }, 0)

      const portfolioData = {
        assets: request.portfolio.assets,
        allocation: request.portfolio.allocation,
        current_prices: assetPrices,
        total_value: totalValue,
        risk_metrics: {
          // Mock risk calculations - in production, use proper financial formulas
          portfolio_beta: 1.2,
          sharpe_ratio: 0.85,
          max_drawdown: -15.2,
          volatility: 22.3
        },
        last_updated: new Date().toISOString()
      }

      const response: AgentResponse = {
        requestId,
        agentId: request.agentId,
        data: portfolioData,
        status: 'success',
        timestamp: new Date()
      }

      this.emit('agent_response', response)

      // Send back to agent
      await redpillAgents.sendRawEvent({
        type: 'risk.alert',
        agentId: request.agentId,
        taskId: request.taskId,
        data: portfolioData,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('Risk analysis request failed:', error)
      
      const errorResponse: AgentResponse = {
        requestId,
        agentId: request.agentId,
        data: null,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      }

      this.emit('agent_response', errorResponse)
    }
  }

  // OpenBB API Methods
  private async fetchMarketData(symbol: string, type: 'price' | 'historical' | 'analysis'): Promise<OpenBBMarketData | null> {
    try {
      const endpoint = type === 'price' ? 'price' : 
                     type === 'historical' ? 'historical' : 
                     'analysis'
      
      const response = await fetch(`${this.openbbApiUrl}/crypto/${symbol}/${endpoint}`)
      
      if (!response.ok) {
        console.warn(`Failed to fetch ${type} for ${symbol}: ${response.status}`)
        return null
      }
      
      return await response.json()
    } catch (error) {
      console.error(`Error fetching ${type} for ${symbol}:`, error)
      return null
    }
  }

  private async fetchMarketOverview(): Promise<any> {
    try {
      const response = await fetch(`${this.openbbApiUrl}/overview`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Error fetching market overview:', error)
    }
    return null
  }

  private async fetchMarketNews(): Promise<any> {
    try {
      const response = await fetch(`${this.openbbApiUrl}/news`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.error('Error fetching market news:', error)
    }
    return null
  }

  // Public Methods for Direct Integration
  
  async requestMarketData(agentId: string, symbols: string[], type: 'price' | 'historical' | 'analysis' = 'price'): Promise<void> {
    await this.handleMarketDataRequest({
      agentId,
      taskId: `direct_${Date.now()}`,
      symbols,
      type
    })
  }

  async requestResearch(agentId: string, query: string, context?: any): Promise<void> {
    await this.handleResearchRequest({
      agentId,
      taskId: `direct_${Date.now()}`,
      query,
      context
    })
  }

  async requestRiskAnalysis(agentId: string, portfolio: { assets: string[], allocation: number[] }): Promise<void> {
    await this.handleRiskAnalysisRequest({
      agentId,
      taskId: `direct_${Date.now()}`,
      portfolio
    })
  }

  // Utility Methods
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.openbbApiUrl}/health`)
      return response.ok
    } catch (error) {
      return false
    }
  }

  async getAvailableProviders(): Promise<string[]> {
    try {
      const response = await fetch(`${this.openbbApiUrl}/providers`)
      if (response.ok) {
        const data = await response.json()
        return data.providers || []
      }
    } catch (error) {
      console.error('Error fetching providers:', error)
    }
    return []
  }
}

// Export singleton instance
export const agentOpenBBBridge = new AgentOpenBBBridge()

// Setup automatic bridge activation
export const initializeAgentBridge = async (): Promise<void> => {
  console.log('🌉 Initializing Agent-OpenBB Bridge...')
  
  // Check OpenBB health
  const isHealthy = await agentOpenBBBridge.healthCheck()
  if (isHealthy) {
    console.log('✅ OpenBB Platform connected')
  } else {
    console.warn('⚠️ OpenBB Platform not available - bridge running in mock mode')
  }

  // Setup event forwarding
  agentOpenBBBridge.on('agent_response', (response: AgentResponse) => {
    console.log(`📊 Agent response: ${response.agentId} -> ${response.status}`)
  })

  console.log('🚀 Agent-OpenBB Bridge initialized')
}