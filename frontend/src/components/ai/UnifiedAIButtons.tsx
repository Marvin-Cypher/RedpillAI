'use client'

import { Button } from '@/components/ui/button'
import { Brain, MessageSquare, Search, FileText, Zap } from 'lucide-react'
import { useAI } from './UnifiedAISystem'

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
        return 'border-purple-300 hover:bg-purple-50 hover:border-purple-400 text-purple-700'
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
      className={`hover:bg-purple-50 hover:border-purple-300 ${className}`}
      style={{ border: '2px solid red' }} // Visual debug indicator
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      Chat with AI [DEBUG]
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
  const { openAI, startResearch } = useAI()

  const handleClick = () => {
    openAI({
      projectId,
      projectType,
      projectName,
      mode: 'sidebar'
    })
    
    if (topic) {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        startResearch(topic)
      }, 500)
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
      className={`hover:bg-gray-50 border-gray-300 ${className}`}
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
      className={`hover:bg-yellow-50 hover:border-yellow-300 text-yellow-700 border-yellow-200 ${className}`}
    >
      <Zap className="w-4 h-4 mr-1" />
      Quick AI
    </Button>
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