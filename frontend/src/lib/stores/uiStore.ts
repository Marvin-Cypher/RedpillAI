import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface UiState {
  // Navigation
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  
  // Theme
  theme: Theme
  
  // Modals and overlays
  modals: {
    newDeal: boolean
    newCompany: boolean
    aiChat: boolean
  }
  
  // Layout preferences
  dashboardLayout: 'grid' | 'list'
  compactMode: boolean
  
  // Notifications
  notifications: {
    enabled: boolean
    sound: boolean
  }

  // Actions
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  toggleSidebarCollapsed: () => void
  
  setTheme: (theme: Theme) => void
  
  openModal: (modal: keyof UiState['modals']) => void
  closeModal: (modal: keyof UiState['modals']) => void
  toggleModal: (modal: keyof UiState['modals']) => void
  closeAllModals: () => void
  
  setDashboardLayout: (layout: 'grid' | 'list') => void
  setCompactMode: (compact: boolean) => void
  
  setNotifications: (notifications: Partial<UiState['notifications']>) => void
  
  // Bulk actions
  resetToDefaults: () => void
}

const defaultState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: 'system' as Theme,
  modals: {
    newDeal: false,
    newCompany: false,
    aiChat: false,
  },
  dashboardLayout: 'grid' as const,
  compactMode: false,
  notifications: {
    enabled: true,
    sound: false,
  },
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      // Sidebar actions
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // Theme actions
      setTheme: (theme) => set({ theme }),

      // Modal actions
      openModal: (modal) => set((state) => ({
        modals: { ...state.modals, [modal]: true }
      })),
      closeModal: (modal) => set((state) => ({
        modals: { ...state.modals, [modal]: false }
      })),
      toggleModal: (modal) => set((state) => ({
        modals: { ...state.modals, [modal]: !state.modals[modal] }
      })),
      closeAllModals: () => set({
        modals: {
          newDeal: false,
          newCompany: false,
          aiChat: false,
        }
      }),

      // Layout actions
      setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
      setCompactMode: (compact) => set({ compactMode: compact }),

      // Notification actions
      setNotifications: (notifications) => set((state) => ({
        notifications: { ...state.notifications, ...notifications }
      })),

      // Reset action
      resetToDefaults: () => set(defaultState),
    }),
    {
      name: 'redpill-ui',
      // Exclude temporary states from persistence
      partialize: (state) => {
        const { modals, ...persistedState } = state
        return persistedState
      },
    }
  )
)