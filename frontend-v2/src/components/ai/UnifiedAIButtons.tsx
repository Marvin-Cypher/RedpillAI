"use client"

import { Button } from '@/components/ui/button'
import { Brain, MessageSquare, Search, FileText, Zap, History } from 'lucide-react'
import { useAI } from './UnifiedAISystem'
import { useState } from 'react'

interface AIButtonProps {
  variant?: 'default' | 'purple' | 'gradient' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  label?: string
  projectId?: string
  projectType?: 'company' | 'deal' | 'open'
  projectName?: string
  memoId?: string
  className?: string
}

// Main AI button - opens the research canvas
export function AIButton({ 
  variant = 'purple',
  size = 'sm',
  label = 'AI Assistant',
  projectId,
  projectType,
  projectName,
  memoId,
  className = ''
}: AIButtonProps) {
  const { openAI } = useAI()

  const getButtonClass = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
      case 'purple':
        return 'bg-purple-600 hover:bg-purple-700 text-white'
      case 'outline':
        return 'border-purple-300 hover:bg-purple-50 hover:border-purple-400 text-purple-700 dark:border-purple-700 dark:hover:bg-purple-950/20 dark:hover:border-purple-600 dark:text-purple-400'
      default:
        return ''
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'lg': return 'w-5 h-5'
      case 'md': return 'w-4 h-4'
      default: return 'w-3 h-3'
    }
  }

  const handleClick = () => {
    openAI({
      projectId,
      projectType,
      projectName,
      memoId,
      mode: 'sidebar'
    })
  }

  return (
    <Button
      onClick={handleClick}
      size={size === 'lg' ? 'default' : 'sm'}
      variant={variant === 'outline' ? 'outline' : 'default'}
      className={`${getButtonClass()} ${className}`}
    >
      <Brain className={`${getIconSize()} mr-1`} />
      {label}
    </Button>
  )
}

// Chat with AI button - classic style
export function ChatWithAIButton({ 
  projectId,
  projectType,
  projectName,
  className = ''
}: Omit<AIButtonProps, 'variant' | 'size' | 'label'>) {
  console.log('🟡 ChatWithAIButton render:', { projectId, projectType, projectName })
  const { openAI } = useAI()
  console.log('🟡 ChatWithAIButton useAI result:', typeof openAI)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🟢 ChatWithAIButton clicked!', { projectId, projectType, projectName })
    console.log('🟢 openAI function:', typeof openAI)
    try {
      openAI({
        projectId,
        projectType,
        projectName,
        mode: 'sidebar'
      })
      console.log('🟢 openAI called successfully')
    } catch (error) {
      console.error('🔴 Error calling openAI:', error)
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size="sm"
      className={`hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950/20 dark:hover:border-purple-700 ${className}`}
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      Chat with AI
    </Button>
  )
}

// Research button - for deep analysis
export function AIResearchButton({ 
  topic,
  projectId,
  projectType,
  projectName,
  size = 'sm',
  className = ''
}: AIButtonProps & { topic?: string }) {
  const { openResearch, sendMessage } = useAI()

  const handleClick = () => {
    // Use the new openResearch method for better UX
    openResearch(projectId, projectType, projectName)
    
    if (topic) {
      // Small delay to ensure UI is ready, then send research query
      setTimeout(() => {
        sendMessage(`research ${topic}`)
      }, 800)
    }
  }

  return (
    <Button
      onClick={handleClick}
      size={size === 'lg' ? 'default' : 'sm'}
      className={`bg-blue-600 hover:bg-blue-700 text-white ${className}`}
    >
      <Search className="w-4 h-4 mr-1" />
      AI Research
    </Button>
  )
}

// Memo AI button - for opening existing memos
export function AIMemoButton({ 
  memoId,
  projectId,
  projectType,
  projectName,
  size = 'sm',
  className = ''
}: AIButtonProps) {
  const { openAI } = useAI()

  const handleClick = () => {
    openAI({
      projectId,
      projectType,
      projectName,
      memoId,
      mode: 'fullscreen'
    })
  }

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size={size === 'lg' ? 'default' : 'sm'}
      className={`hover:bg-muted border-border ${className}`}
    >
      <FileText className="w-4 h-4 mr-1" />
      Open with AI
    </Button>
  )
}

// Quick AI button - for instant actions
export function QuickAIButton({ 
  action,
  projectId,
  projectType,
  projectName,
  size = 'sm',
  className = ''
}: AIButtonProps & { action?: string }) {
  const { openAI, sendMessage } = useAI()

  const handleClick = () => {
    openAI({
      projectId,
      projectType,
      projectName,
      mode: 'sidebar'
    })
    
    if (action) {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        sendMessage(action)
      }, 500)
    }
  }

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size={size === 'lg' ? 'default' : 'sm'}
      className={`hover:bg-yellow-50 hover:border-yellow-300 text-yellow-700 border-yellow-200 dark:hover:bg-yellow-950/20 dark:hover:border-yellow-700 dark:text-yellow-400 dark:border-yellow-800 ${className}`}
    >
      <Zap className="w-4 h-4 mr-1" />
      Quick AI
    </Button>
  )
}

// Chat History button - for viewing past conversations
export function ChatHistoryButton({ 
  projectId,
  projectType,
  projectName,
  size = 'sm',
  className = ''
}: AIButtonProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsHistoryOpen(true)}
        variant="outline"
        size={size === 'lg' ? 'default' : 'sm'}
        className={`hover:bg-blue-50 hover:border-blue-300 text-blue-700 border-blue-200 dark:hover:bg-blue-950/20 dark:hover:border-blue-700 dark:text-blue-400 dark:border-blue-800 ${className}`}
      >
        <History className="w-4 h-4 mr-1" />
        Chat History
      </Button>
      
      {/* TODO: Create ChatHistory component */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Chat History</h3>
            <p className="text-muted-foreground mb-4">Chat history feature coming soon...</p>
            <Button onClick={() => setIsHistoryOpen(false)} variant="outline">
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

// Floating AI button - for always-accessible AI
export function FloatingAIButton({
  projectId,
  projectType,
  projectName
}: Omit<AIButtonProps, 'variant' | 'size' | 'label' | 'className'>) {
  const { openAI, isOpen } = useAI()

  if (isOpen) return null // Hide when AI is already open

  const handleClick = () => {
    openAI({
      projectId,
      projectType,
      projectName,
      mode: 'sidebar'
    })
  }

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl border-0 p-0"
    >
      <Brain className="w-6 h-6" />
    </Button>
  )
}