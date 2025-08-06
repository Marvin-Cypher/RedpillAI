"use client"

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
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
  }, [])

  // Save session to localStorage
  const saveSession = useCallback((session: AISession) => {
    if (typeof window === 'undefined') return
    
    if (!session.projectId) {
      console.warn('⚠️ Cannot save session without projectId:', session)
      return
    }
    
    const storageKey = `chat-history-${session.projectId}`
    const existingSessions = JSON.parse(localStorage.getItem(storageKey) || '[]')
    
    // Update existing session or add new one
    const sessionIndex = existingSessions.findIndex((s: AISession) => s.id === session.id)
    if (sessionIndex >= 0) {
      existingSessions[sessionIndex] = {
        ...session,
        lastActivity: new Date(session.lastActivity)
      }
    } else {
      existingSessions.push({
        ...session,
        lastActivity: new Date(session.lastActivity)
      })
    }
    
    // Keep only last 20 sessions per project
    if (existingSessions.length > 20) {
      existingSessions.splice(0, existingSessions.length - 20)
    }
    
    localStorage.setItem(storageKey, JSON.stringify(existingSessions))
  }, [])

  // Create new session
  const createSession = useCallback((options: {
    projectId?: string
    projectType?: 'company' | 'deal' | 'open'
    projectName?: string
  }) => {
    const session: AISession = {
      id: generateSessionId(),
      projectId: options.projectId || globalProjectId || 'general',
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
    // Create or update session
    const session = createSession({
      projectId: options?.projectId,
      projectType: options?.projectType,
      projectName: options?.projectName
    })
    
    setCurrentSession(session)
    setCurrentMemoId(options?.memoId)
    setIsOpen(true)
    
    // Save session immediately when created
    saveSession(session)
  }, [createSession, saveSession])

  // Close AI interface
  const closeAI = useCallback(() => {
    setIsOpen(false)
    setCurrentMemoId(undefined)
    setIsResearching(false)
  }, [])

  // Add message to current session
  const addMessage = useCallback((message: AIMessage) => {
    if (!currentSession) {
      console.warn('⚠️ Cannot add message without current session')
      return
    }
    
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

      // Call backend API through proxy route
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
        content: data.response || data.content || 'I apologize, but I could not process your request at this time.',
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
      
      // Add fallback AI message for demo purposes
      const fallbackMessage: AIMessage = {
        id: `msg-${Date.now() + 2}`,
        content: `I understand you're asking about: "${content}". While I'm currently in demo mode, I can help analyze deals, research companies, and provide investment insights. What specific aspect would you like to explore?`,
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      }

      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, fallbackMessage],
        lastActivity: new Date()
      } : null)
    } finally {
      setIsTyping(false)
    }
  }, [currentSession, saveSession])

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
    if (typeof window === 'undefined') return []
    
    const storageKey = `chat-history-${projectId}`
    
    try {
      const rawData = localStorage.getItem(storageKey)
      const sessions = JSON.parse(rawData || '[]')
      
      // Convert date strings back to Date objects and ensure messages array exists
      const processedSessions = sessions.map((session: any) => ({
        ...session,
        lastActivity: new Date(session.lastActivity),
        messages: Array.isArray(session.messages) ? session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })) : []
      }))
      
      return processedSessions.sort((a: AISession, b: AISession) => b.lastActivity.getTime() - a.lastActivity.getTime())
    } catch (error) {
      console.error('Error parsing chat history:', error)
      return []
    }
  }, [])

  // Load a specific chat session
  const loadChatSession = useCallback((sessionId: string) => {
    if (!currentSession || typeof window === 'undefined') return
    
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
    if (!currentSession || typeof window === 'undefined') return

    const memo = {
      id: `memo-${Date.now()}`,
      title: title || `Research Memo - ${currentSession.projectName}`,
      content: content,
      type: 'ai' as const,
      author: 'AI Research Assistant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: currentSession.projectId,
      projectType: currentSession.projectType,
      projectName: currentSession.projectName
    }

    // Use the same storage key as MemoViewer
    const existingMemos = JSON.parse(localStorage.getItem('ai_memos') || '[]')
    existingMemos.push(memo)
    localStorage.setItem('ai_memos', JSON.stringify(existingMemos))

    // Trigger memo update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('memoUpdated'))
    }

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

  return (
    <AIContext.Provider value={contextValue}>
      {childrenWithProps}
      {enableAI && isOpen && currentSession && (
        <div className="relative z-50">
          <OpenResearchCanvas
            projectId={currentSession.projectId}
            projectName={currentSession.projectName}
            projectType={currentSession.projectType}
            memoId={currentMemoId}
            isOpen={isOpen}
            onClose={closeAI}
            onSaveMemo={(memo) => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('memoUpdated'))
              }
            }}
          />
        </div>
      )}
    </AIContext.Provider>
  )
}

// Hook to use AI context
export function useAI(): AIContextType {
  const context = useContext(AIContext)
  if (!context) {
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