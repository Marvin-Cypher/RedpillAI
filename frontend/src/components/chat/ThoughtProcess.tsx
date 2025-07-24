'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronDown, 
  ChevronRight, 
  Brain, 
  Search, 
  BarChart3, 
  FileText, 
  CheckCircle, 
  Clock,
  Lightbulb,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ThoughtStep {
  id: string
  type: 'reasoning' | 'search' | 'analysis' | 'synthesis' | 'complete'
  title: string
  content: string
  status: 'pending' | 'active' | 'complete'
  timestamp: Date
  metadata?: {
    searchQuery?: string
    sourcesFound?: number
    confidence?: number
    reasoning_content?: string
  }
}

interface ThoughtProcessProps {
  steps: ThoughtStep[]
  isActive: boolean
  className?: string
}

const stepIcons = {
  reasoning: Brain,
  search: Search,
  analysis: BarChart3,
  synthesis: FileText,
  complete: CheckCircle
}

const stepColors = {
  reasoning: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  search: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  analysis: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  synthesis: 'bg-green-500/20 text-green-300 border-green-500/30',
  complete: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
}

const statusIcons = {
  pending: Clock,
  active: Zap,
  complete: CheckCircle
}

export function ThoughtProcess({ steps, isActive, className }: ThoughtProcessProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  if (steps.length === 0) return null

  const activeStep = steps.find(step => step.status === 'active')
  const completedSteps = steps.filter(step => step.status === 'complete').length

  return (
    <Card className={cn('border-dark-700 bg-dark-800/50 backdrop-blur-sm', className)}>
      <div className="p-4 border-b border-dark-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-300 hover:text-white w-full justify-start p-0"
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="font-medium">Chain of Thought</span>
          <Badge variant="secondary" className="ml-auto bg-dark-600 text-gray-300">
            {completedSteps}/{steps.length}
          </Badge>
        </Button>
        
        {activeStep && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
            <Zap className="w-3 h-3 text-yellow-400 animate-pulse" />
            <span>Currently: {activeStep.title}</span>
          </div>
        )}
      </div>

      {isExpanded && (
        <CardContent className="p-0">
          <div className="space-y-0">
            {steps.map((step, index) => {
              const StepIcon = stepIcons[step.type]
              const StatusIcon = statusIcons[step.status]
              const isStepExpanded = expandedSteps.has(step.id)
              
              return (
                <div
                  key={step.id}
                  className={cn(
                    'border-l-2 ml-4 pl-4 pb-4',
                    index === 0 ? 'pt-4' : 'pt-2',
                    step.status === 'active' ? 'border-yellow-500/50' :
                    step.status === 'complete' ? 'border-green-500/50' :
                    'border-gray-600/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full border',
                      stepColors[step.type],
                      step.status === 'active' && 'animate-pulse'
                    )}>
                      <StepIcon className="w-4 h-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-white">{step.title}</h4>
                        <StatusIcon className={cn(
                          'w-3 h-3',
                          step.status === 'active' ? 'text-yellow-400 animate-pulse' :
                          step.status === 'complete' ? 'text-green-400' :
                          'text-gray-500'
                        )} />
                        {step.metadata?.confidence && (
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                            {Math.round(step.metadata.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                      
                      {step.metadata?.searchQuery && (
                        <div className="text-xs text-blue-400 mb-1">
                          Query: "{step.metadata.searchQuery}"
                        </div>
                      )}
                      
                      {step.metadata?.sourcesFound && (
                        <div className="text-xs text-gray-400 mb-2">
                          Found {step.metadata.sourcesFound} sources
                        </div>
                      )}

                      {/* DeepSeek R1 Reasoning Content */}
                      {step.metadata?.reasoning_content && (
                        <div className="mb-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleStep(step.id)}
                            className="text-xs text-purple-400 hover:text-purple-300 p-0 h-auto"
                          >
                            <Lightbulb className="w-3 h-3 mr-1" />
                            {isStepExpanded ? 'Hide' : 'Show'} Reasoning
                          </Button>
                          
                          {isStepExpanded && (
                            <div className="mt-2 p-3 bg-purple-900/20 border border-purple-500/30 rounded-md">
                              <div className="text-xs text-purple-300 font-medium mb-2">
                                🧠 AI Reasoning Process:
                              </div>
                              <div className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                                {step.metadata.reasoning_content}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-300">
                        {step.content}
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-1">
                        {step.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Utility function to create thought steps from research state
export function createThoughtStepsFromResearch(researchState: any): ThoughtStep[] {
  const steps: ThoughtStep[] = []
  
  // Planning step
  if (researchState.research_plan?.length > 0) {
    steps.push({
      id: 'planning',
      type: 'reasoning',
      title: 'Research Planning',
      content: `Generated ${researchState.research_plan.length} research queries to investigate comprehensively`,
      status: 'complete',
      timestamp: new Date(),
      metadata: {
        reasoning_content: `I need to break down this research query into specific, focused searches that will provide comprehensive coverage. Let me identify the key areas that need investigation:\n\n1. Recent developments and news\n2. Technical capabilities and innovations\n3. Market position and competition\n4. Team and leadership analysis\n5. Partnerships and ecosystem\n\nThis multi-faceted approach will ensure I gather complete information for a thorough VC analysis.`
      }
    })
  }
  
  // Search steps
  researchState.research_plan?.forEach((query: string, index: number) => {
    steps.push({
      id: `search-${index}`,
      type: 'search',
      title: `Search ${index + 1}`,
      content: `Searching for: "${query}"`,
      status: researchState.current_step > index ? 'complete' : 
             researchState.current_step === index ? 'active' : 'pending',
      timestamp: new Date(),
      metadata: {
        searchQuery: query,
        sourcesFound: researchState.search_results?.length || 0
      }
    })
  })
  
  // Analysis step
  if (researchState.findings?.length > 0) {
    steps.push({
      id: 'analysis',
      type: 'analysis',
      title: 'Information Analysis',
      content: `Extracted ${researchState.findings.length} key findings from ${researchState.search_results?.length || 0} sources`,
      status: 'complete',
      timestamp: new Date(),
      metadata: {
        sourcesFound: researchState.search_results?.length || 0,
        confidence: researchState.confidence_score,
        reasoning_content: `Now I need to analyze all the gathered information to extract the most important insights for VC decision-making. I'll look for:\n\n1. Key facts and data points that indicate market traction\n2. Technology innovations that create competitive advantages  \n3. Team strength and execution capability\n4. Market opportunity size and timing\n5. Risk factors that could impact investment success\n6. Recent developments that change the investment thesis\n\nI'll synthesize this information to provide actionable insights while noting any gaps or uncertainties that require further investigation.`
      }
    })
  }
  
  // Synthesis step
  if (researchState.synthesis) {
    steps.push({
      id: 'synthesis',
      type: 'synthesis',
      title: 'Research Synthesis',
      content: 'Compiled comprehensive research report with executive summary and investment implications',
      status: 'complete',
      timestamp: new Date(),
      metadata: {
        confidence: researchState.confidence_score,
        reasoning_content: `Time to synthesize all findings into a coherent, actionable research report. I need to:\n\n1. Create an executive summary that captures the key investment thesis\n2. Organize findings by importance and relevance to VC decision-making\n3. Highlight investment implications - both opportunities and risks\n4. Provide clear recommendations for next steps\n5. Note confidence level and areas needing deeper investigation\n\nThe final report should enable quick decision-making while providing enough depth for thorough due diligence.`
      }
    })
  }
  
  return steps
}

// Hook for managing thought process state
export function useThoughtProcess() {
  const [steps, setSteps] = useState<ThoughtStep[]>([])
  
  const addStep = (step: Omit<ThoughtStep, 'id' | 'timestamp'>) => {
    const newStep: ThoughtStep = {
      ...step,
      id: `${step.type}-${Date.now()}`,
      timestamp: new Date()
    }
    setSteps(prev => [...prev, newStep])
    return newStep.id
  }
  
  const updateStep = (id: string, updates: Partial<ThoughtStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, ...updates } : step
    ))
  }
  
  const clearSteps = () => {
    setSteps([])
  }
  
  return {
    steps,
    addStep,
    updateStep,
    clearSteps,
    isActive: steps.some(step => step.status === 'active')
  }
}