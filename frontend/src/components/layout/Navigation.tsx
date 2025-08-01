'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { 
  Home, 
  BarChart3, 
  Building, 
  FileText, 
  Users,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  TrendingUp,
  Briefcase,
  MessageSquare,
  Zap,
  Brain,
  LogOut,
  User
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/authStore'

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home,
    description: 'Fund overview and key metrics'
  },
  { 
    name: 'Deal Flow', 
    href: '/dealflow', 
    icon: TrendingUp,
    description: 'Pipeline management and sourcing'
  },
  { 
    name: 'Portfolio', 
    href: '/portfolio', 
    icon: Briefcase,
    description: 'Investment tracking and monitoring'
  },
  { 
    name: 'Analytics', 
    href: '/analytics', 
    icon: BarChart3,
    description: 'Performance analysis and reporting'
  }
]

const quickActions = [
  { name: 'Workflows', href: '/workflow', icon: FileText },
  { name: 'History', href: '/history', icon: Building }
]

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      await logout()
      // Navigation will be handled by AuthGuard in AppLayout
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <div>
              <h1 className="font-bold text-gray-900">RedPill VC</h1>
              <p className="text-xs text-gray-500">AI-Native Platform</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Main Navigation */}
          <div className="px-3 py-6">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${active 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${active ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `} />
                    <div className="flex-1">
                      <div>{item.name}</div>
                      <div className="text-xs text-gray-500 group-hover:text-gray-600">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-3 pb-6">
            <div className="mb-3">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quick Actions
              </h3>
            </div>
            <div className="space-y-1">
              {quickActions.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <Icon className="mr-3 h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* User Profile and Logout */}
          <div className="px-3 pb-3 mt-auto">
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center space-x-3 px-3 py-2 text-sm">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.name || user?.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.role || 'Investor'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost" 
                size="sm"
                className="w-full justify-start mt-2 text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>

          {/* Bottom section */}
          <div className="px-3 pb-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">AI-Powered</span>
              </div>
              <p className="text-sm text-blue-700">
                Experience the future of venture capital with our AI-native platform
              </p>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile header */}
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              R
            </div>
            <span className="font-bold text-gray-900">RedPill VC</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMobileMenuOpen(false)} />
            <div className="relative flex flex-col w-80 max-w-xs bg-white h-full shadow-xl">
              <div className="flex items-center h-16 px-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    R
                  </div>
                  <div>
                    <h1 className="font-bold text-gray-900">RedPill VC</h1>
                    <p className="text-xs text-gray-500">AI-Native Platform</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="px-3 py-6">
                  <div className="space-y-1">
                    {navigation.map((item) => {
                      const Icon = item.icon
                      const active = isActive(item.href)
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`
                            group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                            ${active 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }
                          `}
                        >
                          <Icon className={`
                            mr-3 h-5 w-5 flex-shrink-0
                            ${active ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                          `} />
                          <div className="flex-1">
                            <div>{item.name}</div>
                            <div className="text-xs text-gray-500 group-hover:text-gray-600">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                <div className="px-3 pb-6">
                  <div className="mb-3">
                    <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Quick Actions
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {quickActions.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          <Icon className="mr-3 h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-gray-500" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* Mobile User Profile and Logout */}
                <div className="px-3 pb-6 mt-auto">
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center space-x-3 px-3 py-2 text-sm mb-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.name || user?.email || 'User'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user?.role || 'Investor'}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        handleLogout()
                      }}
                      variant="ghost" 
                      size="sm"
                      className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export function TopBar() {
  return (
    <div className="lg:pl-64">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-gray-200">
        <div className="flex-1" />
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies, deals..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48 lg:w-64"
              />
            </div>
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <ThemeToggle />

          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
          </Button>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:block text-right">
              <p className="text-sm font-medium text-gray-900">Sarah Chen</p>
              <p className="text-xs text-gray-500">General Partner</p>
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}