import { useState } from 'react'

interface Toast {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (toast: Toast) => {
    setToasts(prev => [...prev, toast])
    // Remove toast after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.slice(1))
    }, 3000)
    
    // For now, just console.log the toast
    console.log('Toast:', toast)
  }

  return { toast, toasts }
}