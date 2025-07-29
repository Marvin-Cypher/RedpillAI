'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Play, 
  Eye,
  MessageSquare,
  Download,
  MoreHorizontal,
  Calendar,
  DollarSign
} from 'lucide-react'

interface WorkflowCardProps {
  workflow: {
    id: string
    workflow_id: string
    workflow_type: string
    company_name: string
    status: string
    progress_percentage: number
    created_at: string
    completed_at?: string
    investment_amount?: number
    valuation?: number
  }
  onView?: (workflowId: string) => void
  onRerun?: (workflowId: string) => void
  className?: string
}

export function WorkflowCard({ workflow, onView, onRerun, className }: WorkflowCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'running':
        return <Play className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getDuration = () => {
    if (!workflow.completed_at) return null
    const start = new Date(workflow.created_at)
    const end = new Date(workflow.completed_at)
    const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
    return `${diffMinutes}m`
  }

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {workflow.company_name.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {workflow.company_name}
              </CardTitle>
              <p className="text-sm text-gray-600 capitalize">
                {workflow.workflow_type.replace('_', ' ')} workflow
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(workflow.status)}>
              {getStatusIcon(workflow.status)}
              <span className="ml-1 capitalize">{workflow.status}</span>
            </Badge>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{workflow.progress_percentage}%</span>
          </div>
          <Progress value={workflow.progress_percentage} className="h-2" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 py-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm font-medium">{formatDate(workflow.created_at)}</p>
            </div>
          </div>
          {workflow.investment_amount && (
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Investment</p>
                <p className="text-sm font-medium">{formatCurrency(workflow.investment_amount)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Workflow ID:</span>
                <p className="font-mono text-xs mt-1">{workflow.workflow_id}</p>
              </div>
              {workflow.valuation && (
                <div>
                  <span className="text-gray-500">Valuation:</span>
                  <p className="font-medium mt-1">{formatCurrency(workflow.valuation)}</p>
                </div>
              )}
            </div>
            
            {workflow.completed_at && (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">Completed: {formatDate(workflow.completed_at)}</span>
                </div>
                {getDuration() && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Duration: {getDuration()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-600 hover:text-gray-900"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </Button>
          
          <div className="flex items-center space-x-2">
            {workflow.status === 'completed' && (
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            )}
            
            {onView && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Navigate to company page with AI sidebar
                  window.location.href = `/portfolio/${workflow.company_name.toLowerCase().replace(/\s+/g, '-')}`
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                View Company
              </Button>
            )}
            
            {onRerun && (
              <Button 
                size="sm"
                onClick={() => {
                  // Open AI chat sidebar instead of rerun
                  if (typeof window !== 'undefined' && window.parent) {
                    window.parent.postMessage({ type: 'OPEN_AI_CHAT', company: workflow.company_name }, '*')
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Play className="w-4 h-4 mr-1" />
                AI Chat
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}