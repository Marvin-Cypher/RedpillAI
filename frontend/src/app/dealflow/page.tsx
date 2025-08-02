'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  User,
  Building,
  Sparkles,
  MoreHorizontal,
  AlertCircle,
  Clock,
  Target,
  MessageSquare
} from 'lucide-react'
import { ChatWithAIButton, ChatHistoryButton } from '@/components/ai'
import { SimplifiedDealCard } from '@/components/deals/SimplifiedDealCard'
import { updateDealStatus, getDealStatusUpdates, initializeDealStatuses, getDealStatusForCompany, subscribeToDealStatusChanges } from '@/lib/dealStatusSync'
import { getAllCompanies, Company } from '@/lib/companyDatabase'

interface Deal {
  id: string
  company: {
    name: string
    logo?: string
    sector: string
    stage: string
    website?: string
    founded_year?: number
  }
  stage: 'sourcing' | 'screening' | 'due_diligence' | 'term_sheet' | 'invested' | 'passed'
  priority: 'high' | 'medium' | 'low'
  target_investment?: number
  target_valuation?: number
  deal_score?: number
  partner_owner?: string
  next_milestone?: string
  created_at: string
  updated_at: string
  ai_summary?: string
  tags: string[]
}

const PIPELINE_STAGES = [
  { id: 'sourcing', name: 'Sourcing', color: 'bg-gray-100 border-gray-300', count: 0 },
  { id: 'screening', name: 'Screening', color: 'bg-blue-100 border-blue-300', count: 0 },
  { id: 'due_diligence', name: 'Due Diligence', color: 'bg-yellow-100 border-yellow-300', count: 0 },
  { id: 'term_sheet', name: 'Term Sheet', color: 'bg-orange-100 border-orange-300', count: 0 },
  { id: 'invested', name: 'Invested', color: 'bg-green-100 border-green-300', count: 0 },
  { id: 'passed', name: 'Passed', color: 'bg-red-100 border-red-300', count: 0 }
]

// Mock data for development
const MOCK_DEALS: Deal[] = [
  {
    id: '1',
    company: {
      name: 'Quantum AI',
      sector: 'AI/ML',
      stage: 'Series A',
      founded_year: 2022
    },
    stage: 'due_diligence',
    priority: 'high',
    target_investment: 2000000,
    target_valuation: 20000000,
    deal_score: 8,
    partner_owner: 'Sarah Chen',
    next_milestone: 'Tech review call',
    created_at: '2025-01-15',
    updated_at: '2025-01-20',
    ai_summary: 'Strong technical team with proprietary ML algorithms. Revenue growing 20% MoM.',
    tags: ['AI', 'B2B', 'Hot deal']
  },
  {
    id: '2',
    company: {
      name: 'GreenTech Solutions',
      sector: 'CleanTech',
      stage: 'Seed',
      founded_year: 2023
    },
    stage: 'screening',
    priority: 'medium',
    target_investment: 500000,
    target_valuation: 5000000,
    deal_score: 6,
    partner_owner: 'Mike Johnson',
    next_milestone: 'Financial review',
    created_at: '2025-01-10',
    updated_at: '2025-01-18',
    ai_summary: 'Innovative solar panel technology. Early revenue traction in European markets.',
    tags: ['CleanTech', 'Hardware']
  },
  {
    id: '3',
    company: {
      name: 'FinTech Pro',
      sector: 'FinTech',
      stage: 'Series B',
      founded_year: 2021
    },
    stage: 'term_sheet',
    priority: 'high',
    target_investment: 10000000,
    target_valuation: 80000000,
    deal_score: 9,
    partner_owner: 'Sarah Chen',
    next_milestone: 'Board approval',
    created_at: '2025-01-05',
    updated_at: '2025-01-22',
    ai_summary: 'Market-leading B2B payments platform. Strong unit economics and expansion plans.',
    tags: ['FinTech', 'B2B', 'Growth']
  },
  {
    id: '4',
    company: {
      name: 'HealthTech Analytics',
      sector: 'HealthTech',
      stage: 'Series A',
      founded_year: 2022
    },
    stage: 'sourcing',
    priority: 'low',
    target_investment: 3000000,
    target_valuation: 25000000,
    deal_score: 5,
    partner_owner: 'Alex Rodriguez',
    next_milestone: 'Initial call',
    created_at: '2025-01-22',
    updated_at: '2025-01-22',
    ai_summary: 'Healthcare data analytics platform. Good team but competitive market.',
    tags: ['HealthTech', 'Analytics']
  }
]

export default function DealflowPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)

  // Load companies and convert to deals format
  useEffect(() => {
    const loadDeals = async () => {
      try {
        const companies = await getAllCompanies()
        const dealsFromCompanies: Deal[] = companies.map((company) => {
          // Check for localStorage deal status override
          const savedStatus = getDealStatusForCompany(company.id) || getDealStatusForCompany(company.name)
          const effectiveStatus = savedStatus || company.deal_status
          
          return {
            id: company.id,
            company: {
              name: company.name,
              logo: company.logo,
              sector: company.sector,
              stage: company.stage,
              website: company.website,
              founded_year: company.founded_year
            },
            stage: effectiveStatus,
            priority: company.priority,
            target_investment: company.investment.investment_amount,
            target_valuation: company.investment.valuation,
            deal_score: Math.floor(Math.random() * 4) + 6, // Random score 6-9
            partner_owner: company.investment.lead_partner,
            next_milestone: getNextMilestone(effectiveStatus),
            created_at: company.created_at.split('T')[0],
            updated_at: company.updated_at.split('T')[0],
            ai_summary: `${company.name} in ${company.sector}. ${company.description.substring(0, 100)}...`,
            tags: [company.sector, company.stage, company.priority === 'high' ? 'Hot deal' : 'Standard']
          }
        })
        
        setDeals(dealsFromCompanies)
      } catch (error) {
        console.error('Error loading deals:', error)
      }
    }

    initializeDealStatuses()
    loadDeals()
    
    // Subscribe to deal status changes for real-time updates
    const unsubscribe = subscribeToDealStatusChanges((update) => {
      console.log('Deal status changed:', update)
      // Reload deals to reflect the change
      loadDeals()
    })
    
    return unsubscribe
  }, [])

  const getNextMilestone = (status: string): string => {
    switch (status) {
      case 'sourcing': return 'Initial screening call'
      case 'screening': return 'Due diligence review'
      case 'due_diligence': return 'Investment committee'
      case 'term_sheet': return 'Legal documentation'
      case 'invested': return 'Board meeting'
      case 'passed': return 'Follow-up in 6 months'
      default: return 'Next steps TBD'
    }
  }

  // Calculate stage counts
  const stageCounts = PIPELINE_STAGES.map(stage => ({
    ...stage,
    count: deals.filter(deal => deal.stage === stage.id).length
  }))

  // Filter deals based on search and filters
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.company.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesFilter = selectedFilter === 'all' || 
                         deal.priority === selectedFilter ||
                         deal.partner_owner?.toLowerCase().includes(selectedFilter.toLowerCase())
    
    return matchesSearch && matchesFilter
  })

  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()
    if (draggedDeal && draggedDeal.stage !== targetStage) {
      // Update local state
      const updatedDeals = deals.map(deal => 
        deal.id === draggedDeal.id 
          ? { ...deal, stage: targetStage as Deal['stage'], updated_at: new Date().toISOString() }
          : deal
      )
      setDeals(updatedDeals)
      
      // Sync status change across the app
      updateDealStatus(
        draggedDeal.id, 
        draggedDeal.company.name, 
        targetStage as any
      )
    }
    setDraggedDeal(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📋 Deal Pipeline
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your deal flow from sourcing to investment
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Deal
              </Button>
              <ChatHistoryButton 
                projectType="deal"
                projectName="Deal Pipeline"
                projectId="deal-pipeline-overview"
              />
              <ChatWithAIButton 
                projectType="deal"
                projectName="Deal Pipeline"
                projectId="deal-pipeline-overview"
              />
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search deals, companies, or sectors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">All Deals</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 overflow-x-auto min-h-[600px]">
          {stageCounts.map((stage) => (
            <div
              key={stage.id}
              className="min-h-[600px] flex flex-col min-w-[280px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column Header */}
              <div className={`p-4 rounded-lg border-2 border-dashed ${stage.color} mb-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">{stage.name}</h3>
                  <Badge variant="outline" className="bg-white">
                    {stage.count}
                  </Badge>
                </div>
              </div>

              {/* Deal Cards */}
              <div className="space-y-4 flex-1">
                {filteredDeals
                  .filter(deal => deal.stage === stage.id)
                  .map((deal) => (
                    <SimplifiedDealCard
                      key={deal.id}
                      deal={deal}
                      onDragStart={handleDragStart}
                      onViewDetails={() => {
                        // Navigate to company deal page using the actual company ID
                        window.location.href = `/portfolio/${deal.id}/deal`
                      }}
                      onStartChat={() => {
                        // Will be handled by ChatWithAIButton in the card
                      }}
                    />
                  ))}

                {/* Add Deal Button for each stage */}
                <Button 
                  variant="ghost" 
                  className="w-full py-8 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-500 hover:text-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Deal
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}