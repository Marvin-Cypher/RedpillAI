/**
 * Investment Summary Widget
 * Shows investment details for the portfolio company
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';
import { WidgetProps } from '@/lib/widgets/types';

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
  onRemove
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

  const investmentData: InvestmentData = data || {
    investment_amount: 2500000,
    valuation: 50000000,
    ownership_percentage: 12.5,
    lead_partner: 'John Partner',
    round_type: 'Series A',
    investment_date: '2024-03-15'
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Investment Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Investment Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-red-600 text-sm">Error loading data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Investment Summary</CardTitle>
        {isEditing && (
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdate?.({ ...widget.config })}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <DollarSign className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove?.();
              }}
              className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
              title="Delete widget"
            >
              ×
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-2">
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
      </CardContent>
    </Card>
  );
};

export default InvestmentSummaryWidget;