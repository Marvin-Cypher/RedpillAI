/**
 * Widget Manager Component
 * Simple UI for adding/removing widgets and refreshing company data
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
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
  Activity
} from 'lucide-react';
import { Widget, WidgetType } from '@/lib/widgets/types';
import { companyDataService } from '@/lib/services/companyDataService';

interface WidgetManagerProps {
  widgets: Widget[];
  onAddWidget: (widget: Widget) => void;
  onRemoveWidget: (widgetId: string) => void;
  onRefreshAllWidgets?: () => void;
  companyId: string;
  companyName: string;
}

interface WidgetTemplate {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'metrics' | 'financial' | 'market' | 'research';
}

const AVAILABLE_WIDGETS: WidgetTemplate[] = [
  {
    id: 'startup-metrics',
    type: WidgetType.STARTUP_METRICS,
    title: 'Startup Metrics',
    description: 'Revenue, growth, employees, and core business metrics',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'metrics'
  },
  {
    id: 'investment-summary',
    type: WidgetType.INVESTMENT_SUMMARY,
    title: 'Investment Summary',
    description: 'Investment amount, valuation, ownership details',
    icon: <DollarSign className="w-5 h-5" />,
    category: 'financial'
  },
  {
    id: 'price-chart',
    type: WidgetType.PRICE_CHART,
    title: 'Price Chart',
    description: 'Historical price data and trends',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'market'
  },
  {
    id: 'token-price',
    type: WidgetType.TOKEN_PRICE,
    title: 'Token Price',
    description: 'Real-time token price and market data',
    icon: <Activity className="w-5 h-5" />,
    category: 'market'
  },
  {
    id: 'fundamentals',
    type: WidgetType.FUNDAMENTALS,
    title: 'Company Fundamentals',
    description: 'Financial ratios and company fundamentals',
    icon: <PieChart className="w-5 h-5" />,
    category: 'financial'
  },
  {
    id: 'news-feed',
    type: WidgetType.NEWS_FEED,
    title: 'Latest News',
    description: 'Recent news and updates about the company',
    icon: <FileText className="w-5 h-5" />,
    category: 'research'
  }
];

export function WidgetManager({ 
  widgets, 
  onAddWidget, 
  onRemoveWidget, 
  onRefreshAllWidgets,
  companyId, 
  companyName 
}: WidgetManagerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<string>('');

  const handleRefreshCompanyData = async () => {
    setIsRefreshing(true);
    setRefreshStatus('🔄 Refreshing widget data from external APIs...');

    try {
      const result = await companyDataService.refreshCompanyDataForWidgets(companyId, true);
      
      if (result.success) {
        let successMessage = '✅ Widget data refreshed successfully!';
        if (result.widgetMetricsGenerated) {
          successMessage += ' 📊 Financial metrics generated for widgets.';
        }
        if (result.message) {
          successMessage += ` ${result.message}`;
        }
        
        setRefreshStatus(successMessage);
        
        // Clear widget data cache but preserve widget layout
        if (typeof window !== 'undefined' && window.localStorage) {
          // Clear only widget data cache, not widget configuration
          const keysToRemove = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            if (key && (key.includes('widget_data_') || key.includes('company_data_'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => window.localStorage.removeItem(key));
        }
        
        // Trigger widget refresh without page reload
        setTimeout(() => {
          setRefreshStatus('✅ Widget data refreshed! Refreshing widgets now...');
          if (onRefreshAllWidgets) {
            onRefreshAllWidgets();
          }
        }, 1000);
      } else {
        setRefreshStatus(`❌ Failed to refresh widget data: ${result.error}`);
      }
    } catch (error) {
      setRefreshStatus(`❌ Error refreshing widgets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Keep status visible longer for user feedback
      setTimeout(() => {
        setIsRefreshing(false);
        if (!refreshStatus.includes('✅')) {
          setRefreshStatus('');
        }
      }, 4000);
    }
  };

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
        asset_type: 'equity', // Default, will be determined by company type
        ticker: companyName
      },
      isVisible: true
    };

    onAddWidget(newWidget);
  };

  const getWidgetIcon = (type: WidgetType) => {
    const template = AVAILABLE_WIDGETS.find(w => w.type === type);
    return template?.icon || <Settings className="w-4 h-4" />;
  };

  const isWidgetAdded = (type: WidgetType) => {
    return widgets.some(widget => widget.type === type);
  };

  const groupedWidgets = AVAILABLE_WIDGETS.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, WidgetTemplate[]>);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Widget Management ({widgets.length} active)
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Manage your dashboard widgets and refresh data</p>
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
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Widget Library</DialogTitle>
                  <DialogDescription>
                    Choose widgets to add to your {companyName} dashboard
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {Object.entries(groupedWidgets).map(([category, categoryWidgets]) => (
                    <div key={category}>
                      <h4 className="font-semibold text-sm uppercase tracking-wide text-gray-600 mb-3">
                        {category}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categoryWidgets.map((template) => (
                          <Card 
                            key={template.id} 
                            className={`cursor-pointer transition-colors ${
                              isWidgetAdded(template.type) 
                                ? 'bg-gray-50 border-gray-300' 
                                : 'hover:bg-blue-50 hover:border-blue-300'
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="text-blue-600">
                                  {template.icon}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="font-medium">{template.title}</h5>
                                    {isWidgetAdded(template.type) && (
                                      <Badge variant="secondary" className="text-xs">
                                        Added
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">
                                    {template.description}
                                  </p>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddWidget(template)}
                                    disabled={isWidgetAdded(template.type)}
                                    className="w-full"
                                  >
                                    {isWidgetAdded(template.type) ? 'Already Added' : 'Add Widget'}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
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
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{refreshStatus}</p>
          </div>
        )}

        {/* Current Widgets - Horizontal Layout */}
        {widgets.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-lg"
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
          <p className="text-gray-500 text-center py-4 text-sm">No widgets added yet. Click &quot;Add Widget&quot; to get started.</p>
        )}
      </CardContent>
    </Card>
  );
}