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
  addMessage: (message: AIMessage) => void
  clearSession: () => void
  
  // Chat history management
  getChatHistory: (projectId: string, projectType: string) => AISession[]
  loadChatSession: (sessionId: string) => void
  
  // Advanced features
  startResearch: (topic: string) => void
  openResearch: (projectId?: string, projectType?: 'company' | 'deal' | 'open', projectName?: string) => void
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

  // Save session to localStorage
  const saveSession = useCallback((session: AISession) => {
    if (!session.projectId) {
      console.warn('⚠️ Cannot save session without projectId:', session)
      return
    }
    
    const storageKey = `chat-history-${session.projectId}`
    const existingSessions = JSON.parse(localStorage.getItem(storageKey) || '[]')
    
    console.log('💾 Saving session:', session.id, 'messages:', session.messages?.length, 'to key:', storageKey)
    
    // Update existing session or add new one
    const sessionIndex = existingSessions.findIndex((s: AISession) => s.id === session.id)
    if (sessionIndex >= 0) {
      existingSessions[sessionIndex] = {
        ...session,
        lastActivity: new Date(session.lastActivity)
      }
      console.log('📝 Updated existing session at index:', sessionIndex)
    } else {
      existingSessions.push({
        ...session,
        lastActivity: new Date(session.lastActivity)
      })
      console.log('📋 Added new session to storage')
    }
    
    // Keep only last 20 sessions per project
    if (existingSessions.length > 20) {
      existingSessions.splice(0, existingSessions.length - 20)
    }
    
    localStorage.setItem(storageKey, JSON.stringify(existingSessions))
    console.log('✅ Session saved to localStorage:', storageKey)
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
    
    // Save session immediately when created
    saveSession(session)
    
    console.log('Set isOpen to true')
  }, [createSession])

  // Close AI interface
  const closeAI = useCallback(() => {
    setIsOpen(false)
    setCurrentMemoId(undefined)
    setIsResearching(false) // Reset research state when closing
    // Keep session for potential reopen
  }, [])

  // Add message to current session
  const addMessage = useCallback((message: AIMessage) => {
    if (!currentSession) {
      console.warn('⚠️ Cannot add message without current session')
      return
    }
    
    console.log('📧 Adding message to session:', message.id, message.sender, message.content.substring(0, 50))
    
    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, message],
      lastActivity: new Date()
    }
    
    setCurrentSession(updatedSession)
    
    // Save session immediately after updating state
    setTimeout(() => {
      saveSession(updatedSession)
    }, 100)
  }, [currentSession, saveSession])

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
      saveSession(updatedSession)

      // Call backend API using Next.js proxy route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          projectId: currentSession.projectId,
          conversationHistory: currentSession.messages.map(msg => ({
            role: msg.sender,
            content: msg.content,
            timestamp: msg.timestamp
          }))
        })
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      const data = await response.json()

      // Add AI response to session
      const aiMessage: AIMessage = {
        id: `msg-${Date.now() + 1}`,
        content: data.response || data.content || 'No response',
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
          timestamp: data.timestamp || new Date().toISOString()
        }
      }

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage],
        lastActivity: new Date()
      }
      setCurrentSession(finalSession)
      saveSession(finalSession)

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
      const clearedSession = {
        ...currentSession,
        messages: [],
        lastActivity: new Date()
      }
      setCurrentSession(clearedSession)
      saveSession(clearedSession)
    }
  }, [currentSession, saveSession])

  // Get chat history for a project
  const getChatHistory = useCallback((projectId: string, _projectType: string): AISession[] => {
    const storageKey = `chat-history-${projectId}`
    console.log('📖 Getting chat history from key:', storageKey)
    
    try {
      const rawData = localStorage.getItem(storageKey)
      console.log('📄 Raw localStorage data:', rawData?.substring(0, 200))
      
      const sessions = JSON.parse(rawData || '[]')
      console.log('📚 Parsed sessions count:', sessions.length)
      
      // Convert date strings back to Date objects and ensure messages array exists
      const processedSessions = sessions.map((session: any) => ({
        ...session,
        lastActivity: new Date(session.lastActivity),
        messages: Array.isArray(session.messages) ? session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })) : []
      }))
      
      console.log('✅ Processed sessions:', processedSessions.map((s: AISession) => ({
        id: s.id,
        messageCount: s.messages?.length || 0
      })))
      
      return processedSessions.sort((a: AISession, b: AISession) => b.lastActivity.getTime() - a.lastActivity.getTime())
    } catch (error) {
      console.error('❌ Error parsing chat history:', error)
      return []
    }
  }, [])

  // Load a specific chat session
  const loadChatSession = useCallback((sessionId: string) => {
    if (!currentSession) return
    
    const storageKey = `chat-history-${currentSession.projectId}`
    const sessions = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const session = sessions.find((s: AISession) => s.id === sessionId)
    
    if (session) {
      const restoredSession = {
        ...session,
        lastActivity: new Date(session.lastActivity),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        isActive: true
      }
      setCurrentSession(restoredSession)
      setIsOpen(true)
    }
  }, [currentSession])

  // Start research workflow
  const startResearch = useCallback((topic: string) => {
    setIsResearching(true)
    sendMessage(`research ${topic}`)
  }, [sendMessage])

  // Open research canvas directly
  const openResearch = useCallback((projectId?: string, projectType?: 'company' | 'deal' | 'open', projectName?: string) => {
    console.log('🔬 openResearch called:', { projectId, projectType, projectName })
    
    // Open AI interface with research flag
    openAI({
      projectId: projectId || globalProjectId,
      projectType: projectType || globalProjectType || 'open',
      projectName: projectName || globalProjectName || 'Research Project'
    })
    
    // Set research mode
    setIsResearching(true)
  }, [openAI, globalProjectId, globalProjectType, globalProjectName])

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
      projectId: currentSession.projectId,
      projectType: currentSession.projectType,
      projectName: currentSession.projectName
    }

    // Generate storage key that matches deal page expectations
    const storageKey = currentSession.projectId 
      ? `memos-${currentSession.projectId}` 
      : `memos-${currentSession.projectType}-general`
    
    // Save to localStorage
    const existingMemos = JSON.parse(localStorage.getItem(storageKey) || '[]')
    existingMemos.push(memo)
    localStorage.setItem(storageKey, JSON.stringify(existingMemos))

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
    addMessage,
    clearSession,
    getChatHistory,
    loadChatSession,
    startResearch,
    openResearch,
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
  const { startResearch, openResearch, isResearching, saveMemo } = useAI()
  return { startResearch, openResearch, isResearching, saveMemo }
}

export function useAISession() {
  const { currentSession, openAI, closeAI, clearSession } = useAI()
  return { session: currentSession, openAI, closeAI, clearSession }
}