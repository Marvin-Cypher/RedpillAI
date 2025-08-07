"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'

export default function RootPage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return

    if (isAuthenticated) {
      // Redirect to dashboard if authenticated
      router.replace('/dashboard')
    } else {
      // Redirect to login if not authenticated
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading RedPill VC...</p>
      </div>
    </div>
  )
}