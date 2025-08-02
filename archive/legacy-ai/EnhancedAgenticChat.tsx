'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageSquare, X, Send, Bot, User, Maximize2, Minimize2, 
  Brain, Loader2, CheckCircle, AlertCircle, BookOpen,
  Copy, Check
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { VCAssistant } from '@/lib/ai/vc-assistant'
import { useToast } from '@/components/ui/use-toast'

interface ResearchProgress {
  type: string
  title: string
  content: string
  status: 'pending' | 'active' | 'complete'
  reasoning?: string
}

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  researchProgress?: ResearchProgress[]
  isResearching?: boolean
}

interface Project {
  id: string
  name: string
  sector?: string
  stage?: string
}

interface EnhancedAgenticChatProps {
  project?: Project
  children: React.ReactNode
  isOpen?: boolean
  onToggle?: (open: boolean) => void
}

export function EnhancedAgenticChat({
  project,
  children,
  isOpen = false,
  onToggle
}: EnhancedAgenticChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [researchProgress, setResearchProgress] = useState<ResearchProgress[]>([])
  const [isResearching, setIsResearching] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const vcAssistant = useRef<VCAssistant | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_REDPILL_API_KEY
    const coinGeckoKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY
    if (apiKey) {
      vcAssistant.current = new VCAssistant(apiKey, coinGeckoKey)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, researchProgress])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsProcessing(true)
    setResearchProgress([])
    setIsResearching(false)

    try {
      const response = await vcAssistant.current?.chat(
        inputValue, 
        project?.id,
        [],
        (step) => {
          console.log('Research step:', step)
          setIsResearching(true)
          setResearchProgress(prev => {
            const existingIndex = prev.findIndex(p => p.title === step.title)
            if (existingIndex >= 0) {
              const updated = [...prev]
              updated[existingIndex] = {
                type: step.type,
                title: step.title,
                content: step.content,
                status: step.status as 'pending' | 'active' | 'complete',
                reasoning: step.reasoning
              }
              return updated
            }
            return [...prev, {
              type: step.type,
              title: step.title,
              content: step.content,
              status: step.status as 'pending' | 'active' | 'complete',
              reasoning: step.reasoning
            }]
          })
        }
      )

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response || 'I apologize, but I encountered an error processing your request.',
        sender: 'ai',
        timestamp: new Date(),
        researchProgress: researchProgress.length > 0 ? researchProgress : undefined,
        isResearching: false
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
      setIsResearching(false)
    }
  }

  const addToMemo = async (message: Message) => {
    try {
      // Here you would integrate with your memo system
      // For now, we'll copy to clipboard and show a toast
      const memoContent = `
## AI Research Finding
**Date**: ${message.timestamp.toLocaleString()}
**Query**: ${messages.find(m => m.id < message.id && m.sender === 'user')?.content || 'N/A'}

### Analysis:
${message.content}

${message.researchProgress ? `
### Research Steps:
${message.researchProgress.map(p => `- ${p.title}: ${p.content}`).join('\n')}
` : ''}
`
      await navigator.clipboard.writeText(memoContent)
      setCopiedMessageId(message.id)
      setTimeout(() => setCopiedMessageId(null), 2000)
      
      toast({
        title: "Added to memo",
        description: "Content copied to clipboard for memo integration"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to memo",
        variant: "destructive"
      })
    }
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
      
      <div className={`${sidebarWidth} bg-white border-l border-gray-200 flex flex-col shadow-2xl ${containerClass}`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">AI Investment Analyst</h3>
                <p className="text-xs text-gray-600">
                  {project ? `Analyzing ${project.name}` : 'Multi-Agent Research System'}
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-1 w-full">
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col m-0">
            {/* Messages with proper scrolling */}
            <div className={`flex-1 ${isFullscreen ? 'h-[calc(100vh-200px)]' : ''} overflow-hidden`}>
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="flex justify-start">
                      <div className={`max-w-[85%] ${
                        message.sender === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      } rounded-lg px-4 py-3`}>
                        <div className="flex items-start space-x-2">
                          {message.sender === 'ai' && <Bot className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                          {message.sender === 'user' && <User className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className={`prose prose-sm max-w-none ${message.sender === 'user' ? 'text-white' : 'text-gray-900'}`}>
                              <ReactMarkdown>
                                {message.content}
                              </ReactMarkdown>
                            </div>
                            <div className="flex items-center justify-between mt-2 text-xs">
                              <span className={message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}>
                                {message.timestamp.toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              {message.sender === 'ai' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => addToMemo(message)}
                                  className="h-6 px-2"
                                >
                                  {copiedMessageId === message.id ? (
                                    <Check className="w-3 h-3 text-green-600" />
                                  ) : (
                                    <>
                                      <BookOpen className="w-3 h-3 mr-1" />
                                      <span className="text-xs">Add to Memo</span>
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Research Progress Display */}
                  {isResearching && researchProgress.length > 0 && (
                    <div className="flex justify-start">
                      <div className="bg-blue-50 border border-blue-200 text-blue-900 max-w-[85%] px-4 py-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Brain className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Research in Progress</span>
                        </div>
                        <div className="space-y-2">
                          {researchProgress.map((progress, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-sm">
                              {progress.status === 'complete' ? (
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              ) : progress.status === 'active' ? (
                                <Loader2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0 animate-spin" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="font-medium">{progress.title}</div>
                                <div className="text-xs text-gray-600">{progress.content}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isProcessing && !isResearching && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg">
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
              </ScrollArea>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleSendMessage()}
                  placeholder={project ? `Ask about ${project.name}...` : "Ask about investments..."}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}