'use client';

import React from 'react';
import { WidgetComponentProps } from '@/lib/widgets/types';
import { BaseWidget } from './BaseWidget';
import { AlertTriangle, TrendingDown, Calendar, DollarSign } from 'lucide-react';

export default function RunwayBurnRateWidget({ widget, ...props }: WidgetComponentProps) {
  const renderContent = () => {
    const runwayMonths = 14;
    const burnRate = 125000;
    const cashBalance = 1750000;
    const thresholdDays = widget.config.runway_threshold_days || 180;
    const showWarning = widget.config.show_warning !== false;
    
    const runwayDays = runwayMonths * 30;
    const isWarning = runwayDays < thresholdDays;

    return (
      <div className="space-y-4">
        {showWarning && isWarning && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">
              Runway below {thresholdDays} days threshold
            </span>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Monthly Burn</span>
              <TrendingDown className="h-4 w-4 text-red-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              ${(burnRate / 1000).toFixed(0)}k
            </span>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Cash Balance</span>
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              ${(cashBalance / 1000000).toFixed(1)}M
            </span>
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isWarning ? 'bg-red-50' : 'bg-green-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Runway Remaining</span>
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${isWarning ? 'text-red-700' : 'text-green-700'}`}>
              {runwayMonths}
            </span>
            <span className={`text-lg ${isWarning ? 'text-red-600' : 'text-green-600'}`}>
              months
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${isWarning ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min((runwayDays / 730) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <BaseWidget widget={widget} {...props}>
      {renderContent()}
    </BaseWidget>
  );
}