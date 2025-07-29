'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, ExternalLink } from 'lucide-react'

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

interface CompactDealCardProps {
  deal: Deal
  onDragStart: (deal: Deal) => void
  onViewDetails: (dealId: string) => void
  onStartChat: (dealId: string) => void
}

export function CompactDealCard({ deal, onDragStart, onViewDetails, onStartChat }: CompactDealCardProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(0)}M`
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`
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
    <Card
      className="cursor-move hover:shadow-md transition-all duration-200 bg-white border border-gray-200"
      draggable
      onDragStart={() => onDragStart(deal)}
    >
      <CardContent className="p-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded text-white font-bold text-xs flex items-center justify-center shrink-0">
              {deal.company.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold text-gray-900 truncate">
                {deal.company.name}
              </h4>
              <p className="text-xs text-gray-500">
                {deal.company.stage}
              </p>
            </div>
          </div>
          <Badge className={`${getPriorityColor(deal.priority)} text-xs px-1 py-0 shrink-0`} variant="outline">
            {deal.priority.charAt(0).toUpperCase()}
          </Badge>
        </div>

        {/* Key Info Only */}
        <div className="space-y-1 text-xs mb-2">
          {deal.target_investment && (
            <div className="flex justify-between">
              <span className="text-gray-500">Target:</span>
              <span className="font-medium">{formatCurrency(deal.target_investment)}</span>
            </div>
          )}
          {deal.deal_score && (
            <div className="flex justify-between">
              <span className="text-gray-500">Score:</span>
              <span className={`font-medium ${getScoreColor(deal.deal_score)}`}>
                {deal.deal_score}/10
              </span>
            </div>
          )}
        </div>

        {/* Compact Actions */}
        <div className="flex space-x-1 pt-2 border-t border-gray-100">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs py-1 h-6"
            onClick={() => onViewDetails(deal.id)}
          >
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs py-1 h-6 px-1"
            onClick={() => onStartChat(deal.id)}
          >
            <MessageSquare className="w-3 h-3" />
          </Button>
          {deal.company.website && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs py-1 h-6 px-1"
              onClick={() => window.open(deal.company.website, '_blank')}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}