'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageSquare, X, Send, Bot, User, Maximize2, Minimize2, 
  Zap, TrendingUp, FileText, Search, DollarSign, 
  Brain, Lightbulb, Database, ExternalLink, Clock,
  ChevronDown, ChevronRight, Eye, EyeOff, Loader2,
  CheckCircle, AlertCircle, Info, Play, Pause
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

// Enhanced message types for agentic workflows
interface AgentStep {
  id: string
  type: 'perception' | 'reasoning' | 'action' | 'reflection' | 'tool_use'
  title: string
  content: string
  status: 'pending' | 'active' | 'completed' | 'failed'
  timestamp: Date
  duration?: number
  metadata?: {
    tool_name?: string
    confidence_score?: number
    sources?: string[]
    reasoning_depth?: 'shallow' | 'deep' | 'comprehensive'
  }
}

interface AgentMessage {
  id: string
  content: string
  sender: 'user' | 'agent'
  timestamp: Date
  type?: 'workflow' | 'normal' | 'system'
  agent_type?: 'planner' | 'executor' | 'evaluator' | 'communicator'
  steps?: AgentStep[]
  final_answer?: string
  reasoning_trace?: string
  confidence_score?: number
  sources?: string[]
  tools_used?: string[]
  workflow_status?: 'planning' | 'executing' | 'evaluating' | 'completed' | 'failed'
  streaming?: boolean
}

interface Project {
  id: string
  name: string
  sector: string
  stage: string
  dealStatus?: 'prospect' | 'due_diligence' | 'term_sheet' | 'closed' | 'passed'
}

interface AgenticChatProps {
  project?: Project
  children: React.ReactNode
  isOpen?: boolean
  onToggle?: (open: boolean) => void
}

// Workflow templates with step-by-step patterns
const AGENTIC_WORKFLOWS = [
  {
    id: 'due_diligence',
    icon: <Search className="w-4 h-4" />,
    label: 'Due Diligence',
    prompt: 'Conduct comprehensive due diligence analysis',
    steps: [
      { type: 'perception', title: 'Data Collection', description: 'Gathering company information' },
      { type: 'reasoning', title: 'Analysis', description: 'Evaluating business model and financials' },
      { type: 'action', title: 'Risk Assessment', description: 'Identifying key risks and opportunities' },
      { type: 'reflection', title: 'Synthesis', description: 'Generating investment recommendation' }
    ]
  },
  {
    id: 'market_analysis',
    icon: <TrendingUp className="w-4 h-4" />,
    label: 'Market Analysis',
    prompt: 'Analyze market opportunity, size, growth trends, and competitive dynamics',
    steps: [
      { type: 'perception', title: 'Market Scanning', description: 'Collecting market data' },
      { type: 'reasoning', title: 'Trend Analysis', description: 'Analyzing growth patterns' },
      { type: 'action', title: 'Competitive Mapping', description: 'Evaluating competitive landscape' },
      { type: 'reflection', title: 'Market Position', description: 'Determining market opportunity' }
    ]
  },
  {
    id: 'financial_analysis',
    icon: <DollarSign className="w-4 h-4" />,
    label: 'Financial Deep Dive',
    prompt: 'Perform detailed financial analysis including revenue model, unit economics, and projections',
    steps: [
      { type: 'perception', title: 'Financial Data', description: 'Collecting financial metrics' },
      { type: 'reasoning', title: 'Unit Economics', description: 'Analyzing LTV/CAC and margins' },
      { type: 'action', title: 'Modeling', description: 'Building financial projections' },
      { type: 'reflection', title: 'Valuation', description: 'Determining fair value range' }
    ]
  },
  {
    id: 'investment_memo',
    icon: <FileText className="w-4 h-4" />,
    label: 'Investment Memo',
    prompt: 'Generate comprehensive investment memo with recommendation and supporting analysis',
    steps: [
      { type: 'perception', title: 'Research Synthesis', description: 'Compiling all analysis' },
      { type: 'reasoning', title: 'Investment Thesis', description: 'Formulating core thesis' },
      { type: 'action', title: 'Memo Writing', description: 'Structuring formal memo' },
      { type: 'reflection', title: 'Final Review', description: 'Quality assurance and recommendations' }
    ]
  }
]

// Component for displaying reasoning traces
const ReasoningTrace: React.FC<{ content: string; isVisible: boolean; onToggle: () => void }> = ({ 
  content, isVisible, onToggle 
}) => (
  <div className="border-l-2 border-blue-200 pl-4 mt-2">
    <Button
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className="text-xs text-blue-600 hover:text-blue-800 p-0 h-auto"
    >
      <Brain className="w-3 h-3 mr-1" />
      {isVisible ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
      {isVisible ? 'Hide' : 'Show'} Reasoning Trace
    </Button>
    {isVisible && (
      <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs font-mono">
        <div className="text-blue-700 font-semibold mb-2">🧠 Agent Reasoning Process:</div>
        <div className="prose prose-xs max-w-none">
          <ReactMarkdown>
            {content}
          </ReactMarkdown>
        </div>
      </div>
    )}
  </div>
)

// Component for agent workflow steps
const WorkflowSteps: React.FC<{ steps: AgentStep[] }> = ({ steps }) => (
  <div className="space-y-2 mt-3">
    <div className="text-xs font-semibold text-gray-600 flex items-center">
      <Zap className="w-3 h-3 mr-1" />
      Agent Workflow Progress
    </div>
    {steps.map((step, index) => (
      <div key={step.id} className="flex items-center space-x-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
          step.status === 'completed' ? 'bg-green-100 text-green-700' :
          step.status === 'active' ? 'bg-blue-100 text-blue-700 animate-pulse' :
          step.status === 'failed' ? 'bg-red-100 text-red-700' :
          'bg-gray-100 text-gray-500'
        }`}>
          {step.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
           step.status === 'failed' ? <AlertCircle className="w-3 h-3" /> :
           step.status === 'active' ? <Loader2 className="w-3 h-3 animate-spin" /> :
           index + 1}
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium">{step.title}</div>
          <div className="text-xs text-gray-500">{step.content}</div>
          {step.duration && (
            <div className="text-xs text-gray-400 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {step.duration}ms
            </div>
          )}
        </div>
        {step.metadata?.confidence_score && (
          <Badge variant="outline" className="text-xs">
            {Math.round(step.metadata.confidence_score * 100)}%
          </Badge>
        )}
      </div>
    ))}
  </div>
)

// Enhanced markdown renderer with custom components
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => (
  <div className="prose prose-sm max-w-none">
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
      code: ({ node, inline, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || '')
        return !inline && match ? (
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            className="rounded-md !mt-0"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
            {children}
          </code>
        )
      },
      h3: ({ children }) => (
        <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900">{children}</h3>
      ),
      h4: ({ children }) => (
        <h4 className="text-base font-semibold mt-3 mb-2 text-gray-800">{children}</h4>
      ),
      ul: ({ children }) => (
        <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-blue-200 pl-4 italic my-2 text-gray-700">
          {children}
        </blockquote>
      ),
      table: ({ children }) => (
        <div className="overflow-x-auto my-2">
          <table className="min-w-full border border-gray-200 text-sm">{children}</table>
        </div>
      ),
      th: ({ children }) => (
        <th className="border border-gray-200 px-3 py-2 bg-gray-50 font-semibold text-left">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="border border-gray-200 px-3 py-2">{children}</td>
      )
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
)

export function AgenticChatInterface({ 
  project,
  children,
  isOpen = false,
  onToggle 
}: AgenticChatProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [showReasoningTraces, setShowReasoningTraces] = useState<Record<string, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: AgentMessage = {
        id: '1',
        content: project 
          ? `Hello! I'm your AI investment analyst for **${project.name}**. I use advanced reasoning models and multi-step workflows to provide comprehensive analysis.\n\n🧠 **Reasoning Models**: Deep chain-of-thought analysis\n⚡ **Multi-Agent Workflows**: Specialized agents for different tasks\n📊 **Real-time Streaming**: Watch my reasoning process unfold\n\nSelect a workflow below or ask me anything!`
          : "Hello! I'm your AI investment analyst. I use advanced reasoning models and multi-step workflows for comprehensive investment analysis. How can I help you today?",
        sender: 'agent',
        timestamp: new Date(),
        agent_type: 'communicator'
      }
      setMessages([welcomeMessage])
    }
  }, [project, messages.length])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const toggleReasoningTrace = useCallback((messageId: string) => {
    setShowReasoningTraces(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }))
  }, [])

  const handleSendMessage = async (messageContent?: string, workflowType?: string) => {
    const content = messageContent || inputValue
    if (!content.trim()) return

    const userMessage: AgentMessage = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type: workflowType ? 'workflow' : 'normal'
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputValue('')
    setIsProcessing(true)

    try {
      // Start with agent thinking message
      const thinkingMessage: AgentMessage = {
        id: (Date.now() + 1).toString(),
        content: '',
        sender: 'agent',
        timestamp: new Date(),
        agent_type: 'planner',
        workflow_status: 'planning',
        streaming: true,
        steps: workflowType ? AGENTIC_WORKFLOWS.find(w => w.id === workflowType)?.steps.map((step, idx) => ({
          id: `step-${idx}`,
          type: step.type as any,
          title: step.title,
          content: step.description,
          status: 'pending',
          timestamp: new Date()
        })) || [] : []
      }

      setMessages(prev => [...prev, thinkingMessage])

      // Simulate streaming response with steps
      if (workflowType) {
        await simulateWorkflowExecution(thinkingMessage.id, content, project?.name)
      } else {
        await simulateRegularChat(thinkingMessage.id, content, project?.name)
      }

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: AgentMessage = {
        id: (Date.now() + 2).toString(),
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        sender: 'agent',
        timestamp: new Date(),
        agent_type: 'communicator'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const simulateWorkflowExecution = async (messageId: string, query: string, projectName?: string) => {
    const updateMessage = (updates: Partial<AgentMessage>) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      ))
    }

    // Step 1: Planning
    await new Promise(resolve => setTimeout(resolve, 1000))
    updateMessage({
      content: `🤔 **Planning Analysis for ${projectName || 'this company'}**\n\nI'm breaking down your request into systematic steps...`,
      workflow_status: 'executing'
    })

    // Step 2: Execute each step with progress
    const steps = AGENTIC_WORKFLOWS.find(w => w.prompt.includes('market'))?.steps || []
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      updateMessage({
        steps: steps.map((step, idx) => ({
          id: `step-${idx}`,
          type: step.type as any,
          title: step.title,
          content: step.description,
          status: idx <= i ? 'completed' : idx === i + 1 ? 'active' : 'pending',
          timestamp: new Date(),
          duration: idx <= i ? Math.random() * 2000 + 1000 : undefined
        }))
      })
    }

    // Final response
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const finalResponse = `# ${projectName || 'Company'} Analysis Results

## 📊 Market Opportunity Analysis

**Market Size**: The ${projectName || 'target'} market represents a significant opportunity with strong growth fundamentals.

### Key Findings:
- **Total Addressable Market (TAM)**: $12.5B globally
- **Serviceable Addressable Market (SAM)**: $3.2B 
- **Growth Rate**: 24% CAGR over next 5 years
- **Market Maturity**: Early growth stage with expansion opportunities

### Competitive Landscape:
1. **Direct Competitors**: 3-5 established players
2. **Indirect Competition**: Traditional solutions being disrupted  
3. **Market Position**: Strong differentiation potential
4. **Barriers to Entry**: Moderate with network effects

### Investment Implications:
✅ **Positive Indicators**:
- Large addressable market
- Strong growth trajectory  
- Clear competitive advantages
- Experienced team execution

⚠️ **Risk Factors**:
- Market competition intensifying
- Regulatory considerations
- Execution risk on growth plans
- Capital requirements for scaling

### Recommendation:
**STRONG BUY** - Market dynamics favor early investment with significant upside potential.

*Analysis completed using multi-agent reasoning workflow with 87% confidence score.*`

    updateMessage({
      content: finalResponse,
      final_answer: finalResponse,
      workflow_status: 'completed',
      confidence_score: 0.87,
      reasoning_trace: `**Planning Phase:**
1. Identified market analysis request for ${projectName}
2. Selected comprehensive market intelligence workflow
3. Allocated resources to data collection and competitive analysis

**Execution Phase:**
1. Gathered market size data from multiple sources
2. Analyzed competitive landscape and positioning
3. Evaluated growth trends and market dynamics
4. Assessed investment implications and risks

**Evaluation Phase:**
1. Cross-validated findings across data sources
2. Applied investment framework criteria
3. Generated confidence-weighted recommendation
4. Structured findings for investment decision-making`,
      tools_used: ['market_intelligence', 'competitive_analysis', 'financial_modeling'],
      sources: ['PitchBook Market Data', 'Industry Reports', 'Company Filings'],
      streaming: false
    })
  }

  const simulateRegularChat = async (messageId: string, query: string, projectName?: string) => {
    // Call actual API here
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        projectId: project?.id,
        conversationHistory: messages.slice(-5).map(msg => ({
          id: msg.id,
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp
        }))
      })
    })

    const data = await response.json()
    
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? {
        ...msg,
        content: data.success ? data.response : 'I apologize, but I encountered an error processing your request.',
        streaming: false,
        reasoning_trace: data.reasoning_content || undefined,
        confidence_score: 0.85
      } : msg
    ))
  }

  const sidebarWidth = isFullscreen ? 'w-full' : 'w-[600px]'
  const containerClass = isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''

  if (!isOpen) return <>{children}</>

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50' : 'flex h-screen'}>
      {!isFullscreen && (
        <div className="flex-1">
          {children}
        </div>
      )}
      
      {/* Enhanced AI Sidebar */}
      <div className={`${sidebarWidth} bg-white border-l border-gray-200 flex flex-col shadow-2xl ${containerClass}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-gray-900">AI Investment Analyst</h3>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    DeepSeek-R1
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  {project ? `Analyzing ${project.name} • ${project.stage}` : 'Multi-Agent Reasoning System'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle?.(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="workflows">Workflows</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col">
            {/* Workflow Templates */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Agentic Workflows</h4>
              <div className="grid grid-cols-2 gap-2">
                {AGENTIC_WORKFLOWS.map((workflow) => (
                  <Button
                    key={workflow.id}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-2 text-xs h-9 justify-start hover:bg-blue-50 hover:border-blue-200"
                    onClick={() => handleSendMessage(workflow.prompt, workflow.id)}
                    disabled={isProcessing}
                  >
                    {workflow.icon}
                    <span>{workflow.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-3">
                    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                          : 'bg-gray-50 text-gray-900 rounded-2xl rounded-bl-md border'
                      } px-4 py-3`}>
                        <div className="flex items-start space-x-3">
                          {message.sender === 'agent' && (
                            <div className="flex items-center space-x-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                message.agent_type === 'planner' ? 'bg-blue-100 text-blue-600' :
                                message.agent_type === 'executor' ? 'bg-green-100 text-green-600' :
                                message.agent_type === 'evaluator' ? 'bg-purple-100 text-purple-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {message.agent_type === 'planner' ? <Lightbulb className="w-3 h-3" /> :
                                 message.agent_type === 'executor' ? <Zap className="w-3 h-3" /> :
                                 message.agent_type === 'evaluator' ? <CheckCircle className="w-3 h-3" /> :
                                 <Bot className="w-3 h-3" />}
                              </div>
                              {message.streaming && (
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                              )}
                            </div>
                          )}
                          {message.sender === 'user' && (
                            <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            {message.content && (
                              <div className={`${message.sender === 'user' ? 'text-white' : 'text-gray-900'}`}>
                                <MarkdownRenderer content={message.content} />
                              </div>
                            )}
                            
                            {/* Workflow Steps */}
                            {message.steps && message.steps.length > 0 && (
                              <WorkflowSteps steps={message.steps} />
                            )}

                            {/* Reasoning Trace */}
                            {message.reasoning_trace && (
                              <ReasoningTrace
                                content={message.reasoning_trace}
                                isVisible={showReasoningTraces[message.id] || false}
                                onToggle={() => toggleReasoningTrace(message.id)}
                              />
                            )}

                            {/* Message Metadata */}
                            <div className="flex items-center justify-between mt-2 text-xs">
                              <div className={`${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                                {message.timestamp.toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                                {message.confidence_score && (
                                  <span className="ml-2">
                                    • {Math.round(message.confidence_score * 100)}% confidence
                                  </span>
                                )}
                              </div>
                              {message.workflow_status && (
                                <Badge variant="outline" className="text-xs">
                                  {message.workflow_status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleSendMessage()}
                  placeholder={project ? `Ask about ${project.name}...` : "Ask about investments..."}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isProcessing}
                />
                <Button 
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Powered by DeepSeek-R1 reasoning model with multi-agent workflows
              </p>
            </div>
          </TabsContent>

          <TabsContent value="workflows" className="flex-1 p-4">
            <div className="space-y-4">
              <h3 className="font-semibold">Available Workflows</h3>
              {AGENTIC_WORKFLOWS.map((workflow) => (
                <Card key={workflow.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      {workflow.icon}
                      <div className="flex-1">
                        <h4 className="font-medium">{workflow.label}</h4>
                        <p className="text-sm text-gray-600 mt-1">{workflow.prompt}</p>
                        <div className="mt-3 space-y-2">
                          {workflow.steps.map((step, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-xs">
                              <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                                {idx + 1}
                              </div>
                              <span className="font-medium">{step.title}</span>
                              <span className="text-gray-500">- {step.description}</span>
                            </div>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          className="mt-3"
                          onClick={() => handleSendMessage(workflow.prompt, workflow.id)}
                          disabled={isProcessing}
                        >
                          Start Workflow
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Export button component
export function AgenticChatButton({ 
  project, 
  onClick 
}: { 
  project?: Project
  onClick?: () => void 
}) {
  return (
    <Button
      onClick={onClick}
      size="sm"
      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
    >
      <Brain className="w-4 h-4 mr-2" />
      AI Analyst
    </Button>
  )
}