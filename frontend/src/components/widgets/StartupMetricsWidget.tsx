'use client';

import React from 'react';
import { WidgetComponentProps } from '@/lib/widgets/types';
import { BaseWidget } from './BaseWidget';
import { TrendingUp, TrendingDown, DollarSign, Users, Activity } from 'lucide-react';

export default function StartupMetricsWidget({ widget, ...props }: WidgetComponentProps) {
  const renderContent = () => {
    const metrics = [
      {
        label: 'MRR',
        value: '$45,000',
        change: '+12%',
        trend: 'up',
        icon: DollarSign
      },
      {
        label: 'CAC',
        value: '$1,200',
        change: '-8%',
        trend: 'down',
        icon: Users
      },
      {
        label: 'LTV',
        value: '$18,000',
        change: '+15%',
        trend: 'up',
        icon: Activity
      },
      {
        label: 'Burn Rate',
        value: '$125k/mo',
        change: '+5%',
        trend: 'up',
        icon: TrendingUp
      }
    ];

    return (
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? TrendingUp : TrendingDown;
          const trendColor = metric.trend === 'up' ? 'text-green-500' : 'text-red-500';

          return (
            <div key={metric.label} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">{metric.label}</span>
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                <div className={`flex items-center gap-1 ${trendColor}`}>
                  <TrendIcon className="h-3 w-3" />
                  <span className="text-sm font-medium">{metric.change}</span>
                </div>
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