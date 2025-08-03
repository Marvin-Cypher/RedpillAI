'use client';

import React from 'react';
import { WidgetComponentProps } from '@/lib/widgets/types';
import { BaseWidget } from './BaseWidget';
import { Lock, Unlock, DollarSign, Activity, TrendingUp, Users } from 'lucide-react';

export default function TokenEconomyDashboardWidget({ widget, ...props }: WidgetComponentProps) {
  const renderContent = () => {
    const showVesting = widget.config.show_vesting !== false;
    const showTvl = widget.config.show_tvl !== false;
    const showYield = widget.config.show_yield !== false;

    return (
      <div className="space-y-4">
        {/* Token Supply Overview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Token Supply</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-xs text-gray-500">Circulating</span>
              <p className="text-lg font-semibold">450M</p>
              <p className="text-xs text-gray-500">45%</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Locked</span>
              <p className="text-lg font-semibold">350M</p>
              <p className="text-xs text-gray-500">35%</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Max Supply</span>
              <p className="text-lg font-semibold">1B</p>
              <p className="text-xs text-gray-500">100%</p>
            </div>
          </div>
        </div>

        {/* Vesting Schedule */}
        {showVesting && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Vesting Schedule</h4>
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Team (20%)</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">18mo left</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Investors (15%)</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">12mo left</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TVL and Staking */}
        <div className="grid grid-cols-2 gap-4">
          {showTvl && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total Value Locked</span>
                <DollarSign className="h-4 w-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">$2.4B</p>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                +12% (7d)
              </p>
            </div>
          )}

          {showYield && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Staking APY</span>
                <Activity className="h-4 w-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900">8.5%</p>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Users className="h-3 w-3" />
                245k stakers
              </p>
            </div>
          )}
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