'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  ExternalLink, 
  ArrowLeft,
  Calendar,
  DollarSign,
  Target,
  Info
} from 'lucide-react'

interface AssetInfo {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  marketCap?: string
  volume?: string
  sector?: string
}

function ChartViewerContent() {
  const searchParams = useSearchParams()
  const chartUrl = searchParams.get('url')
  const [assets, setAssets] = useState<AssetInfo[]>([])
  const [chartType, setChartType] = useState('single')
  const [loading, setLoading] = useState(true)

  // Parse chart info from URL
  useEffect(() => {
    if (!chartUrl) return
    
    try {
      const filename = chartUrl.split('/').pop() || ''
      const isComparison = filename.includes('_vs_') || filename.includes('comparison')
      setChartType(isComparison ? 'comparison' : 'single')
      
      // Extract asset symbols from filename
      let symbols: string[] = []
      if (isComparison) {
        const parts = filename.split('_comparison_')[0] || filename.split('_vs_').join('_').split('_')
        symbols = parts.filter(part => 
          part.match(/^[A-Z]{1,5}$/) && 
          !['crypto', 'equity', '1m', '3m', '6m', '1y', '2y', '5y'].includes(part.toLowerCase())
        )
      } else {
        const symbolMatch = filename.match(/^([A-Z]{1,5})_/)
        if (symbolMatch) symbols = [symbolMatch[1]]
      }

      // Mock asset data (in production, fetch from API)
      const mockAssets: AssetInfo[] = symbols.map(symbol => ({
        symbol,
        name: getCompanyName(symbol),
        price: Math.random() * 300 + 50,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        marketCap: `$${(Math.random() * 100 + 10).toFixed(1)}B`,
        volume: `${(Math.random() * 10 + 1).toFixed(1)}M`,
        sector: getSector(symbol)
      }))

      setAssets(mockAssets)
    } catch (error) {
      console.error('Error parsing chart info:', error)
    } finally {
      setLoading(false)
    }
  }, [chartUrl])

  const getCompanyName = (symbol: string): string => {
    const companies: Record<string, string> = {
      'PANW': 'Palo Alto Networks',
      'CRWD': 'CrowdStrike Holdings',
      'FTNT': 'Fortinet Inc',
      'ZS': 'Zscaler Inc',
      'CYBR': 'CyberArk Software',
      'NVDA': 'NVIDIA Corporation',
      'AAPL': 'Apple Inc',
      'MSFT': 'Microsoft Corporation',
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum'
    }
    return companies[symbol] || `${symbol} Corp`
  }

  const getSector = (symbol: string): string => {
    const sectors: Record<string, string> = {
      'PANW': 'Cybersecurity',
      'CRWD': 'Cybersecurity', 
      'FTNT': 'Cybersecurity',
      'ZS': 'Cybersecurity',
      'CYBR': 'Cybersecurity',
      'NVDA': 'Semiconductors',
      'AAPL': 'Technology',
      'MSFT': 'Technology',
      'BTC': 'Cryptocurrency',
      'ETH': 'Cryptocurrency'
    }
    return sectors[symbol] || 'Technology'
  }

  if (!chartUrl) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96 text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <BarChart3 className="h-6 w-6" />
              RedPill Chart Viewer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No chart URL provided</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Enhanced Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.history.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                RedPill Intelligence
              </h1>
              <p className="text-sm text-muted-foreground">
                {chartType === 'comparison' ? 'Multi-Asset Comparison' : 'Price Chart Analysis'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={chartType === 'comparison' ? 'default' : 'secondary'} className="gap-1">
              <Activity className="h-3 w-3" />
              {chartType === 'comparison' ? 'Comparison' : 'Single Asset'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(chartUrl, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Asset Information Sidebar */}
        {assets.length > 0 && (
          <div className="w-80 border-r bg-muted/20 p-4 space-y-4 overflow-y-auto">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Info className="h-4 w-4" />
                Asset Information
              </h3>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Card key={i}>
                      <CardContent className="p-3">
                        <div className="animate-pulse space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                assets.map((asset) => (
                  <Card key={asset.symbol}>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{asset.symbol}</h4>
                          <p className="text-xs text-muted-foreground">{asset.name}</p>
                        </div>
                        <Badge variant="outline">{asset.sector}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-mono">${asset.price.toFixed(2)}</span>
                        </div>
                        <div className={`flex items-center gap-1 ${asset.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {asset.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          <span className="font-mono">{asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%</span>
                        </div>
                      </div>

                      {asset.marketCap && asset.volume && (
                        <div className="pt-2 border-t space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Market Cap:</span>
                            <span className="font-mono">{asset.marketCap}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Volume:</span>
                            <span className="font-mono">{asset.volume}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {chartType === 'comparison' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Comparison Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <p className="text-muted-foreground">
                    This chart shows normalized percentage returns, allowing you to compare relative performance regardless of absolute price differences.
                  </p>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Calendar className="h-3 w-3" />
                    <span>Period: Last 3 months</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Chart Display */}
        <div className="flex-1">
          <iframe
            src={chartUrl}
            className="w-full h-full border-0"
            title="RedPill Intelligence Chart"
            style={{ minHeight: '600px' }}
          />
        </div>
      </div>
    </div>
  )
}

export default function ChartViewer() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <Card className="w-64 text-center">
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div>
                <h3 className="font-medium">Loading Chart</h3>
                <p className="text-sm text-muted-foreground">Please wait...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ChartViewerContent />
    </Suspense>
  )
}