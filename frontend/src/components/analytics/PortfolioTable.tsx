'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Eye,
  MoreHorizontal,
  Calendar,
  DollarSign,
  FileText,
  ArrowUpDown
} from 'lucide-react'

interface InvestmentMemo {
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

interface WorkflowData {
  id: string
  workflow_id: string
  company_name: string
  status: string
  progress_percentage: number
  created_at: string
  completed_at?: string
}

interface PortfolioTableProps {
  className?: string
}

export function PortfolioTable({ className }: PortfolioTableProps) {
  const [memos, setMemos] = useState<InvestmentMemo[]>([])
  const [workflows, setWorkflows] = useState<WorkflowData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string>('generated_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'approved' | 'draft' | 'pending'>('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [memosRes, workflowsRes] = await Promise.all([
          fetch('http://localhost:8000/api/v1/workflows/memos?limit=50'),
          fetch('http://localhost:8000/api/v1/workflows/workflows?limit=50')
        ])

        if (memosRes.ok) {
          const memoData = await memosRes.json()
          setMemos(memoData || [])
        }

        if (workflowsRes.ok) {
          const workflowData = await workflowsRes.json()
          setWorkflows(workflowData.workflows || [])
        }
      } catch (error) {
        console.error('Error fetching portfolio data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200'
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toUpperCase()) {
      case 'PROCEED': return 'text-green-600 bg-green-50'
      case 'DECLINE': return 'text-red-600 bg-red-50'
      case 'DEFER': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation.toUpperCase()) {
      case 'PROCEED': return <TrendingUp className="w-4 h-4" />
      case 'DECLINE': return <TrendingDown className="w-4 h-4" />
      default: return <ArrowUpDown className="w-4 h-4" />
    }
  }

  const filteredMemos = memos.filter(memo => {
    const matchesSearch = memo.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         memo.memo_title.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (selectedFilter === 'all') return matchesSearch
    return matchesSearch && memo.status.toLowerCase() === selectedFilter
  })

  const sortedMemos = [...filteredMemos].sort((a, b) => {
    let aVal: any = a[sortField as keyof InvestmentMemo]
    let bVal: any = b[sortField as keyof InvestmentMemo]
    
    if (sortField === 'generated_at') {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Portfolio Analysis
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mt-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search companies or memos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </CardHeader>

      <CardContent>
        {sortedMemos.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolio data</h3>
            <p className="text-gray-600">Complete workflows to see investment analysis here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th 
                    className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('company_name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Company</span>
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('recommendation')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Recommendation</span>
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('investment_amount')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Investment</span>
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('overall_score')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Score</span>
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('generated_at')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="text-right py-3 px-2 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedMemos.map((memo) => (
                  <tr key={memo.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {memo.company_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{memo.company_name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{memo.memo_title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-sm font-medium ${getRecommendationColor(memo.recommendation)}`}>
                        {getRecommendationIcon(memo.recommendation)}
                        <span>{memo.recommendation}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <div>
                        {memo.investment_amount ? (
                          <>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(memo.investment_amount)}
                            </p>
                            {memo.valuation && (
                              <p className="text-sm text-gray-500">
                                {((memo.investment_amount / memo.valuation) * 100).toFixed(1)}% equity
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      {memo.overall_score ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-12 h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full"
                              style={{ width: `${(memo.overall_score / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{memo.overall_score.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-4 px-2">
                      <Badge className={getStatusColor(memo.status)}>
                        {memo.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(memo.generated_at)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-2 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {sortedMemos.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {sortedMemos.length} of {memos.length} memos
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}