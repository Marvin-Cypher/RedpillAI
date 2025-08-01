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
    id: 'key-metrics',
    type: WidgetType.KEY_METRICS,
    title: 'Key Performance Metrics',
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
  companyId, 
  companyName 
}: WidgetManagerProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<string>('');

  const handleRefreshCompanyData = async () => {
    setIsRefreshing(true);
    setRefreshStatus('Refreshing company data from Tavily + OpenBB...');

    try {
      const result = await companyDataService.refreshCompanyData(companyId);
      
      if (result.success) {
        setRefreshStatus('✅ Company data refreshed successfully!');
        // Trigger a page reload to update all widgets with fresh data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setRefreshStatus(`❌ Failed to refresh: ${result.error}`);
      }
    } catch (error) {
      setRefreshStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        setRefreshStatus('');
      }, 3000);
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
    <div className="space-y-4">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Widget Management</h3>
          <p className="text-sm text-gray-600">Add widgets or refresh company data</p>
        </div>
        
        <Button
          onClick={handleRefreshCompanyData}
          disabled={isRefreshing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Refresh Status */}
      {refreshStatus && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm">{refreshStatus}</p>
          </CardContent>
        </Card>
      )}

      {/* Current Widgets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Current Widgets ({widgets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {widgets.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No widgets added yet</p>
          ) : (
            <div className="space-y-2">
              {widgets.map((widget) => (
                <div
                  key={widget.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getWidgetIcon(widget.type)}
                    <div>
                      <p className="font-medium">{widget.title}</p>
                      <p className="text-sm text-gray-600">{widget.type}</p>
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Widget</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove "{widget.title}" from your dashboard?
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
          )}
        </CardContent>
      </Card>

      {/* Widget Library */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Widget from Library
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
  );
}