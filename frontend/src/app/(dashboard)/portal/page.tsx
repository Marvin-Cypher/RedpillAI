'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'
import { 
  TrendingUp, 
  FileText, 
  BarChart3, 
  Calendar,
  Search,
  Filter,
  Eye,
  ExternalLink,
  Star,
  Clock,
  Activity,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  Grid,
  Target,
  Briefcase,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Settings,
  Zap,
  Brain,
  Globe,
  BookOpen,
  Users,
  Rocket,
  Shield,
  Database
} from 'lucide-react'
import { 
  creationAPI, 
  CreationSummary, 
  CreationCategories, 
  PortfolioContext 
} from '@/lib/api/creations'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c']

interface QuickStat {
  label: string
  value: string | number
  change?: string
  icon: React.ReactNode
  color: string
}

interface DashboardModule {
  name: string
  description: string
  path: string
  icon: React.ReactNode
  color: string
  stats: string
  status: 'active' | 'beta' | 'coming-soon'
}

export default function RedPillPortal() {
  const [creations, setCreations] = useState<CreationSummary[]>([])
  const [categories, setCategories] = useState<CreationCategories | null>(null)
  const [portfolioContext, setPortfolioContext] = useState<PortfolioContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState('overview')

  const userId = 'default'

  useEffect(() => {
    loadPortalData()
  }, [])

  const loadPortalData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [recentCreations, categoriesData] = await Promise.all([
        creationAPI.getUserCreations(userId, { limit: 20 }),
        creationAPI.getCreationCategories(userId)
      ])

      setCreations(recentCreations)
      setCategories(categoriesData)

      // Load portfolio context if we have symbols
      const allSymbols = [...new Set(recentCreations.flatMap(c => c.symbols))].slice(0, 15)
      if (allSymbols.length > 0) {
        const portfolioData = await creationAPI.getPortfolioContextCreations(userId, allSymbols)
        setPortfolioContext(portfolioData)
      }

    } catch (err) {
      console.error('Failed to load portal data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
      // Set fallback data
      setCreations([])
      setCategories({ categories: [], total_creations: 0 })
    } finally {
      setLoading(false)
    }
  }

  const quickStats: QuickStat[] = [
    {
      label: 'Total Creations',
      value: categories?.total_creations || 0,
      change: '+12% this month',
      icon: <Database className="w-5 h-5" />,
      color: 'text-blue-600'
    },
    {
      label: 'Active Charts',
      value: categories?.categories?.find(c => c.name === 'market_data')?.count || 0,
      change: '+8 today',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-green-600'
    },
    {
      label: 'Research Reports',
      value: categories?.categories?.find(c => c.name === 'company_research')?.count || 0,
      change: '+3 this week',
      icon: <FileText className="w-5 h-5" />,
      color: 'text-purple-600'
    },
    {
      label: 'Portfolio Symbols',
      value: portfolioContext?.symbols_analyzed?.length || 0,
      change: 'Tracked actively',
      icon: <Target className="w-5 h-5" />,
      color: 'text-orange-600'
    }
  ]

  const dashboardModules: DashboardModule[] = [
    {
      name: 'Investment CRM',
      description: 'Organize and analyze all your OpenBB research and analysis',
      path: '/investment-crm',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      stats: `${categories?.total_creations || 0} items`,
      status: 'active'
    },
    {
      name: 'Chart Viewer',
      description: 'Interactive charts and visualizations from OpenBB',
      path: '/chart-viewer',
      icon: <LineChartIcon className="w-6 h-6" />,
      color: 'bg-green-50 text-green-600 border-green-200',
      stats: `${categories?.categories?.find(c => c.name === 'market_data')?.count || 0} charts`,
      status: 'active'
    },
    {
      name: 'Portfolio Intelligence',
      description: 'AI-powered portfolio analysis and insights',
      path: '/portfolio-intelligence',
      icon: <Brain className="w-6 h-6" />,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      stats: `${portfolioContext?.symbols_analyzed?.length || 0} symbols`,
      status: 'beta'
    },
    {
      name: 'Research Workspace',
      description: 'Collaborative research environment with AI assistance',
      path: '/research-workspace',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      stats: `${categories?.categories?.find(c => c.name === 'company_research')?.count || 0} reports`,
      status: 'beta'
    },
    {
      name: 'Market Intelligence',
      description: 'Real-time market data and analytics dashboard',
      path: '/market-intelligence',
      icon: <Activity className="w-6 h-6" />,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      stats: 'Live feeds',
      status: 'coming-soon'
    },
    {
      name: 'Trading Signals',
      description: 'AI-generated trading signals and alerts',
      path: '/trading-signals',
      icon: <Zap className="w-6 h-6" />,
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      stats: 'Smart alerts',
      status: 'coming-soon'
    }
  ]

  const categoryChartData = categories?.categories?.map(cat => ({
    name: cat.name.replace('_', ' ').toUpperCase(),
    value: cat.count,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]
  })) || []

  const recentActivity = creations.slice(0, 5).map(creation => ({
    title: creation.title,
    type: creation.creation_type,
    category: creation.category,
    symbols: creation.symbols,
    created_at: new Date(creation.created_at).toLocaleDateString(),
    chart_url: creation.chart_url
  }))

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Loading RedPill Portal</h2>
        <p className="text-gray-600 text-sm">Connecting to OpenBB intelligence network...</p>
      </div>
    )
  }

  if (error && creations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <AlertTriangle className="w-16 h-16 text-red-500" />
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Portal Offline</h2>
          <p className="text-gray-600 mt-1">{error}</p>
          <Button onClick={loadPortalData} className="mt-4">
            <Shield className="w-4 h-4 mr-2" />
            Reconnect
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="border-b bg-white/70 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">RedPill Portal</h1>
                  <p className="text-sm text-gray-600">OpenBB Intelligence Platform</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-green-600 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    {stat.change && (
                      <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-lg bg-gray-50 ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dashboard Modules */}
        <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Grid className="w-5 h-5" />
              <span>Intelligence Modules</span>
            </CardTitle>
            <CardDescription>
              Access your OpenBB-powered investment intelligence tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardModules.map((module, index) => (
                <Link key={index} href={module.path}>
                  <Card className={`cursor-pointer hover:shadow-md transition-shadow border ${module.color} hover:scale-[1.02] transition-transform`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2 rounded-lg bg-white/50">
                          {module.icon}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={module.status === 'active' ? 'default' : module.status === 'beta' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {module.status === 'active' ? 'LIVE' : module.status === 'beta' ? 'BETA' : 'SOON'}
                          </Badge>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{module.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{module.stats}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Creation Categories Chart */}
          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChartIcon className="w-5 h-5" />
                <span>Creation Distribution</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  <div className="text-center">
                    <PieChartIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No data available</p>
                    <p className="text-sm">Create some charts to see analytics</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50/50">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {activity.type}
                          </Badge>
                          {activity.symbols.map((symbol, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {symbol}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {activity.created_at}
                      </div>
                      {activity.chart_url && (
                        <Button variant="ghost" size="sm">
                          <Eye className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No recent activity</p>
                    <p className="text-sm">Start creating charts and analysis</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-0 shadow-sm bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Rocket className="w-5 h-5" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Get started with RedPill's most powerful features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="h-auto p-6 justify-start" variant="outline">
                <div className="text-left">
                  <BarChart3 className="w-6 h-6 mb-2" />
                  <h3 className="font-semibold">Create Chart</h3>
                  <p className="text-sm text-gray-600">Generate interactive financial charts</p>
                </div>
              </Button>
              <Button className="h-auto p-6 justify-start" variant="outline">
                <div className="text-left">
                  <Search className="w-6 h-6 mb-2" />
                  <h3 className="font-semibold">Research Company</h3>
                  <p className="text-sm text-gray-600">Deep dive into company analysis</p>
                </div>
              </Button>
              <Button className="h-auto p-6 justify-start" variant="outline">
                <div className="text-left">
                  <Target className="w-6 h-6 mb-2" />
                  <h3 className="font-semibold">Portfolio Review</h3>
                  <p className="text-sm text-gray-600">Analyze portfolio performance</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}