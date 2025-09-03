'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ScatterChart, Scatter
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown,
  Brain, 
  Target,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Eye,
  Star,
  Activity,
  Shield,
  Zap,
  PieChart as PieChartIcon,
  BarChart3,
  Users,
  Globe,
  Briefcase
} from 'lucide-react'
import { 
  creationAPI, 
  PortfolioContext 
} from '@/lib/api/creations'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c']

interface PortfolioMetric {
  label: string
  value: string | number
  change?: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ReactNode
}

interface RiskAnalysis {
  level: 'low' | 'medium' | 'high'
  score: number
  factors: string[]
  recommendation: string
}

interface AIInsight {
  type: 'opportunity' | 'warning' | 'info'
  title: string
  description: string
  confidence: number
  symbols: string[]
}

export default function PortfolioIntelligence() {
  const [portfolioContext, setPortfolioContext] = useState<PortfolioContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSymbol, setSelectedSymbol] = useState<string>('')
  const [activeTab, setActiveTab] = useState('overview')

  const userId = 'default'

  useEffect(() => {
    loadPortfolioData()
  }, [])

  const loadPortfolioData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get recent creations to extract portfolio symbols
      const creations = await creationAPI.getUserCreations(userId, { limit: 100 })
      const symbols = [...new Set(creations.flatMap(c => c.symbols))].slice(0, 20)

      if (symbols.length > 0) {
        const portfolioData = await creationAPI.getPortfolioContextCreations(userId, symbols)
        setPortfolioContext(portfolioData)
        if (symbols.length > 0 && !selectedSymbol) {
          setSelectedSymbol(symbols[0])
        }
      } else {
        setPortfolioContext({
          portfolio_context: [],
          symbols_analyzed: [],
          total_creations: 0
        })
      }

    } catch (err) {
      console.error('Failed to load portfolio data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Mock data for demonstration (in real app this would come from AI analysis)
  const portfolioMetrics: PortfolioMetric[] = [
    {
      label: 'Total Value',
      value: '$284,750',
      change: '+12.4% YTD',
      trend: 'up',
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      label: 'Active Positions',
      value: portfolioContext?.portfolio_context?.length || 0,
      change: `${portfolioContext?.total_creations || 0} analyses`,
      trend: 'neutral',
      icon: <Target className="w-5 h-5" />
    },
    {
      label: 'Best Performer',
      value: 'NVDA',
      change: '+187.3% YTD',
      trend: 'up',
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      label: 'Risk Score',
      value: '7.2/10',
      change: 'Moderate risk',
      trend: 'neutral',
      icon: <Shield className="w-5 h-5" />
    }
  ]

  const riskAnalysis: RiskAnalysis = {
    level: 'medium',
    score: 7.2,
    factors: [
      'High concentration in technology sector (45%)',
      'Volatile growth stocks dominate portfolio',
      'Limited international diversification',
      'Strong historical performance momentum'
    ],
    recommendation: 'Consider adding defensive positions and international exposure to balance growth-heavy allocation.'
  }

  const aiInsights: AIInsight[] = [
    {
      type: 'opportunity',
      title: 'Sector Rotation Signal',
      description: 'Energy sector showing strong momentum with favorable technical indicators. Consider adding XLE or individual energy names.',
      confidence: 85,
      symbols: ['XLE', 'CVX', 'XOM']
    },
    {
      type: 'warning',
      title: 'Overweight Technology Risk',
      description: 'Portfolio has 45% allocation to technology. High correlation increases volatility during market downturns.',
      confidence: 92,
      symbols: ['AAPL', 'MSFT', 'GOOGL', 'NVDA']
    },
    {
      type: 'info',
      title: 'Earnings Season Impact',
      description: 'Next week: NVDA and MSFT earnings. Historical analysis shows 12% average move. Consider hedging strategies.',
      confidence: 78,
      symbols: ['NVDA', 'MSFT']
    }
  ]

  const sectorAllocation = [
    { name: 'Technology', value: 45, color: '#0088FE' },
    { name: 'Healthcare', value: 18, color: '#00C49F' },
    { name: 'Financial', value: 15, color: '#FFBB28' },
    { name: 'Consumer', value: 12, color: '#FF8042' },
    { name: 'Energy', value: 6, color: '#8884d8' },
    { name: 'Other', value: 4, color: '#82ca9d' }
  ]

  const performanceData = [
    { month: 'Jan', portfolio: 8.2, sp500: 5.1, nasdaq: 10.7 },
    { month: 'Feb', portfolio: -3.1, sp500: -2.8, nasdaq: -4.2 },
    { month: 'Mar', portfolio: 12.5, sp500: 7.3, nasdaq: 15.1 },
    { month: 'Apr', portfolio: -5.8, sp500: -3.2, nasdaq: -8.1 },
    { month: 'May', portfolio: 18.7, sp500: 12.4, nasdaq: 22.3 },
    { month: 'Jun', portfolio: 4.2, sp500: 2.8, nasdaq: 6.1 }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900">Loading Portfolio Intelligence</h2>
        <p className="text-gray-600 text-sm">Analyzing your investment data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <AlertTriangle className="w-16 h-16 text-red-500" />
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Unable to Load Portfolio</h2>
          <p className="text-gray-600 mt-1">{error}</p>
          <Button onClick={loadPortfolioData} className="mt-4">
            <Shield className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <span>Portfolio Intelligence</span>
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered insights and analysis for your investment portfolio
          </p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="secondary" className="text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            BETA
          </Badge>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {portfolioMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  {metric.change && (
                    <p className={`text-xs mt-1 flex items-center space-x-1 ${
                      metric.trend === 'up' ? 'text-green-600' : 
                      metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {metric.trend === 'up' && <ArrowUpRight className="w-3 h-3" />}
                      {metric.trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
                      <span>{metric.change}</span>
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${
                  metric.trend === 'up' ? 'bg-green-50 text-green-600' :
                  metric.trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {metric.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Performance Comparison</span>
            </CardTitle>
            <CardDescription>Portfolio vs benchmarks (Monthly returns %)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="portfolio" fill="#0088FE" name="Portfolio" />
                <Bar dataKey="sp500" fill="#00C49F" name="S&P 500" />
                <Bar dataKey="nasdaq" fill="#FFBB28" name="NASDAQ" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sector Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="w-5 h-5" />
              <span>Sector Allocation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sectorAllocation}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {sectorAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights and Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-purple-600" />
              <span>AI Insights</span>
            </CardTitle>
            <CardDescription>Machine learning powered portfolio analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiInsights.map((insight, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  insight.type === 'opportunity' ? 'border-green-200 bg-green-50' :
                  insight.type === 'warning' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <h4 className={`font-semibold ${
                      insight.type === 'opportunity' ? 'text-green-900' :
                      insight.type === 'warning' ? 'text-red-900' : 'text-blue-900'
                    }`}>
                      {insight.title}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {insight.confidence}% confidence
                    </Badge>
                  </div>
                  <p className={`text-sm mb-3 ${
                    insight.type === 'opportunity' ? 'text-green-800' :
                    insight.type === 'warning' ? 'text-red-800' : 'text-blue-800'
                  }`}>
                    {insight.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {insight.symbols.map((symbol, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {symbol}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-orange-600" />
              <span>Risk Analysis</span>
            </CardTitle>
            <CardDescription>Portfolio risk assessment and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Risk Level</span>
                <Badge className={`${
                  riskAnalysis.level === 'low' ? 'bg-green-100 text-green-800' :
                  riskAnalysis.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {riskAnalysis.level.toUpperCase()}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    riskAnalysis.level === 'low' ? 'bg-green-500' :
                    riskAnalysis.level === 'medium' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${riskAnalysis.score * 10}%` }}
                ></div>
              </div>
              <div className="text-right text-sm text-gray-600 mt-1">
                {riskAnalysis.score}/10
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="font-semibold text-gray-900">Risk Factors</h4>
              {riskAnalysis.factors.map((factor, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{factor}</p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Recommendation</h4>
              <p className="text-sm text-blue-800">{riskAnalysis.recommendation}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Holdings Analysis */}
      {portfolioContext?.portfolio_context && portfolioContext.portfolio_context.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="w-5 h-5" />
              <span>Holdings Analysis</span>
            </CardTitle>
            <CardDescription>
              Detailed analysis of your tracked symbols ({portfolioContext.total_creations} total analyses)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolioContext.portfolio_context.map((holding, index) => (
                <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">{holding.symbol}</h3>
                    <Badge variant="outline">{holding.total_creations} analyses</Badge>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(holding.by_type).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{type}</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Recent Analysis</p>
                    {holding.recent_analysis.slice(0, 2).map((analysis, i) => (
                      <div key={i} className="text-xs text-gray-600 flex items-center justify-between">
                        <span className="truncate">{analysis.title}</span>
                        {analysis.chart_url && <Eye className="w-3 h-3 ml-1" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}