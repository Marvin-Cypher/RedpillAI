/**
 * Widget Library Component
 * Visual library for browsing and adding widgets to dashboards
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  TrendingUp,
  BarChart3,
  Newspaper,
  GitCompare,
  Activity,
  PieChart,
  DollarSign,
  Plus,
  Search,
  Grid3X3,
  Filter
} from 'lucide-react';
import { WidgetType, WidgetMetadata } from '@/lib/widgets/types';
import { WIDGET_LIBRARY_DATA } from '@/components/widgets/index';
import { cn } from '@/lib/utils';

interface WidgetLibraryProps {
  onAddWidget: (widgetType: WidgetType) => void;
  isOpen: boolean;
  onClose: () => void;
  companyAssetType?: 'crypto' | 'equity'; // Filter widgets by company asset type
}

interface WidgetLibraryItem {
  type: WidgetType;
  name: string;
  description: string;
  icon: string;
  category: string;
  default_size: { w: number; h: number };
  config_schema: Record<string, any>;
  compatibleAssetTypes?: ('crypto' | 'equity')[]; // Asset types this widget supports
}

const WIDGET_ICONS = {
  TrendingUp,
  BarChart3,
  Newspaper,
  GitCompare,
  Activity,
  PieChart,
  DollarSign,
};

const CATEGORY_COLORS = {
  market: 'bg-blue-100 text-blue-800',
  analysis: 'bg-green-100 text-green-800',
  news: 'bg-purple-100 text-purple-800',
  portfolio: 'bg-orange-100 text-orange-800',
  company: 'bg-indigo-100 text-indigo-800',
};

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  onAddWidget,
  isOpen,
  onClose,
  companyAssetType
}) => {
  const [widgets, setWidgets] = useState<WidgetLibraryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Fetch widget library from backend
  useEffect(() => {
    const fetchWidgetLibrary = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboards/widget-library', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setWidgets(data.widgets);
          setCategories(['all', ...data.categories]);
        } else {
          // Fallback to widget registry
          setWidgets(getWidgetsFromRegistry());
          setCategories(getCategoriesFromRegistry());
        }
      } catch (error) {
        console.error('Failed to fetch widget library:', error);
        // Fallback to widget registry
        setWidgets(getWidgetsFromRegistry());
        setCategories(getCategoriesFromRegistry());
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchWidgetLibrary();
    }
  }, [isOpen]);

  const getWidgetsFromRegistry = (): WidgetLibraryItem[] => {
    return WIDGET_LIBRARY_DATA.map(widgetMeta => ({
      type: widgetMeta.type,
      name: widgetMeta.name,
      description: widgetMeta.description,
      icon: widgetMeta.icon,
      category: widgetMeta.category,
      default_size: { w: widgetMeta.defaultSize.w, h: widgetMeta.defaultSize.h },
      config_schema: widgetMeta.configSchema,
      compatibleAssetTypes: (widgetMeta as any).compatibleAssetTypes
    }));
  };

  const getCategoriesFromRegistry = (): string[] => {
    const categories = new Set(['all']);
    WIDGET_LIBRARY_DATA.forEach(widget => {
      categories.add(widget.category);
    });
    return Array.from(categories);
  };

  const filteredWidgets = widgets.filter(widget => {
    const matchesSearch = widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         widget.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    
    // Filter by asset type compatibility
    const matchesAssetType = !widget.compatibleAssetTypes || 
                            !companyAssetType || 
                            widget.compatibleAssetTypes.includes(companyAssetType);
    
    return matchesSearch && matchesCategory && matchesAssetType;
  });

  const handleAddWidget = (widgetType: WidgetType) => {
    onAddWidget(widgetType);
    onClose();
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') return widgets.length;
    return widgets.filter(w => w.category === category).length;
  };

  const renderWidgetCard = (widget: WidgetLibraryItem) => {
    const IconComponent = WIDGET_ICONS[widget.icon as keyof typeof WIDGET_ICONS] || Grid3X3;
    
    return (
      <Card 
        key={widget.type} 
        className="group hover:shadow-md transition-all duration-200 cursor-pointer border-2 hover:border-blue-200"
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <IconComponent className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-sm font-medium">{widget.name}</CardTitle>
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-xs mt-1',
                    CATEGORY_COLORS[widget.category as keyof typeof CATEGORY_COLORS] || 'bg-gray-100 text-gray-800'
                  )}
                >
                  {widget.category}
                </Badge>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleAddWidget(widget.type)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 mb-3">{widget.description}</p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Size: {widget.default_size.w}×{widget.default_size.h}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddWidget(widget.type)}
              className="text-xs px-2 py-1 h-auto"
            >
              Add Widget
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Grid3X3 className="w-5 h-5" />
            <span>Widget Library</span>
          </DialogTitle>
          <DialogDescription>
            Choose widgets to add to your dashboard. Each widget provides real-time financial data powered by OpenBB.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Loading widget library...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search widgets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-1">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Filter:</span>
              </div>
            </div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-5">
                {categories.map(category => (
                  <TabsTrigger key={category} value={category} className="text-xs">
                    {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {getCategoryCount(category)}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedCategory} className="mt-4">
                <div className="max-h-96 overflow-y-auto">
                  {filteredWidgets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Grid3X3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No widgets found matching your criteria</p>
                      <p className="text-sm mt-1">Try adjusting your search or category filter</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredWidgets.map(renderWidgetCard)}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                {filteredWidgets.length} widget{filteredWidgets.length !== 1 ? 's' : ''} available
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  Powered by OpenBB
                </Badge>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Widget Library Trigger Button Component
export const WidgetLibraryTrigger: React.FC<{
  onAddWidget: (widgetType: WidgetType) => void;
  companyAssetType?: 'crypto' | 'equity';
}> = ({ onAddWidget, companyAssetType }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Widget
      </Button>
      
      <WidgetLibrary
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAddWidget={onAddWidget}
        companyAssetType={companyAssetType}
      />
    </>
  );
};