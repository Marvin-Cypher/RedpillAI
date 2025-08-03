/**
 * News Widget
 * Display latest news and updates for a company/ticker
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const NewsWidget: React.FC<WidgetProps> = ({
  widget,
  data,
  loading,
  error,
  isEditing,
  onUpdate,
  onRemove,
  companyId,
  onRefresh
}) => {
  // Create mock data for testing if no real data available
  const mockData = !data ? {
    news: [
      {
        title: "Company Secures $50M Series B Funding Round",
        summary: "The startup announced a significant funding milestone to accelerate product development and market expansion.",
        url: "https://www.google.com/search?q=startup+series+b+funding+news",
        published_at: new Date().toISOString(),
        source: "Tech News Daily",
        sentiment: "positive"
      },
      {
        title: "New Product Launch Drives Customer Growth",
        summary: "Latest product features have been well-received by early adopters and enterprise customers.",
        url: "https://www.reuters.com/search/?blob=product+launch+startup",
        published_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        source: "Reuters Business",
        sentiment: "positive"
      },
      {
        title: "Strategic Partnership Announced with Industry Leader",
        summary: "Partnership will expand market reach and provide new opportunities for growth.",
        url: "https://www.bloomberg.com/search?query=strategic+partnership+announcement",
        published_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        source: "Bloomberg",
        sentiment: "positive"
      }
    ],
    count: 3
  } : null;

  const actualData = data || mockData;
  const [maxItems, setMaxItems] = useState(widget.config.max_items || 5);
  const [showSource, setShowSource] = useState(widget.config.show_source ?? true);

  // Handle config changes
  const handleMaxItemsChange = (value: string) => {
    const newMaxItems = parseInt(value);
    setMaxItems(newMaxItems);
    onUpdate?.({ ...widget.config, max_items: newMaxItems });
  };

  const handleShowSourceToggle = () => {
    const newShowSource = !showSource;
    setShowSource(newShowSource);
    onUpdate?.({ ...widget.config, show_source: newShowSource });
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
      'Reuters': 'bg-red-100 text-red-800',
      'Bloomberg': 'bg-blue-100 text-blue-800',
      'Yahoo Finance': 'bg-purple-100 text-purple-800',
      'MarketWatch': 'bg-green-100 text-green-800',
      'CNBC': 'bg-yellow-100 text-yellow-800',
      'Financial Times': 'bg-pink-100 text-pink-800',
      'WSJ': 'bg-gray-100 text-gray-800',
      'OpenBB Platform': 'bg-orange-100 text-orange-800'
    };
    
    return sourceColors[source] || 'bg-gray-100 text-gray-800';
  };

  // Render news item
  const renderNewsItem = (item: NewsItem, index: number) => {
    const publishedDate = formatPublishedDate(item.published_at);
    
    return (
      <div
        key={index}
        className="group border-b border-gray-100 last:border-b-0 pb-4 last:pb-0 mb-4 last:mb-0 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 mr-3">
            <h4 
              className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors cursor-pointer"
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
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-500">{publishedDate}</span>
          </div>
        </div>

        {/* Summary */}
        {item.summary && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-3">
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
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading news...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-red-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Failed to load news</p>
            <p className="text-xs text-gray-600 mt-1">{error}</p>
          </div>
        </div>
      );
    }

    if (!actualData?.news || actualData.news.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-gray-500">
            <Newspaper className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No news available</p>
            <p className="text-xs text-gray-400 mt-1">
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
              <h4 className="text-sm font-medium text-gray-900">Latest News</h4>
              <p className="text-xs text-gray-600">
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
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSource}
                onChange={handleShowSourceToggle}
                className="w-3 h-3 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600">Show source</span>
            </label>
          </div>
        )}

        {/* News List */}
        <div className="flex-1 overflow-auto">
          <div className="space-y-0">
            {newsItems.map((item: NewsItem, index: number) => renderNewsItem(item, index))}
          </div>
        </div>

        {/* Footer */}
        {(actualData?.news?.length || 0) > maxItems && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-500">
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