// Suna Side: Embed Mode Customization
// Add this to Suna to support Redpill branding in embed mode

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

// 1. Customizable Embed Chat Page
export function SunaEmbedPage() {
  const searchParams = useSearchParams()
  const [config, setConfig] = useState({
    brand: 'suna',
    hideNav: false,
    hideLogo: false,
    projectId: null,
    projectName: null,
    theme: 'light'
  })

  useEffect(() => {
    // Read embed configuration
    setConfig({
      brand: searchParams.get('brand') || 'suna',
      hideNav: searchParams.get('hide_nav') === 'true',
      hideLogo: searchParams.get('hide_logo') === 'true',
      projectId: searchParams.get('project_id'),
      projectName: searchParams.get('project_name'),
      theme: searchParams.get('theme') || 'light'
    })

    // Listen for messages from parent
    window.addEventListener('message', handleParentMessage)
    return () => window.removeEventListener('message', handleParentMessage)
  }, [searchParams])

  function handleParentMessage(event: MessageEvent) {
    // Security: Check origin
    if (event.origin !== process.env.NEXT_PUBLIC_VC_CRM_URL) return

    if (event.data.type === 'SEND_MESSAGE') {
      // Programmatically send message
      const input = document.querySelector('[data-chat-input]') as HTMLTextAreaElement
      if (input) {
        input.value = event.data.message
        input.dispatchEvent(new Event('input', { bubbles: true }))
        
        // Trigger send
        const sendButton = document.querySelector('[data-send-button]') as HTMLButtonElement
        sendButton?.click()
      }
    }
  }

  // Apply custom branding
  const brandStyles = config.brand === 'redpill' ? {
    '--brand-primary': '#ef4444', // red-500
    '--brand-primary-dark': '#dc2626', // red-600
    '--brand-name': 'Redpill AI',
    '--brand-logo': '/redpill-logo.svg'
  } : {}

  return (
    <div 
      className="h-screen w-full"
      style={brandStyles as any}
    >
      {/* Hide navigation in embed mode */}
      {!config.hideNav && <SunaNavigation />}

      {/* Chat Interface */}
      <div className={config.hideNav ? 'h-full' : 'h-[calc(100vh-64px)]'}>
        <SunaChat
          initialContext={{
            project_id: config.projectId,
            project_name: config.projectName,
            source: 'embed'
          }}
          hideLogo={config.hideLogo}
          customBrand={config.brand}
        />
      </div>

      <style jsx global>{`
        /* Custom brand theming */
        .suna-logo {
          display: ${config.hideLogo ? 'none' : 'block'};
        }
        
        .brand-name::after {
          content: var(--brand-name, 'Suna');
        }
        
        .btn-primary {
          background: var(--brand-primary, #6366f1);
        }
        
        .btn-primary:hover {
          background: var(--brand-primary-dark, #4f46e5);
        }
        
        /* Hide Suna references */
        ${config.brand === 'redpill' ? `
          *:not(.brand-name)::after {
            content: var(--content);
          }
          
          /* Replace text content */
          .suna-text { display: none; }
          .redpill-text { display: block !important; }
        ` : ''}
      `}</style>
    </div>
  )
}

// 2. Modified Suna Chat Component for Embedding
export function SunaChat({ 
  initialContext, 
  hideLogo, 
  customBrand 
}: {
  initialContext?: any
  hideLogo?: boolean
  customBrand?: string
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  // Custom welcome message based on brand
  const welcomeMessage = customBrand === 'redpill' 
    ? "Welcome to Redpill AI Research. How can I help you analyze this investment opportunity?"
    : "Hello! I'm Suna, your AI assistant. How can I help you today?"

  useEffect(() => {
    // Set initial welcome message
    setMessages([{
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }])

    // If project context, add context message
    if (initialContext?.project_name) {
      setMessages(prev => [...prev, {
        id: '2',
        role: 'system',
        content: `Researching: ${initialContext.project_name}`,
        timestamp: new Date()
      }])
    }
  }, [initialContext, welcomeMessage])

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Custom branded header for embed */}
      {customBrand === 'redpill' && (
        <div className="px-4 py-2 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-sm font-medium">Redpill AI Research Assistant</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message}
            customBrand={customBrand}
          />
        ))}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              customBrand === 'redpill' 
                ? "Ask about investment risks, market analysis, team background..."
                : "Ask me anything..."
            }
            className="min-h-[60px]"
            data-chat-input
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button
            onClick={handleSend}
            className={
              customBrand === 'redpill'
                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                : ""
            }
            data-send-button
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  )

  function handleSend() {
    if (!input.trim()) return
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    
    // Send to Suna backend with context
    sendToBackend(input, initialContext)
  }
}

// 3. Shared UI Components (Copy these to VC CRM)
export const sharedComponents = {
  // Button component that both apps use
  Button: `
    import { cn } from '@/lib/utils'
    
    export function Button({ className, variant = 'default', size = 'default', ...props }) {
      return (
        <button
          className={cn(
            'inline-flex items-center justify-center rounded-md font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50',
            {
              'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
              'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
              'border border-input bg-background hover:bg-accent': variant === 'outline',
              'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            },
            {
              'h-10 px-4 py-2': size === 'default',
              'h-9 px-3': size === 'sm',
              'h-11 px-8': size === 'lg',
              'h-10 w-10': size === 'icon',
            },
            className
          )}
          {...props}
        />
      )
    }
  `,
  
  // Shared theme configuration
  theme: `
    // tailwind.config.js - Same for both apps
    module.exports = {
      theme: {
        extend: {
          colors: {
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            primary: {
              DEFAULT: "hsl(var(--primary))",
              foreground: "hsl(var(--primary-foreground))",
            },
            secondary: {
              DEFAULT: "hsl(var(--secondary))",
              foreground: "hsl(var(--secondary-foreground))",
            },
            muted: {
              DEFAULT: "hsl(var(--muted))",
              foreground: "hsl(var(--muted-foreground))",
            },
            accent: {
              DEFAULT: "hsl(var(--accent))",
              foreground: "hsl(var(--accent-foreground))",
            },
          },
        },
      },
    }
  `,
  
  // CSS variables for theming
  globalCSS: `
    /* globals.css - Same for both apps */
    @layer base {
      :root {
        --background: 0 0% 100%;
        --foreground: 222.2 84% 4.9%;
        --primary: 222.2 47.4% 11.2%;
        --primary-foreground: 210 40% 98%;
        --secondary: 210 40% 96.1%;
        --secondary-foreground: 222.2 47.4% 11.2%;
        --muted: 210 40% 96.1%;
        --muted-foreground: 215.4 16.3% 46.9%;
        --accent: 210 40% 96.1%;
        --accent-foreground: 222.2 47.4% 11.2%;
      }
      
      .dark {
        --background: 222.2 84% 4.9%;
        --foreground: 210 40% 98%;
        /* ... dark mode colors ... */
      }
      
      /* Redpill brand override */
      .redpill-theme {
        --primary: 0 72.2% 50.6%; /* red-500 */
        --primary-foreground: 0 0% 100%;
      }
    }
  `
}

// 4. Utility to sync UI libraries
export const setupInstructions = `
# Copy Suna's UI components to your VC CRM

1. Copy UI components:
   cp -r suna/frontend/components/ui/* vc-crm/frontend/src/components/ui/

2. Copy utilities:
   cp suna/frontend/lib/utils.ts vc-crm/frontend/src/lib/utils.ts

3. Install same dependencies:
   cd vc-crm/frontend
   npm install @radix-ui/react-dialog @radix-ui/react-sheet @radix-ui/react-scroll-area
   npm install framer-motion clsx tailwind-merge

4. Update tailwind.config.js to match Suna's

5. Add Redpill theme class to your app:
   <body className="redpill-theme">
`