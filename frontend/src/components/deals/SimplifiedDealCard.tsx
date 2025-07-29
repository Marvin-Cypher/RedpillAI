'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye } from 'lucide-react'
import { ChatWithAIButton } from '@/components/ai'

interface Deal {
  id: string
  company: {
    name: string
    sector: string
    stage: string
  }
  priority: 'high' | 'medium' | 'low'
  target_investment?: number
  target_valuation?: number
  tags: string[]
}

interface SimplifiedDealCardProps {
  deal: Deal
  onDragStart: (deal: Deal) => void
  onViewDetails: (dealId: string) => void
  onStartChat: (dealId: string) => void
}

export function SimplifiedDealCard({ deal, onDragStart, onViewDetails, onStartChat }: SimplifiedDealCardProps) {
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
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card
      className="cursor-move hover:shadow-md transition-all duration-200 bg-white border border-gray-200"
      draggable
      onDragStart={() => onDragStart(deal)}
    >
      <CardContent className="p-3">
        {/* Deal Name */}
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {deal.company.name}
          </h4>
          <Badge className={`${getPriorityColor(deal.priority)} text-xs`} variant="outline">
            {deal.priority}
          </Badge>
        </div>

        {/* Key Financials */}
        <div className="space-y-1 text-xs mb-2">
          {deal.target_valuation && (
            <div className="flex justify-between">
              <span className="text-gray-500">Valuation:</span>
              <span className="font-medium">{formatCurrency(deal.target_valuation)}</span>
            </div>
          )}
          {deal.target_investment && (
            <div className="flex justify-between">
              <span className="text-gray-500">Investment:</span>
              <span className="font-medium">{formatCurrency(deal.target_investment)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {deal.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {deal.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs px-1 py-0 bg-blue-50 text-blue-700">
                {tag}
              </Badge>
            ))}
            {deal.tags.length > 2 && (
              <Badge variant="outline" className="text-xs px-1 py-0 bg-gray-50 text-gray-600">
                +{deal.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-1 pt-2 border-t border-gray-100">
          <ChatWithAIButton 
            projectType="deal"
            projectName={deal.company.name}
            projectId={deal.id}
            className="flex-1 text-xs py-1 h-6 min-w-0"
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs py-1 h-6 min-w-0"
            onClick={() => onViewDetails(deal.id)}
          >
            <Eye className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}