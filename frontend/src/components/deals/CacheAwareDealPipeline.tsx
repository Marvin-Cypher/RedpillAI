/**
 * Cache-Aware Deal Pipeline
 * Uses real company data with intelligent caching
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Flame, TrendingUp, Database, Wifi, Clock } from 'lucide-react';
import { StatusSelector } from './StatusSelector';
import { NewProjectModal } from './NewProjectModal';
import { useBatchCompanyData, cacheUtils } from '@/hooks/useCachedCompanyData';

interface Deal {
  id: string;
  company_name: string;
  status: string;
  stage: string;
  round_size: string;
  sector: string;
  is_hot: boolean;
  website?: string;
  conversations: Array<{
    id: string;
    title: string;
    last_message: string;
    updated_at: string;
  }>;
  document_count: number;
}

interface CacheAwareDealPipelineProps {
  onDealSelect: (dealId: string) => void;
  selectedDealId: string | null;
  onNewProject?: (newProject: any) => void;
  updatedDeals?: Record<string, any>;
  onStatusChange?: (dealId: string, newStatus: string) => void;
}

// Mock deals - enhanced with real data integration points
const mockDeals: Deal[] = [
  {
    id: '1',
    company_name: 'LayerZero',
    website: 'layerzero.network',
    status: 'planned',
    stage: 'Series B',
    round_size: '$120M',
    sector: 'Infrastructure',
    is_hot: true,
    conversations: [
      { id: '1-1', title: 'Initial Research', last_message: 'Omnichain protocol analysis complete', updated_at: '2 hours ago' },
      { id: '1-2', title: 'Team Background Check', last_message: 'Strong technical team with Ethereum experience', updated_at: '1 day ago' }
    ],
    document_count: 3
  },
  {
    id: '2', 
    company_name: 'Celestia',
    website: 'celestia.org',
    status: 'planned',
    stage: 'Series A',
    round_size: '$55M',
    sector: 'Infrastructure',
    is_hot: false,
    conversations: [
      { id: '2-1', title: 'Market Analysis', last_message: 'Modular blockchain space is heating up', updated_at: '3 hours ago' }
    ],
    document_count: 2
  },
  {
    id: '3',
    company_name: 'Eigenlayer',
    website: 'eigenlayer.xyz',
    status: 'meeting',
    stage: 'Series A',
    round_size: '$50M',
    sector: 'Infrastructure',
    is_hot: false,
    conversations: [
      { id: '4-1', title: 'Restaking Deep Dive', last_message: 'Security model needs further analysis', updated_at: '1 hour ago' },
      { id: '4-2', title: 'Meeting Prep', last_message: 'Questions prepared for founder call', updated_at: '5 hours ago' }
    ],
    document_count: 4
  },
  {
    id: '4',
    company_name: 'Babylon',
    website: 'babylonchain.io',
    status: 'research',
    stage: 'Seed',
    round_size: '$18M',
    sector: 'Infrastructure',
    is_hot: false,
    conversations: [
      { id: '5-1', title: 'Bitcoin Staking Research', last_message: 'Novel approach to Bitcoin security', updated_at: '6 hours ago' }
    ],
    document_count: 2
  }
];

const statusGroups = [
  { status: 'planned', label: '🆕 PLANNED', count: 0 },
  { status: 'meeting', label: '🤝 MEETINGS', count: 0 },
  { status: 'research', label: '📊 RESEARCH', count: 0 },
  { status: 'deal', label: '💼 DEALS', count: 0 },
  { status: 'track', label: '📈 PORTFOLIO', count: 0 }
];

export function CacheAwareDealPipeline({ 
  onDealSelect, 
  selectedDealId, 
  onNewProject, 
  updatedDeals, 
  onStatusChange 
}: CacheAwareDealPipelineProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('planned');
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Prepare companies for batch data fetching
  const companiesForBatch = deals.map(deal => ({
    name: deal.company_name,
    website: deal.website
  }));

  // Fetch batch company data with caching
  const { data: companyData, loading: dataLoading, batchStats } = useBatchCompanyData(
    companiesForBatch, 
    ['profile']
  );

  // Handle status change
  const handleStatusChange = (dealId: string, newStatus: string) => {
    setDeals(prev => prev.map(deal => 
      deal.id === dealId ? { ...deal, status: newStatus } : deal
    ));
    if (onStatusChange) {
      onStatusChange(dealId, newStatus);
    }
  };

  // Handle creating new project
  const handleCreateProject = (projectData: any) => {
    const newDeal: Deal = {
      ...projectData,
      conversations: [],
      document_count: 0
    };
    setDeals(prev => [...prev, newDeal]);
    if (onNewProject) {
      onNewProject(newDeal);
    }
    onDealSelect(newDeal.id);
  };

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      planned: 'status-planned',
      meeting: 'status-meeting',
      research: 'status-research',
      deal: 'status-deal',
      track: 'status-track'
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };

  const filteredDeals = deals.filter(deal => deal.status === selectedStatus);
  
  // Calculate dynamic counts for each status
  const getStatusCount = (status: string) => {
    return deals.filter(deal => deal.status === status).length;
  };

  // Get company data for a specific deal
  const getCompanyDataForDeal = (deal: Deal) => {
    if (!companyData) return null;
    const normalizedName = deal.company_name.toLowerCase().replace(/\s+/g, '-');
    return companyData[normalizedName]?.profile?.data;
  };

  // Get cache source for a company
  const getCacheSource = (deal: Deal) => {
    if (!companyData) return null;
    const normalizedName = deal.company_name.toLowerCase().replace(/\s+/g, '-');
    return companyData[normalizedName]?.profile?.source;
  };

  return (
    <div className="space-y-6">
      {/* Header with Batch Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-white">Deal Pipeline</h2>
          {batchStats && (
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Badge variant="outline" className="text-xs">
                {Math.round(batchStats.cache_hit_rate * 100)}% cached
              </Badge>
              <span>{cacheUtils.formatCost(batchStats.total_cost)} cost</span>
            </div>
          )}
        </div>
        <Button 
          size="sm"
          onClick={() => setIsNewProjectModalOpen(true)}
          className="redpill-button-primary flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        {statusGroups.map((group) => (
          <button
            key={group.status}
            onClick={() => setSelectedStatus(group.status)}
            className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
              selectedStatus === group.status
                ? 'bg-dark-700 border border-redpill-600'
                : 'bg-dark-800 hover:bg-dark-700 border border-dark-600'
            }`}
          >
            <span className="text-sm font-medium text-gray-300">{group.label}</span>
            <Badge variant="secondary" className="bg-dark-600 text-gray-300">
              {getStatusCount(group.status)}
            </Badge>
          </button>
        ))}
      </div>

      {/* Deal Cards with Real Data */}
      <div className="space-y-3">
        {filteredDeals.map((deal) => {
          const realCompanyData = getCompanyDataForDeal(deal);
          const cacheSource = getCacheSource(deal);
          
          return (
            <Card
              key={deal.id}
              className={`cursor-pointer transition-all redpill-card hover:border-redpill-600 ${
                selectedDealId === deal.id ? 'border-redpill-600 bg-redpill-950' : ''
              }`}
              onClick={() => onDealSelect(deal.id)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Company Name and Hot Indicator with Cache Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-white">{deal.company_name}</h3>
                      {deal.is_hot && (
                        <Flame className="w-4 h-4 text-red-400" />
                      )}
                      {/* Cache Status Indicator */}
                      {cacheSource && (
                        <div className="flex items-center space-x-1">
                          {cacheSource === 'cache' && <Database className="w-3 h-3 text-green-400" />}
                          {cacheSource === 'api' && <Wifi className="w-3 h-3 text-blue-400" />}
                          {cacheSource === 'cache_expired' && <Clock className="w-3 h-3 text-yellow-400" />}
                        </div>
                      )}
                    </div>
                    {dataLoading && (
                      <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full" />
                    )}
                  </div>

                  {/* Enhanced Deal Info with Real Data */}
                  <div className="text-xs text-gray-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>{deal.stage} • {deal.round_size}</span>
                      {realCompanyData?.founded_year && (
                        <Badge variant="secondary" className="text-xs">
                          Est. {realCompanyData.founded_year}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{deal.sector}</span>
                      {realCompanyData?.headquarters && (
                        <span className="text-xs text-gray-500">
                          📍 {realCompanyData.headquarters}
                        </span>
                      )}
                    </div>
                    {realCompanyData?.employee_count && (
                      <div className="text-xs text-gray-500">
                        👥 {realCompanyData.employee_count} employees
                      </div>
                    )}
                  </div>

                  {/* Real Company Description */}
                  {realCompanyData?.description && (
                    <div className="text-xs text-gray-300 bg-dark-800 p-2 rounded">
                      <p className="line-clamp-2">{realCompanyData.description}</p>
                    </div>
                  )}

                  {/* Status and Actions */}
                  <div className="flex items-center justify-between">
                    <StatusSelector 
                      currentStatus={deal.status}
                      dealId={deal.id}
                      companyName={deal.company_name}
                      compact
                      onStatusChange={handleStatusChange}
                    />
                    {selectedStatus === 'track' && (
                      <div className="flex items-center space-x-1 text-green-400 text-xs">
                        <TrendingUp className="w-3 h-3" />
                        <span>+127%</span>
                      </div>
                    )}
                  </div>

                  {/* Conversation History */}
                  {deal.conversations.length > 0 && (
                    <div className="pt-2 border-t border-dark-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Recent Conversations</span>
                        <span className="text-xs text-gray-500">
                          {deal.conversations.length} chats • {deal.document_count} docs
                        </span>
                      </div>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {deal.conversations.slice(0, 2).map((conv) => (
                          <div key={conv.id} className="bg-dark-800 rounded p-2 text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-white truncate">{conv.title}</span>
                              <span className="text-gray-500 text-xs">{conv.updated_at}</span>
                            </div>
                            <p className="text-gray-400 truncate">{conv.last_message}</p>
                          </div>
                        ))}
                        {deal.conversations.length > 2 && (
                          <button className="text-xs text-redpill-400 hover:text-redpill-300">
                            View {deal.conversations.length - 2} more conversations...
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  {selectedDealId === deal.id && (
                    <div className="flex items-center space-x-2 pt-2 border-t border-dark-600">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="flex-1 text-xs"
                      >
                        💬 New Chat
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="flex-1 text-xs"
                      >
                        📄 Upload Doc
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Data Loading State */}
      {dataLoading && (
        <div className="text-center text-gray-400 text-sm">
          <div className="animate-pulse">Loading company data...</div>
        </div>
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}