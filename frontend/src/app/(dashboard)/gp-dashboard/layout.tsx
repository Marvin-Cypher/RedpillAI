"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

interface GPDashboardLayoutProps {
  children: React.ReactNode
}

function GPDashboardContent({ children }: GPDashboardLayoutProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('fund-performance')

  useEffect(() => {
    const tab = searchParams.get('tab') || 'fund-performance'
    setActiveTab(tab)
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`/gp-dashboard?tab=${value}`)
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">GP Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Export Report
          </Button>
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="fund-performance" className="text-xs">Fund Performance</TabsTrigger>
          <TabsTrigger value="portfolio-analytics" className="text-xs">Portfolio Analytics</TabsTrigger>
          <TabsTrigger value="deal-flow" className="text-xs">Deal Flow</TabsTrigger>
          <TabsTrigger value="market-intelligence" className="text-xs">Market Intelligence</TabsTrigger>
          <TabsTrigger value="lp-reporting" className="text-xs">LP Reporting</TabsTrigger>
          <TabsTrigger value="operations" className="text-xs">Operations</TabsTrigger>
          <TabsTrigger value="risk-compliance" className="text-xs">Risk & Compliance</TabsTrigger>
        </TabsList>

        {children}
      </Tabs>
    </div>
  )
}

export default function GPDashboardLayout({ children }: GPDashboardLayoutProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GPDashboardContent>{children}</GPDashboardContent>
    </Suspense>
  )
}