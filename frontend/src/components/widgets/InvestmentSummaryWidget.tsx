/**
 * Investment Summary Widget
 * Shows investment details for the portfolio company
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';
import { WidgetProps } from '@/lib/widgets/types';
import { BaseWidget } from './BaseWidget';

interface InvestmentData {
  investment_amount: number;
  valuation: number;
  ownership_percentage: number;
  lead_partner: string;
  round_type: string;
  investment_date: string;
}

const InvestmentSummaryWidget: React.FC<WidgetProps> = ({
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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Create mock data for testing if no real data available
  const mockData = !data ? {
    investment_amount: 2500000, // $2.5M
    valuation: 50000000, // $50M
    ownership_percentage: 12.5, // 12.5%
    lead_partner: 'Jane Smith',
    round_type: 'Series A',
    investment_date: '2024-03-15'
  } : null;

  const investmentData: InvestmentData = data || mockData;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-32">
          <p className="text-red-600 text-sm">Error loading investment data</p>
        </div>
      );
    }

    if (!investmentData) {
      return (
        <div className="flex items-center justify-center h-32">
          <p className="text-gray-500 text-sm">No investment data available</p>
        </div>
      );
    }

    return (
      <div className="pt-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-gray-900 mb-1">
              {formatCurrency(investmentData.investment_amount)}
            </div>
            <div className="text-xs text-blue-600 font-medium">Our Investment</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-gray-900 mb-1">
              {formatCurrency(investmentData.valuation)}
            </div>
            <div className="text-xs text-green-600 font-medium">Valuation</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-gray-900 mb-1">
              {formatPercentage(investmentData.ownership_percentage)}
            </div>
            <div className="text-xs text-purple-600 font-medium">Ownership</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900 mb-1">
              {investmentData.lead_partner}
            </div>
            <div className="text-xs text-orange-600 font-medium">Lead Partner</div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>{investmentData.round_type}</span>
            <span>{new Date(investmentData.investment_date).toLocaleDateString()}</span>
          </div>
        </div>
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

export default InvestmentSummaryWidget;