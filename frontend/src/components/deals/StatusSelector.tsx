'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ChevronDown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { updateDealStatus } from '@/lib/dealStatusSync'

interface StatusSelectorProps {
  currentStatus: string
  dealId: string
  companyName: string
  compact?: boolean
  onStatusChange?: (dealId: string, newStatus: string) => void
}

const statusOptions = [
  { value: 'planned', label: '📋 PLANNED', color: 'status-planned' },
  { value: 'meeting', label: '🤝 MEETING', color: 'status-meeting' },
  { value: 'research', label: '📊 RESEARCH', color: 'status-research' },
  { value: 'deal', label: '💼 DEAL', color: 'status-deal' },
  { value: 'track', label: '📈 TRACK', color: 'status-track' },
  { value: 'passed', label: '❌ PASSED', color: 'status-passed' },
]

export function StatusSelector({ currentStatus, dealId, companyName, compact = false, onStatusChange }: StatusSelectorProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const currentStatusOption = statusOptions.find(option => option.value === status)

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return

    setIsUpdating(true)
    
    try {
      // Update status using the dealStatusSync utility
      updateDealStatus(dealId, companyName, newStatus as 'planned' | 'meeting' | 'research' | 'deal' | 'track' | 'passed' | 'closed')
      
      const oldStatus = status
      setStatus(newStatus)
      
      // Call parent callback to update the deal in the pipeline
      onStatusChange?.(dealId, newStatus)
      
      // Show success notification
      toast.success(`Deal moved from ${oldStatus.toUpperCase()} to ${newStatus.toUpperCase()}`)
      
      // Mock AI response based on status
      setTimeout(() => {
        const aiMessages = {
          meeting: '🤖 Status updated! I\'ve prepared meeting questions and founder research.',
          research: '🤖 Entering research mode! Starting comprehensive analysis.',
          deal: '🤖 Deal stage activated! Ready to help with term sheet analysis.',
          track: '🤖 Now tracking as portfolio company! Setting up performance monitoring.',
          passed: '🤖 Marked as passed. Research archived for future reference.'
        }
        
        const message = aiMessages[newStatus as keyof typeof aiMessages]
        if (message) {
          toast(message, { duration: 6000 })
        }
      }, 1000)
      
    } catch (error) {
      toast.error('Failed to update status')
      console.error('Status update error:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isUpdating}
            className={`${currentStatusOption?.color} border-0 hover:opacity-80 text-xs`}
          >
            {currentStatusOption?.value.toUpperCase()}
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40 bg-dark-800 border-dark-600">
          {statusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className="text-white hover:bg-dark-700 text-xs"
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isUpdating}
          className={`${currentStatusOption?.color} hover:opacity-80`}
        >
          {currentStatusOption?.label}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-dark-800 border-dark-600">
        <div className="p-2 border-b border-dark-600">
          <p className="text-xs font-medium text-gray-400">Change Status</p>
        </div>
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className="text-white hover:bg-dark-700"
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}