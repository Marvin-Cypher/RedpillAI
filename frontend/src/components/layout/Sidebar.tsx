'use client'

import { ReactNode } from 'react'

interface SidebarProps {
  children: ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <div className="w-80 bg-dark-800 border-r border-dark-700 p-6 overflow-y-auto">
      {children}
    </div>
  )
}