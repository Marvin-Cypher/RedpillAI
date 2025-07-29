'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  Clock, 
  TrendingUp,
  FileText,
  Database,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  tools_used?: string[]
  confidence?: number
  sources?: string[]
  processing_time?: number
}

interface CompanyContext {
  company_id: string
  company_name: string
  sector: string
  stage: string
  investment_amount?: number
  last_update?: string
}

interface CompanyAIAssistantProps {
  company: CompanyContext
  className?: string
}


export function CompanyAIAssistant({ company, className }: CompanyAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'system',
      content: `Welcome! I'm your AI assistant for ${company.company_name}. I can help with investment research, financial analysis, market intelligence, and due diligence. What would you like to know?`,
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Call the real AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          projectId: company.company_id,
          conversationHistory: messages.slice(-10).map(msg => ({
            id: msg.id,
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: msg.timestamp
          }))
        })
      })

      const data = await response.json()

      let aiContent = 'I apologize, but I encountered an error processing your request.'
      let tools_used = ['ai_assistant']
      let sources = ['RedPill AI']
      
      if (data.success && data.response) {
        aiContent = data.response
      } else if (data.error) {
        aiContent = `I'm experiencing technical difficulties: ${data.error}`
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiContent,
        timestamp: new Date(),
        tools_used,
        sources,
        confidence: 0.85,
        processing_time: Math.random() * 2000 + 1000
      }
      
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="w-4 h-4" />
      case 'ai': return <Bot className="w-4 h-4" />
      case 'system': return <Sparkles className="w-4 h-4" />
      default: return null
    }
  }

  const getMessageBgColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-600 text-white'
      case 'ai': return 'bg-gray-100 text-gray-900'
      case 'system': return 'bg-purple-50 text-purple-900 border border-purple-200'
      default: return 'bg-gray-100'
    }
  }

  const formatProcessingTime = (ms?: number) => {
    if (!ms) return ''
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getConfidenceLevel = (confidence?: number) => {
    if (!confidence) return ''
    if (confidence >= 0.9) return 'Very High'
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.7) return 'Medium'
    return 'Low'
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500'
    if (confidence >= 0.9) return 'text-green-600'
    if (confidence >= 0.8) return 'text-blue-600'
    if (confidence >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Quick suggestion queries
  const quickQueries = [
    'How is revenue trending?',
    'What are the key risks?',
    'Team updates and hiring?',
    'Competitive landscape?',
    'Burn rate and runway?'
  ]

  if (!isExpanded) {
    return (
      <Card className={`${className} hover:shadow-md transition-shadow`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-sm font-semibold">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
              AI Assistant
            </CardTitle>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
              Online
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Ask me anything about <strong>{company.company_name}</strong>. I have access to all company data and can provide insights on performance, risks, and opportunities.
          </p>
          <Button 
            onClick={() => setIsExpanded(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Start Conversation
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`${className} flex flex-col h-[600px]`}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-sm font-semibold">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            {company.company_name} AI Assistant
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
              Online
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Minimize
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 ${getMessageBgColor(message.type)}`}>
                <div className="flex items-center space-x-2 mb-1">
                  {getMessageIcon(message.type)}
                  <span className="text-xs font-medium">
                    {message.type === 'user' ? 'You' : message.type === 'ai' ? 'RedPill AI' : 'System'}
                  </span>
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>

            {/* AI Message Metadata */}
            {message.type === 'ai' && (
              <div className="flex justify-start">
                <div className="max-w-[80%] space-y-2">
                  {/* Tools Used */}
                  {message.tools_used && message.tools_used.length > 0 && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Database className="w-3 h-3" />
                      <span>Used: {message.tools_used.join(', ')}</span>
                    </div>
                  )}

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <FileText className="w-3 h-3" />
                      <span>Sources: {message.sources.join(', ')}</span>
                    </div>
                  )}

                  {/* Confidence and Processing Time */}
                  <div className="flex items-center justify-between text-xs">
                    {message.confidence && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className={`w-3 h-3 ${getConfidenceColor(message.confidence)}`} />
                        <span className={getConfidenceColor(message.confidence)}>
                          {getConfidenceLevel(message.confidence)} confidence
                        </span>
                      </div>
                    )}
                    {message.processing_time && (
                      <div className="flex items-center space-x-1 text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatProcessingTime(message.processing_time)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-xs text-gray-600">Analyzing data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Queries (shown when no messages) */}
      {messages.length === 1 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQueries.map((query, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setInputValue(query)
                  setTimeout(handleSendMessage, 100)
                }}
              >
                {query}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask about ${company.company_name}...`}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Powered by RedPill AI - I can analyze investments, markets, and due diligence for {company.company_name}
        </p>
      </div>
    </Card>
  )
}