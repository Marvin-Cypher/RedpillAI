'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Search,
  FileText,
  X,
  Minimize2,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CopilotSidebar } from "@copilotkit/react-ui"
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core"

interface ResearchCanvasAIProps {
  projectId?: string
  projectName?: string
  projectType?: 'company' | 'deal' | 'open'
  isOpen?: boolean
  onClose?: () => void
}

interface ResearchSection {
  id: string
  title: string
  content: string
  status: 'pending' | 'in_progress' | 'completed'
  type: 'overview' | 'market' | 'risks' | 'team' | 'financials'
}

export function ResearchCanvasAI({ 
  projectId, 
  projectName = 'Dashboard', 
  projectType = 'open',
  isOpen = true,
  onClose 
}: ResearchCanvasAIProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [researchSections, setResearchSections] = useState<ResearchSection[]>([])
  const [chatId, setChatId] = useState<string | null>(null)
  
  // Track if user has started typing
  const [hasStartedTyping, setHasStartedTyping] = useState(false)
  
  // Use a simpler approach - monitor for any interaction
  useEffect(() => {
    if (hasStartedTyping && !isExpanded) {
      console.log('User started typing, expanding canvas')
      setIsExpanded(true)
    }
  }, [hasStartedTyping, isExpanded])
  
  // Monitor for chat ID in messages
  useEffect(() => {
    const checkForChatId = () => {
      // Look for chat ID in any message elements
      const messageElements = document.querySelectorAll('[class*="message"], [class*="Message"]')
      messageElements.forEach(element => {
        const text = element.textContent || ''
        const chatIdMatch = text.match(/Chat ID: (chat_[a-f0-9]{8})/)
        if (chatIdMatch && chatIdMatch[1] && chatIdMatch[1] !== chatId) {
          setChatId(chatIdMatch[1])
          console.log('Chat ID found in message:', chatIdMatch[1])
        }
      })
    }
    
    // Check periodically
    const interval = setInterval(checkForChatId, 1000)
    return () => clearInterval(interval)
  }, [chatId])

  // Make project context available to AI
  useCopilotReadable({
    description: `Current project context for ${projectType} analysis`,
    value: {
      projectId,
      projectName,
      projectType,
      isExpanded,
      researchSections: researchSections.map(section => ({
        title: section.title,
        status: section.status,
        type: section.type
      }))
    }
  })

  // Action to create research sections
  useCopilotAction({
    name: "createResearchSection",
    description: "Create a new research section with content",
    parameters: [
      {
        name: "title",
        type: "string",
        description: "Section title"
      },
      {
        name: "content",
        type: "string", 
        description: "Section content"
      },
      {
        name: "type",
        type: "string",
        description: "Section type (overview, market, risks, team, financials)"
      }
    ],
    handler: async ({ title, content, type }) => {
      const newSection: ResearchSection = {
        id: `section_${Date.now()}`,
        title,
        content,
        status: 'completed',
        type: type as ResearchSection['type']
      }
      setResearchSections(prev => [...prev, newSection])
    }
  })

  // Action to process AI response and extract chat ID
  useCopilotAction({
    name: "processResponse",
    description: "Process AI response and extract metadata",
    parameters: [
      {
        name: "content",
        type: "string",
        description: "Response content"
      }
    ],
    handler: async ({ content }) => {
      // Extract chat ID from response
      const chatIdMatch = content?.match(/Chat ID: (chat_[a-f0-9]{8})/)
      if (chatIdMatch && chatIdMatch[1]) {
        setChatId(chatIdMatch[1])
        console.log('Chat ID extracted:', chatIdMatch[1])
      }
    }
  })

  // Initialize research sections when expanded
  useEffect(() => {
    if (isExpanded && researchSections.length === 0) {
      const initialSections: ResearchSection[] = [
        {
          id: 'overview',
          title: `${projectName} Overview`,
          content: '',
          status: 'pending',
          type: 'overview'
        },
        {
          id: 'market',
          title: 'Market Analysis',
          content: '',
          status: 'pending',
          type: 'market'
        },
        {
          id: 'risks',
          title: 'Risk Assessment',
          content: '',
          status: 'pending', 
          type: 'risks'
        }
      ]
      setResearchSections(initialSections)
    }
  }, [isExpanded, researchSections.length, projectName])

  // Custom wrapper to intercept user input
  const handleExpansion = useCallback(() => {
    if (!isExpanded) {
      setIsExpanded(true)
    }
  }, [isExpanded])

  // Monitor for CopilotKit input events
  useEffect(() => {
    const checkForInput = () => {
      // Look for CopilotKit input elements
      const inputs = document.querySelectorAll('input, textarea')
      inputs.forEach(input => {
        const parent = input.closest('[class*="copilot"], [class*="Copilot"]')
        if (parent && !input.hasAttribute('data-expansion-listener')) {
          input.setAttribute('data-expansion-listener', 'true')
          
          const handleInteraction = () => {
            if (!isExpanded) {
              console.log('Expanding research canvas on user input')
              setHasStartedTyping(true)
              handleExpansion()
            }
          }
          
          input.addEventListener('focus', handleInteraction)
          input.addEventListener('click', handleInteraction)
          input.addEventListener('input', handleInteraction)
        }
      })
    }

    // Check immediately and then periodically
    checkForInput()
    const interval = setInterval(checkForInput, 500)

    return () => {
      clearInterval(interval)
    }
  }, [isExpanded, handleExpansion])

  if (!isOpen) return null

  // Collapsed sidebar mode
  if (!isExpanded) {
    return (
      <>
        {/* Floating expand button */}
        <div className="fixed right-4 bottom-20 z-50">
          <Button
            onClick={handleExpansion}
            className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Open AI Research Canvas
          </Button>
        </div>
        
        {/* CopilotKit Sidebar */}
        <div className="fixed right-4 bottom-4 z-40">
          <CopilotSidebar
            defaultOpen={true}
            clickOutsideToClose={false}
            labels={{
              title: `AI Research`,
              initial: `Click "Open AI Research Canvas" or start typing to begin`,
              placeholder: "Ask anything..."
            }}
            instructions={`You are a VC research assistant for ${projectType} ${projectName}. IMPORTANT: When responding, include the chat_id in your response like this: "Chat ID: {chat_id}". Use createResearchSection to organize findings.`}
            className="copilot-vc-sidebar"
          >
            <div className="flex items-center justify-between p-2 border-b">
              <Badge variant="outline" className="text-xs">
                {projectName} | {chatId || 'No chat ID yet'}
              </Badge>
            </div>
          </CopilotSidebar>
        </div>
      </>
    )
  }

  // Expanded research canvas mode
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 bg-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="font-semibold text-gray-900">AI Research Canvas</h2>
              <p className="text-sm text-gray-600">
                {projectName} Analysis | {chatId || 'Initializing...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {researchSections.length} sections
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-8 w-8 p-0"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Split layout: Chat + Research */}
        <div className="flex h-[calc(100vh-73px)]">
          {/* Left: Chat Interface */}
          <div className="w-1/2 border-r">
            <CopilotSidebar
              defaultOpen={true}
              clickOutsideToClose={false}
              labels={{
                title: "Research Assistant",
                initial: `I'm analyzing ${projectName}. What would you like to know?`,
                placeholder: "Ask for analysis, comparisons, or insights..."
              }}
              instructions={`You are conducting deep research on ${projectType} ${projectName}. Use createResearchSection to populate the research canvas with findings. Focus on VC-relevant insights. IMPORTANT: Include the chat_id in your responses.`}
              className="h-full border-none shadow-none"
            />
          </div>

          {/* Right: Research Documents */}
          <div className="w-1/2 overflow-y-auto bg-gray-50">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium text-gray-900">Research Sections</h3>
              </div>

              {researchSections.length === 0 ? (
                <Card className="p-8 text-center">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-900 mb-2">Ready for Research</h4>
                  <p className="text-gray-600 text-sm">
                    Ask the AI assistant to start analyzing {projectName}
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {researchSections.map((section) => (
                    <Card key={section.id} className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{section.title}</h4>
                        <Badge 
                          variant={section.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {section.status}
                        </Badge>
                      </div>
                      {section.content ? (
                        <div className="prose prose-sm max-w-none text-gray-700">
                          <p>{section.content}</p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <div className="animate-spin h-3 w-3 border border-gray-300 border-t-gray-600 rounded-full" />
                          Analyzing...
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}