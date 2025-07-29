'use client'

import { createContext, useContext, ReactNode, useState, useCallback } from 'react'
import { OpenResearchCanvas } from './OpenResearchCanvas'

// Core types for the unified AI system
export interface AIMessage {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  type?: 'text' | 'research' | 'loading' | 'approval'
  chatId?: string
  metadata?: {
    reasoning?: string
    confidence?: number
    sources?: string[]
    model?: string
    usage?: any
    chat_id?: string
    timestamp?: string
  }
}

export interface AISession {
  id: string
  projectId?: string
  projectType?: 'company' | 'deal' | 'open'
  projectName?: string
  messages: AIMessage[]
  isActive: boolean
  lastActivity: Date
}

export interface AIContextType {
  // Session management
  currentSession: AISession | null
  isOpen: boolean
  
  // Core actions
  openAI: (options?: {
    projectId?: string
    projectType?: 'company' | 'deal' | 'open'
    projectName?: string
    memoId?: string
    mode?: 'sidebar' | 'fullscreen'
  }) => void
  closeAI: () => void
  
  // Message management
  sendMessage: (content: string) => Promise<void>
  clearSession: () => void
  
  // Advanced features
  startResearch: (topic: string) => void
  saveMemo: (content: string, title?: string) => void
  
  // State
  isTyping: boolean
  isResearching: boolean
}

const AIContext = createContext<AIContextType | null>(null)

interface UnifiedAISystemProps {
  children: ReactNode | ((context: AIContextType) => ReactNode)
  globalProjectId?: string
  globalProjectType?: 'company' | 'deal' | 'open'
  globalProjectName?: string
  enableAI?: boolean
}

export function UnifiedAISystem({
  children,
  globalProjectId,
  globalProjectType,
  globalProjectName,
  enableAI = true
}: UnifiedAISystemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentSession, setCurrentSession] = useState<AISession | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [isResearching, setIsResearching] = useState(false)
  const [currentMemoId, setCurrentMemoId] = useState<string | undefined>()

  // Generate unique session ID
  const generateSessionId = useCallback(() => {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Create new session
  const createSession = useCallback((options: {
    projectId?: string
    projectType?: 'company' | 'deal' | 'open'
    projectName?: string
  }) => {
    const session: AISession = {
      id: generateSessionId(),
      projectId: options.projectId || globalProjectId,
      projectType: options.projectType || globalProjectType || 'open',
      projectName: options.projectName || globalProjectName || 'Dashboard',
      messages: [],
      isActive: true,
      lastActivity: new Date()
    }
    return session
  }, [generateSessionId, globalProjectId, globalProjectType, globalProjectName])

  // Open AI interface
  const openAI = useCallback((options?: {
    projectId?: string
    projectType?: 'company' | 'deal' | 'open'
    projectName?: string
    memoId?: string
    mode?: 'sidebar' | 'fullscreen'
  }) => {
    console.log('UnifiedAISystem openAI called!', options)
    
    // Create or update session
    const session = createSession({
      projectId: options?.projectId,
      projectType: options?.projectType,
      projectName: options?.projectName
    })
    
    console.log('Created session:', session)
    
    setCurrentSession(session)
    setCurrentMemoId(options?.memoId)
    setIsOpen(true)
    
    console.log('Set isOpen to true')
  }, [createSession])

  // Close AI interface
  const closeAI = useCallback(() => {
    setIsOpen(false)
    setCurrentMemoId(undefined)
    // Keep session for potential reopen
  }, [])

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!currentSession || !content.trim()) return

    setIsTyping(true)
    
    try {
      // Add user message to session
      const userMessage: AIMessage = {
        id: `msg-${Date.now()}`,
        content,
        sender: 'user',
        timestamp: new Date(),
        type: 'text'
      }

      const updatedSession = {
        ...currentSession,
        messages: [...currentSession.messages, userMessage],
        lastActivity: new Date()
      }
      setCurrentSession(updatedSession)

      // Call backend API
      const response = await fetch('http://localhost:8000/api/v1/chat/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          project_id: currentSession.projectId,
          project_type: currentSession.projectType,
          conversation_history: currentSession.messages.map(msg => ({
            role: msg.sender,
            content: msg.content,
            timestamp: msg.timestamp
          }))
        })
      })

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`)
      }

      const data = await response.json()

      // Add AI response to session
      const aiMessage: AIMessage = {
        id: `msg-${Date.now() + 1}`,
        content: data.content || 'No response',
        sender: 'ai',
        timestamp: new Date(),
        type: 'research',
        chatId: data.chat_id,
        metadata: {
          reasoning: data.reasoning_content,
          confidence: 0.85,
          sources: ['Internal Analysis', 'Market Data'],
          model: data.model,
          usage: data.usage,
          chat_id: data.chat_id,
          timestamp: new Date().toISOString()
        }
      }

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage],
        lastActivity: new Date()
      }
      setCurrentSession(finalSession)

    } catch (error) {
      console.error('Message send error:', error)
      
      // Add error message
      const errorMessage: AIMessage = {
        id: `msg-${Date.now() + 2}`,
        content: 'I apologize, but I encountered an error. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      }

      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, errorMessage],
        lastActivity: new Date()
      } : null)
    } finally {
      setIsTyping(false)
    }
  }, [currentSession])

  // Clear current session
  const clearSession = useCallback(() => {
    if (currentSession) {
      setCurrentSession({
        ...currentSession,
        messages: [],
        lastActivity: new Date()
      })
    }
  }, [currentSession])

  // Start research workflow
  const startResearch = useCallback((topic: string) => {
    setIsResearching(true)
    sendMessage(`research ${topic}`)
  }, [sendMessage])

  // Save memo
  const saveMemo = useCallback((content: string, title?: string) => {
    if (!currentSession) return

    const memo = {
      id: `memo-${Date.now()}`,
      title: title || `Research Memo - ${currentSession.projectName}`,
      content: content,
      chatId: currentSession.id,
      date: new Date().toISOString(),
      author: 'AI Research Assistant',
      projectId: currentSession.projectId
    }

    // Save to localStorage
    const existingMemos = JSON.parse(localStorage.getItem(`memos-${currentSession.projectId}`) || '[]')
    existingMemos.push(memo)
    localStorage.setItem(`memos-${currentSession.projectId}`, JSON.stringify(existingMemos))

    // Trigger memo update event
    window.dispatchEvent(new Event('memoUpdated'))

    return memo
  }, [currentSession])

  // Context value
  const contextValue: AIContextType = {
    currentSession,
    isOpen,
    openAI,
    closeAI,
    sendMessage,
    clearSession,
    startResearch,
    saveMemo,
    isTyping,
    isResearching
  }

  // Make context available to children
  const childrenWithProps = typeof children === 'function' 
    ? children(contextValue)
    : children

  if (!enableAI) {
    return <>{childrenWithProps}</>
  }

  console.log('UnifiedAISystem render - isOpen:', isOpen, 'currentSession:', !!currentSession)

  return (
    <AIContext.Provider value={contextValue}>
      <div className="relative">
        {childrenWithProps}
        {isOpen && currentSession && (
          <OpenResearchCanvas
            projectId={currentSession.projectId}
            projectName={currentSession.projectName}
            projectType={currentSession.projectType}
            memoId={currentMemoId}
            isOpen={isOpen}
            onClose={closeAI}
            onSaveMemo={(memo) => {
              console.log('Memo saved:', memo)
              window.dispatchEvent(new Event('memoUpdated'))
            }}
          />
        )}
      </div>
    </AIContext.Provider>
  )
}

// Hook to use AI context
export function useAI(): AIContextType {
  const context = useContext(AIContext)
  console.log('useAI hook called, context:', !!context)
  if (!context) {
    console.error('useAI called outside UnifiedAISystem!')
    throw new Error('useAI must be used within UnifiedAISystem')
  }
  return context
}

// Convenience hooks for specific features
export function useAIChat() {
  const { sendMessage, currentSession, isTyping } = useAI()
  return { sendMessage, messages: currentSession?.messages || [], isTyping }
}

export function useAIResearch() {
  const { startResearch, isResearching, saveMemo } = useAI()
  return { startResearch, isResearching, saveMemo }
}

export function useAISession() {
  const { currentSession, openAI, closeAI, clearSession } = useAI()
  return { session: currentSession, openAI, closeAI, clearSession }
}