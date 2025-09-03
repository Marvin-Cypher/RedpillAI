'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
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
  Tag,
  TrendingDown,
  Activity,
  DollarSign,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { 
  creationAPI, 
  CreationSummary, 
  CreationCategories, 
  PortfolioContext 
} from '@/lib/api/creations'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c']

const CATEGORY_ICONS = {
  'market_data': BarChart3,
  'company_research': FileText,
  'portfolio_analysis': TrendingUp,
  'market_intelligence': Activity,
  'risk_management': AlertTriangle,
  'trading_signals': DollarSign,
  'economic_analysis': TrendingDown,
  'technical_analysis': BarChart3
}

const CREATION_TYPE_COLORS = {
  'chart': 'bg-blue-500',
  'table': 'bg-green-500', 
  'report': 'bg-purple-500',
  'screen': 'bg-orange-500',
  'analysis': 'bg-red-500',
  'fundamentals': 'bg-indigo-500',
  'technical': 'bg-yellow-500',
  'options': 'bg-pink-500',
  'economic': 'bg-cyan-500',
  'news': 'bg-gray-500'
}

export default function InvestmentCRMDashboard() {
  const [creations, setCreations] = useState<CreationSummary[]>([])
  const [categories, setCategories] = useState<CreationCategories | null>(null)
  const [portfolioContext, setPortfolioContext] = useState<PortfolioContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSymbol, setSelectedSymbol] = useState<string>('')
  const [activeTab, setActiveTab] = useState('recent')

  // Mock user ID - in real app this would come from auth
  const userId = 'default'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load recent creations and categories
      const [recentCreations, categoriesData] = await Promise.all([
        creationAPI.getUserCreations(userId, { limit: 50 }),
        creationAPI.getCreationCategories(userId)
      ])

      setCreations(recentCreations)
      setCategories(categoriesData)

      // Load portfolio context if we have symbols
      const allSymbols = [...new Set(recentCreations.flatMap(c => c.symbols))].slice(0, 10)
      if (allSymbols.length > 0) {
        const portfolioData = await creationAPI.getPortfolioContextCreations(userId, allSymbols)
        setPortfolioContext(portfolioData)
      }

    } catch (err) {
      console.error('Failed to load Investment CRM data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
      // Fallback to show some data even if API fails
      setCreations([])
      setCategories({ categories: [], total_creations: 0 })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadData()
      return
    }

    try {
      setLoading(true)
      const searchResults = await creationAPI.searchCreations(userId, query, 20)
      setCreations(searchResults)
    } catch (err) {
      console.error('Search failed:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle search input changes with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        handleSearch(searchQuery)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const filteredCreations = creations.filter(creation => {
    const matchesCategory = selectedCategory === 'all' || creation.category === selectedCategory
    const matchesSymbol = selectedSymbol === '' || creation.symbols.includes(selectedSymbol)
    
    return matchesCategory && matchesSymbol
  })

  const categoryChartData = categories?.categories?.map(cat => ({
    name: cat.name.replace('_', ' ').toUpperCase(),
    value: cat.count
  })) || []

  const uniqueSymbols = [...new Set(creations.flatMap(c => c.symbols))].slice(0, 10)
  
  // Show error state if needed
  if (error && creations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Unable to load data</h2>
          <p className="text-gray-600 mt-1">{error}</p>
          <Button onClick={loadData} className="mt-4">
            <Loader2 className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900">Loading Investment CRM</h2>
          <p className="text-gray-600 text-sm">Fetching your OpenBB creations and analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investment CRM</h1>
          <p className="text-gray-600 mt-1">
            Organize and analyze all your OpenBB research and analysis
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Star className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search creations, symbols, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Categories</option>
              {categories?.categories?.map(cat => (
                <option key={cat.name} value={cat.name}>
                  {cat.name.replace('_', ' ').toUpperCase()} ({cat.count})
                </option>
              )) || []}
            </select>
            <select 
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Symbols</option>
              {uniqueSymbols.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Creations</p>
                <p className="text-2xl font-bold">{creations.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Symbols</p>
                <p className="text-2xl font-bold">{uniqueSymbols.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold">
                  {creations.filter(c => {
                    const createdDate = new Date(c.created_at)
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return createdDate > weekAgo
                  }).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Creations by Category</CardTitle>
            <CardDescription>Distribution of your investment research</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, value}) => `${name}: ${value}`}
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Creation Activity</CardTitle>
            <CardDescription>Your research activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Mon', count: 4 },
                { name: 'Tue', count: 3 },
                { name: 'Wed', count: 2 },
                { name: 'Thu', count: 7 },
                { name: 'Fri', count: 5 },
                { name: 'Sat', count: 1 },
                { name: 'Sun', count: 3 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Creations</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio Context</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCreations.map((creation) => {
              const IconComponent = CATEGORY_ICONS[creation.category as keyof typeof CATEGORY_ICONS] || FileText
              
              return (
                <Card key={creation.creation_id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-5 h-5 text-gray-600" />
                        <Badge 
                          variant="secondary" 
                          className={`${CREATION_TYPE_COLORS[creation.creation_type as keyof typeof CREATION_TYPE_COLORS] || 'bg-gray-500'} text-white`}
                        >
                          {creation.creation_type}
                        </Badge>
                      </div>
                      <Badge variant={creation.priority === 'high' ? 'destructive' : 'outline'}>
                        {creation.priority}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{creation.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {creation.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Symbols */}
                    <div className="flex flex-wrap gap-1">
                      {creation.symbols.map(symbol => (
                        <Badge key={symbol} variant="outline" className="text-xs">
                          {symbol}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {creation.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {creation.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{creation.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(creation.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {creation.chart_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={creation.web_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Chart
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          
          {filteredCreations.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No creations found</h3>
                <p className="text-gray-500">
                  Try adjusting your search criteria or create new analysis using the CLI
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const IconComponent = CATEGORY_ICONS[category.name as keyof typeof CATEGORY_ICONS] || FileText
              
              return (
                <Card key={category.name} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <IconComponent className="w-8 h-8 text-blue-600" />
                      <div>
                        <CardTitle className="capitalize">
                          {category.name.replace('_', ' ')}
                        </CardTitle>
                        <CardDescription>
                          {category.count} creations
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {category.creation_types.map(type => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                    
                    {category.recent_items.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Recent:</p>
                        {category.recent_items.slice(0, 2).map(item => (
                          <div key={item.creation_id} className="text-sm text-gray-500 truncate">
                            • {item.title}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <Button variant="outline" size="sm" className="w-full">
                      View All ({category.count})
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="portfolio">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Context Analysis</CardTitle>
              <CardDescription>
                View all research organized by your portfolio holdings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uniqueSymbols.slice(0, 6).map(symbol => {
                  const symbolCreations = creations.filter(c => c.symbols.includes(symbol))
                  
                  return (
                    <Card key={symbol} className="border-l-4 border-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{symbol}</CardTitle>
                        <CardDescription>
                          {symbolCreations.length} research items
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {symbolCreations.slice(0, 3).map(creation => (
                          <div key={creation.creation_id} className="text-sm">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {creation.creation_type}
                              </Badge>
                              <span className="truncate">{creation.title}</span>
                            </div>
                          </div>
                        ))}
                        {symbolCreations.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{symbolCreations.length - 3} more items
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}