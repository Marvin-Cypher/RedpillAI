'use client';

import React from 'react';
import { WidgetComponentProps } from '@/lib/widgets/types';
import { BaseWidget } from './BaseWidget';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Wallet } from 'lucide-react';

export default function OperationalMetricsWidget({ widget, ...props }: WidgetComponentProps) {
  const renderContent = () => {
    const metrics = widget.config.metrics || ['revenue_per_employee', 'operating_cash_flow'];
    
    const availableMetrics = {
      revenue_per_employee: {
        label: 'Revenue/Employee',
        value: '$425K',
        change: '+8%',
        trend: 'up',
        icon: Users
      },
      operating_cash_flow: {
        label: 'Operating Cash Flow',
        value: '$125M',
        change: '+15%',
        trend: 'up',
        icon: DollarSign
      },
      free_cash_flow: {
        label: 'Free Cash Flow',
        value: '$95M',
        change: '+12%',
        trend: 'up',
        icon: Activity
      },
      working_capital: {
        label: 'Working Capital',
        value: '$320M',
        change: '-3%',
        trend: 'down',
        icon: Wallet
      }
    };

    return (
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metricKey: string) => {
          const metric = availableMetrics[metricKey as keyof typeof availableMetrics];
          if (!metric) return null;
          
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
          const trendColor = metric.trend === 'up' ? 'text-green-500' : 'text-red-500';

          return (
            <div key={metricKey} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{metric.label}</span>
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                {widget.config.show_trends !== false && (
                  <div className={`flex items-center gap-1 ${trendColor}`}>
                    <TrendIcon className="h-3 w-3" />
                    <span className="text-sm font-medium">{metric.change}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <BaseWidget widget={widget} {...props}>
      {renderContent()}
    </BaseWidget>
  );
}