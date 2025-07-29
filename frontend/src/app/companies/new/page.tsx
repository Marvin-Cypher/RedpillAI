'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { addCompany, Company } from '@/lib/companyDatabase'
import { ChatWithAIButton } from '@/components/ai'
import { 
  ArrowLeft,
  Building2,
  Globe,
  Zap,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface CompanyFormData {
  name: string
  domain: string
  company_type: 'crypto' | 'traditional' | 'fintech' | 'ai' | 'saas'
  sector: string
  stage: string
  description: string
  headquarters: {
    city: string
    country: string
  }
  founded_year: number
  priority: 'high' | 'medium' | 'low'
  deal_status: 'sourcing' | 'screening' | 'due_diligence' | 'term_sheet' | 'invested' | 'passed'
}

export default function NewCompanyPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    domain: '',
    company_type: 'traditional',
    sector: '',
    stage: '',
    description: '',
    headquarters: {
      city: '',
      country: ''
    },
    founded_year: new Date().getFullYear(),
    priority: 'medium',
    deal_status: 'sourcing'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isEnrichingData, setIsEnrichingData] = useState(false)
  const [enrichedData, setEnrichedData] = useState<any>(null)

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof CompanyFormData] as object),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const enrichWithOpenBB = async () => {
    if (!formData.name || !formData.domain) {
      alert('Please provide company name and domain first')
      return
    }

    setIsEnrichingData(true)
    try {
      // Call the real OpenBB enrichment API
      const response = await fetch('http://localhost:8000/api/v1/companies/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo_token'}`
        },
        body: JSON.stringify({
          name: formData.name,
          domain: formData.domain,
          company_type: formData.company_type
        })
      })

      if (!response.ok) {
        throw new Error('Failed to enrich company data')
      }

      const data = await response.json()
      const enrichedData = data.enriched_data
      
      // Use the real enriched data structure
      const processedData = {
        sector: enrichedData.sector,
        stage: enrichedData.stage,
        description: enrichedData.description,
        headquarters: enrichedData.headquarters,
        founded_year: enrichedData.founded_year,
        employee_count: enrichedData.employee_count || enrichedData.metrics?.employees || 25,
        funding_total: enrichedData.funding_total,
        metrics: enrichedData.metrics,
        investment: enrichedData.investment,
        crypto_data: enrichedData.crypto_data,
        market_context: enrichedData.market_context,
        data_sources: enrichedData.data_sources
      }

      setEnrichedData(processedData)
      
      // Auto-fill form with real enriched data
      setFormData(prev => ({
        ...prev,
        sector: processedData.sector,
        stage: processedData.stage,
        description: processedData.description,
        headquarters: processedData.headquarters,
        founded_year: processedData.founded_year
      }))

      // Show enrichment summary with data sources
      const sourcesList = processedData.data_sources?.join(', ') || 'basic classification'
      const hasCrypto = processedData.crypto_data ? ` (${processedData.crypto_data.symbol} token found!)` : ''
      const enrichmentType = formData.company_type === 'crypto' ? 'crypto token' : 'business'
      alert(`✅ ${enrichmentType} data enriched with: ${sourcesList}${hasCrypto}`)
      
    } catch (error) {
      console.error('Error enriching data:', error)
      
      // Fallback to basic enrichment if API fails
      const basicEnrichment = {
        sector: formData.name.toLowerCase().includes('ai') ? 'AI/ML' : 
                formData.name.toLowerCase().includes('crypto') ? 'Blockchain/Crypto' :
                formData.name.toLowerCase().includes('fin') ? 'FinTech' : 'Technology',
        stage: 'Unknown',
        description: `${formData.name} is a company in the technology sector.`,
        headquarters: { city: 'Unknown', country: 'Unknown' },
        founded_year: null,
        metrics: {
          revenue_current: 0,
          revenue_growth: 0,
          burn_rate: 0,
          runway_months: 0,
          employees: 0,
          customers: 0,
          arr: 0,
          gross_margin: 0
        },
        investment: {
          round_type: 'Unknown',
          investment_amount: 0,
          valuation: 0,
          ownership_percentage: 0,
          investment_date: new Date().toISOString().split('T')[0],
          lead_partner: 'TBD'
        }
      }
      
      setEnrichedData(basicEnrichment)
      setFormData(prev => ({
        ...prev,
        ...basicEnrichment,
        headquarters: basicEnrichment.headquarters
      }))
      
      alert('⚠️ OpenBB enrichment failed, using basic classification. Try checking your backend connection.')
    } finally {
      setIsEnrichingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.domain) {
      alert('Please provide at least company name and domain')
      return
    }

    setIsLoading(true)
    try {
      const newCompany = addCompany({
        name: formData.name,
        domain: formData.domain,
        website: `https://${formData.domain}`,
        company_type: formData.company_type,
        sector: formData.sector || 'Technology',
        stage: formData.stage || 'Unknown',
        founded_year: formData.founded_year,
        headquarters: formData.headquarters,
        description: formData.description || `${formData.name} is a company in the ${formData.sector} sector.`,
        employee_count: enrichedData?.employee_count || 10,
        funding_total: enrichedData?.funding_total || 0,
        investment: enrichedData?.investment || {
          round_type: formData.stage || 'Unknown',
          investment_amount: 0,
          valuation: 0,
          ownership_percentage: 0,
          investment_date: new Date().toISOString().split('T')[0],
          lead_partner: 'TBD'
        },
        metrics: enrichedData?.metrics || {
          revenue_current: 0,
          revenue_growth: 0,
          burn_rate: 0,
          runway_months: 0,
          employees: 0,
          customers: 0,
          arr: 0,
          gross_margin: 0
        },
        deal_status: formData.deal_status,
        priority: formData.priority
      })

      router.push(`/portfolio/${newCompany.id}`)
    } catch (error) {
      console.error('Error creating company:', error)
      alert('Failed to create company. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <ChatWithAIButton
              projectType="company"
              projectName="New Company"
              projectId="new-company-form"
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Add New Company
          </h1>
          <p className="text-gray-600">
            Enter company name and domain, then use AI to enrich the data automatically
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Quantum AI Solutions"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain *
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      value={formData.domain}
                      onChange={(e) => handleInputChange('domain', e.target.value)}
                      placeholder="e.g., quantumai.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Type *
                </label>
                <select
                  value={formData.company_type}
                  onChange={(e) => handleInputChange('company_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="traditional">Traditional Tech - Stock/financial data</option>
                  <option value="crypto">Crypto/Blockchain - Token data from CoinGecko</option>
                  <option value="fintech">FinTech - Financial technology</option>
                  <option value="ai">AI/ML - Artificial intelligence</option>
                  <option value="saas">SaaS - Software as a Service</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {formData.company_type === 'crypto' 
                    ? '🪙 Will search for token data and crypto metrics'
                    : '📊 Will search for traditional business metrics'
                  }
                </p>
              </div>

              <div className="flex justify-center">
                <Button
                  type="button"
                  onClick={enrichWithOpenBB}
                  disabled={isEnrichingData || !formData.name || !formData.domain}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isEnrichingData ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enriching with AI...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Auto-Fill with OpenBB Data
                    </>
                  )}
                </Button>
              </div>

              {enrichedData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Check className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">
                      Data enriched successfully!
                    </span>
                  </div>
                  <p className="text-sm text-green-700">
                    Company information has been auto-populated. Review and edit as needed.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Details */}
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sector
                  </label>
                  <Input
                    value={formData.sector}
                    onChange={(e) => handleInputChange('sector', e.target.value)}
                    placeholder="e.g., AI/ML, FinTech, HealthTech"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stage
                  </label>
                  <Input
                    value={formData.stage}
                    onChange={(e) => handleInputChange('stage', e.target.value)}
                    placeholder="e.g., Series A, Seed, Series B"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Founded Year
                  </label>
                  <Input
                    type="number"
                    value={formData.founded_year}
                    onChange={(e) => handleInputChange('founded_year', parseInt(e.target.value))}
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <Input
                    value={formData.headquarters.city}
                    onChange={(e) => handleInputChange('headquarters.city', e.target.value)}
                    placeholder="e.g., San Francisco"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <Input
                    value={formData.headquarters.country}
                    onChange={(e) => handleInputChange('headquarters.country', e.target.value)}
                    placeholder="e.g., USA"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Status
                </label>
                <select
                  value={formData.deal_status}
                  onChange={(e) => handleInputChange('deal_status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sourcing">Sourcing</option>
                  <option value="screening">Screening</option>
                  <option value="due_diligence">Due Diligence</option>
                  <option value="term_sheet">Term Sheet</option>
                  <option value="invested">Invested</option>
                  <option value="passed">Passed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the company and what they do..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading || !formData.name || !formData.domain}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Company'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}