'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Workflow {
  id: number
  workflow_id: string
  workflow_type: string
  company_name: string
  status: string
  progress_percentage: number
  created_at: string
  completed_at?: string
}

interface Memo {
  id: number
  workflow_id: string
  company_name: string
  memo_title: string
  recommendation: string
  investment_amount?: number
  valuation?: number
  overall_score?: number
  status: string
  generated_at: string
}

export function WorkflowHistory() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'workflows' | 'memos'>('workflows')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load workflows
      const workflowsResponse = await fetch('http://localhost:8000/api/v1/workflows/workflows')
      if (workflowsResponse.ok) {
        const workflowsData = await workflowsResponse.json()
        setWorkflows(workflowsData.workflows || [])
      }

      // Load memos
      const memosResponse = await fetch('http://localhost:8000/api/v1/workflows/memos')
      if (memosResponse.ok) {
        const memosData = await memosResponse.json()
        setMemos(memosData || [])
      }
    } catch (error) {
      console.error('Failed to load workflow data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">✅ Completed</Badge>
      case 'running': return <Badge className="bg-blue-100 text-blue-800">🔄 Running</Badge>
      case 'failed': return <Badge className="bg-red-100 text-red-800">❌ Failed</Badge>
      case 'pending': return <Badge className="bg-gray-100 text-gray-800">⏳ Pending</Badge>
      default: return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'PROCEED': return <Badge className="bg-green-100 text-green-800">✅ PROCEED</Badge>
      case 'DECLINE': return <Badge className="bg-red-100 text-red-800">❌ DECLINE</Badge>
      case 'DEFER': return <Badge className="bg-yellow-100 text-yellow-800">⏸️ DEFER</Badge>
      default: return <Badge className="bg-gray-100 text-gray-800">{recommendation}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading workflow history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📚 Workflow History
        </h1>
        <p className="text-gray-600">
          View saved workflows, market data, research, and investment memos
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 justify-center">
        <Button
          onClick={() => setSelectedTab('workflows')}
          variant={selectedTab === 'workflows' ? 'default' : 'outline'}
        >
          🔄 Workflows ({workflows.length})
        </Button>
        <Button
          onClick={() => setSelectedTab('memos')}
          variant={selectedTab === 'memos' ? 'default' : 'outline'}
        >
          📋 Investment Memos ({memos.length})
        </Button>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <Button onClick={loadData} variant="outline" size="sm">
          🔄 Refresh Data
        </Button>
      </div>

      {/* Workflows Tab */}
      {selectedTab === 'workflows' && (
        <div className="space-y-4">
          {workflows.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-600">No workflows found. Run a due diligence workflow to see data here.</p>
              </CardContent>
            </Card>
          ) : (
            workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{workflow.company_name}</CardTitle>
                      <p className="text-sm text-gray-600">{workflow.workflow_type}</p>
                    </div>
                    {getStatusBadge(workflow.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium">Progress</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${workflow.progress_percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{workflow.progress_percentage}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-gray-600">{formatDate(workflow.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Workflow ID</p>
                      <p className="text-xs text-gray-500 font-mono">{workflow.workflow_id.substring(0, 8)}...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Memos Tab */}
      {selectedTab === 'memos' && (
        <div className="space-y-4">
          {memos.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-600">No investment memos found. Complete a workflow to generate memos.</p>
              </CardContent>
            </Card>
          ) : (
            memos.map((memo) => (
              <Card key={memo.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{memo.company_name}</CardTitle>
                      <p className="text-sm text-gray-600">{memo.memo_title}</p>
                    </div>
                    {getRecommendationBadge(memo.recommendation)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium">Investment</p>
                      <p className="text-sm text-gray-600">{formatCurrency(memo.investment_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Valuation</p>
                      <p className="text-sm text-gray-600">{formatCurrency(memo.valuation)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      {getStatusBadge(memo.status)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Generated</p>
                      <p className="text-sm text-gray-600">{formatDate(memo.generated_at)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        // Simple memo download simulation
                        const memoContent = `Investment Memo: ${memo.company_name}\n\nRecommendation: ${memo.recommendation}\nInvestment: ${formatCurrency(memo.investment_amount)}\nValuation: ${formatCurrency(memo.valuation)}\n\nGenerated: ${formatDate(memo.generated_at)}\nWorkflow ID: ${memo.workflow_id}`
                        
                        const blob = new Blob([memoContent], { type: 'text/plain' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${memo.company_name}_Memo_${memo.id}.txt`
                        a.click()
                      }}
                    >
                      💾 Download
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        window.open(`http://localhost:8000/api/v1/workflows/workflows/${memo.workflow_id}`, '_blank')
                      }}
                    >
                      🔍 View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Summary Stats */}
      {(workflows.length > 0 || memos.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{workflows.length}</p>
                <p className="text-sm text-gray-600">Total Workflows</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {workflows.filter(w => w.status === 'completed').length}
                </p>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{memos.length}</p>
                <p className="text-sm text-gray-600">Memos Generated</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(memos.reduce((sum, memo) => sum + (memo.investment_amount || 0), 0))}
                </p>
                <p className="text-sm text-gray-600">Total Investment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}