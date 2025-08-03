'use client';

import React from 'react';
import { WidgetComponentProps } from '@/lib/widgets/types';
import { BaseWidget } from './BaseWidget';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Users, MessageSquare } from 'lucide-react';

export default function RiskSentimentHeatmapWidget({ widget, ...props }: WidgetComponentProps) {
  const renderContent = () => {
    const components = widget.config.components || ['news_sentiment', 'onchain_alerts', 'dev_activity'];
    
    const riskData = {
      news_sentiment: {
        label: 'News Sentiment',
        score: 75,
        trend: 'up',
        color: 'green',
        icon: MessageSquare
      },
      social_sentiment: {
        label: 'Social Media',
        score: 62,
        trend: 'down',
        color: 'yellow',
        icon: Users
      },
      onchain_alerts: {
        label: 'On-chain Alerts',
        score: 85,
        trend: 'up',
        color: 'green',
        icon: Activity
      },
      credit_risk: {
        label: 'Credit Risk',
        score: 45,
        trend: 'down',
        color: 'red',
        icon: AlertTriangle
      },
      dev_activity: {
        label: 'Dev Activity',
        score: 90,
        trend: 'up',
        color: 'green',
        icon: Activity
      }
    };

    const getColorClass = (score: number) => {
      if (score >= 70) return 'bg-green-100 text-green-700 border-green-200';
      if (score >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      return 'bg-red-100 text-red-700 border-red-200';
    };

    const getScoreColor = (score: number) => {
      if (score >= 70) return 'text-green-600';
      if (score >= 40) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {components.map((component: string) => {
          const data = riskData[component as keyof typeof riskData];
          if (!data) return null;
          
          const Icon = data.icon;
          const TrendIcon = data.trend === 'up' ? TrendingUp : TrendingDown;

          return (
            <div
              key={component}
              className={`p-3 rounded-lg border ${getColorClass(data.score)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="h-4 w-4" />
                <TrendIcon className="h-3 w-3" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium">{data.label}</p>
                <p className={`text-2xl font-bold ${getScoreColor(data.score)}`}>
                  {data.score}
                </p>
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      data.score >= 70 ? 'bg-green-500' : 
                      data.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${data.score}%` }}
                  />
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