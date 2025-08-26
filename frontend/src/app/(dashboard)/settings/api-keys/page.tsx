"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'react-hot-toast'
import { Copy, Eye, EyeOff, ExternalLink, TestTube, Check, X, Clock, Info, Loader2 } from 'lucide-react'
import ContentSection from "../components/content-section"

const API_BASE = 'http://localhost:8000/api/v1'

interface APIKeyConfig {
  name: string
  key: string
  description: string
  url: string
  required: boolean
  testEndpoint?: string
  placeholder?: string
  status?: 'valid' | 'invalid' | 'untested'
  category: 'ai' | 'market' | 'news' | 'other'
}

const API_CONFIGS: APIKeyConfig[] = [
  // AI Services
  {
    name: 'OpenAI',
    key: 'OPENAI_API_KEY',
    description: 'Required for AI-powered natural language understanding and command processing',
    url: 'https://platform.openai.com/api-keys',
    required: true,
    testEndpoint: 'https://api.openai.com/v1/models',
    placeholder: 'sk-...',
    category: 'ai'
  },
  {
    name: 'Redpill AI',
    key: 'REDPILL_API_KEY',
    description: 'Primary AI provider with specialized VC prompts and investment intelligence',
    url: 'https://redpill.ai/api-keys',
    required: false,
    placeholder: 'rp_...',
    category: 'ai'
  },
  
  // Market Data Services
  {
    name: 'Alpha Vantage',
    key: 'ALPHA_VANTAGE_API_KEY',
    description: 'Stock prices, financial statements, earnings data, and technical indicators',
    url: 'https://www.alphavantage.co/support/#api-key',
    required: false,
    testEndpoint: 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=',
    placeholder: 'DEMO_KEY (or your real key)',
    category: 'market'
  },
  {
    name: 'Financial Modeling Prep',
    key: 'FMP_API_KEY',
    description: 'Comprehensive financial data, company metrics, SEC filings, and valuations',
    url: 'https://financialmodelingprep.com/developer/docs#authentication',
    required: false,
    testEndpoint: 'https://financialmodelingprep.com/api/v3/profile/AAPL?apikey=',
    placeholder: 'demo (or your real key)',
    category: 'market'
  },
  {
    name: 'Polygon.io',
    key: 'POLYGON_API_KEY',
    description: 'Real-time and historical market data for stocks, options, forex, and crypto',
    url: 'https://polygon.io/dashboard/api-keys',
    required: false,
    testEndpoint: 'https://api.polygon.io/v1/last/stocks/AAPL?apiKey=',
    placeholder: 'your-polygon-key',
    category: 'market'
  },
  {
    name: 'CoinGecko Pro',
    key: 'COINGECKO_API_KEY',
    description: 'Enhanced crypto data with higher rate limits and priority support',
    url: 'https://www.coingecko.com/en/api/pricing',
    required: false,
    placeholder: 'CG-...',
    category: 'market'
  },
  
  // News & Intelligence
  {
    name: 'News API',
    key: 'NEWS_API_KEY',
    description: 'Latest financial news, market updates, and sentiment analysis',
    url: 'https://newsapi.org/register',
    required: false,
    testEndpoint: 'https://newsapi.org/v2/everything?q=bitcoin&apiKey=',
    placeholder: 'your-news-api-key',
    category: 'news'
  },
  {
    name: 'Google Search API',
    key: 'GOOGLE_API_KEY',
    description: 'Company research, news search, and real-time information gathering',
    url: 'https://console.developers.google.com/apis',
    required: false,
    placeholder: 'your-google-api-key',
    category: 'news'
  },
  {
    name: 'Google Search Engine ID',
    key: 'GOOGLE_CSE_ID',
    description: 'Custom Search Engine ID for Google Search API integration',
    url: 'https://programmablesearchengine.google.com/',
    required: false,
    placeholder: 'your-search-engine-id',
    category: 'news'
  },
  
  // Other Services
  {
    name: 'OpenBB Personal Access Token',
    key: 'OPENBB_PAT',
    description: 'Access to OpenBB Platform with 350+ financial data providers',
    url: 'https://my.openbb.co/app/platform/pat',
    required: false,
    placeholder: 'your-openbb-pat',
    category: 'other'
  }
]

export default function APIKeysPage() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [testResults, setTestResults] = useState<Record<string, 'valid' | 'invalid' | 'untested'>>({})
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [envContent, setEnvContent] = useState('')
  const [apiConfigs, setApiConfigs] = useState<APIKeyConfig[]>(API_CONFIGS)
  const [loadingSchema, setLoadingSchema] = useState(true)

  useEffect(() => {
    // Load API schema and existing keys from backend
    const loadData = async () => {
      try {
        // Load API schema
        const schemaResponse = await fetch(`${API_BASE}/config/api-keys/schema`)
        if (schemaResponse.ok) {
          const schema = await schemaResponse.json()
          
          // Transform backend schema to frontend format
          const configs: APIKeyConfig[] = []
          Object.entries(schema.categories).forEach(([category, info]: [string, any]) => {
            info.keys.forEach((key: any) => {
              configs.push({
                name: key.name,
                key: key.key,
                description: key.description,
                url: key.url,
                required: key.required,
                placeholder: key.placeholder,
                category: category as 'ai' | 'market' | 'news' | 'other'
              })
            })
          })
          setApiConfigs(configs)
        }

        // Load existing API keys
        const keysResponse = await fetch(`${API_BASE}/config/api-keys/current`)
        if (keysResponse.ok) {
          const data = await keysResponse.json()
          // Transform backend format to frontend format
          const keys: Record<string, string> = {}
          Object.entries(data.configured_keys).forEach(([key, info]: [string, any]) => {
            if (info.configured && info.masked_value) {
              keys[key] = info.masked_value
            }
          })
          setApiKeys(keys)
        }
      } catch (error) {
        console.error('Failed to load data from backend:', error)
        // Fallback to localStorage for keys
        const savedKeys = localStorage.getItem('redpill_api_keys')
        if (savedKeys) {
          try {
            setApiKeys(JSON.parse(savedKeys))
          } catch (e) {
            console.error('Failed to parse saved API keys:', e)
          }
        }
      } finally {
        setLoadingSchema(false)
      }
    }
    
    loadData()
  }, [])

  useEffect(() => {
    // Update env content when keys change
    setEnvContent(generateEnvFile())
  }, [apiKeys])

  const handleKeyChange = (key: string, value: string) => {
    const newKeys = { ...apiKeys, [key]: value }
    setApiKeys(newKeys)
    
    // Clear test result when key changes
    setTestResults(prev => ({ ...prev, [key]: 'untested' }))
  }

  const toggleKeyVisibility = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const saveKeys = async () => {
    try {
      // Save to backend
      const response = await fetch(`${API_BASE}/config/api-keys/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_keys: apiKeys
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Also save to localStorage as backup
          localStorage.setItem('redpill_api_keys', JSON.stringify(apiKeys))
          toast.success('API keys saved successfully!')
          
          // Update env content with backend generated version
          if (data.env_content) {
            setEnvContent(data.env_content)
          }
        } else {
          throw new Error(data.message || 'Save failed')
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error(`Failed to save API keys: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testApiKey = async (config: APIKeyConfig) => {
    if (!config.testEndpoint) {
      toast.error(`No test endpoint available for ${config.name}`)
      return
    }

    const key = apiKeys[config.key]
    if (!key) {
      toast.error('Please enter an API key first')
      return
    }

    setLoading(prev => ({ ...prev, [config.key]: true }))
    
    try {
      const response = await fetch(config.testEndpoint + key, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (response.ok) {
        setTestResults(prev => ({ ...prev, [config.key]: 'valid' }))
        toast.success(`${config.name} API key is valid!`)
      } else {
        setTestResults(prev => ({ ...prev, [config.key]: 'invalid' }))
        toast.error(`${config.name} API key is invalid`)
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [config.key]: 'invalid' }))
      toast.error(`Failed to test ${config.name} API key`)
    } finally {
      setLoading(prev => ({ ...prev, [config.key]: false }))
    }
  }

  const generateEnvFile = () => {
    const lines = [
      '# RedPill AI Terminal Configuration',
      '# Generated by RedPill Settings UI',
      `# Created: ${new Date().toISOString()}`,
      '',
      '# === REQUIRED FOR CLI ===',
      ''
    ]

    // Required keys first
    apiConfigs.filter(config => config.required).forEach(config => {
      const value = apiKeys[config.key]
      lines.push(`# ${config.name}: ${config.description}`)
      if (value) {
        lines.push(`${config.key}=${value}`)
      } else {
        lines.push(`# ${config.key}=your-api-key-here`)
      }
      lines.push('')
    })

    lines.push('# === OPTIONAL ENHANCEMENTS ===')
    lines.push('')

    // Optional keys by category
    const categories = ['ai', 'market', 'news', 'other']
    categories.forEach(category => {
      const configs = apiConfigs.filter(config => config.category === category && !config.required)
      if (configs.length > 0) {
        lines.push(`# ${category.toUpperCase()} Services`)
        configs.forEach(config => {
          const value = apiKeys[config.key]
          if (value) {
            lines.push(`${config.key}=${value}`)
          } else {
            lines.push(`# ${config.key}=your-api-key-here`)
          }
        })
        lines.push('')
      }
    })

    lines.push('# === REDPILL BACKEND ===')
    lines.push('# REDPILL_API_URL=http://localhost:8000/api/v1')
    lines.push('')
    lines.push('# === ADDITIONAL CONFIG ===')
    lines.push('# NODE_ENV=development')
    lines.push('# LOG_LEVEL=info')

    return lines.join('\n')
  }

  const copyEnvFile = () => {
    navigator.clipboard.writeText(envContent)
    toast.success('.env file content copied to clipboard!')
  }

  const downloadEnvFile = () => {
    const blob = new Blob([envContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '.env'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('.env file downloaded!')
  }

  const getStatusIcon = (key: string) => {
    const status = testResults[key]
    switch (status) {
      case 'valid':
        return <Check className="h-4 w-4 text-green-500" />
      case 'invalid':
        return <X className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const renderApiKeySection = (category: string, title: string, description: string) => {
    const configs = apiConfigs.filter(config => config.category === category)
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        
        <div className="grid gap-6">
          {configs.map(config => (
            <Card key={config.key}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {config.name}
                      {config.required && <Badge variant="destructive">Required</Badge>}
                      {getStatusIcon(config.key)}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {config.description}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(config.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Get Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor={config.key} className="text-xs">API Key</Label>
                    <div className="relative">
                      <Input
                        id={config.key}
                        type={showKeys[config.key] ? "text" : "password"}
                        placeholder={config.placeholder}
                        value={apiKeys[config.key] || ''}
                        onChange={(e) => handleKeyChange(config.key, e.target.value)}
                        className="font-mono text-xs pr-8"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-6 w-6 p-0"
                        onClick={() => toggleKeyVisibility(config.key)}
                      >
                        {showKeys[config.key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  {config.testEndpoint && (
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testApiKey(config)}
                        disabled={loading[config.key] || !apiKeys[config.key]}
                      >
                        {loading[config.key] ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <TestTube className="h-3 w-3 mr-1" />
                            Test
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <ContentSection
      title="API Keys Configuration"
      desc="Configure API keys for RedPill AI Terminal. These keys enable enhanced functionality across CLI, web UI, and backend services."
      className="w-full lg:max-w-full"
    >
      {loadingSchema ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading API configuration...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            API keys are stored locally in your browser and used to generate your .env file. 
            Only OpenAI is required - other services enhance functionality but are optional.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="ai" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ai">AI Services</TabsTrigger>
            <TabsTrigger value="market">Market Data</TabsTrigger>
            <TabsTrigger value="news">News & Intel</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-6">
            {renderApiKeySection('ai', 'AI & Language Processing', 'Services for natural language understanding and AI-powered analysis')}
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            {renderApiKeySection('market', 'Market Data Providers', 'Real-time and historical financial data for stocks, crypto, and more')}
          </TabsContent>

          <TabsContent value="news" className="space-y-6">
            {renderApiKeySection('news', 'News & Intelligence', 'Latest market news, company research, and sentiment analysis')}
          </TabsContent>

          <TabsContent value="other" className="space-y-6">
            {renderApiKeySection('other', 'Other Services', 'Additional services and platform integrations')}
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Generated .env File
            </CardTitle>
            <CardDescription>
              Copy this content to your project's .env file or download it directly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={envContent}
              readOnly
              className="font-mono text-xs min-h-[200px]"
              placeholder="Configure API keys above to generate .env file content..."
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyEnvFile}>
                <Copy className="h-3 w-3 mr-1" />
                Copy to Clipboard
              </Button>
              <Button variant="outline" onClick={downloadEnvFile}>
                Download .env File
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            {Object.keys(apiKeys).filter(key => apiKeys[key]).length} API key{Object.keys(apiKeys).filter(key => apiKeys[key]).length !== 1 ? 's' : ''} configured
          </div>
          <Button onClick={saveKeys}>
            Save Configuration
          </Button>
        </div>
      </div>
      )}
    </ContentSection>
  )
}