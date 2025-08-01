'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChatWithAIButton, AIButton, AIMemoButton, AIResearchButton, useAI } from '@/components/ai'
import { getDealStatusForCompany, subscribeToDealStatusChanges } from '@/lib/dealStatusSync'
import { getCompanyById, updateCompany } from '@/lib/companyDatabase'
import { 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Calendar,
  FileText,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  Building,
  Star,
  Edit3,
  Save,
  X
} from 'lucide-react'

interface DealData {
  id: string
  company_name: string
  status: 'sourcing' | 'screening' | 'due_diligence' | 'term_sheet' | 'invested' | 'passed'
  priority: 'high' | 'medium' | 'low'
  investment: {
    target_amount: number
    target_valuation: number
    current_round: string
    lead_investor?: string
    close_date?: string
  }
  memos: {
    id: string
    title: string
    author: string
    date: string
    recommendation: 'invest' | 'pass' | 'monitor'
    summary: string
    content: string
  }[]
  meetings: {
    id: string
    title: string
    date: string
    attendees: string[]
    notes: string
    action_items: {
      item: string
      owner: string
      due_date: string
      status: 'pending' | 'completed'
    }[]
  }[]
  contacts: {
    id: string
    name: string
    role: string
    email: string
    phone?: string
    linkedin?: string
  }[]
}


export default function DealPage() {
  const params = useParams()
  const router = useRouter()
  const [deal, setDeal] = useState<DealData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [currentDealStatus, setCurrentDealStatus] = useState<'sourcing' | 'screening' | 'due_diligence' | 'term_sheet' | 'invested' | 'passed'>('due_diligence')
  const [starredMemos, setStarredMemos] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})

  // Get AI context from UnifiedAISystem (must be at top level)
  const aiContext = useAI()

  useEffect(() => {
    // Load company data and convert to deal format
    const loadDeal = async () => {
      try {
        const companyData = await getCompanyById(params.companyId as string)
        if (companyData) {
          const dealData: DealData = {
            id: `${companyData.id}-deal`,
            company_name: companyData.name,
            status: companyData.deal_status,
            priority: companyData.priority,
            investment: {
              target_amount: companyData.investment.investment_amount,
              target_valuation: companyData.investment.valuation,
              current_round: companyData.investment.round_type,
              lead_investor: companyData.investment.lead_partner,
              close_date: companyData.investment.investment_date
            },
            memos: [
              {
                id: '1',
                title: `Investment Analysis - ${companyData.name}`,
                author: companyData.investment.lead_partner,
                date: companyData.created_at.split('T')[0],
                recommendation: 'invest',
                summary: `Analysis of ${companyData.name} investment opportunity`,
                content: `${companyData.description}\n\nKey metrics:\n- ARR: $${companyData.metrics.arr.toLocaleString()}\n- Revenue Growth: ${companyData.metrics.revenue_growth}%\n- Gross Margin: ${companyData.metrics.gross_margin}%`
              }
            ],
            meetings: [
              {
                id: '1',
                title: 'Initial Due Diligence Meeting',
                date: companyData.created_at.split('T')[0],
                attendees: [companyData.investment.lead_partner, 'CEO', 'CTO'],
                notes: `Initial meeting with ${companyData.name} team. Strong market opportunity in ${companyData.sector}.`,
                action_items: [
                  { item: 'Complete financial analysis', owner: companyData.investment.lead_partner, due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'pending' },
                  { item: 'Schedule team interviews', owner: 'Investment Team', due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], status: 'pending' }
                ]
              }
            ],
            contacts: [
              {
                id: '1',
                name: 'CEO',
                role: 'Chief Executive Officer',
                email: `ceo@${companyData.domain}`,
                phone: '+1-555-0100',
                linkedin: `linkedin.com/in/${companyData.name.toLowerCase().replace(/\s+/g, '')}-ceo`
              },
              {
                id: '2',
                name: 'CTO',
                role: 'Chief Technology Officer',
                email: `cto@${companyData.domain}`,
                linkedin: `linkedin.com/in/${companyData.name.toLowerCase().replace(/\s+/g, '')}-cto`
              }
            ]
          }
          setDeal(dealData)
        } else {
          console.error('Company not found for deal page:', params.companyId)
          window.location.href = '/portfolio'
        }
      } catch (error) {
        console.error('Error loading deal data:', error)
        window.location.href = '/portfolio'
      } finally {
        setLoading(false)
      }
    }

    loadDeal()
  }, [params.companyId])

  // Load deal status and subscribe to changes
  useEffect(() => {
    if (deal?.id) {
      // Load current deal status using company name to match dealflow
      const companySlug = deal.company_name.toLowerCase().replace(/\s+/g, '-')
      const savedStatus = getDealStatusForCompany(companySlug)
      if (savedStatus) {
        setCurrentDealStatus(savedStatus)
      }

      // Subscribe to deal status changes
      const unsubscribe = subscribeToDealStatusChanges((update) => {
        if (update.companyName === deal.company_name || update.companyId === companySlug) {
          setCurrentDealStatus(update.newStatus)
        }
      })

      // Cleanup subscription
      return unsubscribe
    }
  }, [deal?.id, deal?.company_name])

  // Load starred memos from localStorage and listen for updates
  useEffect(() => {
    const loadMemos = () => {
      if (params.companyId) {
        try {
          // Use the same key pattern as AI sidebar: memos-{companyId}
          const memosKey = `memos-${params.companyId}`
          const savedMemos = JSON.parse(localStorage.getItem(memosKey) || '[]')
          setStarredMemos(savedMemos)
        } catch (error) {
          console.error('Error loading starred memos:', error)
        }
      }
    }

    // Load memos initially
    loadMemos()

    // Listen for localStorage changes (when memos are saved from AI chat)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `memos-${params.companyId}`) {
        loadMemos()
      }
    }

    // Listen for custom events (cross-tab communication)
    const handleMemoUpdate = () => {
      loadMemos()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('memoUpdated', handleMemoUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('memoUpdated', handleMemoUpdate)
    }
  }, [params.companyId])

  const handleEditStart = () => {
    if (deal) {
      setEditForm({
        target_amount: deal.investment.target_amount,
        target_valuation: deal.investment.target_valuation,
        current_round: deal.investment.current_round,
        lead_investor: deal.investment.lead_investor,
        close_date: deal.investment.close_date
      })
      setIsEditing(true)
    }
  }

  const handleEditCancel = () => {
    setEditForm({})
    setIsEditing(false)
  }

  const handleEditSave = async () => {
    if (!deal || !editForm) return

    try {
      // Update the company with new investment data
      const updatedCompany = await updateCompany(params.companyId as string, {
        investment: {
          investment_amount: editForm.target_amount,
          valuation: editForm.target_valuation,
          round_type: editForm.current_round,
          lead_partner: editForm.lead_investor,
          investment_date: editForm.close_date,
          ownership_percentage: editForm.target_amount && editForm.target_valuation 
            ? (editForm.target_amount / editForm.target_valuation) * 100 
            : 0
        }
      })

      if (updatedCompany) {
        // Update local deal state
        const updatedDeal = {
          ...deal,
          investment: {
            target_amount: editForm.target_amount,
            target_valuation: editForm.target_valuation,
            current_round: editForm.current_round,
            lead_investor: editForm.lead_investor,
            close_date: editForm.close_date
          }
        }
        setDeal(updatedDeal)
        setIsEditing(false)
        setEditForm({})
      }
    } catch (error) {
      console.error('Error updating deal:', error)
      alert('Failed to update deal information')
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setEditForm((prev: any) => ({
      ...prev,
      [field]: value
    }))
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
      case 'invested': return 'bg-green-100 text-green-800'
      case 'term_sheet': return 'bg-blue-100 text-blue-800'
      case 'due_diligence': return 'bg-yellow-100 text-yellow-800'
      case 'screening': return 'bg-purple-100 text-purple-800'
      case 'sourcing': return 'bg-gray-100 text-gray-800'
      case 'passed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Deal Not Found</h1>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Company
              </Button>
              <div className="flex items-center space-x-3">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline"
                      onClick={handleEditCancel}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleEditSave}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline"
                      onClick={handleEditStart}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Deal
                    </Button>
                    <ChatWithAIButton 
                      projectType="deal"
                      projectName={deal.company_name}
                      projectId={params.companyId as string}
                    />
                    <Button>
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Meeting
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Deal Header */}
            <div className="flex items-start space-x-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                {deal.company_name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{deal.company_name} Deal</h1>
                  <Badge className={getStatusColor(currentDealStatus)}>{currentDealStatus.replace('_', ' ')}</Badge>
                  <Badge className={getPriorityColor(deal.priority)}>{deal.priority} priority</Badge>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Building className="w-4 h-4" />
                    <span>{deal.investment.current_round}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatCurrency(deal.investment.target_amount)} target</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{formatCurrency(deal.investment.target_valuation)} valuation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Investment Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Investment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editForm.target_amount || ''}
                      onChange={(e) => handleInputChange('target_amount', parseInt(e.target.value) || 0)}
                      className="text-center font-bold mb-2"
                      placeholder="Investment Amount"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(deal.investment.target_amount)}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">Target Investment</div>
                </div>
                <div className="text-center">
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editForm.target_valuation || ''}
                      onChange={(e) => handleInputChange('target_valuation', parseInt(e.target.value) || 0)}
                      className="text-center font-bold mb-2"
                      placeholder="Valuation"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(deal.investment.target_valuation)}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">Valuation</div>
                </div>
                <div className="text-center">
                  {isEditing ? (
                    <Input
                      value={editForm.current_round || ''}
                      onChange={(e) => handleInputChange('current_round', e.target.value)}
                      className="text-center font-bold mb-2"
                      placeholder="Round Type"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">
                      {deal.investment.current_round}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">Round Type</div>
                </div>
                <div className="text-center">
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editForm.close_date || ''}
                      onChange={(e) => handleInputChange('close_date', e.target.value)}
                      className="text-center font-bold mb-2"
                    />
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">
                      {deal.investment.close_date || 'TBD'}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">Target Close</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="memos">Memos</TabsTrigger>
              <TabsTrigger value="meetings">Meetings</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Deal Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Badge className={getStatusColor(currentDealStatus)} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                      {currentDealStatus.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <p className="text-gray-600 mt-4">
                      Deal is currently in {currentDealStatus.replace('_', ' ')} stage
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="memos" className="space-y-6">
              {/* Regular memos */}
              {deal.memos.map((memo) => (
                <Card key={memo.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{memo.title}</CardTitle>
                        <p className="text-sm text-gray-600">By {memo.author} • {memo.date}</p>
                      </div>
                      <Badge className={memo.recommendation === 'invest' ? 'bg-green-100 text-green-800' : 
                                     memo.recommendation === 'pass' ? 'bg-red-100 text-red-800' : 
                                     'bg-yellow-100 text-yellow-800'}>
                        {memo.recommendation}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{memo.summary}</p>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Read Full Memo
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {/* Starred AI memos */}
              {starredMemos.map((memo) => (
                <Card key={memo.id} className="border-yellow-200 bg-yellow-50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-2 fill-current" />
                          {memo.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600">By {memo.author} • {new Date(memo.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          AI Insight
                        </Badge>
                        <AIButton 
                          projectType="deal"
                          projectName={deal.company_name}
                          projectId={params.companyId as string}
                          memoId={memo.id}
                          size="sm"
                          label="Open Canvas"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{memo.content}</p>
                  </CardContent>
                </Card>
              ))}

              {/* Empty state */}
              {deal.memos.length === 0 && starredMemos.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No memos yet</p>
                    <p className="text-sm">Star AI chat messages to save them as memos</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="meetings" className="space-y-6">
              {deal.meetings.map((meeting) => (
                <Card key={meeting.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{meeting.title}</CardTitle>
                      <span className="text-sm text-gray-500">{meeting.date}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Attendees</h4>
                      <div className="flex flex-wrap gap-2">
                        {meeting.attendees.map((attendee, index) => (
                          <Badge key={index} variant="outline">{attendee}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-gray-700">{meeting.notes}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Action Items</h4>
                      <div className="space-y-2">
                        {meeting.action_items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {item.status === 'completed' ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-orange-500" />
                              )}
                              <span className="text-sm">{item.item}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">{item.owner}</p>
                              <p className="text-xs text-gray-500">Due: {item.due_date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="contacts" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deal.contacts.map((contact) => (
                  <Card key={contact.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {contact.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{contact.name}</h4>
                          <p className="text-sm text-gray-600">{contact.role}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                                {contact.email}
                              </a>
                            </div>
                            {contact.phone && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span>{contact.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
    </div>
  )
}