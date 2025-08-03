/**
 * Widget Grid Component
 * Renders a grid of widgets using the widget registry
 */

import React from 'react';
import { Widget } from '@/lib/widgets/types';
import { widgetRegistry } from '@/lib/widgets/registry';
import { Card } from '@/components/ui/card';

interface WidgetGridProps {
  widgets: Widget[];
  onUpdateWidget: (widgetId: string, updates: Partial<Widget>) => void;
  onRemoveWidget: (widgetId: string) => void;
  companyId: string;
  isEditing?: boolean;
}

export function WidgetGrid({
  widgets,
  onUpdateWidget,
  onRemoveWidget,
  companyId,
  isEditing = false
}: WidgetGridProps) {
  const renderWidget = (widget: Widget) => {
    const WidgetComponent = widgetRegistry.getComponent(widget.type);
    
    if (!WidgetComponent) {
      return (
        <Card key={widget.id} className="p-4 border-red-200 bg-red-50">
          <div className="text-center text-red-600">
            <h4 className="font-medium">Widget Error</h4>
            <p className="text-sm">Component not found for: {widget.type}</p>
          </div>
        </Card>
      );
    }

    const handleUpdate = (config: any) => {
      onUpdateWidget(widget.id, { config });
    };

    const handleRemove = () => {
      onRemoveWidget(widget.id);
    };

    const handleResize = (size: { w: number; h: number }) => {
      onUpdateWidget(widget.id, {
        position: { ...widget.position, ...size }
      });
    };

    return (
      <div
        key={widget.id}
        className="widget-container"
        style={{
          gridColumn: `span ${widget.position.w}`,
          minHeight: `${widget.position.h * 120}px` // Approximate height per grid unit
        }}
      >
        <WidgetComponent
          widget={widget}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          onResize={handleResize}
          isEditing={isEditing}
          companyId={companyId}
        />
      </div>
    );
  };

  if (widgets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No widgets to display</p>
      </div>
    );
  }

  return (
    <div className="widget-grid grid grid-cols-12 gap-4 auto-rows-min">
      {widgets.map(renderWidget)}
    </div>
  );
}

export default WidgetGrid;