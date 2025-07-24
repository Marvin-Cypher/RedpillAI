'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Send, 
  Paperclip, 
  BarChart3, 
  Shield, 
  Users, 
  TrendingUp, 
  FileText,
  Brain,
  BookOpen,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    type?: 'research' | 'analysis' | 'general'
    step?: string
    isStreaming?: boolean
  }
}

interface ChatWindowProps {
  dealId: string | null
  conversationId?: string | null
  className?: string
  onAddToMemo?: (content: string, dealId: string) => void
}

// Mock messages for demonstration
const mockMessages: Message[] = [
  {
    id: '1',
    role: 'system',
    content: 'Welcome to your secure AI research assistant. Your conversations are encrypted end-to-end in a TEE (Trusted Execution Environment).',
    timestamp: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    id: '2', 
    role: 'assistant',
    content: 'Good morning! LayerZero analysis complete. Key insights:\n\n✅ Strong omnichain tech advantage\n⚠️ Bridge security concerns remain\n💰 $3B valuation justified by metrics\n\nGenerated full investment memo. Ready for Monday partner meeting.',
    timestamp: new Date(Date.now() - 3 * 60 * 1000)
  }
]

// Mock conversation-specific messages
const conversationMessages: Record<string, Message[]> = {
  '1-1': [
    {
      id: 'sys-1-1',
      role: 'system',
      content: 'Starting LayerZero Initial Research conversation. Context: Omnichain protocol analysis.',
      timestamp: new Date(Date.now() - 120 * 60 * 1000)
    },
    {
      id: 'user-1-1',
      role: 'user',
      content: 'Analyze LayerZero\'s omnichain protocol. What are the key technical advantages and risks?',
      timestamp: new Date(Date.now() - 115 * 60 * 1000)
    },
    {
      id: 'ai-1-1',
      role: 'assistant',
      content: 'LayerZero\'s omnichain protocol analysis:\n\n✅ **Technical Advantages:**\n• Ultra Light Nodes (ULNs) reduce on-chain footprint\n• Trustless cross-chain messaging without intermediate chains\n• Modular security stack with Oracle + Relayer verification\n• Gas-efficient compared to traditional bridges\n\n⚠️ **Key Risks:**\n• Oracle-Relayer collusion risk (though mitigated by independence requirements)\n• Smart contract bugs in endpoint implementations\n• Potential for message replay attacks if not properly sequenced\n\n💰 **Investment Thesis:**\nStrong technical foundation with $3B+ TVL growth. Risk-reward profile favorable at current valuation.',
      timestamp: new Date(Date.now() - 110 * 60 * 1000)
    }
  ],
  '1-2': [
    {
      id: 'sys-1-2',
      role: 'system',
      content: 'Starting LayerZero Team Background Check conversation.',
      timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000)
    },
    {
      id: 'user-1-2',
      role: 'user',
      content: 'Research the LayerZero founding team. What\'s their background and track record?',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      id: 'ai-1-2',
      role: 'assistant',
      content: '**LayerZero Founding Team Analysis:**\n\n👥 **Ryan Zarick (CTO):**\n• Former Google, Facebook engineer\n• 10+ years blockchain development\n• Led engineering at several successful DeFi protocols\n\n👥 **Bryan Pellegrino (CEO):**\n• Stanford CS, extensive crypto background\n• Previously founded successful crypto trading firm\n• Strong network in institutional crypto space\n\n👥 **Caleb Banister (COO):**\n• Former Goldman Sachs, traditional finance background\n• Brings operational excellence and institutional relationships\n\n✅ **Assessment:** Exceptionally strong technical team with proven track record. Combination of deep technical expertise and business acumen.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 5 * 60 * 1000)
    }
  ],
  '6-3': [
    {
      id: 'sys-6-3',
      role: 'system',
      content: 'Starting Berachain Investment Memo Draft conversation.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
    },
    {
      id: 'user-6-3',
      role: 'user',
      content: 'Generate a comprehensive investment memo for Berachain. Include thesis, risks, and recommendation.',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
    },
    {
      id: 'ai-6-3',
      role: 'assistant',
      content: '# Berachain Investment Memo\n\n## Executive Summary\n**Recommendation:** INVEST - $2M initial, $5M target\n**Valuation:** $420M pre-money (competitive for L1 with novel consensus)\n\n## Investment Thesis\n🔥 **Proof of Liquidity Innovation**\n• Novel consensus mechanism aligning validators with DeFi\n• Solves liquidity fragmentation problem across L1s\n• First mover advantage in PoL space\n\n📈 **Strong Technical Foundation**\n• EVM-compatible with Cosmos SDK flexibility\n• Experienced team (ex-Ethereum Foundation)\n• Growing developer ecosystem (50+ dApps building)\n\n## Key Risks\n⚠️ Unproven consensus mechanism at scale\n⚠️ Regulatory uncertainty around validator economics\n⚠️ Competition from established L1s\n\n## Recommendation\nStrong technical team with innovative approach. Risk/reward favorable at current stage.',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
    }
  ]
}

export function ChatWindow({ dealId, conversationId, className, onAddToMemo }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversation-specific messages when conversationId changes
  useEffect(() => {
    if (conversationId && conversationMessages[conversationId]) {
      setMessages(conversationMessages[conversationId])
    } else if (dealId && !conversationId) {
      // Show default messages when deal is selected but no specific conversation
      setMessages(mockMessages)
    } else {
      // No deal selected
      setMessages([])
    }
  }, [conversationId, dealId])

  // Get conversation title for display
  const getConversationTitle = () => {
    if (!dealId) return 'AI Research Assistant'
    if (!conversationId) return 'LayerZero Research Context'
    
    // Map conversation IDs to titles
    const titles: Record<string, string> = {
      '1-1': 'LayerZero: Initial Research',
      '1-2': 'LayerZero: Team Background Check', 
      '1-3': 'LayerZero: Market Analysis',
      '2-1': 'Celestia: Market Analysis',
      '6-1': 'Berachain: Proof of Liquidity Analysis',
      '6-2': 'Berachain: Competitive Analysis',
      '6-3': 'Berachain: Investment Memo Draft'
    }
    
    return titles[conversationId] || 'Research Conversation'
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Get dynamic project name for personalized prompts
  const getProjectName = () => {
    if (!dealId) return 'this project'
    try {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]')
      const project = projects.find((p: any) => p.id === dealId)
      return project?.company_name || project?.name || 'this project'
    } catch {
      return 'this project'
    }
  }

  const projectName = getProjectName()

  const quickActions = [
    { icon: TrendingUp, label: 'Competition', action: () => handleQuickAction(`Analyze ${projectName}'s competitive landscape and key competitors`) },
    { icon: Shield, label: 'Risks', action: () => handleQuickAction(`What are the main investment risks for ${projectName}?`) },
    { icon: Users, label: 'Team', action: () => handleQuickAction(`Evaluate ${projectName}'s team and leadership`) },
    { icon: BarChart3, label: 'Market', action: () => handleQuickAction(`Analyze ${projectName}'s market size and opportunity`) },
    { icon: FileText, label: 'Memo', action: () => handleQuickAction(`Generate an investment memo for ${projectName}`) },
  ]

  const handleQuickAction = (action: string) => {
    setInput(action)
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    let response: Response | undefined
    try {
      // Send message to AI API
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          projectId: dealId,
          conversationHistory: messages,
          stream: false
        }),
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          metadata: {
            type: 'research' // Will be determined by the AI
          }
        }

        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
      console.error('Response status:', response?.status)
      // Response already parsed as JSON, cannot read text again
      
      let errorContent = 'I apologize, but I encountered an error processing your request. Please try again.'
      
      // Provide more specific error messages based on the error type
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorContent = 'Unable to connect to the AI service. Please check your internet connection and try again.'
      } else if (response?.status === 401) {
        errorContent = 'Authentication failed. Please check the API key configuration.'
      } else if (response?.status === 429) {
        errorContent = 'Rate limit exceeded. Please wait a moment and try again.'
      } else if (response?.status === 500) {
        errorContent = 'Server error occurred. The AI service might be temporarily unavailable.'
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        metadata: {
          type: 'general'
        }
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="border-b border-dark-700">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">
            {getConversationTitle()}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {dealId && (
              <>
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <Brain className="w-3 h-3" />
                  <span>Memory: 47 items</span>
                </div>
                <Badge variant="outline" className="bg-green-900/30 border-green-700 text-green-400">
                  🔐 Private
                </Badge>
              </>
            )}
            <Badge variant="outline" className="bg-green-900/30 border-green-700 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
              Online
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* Quick Actions */}
      {dealId && (
        <div className="p-4 border-b border-dark-700">
          <p className="text-xs text-gray-400 mb-2">Quick research actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="secondary"
                size="sm"
                onClick={action.action}
                className="text-xs bg-dark-600 hover:bg-dark-500 text-white"
              >
                <action.icon className="w-3 h-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {!dealId && (
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <p className="text-blue-400 text-sm font-medium mb-2">
                🤖 Welcome to your secure AI research assistant
              </p>
              <p className="text-gray-300 text-sm mb-3">
                Your conversations are encrypted end-to-end in a TEE (Trusted Execution Environment). 
                No one else can access your research or data.
              </p>
              <div className="bg-dark-800 rounded p-2 text-xs text-gray-400 font-mono">
                <div>System: TEE Instance ID: 0x7f3a...9e2b</div>
                <div>Enclave: Intel SGX Enabled</div>
                <div>Memory: Encrypted | Network: Isolated</div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-3 group">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'assistant' 
                  ? 'bg-redpill-600' 
                  : message.role === 'system'
                  ? 'bg-blue-600'
                  : 'bg-gray-600'
              }`}>
                <span className="text-white text-xs">
                  {message.role === 'assistant' ? '🤖' : message.role === 'system' ? '🔒' : '👤'}
                </span>
              </div>
              <div className="relative flex-1 max-w-2xl">
                <div className={`rounded-lg p-4 ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-dark-700 text-white'
                }`}>
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                
                {/* Add to Memo button - only show for AI messages and when dealId exists */}
                {message.role === 'assistant' && dealId && onAddToMemo && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onAddToMemo(message.content, dealId)}
                      className="h-8 w-8 p-0 bg-dark-600 hover:bg-dark-500 border border-dark-500 hover:border-gray-400"
                      title="Add to Memo"
                    >
                      <BookOpen className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-redpill-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">🤖</span>
              </div>
              <div className="bg-dark-700 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-dark-700">
        {dealId && (
          <div className="flex items-center space-x-2 text-xs mb-2">
            <span className="text-gray-500">Ask about:</span>
            <button 
              onClick={() => handleQuickAction(`How does ${projectName} compare to similar projects in our portfolio?`)}
              className="text-blue-400 hover:text-blue-300"
            >
              Compare to portfolio
            </button>
            <span className="text-gray-600">•</span>
            <button 
              onClick={() => handleQuickAction(`What key questions should I ask the ${projectName} founders in our next meeting?`)}
              className="text-blue-400 hover:text-blue-300"
            >
              Meeting prep
            </button>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={dealId ? "Ask about LayerZero..." : "Ask me anything about your portfolio, market trends, or upload new documents..."}
              className="bg-dark-700 border-dark-600 text-white placeholder-gray-400 pr-20"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                <Paperclip className="w-4 h-4 text-gray-400" />
              </Button>
            </div>
          </div>
          <Button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="redpill-button-primary"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}