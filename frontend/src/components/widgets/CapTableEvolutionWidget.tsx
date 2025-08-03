'use client';

import React from 'react';
import { WidgetComponentProps } from '@/lib/widgets/types';
import { BaseWidget } from './BaseWidget';
import { Users, Building, Briefcase, TrendingUp } from 'lucide-react';

export default function CapTableEvolutionWidget({ widget, ...props }: WidgetComponentProps) {
  const renderContent = () => {
    const timeWindow = widget.config.time_window || 'all';
    const highlightShareholders = widget.config.highlight_shareholders || ['founders', 'vcs'];

    const rounds = [
      {
        name: 'Founding',
        date: '2020-01',
        valuation: 5000000,
        raised: 0,
        ownership: {
          founders: 80,
          employees: 20,
          vcs: 0,
          strategic: 0
        }
      },
      {
        name: 'Seed',
        date: '2021-03',
        valuation: 15000000,
        raised: 3000000,
        ownership: {
          founders: 60,
          employees: 15,
          vcs: 25,
          strategic: 0
        }
      },
      {
        name: 'Series A',
        date: '2022-09',
        valuation: 50000000,
        raised: 12000000,
        ownership: {
          founders: 42,
          employees: 13,
          vcs: 45,
          strategic: 0
        }
      },
      {
        name: 'Series B',
        date: '2024-01',
        valuation: 150000000,
        raised: 30000000,
        ownership: {
          founders: 30,
          employees: 12,
          vcs: 53,
          strategic: 5
        }
      }
    ];

    const shareholderConfig = {
      founders: { label: 'Founders', color: 'bg-blue-500', icon: Users },
      employees: { label: 'Employee Pool', color: 'bg-green-500', icon: Users },
      vcs: { label: 'VC Funds', color: 'bg-purple-500', icon: Briefcase },
      strategic: { label: 'Strategic Investors', color: 'bg-orange-500', icon: Building }
    };

    return (
      <div className="space-y-4">
        {/* Current Ownership Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Current Ownership</h4>
          <div className="space-y-2">
            {Object.entries(rounds[rounds.length - 1].ownership).map(([key, value]) => {
              const config = shareholderConfig[key as keyof typeof shareholderConfig];
              const Icon = config.icon;
              const isHighlighted = highlightShareholders.includes(key);
              
              return (
                <div key={key} className={`flex items-center justify-between ${isHighlighted ? 'font-medium' : ''}`}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full ${config.color}`} style={{ width: `${value}%` }} />
                    </div>
                    <span className="text-sm text-gray-600 w-10 text-right">{value}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Evolution Timeline */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Ownership Evolution</h4>
          {rounds.map((round, index) => (
            <div key={index} className="border-l-2 border-gray-200 pl-4 pb-3 relative">
              <div className="absolute w-3 h-3 bg-gray-400 rounded-full -left-[7px] top-0" />
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{round.name}</span>
                <span className="text-xs text-gray-500">{round.date}</span>
              </div>
              {round.raised > 0 && (
                <p className="text-xs text-gray-600 mb-1">
                  Raised ${(round.raised / 1000000).toFixed(0)}M at ${(round.valuation / 1000000).toFixed(0)}M valuation
                </p>
              )}
              <div className="flex gap-1">
                {highlightShareholders.map((shareholder) => {
                  const ownership = round.ownership[shareholder as keyof typeof round.ownership];
                  const config = shareholderConfig[shareholder as keyof typeof shareholderConfig];
                  return (
                    <span key={shareholder} className="text-xs text-gray-600">
                      {config.label}: {ownership}%
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
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