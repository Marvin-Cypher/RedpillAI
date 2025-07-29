'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Maximize2, 
  Minimize2, 
  Brain, 
  Search,
  FileText,
  TrendingUp,
  X,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CopilotSidebar } from "@copilotkit/react-ui"
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core"

interface HybridAIInterfaceProps {
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

export function HybridAIInterface({ 
  projectId, 
  projectName = 'Dashboard', 
  projectType = 'open',
  isOpen = true,
  onClose 
}: HybridAIInterfaceProps) {
  const [layoutMode, setLayoutMode] = useState<'sidebar' | 'canvas'>('sidebar')
  const [isExpanding, setIsExpanding] = useState(false)
  const [researchSections, setResearchSections] = useState<ResearchSection[]>([])
  const [currentResearch, setCurrentResearch] = useState<string | null>(null)

  // Track if this is the first user interaction
  const [hasUserInteracted, setHasUserInteracted] = useState(false)

  // Make project context available to AI
  useCopilotReadable({
    description: `Current project context for ${projectType} analysis`,
    value: {
      projectId,
      projectName,
      projectType,
      layoutMode,
      researchSections: researchSections.map(section => ({
        title: section.title,
        status: section.status,
        type: section.type
      }))
    }
  })

  // Action to capture any user message and expand immediately
  useCopilotAction({
    name: "handleUserMessage",
    description: "Handle any user message and expand to research canvas",
    parameters: [
      {
        name: "message",
        type: "string",
        description: "User's message"
      }
    ],
    handler: async ({ message }) => {
      // Always expand on first user input
      if (!hasUserInteracted && layoutMode === 'sidebar') {
        setHasUserInteracted(true)
        await expandToCanvas('general', null)
      }
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

  const expandToCanvas = async (researchType: string, sections?: any) => {
    setIsExpanding(true)
    setCurrentResearch(researchType)
    
    // Initialize research sections
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
    
    // Animate to canvas mode
    setTimeout(() => {
      setLayoutMode('canvas')
      setIsExpanding(false)
    }, 300)
  }

  const collapseToSidebar = () => {
    setLayoutMode('sidebar')
    setResearchSections([])
    setCurrentResearch(null)
  }

  // Sidebar mode component
  const SidebarMode = () => (
    <CopilotSidebar
      defaultOpen={isOpen}
      clickOutsideToClose={false}
      labels={{
        title: `AI Assistant`,
        initial: `Hello! I'm your VC research assistant for ${projectName}. Ask me anything and I'll open a full research canvas to help you.`,
        placeholder: "Ask me anything..."
      }}
      instructions={`You are a specialized VC research assistant. IMPORTANT: For ANY user message, immediately call the handleUserMessage action first to expand the interface. Then provide comprehensive analysis for ${projectType} ${projectName}.`}
      className="copilot-vc-sidebar"
    >
      <div className="flex items-center justify-between p-2 border-b">
        <Badge variant="outline" className="text-xs">
          {projectName} | {projectType}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => expandToCanvas('general', null)}
          className="h-6 w-6 p-0"
        >
          <Maximize2 className="h-3 w-3" />
        </Button>
      </div>
    </CopilotSidebar>
  )

  // Canvas mode component
  const CanvasMode = () => (
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
              Deep analysis for {projectName} ({currentResearch})
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
            onClick={collapseToSidebar}
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
              initial: `I'm conducting deep research on ${projectName}. Ask me to analyze specific aspects or update the research sections.`,
              placeholder: "Ask for analysis, comparisons, or research updates..."
            }}
            instructions={`You are conducting deep research on ${projectType} ${projectName}. Use createResearchSection to populate the research canvas with findings. Focus on VC-relevant insights: market size, competitive landscape, team assessment, financial metrics, and investment risks.`}
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
                  Ask the AI assistant to start analyzing {projectName}. Research sections will appear here.
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
  )

  return (
    <AnimatePresence mode="wait">
      {layoutMode === 'sidebar' ? (
        <SidebarMode key="sidebar" />
      ) : (
        <CanvasMode key="canvas" />
      )}
    </AnimatePresence>
  )
}