'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ChatWithAIButton } from '@/components/ai'
import { getAllCompanies, Company } from '@/lib/companyDatabase'
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
  id: string
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

// Mock portfolio data
const MOCK_PORTFOLIO: PortfolioCompany[] = [
  {
    id: 'quantum-ai',
    name: 'Quantum AI Solutions',
    sector: 'AI/ML',
    stage: 'Series A',
    founded_year: 2022,
    headquarters: { city: 'San Francisco', country: 'USA' },
    investment: {
      round_type: 'Series A',
      investment_amount: 2000000,
      valuation: 20000000,
      ownership_percentage: 10.0,
      investment_date: '2024-03-15',
      lead_partner: 'Sarah Chen'
    },
    metrics: {
      revenue_current: 180000,
      revenue_growth: 23.5,
      burn_rate: 180000,
      runway_months: 14,
      employees: 18,
      arr: 2160000,
      last_updated: '2025-01-15'
    },
    health_score: 'healthy',
    tags: ['AI', 'B2B', 'Hot deal']
  },
  {
    id: 'fintech-pro',
    name: 'FinTech Pro',
    sector: 'FinTech',
    stage: 'Series B',
    founded_year: 2021,
    headquarters: { city: 'New York', country: 'USA' },
    investment: {
      round_type: 'Series B',
      investment_amount: 5000000,
      valuation: 50000000,
      ownership_percentage: 8.5,
      investment_date: '2024-06-20',
      lead_partner: 'Mike Johnson'
    },
    metrics: {
      revenue_current: 450000,
      revenue_growth: 15.2,
      burn_rate: 280000,
      runway_months: 18,
      employees: 35,
      arr: 5400000,
      last_updated: '2025-01-10'
    },
    health_score: 'healthy',
    tags: ['FinTech', 'B2B', 'Growth']
  },
  {
    id: 'healthtech-analytics',
    name: 'HealthTech Analytics',
    sector: 'HealthTech',
    stage: 'Series A',
    founded_year: 2022,
    headquarters: { city: 'Boston', country: 'USA' },
    investment: {
      round_type: 'Series A',
      investment_amount: 3000000,
      valuation: 25000000,
      ownership_percentage: 12.0,
      investment_date: '2024-09-10',
      lead_partner: 'Alex Rodriguez'
    },
    metrics: {
      revenue_current: 95000,
      revenue_growth: -5.3,
      burn_rate: 220000,
      runway_months: 8,
      employees: 22,
      arr: 1140000,
      last_updated: '2025-01-08'
    },
    health_score: 'warning',
    tags: ['HealthTech', 'Analytics', 'Watch list']
  },
  {
    id: 'greentech-solutions',
    name: 'GreenTech Solutions',
    sector: 'CleanTech',
    stage: 'Seed',
    founded_year: 2023,
    headquarters: { city: 'Austin', country: 'USA' },
    investment: {
      round_type: 'Seed',
      investment_amount: 500000,
      valuation: 5000000,
      ownership_percentage: 10.0,
      investment_date: '2024-11-15',
      lead_partner: 'Sarah Chen'
    },
    metrics: {
      revenue_current: 25000,
      revenue_growth: 45.8,
      burn_rate: 85000,
      runway_months: 12,
      employees: 8,
      arr: 300000,
      last_updated: '2025-01-12'
    },
    health_score: 'healthy',
    tags: ['CleanTech', 'Hardware', 'Early stage']
  }
]

export default function PortfolioPage() {
  const [companies, setCompanies] = useState<PortfolioCompany[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [loading, setLoading] = useState(true)

  // Load companies from centralized database
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesFromDb = await getAllCompanies()
        const portfolioCompanies: PortfolioCompany[] = companiesFromDb.map((company) => ({
          id: company.id,
          name: company.name,
          logo: company.logo,
          sector: company.sector,
          stage: company.stage,
          founded_year: company.founded_year || new Date().getFullYear(),
          headquarters: company.headquarters,
          investment: company.investment,
          metrics: {
            ...company.metrics,
            last_updated: new Date().toISOString()
          },
          health_score: company.metrics.runway_months > 12 ? 'healthy' : 
                        company.metrics.runway_months > 6 ? 'warning' : 'critical',
          tags: [company.sector, company.stage, company.priority === 'high' ? 'Hot deal' : 'Standard']
        }))
        setCompanies(portfolioCompanies)
      } catch (error) {
        console.error('Error loading companies:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCompanies()
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
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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
  const avgGrowth = companies.reduce((sum, company) => sum + company.metrics.revenue_growth, 0) / companies.length

  return (
      <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🏢 Portfolio Companies
            </h1>
            <p className="text-gray-600 mt-1">
              Monitor and manage your investment portfolio
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/companies/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
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
                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                <p className="text-3xl font-bold text-gray-900">{companies.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invested</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalInvestment)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalValuation)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Growth</p>
                <p className="text-3xl font-bold text-gray-900">{formatPercentage(avgGrowth)}</p>
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
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
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
              className="px-3 py-2 border rounded-lg text-sm"
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
              className="px-3 py-2 border rounded-lg text-sm"
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
                    <CardTitle className="text-lg font-semibold text-gray-900">
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
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold">{formatCurrency(company.metrics.revenue_current)}</p>
                    {getTrendIcon(company.metrics.revenue_growth)}
                    <span className={`text-sm ${company.metrics.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercentage(company.metrics.revenue_growth)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Runway</p>
                  <p className="font-semibold">{company.metrics.runway_months} months</p>
                </div>
              </div>

              {/* Investment Details */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Investment</p>
                    <p className="font-medium">{formatCurrency(company.investment.investment_amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ownership</p>
                    <p className="font-medium">{formatPercentage(company.investment.ownership_percentage)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Lead Partner</p>
                    <p className="font-medium">{company.investment.lead_partner}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {company.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {company.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Updated {company.metrics.last_updated}
                </div>
                <div className="flex space-x-2">
                  <Link href={`/portfolio/${company.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/portfolio/${company.id}/deal`}>
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
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
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
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms or filters.' : 'Add your first portfolio company to get started.'}
            </p>
            <Link href="/companies/new">
              <Button className="bg-blue-600 hover:bg-blue-700">
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