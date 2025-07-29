// AG-UI Protocol Client for RedpillAI
// Standardized agent communication interface

import { EventEmitter } from 'events'

// Mock AG-UI types until packages are fully available
export type AGUIEventType = 'agent.register' | 'agent.status' | 'task.start' | 'task.started' | 'task.progress' | 'task.completed' | 'task.failed' | 'research.result' | 'market.update' | 'risk.alert' | 'ping'

export interface AGUIEvent {
  type: AGUIEventType
  data: any
  timestamp: string
}

// Mock AGUIClient for development
class MockAGUIClient extends EventEmitter {
  private wsUrl: string
  private connected: boolean = false

  constructor(wsUrl: string) {
    super()
    this.wsUrl = wsUrl
  }

  async connect(): Promise<void> {
    // Simulate connection attempt
    setTimeout(() => {
      this.connected = true
      this.emit('connect')
    }, 100)
  }

  async disconnect(): Promise<void> {
    this.connected = false
    this.emit('disconnect')
  }

  async send(event: AGUIEvent): Promise<void> {
    // Mock sending events - simulate async operation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('📡 Mock AG-UI event sent:', event.type)
        resolve()
      }, 10)
    })
  }

  isConnected(): boolean {
    return this.connected
  }
}

export interface RedpillAgent {
  id: string
  name: string
  type: 'research' | 'market' | 'risk' | 'compliance'
  status: 'idle' | 'active' | 'busy' | 'error'
  capabilities: string[]
  framework: 'langgraph' | 'crewai' | 'pydantic' | 'mastra'
}

export interface AgentTask {
  id: string
  agentId: string
  type: string
  input: any
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: any
  error?: string
  progress?: number
  startTime?: Date
  endTime?: Date
}

export interface AgentEvent extends AGUIEvent {
  agentId: string
  taskId?: string
  metadata?: {
    progress?: number
    context?: any
    sources?: string[]
    severity?: 'low' | 'medium' | 'high'
  }
}

export class RedpillAGUIClient extends EventEmitter {
  private client: MockAGUIClient
  private agents: Map<string, RedpillAgent> = new Map()
  private tasks: Map<string, AgentTask> = new Map()
  private wsUrl: string
  private connected: boolean = false

  constructor(wsUrl: string = 'ws://localhost:8001/ag-ui') {
    super()
    this.wsUrl = wsUrl
    this.client = new MockAGUIClient(wsUrl)
    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      this.connected = true
      this.emit('connected')
      console.log('🤖 AG-UI Client connected to agent server')
    })

    this.client.on('disconnect', () => {
      this.connected = false
      this.emit('disconnected')
      console.log('🔌 AG-UI Client disconnected')
    })

    this.client.on('event', (event: AgentEvent) => {
      this.handleAgentEvent(event)
    })

    this.client.on('error', (error: Error) => {
      console.error('🚨 AG-UI Client error:', error)
      this.emit('error', error)
    })
  }

  private handleAgentEvent(event: AgentEvent) {
    console.log('📡 Received agent event:', event.type, event.agentId)

    switch (event.type) {
      case 'agent.status':
        this.updateAgentStatus(event)
        break
      case 'task.started':
        this.updateTaskStatus(event, 'running')
        break
      case 'task.progress':
        this.updateTaskProgress(event)
        break
      case 'task.completed':
        this.updateTaskStatus(event, 'completed')
        break
      case 'task.failed':
        this.updateTaskStatus(event, 'failed')
        break
      case 'research.result':
        this.handleResearchResult(event)
        break
      case 'market.update':
        this.handleMarketUpdate(event)
        break
      case 'risk.alert':
        this.handleRiskAlert(event)
        break
      default:
        console.log('📬 Unknown event type:', event.type)
    }

    // Emit to listeners
    this.emit('agent_event', event)
    this.emit(event.type, event)
  }

  // Agent Management
  async registerAgent(agent: RedpillAgent): Promise<void> {
    this.agents.set(agent.id, agent)
    
    const event: AgentEvent = {
      type: 'agent.register' as AGUIEventType,
      agentId: agent.id,
      data: agent,
      timestamp: new Date().toISOString()
    }

    await this.client.send(event)
    console.log(`🤖 Registered agent: ${agent.name} (${agent.type})`)
  }

  async getAgents(): Promise<RedpillAgent[]> {
    return Array.from(this.agents.values())
  }

  async getAgent(agentId: string): Promise<RedpillAgent | undefined> {
    return this.agents.get(agentId)
  }

  // Task Management
  async startTask(agentId: string, taskType: string, input: any): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const task: AgentTask = {
      id: taskId,
      agentId,
      type: taskType,
      input,
      status: 'pending',
      startTime: new Date()
    }

    this.tasks.set(taskId, task)

    const event: AgentEvent = {
      type: 'task.start' as AGUIEventType,
      agentId,
      taskId,
      data: { taskType, input },
      timestamp: new Date().toISOString()
    }

    await this.client.send(event)
    console.log(`🚀 Started task ${taskId} for agent ${agentId}`)
    
    return taskId
  }

  async getTask(taskId: string): Promise<AgentTask | undefined> {
    return this.tasks.get(taskId)
  }

  async getTasks(agentId?: string): Promise<AgentTask[]> {
    const tasks = Array.from(this.tasks.values())
    return agentId ? tasks.filter(t => t.agentId === agentId) : tasks
  }

  // Specialized Agent Methods

  // Research Agent
  async startResearch(query: string, context?: any): Promise<string> {
    const researchAgent = Array.from(this.agents.values()).find(a => a.type === 'research')
    if (!researchAgent) {
      throw new Error('Research agent not available')
    }

    return this.startTask(researchAgent.id, 'due_diligence', {
      query,
      context,
      sources: ['web', 'financial_data', 'documents'],
      depth: 'comprehensive'
    })
  }

  // Market Agent  
  async startMarketAnalysis(symbols: string[], analysisType: string): Promise<string> {
    const marketAgent = Array.from(this.agents.values()).find(a => a.type === 'market')
    if (!marketAgent) {
      throw new Error('Market agent not available')
    }

    return this.startTask(marketAgent.id, 'market_analysis', {
      symbols,
      analysisType,
      timeframe: '30d',
      indicators: ['sma', 'rsi', 'volume']
    })
  }

  // Risk Agent
  async startRiskAssessment(portfolio: any): Promise<string> {
    const riskAgent = Array.from(this.agents.values()).find(a => a.type === 'risk')
    if (!riskAgent) {
      throw new Error('Risk agent not available')
    }

    return this.startTask(riskAgent.id, 'risk_assessment', {
      portfolio,
      metrics: ['var', 'sharpe', 'beta', 'correlation'],
      horizon: '1y'
    })
  }

  // Event Handlers
  private updateAgentStatus(event: AgentEvent) {
    const agent = this.agents.get(event.agentId)
    if (agent && event.data?.status) {
      agent.status = event.data.status
      this.emit('agent_status_changed', agent)
    }
  }

  private updateTaskStatus(event: AgentEvent, status: AgentTask['status']) {
    const task = this.tasks.get(event.taskId!)
    if (task) {
      task.status = status
      if (status === 'completed') {
        task.endTime = new Date()
        task.result = event.data
      } else if (status === 'failed') {
        task.endTime = new Date()
        task.error = event.data?.error || 'Unknown error'
      }
      this.emit('task_status_changed', task)
    }
  }

  private updateTaskProgress(event: AgentEvent) {
    const task = this.tasks.get(event.taskId!)
    if (task && event.metadata?.progress !== undefined) {
      task.progress = event.metadata.progress
      this.emit('task_progress', task)
    }
  }

  private handleResearchResult(event: AgentEvent) {
    console.log('📋 Research result received:', event.data)
    this.emit('research_result', {
      agentId: event.agentId,
      taskId: event.taskId,
      result: event.data,
      sources: event.metadata?.sources
    })
  }

  private handleMarketUpdate(event: AgentEvent) {
    console.log('📈 Market update received:', event.data)
    this.emit('market_update', {
      agentId: event.agentId,
      data: event.data,
      context: event.metadata?.context
    })
  }

  private handleRiskAlert(event: AgentEvent) {
    console.log('⚠️ Risk alert received:', event.data)
    this.emit('risk_alert', {
      agentId: event.agentId,
      alert: event.data,
      severity: event.metadata?.severity || 'medium'
    })
  }

  // Connection Management
  async connect(): Promise<void> {
    if (!this.connected) {
      await this.client.connect()
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.disconnect()
    }
  }

  isConnected(): boolean {
    return this.connected
  }

  // Utility Methods
  async sendRawEvent(event: AgentEvent): Promise<void> {
    await this.client.send(event)
  }

  async ping(): Promise<boolean> {
    try {
      const pingEvent: AgentEvent = {
        type: 'ping' as AGUIEventType,
        agentId: 'client',
        data: { timestamp: Date.now() },
        timestamp: new Date().toISOString()
      }
      
      await this.client.send(pingEvent)
      return true
    } catch (error) {
      console.error('Ping failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const redpillAgents = new RedpillAGUIClient()

// Default agent configurations
export const DEFAULT_AGENTS: RedpillAgent[] = [
  {
    id: 'research-agent',
    name: 'Research Agent',
    type: 'research',
    status: 'idle',
    capabilities: ['due_diligence', 'competitive_analysis', 'team_research', 'technology_analysis'],
    framework: 'langgraph'
  },
  {
    id: 'market-agent', 
    name: 'Market Agent',
    type: 'market',
    status: 'idle',
    capabilities: ['price_analysis', 'technical_indicators', 'sentiment_analysis', 'market_trends'],
    framework: 'crewai'
  },
  {
    id: 'risk-agent',
    name: 'Risk Agent', 
    type: 'risk',
    status: 'idle',
    capabilities: ['portfolio_risk', 'var_calculation', 'stress_testing', 'correlation_analysis'],
    framework: 'pydantic'
  }
]