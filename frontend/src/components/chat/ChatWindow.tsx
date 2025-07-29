'use client'

import { AgenticChatInterface } from '@/components/ai/AgenticChatInterface'
import { cn } from '@/lib/utils'

interface ChatWindowProps {
  dealId: string | null
  conversationId?: string | null
  className?: string
  onAddToMemo?: (content: string, dealId: string) => void
}

export function ChatWindow({ dealId, conversationId, className, onAddToMemo }: ChatWindowProps) {
  // Get dynamic project information from dealId
  const getProject = () => {
    if (!dealId) return undefined
    try {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]')
      const project = projects.find((p: any) => p.id === dealId)
      if (project) {
        return {
          id: project.id,
          name: project.company_name || project.name || 'Unknown Company',
          sector: project.sector || 'Technology',
          stage: project.stage || project.investment?.round_type || 'Unknown',
          dealStatus: project.deal_status || project.status
        }
      }
    } catch {
      // Fallback for known conversation IDs
      const conversationProjects: Record<string, any> = {
        '1-1': { id: '1', name: 'LayerZero', sector: 'Blockchain', stage: 'Series B' },
        '1-2': { id: '1', name: 'LayerZero', sector: 'Blockchain', stage: 'Series B' },
        '1-3': { id: '1', name: 'LayerZero', sector: 'Blockchain', stage: 'Series B' },
        '2-1': { id: '2', name: 'Celestia', sector: 'Blockchain', stage: 'Series A' },
        '6-1': { id: '6', name: 'Berachain', sector: 'DeFi', stage: 'Seed' },
        '6-2': { id: '6', name: 'Berachain', sector: 'DeFi', stage: 'Seed' },
        '6-3': { id: '6', name: 'Berachain', sector: 'DeFi', stage: 'Seed' },
      }
      return conversationId ? conversationProjects[conversationId] : undefined
    }
    return undefined
  }

  const project = getProject()

  return (
    <div className={cn('h-full', className)}>
      <AgenticChatInterface
        project={project}
        isOpen={true}
        onToggle={() => {}} // Always open in this context
      >
        <div className="h-full flex items-center justify-center text-gray-500">
          {/* Placeholder content when chat is not visible */}
          Select a conversation to start chatting
        </div>
      </AgenticChatInterface>
    </div>
  )
}