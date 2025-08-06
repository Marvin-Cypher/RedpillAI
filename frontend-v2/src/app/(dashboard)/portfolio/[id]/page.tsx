"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin, Calendar, Users, Globe, ExternalLink, FileText } from 'lucide-react'
import { Widget, WidgetType } from '@/lib/widgets/types'
import { WidgetManager } from '@/components/widgets/WidgetManager'
import { WidgetGrid } from '@/components/widgets/WidgetGrid'
import { ChatWithAIButton } from '@/components/ai'
// Import to ensure widget registration
import '@/components/widgets'

interface Company {
  id: string
  name: string
  description: string
  website?: string
  company_type: string
  sector: string
  founded_year?: number
  employee_count?: string
  headquarters?: string | { city?: string; country?: string }
  logo_url?: string
  twitter_handle?: string
  github_repo?: string
  token_symbol?: string
}

export default function CompanyDetailPage() {
  const params = useParams()
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [widgets, setWidgets] = useState<Widget[]>([])

  // Load widgets from localStorage
  useEffect(() => {
    const widgetKey = `widgets_${params.id}`
    const savedWidgets = localStorage.getItem(widgetKey)
    if (savedWidgets) {
      try {
        const parsedWidgets = JSON.parse(savedWidgets)
        setWidgets(parsedWidgets)
      } catch (err) {
        console.error('Failed to parse saved widgets:', err)
      }
    }
  }, [params.id])

  // Save widgets to localStorage whenever widgets change
  useEffect(() => {
    if (widgets.length > 0) {
      const widgetKey = `widgets_${params.id}`
      localStorage.setItem(widgetKey, JSON.stringify(widgets))
    }
  }, [widgets, params.id])

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        // First try to get enriched data from the data service
        const enrichedResponse = await fetch(`/api/data/companies/${params.id}/profile`)
        if (enrichedResponse.ok) {
          const enrichedResult = await enrichedResponse.json()
          console.log('📊 Loaded enriched company data:', enrichedResult)
          
          // The enriched data is wrapped in a 'data' property
          const enrichedData = enrichedResult.data
          
          // Transform enriched data to match the Company interface
          setCompany({
            id: params.id as string,
            name: enrichedData.name || 'Unknown Company',
            description: enrichedData.description || '',
            website: enrichedData.website,
            company_type: enrichedData.company_type || enrichedData.company_category || 'private',
            sector: enrichedData.industry || enrichedData.sector || 'Technology',
            founded_year: enrichedData.founded_year,
            employee_count: enrichedData.employee_count,
            headquarters: enrichedData.headquarters,
            logo_url: enrichedData.logo_url,
            twitter_handle: enrichedData.twitter_handle || enrichedData.twitter?.handle,
            github_repo: enrichedData.github_repo,
            token_symbol: enrichedData.token_symbol || enrichedData.crypto_data?.symbol
          })
        } else {
          // Fallback to basic company endpoint
          console.log('⚠️ Enriched data not available, falling back to basic company data')
          const response = await fetch(`/api/companies/${params.id}`)
          if (response.ok) {
            const data = await response.json()
            setCompany(data)
          } else {
            setError(`Failed to load company data (${response.status})`)
          }
        }
      } catch (err) {
        console.error('Error loading company data:', err)
        setError('Network error loading company data')
      } finally {
        setLoading(false)
      }
    }

    loadCompanyData()
  }, [params.id])

  const handleAddWidget = (widget: Widget) => {
    setWidgets(prev => [...prev, widget])
  }

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(prev => {
      const newWidgets = prev.filter(w => w.id !== widgetId)
      // Update localStorage immediately
      const widgetKey = `widgets_${params.id}`
      if (newWidgets.length === 0) {
        localStorage.removeItem(widgetKey)
      } else {
        localStorage.setItem(widgetKey, JSON.stringify(newWidgets))
      }
      return newWidgets
    })
  }

  const handleUpdateWidget = (widgetId: string, updates: Partial<Widget>) => {
    setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, ...updates } : w))
  }

  const handleRefreshAllWidgets = () => {
    // Force refresh all widgets by updating their refresh timestamp
    setWidgets(prev => prev.map(widget => ({
      ...widget,
      config: { ...widget.config, lastRefresh: Date.now() }
    })))
  }

  const getCompanyTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'PRIVATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'PUBLIC': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'CRYPTO': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const formatHeadquarters = (hq: string | { city?: string; country?: string } | undefined) => {
    if (!hq) return 'Not specified'
    if (typeof hq === 'string') return hq
    if (typeof hq === 'object') {
      const parts = [hq.city, hq.country].filter(Boolean)
      return parts.length > 0 ? parts.join(', ') : 'Not specified'
    }
    return 'Not specified'
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-96 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-32 bg-muted rounded animate-pulse" />
          <div className="h-32 bg-muted rounded animate-pulse" />
          <div className="h-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Error Loading Company</h2>
            <p className="text-red-600 dark:text-red-300">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Company Not Found</h2>
            <p className="text-muted-foreground">The requested company could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Company Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {company.logo_url ? (
                <img 
                  src={company.logo_url} 
                  alt={`${company.name} logo`}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  {company.name.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getCompanyTypeColor(company.company_type)}>
                    {company.company_type}
                  </Badge>
                  <Badge variant="outline">{company.sector}</Badge>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground max-w-2xl">{company.description}</p>
          </div>
          
          <div className="flex gap-2">
            <ChatWithAIButton 
              projectType="company"
              projectName={company.name}
              projectId={company.id}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = `/portfolio/${company.id}/deal`}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
            >
              <FileText className="w-4 h-4 mr-2" />
              Deal Entry
            </Button>
            {company.website && (
              <Button variant="outline" size="sm" asChild>
                <a href={company.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" />
                  Website
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Company Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Headquarters</p>
                <p className="font-medium">{formatHeadquarters(company.headquarters)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Founded</p>
                <p className="font-medium">{company.founded_year || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="font-medium">{company.employee_count || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Company ID</p>
                <p className="font-medium text-xs">{company.id.split('-')[0]}...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widget Management - Horizontal Layout */}
      <div className="space-y-6">
        {/* Widget Manager - Horizontal */}
        <WidgetManager
          widgets={widgets}
          onAddWidget={handleAddWidget}
          onRemoveWidget={handleRemoveWidget}
          onRefreshAllWidgets={handleRefreshAllWidgets}
          companyId={company.id}
          companyName={company.name}
        />
        
        {/* Dashboard Widgets - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Widgets</CardTitle>
          </CardHeader>
          <CardContent>
            {widgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No widgets added yet. Use the widget manager above to add financial data widgets.</p>
              </div>
            ) : (
              <WidgetGrid
                widgets={widgets}
                onUpdateWidget={handleUpdateWidget}
                onRemoveWidget={handleRemoveWidget}
                companyId={company.id}
                isEditing={false}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}