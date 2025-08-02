'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Search,
  Brain,
  History,
  BookOpen,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { VCAssistant } from '@/lib/ai/vc-assistant'
import { SearchInterface } from './SearchInterface'

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  type?: 'text' | 'search_result' | 'research_summary'
  metadata?: any
}

interface EnhancedAIChatProps {
  projectId?: string
  projectName?: string
  children: React.ReactNode
  isOpen?: boolean
  onToggle?: (open: boolean) => void
}

export function EnhancedAIChat({ 
  projectId, 
  projectName = "Project", 
  children,
  isOpen = false,
  onToggle 
}: EnhancedAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: projectId 
        ? `Hello! I'm your AI assistant for ${projectName}. I have advanced search and research capabilities:\n\n🔍 **Quick Search** - Fast web results\n🌐 **Web Research** - Comprehensive analysis\n🧠 **Deep Research** - Multi-step agentic investigation\n📊 **Market Data** - Financial analysis\n\nHow can I help you research and analyze information today?`
        : "Hello! I'm your AI assistant with powerful search and research capabilities. I can help you with investment analysis, market research, and comprehensive due diligence. What would you like to explore?",
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'search' | 'history'>('chat')
  const [searchHistory, setSearchHistory] = useState<any[]>([])
  const [researchProgress, setResearchProgress] = useState<any[]>([])
  const [isResearching, setIsResearching] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [latestChatId, setLatestChatId] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isManuallyToggled, setIsManuallyToggled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [vcAssistant, setVcAssistant] = useState<VCAssistant | null>(null)

  // Auto-expand during research unless manually toggled
  useEffect(() => {
    if (!isManuallyToggled) {
      if (isResearching || (researchProgress.length > 0 && !researchProgress.every(p => p.status === 'complete'))) {
        console.log('🔍 Auto-expanding to fullscreen for research...')
        setIsFullscreen(true)
      } else if (researchProgress.length > 0 && researchProgress.every(p => p.status === 'complete')) {
        // Delay collapse to show final results
        console.log('✅ Research complete, auto-collapsing in 3s...')
        const timer = setTimeout(() => setIsFullscreen(false), 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [isResearching, researchProgress, isManuallyToggled])

  useEffect(() => {
    // Initialize VC Assistant with API key
    const apiKey = process.env.NEXT_PUBLIC_REDPILL_API_KEY || 'demo-key'
    const coinGeckoKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || ''
    
    console.log('Initializing VC Assistant:', {
      hasApiKey: !!apiKey && apiKey !== 'demo-key',
      hasCoinGeckoKey: !!coinGeckoKey,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'none'
    })
    
    setVcAssistant(new VCAssistant(apiKey, coinGeckoKey))
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !vcAssistant) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue('')
    setIsTyping(true)
    setIsResearching(false)
    setResearchProgress([])

    try {
      // Try backend with logging first
      try {
        console.log('🔄 Attempting backend chat with logging...')
        console.log('🌐 API URL from env:', process.env.NEXT_PUBLIC_API_URL)
        // Force the API URL since env vars might not be loaded
        const apiUrl = 'http://localhost:8000/api/v1'
        console.log('🎯 Using API URL:', apiUrl)
        console.log('🎯 Full URL:', `${apiUrl}/chat/ai-chat`)
        
        // Test basic connectivity first
        const testResponse = await fetch(`${apiUrl.replace('/api/v1', '')}/health`, {
          method: 'GET',
        }).catch(() => null)
        
        console.log('🏥 Health check:', testResponse?.ok ? 'OK' : 'Failed')
        
        const backendResponse = await fetch(`${apiUrl}/chat/ai-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          },
          body: JSON.stringify({
            message: currentInput,
            project_id: projectId,
            project_type: projectId ? 'company' : null,
            conversation_history: messages.map(msg => ({
              role: msg.sender,
              content: msg.content,
              timestamp: msg.timestamp
            }))
          })
        })

        if (!backendResponse.ok) {
          const errorData = await backendResponse.json().catch(() => ({}))
          console.error('❌ Backend chat failed:', {
            status: backendResponse.status,
            statusText: backendResponse.statusText,
            error: errorData,
            url: `${apiUrl}/chat/ai-chat`
          })
          throw new Error(`Backend error: ${backendResponse.status}`)
        }

        const backendData = await backendResponse.json()
        console.log('📦 Backend response:', backendData)
        
        if (backendData.chat_id) {
          setLatestChatId(backendData.chat_id)
          console.log(`✅ Chat logged with ID: ${backendData.chat_id}`)
          console.log('🔍 Setting latestChatId state:', backendData.chat_id)
          
          // Force a re-render to ensure UI updates
          setTimeout(() => {
            console.log('🔄 Current latestChatId state:', backendData.chat_id)
          }, 100)
        } else {
          console.error('❌ No chat_id in backend response:', backendData)
        }
        
        // Display chat ID in the UI
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: backendData.content,
          sender: 'ai',
          timestamp: new Date(),
          type: 'text',
          metadata: {
            chat_id: backendData.chat_id,
            model: backendData.model,
            usage: backendData.usage
          }
        }
        
        setMessages(prev => [...prev, aiResponse])
        setIsResearching(false)
        setIsTyping(false)
        return
      } catch (backendError) {
        console.warn('⚠️ Backend logging failed, using frontend AI:', backendError)
        // Continue with frontend AI below
      }
      
      // Check if this might trigger research
      const isLikelyResearch = currentInput.toLowerCase().includes('research') || 
                              currentInput.toLowerCase().includes('latest') ||
                              currentInput.toLowerCase().includes('current') ||
                              currentInput.toLowerCase().includes('find') ||
                              currentInput.toLowerCase().includes('arr') ||
                              currentInput.toLowerCase().includes('analysis')

      console.log('🔍 Chat input analysis:', {
        input: currentInput,
        isLikelyResearch,
        hasVcAssistant: !!vcAssistant,
        projectId,
        projectName
      })

      let response: string

      if (isLikelyResearch) {
        setIsResearching(true)
        
        // Use VC Assistant with step callback for progress
        response = await vcAssistant.chat(
          currentInput,
          projectId,
          messages.map(msg => ({
            id: msg.id,
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: msg.timestamp
          })),
          // Step update callback
          (step) => {
            console.log('Research step update:', step)
            setResearchProgress(prev => {
              const updated = [...prev]
              const existingIndex = updated.findIndex(p => p.step === step.type)
              
              if (existingIndex >= 0) {
                updated[existingIndex] = {
                  step: step.type,
                  status: step.status,
                  title: step.title,
                  content: step.content,
                  reasoning: step.reasoning
                }
              } else {
                updated.push({
                  step: step.type,
                  status: step.status,
                  title: step.title,
                  content: step.content,
                  reasoning: step.reasoning
                })
              }
              
              return updated
            })
          }
        )
      } else {
        // Regular chat response
        response = await vcAssistant.chat(
          currentInput,
          projectId,
          messages.map(msg => ({
            id: msg.id,
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: msg.timestamp
          }))
        )
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Chat error:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        hasVcAssistant: !!vcAssistant
      })
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `I encountered an error processing your request: ${error instanceof Error ? error.message : 'Unknown error'}\n\nYou can try using the Search tab for research queries, or check the console for detailed error logs.`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsTyping(false)
      setIsResearching(false)
    }
  }

  const handleSearchResult = (result: any) => {
    console.log('Search result received:', result)
    
    // Add search result to chat as a special message
    const searchMessage: Message = {
      id: Date.now().toString(),
      content: formatSearchResult(result),
      sender: 'ai',
      timestamp: new Date(),
      type: 'search_result',
      metadata: result
    }

    setMessages(prev => [...prev, searchMessage])
    
    // Add to search history
    setSearchHistory(prev => [result, ...prev.slice(0, 19)]) // Keep last 20
    
    // Switch back to chat tab to show results
    setActiveTab('chat')
  }

  const formatSearchResult = (result: any): string => {
    switch (result.type) {
      case 'web_research':
        return `## Web Research Results\n\n**Query:** ${result.query}\n\n**Summary:**\n${result.summary}\n\n**Key Findings:**\n${result.keyFindings.map((f: string) => `• ${f}`).join('\n')}\n\n**Confidence:** ${result.confidence}\n**Sources:** ${result.sources.length} sources analyzed`
      
      case 'deep_research':
        return `## Deep Research Analysis\n\n**Query:** ${result.query}\n\n**Research Synthesis:**\n${result.synthesis}\n\n**Key Findings:**\n${result.findings.map((f: string) => `• ${f}`).join('\n')}\n\n**Confidence Score:** ${Math.round(result.confidence * 100)}%\n**Research Plan:** ${result.researchPlan.length} steps completed`
      
      case 'market_analysis':
        return `## Market Analysis\n\n**Query:** ${result.query}\n${result.projectName ? `**Project:** ${result.projectName}\n` : ''}\n**Analysis:**\n${result.analysis}`
      
      default:
        if (result.title && result.snippet) {
          return `## Search Result\n\n**${result.title}**\n\n${result.snippet}\n\n**Source:** ${result.source}\n**URL:** ${result.url}`
        }
        return `## Search Result\n\n${JSON.stringify(result, null, 2)}`
    }
  }

  const addToMemo = async (message: Message) => {
    try {
      const memoContent = `
## AI Research Finding
**Date**: ${message.timestamp.toLocaleString()}
**Query**: ${messages.find(m => m.id < message.id && m.sender === 'user')?.content || 'N/A'}

### Analysis:
${message.content}

${researchProgress.length > 0 ? `
### Research Steps:
${researchProgress.map(p => `- ${p.title}: ${p.content}`).join('\n')}
` : ''}
`
      await navigator.clipboard.writeText(memoContent)
      setCopiedMessageId(message.id)
      setTimeout(() => setCopiedMessageId(null), 2000)
      
      console.log('✅ Added to memo (copied to clipboard)')
    } catch (error) {
      console.error('Failed to add to memo:', error)
    }
  }

  const quickSearchSuggestions = [
    `Latest funding rounds in ${projectName || 'crypto'}`,
    `Market analysis for ${projectName || 'blockchain projects'}`,
    `Competitive landscape research`,
    `Team background and credentials`,
    `Technology and product updates`
  ]

  if (!isOpen) return <>{children}</>

  return (
    <div className="flex h-screen relative">
      <div className={`${isFullscreen ? 'hidden' : 'flex-1 w-0'}`}>
        {children}
      </div>
      
      {/* Enhanced AI Sidebar */}
      <div className={`${isFullscreen ? 'w-full' : 'hidden lg:flex w-96 max-w-[400px] min-w-[320px]'} bg-white border-l border-gray-200 flex-col shadow-lg`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                <p className="text-xs text-gray-600">
                  {projectName}
                  {latestChatId ? (
                    <span className="ml-2 font-mono text-gray-400">
                      [{latestChatId}]
                    </span>
                  ) : (
                    <span className="ml-2 text-gray-300 text-xs">
                      [No chat ID yet]
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsManuallyToggled(true)
                  setIsFullscreen(!isFullscreen)
                  // Reset manual override after a few seconds when not in research
                  if (!isResearching) {
                    setTimeout(() => setIsManuallyToggled(false), 10000)
                  }
                }}
                className="hover:bg-blue-100"
                title={isFullscreen ? "Exit fullscreen" : "Expand to fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onToggle?.(false)}
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" className="text-xs">
                <MessageSquare className="w-3 h-3 mr-1" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="search" className="text-xs">
                <Search className="w-3 h-3 mr-1" />
                Search
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs">
                <History className="w-3 h-3 mr-1" />
                History
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {projectId && (
            <Badge variant="outline" className="mt-2 text-xs">
              Project: {projectId}
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col m-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[280px] px-3 py-2 rounded-lg break-words overflow-wrap-anywhere ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'search_result'
                        ? 'bg-green-50 text-gray-900 border border-green-200'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.sender === 'ai' && (
                        <Bot className={`w-4 h-4 mt-0.5 ${
                          message.type === 'search_result' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      )}
                      {message.sender === 'user' && (
                        <User className="w-4 h-4 mt-0.5 text-white" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${
                            message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          <div className="flex items-center gap-2">
                            {message.type === 'search_result' && (
                              <Badge variant="outline" className="text-xs">
                                {message.metadata?.type || 'search'}
                              </Badge>
                            )}
                            {message.sender === 'ai' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addToMemo(message)}
                                  className="h-5 px-1"
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check className="w-3 h-3 text-green-600" />
                                  ) : (
                                    <BookOpen className="w-3 h-3" />
                                  )}
                                </Button>
                                {message.metadata?.chat_id && (
                                  <span className="text-xs text-gray-400 font-mono">
                                    {message.metadata.chat_id}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Research Progress Display */}
              {isResearching && researchProgress.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-blue-50 border border-blue-200 text-blue-900 max-w-[280px] px-3 py-2 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-medium">Research in Progress</span>
                    </div>
                    <div className="space-y-1">
                      {researchProgress.map((progress, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          {progress.status === 'complete' ? (
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : progress.status === 'active' ? (
                            <Loader2 className="w-4 h-4 text-blue-500 flex-shrink-0 animate-spin" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{progress.title}</div>
                            <div className="text-gray-600">{progress.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {isTyping && !isResearching && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 max-w-[280px] px-3 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              {/* Quick suggestions */}
              {messages.length <= 1 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-600 mb-2">Quick suggestions:</p>
                  <div className="space-y-1">
                    {quickSearchSuggestions.slice(0, 2).map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputValue(suggestion)}
                        className="block w-full text-left text-xs text-blue-600 hover:text-blue-800 truncate"
                      >
                        • {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about research, analysis, or search..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="flex-1 m-0 p-4 overflow-y-auto">
            <SearchInterface
              projectId={projectId}
              projectName={projectName}
              onResultSelect={handleSearchResult}
            />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1 m-0 p-4 overflow-y-auto">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Search History</h4>
              {searchHistory.length === 0 ? (
                <p className="text-xs text-gray-500">No search history yet</p>
              ) : (
                <div className="space-y-3">
                  {searchHistory.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {item.type || 'search'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date().toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{item.query}</p>
                      {item.summary && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {item.summary}
                        </p>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-xs h-6"
                        onClick={() => handleSearchResult(item)}
                      >
                        View in Chat
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Mobile Version - Full Screen Overlay */}
      <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
        {/* Same content but optimized for mobile */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                <p className="text-xs text-gray-600">
                  {projectName}
                  {latestChatId ? (
                    <span className="ml-2 font-mono text-gray-400">
                      [{latestChatId}]
                    </span>
                  ) : (
                    <span className="ml-2 text-gray-300 text-xs">
                      [No chat ID yet]
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle?.(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile content - simplified version */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 m-4 mb-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-1 flex flex-col m-0 px-4">
              {/* Mobile chat content - similar to desktop but with mobile optimizations */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg break-words ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex space-x-2 pb-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask or search..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="search" className="flex-1 m-0 px-4 overflow-y-auto">
              <SearchInterface
                projectId={projectId}
                projectName={projectName}
                onResultSelect={handleSearchResult}
              />
            </TabsContent>

            <TabsContent value="history" className="flex-1 m-0 px-4 overflow-y-auto">
              <div className="space-y-3">
                <h4 className="font-medium">Search History</h4>
                {searchHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">No search history</p>
                ) : (
                  searchHistory.map((item, idx) => (
                    <div key={idx} className="border rounded-lg p-3">
                      <p className="font-medium text-sm">{item.query}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {item.type}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}