'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChatWithAIButton, ChatHistoryButton } from '@/components/ai'
import { getDealStatusForCompany, subscribeToDealStatusChanges } from '@/lib/dealStatusSync'
import { getCompanyById, updateCompany } from '@/lib/companyDatabase'
import { CustomizableDashboard } from '@/components/dashboard/CustomizableDashboard'
import '@/components/widgets' // Auto-register widgets
import { WidgetType } from '@/lib/widgets/types'
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  FileText,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
  Globe,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Plus,
  Edit3,
  Save,
  X
} from 'lucide-react'

interface CompanyData {
  id: string
  name: string
  logo?: string
  website?: string
  sector: string
  stage: string
  founded_year: number
  headquarters: {
    city: string
    country: string
  }
  description: string
  investment: {
    round_type: string
    investment_amount: number
    valuation: number
    ownership_percentage: number
    investment_date: string
    lead_partner: string
  }
  metrics: {
    revenue_current: number
    revenue_growth: number
    burn_rate: number
    runway_months: number
    employees: number
    customers: number
    arr: number
    gross_margin: number
  }
  updates: {
    id: string
    title: string
    date: string
    type: 'financial' | 'product' | 'team' | 'funding' | 'other'
    summary: string
    details: string
  }[]
  documents: {
    id: string
    name: string
    type: string
    date: string
    size: string
  }[]
  board_meetings: {
    id: string
    date: string
    attendees: string[]
    agenda: string[]
    notes: string
    action_items: {
      item: string
      owner: string
      due_date: string
      status: 'pending' | 'completed'
    }[]
  }[]
}


export default function CompanyDetailPage() {
  const params = useParams()
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [currentDealStatus, setCurrentDealStatus] = useState<string>('due_diligence')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<CompanyData>>({})

  useEffect(() => {
    // Load company from database
    const loadCompany = async () => {
      try {
        const companyFromDb = await getCompanyById(params.companyId as string)
        if (companyFromDb) {
          // Convert Company to CompanyData format
          const companyData: CompanyData = {
            id: companyFromDb.id,
            name: companyFromDb.name,
            logo: companyFromDb.logo,
            website: companyFromDb.website,
            sector: companyFromDb.sector,
            stage: companyFromDb.stage,
            founded_year: companyFromDb.founded_year || new Date().getFullYear(),
            headquarters: companyFromDb.headquarters,
            description: companyFromDb.description,
            investment: companyFromDb.investment,
            metrics: companyFromDb.metrics,
            updates: [
              {
                id: '1',
                title: 'Company Added to Portfolio',
                date: companyFromDb.created_at.split('T')[0],
                type: 'other',
                summary: `${companyFromDb.name} was added to the portfolio`,
                details: `${companyFromDb.name} in the ${companyFromDb.sector} sector was added to our portfolio with ${companyFromDb.stage} funding stage.`
              }
            ],
            documents: [
              {
                id: '1',
                name: `${companyFromDb.name} Overview.pdf`,
                type: 'PDF',
                date: companyFromDb.created_at.split('T')[0],
                size: '1.2 MB'
              }
            ],
            board_meetings: [
              {
                id: '1',
                date: companyFromDb.created_at.split('T')[0],
                attendees: [companyFromDb.investment.lead_partner, 'CEO', 'CTO'],
                agenda: ['Company Overview', 'Investment Terms', 'Next Steps'],
                notes: `Initial investment discussion for ${companyFromDb.name}. Strong team and market opportunity.`,
                action_items: [
                  {
                    item: 'Complete due diligence',
                    owner: companyFromDb.investment.lead_partner,
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    status: 'pending'
                  }
                ]
              }
            ]
          }
          setCompany(companyData)
        } else {
          // Company not found, redirect to dashboard
          console.error('Company not found:', params.companyId)
          window.location.href = '/dashboard'
        }
      } catch (error) {
        console.error('Error loading company:', error)
        window.location.href = '/dashboard'
      } finally {
        setLoading(false)
      }
    }

    loadCompany()
  }, [params.companyId])

  // Load deal status and subscribe to changes
  useEffect(() => {
    if (company?.id) {
      // Load current deal status using company name to match dealflow
      const companySlug = company.name.toLowerCase().replace(/\s+/g, '-')
      const savedStatus = getDealStatusForCompany(companySlug)
      if (savedStatus) {
        setCurrentDealStatus(savedStatus)
      }

      // Subscribe to deal status changes
      const unsubscribe = subscribeToDealStatusChanges((update) => {
        if (update.companyName === company.name || update.companyId === companySlug) {
          setCurrentDealStatus(update.newStatus)
        }
      })

      // Cleanup subscription
      return unsubscribe
    }
  }, [company?.id])

  const handleEditStart = () => {
    if (company) {
      setEditForm(company)
      setIsEditing(true)
    }
  }

  const handleEditCancel = () => {
    setEditForm({})
    setIsEditing(false)
  }

  const handleEditSave = async () => {
    if (!company || !editForm) return

    try {
      const updatedCompany = updateCompany(company.id, editForm)
      if (updatedCompany) {
        // Convert back to CompanyData format
        const companyData: CompanyData = {
          id: updatedCompany.id,
          name: updatedCompany.name,
          logo: updatedCompany.logo,
          website: updatedCompany.website,
          sector: updatedCompany.sector,
          stage: updatedCompany.stage,
          founded_year: updatedCompany.founded_year || new Date().getFullYear(),
          headquarters: updatedCompany.headquarters,
          description: updatedCompany.description,
          investment: updatedCompany.investment,
          metrics: updatedCompany.metrics,
          updates: company.updates, // Keep existing updates
          documents: company.documents, // Keep existing documents
          board_meetings: company.board_meetings // Keep existing meetings
        }
        setCompany(companyData)
        setIsEditing(false)
        setEditForm({})
      }
    } catch (error) {
      console.error('Error updating company:', error)
      alert('Failed to update company information')
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setEditForm(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof CompanyData] as any),
          [child]: value
        }
      }))
    } else {
      setEditForm(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getMetricTrend = (value: number) => {
    return value >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    )
  }

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'financial': return 'bg-green-100 text-green-800'
      case 'product': return 'bg-blue-100 text-blue-800'
      case 'team': return 'bg-purple-100 text-purple-800'
      case 'funding': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDealStatusColor = (status: string) => {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h1>
          <Button onClick={() => window.history.back()}>
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
            <Button variant="ghost" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Portfolio
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
                    Edit Company
                  </Button>
                  <ChatHistoryButton
                    projectType="company"
                    projectName={company ? company.name : "Company"}
                    projectId={company ? company.id : undefined}
                  />
                  <ChatWithAIButton
                    projectType="company"
                    projectName={company ? company.name : "Company"}
                    projectId={company ? company.id : undefined}
                  />
                  <Button>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Company Header */}
          <div className="flex items-start space-x-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
              {company.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                {isEditing ? (
                  <Input
                    value={editForm.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-3xl font-bold bg-transparent border-2 border-blue-300 rounded-lg px-2"
                    style={{ fontSize: '1.875rem', lineHeight: '2.25rem' }}
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                )}
                {isEditing ? (
                  <Input
                    value={editForm.stage || ''}
                    onChange={(e) => handleInputChange('stage', e.target.value)}
                    className="w-32"
                    placeholder="Stage"
                  />
                ) : (
                  <Badge className="bg-blue-100 text-blue-800">{company.stage}</Badge>
                )}
                {isEditing ? (
                  <Input
                    value={editForm.sector || ''}
                    onChange={(e) => handleInputChange('sector', e.target.value)}
                    className="w-32"
                    placeholder="Sector"
                  />
                ) : (
                  <Badge variant="outline">{company.sector}</Badge>
                )}
              </div>
              {isEditing ? (
                <Textarea
                  value={editForm.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="mb-4 max-w-3xl border-2 border-blue-300"
                  rows={3}
                />
              ) : (
                <p className="text-gray-600 mb-4 max-w-3xl">{company.description}</p>
              )}
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  {isEditing ? (
                    <div className="flex space-x-2">
                      <Input
                        value={editForm.headquarters?.city || ''}
                        onChange={(e) => handleInputChange('headquarters.city', e.target.value)}
                        className="w-24"
                        placeholder="City"
                      />
                      <Input
                        value={editForm.headquarters?.country || ''}
                        onChange={(e) => handleInputChange('headquarters.country', e.target.value)}
                        className="w-24"
                        placeholder="Country"
                      />
                    </div>
                  ) : (
                    <span>{company.headquarters.city}, {company.headquarters.country}</span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editForm.founded_year || ''}
                      onChange={(e) => handleInputChange('founded_year', parseInt(e.target.value))}
                      className="w-20"
                      placeholder="Year"
                    />
                  ) : (
                    <span>Founded {company.founded_year}</span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{company.metrics.employees} employees</span>
                </div>
                {company.website && (
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 hover:text-blue-600"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Customizable Dashboard */}
        <div className="mb-8">
          <CustomizableDashboard
            companyId={company.id}
            userId="current-user" // This should come from auth context
            companyInfo={{
              id: company.id,
              name: company.name,
              sector: company.sector,
              ticker: (() => {
                // Determine ticker based on company sector and name
                const isBlockchainCrypto = company.sector?.toLowerCase().includes('blockchain') || 
                                          company.sector?.toLowerCase().includes('crypto');
                
                if (isBlockchainCrypto) {
                  // Map known crypto companies to their tickers
                  const companyName = company.name.toLowerCase();
                  const cryptoMap: Record<string, string> = {
                    'bitcoin': 'BTC',
                    'ethereum': 'ETH',
                    'chainlink': 'LINK',
                    'polygon': 'MATIC',
                    'solana': 'SOL',
                    'cardano': 'ADA',
                    'binance': 'BNB',
                    'avalanche': 'AVAX',
                    'polkadot': 'DOT',
                    'uniswap': 'UNI'
                  };
                  
                  // Try to find matching ticker
                  for (const [key, ticker] of Object.entries(cryptoMap)) {
                    if (companyName.includes(key)) {
                      return ticker;
                    }
                  }
                  
                  // Default to BTC for blockchain/crypto companies without specific mapping
                  return 'BTC';
                }
                
                return undefined; // Not a crypto company
              })()
            }}
            initialWidgets={[
              {
                id: 'key-metrics',
                type: WidgetType.KEY_METRICS,
                title: 'Key Performance Metrics',
                config: {
                  companyName: company.name,
                  website: company.website,
                  show_trends: true,
                  metric_period: 'monthly'
                },
                position: { x: 0, y: 0, w: 6, h: 4 },
                dataSource: {
                  asset_type: 'equity' as const,
                  ticker: company.name
                },
                isVisible: true
              },
              {
                id: 'fundamentals',
                type: WidgetType.FUNDAMENTALS,
                title: 'Company Fundamentals',
                config: {
                  companyName: company.name,
                  website: company.website,
                  metrics: ['market_cap', 'pe_ratio', 'revenue_ttm', 'gross_margin'],
                  display_format: 'cards'
                },
                position: { x: 6, y: 0, w: 6, h: 3 },
                dataSource: {
                  asset_type: 'equity' as const,
                  ticker: company.name
                },
                isVisible: true
              },
              {
                id: 'investment-summary',
                type: WidgetType.INVESTMENT_SUMMARY,  
                title: 'Investment Summary',
                config: {
                  companyName: company.name,
                  show_details: true,
                  currency_format: 'USD'
                },
                position: { x: 6, y: 3, w: 6, h: 3 },
                dataSource: {
                  asset_type: 'equity' as const,
                  ticker: company.name
                },
                isVisible: true
              },
              {
                id: 'token-price',
                type: WidgetType.TOKEN_PRICE,
                title: 'Token Price',
                config: {
                  companyName: company.name,
                  refresh_interval: '60',
                  show_market_cap: true,
                  show_volume: true
                },
                position: { x: 0, y: 4, w: 4, h: 4 },
                dataSource: {
                  asset_type: 'crypto' as const,
                  ticker: company.name
                },
                isVisible: true
              }
            ]}
            onLayoutChange={(widgets) => {
              console.log('Layout changed:', widgets);
              // Save to backend API
            }}
            onWidgetsChange={(widgets) => {
              console.log('Widgets changed:', widgets);
              // Save to backend API
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tabs for detailed information */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Updates</TabsTrigger>
                <TabsTrigger value="deals">Deals</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="board">Board Meetings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {company.updates.map((update) => (
                  <Card key={update.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{update.title}</CardTitle>
                          <p className="text-sm text-gray-600">{update.summary}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getUpdateTypeColor(update.type)}>
                            {update.type}
                          </Badge>
                          <span className="text-sm text-gray-500">{update.date}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{update.details}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="deals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Company Deal</CardTitle>
                      <Badge className={getDealStatusColor(currentDealStatus)}>
                        {currentDealStatus.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Single Deal Card - 1 Company = 1 Deal */}
                    <div className="border rounded-lg p-6 hover:bg-gray-50 cursor-pointer"
                         onClick={() => window.location.href = `/portfolio/${company.id}/deal`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium">{company.name} {company.investment.round_type}</h4>
                        <Badge className={getDealStatusColor(currentDealStatus)}>
                          {currentDealStatus.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {formatCurrency(company.investment.investment_amount)}
                          </div>
                          <div className="text-xs text-gray-600">Target Investment</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {formatCurrency(company.investment.valuation)}
                          </div>
                          <div className="text-xs text-gray-600">Valuation</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            {formatPercentage(company.investment.ownership_percentage)}
                          </div>
                          <div className="text-xs text-gray-600">Target Ownership</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">
                            Mar 2025
                          </div>
                          <div className="text-xs text-gray-600">Target Close</div>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                          <FileText className="w-4 h-4 mr-2" />
                          View Full Deal
                        </Button>
                        <ChatWithAIButton
                          projectType="company"
                          projectName={company ? company.name : "Company"}
                          projectId={company ? company.id : undefined}
                        />
                        <Button 
                          variant="outline"
                          onClick={() => window.location.href = `/deals/new?companyId=${company.id}`}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Deal
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                {company.documents.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-8 h-8 text-blue-500" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-gray-600">{doc.type} • {doc.size}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{doc.date}</p>
                          <Button variant="outline" size="sm" className="mt-2">
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="board" className="space-y-4">
                {company.board_meetings.map((meeting) => (
                  <Card key={meeting.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Board Meeting - {meeting.date}</CardTitle>
                        <Badge variant="outline">{meeting.attendees.length} attendees</Badge>
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
                        <h4 className="font-medium mb-2">Agenda</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {meeting.agenda.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Key Notes</h4>
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

            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Update</span>
                  <span className="text-sm font-medium">{company.updates[0]?.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Board Meetings</span>
                  <span className="text-sm font-medium">{company.board_meetings.length} this year</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Documents</span>
                  <span className="text-sm font-medium">{company.documents.length} files</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Health Score</span>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {company.updates.slice(0, 3).map((update) => (
                    <div key={update.id} className="text-sm">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">{update.title}</span>
                      </div>
                      <p className="text-gray-600 text-xs ml-4">{update.date}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}