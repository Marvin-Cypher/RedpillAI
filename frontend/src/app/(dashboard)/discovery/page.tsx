"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Search, 
  Building2, 
  Users, 
  FileText, 
  Newspaper,
  Loader2,
  ExternalLink,
  Plus,
  TrendingUp,
  MapPin,
  Calendar,
  DollarSign,
  ArrowRight,
  Sparkles
} from 'lucide-react'

interface CompanyResult {
  name: string
  url: string
  description: string
  matched_criteria: string[]
  confidence_score: number
  enriched_data: {
    founded_year: number
    headquarters: string
    employee_count: string
    total_funding: number
    latest_round: string
    investors: string[]
    sector: string
    revenue: number
    burn_rate: number
    runway_months: number
    website_traffic: number
    social_media_followers: number
    news_mentions: number
    market_cap?: number
    tvl?: number
    token_symbol?: string
  }
}

interface SearchResults {
  query: string
  total_results: number
  results: CompanyResult[]
  webset_id?: string
  credits_used: number
}

export default function DiscoveryPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('companies')
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set())
  const [isImporting, setIsImporting] = useState(false)

  // Handle tab changes
  const handleTabChange = (value: string) => {
    if (value === 'people') {
      router.push('/discovery/people')
      return
    }
    setActiveTab(value)
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const response = await fetch('/api/search/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 20
        }),
      })
      
      if (!response.ok) throw new Error('Search failed')
      const results = await response.json()
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleImportSelected = async () => {
    if (!searchResults || selectedResults.size === 0) return
    
    setIsImporting(true)
    try {
      const selectedCompanies = searchResults.results.filter(
        (result) => selectedResults.has(result.name)
      )
      
      const response = await fetch('/api/search/import-companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companies: selectedCompanies,
          source: 'exa_discovery_search',
          webset_id: searchResults.webset_id
        }),
      })
      
      if (!response.ok) throw new Error('Import failed')
      const result = await response.json()
      
      // Show success message or redirect
      console.log('Import successful:', result)
      setSelectedResults(new Set())
      
    } catch (error) {
      console.error('Import error:', error)
    } finally {
      setIsImporting(false)
    }
  }

  const toggleSelection = (companyName: string) => {
    const newSelection = new Set(selectedResults)
    if (newSelection.has(companyName)) {
      newSelection.delete(companyName)
    } else {
      newSelection.add(companyName)
    }
    setSelectedResults(newSelection)
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`
    return `$${amount}`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            <Sparkles className="inline-block w-6 h-6 mr-2 text-blue-600" />
            AI Discovery
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Find your perfect investment opportunities using AI-powered search
          </p>
        </div>
      </div>

      <div className="flex-1 p-6">
        {/* Search Interface */}
        <div className="max-w-4xl mx-auto">
          {/* Search Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-8">
            <TabsList className="grid w-full grid-cols-4 max-w-md">
              <TabsTrigger value="companies" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Companies
              </TabsTrigger>
              <TabsTrigger value="people" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                People
              </TabsTrigger>
              <TabsTrigger value="research" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Research
              </TabsTrigger>
              <TabsTrigger value="articles" className="flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                Articles
              </TabsTrigger>
            </TabsList>

            <TabsContent value="companies" className="mt-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Find your perfect portfolio companies
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Discover startups and companies that match your investment thesis
                </p>
                
                {/* Search Bar */}
                <div className="relative max-w-2xl mx-auto">
                  <div className="flex items-center border-2 border-red-500 rounded-full px-6 py-4 focus-within:border-red-600 bg-white shadow-lg">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Describe what you're looking for... (e.g., 'AI startups in Europe with Series A funding')"
                      className="flex-1 border-0 outline-none focus:outline-none focus:ring-0 text-lg placeholder-gray-500 bg-transparent"
                      style={{ border: 'none', boxShadow: 'none' }}
                    />
                    <Button 
                      onClick={handleSearch}
                      disabled={isSearching || !searchQuery.trim()}
                      className="ml-3 rounded-full px-6 py-2"
                    >
                      {isSearching ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ArrowRight className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Example Searches */}
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {[
                    "Fintech startups in Europe founded after 2020",
                    "AI companies with female founders",
                    "Crypto exchanges with >100 employees",
                    "Healthcare AI with FDA approval",
                    "Climate tech startups in Series B"
                  ].map((example) => (
                    <Button
                      key={example}
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery(example)}
                      className="text-xs hover:bg-red-50 hover:border-red-300"
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Search Results */}
          {searchResults && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">
                    {searchResults.total_results} companies found
                  </h3>
                  <p className="text-sm text-gray-600">
                    Query: "{searchResults.query}" • Credits used: {searchResults.credits_used}
                  </p>
                </div>
                {selectedResults.size > 0 && (
                  <Button 
                    onClick={handleImportSelected}
                    disabled={isImporting}
                    className="flex items-center gap-2"
                  >
                    {isImporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Import Selected ({selectedResults.size})
                  </Button>
                )}
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={selectedResults.size === searchResults.results.length && searchResults.results.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedResults(new Set(searchResults.results.map(r => r.name)))
                            } else {
                              setSelectedResults(new Set())
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Valuation</TableHead>
                      <TableHead>Revenue/ARR</TableHead>
                      <TableHead>Growth</TableHead>
                      <TableHead>Runway</TableHead>
                      <TableHead>LTV/CAC</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Lead Investor</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.results.map((company, index) => (
                      <TableRow 
                        key={company.name}
                        className={selectedResults.has(company.name) ? 'bg-blue-50' : ''}
                      >
                        <TableCell>
                          <Checkbox 
                            checked={selectedResults.has(company.name)}
                            onCheckedChange={() => toggleSelection(company.name)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start space-x-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {company.name}
                                </p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => window.open(company.url, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500 truncate max-w-xs">
                                {company.description}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {company.matched_criteria.slice(0, 2).map((criteria) => (
                                  <Badge key={criteria} variant="secondary" className="text-xs px-1 py-0">
                                    {criteria}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={company.confidence_score > 0.9 ? 'default' : 'secondary'} className="text-xs">
                            {Math.round(company.confidence_score * 100)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{company.enriched_data.headquarters}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900 font-medium">{company.enriched_data.company_stage}</div>
                          <div className="text-xs text-gray-500">{company.enriched_data.latest_round}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900 font-medium">{formatCurrency(company.enriched_data.post_money_valuation || company.enriched_data.total_funding)}</div>
                          <div className="text-xs text-gray-500">Post-money</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900 font-medium">{formatCurrency(company.enriched_data.arr || company.enriched_data.revenue)}</div>
                          <div className="text-xs text-gray-500">{company.enriched_data.arr ? 'ARR' : 'Revenue'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900 font-medium">{company.enriched_data.growth_rate ? (company.enriched_data.growth_rate * 100).toFixed(0) + '%' : 'N/A'}</div>
                          <div className="text-xs text-gray-500">MoM Growth</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{company.enriched_data.runway_months}mo</div>
                          <div className="text-xs text-gray-500">{formatCurrency(company.enriched_data.burn_rate)}/mo</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900 font-medium">{company.enriched_data.ltv_cac_ratio ? company.enriched_data.ltv_cac_ratio.toFixed(1) : 'N/A'}</div>
                          <div className="text-xs text-gray-500">Ratio</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900">{company.enriched_data.team_size || company.enriched_data.employee_count}</div>
                          <div className="text-xs text-gray-500">{company.enriched_data.engineering_ratio ? (company.enriched_data.engineering_ratio * 100).toFixed(0) + '% Eng' : 'Employees'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900 font-medium">{company.enriched_data.lead_investor || (company.enriched_data.investors && company.enriched_data.investors[0])}</div>
                          <div className="text-xs text-gray-500">
                            {company.enriched_data.investors && company.enriched_data.investors.length > 1 && `+${company.enriched_data.investors.length - 1} more`}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}