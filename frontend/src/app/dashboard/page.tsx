'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkflowCard } from '@/components/workflows/WorkflowCard'
import { PortfolioTable } from '@/components/analytics/PortfolioTable'
import { getAllCompanies, getPortfolioStats, Company } from '@/lib/companyDatabase'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Activity,
  Briefcase,
  Target,
  Building2
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { ChatWithAIButton, useAI } from '@/components/ai'

interface WorkflowData {
  id: string
  workflow_id: string
  workflow_type: string
  company_name: string
  status: string
  progress_percentage: number
  created_at: string
  completed_at?: string
}

interface InvestmentMemo {
  id: number
  company_name: string
  memo_title: string
  recommendation: string
  investment_amount?: number
  status: string
  generated_at: string
}

interface DashboardStats {
  total_workflows: number
  completed_workflows: number
  success_rate: number
  average_duration_minutes: number
  companies_analyzed: number
  total_investment_amount: number
  memos_generated: number
}

export default function ModernDashboard() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [portfolioStats, setPortfolioStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Debug AI context
  const { openAI } = useAI()
  
  const testAIContext = () => {
    console.log('🔵 Test button clicked!')
    console.log('🔵 openAI function type:', typeof openAI)
    try {
      openAI({
        projectType: 'open',
        projectName: 'Test Dashboard',
        mode: 'sidebar'
      })
      console.log('🔵 openAI called successfully from test button')
    } catch (error) {
      console.error('🔴 Test button openAI error:', error)
    }
  }

  useEffect(() => {
    const loadDashboardData = () => {
      try {
        const allCompanies = getAllCompanies()
        const stats = getPortfolioStats()
        
        setCompanies(allCompanies)
        setPortfolioStats(stats)
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      running: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      approved: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800'
    }
    return colors[status.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              📊 Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Portfolio Overview & Deal Management
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button 
              onClick={() => window.location.href = '/companies/new'}
              className="bg-blue-600 hover:bg-blue-700 text-sm"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add Company</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <Button 
              onClick={() => window.location.href = '/dealflow'}
              variant="outline"
              size="sm"
              className="text-sm"
            >
              <Briefcase className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Deal Pipeline</span>
              <span className="sm:hidden">Deals</span>
            </Button>
            <ChatWithAIButton 
              projectType="open"
              projectName="Dashboard Overview"
            />
            <Button 
              onClick={testAIContext}
              className="bg-red-600 hover:bg-red-700 text-white text-sm"
              size="sm"
            >
              🔧 Test AI
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Portfolio Companies</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {portfolioStats?.total_companies || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">
                  {portfolioStats?.sectors?.length || 0} sectors
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Deals</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {portfolioStats?.active_deals || 0}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <Target className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm text-gray-600">
                  {portfolioStats?.invested_companies || 0} invested
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total ARR</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(portfolioStats?.total_arr || 0)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <Users className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-sm text-gray-600">
                  {portfolioStats?.total_employees || 0} employees
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Investment</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(portfolioStats?.total_investment || 0)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-sm text-gray-600">
                  {portfolioStats?.average_ownership?.toFixed(1) || 0}% avg ownership
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Portfolio</TabsTrigger>
            <TabsTrigger value="memos" className="text-xs sm:text-sm py-2">Pipeline</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2">Analytics</TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Portfolio Companies
                  </CardTitle>
                  <Button 
                    onClick={() => window.location.href = '/companies/new'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Company
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {companies.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No companies yet</h3>
                    <p className="text-gray-600 mb-6">Add your first portfolio company to get started.</p>
                    <Button 
                      onClick={() => window.location.href = '/companies/new'}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Company
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {companies.map((company) => (
                      <Card key={company.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                {company.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{company.name}</h3>
                                <p className="text-sm text-gray-600">{company.sector}</p>
                              </div>
                            </div>
                            <Badge 
                              className={
                                company.deal_status === 'invested' ? 'bg-green-100 text-green-800' :
                                company.deal_status === 'term_sheet' ? 'bg-blue-100 text-blue-800' :
                                company.deal_status === 'due_diligence' ? 'bg-yellow-100 text-yellow-800' :
                                company.deal_status === 'screening' ? 'bg-purple-100 text-purple-800' :
                                company.deal_status === 'sourcing' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }
                            >
                              {company.deal_status.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Investment:</span>
                              <span className="font-medium">{formatCurrency(company.investment.investment_amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Valuation:</span>
                              <span className="font-medium">{formatCurrency(company.investment.valuation)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">ARR:</span>
                              <span className="font-medium">{formatCurrency(company.metrics.arr)}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Button 
                              className="flex-1 text-xs"
                              size="sm"
                              onClick={() => window.location.href = `/portfolio/${company.id}`}
                            >
                              View Details
                            </Button>
                            <Button 
                              variant="outline" 
                              className="text-xs"
                              size="sm"
                              onClick={() => window.location.href = `/portfolio/${company.id}/deal`}
                            >
                              Deal Page
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Investment Memos Tab */}
          <TabsContent value="memos" className="space-y-6">
            <PortfolioTable />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Deal Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Portfolio Success Rate</span>
                      <span className="font-semibold">
                        {portfolioStats?.total_companies > 0 
                          ? ((portfolioStats?.invested_companies / portfolioStats?.total_companies) * 100).toFixed(1)
                          : 0
                        }%
                      </span>
                    </div>
                    <Progress 
                      value={portfolioStats?.total_companies > 0 
                        ? (portfolioStats?.invested_companies / portfolioStats?.total_companies) * 100
                        : 0
                      } 
                      className="h-2" 
                    />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average Ownership</span>
                      <span className="font-semibold">{portfolioStats?.average_ownership?.toFixed(1) || 0}%</span>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Recent Activity</h4>
                      <div className="space-y-2">
                        {companies.slice(0, 3).map((company) => (
                          <div key={company.id} className="flex items-center justify-between text-sm">
                            <span>{company.name}</span>
                            <Badge className={getStatusBadge(company.deal_status)} variant="outline">
                              {company.deal_status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Portfolio Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {formatCurrency(portfolioStats?.total_valuation || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Total Portfolio Valuation</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {portfolioStats?.total_companies || 0}
                        </div>
                        <div className="text-xs text-gray-600">Companies</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {portfolioStats?.sectors?.length || 0}
                        </div>
                        <div className="text-xs text-gray-600">Sectors</div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => window.location.href = '/dealflow'}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Deal Pipeline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Button 
                onClick={() => window.open('/workflow', '_blank')}
                className="h-12 sm:h-16 flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4 sm:w-6 sm:h-6 mb-1" />
                <span className="hidden sm:inline">New Due Diligence</span>
                <span className="sm:hidden">DD</span>
              </Button>
              <Button 
                onClick={() => window.open('/dealflow', '_blank')}
                variant="outline" 
                className="h-12 sm:h-16 flex flex-col items-center justify-center text-xs sm:text-sm"
              >
                <Briefcase className="w-4 h-4 sm:w-6 sm:h-6 mb-1" />
                <span className="hidden sm:inline">Deal Pipeline</span>
                <span className="sm:hidden">Deals</span>
              </Button>
              <Button 
                onClick={() => window.open('/portfolio', '_blank')}
                variant="outline" 
                className="h-12 sm:h-16 flex flex-col items-center justify-center text-xs sm:text-sm"
              >
                <Users className="w-4 h-4 sm:w-6 sm:h-6 mb-1" />
                <span>Portfolio</span>
              </Button>
              <ChatWithAIButton 
                projectType="open"
                projectName="Dashboard Overview"
                className="h-12 sm:h-16 flex flex-col items-center justify-center text-xs sm:text-sm"
              />
            </div>
          </CardContent>
        </Card>
    </div>
  )
}