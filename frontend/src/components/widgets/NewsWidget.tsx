/**
 * News Widget
 * Display latest news and updates for a company/ticker
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ExternalLink,
  Clock,
  Newspaper,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { WidgetProps, NewsItem } from '@/lib/widgets/types';
import { parseISO, formatDistanceToNow } from 'date-fns';
import { BaseWidget } from './BaseWidget';
import { fetchWidgetData } from '@/lib/widgets/data';

const NewsWidget: React.FC<WidgetProps> = ({
  widget,
  data,
  loading: externalLoading,
  error: externalError,
  isEditing,
  onUpdate,
  onRemove,
  companyId,
  onRefresh
}) => {
  // Self-sufficient data fetching state (for WidgetGrid system)
  const [selfData, setSelfData] = useState<any>(null);
  const [selfLoading, setSelfLoading] = useState(false);
  const [selfError, setSelfError] = useState<string | null>(null);

  // Self-sufficient data fetching (when no data is provided)
  useEffect(() => {
    if (!data && !externalLoading && companyId) {
      console.log('🔄 NewsWidget: No data provided, fetching self-sufficiently');
      setSelfLoading(true);
      setSelfError(null);
      
      fetchWidgetData(widget, companyId)
        .then((fetchedData) => {
          console.log('✅ NewsWidget: Self-fetched data:', fetchedData);
          setSelfData(fetchedData);
        })
        .catch((fetchError) => {
          console.error('❌ NewsWidget: Self-fetch failed:', fetchError);
          setSelfError(fetchError.message || 'Failed to fetch news data');
        })
        .finally(() => {
          setSelfLoading(false);
        });
    }
  }, [data, externalLoading, widget, companyId]);

  // Determine which data/loading/error to use
  const actualData = data || selfData;
  const actualLoading = externalLoading || selfLoading;
  const actualError = externalError || selfError;
  const [maxItems, setMaxItems] = useState(widget.config.max_items || 5);
  const [showSource, setShowSource] = useState(widget.config.show_source ?? true);

  // Handle config changes
  const handleMaxItemsChange = (value: string) => {
    const newMaxItems = parseInt(value);
    setMaxItems(newMaxItems);
    onUpdate?.({ ...widget.config, max_items: newMaxItems });
  };


  // Format published date
  const formatPublishedDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      const distance = formatDistanceToNow(date, { addSuffix: true });
      return distance;
    } catch {
      return 'Unknown';
    }
  };

  // Get source badge color
  const getSourceBadgeColor = (source: string): string => {
    const sourceColors: Record<string, string> = {
      'Reuters': 'bg-red-50 text-red-700 border-red-200',
      'Bloomberg': 'bg-blue-50 text-blue-700 border-blue-200',
      'Yahoo Finance': 'bg-purple-50 text-purple-700 border-purple-200',
      'MarketWatch': 'bg-green-50 text-green-700 border-green-200',
      'CNBC': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Financial Times': 'bg-pink-50 text-pink-700 border-pink-200',
      'WSJ': 'bg-muted text-muted-foreground border-border',
      'OpenBB Platform': 'bg-orange-50 text-orange-700 border-orange-200'
    };
    
    return sourceColors[source] || 'bg-muted text-muted-foreground border-border';
  };

  // Render news item
  const renderNewsItem = (item: NewsItem, index: number) => {
    const publishedDate = formatPublishedDate(item.published_at);
    
    return (
      <div
        key={index}
        className="group border-b border-border last:border-b-0 pb-4 last:pb-0 mb-4 last:mb-0 hover:bg-accent -mx-2 px-2 py-2 rounded-lg transition-colors"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 mr-3">
            <h4 
              className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (item.url && (item.url.startsWith('http://') || item.url.startsWith('https://'))) {
                  window.open(item.url, '_blank', 'noopener,noreferrer');
                }
              }}
              title={item.url ? "Click to open article" : "No link available"}
            >
              {item.title}
            </h4>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{publishedDate}</span>
          </div>
        </div>

        {/* Summary */}
        {item.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {item.summary}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {showSource && (
              <Badge
                variant="outline"
                className={`text-xs ${getSourceBadgeColor(item.source)}`}
              >
                {item.source}
              </Badge>
            )}
            {item.ticker && (
              <Badge variant="outline" className="text-xs">
                {item.ticker}
              </Badge>
            )}
          </div>

          {item.url && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  // Validate URL before opening
                  if (item.url && (item.url.startsWith('http://') || item.url.startsWith('https://'))) {
                    window.open(item.url, '_blank', 'noopener,noreferrer');
                  } else {
                    console.warn('Invalid URL:', item.url);
                  }
                } catch (error) {
                  console.error('Error opening URL:', error);
                  // Fallback: try direct navigation
                  window.location.href = item.url;
                }
              }}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (actualLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading news...</p>
          </div>
        </div>
      );
    }

    if (actualError) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Failed to load news</p>
            <p className="text-xs text-muted-foreground mt-1">{actualError}</p>
          </div>
        </div>
      );
    }

    if (!actualData?.news || actualData.news.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-muted-foreground">
            <Newspaper className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No news available</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Check back later for updates
            </p>
          </div>
        </div>
      );
    }

    const newsItems = actualData?.news?.slice(0, maxItems) || [];

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Newspaper className="w-4 h-4 text-blue-600" />
            <div>
              <h4 className="text-sm font-medium text-foreground">Latest News</h4>
              <p className="text-xs text-muted-foreground">
                {widget.dataSource.ticker ? `${widget.dataSource.ticker} • ` : ''}
                {actualData?.count || actualData?.news?.length || 0} articles
              </p>
            </div>
          </div>

          {/* Controls */}
          {isEditing && (
            <div className="flex items-center space-x-2">
              <Select value={maxItems.toString()} onValueChange={handleMaxItemsChange}>
                <SelectTrigger className="w-16 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="7">7</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Configuration */}
        {isEditing && (
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-source"
                checked={showSource}
                onCheckedChange={(checked: boolean) => {
                  setShowSource(checked);
                  onUpdate?.({ ...widget.config, show_source: checked });
                }}
              />
              <label htmlFor="show-source" className="text-xs text-muted-foreground cursor-pointer">
                Show source
              </label>
            </div>
          </div>
        )}

        {/* News List */}
        <ScrollArea className="flex-1">
          <div className="space-y-0">
            {newsItems.map((item: NewsItem, index: number) => renderNewsItem(item, index))}
          </div>
        </ScrollArea>

        {/* Footer */}
        {(actualData?.news?.length || 0) > maxItems && (
          <div className="mt-4 pt-3 border-t border-border">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Showing {maxItems} of {actualData?.count || actualData?.news?.length || 0} articles
              </p>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs mt-1"
                  onClick={() => handleMaxItemsChange(Math.min(maxItems + 3, actualData.count).toString())}
                >
                  Show More
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Auto-refresh indicator */}
        {widget.config.auto_refresh && (
          <div className="mt-2 flex items-center justify-center">
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Auto-refresh enabled
            </Badge>
          </div>
        )}
      </div>
    );
  };

  return (
    <BaseWidget 
      widget={widget} 
      isEditing={isEditing} 
      onUpdate={onUpdate} 
      onRemove={onRemove}
      companyId={companyId}
      onRefresh={onRefresh}
    >
      {renderContent()}
    </BaseWidget>
  );
};

export default NewsWidget;