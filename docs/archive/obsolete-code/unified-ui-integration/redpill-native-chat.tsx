// Redpill Native Chat Integration
// Seamless inline chat using Suna's UI components and styling

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion' // Same as Suna
import { cn } from '@/lib/utils' // Suna's utility function

// Import Suna's UI components (after copying to our project)
import { Button } from '@/components/ui/button' // Suna's button
import { Card } from '@/components/ui/card' // Suna's card
import { ScrollArea } from '@/components/ui/scroll-area' // Suna's scroll
import { Textarea } from '@/components/ui/textarea' // Suna's textarea
import { Avatar } from '@/components/ui/avatar' // Suna's avatar
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet' // Suna's sheet

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 1. Project Page with Inline Chat
export function ProjectDetailPage({ project }: { project: any }) {
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMode, setChatMode] = useState<'inline' | 'slide' | 'fullscreen'>('slide')

  return (
    <div className="min-h-screen bg-background"> {/* Suna's background color */}
      {/* Main Project View */}
      <div className={cn(
        "transition-all duration-300",
        chatOpen && chatMode === 'inline' ? 'lg:pr-[500px]' : ''
      )}>
        <ProjectHeader project={project} onChatToggle={() => setChatOpen(!chatOpen)} />
        <ProjectContent project={project} />
      </div>

      {/* Inline Chat - Fixed Right Side */}
      {chatMode === 'inline' && (
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 500, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed right-0 top-0 h-screen bg-background border-l"
            >
              <RedpillChat
                project={project}
                onClose={() => setChatOpen(false)}
                onModeChange={setChatMode}
                mode="inline"
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Slide-over Chat (Suna's Sheet component) */}
      {chatMode === 'slide' && (
        <Sheet open={chatOpen} onOpenChange={setChatOpen}>
          <SheetContent side="right" className="w-[500px] sm:w-[600px] p-0">
            <RedpillChat
              project={project}
              onClose={() => setChatOpen(false)}
              onModeChange={setChatMode}
              mode="slide"
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Fullscreen Modal */}
      {chatMode === 'fullscreen' && chatOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          <RedpillChat
            project={project}
            onClose={() => setChatOpen(false)}
            onModeChange={setChatMode}
            mode="fullscreen"
          />
        </motion.div>
      )}
    </div>
  )
}

// 2. Redpill Chat Component (Embedded Suna)
export function RedpillChat({ 
  project, 
  onClose, 
  onModeChange,
  mode = 'slide' 
}: { 
  project: any
  onClose: () => void
  onModeChange: (mode: 'inline' | 'slide' | 'fullscreen') => void
  mode: 'inline' | 'slide' | 'fullscreen'
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loading, setLoading] = useState(true)

  // Suna chat URL with context
  const chatUrl = `${process.env.NEXT_PUBLIC_SUNA_URL}/chat/embed?` + new URLSearchParams({
    project_id: project.id,
    project_name: project.name,
    hide_nav: 'true',
    hide_logo: 'true',
    brand: 'redpill',
    theme: 'system' // Inherit our theme
  }).toString()

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with Redpill branding */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <div>
            <h3 className="font-semibold">Redpill AI Research</h3>
            <p className="text-sm text-muted-foreground">{project.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggles */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={mode === 'inline' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onModeChange('inline')}
              className="h-7"
            >
              <SplitIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={mode === 'slide' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onModeChange('slide')}
              className="h-7"
            >
              <SlideIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={mode === 'fullscreen' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onModeChange('fullscreen')}
              className="h-7"
            >
              <ExpandIcon className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <XIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-b bg-muted/30">
        <div className="flex gap-2 flex-wrap">
          <QuickActionButton
            onClick={() => sendToChat('Conduct due diligence research')}
            icon="🔍"
            label="Due Diligence"
          />
          <QuickActionButton
            onClick={() => sendToChat('Analyze competitors and market position')}
            icon="🎯"
            label="Competition"
          />
          <QuickActionButton
            onClick={() => sendToChat('Research founding team backgrounds')}
            icon="👥"
            label="Team"
          />
          <QuickActionButton
            onClick={() => sendToChat('Evaluate investment risks')}
            icon="⚠️"
            label="Risks"
          />
        </div>
      </div>

      {/* Embedded Chat */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 animate-pulse" />
              <p className="text-sm text-muted-foreground">Loading Redpill AI...</p>
            </div>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={chatUrl}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          allow="clipboard-write"
        />
      </div>
    </div>
  )

  function sendToChat(message: string) {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage({
        type: 'SEND_MESSAGE',
        message: message
      }, process.env.NEXT_PUBLIC_SUNA_URL!)
    }
  }
}

// 3. Project Header with integrated chat button
function ProjectHeader({ project, onChatToggle }: { project: any; onChatToggle: () => void }) {
  return (
    <div className="border-b bg-card">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <span className="text-sm text-muted-foreground">
            {project.sector} • {project.round}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Other actions */}
          <Button variant="outline" size="sm">
            Edit Details
          </Button>
          
          {/* Redpill AI Button - Using Suna's button style */}
          <Button 
            onClick={onChatToggle}
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
          >
            <BrainIcon className="w-4 h-4 mr-2" />
            Redpill AI Research
          </Button>
        </div>
      </div>
    </div>
  )
}

// 4. Quick Action Button Component (Suna style)
function QuickActionButton({ 
  onClick, 
  icon, 
  label 
}: { 
  onClick: () => void
  icon: string
  label: string 
}) {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onClick}
      className="h-8 px-3 text-xs"
    >
      <span className="mr-1.5">{icon}</span>
      {label}
    </Button>
  )
}

// 5. Floating Chat Button (Optional - for other pages)
export function FloatingRedpillButton() {
  const [open, setOpen] = useState(false)
  
  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-shadow"
      >
        <BrainIcon className="w-6 h-6" />
      </motion.button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[500px] p-0">
          <RedpillChat
            project={null} // General chat
            onClose={() => setOpen(false)}
            onModeChange={() => {}}
            mode="slide"
          />
        </SheetContent>
      </Sheet>
    </>
  )
}

// 6. Replace Suna References in Text
export const brandConfig = {
  name: 'Redpill AI',
  tagline: 'AI-Powered VC Research',
  colors: {
    primary: 'red',
    gradient: 'from-red-500 to-red-600'
  },
  // Map Suna terms to Redpill
  terminology: {
    'Suna': 'Redpill AI',
    'Suna Chat': 'AI Research',
    'Suna Agent': 'Research Assistant',
    'threads': 'research sessions',
    'workspace': 'portfolio'
  }
}

// Icons (using same icon library as Suna)
const BrainIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const SplitIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h2m6-16h2a2 2 0 012 2v12a2 2 0 01-2 2h-2m-6-8h8" />
  </svg>
)

const SlideIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
  </svg>
)

const ExpandIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
)