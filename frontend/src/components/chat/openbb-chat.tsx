"use client"

import { AgenticChatInterface } from '@/components/ai/AgenticChatInterface'
import { motion, AnimatePresence } from 'framer-motion'

interface OpenBBChatProps {
  project?: any | null
  isOpen: boolean
  onClose: () => void
  mode?: 'slide' | 'inline' | 'fullscreen'
}

export function OpenBBChat({ project, isOpen, onClose, mode = 'slide' }: OpenBBChatProps) {
  // Convert project to the format expected by AgenticChatInterface
  const formattedProject = project ? {
    id: project.id || project.company_id || 'unknown',
    name: project.name || project.company_name || 'Unknown Company',
    sector: project.sector || 'Technology',
    stage: project.stage || project.investment?.round_type || 'Unknown',
    dealStatus: project.deal_status || project.status
  } : undefined

  const chatVariants = {
    hidden: { x: '100%', opacity: 0 },
    visible: { x: 0, opacity: 1 },
    exit: { x: '100%', opacity: 0 }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={chatVariants}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-2xl z-50"
      >
        <AgenticChatInterface
          project={formattedProject}
          isOpen={true}
          onToggle={(open) => !open && onClose()}
        >
          <div className="h-full flex items-center justify-center text-gray-500">
            {/* This will be hidden when chat is open */}
            Loading chat interface...
          </div>
        </AgenticChatInterface>
      </motion.div>
    </AnimatePresence>
  )
}