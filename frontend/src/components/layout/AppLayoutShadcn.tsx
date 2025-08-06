'use client'

import { ShadcnAppShellSimple } from './ShadcnAppShellSimple'

interface AppLayoutProps {
  children: React.ReactNode
}

// This is a wrapper that maintains the same interface as the old AppLayout
// but uses the new shadcn-based shell underneath
export default function AppLayoutShadcn({ children }: AppLayoutProps) {
  return <ShadcnAppShellSimple>{children}</ShadcnAppShellSimple>
}