"use client"

import { useState } from 'react'
import { EnhancedAgenticChat } from '@/components/ai/EnhancedAgenticChat'
import { AgenticChatButton } from '@/components/ai/AgenticChatInterface'
import { Brain } from 'lucide-react'
import { motion } from 'framer-motion'

interface RedpillChatProps {
  project: any
  isOpen: boolean
  onClose: () => void
  mode?: 'slide' | 'inline' | 'fullscreen'
  onModeChange?: (mode: 'slide' | 'inline' | 'fullscreen') => void
}

export function RedpillChat({
  project,
  isOpen,
  onClose,
  mode = 'slide',
  onModeChange
}: RedpillChatProps) {
  // Convert project to the format expected by EnhancedAgenticChat
  const formattedProject = project ? {
    id: project.id || project.company_id || 'unknown',
    name: project.name || project.company_name || 'Unknown Company',
    sector: project.sector || 'Technology',
    stage: project.stage || project.investment?.round_type || 'Unknown',
    dealStatus: project.deal_status || project.status,
    type: project.company_id ? 'deal' : 'company' // Determine if it's a deal or company
  } : undefined

  return (
    <EnhancedAgenticChat
      project={formattedProject}
      isOpen={isOpen}
      onToggle={(open) => open ? undefined : onClose()}
    >
      <div /> {/* Empty children since this is used as overlay */}
    </EnhancedAgenticChat>
  )
}

// Floating Chat Button for other pages
export function FloatingRedpillButton() {
  const [open, setOpen] = useState(false)
  
  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow z-40"
      >
        <Brain className="w-6 h-6" />
      </motion.button>

      <EnhancedAgenticChat
        project={undefined}
        isOpen={open}
        onToggle={(open) => setOpen(open)}
      >
        <div /> {/* Empty children since this is used as overlay */}
      </EnhancedAgenticChat>
    </>
  )
}