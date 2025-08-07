"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface GPDashboardLayoutProps {
  children: React.ReactNode
}

export default function GPDashboardLayout({ children }: GPDashboardLayoutProps) {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">GP Dashboard</h2>
        <div className="flex items-center space-x-2">
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
      
      <Tabs defaultValue="fund-performance" className="space-y-4">
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