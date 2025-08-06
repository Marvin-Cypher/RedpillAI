"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ChatWithAIButton } from '@/components/ai'
// import { getAllCompanies, Company } from '@/lib/companyDatabase'
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Building,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Plus,
  BarChart3,
  Briefcase
} from 'lucide-react'

interface PortfolioCompany {
  id: string // Company ID
  dealId: string // Deal ID for routing to deal pages
  name: string
  logo?: string
  sector: string
  stage: string
  founded_year: number
  headquarters: {
    city: string
    country: string
  }
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
    arr: number
    last_updated: string
  }
  health_score: 'healthy' | 'warning' | 'critical'
  tags: string[]
}

export default function PortfolioPage() {
  const [companies, setCompanies] = useState<PortfolioCompany[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [loading, setLoading] = useState(true)

  // Load portfolio companies (companies with deals) from backend
  useEffect(() => {
    const loadPortfolioCompanies = async () => {
      try {
        // Fetch all deals from backend
        const dealsResponse = await fetch('/api/deals')
        if (!dealsResponse.ok) throw new Error('Failed to fetch deals')
        const deals = await dealsResponse.json()

        // Fetch all companies
        const companiesResponse = await fetch('/api/companies')  
        if (!companiesResponse.ok) throw new Error('Failed to fetch companies')
        const allCompanies = await companiesResponse.json()

        // Filter companies that have deals and map to portfolio format
        const portfolioCompanies: PortfolioCompany[] = []
        const processedCompanyIds = new Set<string>() // Track processed companies to avoid duplicates
        
        for (const deal of deals) {
          const company = allCompanies.find((c: any) => c.id === deal.company_id)
          if (!company || processedCompanyIds.has(company.id)) continue
          
          processedCompanyIds.add(company.id)

          // Convert deal stage to round type for display
          const roundTypeMap: { [key: string]: string } = {
            'pre_seed': 'Pre-Seed',
            'seed': 'Seed',
            'series_a': 'Series A', 
            'series_b': 'Series B',
            'series_c': 'Series C',
            'series_d_plus': 'Series D+',
            'growth': 'Growth',
            'pre_ipo': 'Pre-IPO'
          }

          const portfolioCompany: PortfolioCompany = {
            id: company.id, // Use company ID for portfolio routing
            dealId: deal.id, // Deal ID for deal-specific routing
            name: company.name,
            logo: company.logo,
            sector: company.sector || 'Technology',
            stage: deal.stage,
            founded_year: company.founded_year || new Date().getFullYear(),
            headquarters: company.headquarters || { city: 'Unknown', country: 'Unknown' },
            investment: {
              round_type: roundTypeMap[deal.stage] || deal.stage,
              investment_amount: deal.our_investment || 0,
              valuation: deal.valuation || 0,
              ownership_percentage: deal.our_investment && deal.valuation ? 
                (deal.our_investment / deal.valuation) * 100 : 0,
              investment_date: deal.created_at || new Date().toISOString(),
              lead_partner: deal.lead_partner || 'TBD'
            },
            metrics: {
              revenue_current: company.metrics?.revenue_current || 0,
              revenue_growth: company.metrics?.revenue_growth || 0,
              burn_rate: company.metrics?.burn_rate || 0,
              runway_months: company.metrics?.runway_months || 12,
              employees: company.metrics?.employees || 0,
              arr: company.metrics?.arr || 0,
              last_updated: deal.updated_at || new Date().toISOString()
            },
            health_score: (company.metrics?.runway_months || 12) > 12 ? 'healthy' : 
                          (company.metrics?.runway_months || 12) > 6 ? 'warning' : 'critical',
            tags: [
              company.sector || 'Technology', 
              roundTypeMap[deal.stage] || deal.stage,
              deal.status === 'deal' ? 'Portfolio' : 'Pipeline'
            ]
          }

          portfolioCompanies.push(portfolioCompany)
        }

        console.log('✅ Loaded portfolio companies with deals:', portfolioCompanies.length)
        console.log('📊 Portfolio companies:', portfolioCompanies.map(c => ({ name: c.name, companyId: c.id, dealId: c.dealId })))
        setCompanies(portfolioCompanies)
      } catch (error) {
        console.error('❌ Error loading portfolio companies:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPortfolioCompanies()
  }, [])

  // Filter and sort companies
  const filteredCompanies = companies
    .filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           company.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           company.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      if (selectedFilter === 'all') return matchesSearch
      if (selectedFilter === 'healthy') return matchesSearch && company.health_score === 'healthy'
      if (selectedFilter === 'warning') return matchesSearch && company.health_score === 'warning'
      if (selectedFilter === 'critical') return matchesSearch && company.health_score === 'critical'
      return matchesSearch && company.sector.toLowerCase() === selectedFilter.toLowerCase()
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'investment_date': return new Date(b.investment.investment_date).getTime() - new Date(a.investment.investment_date).getTime()
        case 'revenue': return b.metrics.revenue_current - a.metrics.revenue_current
        case 'growth': return b.metrics.revenue_growth - a.metrics.revenue_growth
        default: return 0
      }
    })

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

  const getHealthScoreColor = (score: string) => {
    switch (score) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getHealthScoreIcon = (score: string) => {
    switch (score) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />
      case 'warning': return <AlertTriangle className="w-4 h-4" />
      case 'critical': return <AlertTriangle className="w-4 h-4" />
      default: return null
    }
  }

  const getTrendIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    )
  }

  // Calculate portfolio summary
  const totalInvestment = companies.reduce((sum, company) => sum + company.investment.investment_amount, 0)
  const totalValuation = companies.reduce((sum, company) => sum + company.investment.valuation * (company.investment.ownership_percentage / 100), 0)
  const avgGrowth = companies.reduce((sum, company) => sum + company.metrics.revenue_growth, 0) / (companies.length || 1)

  return (
      <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              🏢 Portfolio Companies
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage your investment portfolio
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/companies/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
            </Link>
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <ChatWithAIButton 
              projectType="company"
              projectName="Portfolio Overview"
            />
          </div>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Companies</p>
                <p className="text-3xl font-bold text-foreground">{companies.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invested</p>
                <p className="text-3xl font-bold text-foreground">{formatCurrency(totalInvestment)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
                <p className="text-3xl font-bold text-foreground">{formatCurrency(totalValuation)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Growth</p>
                <p className="text-3xl font-bold text-foreground">{formatPercentage(avgGrowth)}</p>
              </div>
              {getTrendIcon(avgGrowth)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search companies, sectors, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
            >
              <option value="all">All Companies</option>
              <option value="healthy">Healthy</option>
              <option value="warning">Watch List</option>
              <option value="critical">Critical</option>
              <option value="ai/ml">AI/ML</option>
              <option value="fintech">FinTech</option>
              <option value="healthtech">HealthTech</option>
              <option value="cleantech">CleanTech</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
            >
              <option value="name">Sort by Name</option>
              <option value="investment_date">Investment Date</option>
              <option value="revenue">Revenue</option>
              <option value="growth">Growth Rate</option>
            </select>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Company Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCompanies.map((company) => (
          <Card key={company.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    {company.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {company.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">{company.sector}</Badge>
                      <Badge variant="outline">{company.stage}</Badge>
                    </div>
                  </div>
                </div>
                <Badge className={getHealthScoreColor(company.health_score)}>
                  {getHealthScoreIcon(company.health_score)}
                  <span className="ml-1 capitalize">{company.health_score}</span>
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold">{formatCurrency(company.metrics.revenue_current)}</p>
                    {getTrendIcon(company.metrics.revenue_growth)}
                    <span className={`text-sm ${company.metrics.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(company.metrics.revenue_growth)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Runway</p>
                  <p className="font-semibold">{company.metrics.runway_months} months</p>
                </div>
              </div>

              {/* Investment Details */}
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Investment</p>
                    <p className="font-medium">{formatCurrency(company.investment.investment_amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ownership</p>
                    <p className="font-medium">{formatPercentage(company.investment.ownership_percentage)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lead Partner</p>
                    <p className="font-medium">{company.investment.lead_partner}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {company.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {company.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Updated {new Date(company.metrics.last_updated).toLocaleDateString()}
                </div>
                <div className="flex space-x-2">
                  <Link href={`/portfolio/${company.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/portfolio/${company.dealId}/deal`}>
                    <Button variant="outline" size="sm">
                      <Briefcase className="w-4 h-4 mr-1" />
                      View Deal
                    </Button>
                  </Link>
                  <ChatWithAIButton 
                    projectType="company"
                    projectName={company.name}
                    projectId={company.id}
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-muted rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCompanies.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No companies found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Try adjusting your search terms or filters.' : 'Add your first portfolio company to get started.'}
            </p>
            <Link href="/companies/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
      </div>
  )
}