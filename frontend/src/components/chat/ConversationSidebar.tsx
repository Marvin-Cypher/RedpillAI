'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Plus, 
  MessageCircle, 
  Clock, 
  Search,
  MoreHorizontal,
  Trash2,
  Edit,
  FolderOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  title: string
  last_message: string
  updated_at: string
  message_count: number
  is_active?: boolean
}

interface ConversationSidebarProps {
  dealId: string | null
  companyName: string
  conversations: Conversation[]
  activeConversationId: string | null
  onConversationSelect: (conversationId: string) => void
  onNewConversation: () => void
  onViewProjectDetail?: (dealId: string) => void
  className?: string
}

export function ConversationSidebar({ 
  dealId, 
  companyName,
  conversations, 
  activeConversationId, 
  onConversationSelect, 
  onNewConversation,
  onViewProjectDetail,
  className 
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTimeAgo = (timeStr: string) => {
    // Convert time strings like "2 hours ago" to display format
    return timeStr
  }

  if (!dealId) {
    return (
      <Card className={cn('w-80 border-dark-700', className)}>
        <CardContent className="p-6 text-center">
          <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 text-sm">
            Select a project to view conversations
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-80 border-dark-700 flex flex-col', className)}>
      <CardHeader className="border-b border-dark-700 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-white">
              {companyName}
            </CardTitle>
            <p className="text-xs text-gray-400 mt-1">
              {conversations.length} conversations
            </p>
          </div>
          <Button
            size="sm"
            onClick={onNewConversation}
            className="redpill-button-primary flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </Button>
        </div>

        {/* Action Buttons */}
        {dealId && onViewProjectDetail && (
          <div className="mt-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewProjectDetail(dealId)}
              className="w-full flex items-center space-x-2"
            >
              <FolderOpen className="w-4 h-4" />
              <span>View Portfolio</span>
            </Button>
          </div>
        )}

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-md text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-redpill-600 focus:border-transparent"
          />
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-2">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              {!searchQuery && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onNewConversation}
                  className="text-xs"
                >
                  Start your first conversation
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  className={cn(
                    'p-3 rounded-lg cursor-pointer transition-all hover:bg-dark-600 group',
                    activeConversationId === conversation.id
                      ? 'bg-redpill-900/30 border border-redpill-600'
                      : 'bg-dark-800 hover:bg-dark-700'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-white truncate">
                          {conversation.title}
                        </h4>
                        {conversation.is_active && (
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                        {conversation.last_message}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3 text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(conversation.updated_at)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>{conversation.message_count} msgs</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* More options menu */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-1 h-6 w-6 text-gray-400 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle more options
                        }}
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="border-t border-dark-700 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="text-xs bg-dark-700 hover:bg-dark-600"
          >
            <Search className="w-3 h-3 mr-1" />
            Archive
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs bg-dark-700 hover:bg-dark-600"
          >
            <Edit className="w-3 h-3 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </Card>
  )
}