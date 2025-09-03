'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Home,
  BarChart3,
  Briefcase,
  Brain,
  BookOpen,
  Activity,
  Zap,
  Settings,
  Rocket,
  Grid,
  Eye
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
  badge?: string
  status?: 'active' | 'beta' | 'coming-soon'
}

export function MainNavigation() {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    {
      name: 'Portal',
      href: '/portal',
      icon: <Rocket className="w-4 h-4" />,
      status: 'active'
    },
    {
      name: 'Investment CRM',
      href: '/investment-crm',
      icon: <Briefcase className="w-4 h-4" />,
      status: 'active'
    },
    {
      name: 'Chart Viewer',
      href: '/chart-viewer',
      icon: <BarChart3 className="w-4 h-4" />,
      status: 'active'
    },
    {
      name: 'Portfolio Intelligence',
      href: '/portfolio-intelligence',
      icon: <Brain className="w-4 h-4" />,
      badge: 'BETA',
      status: 'beta'
    },
    {
      name: 'Research Workspace',
      href: '/research-workspace',
      icon: <BookOpen className="w-4 h-4" />,
      badge: 'BETA',
      status: 'beta'
    },
    {
      name: 'Market Intelligence',
      href: '/market-intelligence',
      icon: <Activity className="w-4 h-4" />,
      badge: 'SOON',
      status: 'coming-soon'
    },
    {
      name: 'Trading Signals',
      href: '/trading-signals',
      icon: <Zap className="w-4 h-4" />,
      badge: 'SOON',
      status: 'coming-soon'
    }
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      {/* Logo */}
      <div className="flex items-center space-x-2 mb-8 px-2">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-gray-900">RedPill</h1>
          <p className="text-xs text-gray-600">OpenBB Intelligence</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const isDisabled = item.status === 'coming-soon'
          
          return (
            <Link 
              key={item.href} 
              href={isDisabled ? '#' : item.href}
              className={`block ${isDisabled ? 'cursor-not-allowed' : ''}`}
            >
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start h-auto p-3 ${
                  isDisabled 
                    ? 'opacity-50 cursor-not-allowed hover:bg-transparent' 
                    : isActive 
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                    : 'hover:bg-gray-50'
                }`}
                disabled={isDisabled}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span className="font-medium">{item.name}</span>
                  </div>
                  {item.badge && (
                    <Badge 
                      variant={
                        item.status === 'active' ? 'default' : 
                        item.status === 'beta' ? 'secondary' : 'outline'
                      }
                      className="text-xs ml-2"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Quick Stats */}
      <div className="mt-8 p-3 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <Grid className="w-4 h-4 mr-2" />
          Quick Stats
        </h3>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Active Charts</span>
            <span className="font-medium">12</span>
          </div>
          <div className="flex justify-between">
            <span>Analyses</span>
            <span className="font-medium">45</span>
          </div>
          <div className="flex justify-between">
            <span>Symbols Tracked</span>
            <span className="font-medium">8</span>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-8 p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-900">All Systems Online</span>
        </div>
        <p className="text-xs text-green-700 mt-1">
          OpenBB API connected and functioning
        </p>
      </div>
    </div>
  )
}