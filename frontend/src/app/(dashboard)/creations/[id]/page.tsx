'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Calendar, Tag, Settings } from 'lucide-react'
import { creationAPI } from '@/lib/api'

interface ChartDisplayProps {
  chartUrl: string
  title: string
  onOpenInNewWindow: () => void
}

function ChartDisplay({ chartUrl, title, onOpenInNewWindow }: ChartDisplayProps) {
  const [chartContent, setChartContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadChart()
  }, [chartUrl])

  const loadChart = async () => {
    try {
      setLoading(true)
      setError(null)
      const filename = chartUrl.split('/').pop()
      if (!filename) {
        throw new Error('Invalid chart URL')
      }
      
      const response = await fetch(`/charts/${filename}`)
      if (!response.ok) {
        throw new Error(`Chart not found: ${filename}`)
      }
      
      const content = await response.text()
      setChartContent(content)
    } catch (err) {
      console.error('❌ Failed to load chart:', err)
      setError(err instanceof Error ? err.message : 'Failed to load chart')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Interactive Chart</h3>
        </div>
        <div className="p-8 text-center" style={{ height: '600px' }}>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading chart...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Interactive Chart</h3>
        </div>
        <div className="p-8 text-center" style={{ height: '600px' }}>
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-red-500 mb-4 text-4xl">📊</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadChart}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Interactive Chart</h3>
        <button
          onClick={onOpenInNewWindow}
          className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Open in New Window
        </button>
      </div>
      <div 
        className="relative" 
        style={{ height: '600px', backgroundColor: '#000' }}
        dangerouslySetInnerHTML={{ __html: chartContent }}
      />
    </div>
  )
}

interface Creation {
  creation_id: string
  title: string
  description: string
  creation_type: 'chart' | 'analysis' | 'table' | 'research'
  category: string
  symbols: string[]
  sectors: string[]
  created_at: string
  openbb_tool: string
  openbb_module: string
  parameters: any
  chart_url?: string
  web_url?: string
  priority: string
  tags: string[]
  summary?: string
  key_insights: string[]
  data: any
}

export default function CreationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [creation, setCreation] = useState<Creation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const creationId = params.id as string

  useEffect(() => {
    loadCreation()
  }, [creationId])

  const loadCreation = async () => {
    try {
      setLoading(true)
      const data = await creationAPI.getCreationDetail('default', creationId)
      setCreation(data)
    } catch (err) {
      console.error('❌ Failed to load creation:', err)
      setError('Failed to load creation')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chart': return 'bg-blue-100 text-blue-800'
      case 'analysis': return 'bg-green-100 text-green-800'
      case 'table': return 'bg-purple-100 text-purple-800'
      case 'research': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const openInNewWindow = (chartUrl: string) => {
    // Extract filename from chart URL
    const filename = chartUrl.split('/').pop()
    if (filename) {
      window.open(`/chart-viewer/${filename}`, '_blank', 'width=1200,height=800')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading creation...</p>
        </div>
      </div>
    )
  }

  if (error || !creation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌</div>
          <p className="text-gray-600 mb-4">{error || 'Creation not found'}</p>
          <button
            onClick={() => router.push('/workspace')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Workspace
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/workspace')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workspace
          </button>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(creation.creation_type)}`}>
                  {creation.creation_type.toUpperCase()}
                </span>
                <span className="text-sm text-gray-500 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(creation.created_at)}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{creation.title}</h1>
              <p className="text-gray-600">{creation.description}</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart/Content Display */}
            {creation.creation_type === 'chart' && creation.chart_url && (
              <ChartDisplay 
                chartUrl={creation.chart_url}
                title={creation.title}
                onOpenInNewWindow={() => openInNewWindow(creation.chart_url!)}
              />
            )}

            {/* Key Insights */}
            {creation.key_insights && creation.key_insights.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Key Insights</h3>
                <ul className="space-y-2">
                  {creation.key_insights.map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Summary */}
            {creation.summary && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{creation.summary}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Symbols */}
            {creation.symbols && creation.symbols.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Symbols</h4>
                <div className="flex flex-wrap gap-2">
                  {creation.symbols.map((symbol) => (
                    <span key={symbol} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {creation.tags && creation.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Tag className="w-4 h-4 mr-1" />
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {creation.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Settings className="w-4 h-4 mr-1" />
                Technical Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tool:</span>
                  <span className="text-gray-900">{creation.openbb_tool}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Module:</span>
                  <span className="text-gray-900">{creation.openbb_module}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Category:</span>
                  <span className="text-gray-900">{creation.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Priority:</span>
                  <span className="text-gray-900 capitalize">{creation.priority}</span>
                </div>
              </div>
            </div>

            {/* Parameters */}
            {creation.parameters && Object.keys(creation.parameters).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Parameters</h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(creation.parameters).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-500 capitalize">{key.replace('_', ' ')}:</span>
                      <span className="text-gray-900 text-right ml-2">
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}