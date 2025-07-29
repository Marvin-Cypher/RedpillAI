'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  History, 
  MessageSquare, 
  Calendar, 
  Trash2, 
  X, 
  Clock,
  Search,
  Filter
} from 'lucide-react'
import { useAI, AISession } from './UnifiedAISystem'

interface ChatHistoryProps {
  projectId?: string
  projectType?: 'company' | 'deal' | 'open'
  projectName?: string
  isOpen: boolean
  onClose: () => void
}

export function ChatHistory({ 
  projectId, 
  projectType = 'open', 
  projectName = 'Dashboard',
  isOpen, 
  onClose 
}: ChatHistoryProps) {
  const { getChatHistory, loadChatSession, openAI } = useAI()
  const [sessions, setSessions] = useState<AISession[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'today' | 'week' | 'month'>('all')

  // Load chat history on open
  useEffect(() => {
    if (isOpen && projectId) {
      console.log('💾 Loading chat history for project:', projectId, projectType)
      const history = getChatHistory(projectId, projectType)
      console.log('📚 Found sessions:', history.length, history)
      setSessions(history)
    }
  }, [isOpen, projectId, projectType, getChatHistory])

  // Filter sessions based on search and time filter
  const filteredSessions = sessions.filter(session => {
    // Search filter
    const matchesSearch = !searchTerm || 
      session.messages.some(msg => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      session.projectName?.toLowerCase().includes(searchTerm.toLowerCase())

    // Time filter
    const now = new Date()
    const sessionDate = new Date(session.lastActivity)
    let matchesTime = true

    switch (filterType) {
      case 'today':
        matchesTime = sessionDate.toDateString() === now.toDateString()
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        matchesTime = sessionDate >= weekAgo
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        matchesTime = sessionDate >= monthAgo
        break
      default:
        matchesTime = true
    }

    return matchesSearch && matchesTime
  })

  const handleLoadSession = (sessionId: string) => {
    loadChatSession(sessionId)
    onClose()
  }

  const handleDeleteSession = (sessionId: string) => {
    if (!projectId) return
    
    const storageKey = `chat-history-${projectId}`
    const existingSessions = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const updatedSessions = existingSessions.filter((s: AISession) => s.id !== sessionId)
    localStorage.setItem(storageKey, JSON.stringify(updatedSessions))
    
    // Update local state
    setSessions(prev => prev.filter(s => s.id !== sessionId))
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getSessionPreview = (session: AISession) => {
    console.log('🔍 getSessionPreview for session:', session.id, 'messages:', session.messages?.length)
    
    if (!session.messages || session.messages.length === 0) {
      return 'No messages yet'
    }
    
    // Try to get any message with content (user or AI)
    const messagesWithContent = session.messages.filter(msg => msg.content && msg.content.trim())
    
    if (messagesWithContent.length === 0) {
      return 'Empty conversation'
    }
    
    // Prefer user messages, but fall back to any message with content
    const lastUserMessage = messagesWithContent.filter(msg => msg.sender === 'user').pop()
    const previewMessage = lastUserMessage || messagesWithContent[messagesWithContent.length - 1]
    
    if (!previewMessage || !previewMessage.content) {
      return 'Empty conversation'
    }
    
    const content = previewMessage.content.trim()
    return content.substring(0, 80) + (content.length > 80 ? '...' : '')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] bg-white">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Chat History</h2>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {projectName}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm min-w-[120px]"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
          </div>
        </div>

        <ScrollArea className="h-[500px]">
          <div className="p-6">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {sessions.length === 0 ? 'No chat history yet' : 'No conversations match your filters'}
                </h3>
                <p className="text-gray-500">
                  {sessions.length === 0 
                    ? 'Start a conversation with AI to see your chat history here.'
                    : 'Try adjusting your search or time filter.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((session) => (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500">
                              {formatDate(session.lastActivity)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {session.messages?.length || 0} messages
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {getSessionPreview(session)}
                          </p>
                          <div className="text-xs text-gray-500">
                            Session ID: {session.id.split('-')[1]}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadSession(session.id)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Load
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSession(session.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>{filteredSessions.length} conversation{filteredSessions.length !== 1 ? 's' : ''} found</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                openAI({ projectId, projectType, projectName })
                onClose()
              }}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Start New Chat
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}