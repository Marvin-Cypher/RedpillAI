'use client';

import React from 'react';
import { WidgetComponentProps } from '@/lib/widgets/types';
import { BaseWidget } from './BaseWidget';
import { Leaf, Users, Shield, Globe, TrendingUp, Award } from 'lucide-react';

export default function ESGImpactMetricsWidget({ widget, ...props }: WidgetComponentProps) {
  const renderContent = () => {
    const showEnvironmental = widget.config.show_environmental !== false;
    const showSocial = widget.config.show_social !== false;
    const showGovernance = widget.config.show_governance !== false;

    const esgData = {
      environmental: {
        score: 82,
        metrics: [
          { label: 'Carbon Neutral', value: '2025 Target', icon: Leaf },
          { label: 'Renewable Energy', value: '73%', icon: Globe }
        ]
      },
      social: {
        score: 78,
        metrics: [
          { label: 'Diversity Score', value: '8.5/10', icon: Users },
          { label: 'Employee NPS', value: '+42', icon: Award }
        ]
      },
      governance: {
        score: 91,
        metrics: [
          { label: 'Board Independence', value: '80%', icon: Shield },
          { label: 'Ethics Training', value: '100%', icon: Award }
        ]
      }
    };

    const categories = [];
    if (showEnvironmental) categories.push({ key: 'environmental', label: 'Environmental', color: 'green' });
    if (showSocial) categories.push({ key: 'social', label: 'Social', color: 'blue' });
    if (showGovernance) categories.push({ key: 'governance', label: 'Governance', color: 'purple' });

    const getColorClasses = (color: string) => ({
      bg: `bg-${color}-50`,
      text: `text-${color}-700`,
      border: `border-${color}-200`,
      bar: `bg-${color}-500`
    });

    return (
      <div className="space-y-4">
        {/* Overall ESG Score */}
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Overall ESG Score</h4>
          <div className="text-3xl font-bold text-gray-900">
            {Math.round((esgData.environmental.score + esgData.social.score + esgData.governance.score) / 3)}
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-xs text-green-600">+5 from last year</span>
          </div>
        </div>

        {/* Category Breakdowns */}
        <div className="space-y-3">
          {categories.map(({ key, label, color }) => {
            const data = esgData[key as keyof typeof esgData];
            const colors = getColorClasses(color);
            
            return (
              <div key={key} className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
                <div className="flex items-center justify-between mb-2">
                  <h5 className={`text-sm font-medium ${colors.text}`}>{label}</h5>
                  <span className={`text-lg font-bold ${colors.text}`}>{data.score}</span>
                </div>
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${colors.bar}`}
                      style={{ width: `${data.score}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  {data.metrics.map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          {metric.label}
                        </span>
                        <span className={`font-medium ${colors.text}`}>{metric.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
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