"use client"

/**
 * Widget Manager Component
 * Simple UI for adding/removing widgets and refreshing company data
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Trash2,
  RefreshCw,
  Settings,
  TrendingUp,
  DollarSign,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  Users
} from 'lucide-react'
import { Widget, WidgetType } from '@/lib/widgets/types'
import { widgetRegistry } from '@/lib/widgets/registry'
// Import to ensure widgets are registered
import '@/lib/widgets/registerWidgets'

interface WidgetManagerProps {
  widgets: Widget[]
  onAddWidget: (widget: Widget) => void
  onRemoveWidget: (widgetId: string) => void
  onRefreshAllWidgets?: () => void
  companyId: string
  companyName: string
}

interface WidgetTemplate {
  id: string
  type: WidgetType
  title: string
  description: string
  icon: React.ReactNode
  category: string
}

// Icon mapping for widget types
const WIDGET_ICONS: Record<string, React.ReactNode> = {
  'TrendingUp': <TrendingUp className="w-5 h-5" />,
  'PieChart': <PieChart className="w-5 h-5" />,
  'BarChart3': <BarChart3 className="w-5 h-5" />,
  'Activity': <Activity className="w-5 h-5" />,
  'FileText': <FileText className="w-5 h-5" />,
  'Users': <Users className="w-5 h-5" />,
}

// Get available widgets from the registry
const getAvailableWidgets = (): WidgetTemplate[] => {
  const registryWidgets = widgetRegistry.getAvailableWidgets()
  return registryWidgets.map((metadata) => ({
    id: metadata.type.toLowerCase().replace('_', '-'),
    type: metadata.type,
    title: metadata.name,
    description: metadata.description,
    icon: WIDGET_ICONS[metadata.icon] || <Settings className="w-5 h-5" />,
    category: metadata.category
  }))
}

const AVAILABLE_WIDGETS = getAvailableWidgets()

export function WidgetManager({ 
  widgets, 
  onAddWidget, 
  onRemoveWidget, 
  onRefreshAllWidgets,
  companyId, 
  companyName 
}: WidgetManagerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshStatus, setRefreshStatus] = useState<string>('')

  const handleRefreshCompanyData = async () => {
    setIsRefreshing(true)
    setRefreshStatus('🔄 Refreshing widget data...')

    try {
      console.log('🔄 Refreshing company data for widgets:', { companyId, companyName })
      
      // Call the real API to refresh widget data
      const response = await fetch(`/api/data/companies/${encodeURIComponent(companyId)}/refresh-for-widgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to refresh data: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Widget data refresh result:', result)

      setRefreshStatus(`✅ ${result.message || 'Widget data refreshed!'} Refreshing widgets now...`)
      
      // Wait a moment then refresh all widgets
      setTimeout(() => {
        if (onRefreshAllWidgets) {
          onRefreshAllWidgets()
        }
        setRefreshStatus('✅ All widgets refreshed successfully!')
      }, 500)
      
    } catch (error) {
      console.error('❌ Widget refresh error:', error)
      setRefreshStatus(`❌ Error refreshing widgets: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
        setRefreshStatus('')
      }, 3000)
    }
  }

  const handleAddWidget = (template: WidgetTemplate) => {
    const newWidget: Widget = {
      id: `${template.id}-${Date.now()}`,
      type: template.type,
      title: template.title,
      config: {
        companyName: companyName,
        companyId: companyId
      },
      position: { 
        x: 0, 
        y: widgets.length * 4, 
        w: 6, 
        h: 4 
      },
      dataSource: {
        asset_type: 'equity',
        ticker: companyName
      },
      isVisible: true
    }

    onAddWidget(newWidget)
  }

  const getWidgetIcon = (type: WidgetType) => {
    const template = AVAILABLE_WIDGETS.find(w => w.type === type)
    return template?.icon || <Settings className="w-4 h-4" />
  }

  const isWidgetAdded = (type: WidgetType) => {
    return widgets.some(widget => widget.type === type)
  }

  const groupedWidgets = AVAILABLE_WIDGETS.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = []
    }
    acc[widget.category].push(widget)
    return acc
  }, {} as Record<string, WidgetTemplate[]>)

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Widget Management ({widgets.length} active)
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Manage your dashboard widgets and refresh data</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefreshCompanyData}
              disabled={isRefreshing}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Widget
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Widget Library</DialogTitle>
                  <DialogDescription>
                    Choose widgets to add to your {companyName} dashboard
                  </DialogDescription>
                </DialogHeader>
                
                <div className="mt-6 space-y-6">
                  {Object.entries(groupedWidgets).map(([category, categoryWidgets]) => (
                    <div key={category}>
                      <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-3">
                        {category}
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {categoryWidgets.map((template) => {
                          const added = isWidgetAdded(template.type)
                          return (
                            <div 
                              key={template.id} 
                              className={`rounded-lg border p-4 transition-colors ${
                                added 
                                  ? 'bg-muted/50 border-muted-foreground/20' 
                                  : 'bg-card hover:bg-accent hover:border-accent-foreground/20'
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div className={`flex-shrink-0 ${added ? 'text-muted-foreground' : 'text-primary'}`}>
                                  {template.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h5 className="font-medium text-base">{template.title}</h5>
                                    {added && (
                                      <Badge variant="secondary" className="text-xs">
                                        Added
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {template.description}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  <Button
                                    size="sm"
                                    variant={added ? "secondary" : "default"}
                                    onClick={() => handleAddWidget(template)}
                                    disabled={added}
                                  >
                                    {added ? 'Added' : 'Add'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Refresh Status */}
        {refreshStatus && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-400">{refreshStatus}</p>
          </div>
        )}

        {/* Current Widgets - Horizontal Layout */}
        {widgets.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="flex items-center gap-2 px-3 py-2 bg-muted border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {getWidgetIcon(widget.type)}
                  <span className="text-sm font-medium">{widget.title}</span>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 h-6 w-6 p-0">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Widget</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove &quot;{widget.title}&quot; from your dashboard?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onRemoveWidget(widget.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4 text-sm">No widgets added yet. Click &quot;Add Widget&quot; to get started.</p>
        )}
      </CardContent>
    </Card>
  )
}