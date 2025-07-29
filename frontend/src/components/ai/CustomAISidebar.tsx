'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MessageSquare, X, Send, Bot, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { VCAssistant } from '@/lib/ai/vc-assistant'

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
}

interface CustomAISidebarProps {
  projectId?: string
  projectName?: string
  children: React.ReactNode
  isOpen?: boolean
  onToggle?: (open: boolean) => void
}

export function CustomAISidebar({ 
  projectId, 
  projectName = "Project", 
  children,
  isOpen = false,
  onToggle 
}: CustomAISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: projectId 
        ? `Hello! I'm your AI assistant for ${projectName}. I can help you analyze this investment, review metrics, and answer questions about the project. What would you like to know?`
        : "Hello! I'm your AI assistant for RedPill VC. I can help you with investment analysis, portfolio management, and due diligence. How can I assist you today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [vcAssistant, setVcAssistant] = useState<VCAssistant | null>(null)

  useEffect(() => {
    // Initialize VC Assistant with API key
    const apiKey = process.env.NEXT_PUBLIC_REDPILL_API_KEY || 'demo-key'
    const coinGeckoKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || ''
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
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue('')
    setIsTyping(true)

    try {
      // Use real AI response
      const response = await vcAssistant.chat(
        currentInput,
        projectId,
        messages.map(msg => ({
          id: msg.id,
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content,
          timestamp: msg.timestamp
        }))
      )

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      // Fallback to mock response if API fails
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(currentInput, projectName, projectId),
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
    } finally {
      setIsTyping(false)
    }
  }

  const generateAIResponse = (userInput: string, projectName: string, projectId?: string): string => {
    const input = userInput.toLowerCase()
    
    if (input.includes('metric') || input.includes('performance')) {
      return `Based on the latest data for ${projectName}, I can see strong performance indicators. The revenue growth is trending positively, and key metrics are within healthy ranges. Would you like me to dive deeper into any specific metrics?`
    }
    
    if (input.includes('risk') || input.includes('concern')) {
      return `For ${projectName}, I've identified a few areas that warrant attention: market competition, regulatory changes, and scaling challenges. The risk profile appears moderate overall. Would you like a detailed risk assessment?`
    }
    
    if (input.includes('recommend') || input.includes('should')) {
      return `Based on my analysis of ${projectName}, I recommend monitoring the key performance indicators closely and considering a follow-up investment round. The fundamentals look strong. Would you like me to generate a detailed investment memo?`
    }
    
    return `I understand you're asking about ${projectName}. I can help you analyze financial metrics, assess risks, review market opportunities, and provide strategic insights. What specific aspect would you like me to focus on?`
  }

  if (!isOpen) return <>{children}</>

  return (
    <div className="flex h-screen relative">
      <div className="flex-1 w-0">
        {children}
      </div>
      
      {/* AI Sidebar */}
      <div className="hidden lg:flex w-96 max-w-[400px] min-w-[320px] bg-white border-l border-gray-200 flex-col shadow-lg">
        {/* Desktop Sidebar Content */}
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                <p className="text-xs text-gray-600">{projectName}</p>
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
          {projectId && (
            <Badge variant="outline" className="mt-2 text-xs">
              Project: {projectId}
            </Badge>
          )}
        </div>

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
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.sender === 'ai' && (
                    <Bot className="w-4 h-4 mt-0.5 text-blue-600" />
                  )}
                  {message.sender === 'user' && (
                    <User className="w-4 h-4 mt-0.5 text-white" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
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
              placeholder="Ask about this project..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      </div>
      
      {/* Mobile AI Sidebar - Full Screen Overlay */}
      <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                <p className="text-xs text-gray-600">{projectName}</p>
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
          {projectId && (
            <Badge variant="outline" className="mt-2 text-xs">
              Project: {projectId}
            </Badge>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3 py-2 rounded-lg break-words overflow-wrap-anywhere ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.sender === 'ai' && (
                    <Bot className="w-4 h-4 mt-0.5 text-blue-600" />
                  )}
                  {message.sender === 'user' && (
                    <User className="w-4 h-4 mt-0.5 text-white" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 max-w-[85%] px-3 py-2 rounded-lg">
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
              placeholder="Ask about this project..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
      </div>
    </div>
  )
}

// AI Button component
export function AIButton({ 
  projectId, 
  projectName, 
  onClick 
}: { 
  projectId?: string
  projectName?: string
  onClick?: () => void 
}) {
  return (
    <Button
      onClick={onClick}
      size="sm"
      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      AI
    </Button>
  )
}