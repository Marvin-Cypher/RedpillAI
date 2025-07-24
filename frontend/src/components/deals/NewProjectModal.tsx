'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Plus, 
  Upload, 
  FileText,
  Database,
  Search,
  Building,
  DollarSign,
  Users,
  Globe,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (projectData: any) => void
}

interface CompanyMatch {
  id: string
  name: string
  description: string
  sector: string
  website?: string
  funding_stage: string
  last_funding: string
  total_raised: string
  confidence: number
  logo_url?: string
}

// Mock company database for auto-matching
const mockCompanyDatabase: CompanyMatch[] = [
  {
    id: 'auto-1',
    name: 'Polygon Labs',
    description: 'Ethereum scaling and infrastructure development',
    sector: 'Infrastructure',
    website: 'polygon.technology',
    funding_stage: 'Series C',
    last_funding: '$450M',
    total_raised: '$1.2B',
    confidence: 95,
    logo_url: '🔷'
  },
  {
    id: 'auto-2', 
    name: 'Arbitrum Foundation',
    description: 'Layer 2 scaling solution for Ethereum',
    sector: 'Layer 2',
    website: 'arbitrum.io',
    funding_stage: 'Series B',
    last_funding: '$120M', 
    total_raised: '$300M',
    confidence: 92,
    logo_url: '🔵'
  },
  {
    id: 'auto-3',
    name: 'Chainlink Labs',
    description: 'Decentralized oracle network',
    sector: 'Infrastructure',
    website: 'chain.link',
    funding_stage: 'Series A',
    last_funding: '$32M',
    total_raised: '$68M', 
    confidence: 98,
    logo_url: '🔗'
  }
]

export function NewProjectModal({ isOpen, onClose, onCreateProject }: NewProjectModalProps) {
  const [currentStep, setCurrentStep] = useState<'method' | 'manual' | 'csv' | 'notion' | 'review'>('method')
  const [companyName, setCompanyName] = useState('')
  const [searchResults, setSearchResults] = useState<CompanyMatch[]>([])
  const [selectedCompany, setSelectedCompany] = useState<CompanyMatch | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])

  const handleCompanySearch = (name: string) => {
    setCompanyName(name)
    if (name.length > 2) {
      // Mock search - in real app would hit API
      const results = mockCompanyDatabase.filter(company =>
        company.name.toLowerCase().includes(name.toLowerCase())
      )
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setCsvFile(file)
      // Mock CSV parsing - in real app would parse actual CSV
      const mockData = [
        { company: 'Uniswap Labs', stage: 'Series B', amount: '165M', sector: 'DeFi' },
        { company: 'OpenSea', stage: 'Series C', amount: '300M', sector: 'NFT' },
        { company: 'Dune Analytics', stage: 'Series A', amount: '20M', sector: 'Analytics' }
      ]
      setCsvData(mockData)
      setCurrentStep('review')
    }
  }

  const handleCreateProject = () => {
    if (selectedCompany) {
      const newProject = {
        id: Date.now().toString(),
        company_name: selectedCompany.name,
        status: 'planned',
        stage: selectedCompany.funding_stage,
        round_size: selectedCompany.last_funding,
        sector: selectedCompany.sector,
        is_hot: false,
        conversations: [],
        document_count: 0,
        website: selectedCompany.website,
        description: selectedCompany.description
      }
      onCreateProject(newProject)
      onClose()
      resetModal()
    }
  }

  const resetModal = () => {
    setCurrentStep('method')
    setCompanyName('')
    setSearchResults([])
    setSelectedCompany(null)
    setCsvFile(null)
    setCsvData([])
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-dark-800 border-dark-600 max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-dark-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-white">
              Add New Project
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Step 1: Choose Method */}
          {currentStep === 'method' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium text-white mb-2">How would you like to add projects?</h3>
                <p className="text-gray-400 text-sm">Choose the method that works best for your workflow</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Manual Entry */}
                <Card 
                  className="cursor-pointer hover:border-redpill-600 transition-colors border-dark-600 bg-dark-700"
                  onClick={() => setCurrentStep('manual')}
                >
                  <CardContent className="p-6 text-center">
                    <Plus className="w-12 h-12 text-redpill-400 mx-auto mb-4" />
                    <h4 className="font-medium text-white mb-2">Manual Entry</h4>
                    <p className="text-sm text-gray-400">Add a single company with AI-powered enrichment</p>
                  </CardContent>
                </Card>

                {/* CSV Import */}
                <Card 
                  className="cursor-pointer hover:border-redpill-600 transition-colors border-dark-600 bg-dark-700"
                  onClick={() => setCurrentStep('csv')}
                >
                  <CardContent className="p-6 text-center">
                    <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <h4 className="font-medium text-white mb-2">CSV Import</h4>
                    <p className="text-sm text-gray-400">Bulk import with automatic company matching</p>
                  </CardContent>
                </Card>

                {/* Notion/CRM Integration */}
                <Card 
                  className="cursor-pointer hover:border-redpill-600 transition-colors border-dark-600 bg-dark-700"
                  onClick={() => setCurrentStep('notion')}
                >
                  <CardContent className="p-6 text-center">
                    <Database className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <h4 className="font-medium text-white mb-2">CRM Integration</h4>
                    <p className="text-sm text-gray-400">Sync with Notion, Airtable, or other CRMs</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 2: Manual Entry */}
          {currentStep === 'manual' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep('method')}
                  className="text-gray-400"
                >
                  ← Back
                </Button>
                <h3 className="text-lg font-medium text-white">Add Company Manually</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Company Name
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={companyName}
                      onChange={(e) => handleCompanySearch(e.target.value)}
                      placeholder="Search for company (e.g., Polygon, Arbitrum...)"
                      className="bg-dark-700 border-dark-600 text-white pl-10"
                    />
                  </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Found {searchResults.length} matches:</p>
                    {searchResults.map((company) => (
                      <Card
                        key={company.id}
                        className={cn(
                          "cursor-pointer transition-colors border-dark-600",
                          selectedCompany?.id === company.id 
                            ? "border-redpill-600 bg-redpill-900/20" 
                            : "hover:border-gray-500 bg-dark-700"
                        )}
                        onClick={() => setSelectedCompany(company)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="text-2xl">{company.logo_url}</div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-white">{company.name}</h4>
                                  <Badge variant="outline" className="text-xs bg-green-900/30 border-green-700 text-green-400">
                                    {company.confidence}% match
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-400 mb-2">{company.description}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <Building className="w-3 h-3" />
                                    <span>{company.sector}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <DollarSign className="w-3 h-3" />
                                    <span>{company.last_funding} raised</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Users className="w-3 h-3" />
                                    <span>{company.funding_stage}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Show button if company is selected OR if user typed a custom name */}
                {(selectedCompany || companyName.trim()) && (
                  <div className="pt-4 border-t border-dark-600">
                    <Button
                      onClick={() => {
                        if (selectedCompany) {
                          handleCreateProject()
                        } else if (companyName.trim()) {
                          // Create custom company
                          const newProject = {
                            id: Date.now().toString(),
                            company_name: companyName.trim(),
                            status: 'planned',
                            stage: 'Unknown',
                            round_size: 'TBD',
                            sector: 'Unknown',
                            is_hot: false,
                            conversations: [],
                            document_count: 0
                          }
                          onCreateProject(newProject)
                          onClose()
                          resetModal()
                        }
                      }}
                      className="redpill-button-primary w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add {selectedCompany ? selectedCompany.name : companyName} to Pipeline
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: CSV Import */}
          {currentStep === 'csv' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep('method')}
                  className="text-gray-400"
                >
                  ← Back
                </Button>
                <h3 className="text-lg font-medium text-white">Import from CSV</h3>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-dark-600 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-white font-medium mb-2">Upload your CSV file</p>
                  <p className="text-sm text-gray-400 mb-4">
                    We'll automatically match companies and enrich with market data
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload">
                    <Button variant="secondary" className="cursor-pointer">
                      Choose CSV File
                    </Button>
                  </label>
                </div>

                <div className="bg-dark-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-2">Expected CSV Format:</h4>
                  <div className="text-sm text-gray-300 font-mono bg-dark-800 p-3 rounded">
                    company_name,stage,amount,sector,notes<br />
                    "Polygon Labs","Series C","450M","Infrastructure","Ethereum scaling"<br />
                    "Arbitrum","Series B","120M","Layer 2","L2 solution"
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Notion Integration */}
          {currentStep === 'notion' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep('method')}
                  className="text-gray-400"
                >
                  ← Back
                </Button>
                <h3 className="text-lg font-medium text-white">CRM Integration</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Notion */}
                <Card className="border-dark-600 bg-dark-700">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-300" />
                      </div>
                      <h4 className="font-medium text-white">Notion</h4>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      Connect your Notion database to automatically sync deal flow
                    </p>
                    <Button variant="secondary" className="w-full">
                      Connect Notion
                    </Button>
                  </CardContent>
                </Card>

                {/* Airtable */}
                <Card className="border-dark-600 bg-dark-700">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                        <Database className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-medium text-white">Airtable</h4>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">
                      Import your existing deal flow from Airtable
                    </p>
                    <Button variant="secondary" className="w-full">
                      Connect Airtable
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 5: Review CSV Data */}
          {currentStep === 'review' && csvData.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentStep('csv')}
                  className="text-gray-400"
                >
                  ← Back
                </Button>
                <h3 className="text-lg font-medium text-white">Review Import ({csvData.length} companies)</h3>
              </div>

              <div className="space-y-3">
                {csvData.map((row, index) => (
                  <Card key={index} className="border-dark-600 bg-dark-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">{row.company}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
                            <span>{row.stage}</span>
                            <span>${row.amount}</span>
                            <span>{row.sector}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-900/30 border-green-700 text-green-400">
                          Ready to import
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                onClick={() => {
                  // Import all CSV data
                  csvData.forEach((row, index) => {
                    const newProject = {
                      id: (Date.now() + index).toString(),
                      company_name: row.company,
                      status: 'planned',
                      stage: row.stage,
                      round_size: `$${row.amount}`,
                      sector: row.sector,
                      is_hot: false,
                      conversations: [],
                      document_count: 0
                    }
                    onCreateProject(newProject)
                  })
                  onClose()
                  resetModal()
                }}
                className="redpill-button-primary w-full"
              >
                Import {csvData.length} Companies
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}