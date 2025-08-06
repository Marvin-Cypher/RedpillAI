"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAI, AIMessage } from './UnifiedAISystem'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Search,
  Brain,
  History,
  Star,
  Check,
  Loader2,
  Maximize2,
  Minimize2,
  FileText,
  ChevronRight,
  RefreshCw,
  Save
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ResearchSection {
  id: string
  title: string
  content: string
  status: 'pending' | 'in_progress' | 'completed'
  order: number
  approved?: boolean
  timestamp?: string
  sources?: string[]
  searchQueries?: string[]
  webResults?: any[]
}

interface ResearchPlan {
  sections: {
    title: string
    description: string
    searchQueries: string[]
  }[]
  approved: boolean
}

interface ApprovalFlow {
  isActive: boolean
  proposedPlan: string
  isExecuting: boolean
  researchPlan?: ResearchPlan
}

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  type?: 'text' | 'research' | 'loading'
  sections?: ResearchSection[]
  chatId?: string
  isStarred?: boolean
  metadata?: {
    reasoning?: string
    confidence?: number
    sources?: string[]
    model?: string
    usage?: any
    chat_id?: string
    timestamp?: string
  }
}

interface OpenResearchCanvasProps {
  projectId?: string
  projectName?: string
  projectType?: 'company' | 'deal' | 'open'
  memoId?: string
  isOpen?: boolean
  onClose?: () => void
  onSaveMemo?: (memo: { title: string; content: string; chatId: string; sections?: ResearchSection[] }) => void
}

export function OpenResearchCanvas({ 
  projectId, 
  projectName = 'Dashboard', 
  projectType = 'open',
  memoId,
  isOpen = true,
  onClose,
  onSaveMemo
}: OpenResearchCanvasProps) {
  console.log('🎨 OpenResearchCanvas render:', { isOpen, projectName, projectType })
  const { currentSession, sendMessage, addMessage, isTyping, isResearching, saveMemo } = useAI()
  const [isExpanded, setIsExpanded] = useState(isResearching)
  const [inputValue, setInputValue] = useState('')
  const [researchSections, setResearchSections] = useState<ResearchSection[]>([])
  const [approvedSections, setApprovedSections] = useState<number[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState<string>('')
  const [documentZoom, setDocumentZoom] = useState(100)
  const [approvalFlow, setApprovalFlow] = useState<ApprovalFlow>({
    isActive: false,
    proposedPlan: '',
    isExecuting: false
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Load memo if provided
  useEffect(() => {
    if (memoId && isOpen) {
      loadMemo(memoId)
    }
  }, [memoId, isOpen])

  const loadMemo = async (memoId: string) => {
    try {
      // Generate storage key that matches deal page expectations
      const storageKey = projectId ? `memos-${projectId}` : `memos-${projectType}-general`
      
      // Load memo from localStorage or API
      const memos = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const memo = memos.find((m: any) => m.id === memoId)
      
      if (memo) {
        setCurrentChatId(memo.chatId)
        setIsExpanded(true)
        setResearchSections(memo.sections || [])
      }
    } catch (error) {
      console.error('Error loading memo:', error)
    }
  }

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Get messages from current session
  const messages = currentSession?.messages || []
  
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])
  
  // Update chat ID when session changes
  useEffect(() => {
    if (currentSession?.id) {
      setCurrentChatId(currentSession.id)
    }
  }, [currentSession])

  // Auto-expand when research mode is activated
  useEffect(() => {
    if (isResearching && !isExpanded) {
      console.log('🔬 Auto-expanding research canvas due to research mode')
      setIsExpanded(true)
    }
  }, [isResearching, isExpanded])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return

    const messageToSend = inputValue
    setInputValue('')

    // Auto-expand to canvas immediately
    if (!isExpanded) {
      setIsExpanded(true)
    }

    // Check if this should trigger research mode
    const researchKeywords = ['research', 'analyze', 'analysis', 'deep', 'search', 'investigate', 'study', 'explore', 'examine']
    const shouldTriggerResearch = researchKeywords.some(keyword => 
      messageToSend.toLowerCase().includes(keyword)
    )
    
    if (shouldTriggerResearch) {
      console.log('🔍 Triggering structured research for:', messageToSend)
      // Trigger structured research workflow
      await handleStructuredResearch(messageToSend)
    } else {
      console.log('💬 Regular chat mode for:', messageToSend)
      // Use UnifiedAISystem's sendMessage for regular chat
      await sendMessage(messageToSend)
    }
  }

  const handleApproval = (index: number, content: string) => {
    setApprovedSections(prev => [...prev, index])
    
    const newSection: ResearchSection = {
      id: `approved-${index}`,
      title: `Research Section ${index + 1}`,
      content: content,
      status: 'completed',
      order: index,
      approved: true,
      timestamp: new Date().toISOString()
    }
    
    setResearchSections(prev => [...prev, newSection])
  }

  const handleRegenerate = async (index: number) => {
    const message = messages[index]
    if (!message || message.sender !== 'ai') return
    
    setIsTyping(true)
    setStreamingContent('🔄 **Regenerating response...**\n\nCreating improved analysis...')
    
    try {
      // Call backend to regenerate using Next.js proxy route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Please regenerate and improve the previous response about: ${message.content.substring(0, 100)}...`,
          projectId: projectId,
          conversationHistory: messages.slice(0, index).map(msg => ({
            role: msg.sender,
            content: msg.content,
            timestamp: msg.timestamp
          }))
        })
      })
      
      if (!response.ok) {
        throw new Error(`Regeneration failed: ${response.status}`)
      }
      
      const responseData = await response.json()
      console.log('Regeneration complete, new content received:', responseData.response?.substring(0, 100))
    } catch (error) {
      console.error('Regeneration error:', error)
    } finally {
      setIsTyping(false)
      setStreamingContent('')
    }
  }

  const handleSaveMemo = (content: string) => {
    console.log('💾 Saving memo with content:', content.substring(0, 100))
    
    // Use the AI context saveMemo function
    const memo = saveMemo(content, `Research Memo - ${projectName}`)
    
    if (memo) {
      console.log('✅ Memo saved successfully:', memo.id)
      
      // Call parent callback if provided
      onSaveMemo?.({
        title: memo.title,
        content: memo.content,
        chatId: memo.chatId,
        sections: researchSections
      })
    } else {
      console.error('❌ Failed to save memo')
    }
  }

  const handleApproveResearchPlan = async () => {
    if (!approvalFlow.researchPlan) return
    
    setApprovalFlow(prev => ({ ...prev, isExecuting: true }))
    
    // Clear existing research sections
    setResearchSections([])
    
    const { sections } = approvalFlow.researchPlan
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      setStreamingContent(`📝 **Researching: ${section.title}**\n\n${section.description}\n\nExecuting searches and analysis...`)
      
      try {
        // Simulate web searches for each query
        const searchResults: any[] = []
        for (const query of section.searchQueries) {
          setStreamingContent(`🔍 **Searching: "${query}"**\n\nGathering relevant information...`)
          await new Promise(resolve => setTimeout(resolve, 800))
          
          // Mock search results (in real implementation, this would call a search API)
          searchResults.push({
            query,
            results: [
              { title: `Result for ${query}`, url: '#', snippet: `Relevant information about ${query}...` }
            ]
          })
        }

        // Generate analysis based on search results using Next.js API route
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `[SYSTEM_TASK] Generate comprehensive analysis for "${section.title}" about ${projectName}. 
            
Focus on: ${section.description}

Previous queries: ${section.searchQueries.join(', ')}

Provide detailed analysis with:
- Key findings and insights
- Data points and metrics where relevant
- Professional VC perspective
- Actionable conclusions

Format as a well-structured markdown section with clear headings and bullet points.`,
            projectId: projectId,
            conversationHistory: messages.map(msg => ({
              role: msg.sender,
              content: msg.content,
              timestamp: msg.timestamp
            }))
          })
        })
        
        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`)
        }
        
        const responseData = await response.json()
        const analysisContent = responseData.response || responseData.content || `## ${section.title}\n\n${section.description}\n\n*Analysis not available*`
          
          // Create research section
          const newSection: ResearchSection = {
            id: `section-${Date.now()}-${i}`,
            title: section.title,
            content: analysisContent,
            status: 'completed',
            order: i,
            approved: false,
            timestamp: new Date().toISOString(),
            sources: [`AI Analysis`, `Web Research`],
            searchQueries: section.searchQueries,
            webResults: searchResults
          }
          
          setResearchSections(prev => [...prev, newSection])
          
          // Add as a message to the UnifiedAISystem session for persistence
          const aiMessage: AIMessage = {
            id: `research-${Date.now()}-${i}`,
            content: `## ${section.title}\n\n${analysisContent}`,
            sender: 'ai',
            timestamp: new Date(),
            type: 'research',
            chatId: currentChatId,
            metadata: {
              reasoning: `Research section for ${section.title}`,
              confidence: 0.85,
              sources: [`Research: ${section.title}`, 'AI Analysis'],
              model: responseData.model || 'AI Assistant',
              usage: responseData.usage,
              chat_id: responseData.chat_id
            }
          }
          
        // Use the addMessage function to properly integrate with UnifiedAISystem
        addMessage(aiMessage)
        console.log('📧 Added research message to session via addMessage:', aiMessage.id)
      } catch (error) {
        console.error(`Error generating ${section.title}:`, error)
        
        // Add error section
        const errorSection: ResearchSection = {
          id: `section-error-${Date.now()}-${i}`,
          title: section.title,
          content: `## ${section.title}\n\nError occurred during research. Please try again.`,
          status: 'completed',
          order: i,
          approved: false,
          timestamp: new Date().toISOString()
        }
        
        setResearchSections(prev => [...prev, errorSection])
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    setStreamingContent('✅ **Research Complete**\n\nAll sections have been analyzed. Review the findings below.')
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setStreamingContent('')
    setApprovalFlow({ isActive: false, proposedPlan: '', isExecuting: false })
  }

  const handleStructuredResearch = async (query: string) => {
    console.log('🎯 handleStructuredResearch called with query:', query)
    console.log('📧 Current session before structured research:', currentSession?.id, 'messages:', currentSession?.messages?.length)
    
    // First, send the user message through the unified system
    try {
      await sendMessage(query)
      console.log('✅ User message sent through UnifiedAISystem')
      console.log('📧 Current session after user message:', currentSession?.id, 'messages:', currentSession?.messages?.length)
    } catch (error) {
      console.error('❌ Error sending user message:', error)
    }
    
    setStreamingContent('🔍 **Planning Research Structure...**\n\nAnalyzing your query and designing optimal research approach...')
    console.log('📝 Set streaming content for research planning')
    
    try {
      // Generate research plan
      const planResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `[SYSTEM_TASK] Generate a structured analysis plan for: "${query}". 

Project: "${projectName}"

Create exactly 5 sections. Each section needs:
- Title (clear and specific)
- Description (what will be analyzed)
- Search queries (3 specific queries)

Return ONLY a JSON object with this structure:
{
  "sections": [
    {
      "title": "string",
      "description": "string",
      "searchQueries": ["string", "string", "string"]
    }
  ]
}`,
          projectId: projectId,
          conversationHistory: messages.map(msg => ({
            role: msg.sender,
            content: msg.content,
            timestamp: msg.timestamp
          }))
        })
      })

      if (planResponse.ok) {
        const planData = await planResponse.json()
        let researchPlan: ResearchPlan
        
        try {
          // Try to parse the JSON response
          const planContent = planData.response || planData.content
          
          // Check if the response contains the literal template strings
          if (planContent.includes('"string"') || planContent.includes('string: string')) {
            console.warn('⚠️ AI returned template strings, using fallback plan')
            throw new Error('Template strings in response')
          }
          
          const jsonMatch = planContent.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsedPlan = JSON.parse(jsonMatch[0])
            // Validate that sections have actual content
            if (parsedPlan.sections && 
                parsedPlan.sections.length > 0 && 
                parsedPlan.sections[0].title !== "string" &&
                parsedPlan.sections[0].title !== "") {
              researchPlan = {
                sections: parsedPlan.sections,
                approved: false
              }
            } else {
              throw new Error('Invalid section data')
            }
          } else {
            throw new Error('No JSON found in response')
          }
        } catch (parseError) {
          console.log('📋 Using intelligent fallback research plan for:', query, projectName)
          // Create intelligent fallback based on the query context
          const queryLower = query.toLowerCase()
          const projectNameClean = projectName || 'the project'
          
          // Determine research focus based on query
          let sections = []
          
          if (queryLower.includes('deal') || queryLower.includes('investment')) {
            sections = [
              {
                title: "Investment Thesis",
                description: "Core value proposition and investment rationale",
                searchQueries: [`${projectNameClean} investment thesis`, `${projectNameClean} value proposition`, `${projectNameClean} growth potential`]
              },
              {
                title: "Market Opportunity",
                description: "Total addressable market and growth dynamics",
                searchQueries: [`${projectNameClean} TAM market size`, `${projectNameClean} market growth`, `${projectNameClean} industry trends 2024`]
              },
              {
                title: "Competitive Analysis",
                description: "Competitive positioning and differentiation",
                searchQueries: [`${projectNameClean} vs competitors`, `${projectNameClean} competitive advantage`, `${projectNameClean} market share`]
              },
              {
                title: "Financial Metrics",
                description: "Key financial indicators and valuation",
                searchQueries: [`${projectNameClean} revenue valuation`, `${projectNameClean} funding history`, `${projectNameClean} financial performance`]
              },
              {
                title: "Risk Assessment",
                description: "Key risks and mitigation strategies",
                searchQueries: [`${projectNameClean} business risks`, `${projectNameClean} challenges`, `${projectNameClean} risk factors`]
              }
            ]
          } else if (queryLower.includes('company') || queryLower.includes('research')) {
            sections = [
              {
                title: "Company Overview",
                description: "Business model, products, and services",
                searchQueries: [`${projectNameClean} company overview`, `${projectNameClean} business model`, `${projectNameClean} products services`]
              },
              {
                title: "Market Position",
                description: "Industry standing and market dynamics",
                searchQueries: [`${projectNameClean} market position`, `${projectNameClean} industry analysis`, `${projectNameClean} market share 2024`]
              },
              {
                title: "Technology & Innovation",
                description: "Technical capabilities and innovation strategy",
                searchQueries: [`${projectNameClean} technology stack`, `${projectNameClean} innovation`, `${projectNameClean} R&D capabilities`]
              },
              {
                title: "Team & Leadership",
                description: "Management team and organizational strength",
                searchQueries: [`${projectNameClean} leadership team`, `${projectNameClean} founders executives`, `${projectNameClean} company culture`]
              },
              {
                title: "Growth Strategy",
                description: "Expansion plans and strategic initiatives",
                searchQueries: [`${projectNameClean} growth strategy`, `${projectNameClean} expansion plans`, `${projectNameClean} strategic roadmap`]
              }
            ]
          } else {
            // Generic research structure
            sections = [
              {
                title: "Executive Summary",
                description: "Overview and key highlights",
                searchQueries: [`${projectNameClean} overview`, `${projectNameClean} summary`, `${projectNameClean} key facts`]
              },
              {
                title: "Market Analysis",
                description: "Current market conditions and trends",
                searchQueries: [`${projectNameClean} market analysis`, `${projectNameClean} industry trends`, `${projectNameClean} market size`]
              },
              {
                title: "Competitive Landscape",
                description: "Key competitors and positioning",
                searchQueries: [`${projectNameClean} competitors`, `${projectNameClean} competitive analysis`, `${projectNameClean} market leaders`]
              },
              {
                title: "Technical Assessment",
                description: "Technology and capabilities",
                searchQueries: [`${projectNameClean} technology`, `${projectNameClean} technical analysis`, `${projectNameClean} capabilities`]
              },
              {
                title: "Strategic Outlook",
                description: "Future prospects and recommendations",
                searchQueries: [`${projectNameClean} future outlook`, `${projectNameClean} strategic plans`, `${projectNameClean} growth prospects`]
              }
            ]
          }
          
          researchPlan = {
            sections: sections,
            approved: false
          }
        }

        // Show research plan for approval
        const planSummary = researchPlan.sections.map((section, index) => 
          `${index + 1}. **${section.title}**: ${section.description}`
        ).join('\n')

        console.log('✅ Setting approval flow active with plan:', researchPlan)
        
        // Add the approval message to the session
        const approvalMessage: AIMessage = {
          id: `approval-${Date.now()}`,
          content: `I've designed a comprehensive research plan for "${query}":\n\n${planSummary}\n\nEach section will include web searches and detailed analysis. Would you like me to proceed with this research structure?`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'approval',
          chatId: currentChatId,
          metadata: {
            confidence: 0.9,
            sources: ['Research Planning', 'AI Analysis']
          }
        }
        
        addMessage(approvalMessage)
        console.log('📋 Added approval message to session:', approvalMessage.id)
        
        setApprovalFlow({
          isActive: true,
          proposedPlan: `I've designed a comprehensive research plan for "${query}":\n\n${planSummary}\n\nEach section will include web searches and detailed analysis. Would you like me to proceed with this research structure?`,
          isExecuting: false,
          researchPlan
        })

        setStreamingContent('')
        console.log('🎯 Approval flow should now be visible')
      }
    } catch (error) {
      console.error('❌ Error generating research plan:', error)
      setStreamingContent('')
      
      // Show fallback approval with default plan
      console.log('🔄 Falling back to default research plan')
      const fallbackPlan: ResearchPlan = {
        sections: [
          {
            title: "Market Analysis",
            description: "Current market conditions, size, and trends",
            searchQueries: [`${projectName} market analysis`, `${projectName} industry trends`]
          },
          {
            title: "Competitive Analysis", 
            description: "Key competitors and competitive positioning",
            searchQueries: [`${projectName} competitors`, `${projectName} competitive landscape`]
          },
          {
            title: "Technical Assessment",
            description: "Technology, innovation, and capabilities",
            searchQueries: [`${projectName} technology`, `${projectName} technical analysis`]
          }
        ],
        approved: false
      }
      
      const fallbackSummary = fallbackPlan.sections.map((section, index) => 
        `${index + 1}. **${section.title}**: ${section.description}`
      ).join('\n')
      
      // Add fallback approval message to session
      const fallbackApprovalMessage: AIMessage = {
        id: `approval-fallback-${Date.now()}`,
        content: `I've created a research plan for "${query}":\n\n${fallbackSummary}\n\nWould you like me to proceed with this research structure?`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'approval',
        chatId: currentChatId,
        metadata: {
          confidence: 0.8,
          sources: ['Fallback Research Planning', 'AI Analysis']
        }
      }
      
      addMessage(fallbackApprovalMessage)
      console.log('📋 Added fallback approval message to session:', fallbackApprovalMessage.id)
      
      setApprovalFlow({
        isActive: true,
        proposedPlan: `I've created a research plan for "${query}":\n\n${fallbackSummary}\n\nWould you like me to proceed with this research structure?`,
        isExecuting: false,
        researchPlan: fallbackPlan
      })
      
      console.log('✅ Fallback approval flow set')
    }
  }

  const handleRejectResearchPlan = () => {
    setApprovalFlow({ isActive: false, proposedPlan: '', isExecuting: false })
    
    const rejectionMessage: AIMessage = {
      id: `rejection-${Date.now()}`,
      content: "I understand you'd like a different approach. Please let me know what specific research areas you'd like me to focus on instead.",
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    }
    
    // Add rejection message through UnifiedAISystem
    addMessage(rejectionMessage)
  }

  if (!isOpen) return null

  // Sidebar mode - before expansion
  if (!isExpanded) {
    return (
      <div className="fixed right-4 bottom-4 z-40 w-96 bg-background rounded-lg shadow-2xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI Research Assistant</h3>
                <p className="text-xs text-muted-foreground">
                  {projectName} | {currentChatId || 'Starting...'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-md'
                    : 'bg-muted text-foreground rounded-2xl rounded-bl-md'
                } px-4 py-2`}>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              disabled={isTyping}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Expanded canvas mode
  return (
    <div className="fixed inset-0 z-50 bg-background flex">
      {/* Left side - Research Canvas */}
      <div className="w-1/2 bg-background overflow-y-auto border-r border-border">
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Research Document
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {projectName} Analysis | Chat ID: {currentChatId}
            </p>
          </div>

          {researchSections.length === 0 && !streamingContent && !isTyping && !approvalFlow.isActive ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Start by asking a research question
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Ask detailed questions about {projectName} and I&apos;ll help you conduct comprehensive research and analysis.
                </p>
              </div>
            </div>
          ) : (
            <div 
              className="research-document"
              style={{ 
                transform: `scale(${documentZoom / 100})`,
                transformOrigin: 'top left',
                minHeight: '100%',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
              }}
            >
              {/* Research Document Header */}
              <div className="mb-8 p-6 bg-gradient-to-r from-muted/50 to-blue-50 dark:from-muted/20 dark:to-blue-950/20 border border-border rounded-lg shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground mb-3 flex items-center">
                      📄 Research Document
                    </h1>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="font-medium text-foreground w-20">Project:</span>
                          <span className="font-mono text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20 px-2 py-1 rounded text-xs">{projectName}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium text-foreground w-20">Query:</span>
                          <span className="italic">{messages.filter(m => m.sender === 'user').pop()?.content || 'Analysis'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="font-medium text-foreground w-16">Date:</span>
                          <span className="font-mono text-xs">{new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-medium text-foreground w-16">Session:</span>
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{currentChatId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      onClick={() => setDocumentZoom(prev => Math.min(150, prev + 10))}
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                    >
                      🔍+
                    </Button>
                    <Button
                      onClick={() => setDocumentZoom(prev => Math.max(50, prev - 10))}
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                    >
                      🔍-
                    </Button>
                    <span className="text-xs text-muted-foreground text-center">{documentZoom}%</span>
                  </div>
                </div>
              </div>

              {/* Show thinking indicator */}
              {(isTyping && !streamingContent) && (
                <div className="mb-8 p-4 bg-muted/50 border-l-4 border-muted-foreground/40">
                  <div className="flex items-center">
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin mr-2" />
                    <span className="font-medium text-foreground">AI is thinking...</span>
                  </div>
                </div>
              )}

              {/* Show streaming content */}
              {streamingContent && (
                <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400">
                  <div className="flex items-center mb-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin mr-2" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">Research in Progress</span>
                  </div>
                  <div className="prose prose-sm max-w-none text-blue-800 dark:text-blue-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {streamingContent}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Research Plan Approval */}
              {approvalFlow.isActive && (
                <div className="mb-8 bg-background border border-amber-200 dark:border-amber-800 rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-b border-amber-200 dark:border-amber-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                        <span className="text-lg">📋</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                          Research Plan Approval Required
                        </h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          Review the proposed research structure below
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="bg-background border border-border rounded-lg p-4 mb-4">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => <h1 className="text-lg font-bold text-foreground mb-3">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-semibold text-foreground mb-2">{children}</h2>,
                            p: ({ children }) => <p className="mb-2 text-foreground leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="mb-2 pl-4 space-y-1">{children}</ul>,
                            li: ({ children }) => <li className="text-foreground leading-relaxed">{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>
                          }}
                        >
                          {approvalFlow.proposedPlan}
                        </ReactMarkdown>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        This will create {approvalFlow.researchPlan?.sections.length || 5} research sections
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleRejectResearchPlan}
                          size="sm"
                          variant="outline"
                          disabled={approvalFlow.isExecuting}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Modify Plan
                        </Button>
                        <Button
                          onClick={handleApproveResearchPlan}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                          disabled={approvalFlow.isExecuting}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {approvalFlow.isExecuting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Executing Research...
                            </>
                          ) : (
                            'Approve & Start Research'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Research Sections */}
              {researchSections.length > 0 && (
                <div className="space-y-6">
                  <div className="mb-6 p-4 bg-background border border-border rounded-lg shadow-sm">
                    <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                      📑 Research Sections
                    </h2>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-muted-foreground">{researchSections.length} sections total</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-muted-foreground">{researchSections.filter(s => s.status === 'completed').length} completed</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span className="text-muted-foreground">{researchSections.filter(s => s.approved).length} approved</span>
                      </div>
                    </div>
                  </div>
                  
                  {researchSections.map((section, index) => (
                    <div key={section.id} className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
                      {/* Section Header */}
                      <div className="px-6 py-4 bg-gradient-to-r from-muted/50 to-slate-50 dark:from-muted/20 dark:to-slate-950/20 border-b border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">{index + 1}</span>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                  {section.title}
                                </h3>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      section.status === 'completed' 
                                        ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                                        : section.status === 'in_progress'
                                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                                        : 'bg-muted text-muted-foreground border-border'
                                    }`}
                                  >
                                    {section.status === 'completed' ? '✓ Complete' : 
                                     section.status === 'in_progress' ? '⏳ In Progress' : 
                                     '⏸️ Pending'}
                                  </Badge>
                                  {section.timestamp && (
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(section.timestamp).toLocaleTimeString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => handleSaveMemo(section.content)}
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20 text-xs"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Section Content */}
                      <div className="p-6">
                        <div className="mb-4">
                          <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
                            <div className="prose prose-gray max-w-none p-6" style={{
                              fontSize: '14px',
                              lineHeight: '1.6'
                            }}>
                              <div className="markdown-body">
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    h1: ({ children }) => <h1 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-lg font-semibold text-foreground mb-3 mt-6">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-base font-semibold text-foreground mb-2 mt-4">{children}</h3>,
                                    p: ({ children }) => <p className="mb-3 text-foreground leading-relaxed">{children}</p>,
                                    ul: ({ children }) => <ul className="mb-3 pl-4 space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="mb-3 pl-4 space-y-1">{children}</ol>,
                                    li: ({ children }) => <li className="text-foreground leading-relaxed">{children}</li>,
                                    code: ({ children, className }) => {
                                      const inline = !className
                                      return inline ? (
                                        <code className="px-1 py-0.5 bg-muted text-foreground rounded text-sm font-mono">{children}</code>
                                      ) : (
                                        <code className="block p-3 bg-muted text-foreground rounded-md text-sm font-mono overflow-x-auto">{children}</code>
                                      )
                                    },
                                    blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-200 dark:border-blue-800 pl-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-foreground italic mb-3">{children}</blockquote>,
                                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                                    em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                                    a: ({ children, href }) => <a href={href} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>
                                  }}
                                >
                                  {section.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Research metadata */}
                        {section.searchQueries && section.searchQueries.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div><strong>Research Queries:</strong> {section.searchQueries.join(', ')}</div>
                              <div><strong>Generated:</strong> {new Date(section.timestamp || Date.now()).toLocaleString()}</div>
                              {section.sources && (
                                <div><strong>Sources:</strong> {section.sources.join(', ')}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Research Summary */}
              {researchSections.length > 0 && (
                <div className="mt-12 bg-background border border-border rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b border-border">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <span className="text-lg">📊</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-green-900 dark:text-green-100">Research Summary</h2>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Complete analysis of {projectName}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="prose prose-sm max-w-none text-foreground mb-6">
                      <p className="text-base leading-relaxed">
                        This research analysis provides comprehensive insights into <strong>{projectName}</strong> based on available data. 
                        The findings are organized into <strong>{researchSections.length} key sections</strong> covering various aspects 
                        of the analysis, including market conditions, competitive landscape, technical capabilities, and strategic considerations.
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-r from-muted/50 to-slate-50 dark:from-muted/20 dark:to-slate-950/20 rounded-lg p-4 border border-border">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex flex-col items-center p-3 bg-background rounded-lg shadow-sm">
                          <div className="text-2xl font-bold text-blue-600">{researchSections.length}</div>
                          <div className="text-muted-foreground text-center">Total Sections</div>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-background rounded-lg shadow-sm">
                          <div className="text-2xl font-bold text-green-600">
                            {researchSections.filter(s => s.status === 'completed').length}
                          </div>
                          <div className="text-muted-foreground text-center">Completed</div>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-background rounded-lg shadow-sm">
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.round((researchSections.filter(s => s.status === 'completed').length / researchSections.length) * 100)}%
                          </div>
                          <div className="text-muted-foreground text-center">Progress</div>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-background rounded-lg shadow-sm">
                          <div className="text-lg font-bold text-muted-foreground">
                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-muted-foreground text-center">Generated</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                        <div>Session ID: <span className="font-mono bg-muted px-2 py-1 rounded">{currentChatId}</span></div>
                        <div>Last updated: {new Date().toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side - Chat */}
      <div className="w-1/2 bg-background flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-blue-500 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="w-5 h-5 text-white mr-2" />
              <h3 className="text-lg font-semibold text-white">AI Research Assistant</h3>
            </div>
            <div className="flex items-center gap-2">
              {currentChatId && (
                <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">
                  {currentChatId}
                </span>
              )}
              <Button
                onClick={onClose}
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-blue-100 mt-1">
            Project: {projectName}
          </p>
        </div>

        {/* Messages */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-4 py-2 ${
                message.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-muted text-foreground'
              }`}>
                <div className="text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
                {message.metadata && (
                  <div className="text-xs opacity-70 mt-1">
                    {message.metadata.timestamp}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg px-4 py-2 bg-muted text-foreground">
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm">Researching...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about this project..."
              className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-background"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}