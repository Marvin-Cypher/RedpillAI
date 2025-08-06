"use client"

import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Filter, 
  User,
  Clock,
  MessageSquare,
  Eye,
  Briefcase,
  Building2
} from 'lucide-react'

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
  { id: 'sourcing', name: 'Sourcing', color: 'bg-gray-100 border-gray-300 text-gray-700', count: 0 },
  { id: 'screening', name: 'Screening', color: 'bg-blue-100 border-blue-300 text-blue-700', count: 0 },
  { id: 'due_diligence', name: 'Due Diligence', color: 'bg-yellow-100 border-yellow-300 text-yellow-700', count: 0 },
  { id: 'term_sheet', name: 'Term Sheet', color: 'bg-orange-100 border-orange-300 text-orange-700', count: 0 },
  { id: 'invested', name: 'Invested', color: 'bg-green-100 border-green-300 text-green-700', count: 0 },
  { id: 'passed', name: 'Passed', color: 'bg-red-100 border-red-300 text-red-700', count: 0 }
]

export default function DealflowPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAddDealDialogOpen, setIsAddDealDialogOpen] = useState(false)
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [newCompanyForm, setNewCompanyForm] = useState({ name: '', domain: '' })
  const [createNewCompany, setCreateNewCompany] = useState(false)

  // Load companies and convert to deals format
  useEffect(() => {
    const loadDeals = async () => {
      try {
        // Load companies from backend API only to avoid UUID/name mismatches
        const apiResponse = await fetch('/api/companies').then(res => res.ok ? res.json() : [])
        
        const apiCompanies = Array.isArray(apiResponse) ? apiResponse : apiResponse.companies || []
        
        // Use API companies for both dropdown and display (single source of truth)
        setAvailableCompanies(apiCompanies)
        console.log('✅ Using backend companies as single source of truth:', apiCompanies)
        
        // Transform API companies to deals format with demo deal statuses
        const dealsFromCompanies: Deal[] = apiCompanies.map((company, index) => {
          // Generate realistic demo deal status for each company
          const demoStatuses = ['sourcing', 'screening', 'due_diligence', 'term_sheet', 'invested', 'passed']
          const demoPriorities = ['high', 'medium', 'low']
          const demoStatus = demoStatuses[index % demoStatuses.length] as Deal['stage']
          const demoPriority = demoPriorities[index % demoPriorities.length] as Deal['priority']
          return {
            id: company.id,
            company: {
              name: company.name,
              logo: company.logo_url,
              sector: company.sector,
              stage: company.company_type,
              website: company.website,
              founded_year: company.founded_year
            },
            stage: demoStatus,
            priority: demoPriority,
            target_investment: Math.floor(Math.random() * 50000000) + 5000000, // $5M-$55M random
            target_valuation: Math.floor(Math.random() * 1000000000) + 100000000, // $100M-$1.1B random
            deal_score: Math.floor(Math.random() * 4) + 6, // Random score 6-9
            partner_owner: 'RedPill Partner',
            next_milestone: getNextMilestone(demoStatus),
            created_at: company.created_at.split('T')[0],
            updated_at: company.updated_at.split('T')[0],
            ai_summary: `${company.name} in ${company.sector}. ${company.description?.substring(0, 100) || 'No description available'}...`,
            tags: [company.sector, company.company_type, demoPriority === 'high' ? 'Hot deal' : 'Standard']
          }
        })
        
        setDeals(dealsFromCompanies)
      } catch (error) {
        // console.error('Error loading deals:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDeals()
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
      
      // TODO: Sync status change to backend API
      // console.log(`Updated deal ${draggedDeal.id} from ${draggedDeal.stage} to ${targetStage}`)
    }
    setDraggedDeal(null)
  }

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

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-600'
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
              <Briefcase className="w-8 h-8 mr-3 text-primary" />
              Deal Pipeline
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your deal flow from sourcing to investment
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsAddDealDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Deal
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
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
            className="px-3 py-2 border border-border rounded-lg text-sm bg-background"
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

      {/* Main Content - Kanban Board */}
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
                <h3 className="font-semibold">{stage.name}</h3>
                <Badge variant="outline" className="bg-background">
                  {stage.count}
                </Badge>
              </div>
            </div>

            {/* Deal Cards */}
            <div className="space-y-4 flex-1">
              {filteredDeals
                .filter(deal => deal.stage === stage.id)
                .map((deal) => (
                  <Card
                    key={deal.id}
                    className="cursor-move hover:shadow-md transition-all duration-200 bg-card border h-fit"
                    draggable
                    onDragStart={() => handleDragStart(deal)}
                  >
                    <CardContent className="p-4">
                      {/* Deal Name & Priority */}
                      <div className="flex items-center justify-between mb-3 gap-2">
                        <h4 className="text-sm font-semibold text-card-foreground truncate min-w-0 flex-1">
                          {deal.company.name}
                        </h4>
                        <Badge className={`${getPriorityColor(deal.priority)} text-xs flex-shrink-0`} variant="outline">
                          {deal.priority}
                        </Badge>
                      </div>

                      {/* Sector & Stage */}
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {deal.company.sector}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {deal.company.stage}
                        </Badge>
                      </div>

                      {/* Key Financials */}
                      <div className="space-y-2 text-xs mb-3">
                        {deal.target_valuation && (
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-muted-foreground flex-shrink-0">Valuation:</span>
                            <span className="font-medium text-right truncate min-w-0">{formatCurrency(deal.target_valuation)}</span>
                          </div>
                        )}
                        {deal.target_investment && (
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-muted-foreground flex-shrink-0">Investment:</span>
                            <span className="font-medium text-right truncate min-w-0">{formatCurrency(deal.target_investment)}</span>
                          </div>
                        )}
                        {deal.deal_score && (
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-muted-foreground flex-shrink-0">Score:</span>
                            <span className={`font-medium ${getScoreColor(deal.deal_score)}`}>{deal.deal_score}/10</span>
                          </div>
                        )}
                      </div>

                      {/* Partner & Milestone */}
                      {deal.partner_owner && (
                        <div className="text-xs text-muted-foreground mb-2">
                          <User className="w-3 h-3 inline mr-1" />
                          {deal.partner_owner}
                        </div>
                      )}
                      
                      {deal.next_milestone && (
                        <div className="text-xs text-muted-foreground mb-3">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {deal.next_milestone}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-border">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs"
                          onClick={() => window.location.href = `/portfolio/${deal.id}/deal`}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          AI Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              {/* Add Deal Button for each stage */}
              <Button 
                variant="ghost" 
                className="w-full py-8 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted text-muted-foreground hover:text-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Deal
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {deals.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Deals</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {deals.filter(d => d.stage === 'invested').length}
              </div>
              <div className="text-sm text-muted-foreground">Invested</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {deals.filter(d => ['due_diligence', 'term_sheet'].includes(d.stage)).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Deals</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(deals.reduce((sum, deal) => sum + (deal.target_investment || 0), 0))}
              </div>
              <div className="text-sm text-muted-foreground">Total Pipeline</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Add Deal Dialog */}
      <Dialog open={isAddDealDialogOpen} onOpenChange={setIsAddDealDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
            <DialogDescription>
              Start tracking a deal by selecting an existing company or creating a new one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Choose Option</Label>
              <div className="flex gap-2">
                <Button 
                  variant={!createNewCompany ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCreateNewCompany(false)}
                >
                  Select Existing
                </Button>
                <Button 
                  variant={createNewCompany ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCreateNewCompany(true)}
                >
                  Create New
                </Button>
              </div>
            </div>
            
            {!createNewCompany ? (
              <div className="grid gap-2">
                <Label htmlFor="company">Select Company</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCompanies.length > 0 ? (
                      availableCompanies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name} - {company.sector}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No companies available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {availableCompanies.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    All companies already have active deals. Create a new company instead.
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={newCompanyForm.name}
                    onChange={(e) => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
                    placeholder="Enter company name..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="domain">Company Domain</Label>
                  <Input
                    id="domain"
                    value={newCompanyForm.domain}
                    onChange={(e) => setNewCompanyForm({ ...newCompanyForm, domain: e.target.value })}
                    placeholder="example.com"
                  />
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDealDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (createNewCompany) {
                  // Create new company with deal
                  try {
                    // First create the company
                    const companyResponse = await fetch('/api/companies', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...newCompanyForm,
                        enrich_with_ai: true
                      })
                    })
                    
                    if (companyResponse.ok) {
                      const newCompany = await companyResponse.json()
                      console.log('Company created:', newCompany)
                      
                      // Now create a deal for the new company
                      const dealData = {
                        company_id: newCompany.id,
                        stage: 'pre_seed',
                        status: 'planned',
                        valuation: null,
                        round_size: null,
                        our_investment: null,
                        our_target: null,
                        probability: 50,
                        next_milestone: 'Initial screening',
                        internal_notes: `Deal started for ${newCompany.name || newCompanyForm.name}`
                      }
                      
                      const dealResponse = await fetch('/api/deals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dealData)
                      })
                      
                      if (dealResponse.ok) {
                        const newDeal = await dealResponse.json()
                        console.log('Deal created:', newDeal)
                        setIsAddDealDialogOpen(false)
                        setNewCompanyForm({ name: '', domain: '' })
                        window.location.reload()
                      } else {
                        const dealError = await dealResponse.json().catch(() => ({ message: 'Failed to create deal' }))
                        alert(`Company created but failed to start deal: ${dealError.message || dealError.detail}`)
                      }
                    } else {
                      const companyError = await companyResponse.json().catch(() => ({ message: 'Failed to create company' }))
                      alert(`Failed to create company: ${companyError.message || companyError.detail}`)
                    }
                  } catch (error) {
                    console.error('Error creating company:', error)
                    alert('Error creating company. Please try again.')
                  }
                } else if (selectedCompanyId) {
                  // Start deal for existing company
                  try {
                    const company = availableCompanies.find(c => c.id === selectedCompanyId)
                    if (!company) return
                    
                    console.log('🏢 Selected company:', company)
                    
                    // Create a new deal for this company
                    const dealData = {
                      company_id: selectedCompanyId,
                      stage: 'pre_seed', // Required field - investment stage
                      status: 'planned', // Deal status (defaults to 'planned')
                      valuation: null,
                      round_size: null,
                      our_investment: null,
                      our_target: null,
                      probability: 50,
                      next_milestone: 'Initial screening',
                      internal_notes: `Deal started for ${company.name}`
                    }
                    
                    console.log('💼 Creating deal with data:', dealData)
                    
                    const response = await fetch('/api/deals', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(dealData)
                    })
                    
                    if (response.ok) {
                      const result = await response.json()
                      console.log('Deal created successfully:', result)
                      setIsAddDealDialogOpen(false)
                      setSelectedCompanyId('')
                      // Reload deals
                      window.location.reload()
                    } else {
                      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
                      console.error('Failed to create deal:', response.status, errorData)
                      alert(`Failed to start deal: ${errorData.message || errorData.detail || response.statusText}. Please try again.`)
                    }
                  } catch (error) {
                    console.error('Error starting deal:', error)
                    alert('Error starting deal. Please try again.')
                  }
                }
              }}
              disabled={!createNewCompany ? !selectedCompanyId : !newCompanyForm.name || !newCompanyForm.domain}
            >
              {createNewCompany ? 'Create Company & Start Deal' : 'Start Deal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}