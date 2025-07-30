/**
 * Customizable Dashboard Component
 * Main dashboard with drag-and-drop widget management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Edit3,
  Save,
  X,
  RotateCcw,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { WidgetLibraryTrigger } from '../widgets/WidgetLibrary';
import { Widget, WidgetType } from '@/lib/widgets/types';
import { widgetRegistry } from '@/lib/widgets/registry';
import { fetchWidgetData } from '@/lib/widgets/data';
import { cn } from '@/lib/utils';

// Make responsive grid layout
const ResponsiveGridLayout = WidthProvider(Responsive);

interface CompanyInfo {
  id: string;
  name: string;
  sector: string;
  ticker?: string; // For crypto companies, this would be the token symbol
}

interface CustomizableDashboardProps {
  companyId: string;
  userId: string;
  companyInfo?: CompanyInfo;
  initialWidgets?: Widget[];
  onLayoutChange?: (widgets: Widget[]) => void;
  onWidgetsChange?: (widgets: Widget[]) => void;
}

interface DashboardState {
  widgets: Widget[];
  isEditing: boolean;
  layouts: { [key: string]: Layout[] };
  isDirty: boolean;
  saving: boolean;
  error: string | null;
}

export const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  companyId,
  userId,
  companyInfo,
  initialWidgets = [],
  onLayoutChange,
  onWidgetsChange
}) => {
  // Convert widgets to grid layout format
  const getLayoutsFromWidgets = useCallback((widgets: Widget[]) => {
    const layout = widgets.map(widget => ({
      i: widget.id,
      x: Math.max(0, widget.position.x),
      y: Math.max(0, widget.position.y),
      w: Math.min(12, Math.max(2, widget.position.w)),
      h: Math.min(8, Math.max(2, widget.position.h)),
      minW: 2,
      minH: 2,
      maxW: 12,
      maxH: 8,
      static: false
    }));

    return {
      lg: layout,
      md: layout,
      sm: layout.map(item => ({ ...item, w: Math.min(item.w, 6) })),
      xs: layout.map(item => ({ ...item, w: 12, x: 0 })),
      xxs: layout.map(item => ({ ...item, w: 12, x: 0 }))
    };
  }, []);

  // Load saved dashboard state
  const loadDashboardState = useCallback(() => {
    try {
      const savedState = localStorage.getItem(`dashboard-${companyId}-${userId}`);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        return {
          widgets: parsed.widgets || initialWidgets,
          layouts: getLayoutsFromWidgets(parsed.widgets || initialWidgets)
        };
      }
    } catch (error) {
      console.error('Failed to load dashboard state:', error);
    }
    return {
      widgets: initialWidgets,
      layouts: getLayoutsFromWidgets(initialWidgets)
    };
  }, [companyId, userId, initialWidgets, getLayoutsFromWidgets]);

  // Initialize state with layouts
  const [state, setState] = useState<DashboardState>(() => {
    const { widgets, layouts } = loadDashboardState();
    return {
      widgets,
      isEditing: false,
      layouts,
      isDirty: false,
      saving: false,
      error: null
    };
  });

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [dataCache, setDataCache] = useState<Map<string, any>>(new Map());

  // Fetch widget data
  const fetchAllWidgetData = useCallback(async (widgets: Widget[]) => {
    const newDataCache = new Map();
    
    await Promise.all(
      widgets.map(async (widget) => {
        try {
          const data = await fetchWidgetData(widget, companyId);
          newDataCache.set(widget.id, data);
        } catch (error) {
          console.error(`Failed to fetch data for widget ${widget.id}:`, error);
          newDataCache.set(widget.id, { error: error.message });
        }
      })
    );
    
    setDataCache(newDataCache);
  }, [companyId]);

  // Initial data fetch
  useEffect(() => {
    if (state.widgets.length > 0) {
      fetchAllWidgetData(state.widgets);
    }
  }, [state.widgets, fetchAllWidgetData]);

  // Handle layout changes from drag/drop/resize
  const handleLayoutChange = (layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    if (state.isEditing) {
      const updatedWidgets = state.widgets.map(widget => {
        const layoutItem = layout.find(item => item.i === widget.id);
        if (layoutItem) {
          return {
            ...widget,
            position: {
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h
            }
          };
        }
        return widget;
      });

      setState(prev => ({
        ...prev,
        widgets: updatedWidgets,
        layouts,
        isDirty: true
      }));

      onLayoutChange?.(updatedWidgets);
    }
  };

  // Add new widget
  const handleAddWidget = (widgetType: WidgetType) => {
    // Determine data source based on company info
    const isBlockchainCrypto = companyInfo?.sector?.toLowerCase().includes('blockchain') || 
                              companyInfo?.sector?.toLowerCase().includes('crypto');
    
    const assetType = isBlockchainCrypto ? 'crypto' : 'equity';
    const dataSource = {
      ticker: companyInfo?.ticker || (isBlockchainCrypto ? 'BTC' : 'AAPL'),
      asset_type: assetType as 'crypto' | 'equity',
      peer_tickers: isBlockchainCrypto 
        ? ['ETH', 'BNB', 'ADA', 'SOL'] 
        : ['MSFT', 'GOOGL', 'AMZN']
    };

    const newWidget = widgetRegistry.createWidget(
      widgetType,
      companyId,
      dataSource,
      widgetRegistry.findNextPosition(state.widgets, { x: 0, y: 0, w: 6, h: 4 })
    );

    if (newWidget) {
      const updatedWidgets = [...state.widgets, newWidget];
      const layouts = getLayoutsFromWidgets(updatedWidgets);
      setState(prev => ({
        ...prev,
        widgets: updatedWidgets,
        layouts,
        isDirty: true
      }));
      onWidgetsChange?.(updatedWidgets);
    }
  };

  // Remove widget
  const handleRemoveWidget = (widgetId: string) => {
    const updatedWidgets = state.widgets.filter(w => w.id !== widgetId);
    const layouts = getLayoutsFromWidgets(updatedWidgets);
    setState(prev => ({
      ...prev,
      widgets: updatedWidgets,
      layouts,
      isDirty: true
    }));
    onWidgetsChange?.(updatedWidgets);
  };

  // Update widget configuration
  const handleUpdateWidget = (widgetId: string, config: any) => {
    const updatedWidgets = state.widgets.map(widget =>
      widget.id === widgetId ? { ...widget, config } : widget
    );
    setState(prev => ({
      ...prev,
      widgets: updatedWidgets,
      isDirty: true
    }));
    onWidgetsChange?.(updatedWidgets);
  };

  // Toggle widget visibility
  const handleToggleWidget = (widgetId: string) => {
    const updatedWidgets = state.widgets.map(widget =>
      widget.id === widgetId ? { ...widget, isVisible: !widget.isVisible } : widget
    );
    setState(prev => ({
      ...prev,
      widgets: updatedWidgets,
      isDirty: true
    }));
    onWidgetsChange?.(updatedWidgets);
  };

  // Save dashboard
  const handleSave = async () => {
    setState(prev => ({ ...prev, saving: true, error: null }));

    try {
      // Save to localStorage
      const dashboardState = {
        widgets: state.widgets,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`dashboard-${companyId}-${userId}`, JSON.stringify(dashboardState));
      
      // Simulate API call (could be replaced with actual backend call)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setState(prev => ({
        ...prev,
        isDirty: false,
        saving: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save dashboard',
        saving: false
      }));
    }
  };

  // Reset dashboard
  const handleReset = () => {
    const layouts = getLayoutsFromWidgets(initialWidgets);
    setState(prev => ({
      ...prev,
      widgets: initialWidgets,
      layouts,
      isDirty: false
    }));
    setShowResetDialog(false);
  };

  // Toggle edit mode
  const handleToggleEdit = () => {
    setState(prev => ({ ...prev, isEditing: !prev.isEditing }));
  };

  // Render widget
  const renderWidget = (widget: Widget) => {
    if (!widget.isVisible) return null;

    const WidgetComponent = widgetRegistry.getComponent(widget.type);
    if (!WidgetComponent) {
      return (
        <Card className="h-full border-red-200">
          <CardContent className="flex items-center justify-center h-full">
            <p className="text-red-600">Widget type not found: {widget.type}</p>
          </CardContent>
        </Card>
      );
    }

    const widgetData = dataCache.get(widget.id);

    return (
      <WidgetComponent
        widget={widget}
        companyId={companyId}
        data={widgetData}
        loading={!widgetData}
        error={widgetData?.error || null}
        isEditing={state.isEditing}
        onUpdate={(config) => handleUpdateWidget(widget.id, config)}
        onRemove={() => handleRemoveWidget(widget.id)}
      />
    );
  };

  const visibleWidgets = state.widgets.filter(w => w.isVisible);

  return (
    <div className="dashboard-container space-y-4">
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Company Dashboard</h3>
          {state.isDirty && (
            <Badge variant="secondary" className="text-xs">
              Unsaved Changes
            </Badge>
          )}
          {state.error && (
            <Badge variant="destructive" className="text-xs">
              {state.error}
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Widget visibility toggles */}
          {state.isEditing && state.widgets.length > 0 && (
            <div className="flex items-center space-x-2 mr-4">
              {state.widgets.map(widget => (
                <TooltipProvider key={widget.id}>
                  <Tooltip 
                    content={`${widget.isVisible ? 'Hide' : 'Show'} ${widget.title}`}
                  >
                    <div className="flex items-center space-x-1">
                      <Switch
                        checked={widget.isVisible}
                        onCheckedChange={() => handleToggleWidget(widget.id)}
                        size="sm"
                      />
                      {widget.isVisible ? (
                        <Eye className="w-3 h-3 text-gray-500" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          )}

          {/* Main controls */}
          {state.isEditing ? (
            <>
              <WidgetLibraryTrigger onAddWidget={handleAddWidget} />
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(true)}
                disabled={!state.isDirty}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!state.isDirty || state.saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {state.saving ? (
                  <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Layout
              </Button>
              <Button variant="outline" onClick={handleToggleEdit}>
                <X className="w-4 h-4 mr-2" />
                Exit Edit
              </Button>
            </>
          ) : (
            <Button onClick={handleToggleEdit}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Dashboard
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard Grid */}
      {visibleWidgets.length === 0 ? (
        <Card className="p-12">
          <CardContent className="text-center">
            <div className="text-gray-400 mb-4">
              <Settings className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No Widgets Added
              </h3>
              <p className="text-gray-500 mb-6">
                Start building your personalized dashboard by adding widgets with real-time financial data.
              </p>
              <WidgetLibraryTrigger onAddWidget={handleAddWidget} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="min-h-96">
          <ResponsiveGridLayout
            className="layout"
            layouts={state.layouts}
            onLayoutChange={handleLayoutChange}
            isDraggable={state.isEditing}
            isResizable={state.isEditing}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={80}
            margin={[16, 16]}
            containerPadding={[16, 16]}
            useCSSTransforms={true}
            compactType="vertical"
            preventCollision={true}
            allowOverlap={false}
            verticalCompact={true}
          >
            {visibleWidgets.map(widget => (
              <div key={widget.id} className={cn(
                "widget-item h-full",
                state.isEditing && "ring-2 ring-blue-200 ring-opacity-50 rounded-lg"
              )}>
                <div className="h-full overflow-hidden rounded-lg">
                  {renderWidget(widget)}
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Dashboard Layout</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all widgets to their original positions and discard any unsaved changes. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
              Reset Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};