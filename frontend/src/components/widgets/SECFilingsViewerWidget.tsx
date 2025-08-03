'use client';

import React from 'react';
import { WidgetComponentProps } from '@/lib/widgets/types';
import { BaseWidget } from './BaseWidget';
import { FileText, Download, Calendar, Search } from 'lucide-react';

export default function SECFilingsViewerWidget({ widget, ...props }: WidgetComponentProps) {
  const renderContent = () => {
    const filingType = widget.config.default_filing_type || '10-K';
    const maxDocs = widget.config.max_documents || 5;

    const filings = [
      {
        type: '10-K',
        date: '2024-02-28',
        title: 'Annual Report 2023',
        pages: 125
      },
      {
        type: '10-Q',
        date: '2024-11-15',
        title: 'Quarterly Report Q3 2024',
        pages: 45
      },
      {
        type: '8-K',
        date: '2024-12-01',
        title: 'Current Report - CEO Appointment',
        pages: 8
      },
      {
        type: 'DEF-14A',
        date: '2024-04-15',
        title: 'Proxy Statement 2024',
        pages: 92
      },
      {
        type: '10-Q',
        date: '2024-08-15',
        title: 'Quarterly Report Q2 2024',
        pages: 42
      }
    ].slice(0, maxDocs);

    return (
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search filings..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filings List */}
        <div className="space-y-2">
          {filings.map((filing, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {filing.type}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {filing.date}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">{filing.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{filing.pages} pages</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <FileText className="h-4 w-4 text-gray-600" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Download className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
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