'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { threePillarBridge } from '@/lib/integrations/three-pillar-bridge'
import { redpillAgents } from '@/lib/agents/ag-ui-client'
import { agentOpenBBBridge } from '@/lib/integrations/agent-openbb-bridge'

interface WorkflowStep {
  id: string
  name: string
  pillar: 'agents' | 'market' | 'portfolio' | 'integration'
  status: 'pending' | 'running' | 'completed' | 'error'
  description: string
  result?: any
}

const DEMO_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'create-portfolio',
    name: 'Create Portfolio Project',
    pillar: 'portfolio',
    status: 'pending',
    description: 'Create a new portfolio project in OpenProject system'
  },
  {
    id: 'research-company',
    name: 'AI Research Analysis',
    pillar: 'agents', 
    status: 'pending',
    description: 'Use AG-UI agents to research company background and fundamentals'
  },
  {
    id: 'fetch-market-data',
    name: 'Market Data Analysis',
    pillar: 'market',
    status: 'pending',
    description: 'Get real-time market data using OpenBB Platform'
  },
  {
    id: 'generate-memo',
    name: 'Generate Investment Memo',
    pillar: 'integration',
    status: 'pending',
    description: 'Combine all data sources to create comprehensive investment memo'
  }
]

export function MVPWorkflowDemo() {
  const [steps, setSteps] = useState<WorkflowStep[]>(DEMO_WORKFLOW_STEPS)
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [workflowData, setWorkflowData] = useState<{
    project?: any
    research?: any
    marketData?: any
    memo?: any
  }>({})

  const updateStepStatus = (stepId: string, status: WorkflowStep['status'], result?: any) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, result }
        : step
    ))
  }

  const runCompleteWorkflow = async () => {
    console.log('🚀 Starting Complete Three-Pillar Workflow Demo...')
    
    try {
      // Step 1: Create Portfolio Project
      setCurrentStep('create-portfolio')
      updateStepStatus('create-portfolio', 'running')
      
      const project = await threePillarBridge.createPortfolioProject({
        company_name: 'LayerZero Protocol',
        description: 'Omnichain interoperability protocol enabling cross-chain applications',
        sector: 'infrastructure',
        lead_partner: 'Demo Partner',
        investment_amount: 2000000,
        valuation: 50000000
      })
      
      if (!project) throw new Error('Failed to create portfolio project')
      
      updateStepStatus('create-portfolio', 'completed', project)
      setWorkflowData(prev => ({ ...prev, project }))
      
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 2: AI Research Analysis
      setCurrentStep('research-company')
      updateStepStatus('research-company', 'running')
      
      const research = await redpillAgents.startResearch(
        'Conduct comprehensive research on LayerZero Protocol: technology, team, market position, and competitive analysis',
        { 
          project_id: project.id,
          company_name: 'LayerZero Protocol',
          research_type: 'comprehensive_dd'
        }
      )
      
      updateStepStatus('research-company', 'completed', research)
      setWorkflowData(prev => ({ ...prev, research }))
      
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 3: Market Data Analysis
      setCurrentStep('fetch-market-data')
      updateStepStatus('fetch-market-data', 'running')
      
      const marketData = await agentOpenBBBridge.requestMarketData(
        'market-agent',
        ['BTC', 'ETH', 'AVAX', 'MATIC'], // Infrastructure tokens for comparison
        'analysis'
      )
      
      updateStepStatus('fetch-market-data', 'completed', marketData)
      setWorkflowData(prev => ({ ...prev, marketData }))
      
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Step 4: Generate Investment Memo
      setCurrentStep('generate-memo')
      updateStepStatus('generate-memo', 'running')
      
      const memoContent = generateInvestmentMemo(project, research, marketData)
      
      const memoSaved = await threePillarBridge.addProjectMemo(
        project.id,
        memoContent,
        'comprehensive_investment_memo'
      )
      
      updateStepStatus('generate-memo', 'completed', { saved: memoSaved, content: memoContent })
      setWorkflowData(prev => ({ ...prev, memo: memoContent }))
      
      setCurrentStep(null)
      console.log('✅ Complete Three-Pillar Workflow Demo Finished!')

    } catch (error) {
      console.error('❌ Workflow failed:', error)
      if (currentStep) {
        updateStepStatus(currentStep, 'error')
      }
      setCurrentStep(null)
    }
  }

  const generateInvestmentMemo = (project: any, research: any, marketData: any): string => {
    return `# Investment Memo: ${project.company_name}

## Executive Summary
**Investment Opportunity**: ${project.company_name}
**Sector**: ${project.sector}
**Investment Amount**: $${project.investment_amount?.toLocaleString()}
**Valuation**: $${project.valuation?.toLocaleString()}
**Generated**: ${new Date().toLocaleDateString()}

## Company Overview
${project.description}

## Research Analysis
${research ? 'AI research analysis completed with comprehensive due diligence data.' : 'Research pending...'}

### Key Findings:
- ✅ Technology assessment: Advanced omnichain protocol
- ✅ Team evaluation: Strong technical leadership
- ✅ Market position: Leading cross-chain infrastructure
- ✅ Competitive analysis: Significant moat in interoperability

## Market Data Analysis
${marketData ? 'Real-time market data analysis completed using OpenBB Platform.' : 'Market analysis pending...'}

### Market Metrics:
- 📊 Infrastructure sector performance: Strong growth trajectory
- 📈 Comparable valuations: Premium to sector average justified
- 🎯 Market timing: Favorable for infrastructure investments
- 💰 Liquidity conditions: Adequate for growth-stage investment

## Investment Recommendation
**RECOMMENDATION: PROCEED WITH INVESTMENT**

### Rationale:
1. **Strong Technology Moat**: LayerZero's omnichain protocol provides significant competitive advantage
2. **Experienced Team**: Proven track record in blockchain infrastructure
3. **Market Opportunity**: Large and growing cross-chain market
4. **Valuation**: Fair pricing relative to growth potential

### Risk Factors:
- Technology risk: Cross-chain security challenges
- Competition: Other interoperability solutions emerging
- Market risk: Overall crypto market volatility

### Terms Summary:
- Investment: $${project.investment_amount?.toLocaleString()}
- Valuation: $${project.valuation?.toLocaleString()}
- Ownership: ${((project.investment_amount / project.valuation) * 100).toFixed(2)}%

---

## Three-Pillar System Integration
This memo was generated using RedpillAI's integrated platform:
- 🤖 **AI Agents**: Comprehensive research and analysis
- 📊 **OpenBB Platform**: Real-time market data and financial metrics
- 🏢 **OpenProject**: Portfolio management and document collaboration

**Generated by**: RedpillAI Three-Pillar Platform
**Workflow ID**: demo_${Date.now()}
**Date**: ${new Date().toISOString()}
`
  }

  const resetWorkflow = () => {
    setSteps(DEMO_WORKFLOW_STEPS)
    setCurrentStep(null)
    setWorkflowData({})
  }

  const getPillarColor = (pillar: string) => {
    switch (pillar) {
      case 'agents': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'market': return 'bg-green-100 text-green-800 border-green-300'
      case 'portfolio': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'integration': return 'bg-orange-100 text-orange-800 border-orange-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'running': return 'bg-yellow-500 animate-pulse'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }

  const getPillarIcon = (pillar: string) => {
    switch (pillar) {
      case 'agents': return '🤖'
      case 'market': return '📊'
      case 'portfolio': return '🏢'
      case 'integration': return '🔗'
      default: return '⚙️'
    }
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔄 Three-Pillar Workflow Demo
        </h1>
        <p className="text-gray-600">
          Complete end-to-end workflow demonstrating all three pillars working together
        </p>
      </div>

      {/* Workflow Progress */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Demo Workflow: LayerZero Investment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getStatusColor(step.status)}`}>
                    {index + 1}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium">{getPillarIcon(step.pillar)} {step.name}</h3>
                    <Badge className={getPillarColor(step.pillar)}>
                      {step.pillar}
                    </Badge>
                    {currentStep === step.id && (
                      <Badge className="bg-yellow-100 text-yellow-800 animate-pulse">
                        Running...
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                  
                  {step.result && step.status === 'completed' && (
                    <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                      <span className="text-green-700">✅ Completed successfully</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>🎮 Demo Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button 
              onClick={runCompleteWorkflow}
              disabled={currentStep !== null}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {currentStep ? '🔄 Running Workflow...' : '🚀 Start Complete Workflow'}
            </Button>
            
            <Button 
              onClick={resetWorkflow}
              variant="outline"
            >
              🔄 Reset Demo
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>This demo will:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Create a portfolio project for LayerZero Protocol</li>
              <li>Use AI agents to research the company comprehensively</li>
              <li>Fetch real-time market data for competitive analysis</li>
              <li>Generate a complete investment memo combining all data</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Results Preview */}
      {workflowData.memo && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Generated Investment Memo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">{workflowData.memo}</pre>
            </div>
            <div className="mt-4 flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigator.clipboard.writeText(workflowData.memo)}
              >
                📋 Copy Memo
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => console.log('Full workflow data:', workflowData)}
              >
                🔍 View All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}