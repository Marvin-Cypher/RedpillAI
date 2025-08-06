"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import SearchProvider from "@/components/search-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeProvider as RedpillThemeProvider } from '@/components/theme/ThemeProvider'
import { useAuthStore } from '@/lib/stores/authStore'
import { UnifiedAISystem } from '@/components/ai/UnifiedAISystem'

// Auth initialization component
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth)
  const isLoading = useAuthStore((state) => state.isLoading)

  useEffect(() => {
    // Check authentication status on app load
    checkAuth()
  }, [checkAuth])

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return <>{children}</>
}

interface Props {
  children: React.ReactNode
}

export function Providers({ children }: Props) {
  const [open, setOpen] = useState(false)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: (failureCount, error) => {
          // Don't retry on 401 errors
          if (error instanceof Error && error.message.includes('Unauthorized')) {
            return false
          }
          return failureCount < 2
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  }))

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <RedpillThemeProvider>
          <AuthInitializer>
            <UnifiedAISystem>
              <SearchProvider value={{ open, setOpen }}>
                {children}
              </SearchProvider>
            </UnifiedAISystem>
          </AuthInitializer>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </RedpillThemeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
