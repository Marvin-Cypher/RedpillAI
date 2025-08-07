/**
 * GP Dashboard API client and KPI calculations
 * Fetches data from /api/v1/gp/* endpoints and computes financial metrics
 */

// Types for GP Dashboard data
export interface CashFlow {
  date: string
  amount: number
  type: 'call' | 'distribution'
  company?: string
  deal_id?: string
}

export interface FundValuations {
  paid_in_capital: number
  residual_value: number
  total_value: number
  calculated_at: string
}

export interface FundMetrics {
  irr: number
  tvpi: number
  dpi: number
  moic: number
  paid_in_capital: number
  residual_value: number
  total_distributions: number
  calculated_at: string
}

export interface CompanyMetrics {
  company_id: string
  company_name: string
  sector: string
  mrr: number
  arr: number
  revenue: number
  gross_margin: number
  ltv: number
  cac: number
  burn: number
  cash_balance: number
  headcount: number
  churn_rate: number
  net_rev_retention: number
  prev_mrr: number
  prev_arr: number
  mrr_growth: number
  arr_growth: number
  ltv_cac_ratio: number
  runway_months: number
}

export interface DealStage {
  stage: string
  count: number
  status: string
}

export interface DealHistory {
  deal_id: string
  created_at: string
  closed_at: string | null
  outcome: 'pending' | 'won' | 'passed' | 'completed'
  cycle_time_days: number | null
}

export interface MarketFunding {
  period: string
  total_deals: number
  total_funding: number
}

export interface ExitData {
  period: string
  ipo_count: number
  ma_count: number
  total_exit_value: number
}

export interface SectorAllocation {
  [sector: string]: {
    portfolio: number
    market_share: number
  }
}

export interface LPCall {
  call_number: number
  date: string
  amount: number
  purpose: string
}

export interface LPDistribution {
  distribution_number: number
  date: string
  amount: number
  source: string
}

export interface ComplianceData {
  company_id: string
  company_name: string
  is_compliant: boolean
  last_report_date: string
  days_overdue: number
  report_type: string
}

export interface GPActivity {
  partner_name: string
  role: string
  companies_contacted: number
  meetings_attended: number
  deals_reviewed: number
  board_meetings: number
  portfolio_check_ins: number
  avg_response_time_hours: number
}

export interface RiskPosition {
  company_id: string
  company_name: string
  sector: string
  investment_amount: number
  current_value: number
  beta: number
  weight: number
  risk_rating: string
}

export interface RiskMetrics {
  portfolio_beta: number
  volatility: number
  sharpe_ratio: number
  max_drawdown: number
  var_95: number
  concentration_risk: {
    top_1_weight: number
    top_3_weight: number
    top_5_weight: number
    hhi_index: number
  }
  sector_concentration: { [sector: string]: number }
  correlation_matrix: any
}

// API Base URL
const API_BASE = '/api/v1/gp'

// API client functions
export class GPDashboardAPI {
  // Module 1: Fund Performance
  static async getFundCashflows(startDate?: string, endDate?: string): Promise<CashFlow[]> {
    const params = new URLSearchParams()
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    
    const response = await fetch(`${API_BASE}/fund/cashflows?${params}`)
    if (!response.ok) throw new Error('Failed to fetch cashflows')
    return response.json()
  }

  static async getFundValuations(): Promise<FundValuations> {
    const response = await fetch(`${API_BASE}/fund/valuations`)
    if (!response.ok) throw new Error('Failed to fetch valuations')
    return response.json()
  }

  static async getFundMetrics(): Promise<FundMetrics> {
    const response = await fetch(`${API_BASE}/fund/metrics`)
    if (!response.ok) throw new Error('Failed to fetch fund metrics')
    return response.json()
  }

  // Module 2: Portfolio Company Performance
  static async getCompanyMetrics(period: string = 'monthly'): Promise<CompanyMetrics[]> {
    const response = await fetch(`${API_BASE}/companies/metrics?period=${period}`)
    if (!response.ok) throw new Error('Failed to fetch company metrics')
    return response.json()
  }

  // Module 3: Deal Flow & Pipeline
  static async getDealStages(): Promise<DealStage[]> {
    const response = await fetch(`${API_BASE}/deals/stages`)
    if (!response.ok) throw new Error('Failed to fetch deal stages')
    return response.json()
  }

  static async getDealHistory(fromDate?: string, toDate?: string): Promise<DealHistory[]> {
    const params = new URLSearchParams()
    if (fromDate) params.append('from_date', fromDate)
    if (toDate) params.append('to_date', toDate)
    
    const response = await fetch(`${API_BASE}/deals/history?${params}`)
    if (!response.ok) throw new Error('Failed to fetch deal history')
    return response.json()
  }

  // Module 4: Market & Sector Trends
  static async getMarketFunding(interval: string = 'quarterly'): Promise<{ data: MarketFunding[] }> {
    const response = await fetch(`${API_BASE}/market/funding?interval=${interval}`)
    if (!response.ok) throw new Error('Failed to fetch market funding')
    return response.json()
  }

  static async getMarketExits(interval: string = 'yearly'): Promise<{ data: ExitData[] }> {
    const response = await fetch(`${API_BASE}/market/exits?interval=${interval}`)
    if (!response.ok) throw new Error('Failed to fetch market exits')
    return response.json()
  }

  static async getSectorAllocation(): Promise<{ portfolio_allocation: SectorAllocation }> {
    const response = await fetch(`${API_BASE}/market/sector-allocation`)
    if (!response.ok) throw new Error('Failed to fetch sector allocation')
    return response.json()
  }

  // Module 5: LP Reporting
  static async getLPCalls(): Promise<{ calls: LPCall[], total_called: number, fund_size: number }> {
    const response = await fetch(`${API_BASE}/lp/calls`)
    if (!response.ok) throw new Error('Failed to fetch LP calls')
    return response.json()
  }

  static async getLPDistributions(): Promise<{ distributions: LPDistribution[], total_distributed: number, dpi: number }> {
    const response = await fetch(`${API_BASE}/lp/distributions`)
    if (!response.ok) throw new Error('Failed to fetch LP distributions')
    return response.json()
  }

  // Module 6: Operations & Team
  static async getComplianceStatus(): Promise<{ 
    compliance_data: ComplianceData[], 
    compliance_rate: number,
    overdue_companies: number 
  }> {
    const response = await fetch(`${API_BASE}/operations/compliance-status`)
    if (!response.ok) throw new Error('Failed to fetch compliance status')
    return response.json()
  }

  static async getGPActivity(): Promise<{ 
    gp_activities: GPActivity[], 
    team_summary: any 
  }> {
    const response = await fetch(`${API_BASE}/operations/gp-activity`)
    if (!response.ok) throw new Error('Failed to fetch GP activity')
    return response.json()
  }

  // Module 7: Risk & Compliance
  static async getRiskPositions(): Promise<RiskPosition[]> {
    const response = await fetch(`${API_BASE}/risk/positions`)
    if (!response.ok) throw new Error('Failed to fetch risk positions')
    return response.json()
  }

  static async getRiskMetrics(): Promise<RiskMetrics> {
    const response = await fetch(`${API_BASE}/risk/metrics`)
    if (!response.ok) throw new Error('Failed to fetch risk metrics')
    return response.json()
  }
}

// KPI Calculation utilities
export class KPICalculator {
  // XIRR calculation using Newton-Raphson method
  static xirr(cashflows: Array<{ date: Date; amount: number }>): number {
    if (!cashflows || cashflows.length < 2) return 0

    // Sort by date
    const sorted = cashflows.sort((a, b) => a.date.getTime() - b.date.getTime())
    const startDate = sorted[0].date
    
    // Convert to days from first cashflow
    const dates = sorted.map(cf => (cf.date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const amounts = sorted.map(cf => cf.amount)
    
    let guess = 0.1 // 10% initial guess
    
    for (let i = 0; i < 100; i++) {
      const npv = amounts.reduce((sum, amount, index) => 
        sum + amount / Math.pow(1 + guess, dates[index] / 365), 0
      )
      
      const derivative = amounts.reduce((sum, amount, index) => 
        sum - amount * dates[index] / 365 / Math.pow(1 + guess, dates[index] / 365 + 1), 0
      )
      
      if (Math.abs(derivative) < 1e-12) break
      
      const newGuess = guess - npv / derivative
      
      if (Math.abs(newGuess - guess) < 1e-8) return newGuess
      
      guess = newGuess
    }
    
    return guess
  }

  // Calculate TVPI (Total Value to Paid-In)
  static tvpi(distributions: number, residualValue: number, paidInCapital: number): number {
    if (paidInCapital === 0) return 0
    return (distributions + residualValue) / paidInCapital
  }

  // Calculate DPI (Distributions to Paid-In)
  static dpi(distributions: number, paidInCapital: number): number {
    if (paidInCapital === 0) return 0
    return distributions / paidInCapital
  }

  // Calculate MOIC (Multiple on Invested Capital)
  static moic(totalValue: number, investedCapital: number): number {
    if (investedCapital === 0) return 0
    return totalValue / investedCapital
  }

  // Calculate MRR Growth Rate
  static mrrGrowth(currentMRR: number, previousMRR: number): number {
    if (previousMRR === 0) return 0
    return (currentMRR - previousMRR) / previousMRR
  }

  // Calculate LTV:CAC ratio
  static ltvCacRatio(ltv: number, cac: number): number {
    if (cac === 0) return 0
    return ltv / cac
  }

  // Calculate runway in months
  static runwayMonths(cashBalance: number, monthlyBurn: number): number {
    if (monthlyBurn === 0) return 999 // Infinite runway
    return cashBalance / monthlyBurn
  }

  // Pipeline conversion rates
  static conversionRate(stage1Count: number, stage2Count: number): number {
    if (stage1Count === 0) return 0
    return stage2Count / stage1Count
  }

  // Average cycle time calculation
  static averageCycleTime(cycleTimes: number[]): number {
    if (cycleTimes.length === 0) return 0
    return cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length
  }

  // Concentration risk (Herfindahl-Hirschman Index)
  static herfindahlIndex(weights: number[]): number {
    return weights.reduce((sum, weight) => sum + weight * weight, 0)
  }

  // Sharpe ratio calculation
  static sharpeRatio(portfolioReturn: number, riskFreeRate: number, volatility: number): number {
    if (volatility === 0) return 0
    return (portfolioReturn - riskFreeRate) / volatility
  }

  // Portfolio beta (weighted average)
  static portfolioBeta(positions: Array<{ beta: number; weight: number }>): number {
    return positions.reduce((sum, pos) => sum + pos.beta * pos.weight, 0)
  }
}

// Utility functions for formatting
export class FormatUtils {
  static currency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  static percentage(value: number, decimals: number = 1): string {
    return (value * 100).toFixed(decimals) + '%'
  }

  static multiple(value: number, decimals: number = 1): string {
    return value.toFixed(decimals) + 'x'
  }

  static compact(amount: number): string {
    if (amount >= 1e9) return (amount / 1e9).toFixed(1) + 'B'
    if (amount >= 1e6) return (amount / 1e6).toFixed(1) + 'M'
    if (amount >= 1e3) return (amount / 1e3).toFixed(1) + 'K'
    return amount.toString()
  }

  static date(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
}