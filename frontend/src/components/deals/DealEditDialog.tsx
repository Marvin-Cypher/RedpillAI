"use client"

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, DollarSign, TrendingUp, Target, Percent, FileText, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DealEditDialogProps {
  isOpen: boolean
  onClose: () => void
  deal?: any
  company?: any
  onSave: (dealData: any) => Promise<void>
  mode: 'create' | 'edit'
}

export function DealEditDialog({ 
  isOpen, 
  onClose, 
  deal, 
  company,
  onSave,
  mode = 'create'
}: DealEditDialogProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  
  // Form state with all deal fields
  const [formData, setFormData] = useState({
    // Basic Info
    status: deal?.status || 'planned',
    stage: deal?.stage || 'pre_seed',
    probability: deal?.probability || 50,
    
    // Financial Details
    valuation: deal?.valuation || '',
    round_size: deal?.round_size || '',
    our_investment: deal?.our_investment || '',
    our_target: deal?.our_target || '',
    
    // Dates & Milestones
    next_milestone: deal?.next_milestone || '',
    next_meeting_date: deal?.next_meeting_date ? new Date(deal.next_meeting_date) : null,
    
    // Notes
    internal_notes: deal?.internal_notes || '',
    
    // Additional fields
    lead_partner: deal?.lead_partner || '',
    co_investors: deal?.co_investors || '',
    board_seat: deal?.board_seat || false,
    pro_rata_rights: deal?.pro_rata_rights || true,
    liquidation_preference: deal?.liquidation_preference || '1x',
    anti_dilution: deal?.anti_dilution || 'weighted_average',
  })

  // Reset form when deal changes
  useEffect(() => {
    if (deal) {
      setFormData({
        status: deal.status || 'planned',
        stage: deal.stage || 'pre_seed',
        probability: deal.probability || 50,
        valuation: deal.valuation || '',
        round_size: deal.round_size || '',
        our_investment: deal.our_investment || '',
        our_target: deal.our_target || '',
        next_milestone: deal.next_milestone || '',
        next_meeting_date: deal.next_meeting_date ? new Date(deal.next_meeting_date) : null,
        internal_notes: deal.internal_notes || '',
        lead_partner: deal.lead_partner || '',
        co_investors: deal.co_investors || '',
        board_seat: deal.board_seat || false,
        pro_rata_rights: deal.pro_rata_rights || true,
        liquidation_preference: deal.liquidation_preference || '1x',
        anti_dilution: deal.anti_dilution || 'weighted_average',
      })
    }
  }, [deal])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Prepare data for API
      const dealData = {
        ...formData,
        valuation: formData.valuation ? parseFloat(formData.valuation.toString().replace(/,/g, '')) : null,
        round_size: formData.round_size ? parseFloat(formData.round_size.toString().replace(/,/g, '')) : null,
        our_investment: formData.our_investment ? parseFloat(formData.our_investment.toString().replace(/,/g, '')) : null,
        our_target: formData.our_target ? parseFloat(formData.our_target.toString().replace(/,/g, '')) : null,
        next_meeting_date: formData.next_meeting_date ? formData.next_meeting_date.toISOString() : null,
      }
      
      if (mode === 'create' && company) {
        dealData.company_id = company.id
      }
      
      await onSave(dealData)
      onClose()
    } catch (error) {
      console.error('Error saving deal:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters
    const numeric = value.replace(/[^0-9]/g, '')
    // Format with commas
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const calculateOwnership = () => {
    if (formData.our_investment && formData.valuation) {
      const investment = parseFloat(formData.our_investment.toString().replace(/,/g, ''))
      const valuation = parseFloat(formData.valuation.toString().replace(/,/g, ''))
      if (investment > 0 && valuation > 0) {
        return ((investment / valuation) * 100).toFixed(2)
      }
    }
    return '0'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {mode === 'create' ? 'Create New Deal' : 'Edit Deal'} 
            {company && ` - ${company.name}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Enter the deal details to start tracking this investment opportunity.'
              : 'Update the deal information and investment terms.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="financial">Financials</TabsTrigger>
            <TabsTrigger value="terms">Deal Terms</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Deal Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="deal">Deal</SelectItem>
                    <SelectItem value="track">Track</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stage">Investment Stage</Label>
                <Select value={formData.stage} onValueChange={(value) => setFormData({...formData, stage: value})}>
                  <SelectTrigger id="stage">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_seed">Pre-Seed</SelectItem>
                    <SelectItem value="seed">Seed</SelectItem>
                    <SelectItem value="series_a">Series A</SelectItem>
                    <SelectItem value="series_b">Series B</SelectItem>
                    <SelectItem value="series_c">Series C</SelectItem>
                    <SelectItem value="series_d_plus">Series D+</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="pre_ipo">Pre-IPO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">Deal Probability (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="probability"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.probability}
                  onChange={(e) => setFormData({...formData, probability: parseInt(e.target.value)})}
                  className="flex-1"
                />
                <span className="w-12 text-right font-medium">{formData.probability}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Likelihood of closing this deal successfully
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_partner">Lead Partner</Label>
              <Input
                id="lead_partner"
                value={formData.lead_partner}
                onChange={(e) => setFormData({...formData, lead_partner: e.target.value})}
                placeholder="Enter lead partner name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_milestone">Next Milestone</Label>
              <Input
                id="next_milestone"
                value={formData.next_milestone}
                onChange={(e) => setFormData({...formData, next_milestone: e.target.value})}
                placeholder="e.g., Due diligence review, Investment committee"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_meeting_date">Next Meeting Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.next_meeting_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.next_meeting_date ? format(formData.next_meeting_date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.next_meeting_date}
                    onSelect={(date) => setFormData({...formData, next_meeting_date: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valuation">Pre-Money Valuation ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="valuation"
                    value={formData.valuation}
                    onChange={(e) => setFormData({...formData, valuation: formatCurrency(e.target.value)})}
                    placeholder="10,000,000"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Company valuation before investment
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="round_size">Total Round Size ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="round_size"
                    value={formData.round_size}
                    onChange={(e) => setFormData({...formData, round_size: formatCurrency(e.target.value)})}
                    placeholder="5,000,000"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Total amount being raised in this round
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="our_investment">Our Investment ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="our_investment"
                    value={formData.our_investment}
                    onChange={(e) => setFormData({...formData, our_investment: formatCurrency(e.target.value)})}
                    placeholder="1,000,000"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Amount we plan to invest
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="our_target">Target Allocation ($)</Label>
                <div className="relative">
                  <Target className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="our_target"
                    value={formData.our_target}
                    onChange={(e) => setFormData({...formData, our_target: formatCurrency(e.target.value)})}
                    placeholder="1,500,000"
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ideal investment amount if possible
                </p>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Ownership %</p>
                  <p className="text-xl font-semibold">{calculateOwnership()}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Post-Money Valuation</p>
                  <p className="text-xl font-semibold">
                    ${formData.valuation && formData.round_size 
                      ? formatCurrency((parseFloat(formData.valuation.toString().replace(/,/g, '')) + parseFloat(formData.round_size.toString().replace(/,/g, ''))).toString())
                      : '0'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Round Participation</p>
                  <p className="text-xl font-semibold">
                    {formData.our_investment && formData.round_size 
                      ? ((parseFloat(formData.our_investment.toString().replace(/,/g, '')) / parseFloat(formData.round_size.toString().replace(/,/g, ''))) * 100).toFixed(1)
                      : '0'}%
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="co_investors">Co-Investors</Label>
              <Input
                id="co_investors"
                value={formData.co_investors}
                onChange={(e) => setFormData({...formData, co_investors: e.target.value})}
                placeholder="e.g., Sequoia Capital, Andreessen Horowitz"
              />
              <p className="text-xs text-muted-foreground">
                Other investors participating in this round
              </p>
            </div>
          </TabsContent>

          <TabsContent value="terms" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="liquidation_preference">Liquidation Preference</Label>
                <Select value={formData.liquidation_preference} onValueChange={(value) => setFormData({...formData, liquidation_preference: value})}>
                  <SelectTrigger id="liquidation_preference">
                    <SelectValue placeholder="Select preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1x">1x Non-Participating</SelectItem>
                    <SelectItem value="1x_participating">1x Participating</SelectItem>
                    <SelectItem value="2x">2x Non-Participating</SelectItem>
                    <SelectItem value="2x_participating">2x Participating</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="anti_dilution">Anti-Dilution Protection</Label>
                <Select value={formData.anti_dilution} onValueChange={(value) => setFormData({...formData, anti_dilution: value})}>
                  <SelectTrigger id="anti_dilution">
                    <SelectValue placeholder="Select protection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weighted_average">Weighted Average</SelectItem>
                    <SelectItem value="full_ratchet">Full Ratchet</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="board_seat"
                  checked={formData.board_seat}
                  onChange={(e) => setFormData({...formData, board_seat: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="board_seat" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Board Seat
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pro_rata_rights"
                  checked={formData.pro_rata_rights}
                  onChange={(e) => setFormData({...formData, pro_rata_rights: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="pro_rata_rights" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Pro-Rata Rights
                </Label>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Deal Terms Summary</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Liquidation Preference: {formData.liquidation_preference.replace('_', ' ')}</li>
                <li>• Anti-Dilution: {formData.anti_dilution.replace('_', ' ')}</li>
                <li>• Board Seat: {formData.board_seat ? 'Yes' : 'No'}</li>
                <li>• Pro-Rata Rights: {formData.pro_rata_rights ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="internal_notes">Internal Notes</Label>
              <Textarea
                id="internal_notes"
                value={formData.internal_notes}
                onChange={(e) => setFormData({...formData, internal_notes: e.target.value})}
                placeholder="Enter any internal notes, due diligence findings, concerns, or other relevant information..."
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                These notes are internal and will not be shared externally
              </p>
            </div>

            {deal && (
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{deal.created_at ? new Date(deal.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{deal.updated_at ? new Date(deal.updated_at).toLocaleDateString() : 'N/A'}</span>
                </div>
                {deal.created_by && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created By:</span>
                    <span>{deal.created_by}</span>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : mode === 'create' ? 'Create Deal' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}