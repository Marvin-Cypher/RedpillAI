"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ChatWithAIButton } from '@/components/ai'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Search, 
  Filter, 
  Plus,
  Building2,
  Globe,
  Calendar,
  Users,
  // ExternalLink,
  // Edit,
  // Archive,
  MoreHorizontal,
  Eye,
  TrendingUp,
  Target
} from 'lucide-react'

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
  status: 'active' | 'archived' | 'prospect'
  deal_status?: string | null
  deal_stage?: string | null
  deal_id?: string | null
  created_at: string
  updated_at: string
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')

  // Start deal process for a company
  const handleStartDeal = async (companyId: string) => {
    try {
      // console.log('Starting deal process for company:', companyId)
      
      // First, get the current company data
      const getResponse = await fetch(`/api/companies/${companyId}`)
      if (!getResponse.ok) {
        throw new Error('Failed to fetch company data')
      }
      const currentCompany = await getResponse.json()
      
      // Create a new deal for this company
      const dealData = {
        company_id: companyId,
        stage: 'pre_seed', // Required field - investment stage
        status: 'planned', // Deal status (defaults to 'planned')
        valuation: null,
        round_size: null,
        our_investment: null,
        our_target: null,
        probability: 50,
        next_milestone: 'Initial screening',
        internal_notes: `Deal started for ${currentCompany.name}`
      }
      
      // Log what we're sending for debugging
      // console.log('Creating deal with data:', dealData)
      
      // Create the deal
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealData)
      })

      if (response.ok) {
        const result = await response.json()
        // console.log('Deal started successfully:', result)
        
        // Update local state to reflect the change
        setCompanies(prev => prev.map(c => 
          c.id === companyId 
            ? { ...c, deal_status: result.status || 'planned', deal_stage: result.stage || 'pre_seed', deal_id: result.id }
            : c
        ))
        
        // Show success message before navigating
        alert('Deal process started! Redirecting to deal pipeline...')
        
        // Navigate to deal pipeline
        setTimeout(() => {
          window.location.href = '/dealflow'
        }, 1000)
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        // console.error('Failed to start deal process:', response.status, errorData)
        alert(`Failed to start deal process: ${errorData.message || response.statusText}`)
      }
    } catch (error) {
      // console.error('Error starting deal:', error)
      alert('Error starting deal process. Please check your connection and try again.')
    }
  }

  // Load companies from backend
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await fetch('/api/companies')
        if (response.ok) {
          const data = await response.json()
          setCompanies(Array.isArray(data) ? data : data.companies || [])
        } else {
          setError('Failed to load companies')
        }
      } catch (_err) {
        setError('Network error loading companies')
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
                           (company.sector || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (company.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      if (selectedFilter === 'all') return matchesSearch
      if (selectedFilter === 'active') return matchesSearch && company.status === 'active'
      if (selectedFilter === 'prospect') return matchesSearch && company.status === 'prospect'
      if (selectedFilter === 'archived') return matchesSearch && company.status === 'archived'
      return matchesSearch && (company.company_type || '').toLowerCase() === selectedFilter.toLowerCase()
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'created_date': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'updated_date': return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case 'sector': return a.sector.localeCompare(b.sector)
        default: return 0
      }
    })

  const getCompanyTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'PRIVATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'PUBLIC': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'CRYPTO': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'prospect': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const _formatHeadquarters = (hq: string | { city?: string; country?: string } | undefined) => {
    if (!hq) return 'Not specified'
    if (typeof hq === 'string') return hq
    if (typeof hq === 'object') {
      const parts = [hq.city, hq.country].filter(Boolean)
      return parts.length > 0 ? parts.join(', ') : 'Not specified'
    }
    return 'Not specified'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              🏢 Companies
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all companies in your CRM system
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/companies/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
            </Link>
            <ChatWithAIButton 
              projectType="company"
              projectName="Company Management"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Companies</p>
                <p className="text-3xl font-bold text-foreground">{companies.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-3xl font-bold text-foreground">
                  {companies.filter(c => c.status === 'active').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prospects</p>
                <p className="text-3xl font-bold text-foreground">
                  {companies.filter(c => c.status === 'prospect').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <div className="h-4 w-4 bg-yellow-600 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sectors</p>
                <p className="text-3xl font-bold text-foreground">
                  {new Set(companies.map(c => c.sector)).size}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <div className="h-4 w-4 bg-purple-600 rounded-full" />
              </div>
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
                placeholder="Search companies, sectors, or descriptions..."
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
              <option value="active">Active</option>
              <option value="prospect">Prospects</option>
              <option value="archived">Archived</option>
              <option value="crypto">Crypto</option>
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-input rounded-lg text-sm bg-background"
            >
              <option value="name">Sort by Name</option>
              <option value="created_date">Created Date</option>
              <option value="updated_date">Updated Date</option>
              <option value="sector">Sector</option>
            </select>

            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Companies</CardTitle>
            <div className="text-sm text-muted-foreground">
              {filteredCompanies.length} of {companies.length} companies
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border border-border rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-6 w-16 bg-muted rounded" />
                    <div className="h-6 w-20 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4"
                variant="outline"
              >
                Retry
              </Button>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No companies found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm ? 'Try adjusting your search terms or filters.' : 'Add your first company to get started.'}
              </p>
              <Link href="/companies/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Company
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16"></TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Founded</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Deal Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCompanies.map((company) => (
                      <TableRow key={company.id} className="hover:bg-muted/50">
                        <TableCell>
                          {company.logo_url ? (
                            <img 
                              src={company.logo_url} 
                              alt={`${company.name} logo`}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {company.name.charAt(0)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {company.name}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {company.description.substring(0, 50)}...
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {company.sector}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCompanyTypeColor(company.company_type)}>
                            {company.company_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(company.status)}>
                            {company.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {company.founded_year || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {company.employee_count || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {company.deal_status ? (
                            <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                              {company.deal_status.replace(/_/g, ' ')}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">No deal</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Link href={`/portfolio/${company.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            {company.deal_status ? (
                              <Link href={`/dealflow`}>
                                <Button variant="outline" size="sm" className="bg-green-50 hover:bg-green-100 border-green-200">
                                  <TrendingUp className="w-4 h-4" />
                                </Button>
                              </Link>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleStartDeal(company.id)}
                                className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                                title="Start Deal Process"
                              >
                                <Target className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredCompanies.map((company) => (
                  <Card key={company.id} className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {company.logo_url ? (
                          <img 
                            src={company.logo_url} 
                            alt={`${company.name} logo`}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            {company.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <h3 className="font-medium text-foreground truncate">
                            {company.name}
                          </h3>
                          <Badge className={getStatusColor(company.status)}>
                            {company.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {company.description}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center">
                            <Building2 className="w-3 h-3 mr-1" />
                            {company.sector}
                          </div>
                          <div className="flex items-center">
                            <Badge className={getCompanyTypeColor(company.company_type)}>
                              {company.company_type}
                            </Badge>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Founded {company.founded_year || 'Unknown'}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {company.employee_count || 'Unknown'}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/portfolio/${company.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </Link>
                          {company.deal_status ? (
                            <Link href={`/dealflow`}>
                              <Button variant="outline" size="sm" className="bg-green-50 hover:bg-green-100 border-green-200">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Deal
                              </Button>
                            </Link>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStartDeal(company.id)}
                              className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                            >
                              <Target className="w-3 h-3 mr-1" />
                              Start
                            </Button>
                          )}
                          {company.website && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={company.website} target="_blank" rel="noopener noreferrer">
                                <Globe className="w-3 h-3 mr-1" />
                                Web
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}