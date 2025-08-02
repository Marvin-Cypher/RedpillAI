import { Button } from '@/components/ui/button'
import { Brain, MessageSquare } from 'lucide-react'

interface AIButtonProps {
  onClick: () => void
  variant?: 'default' | 'purple' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function AIButton({ 
  onClick, 
  variant = 'purple',
  size = 'sm',
  label = 'AI'
}: AIButtonProps) {
  const getButtonClass = () => {
    switch (variant) {
      case 'gradient':
        return 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg'
      case 'purple':
        return 'bg-purple-600 hover:bg-purple-700 text-white'
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

  return (
    <Button
      onClick={onClick}
      size={size === 'lg' ? 'default' : 'sm'}
      className={getButtonClass()}
    >
      <Brain className={`${getIconSize()} mr-1`} />
      {label}
    </Button>
  )
}

export function ChatWithAIButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="sm"
      className="hover:bg-purple-50 hover:border-purple-300"
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      Chat with AI
    </Button>
  )
}