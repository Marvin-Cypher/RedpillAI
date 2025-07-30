/**
 * Base Widget Component
 * Provides common functionality for all dashboard widgets
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertCircle,
  MoreVertical,
  Settings,
  RefreshCw,
  Trash2,
  Loader2,
  Clock
} from 'lucide-react';
import { BaseWidgetProps } from '@/lib/widgets/types';
import { cn } from '@/lib/utils';

interface BaseWidgetState {
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const BaseWidget: React.FC<BaseWidgetProps & { children: React.ReactNode }> = ({
  widget,
  onUpdate,
  onRemove,
  onResize,
  isEditing = false,
  companyId,
  children
}) => {
  const [state, setState] = useState<BaseWidgetState>({
    loading: false,
    error: null,
    lastUpdated: null
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh functionality
  useEffect(() => {
    if (!widget.refreshInterval || isEditing) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, widget.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [widget.refreshInterval, isEditing]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Trigger data refresh - this would be handled by parent component
    // For now, just simulate a refresh
    setTimeout(() => {
      setIsRefreshing(false);
      setState(prev => ({ ...prev, lastUpdated: new Date() }));
    }, 1000);
  };

  const handleConfigure = () => {
    if (onUpdate) {
      onUpdate(widget.config);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    }
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  const getStatusColor = () => {
    if (state.error) return 'bg-red-100 border-red-200';
    if (state.loading || isRefreshing) return 'bg-yellow-50 border-yellow-200';
    return 'bg-white border-gray-200';
  };

  return (
    <Card className={cn(
      'widget-container h-full transition-all duration-200 hover:shadow-md',
      getStatusColor(),
      isEditing && 'ring-2 ring-blue-200 ring-opacity-50'
    )}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 space-y-0">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-sm font-medium text-gray-900">
            {widget.title}
          </CardTitle>
          
          {/* Status indicators */}
          {state.error && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              Error
            </Badge>
          )}
          
          {(state.loading || isRefreshing) && (
            <Badge variant="secondary" className="text-xs">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Loading
            </Badge>
          )}
        </div>

        {/* Widget controls */}
        <div className="flex items-center space-x-1">
          {/* Last updated indicator */}
          {state.lastUpdated && !isEditing && (
            <div className="text-xs text-gray-500 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatLastUpdated(state.lastUpdated)}
            </div>
          )}

          {/* Refresh button - always visible */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <RefreshCw className={cn(
              "w-3 h-3",
              isRefreshing && "animate-spin"
            )} />
          </Button>

          {/* Editing controls */}
          {isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleConfigure}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Widget
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleRemove} 
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Widget
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 h-[calc(100%-4rem)] overflow-auto">
        {state.error ? (
          <div className="flex items-center justify-center h-full text-center">
            <div className="text-red-600">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Widget Error</p>
              <p className="text-xs text-gray-600 mt-1">{state.error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : state.loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Loading widget data...</p>
            </div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

// Higher-order component for adding data fetching capabilities
export const withWidgetData = <T extends object>(
  WrappedComponent: React.ComponentType<BaseWidgetProps & T>,
  dataFetcher: (widget: BaseWidgetProps['widget'], companyId: string) => Promise<any>
) => {
  return (props: BaseWidgetProps & T) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await dataFetcher(props.widget, props.companyId);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchData();
    }, [props.widget.dataSource, props.companyId]);

    // Auto-refresh based on widget configuration
    useEffect(() => {
      if (!props.widget.refreshInterval) return;

      const interval = setInterval(fetchData, props.widget.refreshInterval * 1000);
      return () => clearInterval(interval);
    }, [props.widget.refreshInterval]);

    return (
      <WrappedComponent
        {...props}
        data={data}
        loading={loading}
        error={error}
        onRefresh={fetchData}
      />
    );
  };
};