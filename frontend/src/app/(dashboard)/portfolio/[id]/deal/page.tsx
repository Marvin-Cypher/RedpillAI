"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft,
  Building2,
  Calendar,
  TrendingUp,
  Users,
  Globe,
  MapPin,
  Star,
  MessageSquare,
  FileText,
  BarChart3,
  ExternalLink,
  Edit,
  Plus,
  Brain,
  User
} from 'lucide-react'
// Remove mock database import - use backend API instead
interface Company {
  id: string
  name: string
  description: string
  website?: string
  company_type: string
  sector: string
  founded_year?: number
  employee_count?: string
  headquarters?: string | { city?: string; country?: string }
  logo_url?: string
  twitter_handle?: string
  github_repo?: string
  token_symbol?: string
  deal_status?: string
  created_at?: string
  updated_at?: string
  investment?: {
    investment_date?: string
    lead_partner?: string
  }
  metrics?: {
    revenue_growth?: string
  }
}
import { AIMemoButton, ChatWithAIButton } from '@/components/ai'
import { Textarea } from '@/components/ui/textarea'
import { MemoViewer, useMemos, type Memo } from '@/components/memos'
import { DealEditDialog } from '@/components/deals/DealEditDialog'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export default function DealDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [deal, setDeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [newNote, setNewNote] = useState('')
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null)
  const [memoViewerOpen, setMemoViewerOpen] = useState(false)
  const [isNewMemoDialogOpen, setIsNewMemoDialogOpen] = useState(false)
  const [newMemoForm, setNewMemoForm] = useState({ title: '', content: '' })
  const [isDealEditDialogOpen, setIsDealEditDialogOpen] = useState(false)
  
  const dealId = params.id as string // This is actually a deal ID, not company ID
  const { saveMemo, deleteMemo } = useMemos()
  const [memos, setMemos] = useState<Memo[]>([])

  useEffect(() => {
    const loadDealAndCompany = async () => {
      try {
        // First fetch the deal to get the company_id
        const dealsResponse = await fetch('/api/deals')
        if (dealsResponse.ok) {
          const deals = await dealsResponse.json()
          const currentDeal = deals.find((d: any) => d.id === dealId)
          
          if (currentDeal) {
            setDeal(currentDeal)
            
            // Now fetch the company using the company_id from the deal
            const companyResponse = await fetch(`/api/companies/${currentDeal.company_id}`)
            if (companyResponse.ok) {
              const companyData = await companyResponse.json()
              setCompany(companyData)
            } else {
              console.error('Failed to load company:', companyResponse.status)
              setCompany(null)
            }
          } else {
            console.error('Deal not found:', dealId)
            setDeal(null)
            setCompany(null)
          }
        } else {
          console.error('Failed to load deals:', dealsResponse.status)
        }
      } catch (error) {
        console.error('Error loading deal and company:', error)
        setDeal(null)
        setCompany(null)
      } finally {
        setLoading(false)
      }
    }

    if (dealId) {
      loadDealAndCompany()
    }
  }, [dealId])

  // Load memos when component mounts or company is loaded
  useEffect(() => {
    const loadMemos = () => {
      if (company?.id) {
        console.log('🔍 Loading memos for company:', company.id, 'Company name:', company?.name)
        
        // Debug localStorage contents
        const allMemos = JSON.parse(localStorage.getItem('ai_memos') || '[]')
        console.log('🗄️ All memos in localStorage:', allMemos)

        const { getMemosByProject } = useMemos()
        const projectMemos = getMemosByProject(company.id, 'deal')
        console.log('📝 Found memos for deal (specific):', projectMemos)

        // Try to get any memos with this company ID regardless of type
        const companyMemos = allMemos.filter((memo: any) => {
          const matchesId = memo.projectId === company.id
          const matchesName = memo.projectName && company?.name && 
            memo.projectName.toLowerCase().includes(company.name.toLowerCase())
          
          console.log('🔍 Checking memo:', memo.title, {
            memoProjectId: memo.projectId,
            memoProjectName: memo.projectName,
            targetId: company.id,
            targetName: company?.name,
            matchesId,
            matchesName
          })
          
          return matchesId || matchesName
        })
        
        console.log('📝 All company memos found:', companyMemos)
        setMemos(companyMemos.length > 0 ? companyMemos : projectMemos)
      }
    }

    // Add a small delay to ensure company data is loaded
    const timer = setTimeout(loadMemos, 100)
    return () => clearTimeout(timer)
  }, [company?.id, company?.name])

  // Listen for memo updates from AI system
  useEffect(() => {
    const handleMemoUpdate = () => {
      if (company?.id) {
        console.log('🔄 Memo update event triggered')
        const { getMemosByProject } = useMemos()
        const projectMemos = getMemosByProject(company.id, 'deal')
        setMemos(projectMemos)

        // Also check all memos
        const allMemos = JSON.parse(localStorage.getItem('ai_memos') || '[]')
        const companyMemos = allMemos.filter((memo: any) => 
          memo.projectId === company.id ||
          (memo.projectName && company?.name && memo.projectName.toLowerCase().includes(company.name.toLowerCase()))
        )
        if (companyMemos.length > 0) {
          setMemos(companyMemos)
        }
      }
    }

    window.addEventListener('memoUpdated', handleMemoUpdate)
    window.addEventListener('storage', handleMemoUpdate)
    return () => {
      window.removeEventListener('memoUpdated', handleMemoUpdate)
      window.removeEventListener('storage', handleMemoUpdate)
    }
  }, [company?.id, company?.name])

  const handleViewMemo = (memo: Memo) => {
    setSelectedMemo(memo)
    setMemoViewerOpen(true)
  }

  const handleSaveMemo = (memo: Memo) => {
    saveMemo(memo)
    // Refresh memos list
    const { getMemosByProject } = useMemos()
    const projectMemos = getMemosByProject(company?.id || '', 'deal')
    setMemos(projectMemos)
  }

  const handleDeleteMemo = (memoId: string) => {
    deleteMemo(memoId)
    // Refresh memos list
    const { getMemosByProject } = useMemos()
    const projectMemos = getMemosByProject(company?.id || '', 'deal')
    setMemos(projectMemos)
    setMemoViewerOpen(false)
  }

  // Handle new memo creation
  const handleCreateMemo = () => {
    setNewMemoForm({ title: '', content: '' })
    setIsNewMemoDialogOpen(true)
  }

  const handleSaveNewMemo = () => {
    if (!newMemoForm.content.trim()) return

    const newMemo: Memo = {
      id: `memo-${Date.now()}`,
      title: newMemoForm.title || `${company?.name || 'Deal'} Memo`,
      content: newMemoForm.content,
      type: 'manual',
      author: 'User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectId: company?.id || '',
      projectType: 'deal',
      projectName: company?.name || 'Deal'
    }

    saveMemo(newMemo)
    
    // Refresh memos list
    const { getMemosByProject } = useMemos()
    const projectMemos = getMemosByProject(company?.id || '', 'deal')
    setMemos(projectMemos)

    // Close dialog
    setIsNewMemoDialogOpen(false)
    setNewMemoForm({ title: '', content: '' })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'invested': return 'bg-green-100 text-green-800 border-green-200'
      case 'term_sheet': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'due_diligence': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'screening': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'sourcing': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'passed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="h-96 bg-muted rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-muted rounded-lg"></div>
              <div className="h-64 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Company not found</h3>
          <p className="text-muted-foreground mb-6">The company you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Button onClick={() => router.push('/dealflow')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deal Pipeline
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/dealflow')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pipeline
          </Button>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor('screening')} variant="outline">
              Deal Active
            </Badge>
            <Badge className={getPriorityColor('high')} variant="outline">
              High Priority
            </Badge>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-purple-600 rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl">
              {company.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {company.name}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Building2 className="w-4 h-4" />
                <span>{company.sector}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>{company.company_type}</span>
                {company.founded_year && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <Calendar className="w-4 h-4" />
                    <span>Founded {company.founded_year}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setIsDealEditDialogOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Deal
            </Button>
            <Button>
              <MessageSquare className="w-4 h-4 mr-2" />
              AI Chat
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Company Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground">{company.description}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-1">Location</h4>
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-1" />
                    {typeof company.headquarters === 'string' 
                      ? company.headquarters 
                      : `${company.headquarters?.city || ''}, ${company.headquarters?.country || ''}`
                    }
                  </div>
                </div>
                
                {company.website && (
                  <div>
                    <h4 className="font-medium mb-1">Website</h4>
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      Visit Site
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium mb-1">Employees</h4>
                  <div className="flex items-center text-muted-foreground">
                    <Users className="w-4 h-4 mr-1" />
                    {company.employee_count || 'Unknown'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deal Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Deal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="financials">Financials</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Investment Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Round Type:</span>
                          <span className="font-medium">{deal?.stage ? deal.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Investment Amount:</span>
                          <span className="font-medium">{deal?.our_investment ? formatCurrency(deal.our_investment) : 'TBD'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valuation:</span>
                          <span className="font-medium">{deal?.valuation ? formatCurrency(deal.valuation) : 'TBD'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ownership:</span>
                          <span className="font-medium">
                            {deal?.our_investment && deal?.valuation 
                              ? `${((deal.our_investment / deal.valuation) * 100).toFixed(2)}%` 
                              : 'TBD'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Deal Team</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lead Partner:</span>
                          <span className="font-medium">{deal?.lead_partner || 'RedPill Partner'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deal Probability:</span>
                          <span className="font-medium">{deal?.probability || 50}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financials" className="space-y-4 mt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Revenue Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Revenue:</span>
                          <span className="font-medium">{formatCurrency(25000000)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Revenue Growth:</span>
                          <span className="font-medium text-green-600">+145%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ARR:</span>
                          <span className="font-medium">{formatCurrency(30000000)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross Margin:</span>
                          <span className="font-medium">82.5%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Business Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Burn Rate:</span>
                          <span className="font-medium">{formatCurrency(2500000)}/month</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Runway:</span>
                          <span className="font-medium">18 months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Customers:</span>
                          <span className="font-medium">{(50000).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Team Size:</span>
                          <span className="font-medium">{company.employee_count || '250'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4 mt-6">
                  <div className="space-y-4">
                    <div className="border-l-2 border-primary pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <span className="font-medium">Current: {company.deal_status ? company.deal_status.replace('_', ' ') : 'Active'}</span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Last updated: {company.updated_at ? new Date(company.updated_at).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                    
                    <div className="border-l-2 border-muted pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-muted rounded-full"></div>
                        <span className="font-medium">Investment Date</span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {company.investment?.investment_date ? new Date(company.investment.investment_date).toLocaleDateString() : 'TBD'}
                      </p>
                    </div>
                    
                    <div className="border-l-2 border-muted pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-muted rounded-full"></div>
                        <span className="font-medium">Deal Created</span>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4 mt-6">
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No documents yet</h3>
                    <p className="text-muted-foreground mb-4">Upload deal documents, term sheets, and due diligence materials.</p>
                    <Button>
                      <FileText className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4 mt-6">
                  <div className="space-y-6">
                    {/* Notes Header */}
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Deal Notes & Memos</h4>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleCreateMemo}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Create Memo
                        </Button>
                        <AIMemoButton 
                          projectId={company?.id || ''}
                          projectType="deal"
                          projectName={company?.name}
                        />
                        <ChatWithAIButton 
                          projectId={company?.id || ''}
                          projectType="deal"
                          projectName={company?.name}
                        />
                      </div>
                    </div>

                    {/* Quick Note Input */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Add Quick Note</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Textarea
                          placeholder="Add a note about this deal, meeting notes, due diligence findings, etc..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          rows={3}
                        />
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-muted-foreground">
                            {newNote.length}/500 characters
                          </div>
                          <Button 
                            size="sm" 
                            disabled={!newNote.trim()}
                            onClick={() => {
                              // Save note logic would go here
                              setNewNote('')
                            }}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Save Note
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* AI Research Memos */}
                    <div>
                      <h5 className="font-medium mb-3 text-sm text-muted-foreground">AI Research Memos</h5>
                      <div className="space-y-3">
                        {/* Display actual AI memos */}
                        {memos.filter(m => m.type === 'ai').length > 0 ? (
                          memos
                            .filter(m => m.type === 'ai')
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((memo) => (
                              <Card key={memo.id}>
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                        <Brain className="w-3 h-3 mr-1" />
                                        AI Generated
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(memo.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleViewMemo(memo)}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <h6 className="font-medium mb-2">{memo.title}</h6>
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                    {memo.content.replace(/[#*`]/g, '').substring(0, 150)}...
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                      <User className="w-3 h-3" />
                                      <span>AI Research Assistant</span>
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewMemo(memo)}
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      View Full Memo
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                        ) : (
                          /* No memos state */
                          <div className="text-center py-6">
                            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground mb-3">
                              No AI memos yet for this deal
                            </p>
                            <AIMemoButton 
                              projectId={company?.id || ''}
                              projectType="deal"
                              projectName={company?.name}
                              variant="outline"
                              size="sm"
                              label="Generate AI Memo"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Manual Notes */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-sm text-muted-foreground">Manual Notes</h5>
                        <Button variant="outline" size="sm">
                          <Plus className="w-3 h-3 mr-1" />
                          Add Note
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Display actual manual memos */}
                        {memos.filter(m => m.type === 'manual').length > 0 ? (
                          memos
                            .filter(m => m.type === 'manual')
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((memo) => (
                              <Card key={memo.id}>
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                                        <FileText className="w-3 h-3 mr-1" />
                                        Manual
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(memo.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleViewMemo(memo)}
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                  </div>
                                  <h6 className="font-medium mb-2">{memo.title}</h6>
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                    {memo.content.replace(/[#*`]/g, '').substring(0, 150)}...
                                  </p>
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <User className="w-3 h-3 mr-1" />
                                    <span>{memo.author || 'Team Member'}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                        ) : (
                          /* Empty state */
                          <div className="text-center py-6">
                            <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground mb-3">
                              No manual notes yet for this deal
                            </p>
                            <Button variant="outline" size="sm">
                              <Plus className="w-3 h-3 mr-1" />
                              Create First Note
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start AI Analysis
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
            </CardContent>
          </Card>

          {/* Key Metrics Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Deal Score</span>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="font-medium">8.5/10</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Revenue Growth</span>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="font-medium text-green-600">+{company.metrics?.revenue_growth || '145'}%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Market Size</span>
                  <span className="font-medium">$2.5B</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Competition</span>
                  <Badge variant="outline" className="text-xs">Moderate</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Status updated to {company.deal_status ? company.deal_status.replace('_', ' ') : 'Active'}</p>
                    <p className="text-muted-foreground text-xs">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-muted rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Deal created by {company.investment?.lead_partner || 'RedPill Partner'}</p>
                    <p className="text-muted-foreground text-xs">
                      {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'Recently'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Memo Viewer Modal */}
      {selectedMemo && (
        <MemoViewer
          memo={selectedMemo}
          isOpen={memoViewerOpen}
          onClose={() => {
            setMemoViewerOpen(false)
            setSelectedMemo(null)
          }}
          onSave={handleSaveMemo}
          onDelete={handleDeleteMemo}
        />
      )}

      {/* Create New Memo Dialog */}
      <Dialog open={isNewMemoDialogOpen} onOpenChange={setIsNewMemoDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Create New Memo</DialogTitle>
            <DialogDescription>
              Create a new memo for {company?.name}. Supports markdown formatting.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="memo-title">Title</Label>
              <Input
                id="memo-title"
                value={newMemoForm.title}
                onChange={(e) => setNewMemoForm({ ...newMemoForm, title: e.target.value })}
                placeholder={`${company?.name || 'Deal'} Memo`}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="memo-content">Content</Label>
              <Textarea
                id="memo-content"
                value={newMemoForm.content}
                onChange={(e) => setNewMemoForm({ ...newMemoForm, content: e.target.value })}
                placeholder="Write your memo content using markdown..."
                rows={12}
                className="font-mono text-sm"
              />
              <div className="text-xs text-muted-foreground">
                {newMemoForm.content.length} characters • Supports markdown formatting
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewMemoDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewMemo} disabled={!newMemoForm.content.trim()}>
              <FileText className="w-3 h-3 mr-1" />
              Create Memo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Edit Dialog */}
      {deal && company && (
        <DealEditDialog
          isOpen={isDealEditDialogOpen}
          onClose={() => setIsDealEditDialogOpen(false)}
          deal={deal}
          company={company}
          mode="edit"
          onSave={async (dealData) => {
            try {
              const response = await fetch(`/api/deals/${deal.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dealData)
              })
              
              if (response.ok) {
                const updatedDeal = await response.json()
                setDeal(updatedDeal)
                // Reload to refresh all data
                window.location.reload()
              } else {
                const error = await response.json()
                alert(`Failed to update deal: ${error.message || error.detail}`)
              }
            } catch (error) {
              console.error('Error updating deal:', error)
              alert('Error updating deal. Please try again.')
            }
          }}
        />
      )}
    </div>
  )
}