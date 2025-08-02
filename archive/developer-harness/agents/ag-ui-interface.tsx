"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  TrendingUp, 
  Shield, 
  Search,
  Play, 
  Square, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { redpillAgents, RedpillAgent, AgentTask, DEFAULT_AGENTS } from '@/lib/agents/ag-ui-client'
import { agentOpenBBBridge, initializeAgentBridge } from '@/lib/integrations/agent-openbb-bridge'

interface AGUIInterfaceProps {
  isOpen: boolean
  onClose: () => void
  selectedProject?: any
}

export function AGUIInterface({ isOpen, onClose, selectedProject }: AGUIInterfaceProps) {
  const [agents, setAgents] = useState<RedpillAgent[]>([])
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [agentLogs, setAgentLogs] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      initializeAgents()
    }
  }, [isOpen])

  useEffect(() => {
    // Setup event listeners
    const handleConnected = () => setConnectionStatus('connected')
    const handleDisconnected = () => setConnectionStatus('disconnected')
    const handleAgentEvent = (event: any) => {
      setAgentLogs(prev => [...prev.slice(-49), {
        id: Date.now(),
        timestamp: new Date(),
        type: event.type,
        agentId: event.agentId,
        data: event.data
      }])
    }
    const handleTaskStatusChanged = (task: AgentTask) => {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t))
    }

    redpillAgents.on('connected', handleConnected)
    redpillAgents.on('disconnected', handleDisconnected)
    redpillAgents.on('agent_event', handleAgentEvent)
    redpillAgents.on('task_status_changed', handleTaskStatusChanged)

    return () => {
      redpillAgents.off('connected', handleConnected)
      redpillAgents.off('disconnected', handleDisconnected)
      redpillAgents.off('agent_event', handleAgentEvent)
      redpillAgents.off('task_status_changed', handleTaskStatusChanged)
    }
  }, [])

  const initializeAgents = async () => {
    try {
      setConnectionStatus('connecting')
      
      // Initialize Agent-OpenBB Bridge
      await initializeAgentBridge()
      
      // Initialize default agents
      setAgents(DEFAULT_AGENTS)
      
      // Try to connect (will fail gracefully if no server)
      try {
        await redpillAgents.connect()
        
        // Register agents with server
        for (const agent of DEFAULT_AGENTS) {
          await redpillAgents.registerAgent(agent)
        }
        
        setConnectionStatus('connected')
      } catch (error) {
        console.warn('AG-UI server not available, running in offline mode')
        setConnectionStatus('disconnected')
      }
      
      // Setup bridge event listeners
      agentOpenBBBridge.on('agent_response', (response) => {
        console.log('🔗 Bridge response:', response)
        setAgentLogs(prev => [...prev.slice(-49), {
          id: Date.now(),
          timestamp: new Date(),
          type: 'bridge_response',
          agentId: response.agentId,
          data: response.data
        }])
      })
      
    } catch (error) {
      console.error('Failed to initialize agents:', error)
      setConnectionStatus('disconnected')
    }
  }

  const startAgentTask = async (agentId: string, taskType: string) => {
    try {
      let taskId: string
      
      switch (taskType) {
        case 'research':
          taskId = await redpillAgents.startResearch(
            selectedProject ? `Research ${selectedProject.name}` : 'General market research',
            { project: selectedProject }
          )
          // Trigger OpenBB bridge research
          await agentOpenBBBridge.requestResearch(
            agentId, 
            selectedProject ? `Research ${selectedProject.name}` : 'General market research'
          )
          break
        case 'market_analysis':
          taskId = await redpillAgents.startMarketAnalysis(['BTC', 'ETH'], 'technical')
          // Trigger OpenBB bridge market data
          await agentOpenBBBridge.requestMarketData(agentId, ['BTC', 'ETH'], 'analysis')
          break
        case 'risk_assessment':
          taskId = await redpillAgents.startRiskAssessment({ 
            assets: ['BTC', 'ETH'],
            allocation: [0.6, 0.4]
          })
          // Trigger OpenBB bridge risk analysis
          await agentOpenBBBridge.requestRiskAnalysis(agentId, {
            assets: ['BTC', 'ETH'],
            allocation: [0.6, 0.4]
          })
          break
        default:
          taskId = await redpillAgents.startTask(agentId, taskType, {})
      }

      // Add task to local state
      const newTask: AgentTask = {
        id: taskId,
        agentId,
        type: taskType,
        input: {},
        status: 'pending',
        startTime: new Date()
      }
      
      setTasks(prev => [...prev, newTask])
      
    } catch (error) {
      console.error('Failed to start task:', error)
    }
  }

  const getAgentIcon = (type: RedpillAgent['type']) => {
    switch (type) {
      case 'research': return Search
      case 'market': return TrendingUp
      case 'risk': return Shield
      default: return Brain
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-500'
      case 'connecting': return 'text-yellow-500'
      case 'active': return 'text-blue-500'
      case 'busy': return 'text-orange-500'
      case 'error': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getTaskStatusIcon = (status: AgentTask['status']) => {
    switch (status) {
      case 'pending': return Clock
      case 'running': return Activity
      case 'completed': return CheckCircle
      case 'failed': return XCircle
      default: return Clock
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-semibold text-white">AI Agents</h3>
              <p className="text-xs text-white/80">AG-UI Protocol</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 ${getStatusColor(connectionStatus)}`}>
              <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
              <span className="text-xs text-white">{connectionStatus}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:text-white hover:bg-white/20"
            >
              ×
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Agents Section */}
          <div className="p-4">
            <h4 className="font-medium text-gray-800 mb-3">Available Agents</h4>
            <div className="space-y-2">
              {agents.map((agent) => {
                const IconComponent = getAgentIcon(agent.type)
                return (
                  <Card key={agent.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          agent.type === 'research' ? 'bg-blue-100 text-blue-600' :
                          agent.type === 'market' ? 'bg-green-100 text-green-600' :
                          agent.type === 'risk' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{agent.name}</p>
                          <p className="text-xs text-gray-500">{agent.framework}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant={agent.status === 'idle' ? 'secondary' : 'default'}>
                          {agent.status}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (agent.type === 'research') {
                              startAgentTask(agent.id, 'research')
                            } else if (agent.type === 'market') {
                              startAgentTask(agent.id, 'market_analysis')
                            } else if (agent.type === 'risk') {
                              startAgentTask(agent.id, 'risk_assessment')
                            }
                          }}
                          disabled={agent.status === 'busy'}
                          className="h-6 px-2 text-xs"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Agent Capabilities */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {agent.capabilities.slice(0, 2).map((capability) => (
                        <Badge key={capability} variant="outline" className="text-xs">
                          {capability.replace('_', ' ')}
                        </Badge>
                      ))}
                      {agent.capabilities.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.capabilities.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Tasks Section */}
          <div className="p-4 border-t">
            <h4 className="font-medium text-gray-800 mb-3">Recent Tasks</h4>
            <div className="space-y-2">
              {tasks.slice(-5).map((task) => {
                const StatusIcon = getTaskStatusIcon(task.status)
                const agent = agents.find(a => a.id === task.agentId)
                
                return (
                  <Card key={task.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`w-4 h-4 ${
                          task.status === 'completed' ? 'text-green-500' :
                          task.status === 'failed' ? 'text-red-500' :
                          task.status === 'running' ? 'text-blue-500' :
                          'text-gray-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium">{task.type.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-500">{agent?.name}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {task.status}
                        </Badge>
                        {task.progress !== undefined && (
                          <div className="text-xs text-gray-500 mt-1">
                            {task.progress}%
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
              
              {tasks.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-4">
                  No tasks started yet
                </div>
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="p-4 border-t">
            <h4 className="font-medium text-gray-800 mb-3">Activity Log</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {agentLogs.slice(-10).map((log) => (
                <div key={log.id} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                  <span className="font-medium">{log.type}</span>
                  <span className="text-gray-500 ml-2">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
              
              {agentLogs.length === 0 && (
                <div className="text-center text-gray-500 text-xs py-2">
                  No activity yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>AG-UI Protocol v0.0.35</span>
            <span>{agents.length} agents • {tasks.length} tasks</span>
          </div>
          
          {selectedProject && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
              <span className="font-medium">Context:</span> {selectedProject.name}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}