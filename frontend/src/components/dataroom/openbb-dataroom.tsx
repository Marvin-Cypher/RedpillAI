"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity, 
  DollarSign,
  Percent,
  Globe,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface MarketData {
  symbol: string
  current_price: number
  change_percent: number
  volume_24h: number
  high_24h: number
  low_24h: number
  last_updated: string
}

interface PortfolioMetrics {
  total_value: number
  daily_change: number
  daily_change_percent: number
  assets: Array<{
    symbol: string
    allocation: number
    value: number
    change_percent: number
  }>
}

interface OpenBBDataroomProps {
  selectedProject?: any
  className?: string
}

export function OpenBBDataroom({ selectedProject, className }: OpenBBDataroomProps) {
  const [marketData, setMarketData] = useState<MarketData[]>([])
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState('overview')

  const openbbApiUrl = process.env.NEXT_PUBLIC_OPENBB_API_URL || 'http://localhost:8000/api/v1/market'

  useEffect(() => {
    fetchMarketData()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMarketData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchMarketData = async () => {
    setLoading(true)
    try {
      // Fetch major crypto data
      const symbols = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX']
      const marketPromises = symbols.map(async (symbol) => {
        try {
          const response = await fetch(`${openbbApiUrl}/crypto/${symbol}/price`)
          if (response.ok) {
            return await response.json()
          }
          return null
        } catch (error) {
          console.warn(`Failed to fetch ${symbol}:`, error)
          return null
        }
      })

      const results = await Promise.all(marketPromises)
      const validData = results.filter(Boolean)
      setMarketData(validData)

      // Calculate portfolio metrics (mock for now)
      if (validData.length > 0) {
        const totalValue = 1000000 // $1M portfolio
        const dailyChange = Math.random() * 20000 - 10000 // Random daily change
        
        setPortfolioMetrics({
          total_value: totalValue,
          daily_change: dailyChange,
          daily_change_percent: (dailyChange / totalValue) * 100,
          assets: validData.slice(0, 4).map((data, index) => ({
            symbol: data.symbol,
            allocation: [40, 30, 20, 10][index],
            value: totalValue * [0.4, 0.3, 0.2, 0.1][index],
            change_percent: data.change_percent || Math.random() * 10 - 5
          }))
        })
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch market data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const getChangeIcon = (change: number) => {
    return change >= 0 ? TrendingUp : TrendingDown
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Dataroom</h2>
          <p className="text-gray-600">Powered by OpenBB Platform</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchMarketData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {portfolioMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Portfolio Value</p>
                <p className="text-2xl font-bold">{formatCurrency(portfolioMetrics.total_value)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">24h Change</p>
                <p className={`text-2xl font-bold ${getChangeColor(portfolioMetrics.daily_change)}`}>
                  {formatCurrency(portfolioMetrics.daily_change)}
                </p>
              </div>
              {getChangeIcon(portfolioMetrics.daily_change)({ className: 'w-8 h-8' })}
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">24h Change %</p>
                <p className={`text-2xl font-bold ${getChangeColor(portfolioMetrics.daily_change_percent)}`}>
                  {formatPercent(portfolioMetrics.daily_change_percent)}
                </p>
              </div>
              <Percent className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assets</p>
                <p className="text-2xl font-bold">{portfolioMetrics.assets.length}</p>
              </div>
              <PieChart className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="market">Market Data</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Market Overview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Market Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketData.slice(0, 6).map((data) => {
                const ChangeIcon = getChangeIcon(data.change_percent || 0)
                return (
                  <motion.div
                    key={data.symbol}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{data.symbol}</h4>
                      <Badge variant={data.change_percent >= 0 ? 'default' : 'destructive'}>
                        <ChangeIcon className="w-3 h-3 mr-1" />
                        {formatPercent(data.change_percent || 0)}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">{formatCurrency(data.current_price)}</p>
                    <div className="text-sm text-gray-600 mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span>24h High:</span>
                        <span>{formatCurrency(data.high_24h)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>24h Low:</span>
                        <span>{formatCurrency(data.low_24h)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volume:</span>
                        <span>{formatCurrency(data.volume_24h)}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </Card>

          {selectedProject && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Project Context</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <h4 className="font-medium">{selectedProject.name}</h4>
                  <p className="text-gray-600 text-sm">{selectedProject.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge>{selectedProject.status}</Badge>
                    {selectedProject.token_symbol && (
                      <Badge variant="outline">{selectedProject.token_symbol}</Badge>
                    )}
                  </div>
                </div>
                {selectedProject.token_symbol && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Token Price</p>
                    <p className="text-xl font-bold">
                      {marketData.find(d => d.symbol === selectedProject.token_symbol) ? 
                        formatCurrency(marketData.find(d => d.symbol === selectedProject.token_symbol)!.current_price) :
                        'N/A'
                      }
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          {portfolioMetrics && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Portfolio Allocation</h3>
              <div className="space-y-4">
                {portfolioMetrics.assets.map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {asset.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-medium">{asset.symbol}</h4>
                        <p className="text-sm text-gray-600">{asset.allocation}% allocation</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(asset.value)}</p>
                      <p className={`text-sm ${getChangeColor(asset.change_percent)}`}>
                        {formatPercent(asset.change_percent)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Market Data</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Symbol</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">24h Change</th>
                    <th className="text-right py-2">Volume</th>
                    <th className="text-right py-2">Market Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {marketData.map((data) => (
                    <tr key={data.symbol} className="border-b">
                      <td className="py-3 font-medium">{data.symbol}</td>
                      <td className="py-3 text-right">{formatCurrency(data.current_price)}</td>
                      <td className={`py-3 text-right ${getChangeColor(data.change_percent || 0)}`}>
                        {formatPercent(data.change_percent || 0)}
                      </td>
                      <td className="py-3 text-right">{formatCurrency(data.volume_24h)}</td>
                      <td className="py-3 text-right">N/A</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Analytics & Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Risk Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Portfolio Beta:</span>
                    <span className="font-medium">1.23</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sharpe Ratio:</span>
                    <span className="font-medium">0.87</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Drawdown:</span>
                    <span className="font-medium text-red-600">-12.4%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volatility (30d):</span>
                    <span className="font-medium">18.7%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Performance Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">7d Return:</span>
                    <span className="font-medium text-green-600">+5.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">30d Return:</span>
                    <span className="font-medium text-green-600">+12.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">YTD Return:</span>
                    <span className="font-medium text-green-600">+45.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Best Day:</span>
                    <span className="font-medium text-green-600">+8.9%</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Footer */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4" />
          <span>OpenBB Platform</span>
          <Badge variant="outline" className="text-xs">
            {marketData.length} assets
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          {loading && (
            <>
              <Activity className="w-4 h-4 animate-pulse" />
              <span>Updating...</span>
            </>
          )}
          {!loading && (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Live data</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}