"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft,
  Building2,
  Globe,
  Save,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle
} from 'lucide-react'

interface CompanyFormData {
  name: string
  domain: string
}

export default function NewCompanyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    domain: ''
  })
  const [isEnriching, setIsEnriching] = useState(false)

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Company name is required')
      return
    }

    setLoading(true)
    setIsEnriching(true)
    setError(null)
    setSuccess(false)

    try {
      // Create company with AI enrichment - just name and domain
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          domain: formData.domain.trim() || undefined,
          enrich_with_ai: true // Flag to tell backend to use AI enrichment
        })
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess(true)
        setIsEnriching(false)
        
        // Wait a moment to show success, then redirect
        setTimeout(() => {
          router.push(`/companies`)
        }, 2000)
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create company' }))
        setError(errorData.message || 'Failed to create company')
        setIsEnriching(false)
      }
    } catch (err) {
      setError('Network error. Please try again.')
      setIsEnriching(false)
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = formData.name.trim().length > 0

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/companies">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Companies
            </Button>
          </Link>
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Building2 className="w-8 h-8 mr-3" />
            Add New Company
          </h1>
          <p className="text-muted-foreground mt-1">
            Just enter the company name and domain - AI will automatically enrich the rest! ✨
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-blue-500" />
              AI-Powered Company Creation
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter just the essentials - our AI will research and fill in all the details automatically.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Name */}
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., OpenAI, Anthropic, Chainlink"
                  className="pl-9"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Domain */}
            <div>
              <Label htmlFor="domain">Domain (Optional)</Label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                  placeholder="e.g., openai.com, anthropic.com"
                  className="pl-9"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Optional - helps AI find more accurate information
              </p>
            </div>

            {/* AI Enrichment Status */}
            {isEnriching && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      AI is researching {formData.name}...
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-200">
                      Gathering company information, financials, team details, and market data
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success State */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/20 dark:border-green-800">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Company created successfully!
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-200">
                      AI has enriched the company profile. Redirecting to companies list...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      Error creating company
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-200">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What AI Will Do */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              What our AI will research and add:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p>• Company description & industry</p>
                <p>• Founded year & headquarters</p>
                <p>• Employee count & funding info</p>
                <p>• Website & social media</p>
              </div>
              <div className="space-y-2">
                <p>• Company type (Public/Private/Crypto)</p>
                <p>• Financial metrics & performance</p>
                <p>• Leadership team & key people</p>
                <p>• Market position & competitors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <Link href="/companies">
            <Button variant="outline" disabled={loading}>
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={!isFormValid || loading}
            className="min-w-[180px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEnriching ? 'AI Researching...' : 'Creating...'}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Create with AI
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}