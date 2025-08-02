'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MessageSquare, X, Send, Bot, User, Maximize2, Minimize2, Zap, TrendingUp, FileText, Search, DollarSign, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  type?: 'workflow' | 'normal'
  starred?: boolean
  model?: string
}

interface Project {
  id: string
  name: string
  sector: string
  stage: string
  dealStatus?: 'prospect' | 'due_diligence' | 'term_sheet' | 'closed' | 'passed'
  investmentAmount?: number
  valuation?: number
}

interface EnhancedAISidebarProps {
  project?: Project
  children: React.ReactNode
  isOpen?: boolean
  onToggle?: (open: boolean) => void
}

// Storage helper functions
const getStorageKey = (projectId?: string) => {
  return `ai-chat-history-${projectId || 'general'}`
}

const loadChatHistory = (projectId?: string): Message[] => {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(getStorageKey(projectId))
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }
  } catch (error) {
    console.error('Error loading chat history:', error)
  }
  return []
}

const saveChatHistory = (messages: Message[], projectId?: string) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(messages))
  } catch (error) {
    console.error('Error saving chat history:', error)
  }
}

const saveMemo = (message: Message, projectId?: string) => {
  if (typeof window === 'undefined') return
  
  try {
    const memosKey = `memos-${projectId || 'general'}`
    const existingMemos = JSON.parse(localStorage.getItem(memosKey) || '[]')
    
    const memo = {
      id: `memo-${Date.now()}`,
      title: `AI Insight - ${new Date().toLocaleDateString()}`,
      content: message.content,
      author: 'AI Assistant',
      date: message.timestamp.toISOString(),
      source: 'ai-chat',
      starred_at: new Date().toISOString()
    }
    
    existingMemos.push(memo)
    localStorage.setItem(memosKey, JSON.stringify(existingMemos))
    
    return memo
  } catch (error) {
    console.error('Error saving memo:', error)
    return null
  }
}

const WORKFLOW_TEMPLATES = [
  {
    id: 'due_diligence',
    icon: <Search className="w-4 h-4" />,
    label: 'Due Diligence',
    prompt: 'Start a comprehensive due diligence analysis for this company including market analysis, competitive landscape, financials, and team assessment.'
  },
  {
    id: 'market_research',
    icon: <TrendingUp className="w-4 h-4" />,
    label: 'Market Research',
    prompt: 'Analyze the market opportunity, size, growth trends, and competitive dynamics for this company.'
  },
  {
    id: 'financial_analysis',
    icon: <DollarSign className="w-4 h-4" />,
    label: 'Financial Analysis',
    prompt: 'Perform detailed financial analysis including revenue model, unit economics, burn rate, and funding requirements.'
  },
  {
    id: 'investment_memo',
    icon: <FileText className="w-4 h-4" />,
    label: 'Investment Memo',
    prompt: 'Generate a comprehensive investment memo with recommendation, risks, and key investment highlights.'
  }
]

export function EnhancedAISidebar({ 
  project,
  children,
  isOpen = false,
  onToggle 
}: EnhancedAISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load chat history on component mount and when project changes
  useEffect(() => {
    const loadedHistory = loadChatHistory(project?.id)
    
    if (loadedHistory.length === 0) {
      // Add welcome message if no history exists
      const welcomeMessage: Message = {
        id: '1',
        content: project 
          ? `Hello! I'm your AI assistant for ${project.name}. I can help with investment research, financial analysis, market intelligence, and due diligence. Use the quick-start templates below or ask me anything about this company.`
          : "Hello! I'm your AI assistant for RedPill VC. I can help with investment analysis, portfolio management, due diligence, and market research. How can I assist you today?",
        sender: 'ai',
        timestamp: new Date()
      }
      const newMessages = [welcomeMessage]
      setMessages(newMessages)
      saveChatHistory(newMessages, project?.id)
    } else {
      setMessages(loadedHistory)
    }
  }, [project?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || inputValue
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type: messageContent ? 'workflow' : 'normal'
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    saveChatHistory(updatedMessages, project?.id)
    setInputValue('')
    setIsTyping(true)

    try {
      // Call the real AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          projectId: project?.id,
          conversationHistory: updatedMessages.slice(-10).map(msg => ({
            id: msg.id,
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: msg.timestamp
          }))
        })
      })

      const data = await response.json()

      let aiContent = 'I apologize, but I encountered an error processing your request.'
      
      if (data.success && data.response) {
        aiContent = data.response
      } else if (data.error) {
        aiContent = `I'm experiencing technical difficulties: ${data.error}`
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        sender: 'ai',
        timestamp: new Date(),
        model: 'DeepSeek-R1'
      }
      
      const finalMessages = [...updatedMessages, aiResponse]
      setMessages(finalMessages)
      saveChatHistory(finalMessages, project?.id)
    } catch (error) {
      console.error('Chat API error:', error)
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I cannot connect to the AI service right now. Please check your connection and try again.',
        sender: 'ai',
        timestamp: new Date(),
        model: 'error'
      }
      const finalMessages = [...updatedMessages, errorResponse]
      setMessages(finalMessages)
      saveChatHistory(finalMessages, project?.id)
    } finally {
      setIsTyping(false)
    }
  }

  const handleStarMessage = (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message || message.sender !== 'ai') return

    // Toggle starred state
    const updatedMessages = messages.map(m => 
      m.id === messageId ? { ...m, starred: !m.starred } : m
    )
    setMessages(updatedMessages)
    saveChatHistory(updatedMessages, project?.id)

    // If starring (not unstarring), save as memo
    if (!message.starred) {
      const savedMemo = saveMemo({ ...message, starred: true }, project?.id)
      if (savedMemo) {
        console.log('Memo saved successfully:', savedMemo.title)
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('memoUpdated', { 
          detail: { projectId: project?.id, memo: savedMemo } 
        }))
      }
    }
  }


  const sidebarWidth = isFullscreen ? 'w-full' : 'w-96'
  const containerClass = isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''

  if (!isOpen) return <>{children}</>

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50' : 'flex h-screen'}>
      {!isFullscreen && (
        <div className="flex-1">
          {children}
        </div>
      )}
      
      {/* AI Sidebar */}
      <div className={`${sidebarWidth} bg-white border-l border-gray-200 flex flex-col shadow-lg ${containerClass}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    DeepSeek-R1
                  </Badge>
                </div>
                <p className="text-xs text-gray-600">
                  {project ? `${project.name} • ${project.stage}` : 'Portfolio Analysis'}
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
          
          {project && (
            <div className="mt-2 flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {project.sector}
              </Badge>
              {project.dealStatus && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    project.dealStatus === 'closed' ? 'bg-green-50 text-green-700' :
                    project.dealStatus === 'due_diligence' ? 'bg-blue-50 text-blue-700' :
                    project.dealStatus === 'passed' ? 'bg-red-50 text-red-700' :
                    'bg-yellow-50 text-yellow-700'
                  }`}
                >
                  {project.dealStatus.replace('_', ' ')}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Quick Start Templates */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Start</h4>
          <div className="grid grid-cols-2 gap-2">
            {WORKFLOW_TEMPLATES.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 text-xs h-8 justify-start"
                onClick={() => handleSendMessage(template.prompt)}
              >
                {template.icon}
                <span>{template.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? message.type === 'workflow' 
                      ? 'bg-purple-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.sender === 'ai' && (
                    <div className="flex items-center space-x-1">
                      <Bot className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                      {message.model && message.model !== 'error' && (
                        <span className="text-xs text-gray-500">
                          {message.model}
                        </span>
                      )}
                    </div>
                  )}
                  {message.sender === 'user' && (
                    <div className="flex items-center space-x-1">
                      {message.type === 'workflow' && <Zap className="w-3 h-3" />}
                      <User className="w-4 h-4 mt-0.5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-xs ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {message.sender === 'ai' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 hover:bg-gray-200 ${
                            message.starred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                          }`}
                          onClick={() => handleStarMessage(message.id)}
                          title={message.starred ? "Remove from memos" : "Save as memo"}
                        >
                          <Star className={`w-3 h-3 ${message.starred ? 'fill-current' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-3 py-2 rounded-lg">
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

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={project ? `Ask about ${project.name}...` : "Ask about your portfolio..."}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button 
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isTyping}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Fullscreen backdrop */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </div>
  )
}

// Enhanced AI Button component
export function ProjectAIButton({ 
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
      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      AI Chat
    </Button>
  )
}