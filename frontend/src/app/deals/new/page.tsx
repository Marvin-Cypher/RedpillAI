'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { getAllCompanies, updateCompany, Company } from '@/lib/companyDatabase'
import { 
  ArrowLeft,
  Briefcase,
  DollarSign,
  Calendar,
  User,
  Target,
  FileText,
  Loader2
} from 'lucide-react'

interface DealFormData {
  companyId: string
  investment_amount: number
  valuation: number
  round_type: string
  lead_partner: string
  investment_date: string
  ownership_percentage: number
  deal_status: 'sourcing' | 'screening' | 'due_diligence' | 'term_sheet' | 'invested' | 'passed'
  priority: 'high' | 'medium' | 'low'
  notes: string
}

export default function NewDealPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams?.get('companyId')
  
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [formData, setFormData] = useState<DealFormData>({
    companyId: companyId || '',
    investment_amount: 0,
    valuation: 0,
    round_type: '',
    lead_partner: '',
    investment_date: new Date().toISOString().split('T')[0],
    ownership_percentage: 0,
    deal_status: 'sourcing',
    priority: 'medium',
    notes: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const allCompanies = getAllCompanies()
    setCompanies(allCompanies)
    
    if (companyId) {
      const company = allCompanies.find(c => c.id === companyId)
      if (company) {
        setSelectedCompany(company)
        setFormData(prev => ({
          ...prev,
          companyId: company.id,
          round_type: company.stage,
          lead_partner: company.investment.lead_partner,
          investment_amount: company.investment.investment_amount,
          valuation: company.investment.valuation,
          ownership_percentage: company.investment.ownership_percentage,
          deal_status: company.deal_status,
          priority: company.priority
        }))
      }
    }
  }, [companyId])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCompanyChange = (newCompanyId: string) => {
    const company = companies.find(c => c.id === newCompanyId)
    if (company) {
      setSelectedCompany(company)
      setFormData(prev => ({
        ...prev,
        companyId: company.id,
        round_type: company.stage,
        lead_partner: company.investment.lead_partner,
        investment_amount: company.investment.investment_amount,
        valuation: company.investment.valuation,
        ownership_percentage: company.investment.ownership_percentage,
        deal_status: company.deal_status,
        priority: company.priority
      }))
    }
  }

  const calculateOwnership = () => {
    if (formData.investment_amount && formData.valuation) {
      const ownership = (formData.investment_amount / formData.valuation) * 100
      handleInputChange('ownership_percentage', Math.round(ownership * 10) / 10)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.companyId || !selectedCompany) {
      alert('Please select a company')
      return
    }

    setIsLoading(true)
    try {
      // Update company with new deal information
      const updatedCompany = updateCompany(selectedCompany.id, {
        investment: {
          round_type: formData.round_type,
          investment_amount: formData.investment_amount,
          valuation: formData.valuation,
          ownership_percentage: formData.ownership_percentage,
          investment_date: formData.investment_date,
          lead_partner: formData.lead_partner
        },
        deal_status: formData.deal_status,
        priority: formData.priority
      })

      if (updatedCompany) {
        // Redirect to the deal page
        router.push(`/portfolio/${selectedCompany.id}/deal`)
      } else {
        throw new Error('Failed to update company')
      }
    } catch (error) {
      console.error('Error creating deal:', error)
      alert('Failed to create deal. Please try again.')
    } finally {
      setIsLoading(false)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Deal
          </h1>
          <p className="text-gray-600">
            Set up investment terms and deal structure for a portfolio company
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Company Selection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Company *
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => handleCompanyChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Choose a company...</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} - {company.sector}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCompany && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                        {selectedCompany.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedCompany.name}</h3>
                        <p className="text-sm text-gray-600">{selectedCompany.sector} • {selectedCompany.stage}</p>
                        <p className="text-sm text-gray-500">{selectedCompany.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Investment Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Investment Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Investment Amount ($) *
                  </label>
                  <Input
                    type="number"
                    value={formData.investment_amount}
                    onChange={(e) => handleInputChange('investment_amount', parseInt(e.target.value) || 0)}
                    onBlur={calculateOwnership}
                    placeholder="2000000"
                    required
                  />
                  {formData.investment_amount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(formData.investment_amount)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Valuation ($) *
                  </label>
                  <Input
                    type="number"
                    value={formData.valuation}
                    onChange={(e) => handleInputChange('valuation', parseInt(e.target.value) || 0)}
                    onBlur={calculateOwnership}
                    placeholder="20000000"
                    required
                  />
                  {formData.valuation > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatCurrency(formData.valuation)}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ownership Percentage (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.ownership_percentage}
                    onChange={(e) => handleInputChange('ownership_percentage', parseFloat(e.target.value) || 0)}
                    placeholder="10.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-calculated based on investment amount and valuation
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Investment Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.investment_date}
                    onChange={(e) => handleInputChange('investment_date', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Round Type
                  </label>
                  <Input
                    value={formData.round_type}
                    onChange={(e) => handleInputChange('round_type', e.target.value)}
                    placeholder="e.g., Series A, Seed, Series B"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Partner
                  </label>
                  <Input
                    value={formData.lead_partner}
                    onChange={(e) => handleInputChange('lead_partner', e.target.value)}
                    placeholder="e.g., Sarah Chen"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deal Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Deal Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Notes
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any additional notes about this deal..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Deal Summary */}
          {selectedCompany && formData.investment_amount > 0 && formData.valuation > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-800">
                  <FileText className="w-5 h-5 mr-2" />
                  Deal Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formatCurrency(formData.investment_amount)}
                    </div>
                    <div className="text-sm text-blue-700">Investment</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formatCurrency(formData.valuation)}
                    </div>
                    <div className="text-sm text-blue-700">Valuation</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formData.ownership_percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-blue-700">Ownership</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formData.round_type || 'TBD'}
                    </div>
                    <div className="text-sm text-blue-700">Round</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
              disabled={isLoading || !formData.companyId || !selectedCompany}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Deal...
                </>
              ) : (
                'Create Deal'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}