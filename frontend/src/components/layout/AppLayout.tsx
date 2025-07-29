'use client'

import { Navigation, TopBar } from './Navigation'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { UnifiedAISystem, FloatingAIButton } from '@/components/ai'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <ThemeProvider>
      <UnifiedAISystem
        globalProjectType="open"
        globalProjectName="RedPill VC Platform"
        enableAI={true}
      >
        {(aiContext) => (
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <TopBar />
            
            <main className="lg:pl-64 w-full overflow-x-hidden">
              <div className="w-full max-w-none lg:max-w-7xl mx-auto">
                {children}
              </div>
            </main>

          </div>
        )}
      </UnifiedAISystem>
    </ThemeProvider>
  )
}