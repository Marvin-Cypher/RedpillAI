import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '@/lib/api'

export interface User {
  id: string
  email: string
  name?: string
  role?: string
}

interface AuthState {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          console.log('🔄 Auth store: Calling API login...')
          const response = await apiClient.login(email, password)
          console.log('📡 Auth store: API response received:', response)
          
          const user: User = response.user || { 
            id: 'demo-user', 
            email, 
            name: email.split('@')[0] 
          }

          console.log('👤 Auth store: Setting user state:', user)
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          })
          console.log('✅ Auth store: State updated successfully')
        } catch (error) {
          console.error('❌ Auth store error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Login failed'
          set({ 
            error: errorMessage, 
            isLoading: false,
            isAuthenticated: false,
            user: null 
          })
          throw error
        }
      },

      logout: async () => {
        set({ isLoading: true })

        try {
          await apiClient.logout()
        } catch (error) {
          console.warn('Logout API call failed:', error)
        }

        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          error: null 
        })
      },

      checkAuth: async () => {
        // Don't check if already loading
        if (get().isLoading) return
        
        set({ isLoading: true, error: null })

        try {
          // Simple approach: if we have a session from login, consider authenticated
          // This works because login sets the HTTP-only cookies
          const currentState = get()
          
          // If we already have a user from successful login, keep that state
          if (currentState.user && currentState.isAuthenticated) {
            set({ isLoading: false })
            return
          }

          // For now, assume user needs to login (simplified approach)
          // This prevents infinite auth check loops
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null
          })
        } catch (error) {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null
          })
        }
      },

      clearError: () => {
        set({ error: null })
      },

      setUser: (user: User | null) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        })
      },
    }),
    {
      name: 'redpill-auth',
      // Only persist essential user info, not loading states
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)