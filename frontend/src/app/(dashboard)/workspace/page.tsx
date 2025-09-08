"use client"

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { creationAPI } from '@/lib/api/creations'
import type { CreationSummary, CreationCategories } from '@/lib/api/creations'
import { 
  BarChart3, 
  FileText, 
  Search,
  Filter,
  Calendar,
  Activity,
  Database,
  TrendingUp,
  ExternalLink,
  Archive,
  ChartBar,
  FileSearch,
  Clock,
  Tag
} from 'lucide-react'

export default function WorkspacePage() {
  const [creations, setCreations] = useState<CreationSummary[]>([])
  const [categories, setCategories] = useState<CreationCategories | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadWorkspaceData()
  }, [selectedType, selectedCategory])

  const loadWorkspaceData = async () => {
    try {
      setLoading(true)
      
      console.log('🔄 Loading workspace data...')
      
      // Load all creations with filters
      const creationFilters: any = {}
      if (selectedType !== 'all') creationFilters.creation_type = selectedType
      if (selectedCategory !== 'all') creationFilters.category = selectedCategory

      console.log('📊 Calling API with filters:', creationFilters)

      // Load creations first - this is the most important
      const allCreations = await creationAPI.getUserCreations('default', creationFilters)
      
      // Try to load categories, but don't fail if it doesn't work
      let categoryData = null
      try {
        categoryData = await creationAPI.getCreationCategories('default')
      } catch (err) {
        console.warn('Categories API failed, continuing without it:', err)
      }
      
      console.log('✅ Got creations:', allCreations.length)
      console.log('✅ Got categories:', categoryData)
      console.log('📋 First creation:', allCreations[0])
      
      setCreations(allCreations)
      setCategories(categoryData)
    } catch (error) {
      console.error('❌ Error loading workspace data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadWorkspaceData()
      return
    }
    
    try {
      setLoading(true)
      console.log('🔍 Searching for:', searchQuery)
      const searchResults = await creationAPI.searchCreations('default', searchQuery)
      console.log('✅ Search results:', searchResults.length)
      setCreations(searchResults)
    } catch (error) {
      console.error('❌ Search failed:', error)
      // Fall back to loading all data if search fails
      await loadWorkspaceData()
    } finally {
      setLoading(false)
    }
  }

  const filteredCreations = creations.filter(creation => {
    if (activeTab === 'all') return true
    return creation.creation_type === activeTab
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chart': return <BarChart3 className="w-4 h-4" />
      case 'analysis': return <FileText className="w-4 h-4" />
      case 'table': return <ChartBar className="w-4 h-4" />
      case 'research': return <FileSearch className="w-4 h-4" />
      default: return <Database className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chart': return 'bg-blue-100 text-blue-800'
      case 'analysis': return 'bg-green-100 text-green-800'
      case 'table': return 'bg-purple-100 text-purple-800'
      case 'research': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              📊 AI Workspace
            </h1>
            <p className="text-muted-foreground mt-1">
              All your CLI-generated charts, reports, and analysis in one place
            </p>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2">
              <Input
                placeholder="Search creations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full sm:w-64"
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="chart">Charts</option>
                <option value="analysis">Analysis</option>
                <option value="table">Tables</option>
                <option value="research">Research</option>
              </select>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Categories</option>
                <option value="company_research">Company Research</option>
                <option value="market_analysis">Market Analysis</option>
                <option value="portfolio_tracking">Portfolio</option>
                <option value="due_diligence">Due Diligence</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Creations</p>
                <p className="text-3xl font-bold text-foreground">
                  {categories?.total_creations || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-950/20 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">
                {categories?.categories?.length || 0} categories
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Charts Created</p>
                <p className="text-3xl font-bold text-foreground">
                  {creations.filter(c => c.creation_type === 'chart').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-950/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Activity className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm text-muted-foreground">
                Interactive visualizations
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Analysis Reports</p>
                <p className="text-3xl font-bold text-foreground">
                  {creations.filter(c => c.creation_type === 'analysis').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-950/20 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <FileSearch className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-sm text-muted-foreground">
                AI-generated insights
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Tables</p>
                <p className="text-3xl font-bold text-foreground">
                  {creations.filter(c => c.creation_type === 'table').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-950/20 rounded-lg flex items-center justify-center">
                <ChartBar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <Archive className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-sm text-muted-foreground">
                Structured data views
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm py-2">All</TabsTrigger>
          <TabsTrigger value="chart" className="text-xs sm:text-sm py-2">Charts</TabsTrigger>
          <TabsTrigger value="analysis" className="text-xs sm:text-sm py-2">Analysis</TabsTrigger>
          <TabsTrigger value="table" className="text-xs sm:text-sm py-2">Tables</TabsTrigger>
          <TabsTrigger value="research" className="text-xs sm:text-sm py-2">Research</TabsTrigger>
        </TabsList>

        {/* All Creations */}
        <TabsContent value={activeTab} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  {activeTab === 'all' ? 'All Creations' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Creations`}
                </CardTitle>
                <Badge variant="outline">
                  {filteredCreations.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCreations.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No creations yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start using the CLI to generate charts, reports, and analysis. They'll appear here automatically.
                  </p>
                  <Button onClick={() => window.open('https://localhost:3002/cli-guide', '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    CLI Guide
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {filteredCreations.map((creation) => (
                    <Card key={creation.creation_id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-primary to-purple-600 rounded-lg flex items-center justify-center text-primary-foreground">
                              {getTypeIcon(creation.creation_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-foreground truncate">{creation.title}</h3>
                              <p className="text-sm text-muted-foreground truncate">{creation.description}</p>
                            </div>
                          </div>
                          <Badge className={getTypeColor(creation.creation_type)}>
                            {creation.creation_type}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              Created:
                            </span>
                            <span className="font-medium text-foreground">{formatDate(creation.created_at)}</span>
                          </div>
                          
                          {creation.symbols.length > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Companies:</span>
                              <div className="flex flex-wrap gap-1 max-w-32">
                                {creation.symbols.slice(0, 3).map((symbol) => (
                                  <Badge key={symbol} variant="outline" className="text-xs px-1 py-0">
                                    {symbol}
                                  </Badge>
                                ))}
                                {creation.symbols.length > 3 && (
                                  <Badge variant="outline" className="text-xs px-1 py-0">
                                    +{creation.symbols.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Priority:</span>
                            <Badge className={getPriorityColor(creation.priority)} variant="outline">
                              {creation.priority}
                            </Badge>
                          </div>
                          
                          {creation.tags.length > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground flex items-center">
                                <Tag className="w-3 h-3 mr-1" />
                                Tags:
                              </span>
                              <div className="flex flex-wrap gap-1 max-w-32">
                                {creation.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                                    {tag}
                                  </Badge>
                                ))}
                                {creation.tags.length > 2 && (
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    +{creation.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1 text-xs"
                            size="sm"
                            onClick={() => window.open(`/creations/${creation.creation_id}`, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          {creation.chart_url && (
                            <Button 
                              variant="outline" 
                              className="text-xs"
                              size="sm"
                              onClick={() => window.open(creation.chart_url, '_blank')}
                            >
                              <BarChart3 className="w-3 h-3 mr-1" />
                              Chart
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Categories Summary */}
      {categories && categories.categories.length > 0 && (
        <Card className="mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Categories Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.categories.map((category) => (
                <Card key={category.name} className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {category.count}
                    </div>
                    <div className="text-sm text-muted-foreground capitalize mb-2">
                      {category.name.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {category.creation_types.join(', ')}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}