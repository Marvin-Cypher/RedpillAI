'use client'

import { useState } from 'react'
import { CopilotSidebar } from "@copilotkit/react-ui"
import { CopilotKit } from "@copilotkit/react-core"
import { Button } from '@/components/ui/button'
import { MessageSquare, X } from 'lucide-react'

interface ProjectCopilotSidebarProps {
  projectId?: string
  projectName?: string
  children: React.ReactNode
  trigger?: React.ReactNode
}

export function ProjectCopilotSidebar({ 
  projectId, 
  projectName = "Project", 
  children,
  trigger 
}: ProjectCopilotSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const instructions = projectId 
    ? `You are an AI assistant helping with ${projectName}. You have access to project data, financial metrics, and can help with analysis, research, and investment decisions. Answer questions about this specific project and provide insights based on the available data.`
    : "You are an AI assistant for RedPill VC platform. Help users with investment analysis, portfolio management, and due diligence workflows."

  return (
    <CopilotKit
      runtimeUrl="/api/copilot" // We'll need to create this API endpoint
    >
      <div className="relative">
        {/* Trigger Button */}
        {trigger ? (
          <div onClick={() => setIsOpen(!isOpen)}>
            {trigger}
          </div>
        ) : (
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 shadow-lg rounded-full w-14 h-14 p-0"
          >
            {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          </Button>
        )}

        {/* Sidebar */}
        <CopilotSidebar
          defaultOpen={isOpen}
          instructions={instructions}
          labels={{
            title: `${projectName} AI Assistant`,
            initial: projectId 
              ? `How can I help you with ${projectName}? I can analyze metrics, provide insights, or answer questions about this investment.`
              : "How can I help you with your investment analysis today?",
          }}
          className={isOpen ? 'block' : 'hidden'}
        >
          {children}
        </CopilotSidebar>
      </div>
    </CopilotKit>
  )
}

// Simple AI button component for inline use
export function AIButton({ 
  projectId, 
  projectName, 
  onClick 
}: { 
  projectId?: string
  projectName?: string
  onClick?: () => void 
}) {
  return (
    <Button
      onClick={onClick}
      size="sm"
      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md"
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      AI
    </Button>
  )
}