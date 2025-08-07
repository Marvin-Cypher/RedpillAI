"use client"

import { useState, useEffect } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Users, Building2, Target, AlertTriangle, DollarSign, Activity, Calendar, FileText } from "lucide-react"

import { 
  GPDashboardAPI, 
  FundMetrics, 
  CompanyMetrics, 
  DealStage, 
  DealHistory,
  MarketFunding,
  ExitData,
  SectorAllocation,
  LPCall,
  LPDistribution,
  ComplianceData,
  GPActivity,
  RiskPosition,
  RiskMetrics,
  KPICalculator,
  FormatUtils
} from "@/lib/gp-dashboard"

// Metric Card Component
interface MetricCardProps {
  label: string
  value: string
  subValue?: string
  trend?: number
  icon: React.ReactNode
  description?: string
}

const MetricCard = ({ label, value, subValue, trend, icon, description }: MetricCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{label}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
      {trend !== undefined && (
        <div className="flex items-center space-x-1 text-xs">
          {trend > 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : trend < 0 ? (
            <TrendingDown className="h-3 w-3 text-red-500" />
          ) : null}
          <span className={trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-muted-foreground"}>
            {FormatUtils.percentage(Math.abs(trend))}
          </span>
        </div>
      )}
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </CardContent>
  </Card>
)

export default function GPDashboard() {
  // State for all dashboard data
  const [fundMetrics, setFundMetrics] = useState<FundMetrics | null>(null)
  const [companyMetrics, setCompanyMetrics] = useState<CompanyMetrics[]>([])
  const [dealStages, setDealStages] = useState<DealStage[]>([])
  const [dealHistory, setDealHistory] = useState<DealHistory[]>([])
  const [marketFunding, setMarketFunding] = useState<MarketFunding[]>([])
  const [marketExits, setMarketExits] = useState<ExitData[]>([])
  const [sectorAllocation, setSectorAllocation] = useState<SectorAllocation>({})
  const [lpCalls, setLPCalls] = useState<{ calls: LPCall[], total_called: number, fund_size: number } | null>(null)
  const [lpDistributions, setLPDistributions] = useState<{ distributions: LPDistribution[], total_distributed: number, dpi: number } | null>(null)
  const [complianceData, setComplianceData] = useState<{ compliance_data: ComplianceData[], compliance_rate: number, overdue_companies: number } | null>(null)
  const [gpActivity, setGPActivity] = useState<{ gp_activities: GPActivity[], team_summary: Record<string, unknown> } | null>(null)
  const [riskPositions, setRiskPositions] = useState<RiskPosition[]>([])
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch all data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch data for all modules with individual error handling
        const results = await Promise.allSettled([
          GPDashboardAPI.getFundMetrics(),
          GPDashboardAPI.getCompanyMetrics(),
          GPDashboardAPI.getDealStages(),
          GPDashboardAPI.getDealHistory(),
          GPDashboardAPI.getMarketFunding('quarterly'),
          GPDashboardAPI.getMarketExits('yearly'),
          GPDashboardAPI.getSectorAllocation(),
          GPDashboardAPI.getLPCalls(),
          GPDashboardAPI.getLPDistributions(),
          GPDashboardAPI.getComplianceStatus(),
          GPDashboardAPI.getGPActivity(),
          GPDashboardAPI.getRiskPositions(),
          GPDashboardAPI.getRiskMetrics()
        ])

        // Set state with fallbacks for failed requests
        setFundMetrics(results[0].status === 'fulfilled' ? results[0].value : null)
        setCompanyMetrics(results[1].status === 'fulfilled' ? results[1].value : [])
        setDealStages(results[2].status === 'fulfilled' ? results[2].value : [])
        setDealHistory(results[3].status === 'fulfilled' ? results[3].value : [])
        setMarketFunding(results[4].status === 'fulfilled' ? results[4].value?.data || [] : [])
        setMarketExits(results[5].status === 'fulfilled' ? results[5].value?.data || [] : [])
        setSectorAllocation(results[6].status === 'fulfilled' ? results[6].value?.portfolio_allocation || {} : {})
        setLPCalls(results[7].status === 'fulfilled' ? results[7].value : null)
        setLPDistributions(results[8].status === 'fulfilled' ? results[8].value : null)
        setComplianceData(results[9].status === 'fulfilled' ? results[9].value : null)
        setGPActivity(results[10].status === 'fulfilled' ? results[10].value : null)
        setRiskPositions(results[11].status === 'fulfilled' ? results[11].value : [])
        setRiskMetrics(results[12].status === 'fulfilled' ? results[12].value : null)
        
      } catch (error) {
        // Fallback error handling - set default values
        setFundMetrics(null)
        setCompanyMetrics([])
        setDealStages([])
        setDealHistory([])
        setMarketFunding([])
        setMarketExits([])
        setSectorAllocation({})
        setLPCalls(null)
        setLPDistributions(null)
        setComplianceData(null)
        setGPActivity(null)
        setRiskPositions([])
        setRiskMetrics(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>

        {/* MODULE 1: FUND PERFORMANCE */}
        <TabsContent value="fund-performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="IRR"
              value={FormatUtils.percentage(fundMetrics?.irr || 0 / 100)}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              description="Internal Rate of Return"
            />
            <MetricCard
              label="TVPI"
              value={FormatUtils.multiple(fundMetrics?.tvpi || 0)}
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
              description="Total Value to Paid-In"
            />
            <MetricCard
              label="DPI"
              value={FormatUtils.multiple(fundMetrics?.dpi || 0)}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              description="Distributions to Paid-In"
            />
            <MetricCard
              label="MOIC"
              value={FormatUtils.multiple(fundMetrics?.moic || 0)}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              description="Multiple on Invested Capital"
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Fund Metrics Overview</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Paid-In Capital</span>
                    <span className="font-medium">{FormatUtils.currency(fundMetrics?.paid_in_capital || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Residual Value</span>
                    <span className="font-medium">{FormatUtils.currency(fundMetrics?.residual_value || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Total Distributions</span>
                    <span className="font-medium">{FormatUtils.currency(fundMetrics?.total_distributions || 0)}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fund Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {FormatUtils.percentage((fundMetrics?.paid_in_capital || 0) / 150_000_000)} deployed
                    </span>
                  </div>
                  <Progress value={((fundMetrics?.paid_in_capital || 0) / 150_000_000) * 100} className="w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Benchmark</CardTitle>
                <CardDescription>vs. industry benchmarks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">IRR vs Benchmark (22.5%)</span>
                      <Badge variant={fundMetrics && fundMetrics.irr > 22.5 ? "default" : "secondary"}>
                        {fundMetrics && fundMetrics.irr > 22.5 ? "Above" : "Below"}
                      </Badge>
                    </div>
                    <Progress value={Math.min(((fundMetrics?.irr || 0) / 22.5) * 100, 100)} className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">TVPI vs Benchmark (2.1x)</span>
                      <Badge variant={fundMetrics && fundMetrics.tvpi > 2.1 ? "default" : "secondary"}>
                        {fundMetrics && fundMetrics.tvpi > 2.1 ? "Above" : "Below"}
                      </Badge>
                    </div>
                    <Progress value={Math.min(((fundMetrics?.tvpi || 0) / 2.1) * 100, 100)} className="w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MODULE 2: PORTFOLIO ANALYTICS */}
        <TabsContent value="portfolio-analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Portfolio Companies"
              value={companyMetrics.length.toString()}
              icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
              description="Active portfolio companies"
            />
            <MetricCard
              label="Avg MRR Growth"
              value={FormatUtils.percentage(
                companyMetrics.reduce((sum, c) => sum + c.mrr_growth, 0) / companyMetrics.length || 0
              )}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              description="Monthly recurring revenue growth"
            />
            <MetricCard
              label="Avg LTV:CAC"
              value={FormatUtils.multiple(
                companyMetrics.reduce((sum, c) => sum + c.ltv_cac_ratio, 0) / companyMetrics.length || 0
              )}
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
              description="Customer lifetime value to acquisition cost"
            />
            <MetricCard
              label="Companies at Risk"
              value={companyMetrics.filter(c => c.runway_months < 6).length.toString()}
              icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
              description="Less than 6 months runway"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Company Performance Rankings</CardTitle>
                <CardDescription>Sorted by MRR growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companyMetrics
                    .sort((a, b) => b.mrr_growth - a.mrr_growth)
                    .slice(0, 8)
                    .map((company, index) => (
                      <div key={company.company_id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium">{company.company_name}</p>
                            <p className="text-xs text-muted-foreground">{company.sector}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {FormatUtils.percentage(company.mrr_growth)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {FormatUtils.currency(company.mrr)} MRR
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Portfolio Metrics Overview</CardTitle>
                <CardDescription>Aggregated KPIs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {FormatUtils.currency(
                          companyMetrics.reduce((sum, c) => sum + c.arr, 0)
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Total ARR</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {FormatUtils.percentage(
                          companyMetrics.reduce((sum, c) => sum + c.gross_margin, 0) / companyMetrics.length || 0
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Avg Gross Margin</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {companyMetrics.reduce((sum, c) => sum + c.headcount, 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Employees</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {FormatUtils.currency(
                          companyMetrics.reduce((sum, c) => sum + c.cash_balance, 0)
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Cash</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MODULE 3: DEAL FLOW & PIPELINE */}
        <TabsContent value="deal-flow" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total Deals"
              value={dealStages.reduce((sum, stage) => sum + stage.count, 0).toString()}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              description="Active pipeline deals"
            />
            <MetricCard
              label="Screen Conversion"
              value={FormatUtils.percentage(
                KPICalculator.conversionRate(
                  dealStages.find(s => s.stage === 'sourced')?.count || 0,
                  dealStages.find(s => s.stage === 'screened')?.count || 0
                )
              )}
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
              description="Sourced to screened rate"
            />
            <MetricCard
              label="Close Conversion"
              value={FormatUtils.percentage(
                KPICalculator.conversionRate(
                  dealStages.find(s => s.stage === 'term-sheet')?.count || 0,
                  dealStages.find(s => s.stage === 'closed')?.count || 0
                )
              )}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              description="Term sheet to close rate"
            />
            <MetricCard
              label="Avg Cycle Time"
              value={`${Math.round(
                KPICalculator.averageCycleTime(
                  dealHistory.filter(d => d.cycle_time_days).map(d => d.cycle_time_days!)
                )
              )} days`}
              icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
              description="Source to close average"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Funnel</CardTitle>
                <CardDescription>Deal flow by stage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dealStages.map((stage) => {
                    const maxCount = Math.max(...dealStages.map(s => s.count))
                    const percentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
                    
                    return (
                      <div key={stage.stage} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium capitalize">
                            {stage.stage.replace('-', ' ')}
                          </span>
                          <span className="text-sm font-bold">{stage.count}</span>
                        </div>
                        <Progress value={percentage} className="w-full" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deal Velocity</CardTitle>
                <CardDescription>Time spent in each stage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dealStages.map(stage => ({
                    stage: stage.stage.replace('-', ' '),
                    count: stage.count,
                    avgDays: Math.round(Math.random() * 30 + 15) // Mock data
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgDays" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MODULE 4: MARKET INTELLIGENCE */}
        <TabsContent value="market-intelligence" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Market Funding"
              value={FormatUtils.compact(marketFunding[marketFunding.length - 1]?.total_funding || 0)}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              description="Latest quarter"
            />
            <MetricCard
              label="Total Deals"
              value={marketFunding[marketFunding.length - 1]?.total_deals?.toString() || '0'}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              description="Latest quarter"
            />
            <MetricCard
              label="IPO Count"
              value={marketExits[marketExits.length - 1]?.ipo_count?.toString() || '0'}
              icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
              description="Latest year"
            />
            <MetricCard
              label="M&A Count"
              value={marketExits[marketExits.length - 1]?.ma_count?.toString() || '0'}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              description="Latest year"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>VC Funding Trends</CardTitle>
                <CardDescription>Quarterly funding volume</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={marketFunding}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => FormatUtils.compact(value as number)} />
                    <Line type="monotone" dataKey="total_funding" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sector Allocation</CardTitle>
                <CardDescription>Portfolio vs. market allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(sectorAllocation).map(([sector, data]) => (
                    <div key={sector} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">{sector}</span>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">
                            Portfolio: {data.portfolio} | Market: {FormatUtils.percentage(data.market_share / 100)}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <Progress value={(data.portfolio / 10) * 100} className="w-full" />
                        </div>
                        <div className="flex-1">
                          <Progress value={data.market_share} className="w-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MODULE 5: LP REPORTING */}
        <TabsContent value="lp-reporting" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Capital Called"
              value={FormatUtils.currency(lpCalls?.total_called || 0)}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
              description="Total capital deployed"
            />
            <MetricCard
              label="Distributions"
              value={FormatUtils.currency(lpDistributions?.total_distributed || 0)}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              description="Total returned to LPs"
            />
            <MetricCard
              label="LP DPI"
              value={FormatUtils.multiple(lpDistributions?.dpi || 0)}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              description="Distributions to Paid-In"
            />
            <MetricCard
              label="Call Percentage"
              value={FormatUtils.percentage((lpCalls?.total_called || 0) / (lpCalls?.fund_size || 1))}
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
              description="Of total commitment"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Capital Call Schedule</CardTitle>
                <CardDescription>Fund deployment timeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lpCalls?.calls?.slice(-5).map((call) => (
                    <div key={call.call_number} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Call #{call.call_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {FormatUtils.date(call.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {FormatUtils.currency(call.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {call.purpose}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribution History</CardTitle>
                <CardDescription>Returns to limited partners</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lpDistributions?.distributions?.map((dist) => (
                    <div key={dist.distribution_number} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Distribution #{dist.distribution_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {FormatUtils.date(dist.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          {FormatUtils.currency(dist.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dist.source}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MODULE 6: OPERATIONS */}
        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Compliance Rate"
              value={FormatUtils.percentage((complianceData?.compliance_rate || 0) / 100)}
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              description="Portfolio reporting compliance"
            />
            <MetricCard
              label="Overdue Reports"
              value={complianceData?.overdue_companies?.toString() || '0'}
              icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
              description="Companies behind on reporting"
            />
            <MetricCard
              label="Team Meetings"
              value={gpActivity?.team_summary?.total_meetings?.toString() || '0'}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
              description="Last 30 days"
            />
            <MetricCard
              label="Avg Response Time"
              value={`${gpActivity?.team_summary?.avg_team_response_time?.toFixed(1) || '0'}h`}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              description="Team average"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Team Activity</CardTitle>
                <CardDescription>GP performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gpActivity?.gp_activities?.map((gp) => (
                    <div key={gp.partner_name} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{gp.partner_name}</p>
                        <p className="text-xs text-muted-foreground">{gp.role}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {gp.deals_reviewed} deals reviewed
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {gp.avg_response_time_hours.toFixed(1)}h avg response
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>Portfolio company reporting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complianceData?.compliance_data?.slice(0, 6)?.map((company) => (
                    <div key={company.company_id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{company.company_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Last report: {FormatUtils.date(company.last_report_date)}
                        </p>
                      </div>
                      <Badge variant={company.is_compliant ? "default" : "destructive"}>
                        {company.is_compliant ? 'Compliant' : `${company.days_overdue}d overdue`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MODULE 7: RISK & COMPLIANCE */}
        <TabsContent value="risk-compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Portfolio Beta"
              value={riskMetrics?.portfolio_beta?.toFixed(2) || '0'}
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              description="Market sensitivity"
            />
            <MetricCard
              label="Sharpe Ratio"
              value={riskMetrics?.sharpe_ratio?.toFixed(2) || '0'}
              icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
              description="Risk-adjusted returns"
            />
            <MetricCard
              label="Top 3 Concentration"
              value={FormatUtils.percentage(riskMetrics?.concentration_risk?.top_3_weight || 0)}
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
              description="Portfolio concentration"
            />
            <MetricCard
              label="High Risk Companies"
              value={riskPositions?.filter(p => p.risk_rating === 'High')?.length?.toString() || '0'}
              icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
              description="Beta > 1.5"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Positions</CardTitle>
                <CardDescription>Risk exposure by company</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskPositions?.slice(0, 8)?.map((position) => (
                    <div key={position.company_id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{position.company_name}</p>
                        <p className="text-xs text-muted-foreground">{position.sector}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          β {position.beta.toFixed(1)}
                        </p>
                        <div className="flex items-center space-x-1">
                          <Badge variant={position.risk_rating === 'High' ? "destructive" : "secondary"}>
                            {position.risk_rating}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {FormatUtils.percentage(position.weight)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
                <CardDescription>Portfolio risk assessment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Portfolio Volatility</span>
                    <span className="font-medium">{FormatUtils.percentage(riskMetrics?.volatility || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Maximum Drawdown</span>
                    <span className="font-medium text-red-600">{FormatUtils.percentage(Math.abs(riskMetrics?.max_drawdown || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">95% VaR</span>
                    <span className="font-medium">{FormatUtils.percentage(Math.abs(riskMetrics?.var_95 || 0))}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Concentration Analysis</h4>
                  <div className="flex justify-between text-xs">
                    <span>Top Company</span>
                    <span>{FormatUtils.percentage(riskMetrics?.concentration_risk?.top_1_weight || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>HHI Index</span>
                    <span>{riskMetrics?.concentration_risk?.hhi_index?.toFixed(3) || '0'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
    </>
  )
}