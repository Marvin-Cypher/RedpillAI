'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Flame, TrendingUp } from 'lucide-react'
import { StatusSelector } from './StatusSelector'
import { NewProjectModal } from './NewProjectModal'

interface Deal {
  id: string
  company_name: string
  status: string
  stage: string
  round_size: string
  sector: string
  is_hot: boolean
  conversations: Array<{
    id: string
    title: string
    last_message: string
    updated_at: string
  }>
  document_count: number
}

interface DealPipelineProps {
  onDealSelect: (dealId: string) => void
  selectedDealId: string | null
  onNewProject?: (newProject: any) => void
  updatedDeals?: Record<string, any>
  onStatusChange?: (dealId: string, newStatus: string) => void
}

// Mock data - will be replaced with API calls
const mockDeals: Deal[] = [
  {
    id: '1',
    company_name: 'LayerZero',
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
    company_name: 'Monad Labs',
    status: 'planned',
    stage: 'Seed',
    round_size: '$19M',
    sector: 'Layer 1',
    is_hot: false,
    conversations: [],
    document_count: 1
  },
  {
    id: '4',
    company_name: 'Eigenlayer',
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
    id: '5',
    company_name: 'Babylon',
    status: 'meeting',
    stage: 'Seed',
    round_size: '$18M',
    sector: 'Infrastructure',
    is_hot: false,
    conversations: [
      { id: '5-1', title: 'Bitcoin Staking Research', last_message: 'Novel approach to Bitcoin security', updated_at: '6 hours ago' }
    ],
    document_count: 2
  },
  {
    id: '6',
    company_name: 'Berachain',
    status: 'research',
    stage: 'Seed',
    round_size: '$42M',
    sector: 'Layer 1',
    is_hot: false,
    conversations: [
      { id: '6-1', title: 'Proof of Liquidity Analysis', last_message: 'Innovative consensus mechanism', updated_at: '2 days ago' },
      { id: '6-2', title: 'Competitive Analysis', last_message: 'Comparing with other L1s', updated_at: '1 day ago' },
      { id: '6-3', title: 'Investment Memo Draft', last_message: 'First draft ready for review', updated_at: '4 hours ago' }
    ],
    document_count: 5
  },
  {
    id: '7',
    company_name: 'Scroll',
    status: 'research',
    stage: 'Series A',
    round_size: '$30M',
    sector: 'Layer 2',
    is_hot: false,
    conversations: [
      { id: '7-1', title: 'zkEVM Technical Review', last_message: 'Implementation looks solid', updated_at: '1 day ago' }
    ],
    document_count: 3
  }
]

const statusGroups = [
  { status: 'planned', label: '🆕 PLANNED', count: 5 },
  { status: 'meeting', label: '🤝 MEETINGS', count: 4 },
  { status: 'research', label: '📊 RESEARCH', count: 3 },
  { status: 'deal', label: '💼 DEALS', count: 2 },
  { status: 'track', label: '📈 PORTFOLIO', count: 8 }
]

export function DealPipeline({ onDealSelect, selectedDealId, onNewProject, updatedDeals, onStatusChange }: DealPipelineProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('planned')
  const [deals, setDeals] = useState<Deal[]>(mockDeals)
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false)

  // Sync deals with parent updates
  useEffect(() => {
    if (updatedDeals && Object.keys(updatedDeals).length > 0) {
      setDeals(prevDeals => {
        // Create a map of existing deal IDs for quick lookup
        const existingDealIds = new Set(prevDeals.map(deal => deal.id))
        
        // Update existing deals and collect new ones
        const updatedExistingDeals = prevDeals.map(deal => {
          if (updatedDeals[deal.id]) {
            return {
              ...deal,
              ...updatedDeals[deal.id],
              conversations: deal.conversations || [],
              document_count: deal.document_count || 0
            }
          }
          return deal
        })
        
        // Find new deals that don't exist in current state
        const newDeals = Object.entries(updatedDeals)
          .filter(([dealId]) => !existingDealIds.has(dealId))
          .map(([dealId, dealData]) => ({
            ...dealData,
            id: dealId,
            conversations: dealData.conversations || [],
            document_count: dealData.document_count || 0
          }))
        
        // Combine updated existing deals with new deals
        return [...updatedExistingDeals, ...newDeals]
      })
    }
  }, [updatedDeals])

  // Handle status change from StatusSelector
  const handleStatusChange = (dealId: string, newStatus: string) => {
    setDeals(prev => prev.map(deal => 
      deal.id === dealId ? { ...deal, status: newStatus } : deal
    ))
    // Notify parent component about status change
    if (onStatusChange) {
      onStatusChange(dealId, newStatus)
    }
  }

  // Handle creating new project
  const handleCreateProject = (projectData: any) => {
    const newDeal: Deal = {
      ...projectData,
      conversations: [],
      document_count: 0
    }
    setDeals(prev => [...prev, newDeal])
    // Notify parent component about new project
    if (onNewProject) {
      onNewProject(newDeal)
    }
    // Auto-select the new deal
    onDealSelect(newDeal.id)
  }

  const getStatusBadgeClass = (status: string) => {
    const classes = {
      planned: 'status-planned',
      meeting: 'status-meeting',
      research: 'status-research',
      deal: 'status-deal',
      track: 'status-track'
    }
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800'
  }

  const filteredDeals = deals.filter(deal => deal.status === selectedStatus)
  
  // Calculate dynamic counts for each status
  const getStatusCount = (status: string) => {
    return deals.filter(deal => deal.status === status).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Deal Pipeline</h2>
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

      {/* Deal Cards */}
      <div className="space-y-3">
        {filteredDeals.map((deal) => (
          <Card
            key={deal.id}
            className={`cursor-pointer transition-all redpill-card hover:border-redpill-600 ${
              selectedDealId === deal.id ? 'border-redpill-600 bg-redpill-950' : ''
            }`}
            onClick={() => onDealSelect(deal.id)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Company Name and Hot Indicator */}
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">{deal.company_name}</h3>
                  {deal.is_hot && (
                    <Flame className="w-4 h-4 text-red-400" />
                  )}
                </div>

                {/* Deal Info */}
                <div className="text-xs text-gray-400 space-y-1">
                  <div>{deal.stage} • {deal.round_size}</div>
                  <div>{deal.sector}</div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center justify-between">
                  <StatusSelector 
                    currentStatus={deal.status}
                    dealId={deal.id}
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
                      <span className="text-xs text-gray-500">{deal.conversations.length} chats • {deal.document_count} docs</span>
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
        ))}
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}