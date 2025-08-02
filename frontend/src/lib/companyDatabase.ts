// Centralized Company Database
// This handles company data storage and retrieval across the application

export interface Company {
  id: string
  name: string
  domain?: string
  website?: string
  ticker?: string // Stock/crypto ticker symbol (e.g., AMZN, BTC, LINK)
  company_type?: 'public' | 'crypto' | 'private'
  sector: string
  stage: string
  founded_year?: number
  headquarters: {
    city: string
    country: string
  }
  description: string
  logo?: string
  employee_count?: number
  funding_total?: number
  last_funding_date?: string
  
  // Investment details
  investment: {
    round_type: string
    investment_amount: number
    valuation: number
    ownership_percentage: number
    investment_date: string
    lead_partner: string
  }
  
  // Financial metrics
  metrics: {
    revenue_current: number
    revenue_growth: number
    burn_rate: number
    runway_months: number
    employees: number
    customers: number
    arr: number
    gross_margin: number
  }
  
  // Deal status
  deal_status: 'sourcing' | 'screening' | 'due_diligence' | 'term_sheet' | 'invested' | 'passed'
  priority: 'high' | 'medium' | 'low'
  
  // Timestamps
  created_at: string
  updated_at: string
}

const COMPANIES_STORAGE_KEY = 'redpill-companies'

// Helper functions for deal status assignment
const getDealStatusForCompany = (companyName: string): string | null => {
  if (typeof window === 'undefined') return null
  try {
    const dealUpdates = JSON.parse(localStorage.getItem('deal-status-updates') || '[]')
    const companySlug = companyName.toLowerCase().replace(/\s+/g, '-')
    
    // Try multiple lookup strategies
    let update = dealUpdates.find((u: any) => u.companyId === companySlug)
    if (!update) {
      update = dealUpdates.find((u: any) => u.companyName === companyName)
    }
    if (!update) {
      update = dealUpdates.find((u: any) => u.dealId === companyName)
    }
    
    return update?.newStatus || null
  } catch {
    return null
  }
}

const getRandomDealStatus = (companyName: string): 'sourcing' | 'screening' | 'due_diligence' | 'term_sheet' | 'invested' | 'passed' => {
  // Assign realistic deal statuses based on company characteristics
  const name = companyName.toLowerCase()
  
  // High-profile companies more likely to be in later stages
  if (name.includes('amazon') || name.includes('nvidia') || name.includes('microsoft')) {
    return 'invested'
  }
  
  // Well-known crypto projects likely in due diligence or invested
  if (name.includes('chainlink') || name.includes('polygon') || name.includes('solana')) {
    return Math.random() > 0.5 ? 'due_diligence' : 'term_sheet'
  }
  
  // Smaller/newer companies in earlier stages
  if (name.includes('phala') || name.includes('aave') || name.includes('uniswap')) {
    const statuses: Array<'sourcing' | 'screening' | 'due_diligence'> = ['sourcing', 'screening', 'due_diligence']
    return statuses[Math.floor(Math.random() * statuses.length)]
  }
  
  // Default distribution for unknown companies
  const allStatuses: Array<'sourcing' | 'screening' | 'due_diligence' | 'term_sheet' | 'invested' | 'passed'> = 
    ['sourcing', 'screening', 'due_diligence', 'term_sheet', 'invested', 'passed']
  return allStatuses[Math.floor(Math.random() * allStatuses.length)]
}

const getPriorityForCompany = (companyName: string): 'high' | 'medium' | 'low' => {
  const name = companyName.toLowerCase()
  
  // High priority for major companies and hot crypto projects
  if (name.includes('nvidia') || name.includes('chainlink') || name.includes('polygon')) {
    return 'high'
  }
  
  // Medium priority for established projects
  if (name.includes('amazon') || name.includes('phala') || name.includes('solana')) {
    return 'medium'
  }
  
  // Default to medium priority
  return 'medium'
}

// Default companies data
const DEFAULT_COMPANIES: Company[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    domain: 'amazon.com',
    website: 'https://amazon.com',
    ticker: 'AMZN',
    company_type: 'public',
    sector: 'E-commerce/Cloud',
    stage: 'Public',
    founded_year: 1994,
    headquarters: {
      city: 'Seattle',
      country: 'USA'
    },
    description: 'Amazon is a multinational technology company focusing on e-commerce, cloud computing, digital streaming, and artificial intelligence.',
    employee_count: 1500000,
    funding_total: 0,
    investment: {
      round_type: 'Public',
      investment_amount: 0,
      valuation: 1800000000000, // $1.8T market cap
      ownership_percentage: 0,
      investment_date: '1997-05-15',
      lead_partner: 'Public Market'
    },
    metrics: {
      revenue_current: 574780000000, // $574.78B annual revenue
      revenue_growth: 9.4,
      burn_rate: 0,
      runway_months: 999,
      employees: 1500000,
      customers: 300000000,
      arr: 574780000000,
      gross_margin: 47.1
    },
    deal_status: 'invested',
    priority: 'high',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2025-01-25T00:00:00Z'
  },
  {
    id: 'quantum-ai',
    name: 'Quantum AI Solutions',
    domain: 'quantumai.com',
    website: 'https://quantumai.com',
    sector: 'AI/ML',
    stage: 'Series A',
    founded_year: 2022,
    headquarters: {
      city: 'San Francisco',
      country: 'USA'
    },
    description: 'Quantum AI Solutions is building the next generation of quantum-enhanced machine learning algorithms for enterprise applications.',
    employee_count: 18,
    funding_total: 2000000,
    investment: {
      round_type: 'Series A',
      investment_amount: 2000000,
      valuation: 20000000,
      ownership_percentage: 10.0,
      investment_date: '2024-03-15',
      lead_partner: 'Sarah Chen'
    },
    metrics: {
      revenue_current: 180000,
      revenue_growth: 23.5,
      burn_rate: 180000,
      runway_months: 14,
      employees: 18,
      customers: 12,
      arr: 2160000,
      gross_margin: 82.5
    },
    deal_status: 'due_diligence',
    priority: 'high',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2025-01-25T00:00:00Z'
  },
  {
    id: 'greentech-solutions',
    name: 'GreenTech Solutions',
    domain: 'greentech-solutions.com',
    website: 'https://greentech-solutions.com',
    company_type: 'public',
    sector: 'CleanTech',
    stage: 'Seed',
    founded_year: 2023,
    headquarters: {
      city: 'Berlin',
      country: 'Germany'
    },
    description: 'GreenTech Solutions develops innovative solar panel technology for residential and commercial applications.',
    employee_count: 8,
    funding_total: 500000,
    investment: {
      round_type: 'Seed',
      investment_amount: 500000,
      valuation: 5000000,
      ownership_percentage: 10.0,
      investment_date: '2024-06-15',
      lead_partner: 'Mike Johnson'
    },
    metrics: {
      revenue_current: 45000,
      revenue_growth: 15.2,
      burn_rate: 85000,
      runway_months: 18,
      employees: 8,
      customers: 25,
      arr: 540000,
      gross_margin: 65.0
    },
    deal_status: 'screening',
    priority: 'medium',
    created_at: '2024-05-01T00:00:00Z',
    updated_at: '2025-01-20T00:00:00Z'
  },
  {
    id: 'fintech-pro',
    name: 'FinTech Pro',
    domain: 'fintechpro.com',
    website: 'https://fintechpro.com',
    sector: 'FinTech',
    stage: 'Series B',
    founded_year: 2021,
    headquarters: {
      city: 'New York',
      country: 'USA'
    },
    description: 'FinTech Pro provides B2B payment solutions for enterprise clients with advanced fraud detection and compliance features.',
    employee_count: 45,
    funding_total: 10000000,
    investment: {
      round_type: 'Series B',
      investment_amount: 10000000,
      valuation: 80000000,
      ownership_percentage: 12.5,
      investment_date: '2024-09-20',
      lead_partner: 'Sarah Chen'
    },
    metrics: {
      revenue_current: 450000,
      revenue_growth: 35.8,
      burn_rate: 320000,
      runway_months: 22,
      employees: 45,
      customers: 120,
      arr: 5400000,
      gross_margin: 88.5
    },
    deal_status: 'term_sheet',
    priority: 'high',
    created_at: '2024-08-01T00:00:00Z',
    updated_at: '2025-01-22T00:00:00Z'
  },
  {
    id: 'healthtech-analytics',
    name: 'HealthTech Analytics',
    domain: 'healthtech-analytics.com',
    website: 'https://healthtech-analytics.com',
    sector: 'HealthTech',
    stage: 'Series A',
    founded_year: 2022,
    headquarters: {
      city: 'Boston',
      country: 'USA'
    },
    description: 'HealthTech Analytics provides data analytics platform for healthcare providers to improve patient outcomes and operational efficiency.',
    employee_count: 15,
    funding_total: 3000000,
    investment: {
      round_type: 'Series A',
      investment_amount: 3000000,
      valuation: 25000000,
      ownership_percentage: 12.0,
      investment_date: '2024-11-10',
      lead_partner: 'Alex Rodriguez'
    },
    metrics: {
      revenue_current: 95000,
      revenue_growth: 18.3,
      burn_rate: 150000,
      runway_months: 16,
      employees: 15,
      customers: 8,
      arr: 1140000,
      gross_margin: 72.0
    },
    deal_status: 'sourcing',
    priority: 'low',
    created_at: '2024-10-01T00:00:00Z',
    updated_at: '2025-01-18T00:00:00Z'
  }
]

// Debug function to clear localStorage
export const clearCompanyCache = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(COMPANIES_STORAGE_KEY)
    console.log('🗑️ Cleared company localStorage cache')
  }
}

// Get all companies from backend API with localStorage fallback
export const getAllCompanies = async (): Promise<Company[]> => {
  if (typeof window === 'undefined') return DEFAULT_COMPANIES
  
  // TEMPORARY: Check localStorage first to recover original companies
  try {
    const stored = localStorage.getItem(COMPANIES_STORAGE_KEY)
    if (stored) {
      const localCompanies = JSON.parse(stored)
      console.log('🔍 Found companies in localStorage:', localCompanies.length, localCompanies.map((c: Company) => c.name))
      return localCompanies
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error)
  }
  
  try {
    // Try to fetch from backend API first
    const response = await fetch('http://localhost:8000/api/v1/companies/', {
      headers: {
        'Authorization': 'Bearer fake-token', // TODO: Replace with real auth
      }
    })
    
    if (response.ok) {
      const backendCompanies = await response.json()
      console.log('✅ Fetched companies from backend:', backendCompanies.length)
      
      // Transform backend format to frontend format if needed
      const transformedCompanies = backendCompanies.map((company: any) => ({
        id: company.id,
        name: company.name,
        domain: company.website?.replace(/^https?:\/\//, ''),
        website: company.website,
        ticker: company.token_symbol,
        company_type: company.company_type,
        sector: company.sector,
        stage: 'Series A', // Default stage
        founded_year: company.founded_year || 2020,
        headquarters: {
          city: company.headquarters?.split(', ')[0] || 'Unknown',
          country: company.headquarters?.split(', ')[1] || 'Unknown'
        },
        description: company.description || `${company.name} is an innovative company.`,
        logo: company.logo_url,
        employee_count: parseInt(company.employee_count?.replace(/[^0-9]/g, '') || '50'),
        investment: {
          round_type: 'Series A',
          investment_amount: 5000000,
          valuation: 50000000,
          ownership_percentage: 10.0,
          investment_date: '2024-01-15',
          lead_partner: 'John Smith'
        },
        metrics: {
          revenue_current: 500000,
          revenue_growth: 15.0,
          burn_rate: 150000,
          runway_months: 18,
          employees: parseInt(company.employee_count?.replace(/[^0-9]/g, '') || '50'),
          customers: 100,
          arr: 6000000,
          gross_margin: 75.0
        },
        deal_status: getDealStatusForCompany(company.name) || getRandomDealStatus(company.name),
        priority: getPriorityForCompany(company.name),
        created_at: company.created_at || new Date().toISOString(),
        updated_at: company.updated_at || new Date().toISOString()
      }))
      
      // Cache in localStorage as backup
      localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(transformedCompanies))
      return transformedCompanies
    }
  } catch (error) {
    console.warn('⚠️ Backend API unavailable, using localStorage fallback:', error)
  }
  
  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(COMPANIES_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    } else {
      // Initialize with default data
      localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(DEFAULT_COMPANIES))
      return DEFAULT_COMPANIES
    }
  } catch (error) {
    console.error('Error loading companies:', error)
    return DEFAULT_COMPANIES
  }
}

// Get company by ID
export const getCompanyById = async (id: string): Promise<Company | null> => {
  try {
    // Use the unified UUID-based API endpoint
    const response = await fetch(`http://localhost:8000/api/v1/data/companies/${encodeURIComponent(id)}/profile`)
    
    if (response.ok) {
      const apiData = await response.json()
      const realData = apiData.data
      
      if (realData) {
        // Transform API data to Company interface
        return {
          id: id,
          name: realData.name || id,
          website: realData.website,
          sector: realData.industry || 'Technology',
          stage: 'Series A', // Default stage
          founded_year: realData.founded_year || 2020,
          headquarters: {
            city: realData.headquarters?.split(', ')[0] || 'San Francisco',
            country: realData.headquarters?.split(', ')[1] || 'USA'
          },
          description: realData.description || `${realData.name || id} is an innovative technology company.`,
          employee_count: parseInt(realData.employee_count?.replace(/[^0-9]/g, '') || '50'),
          funding_total: realData.total_funding || 0,
          investment: {
            round_type: 'Series A',
            investment_amount: 5000000,
            valuation: 50000000,
            ownership_percentage: 10.0,
            investment_date: '2024-01-15',
            lead_partner: 'John Smith'
          },
          metrics: {
            revenue_current: realData.key_metrics?.revenue || 500000,
            revenue_growth: realData.key_metrics?.revenue_growth || 15.0,
            burn_rate: realData.key_metrics?.burn_rate || 150000,
            runway_months: realData.key_metrics?.runway || 18,
            employees: parseInt(realData.employee_count?.replace(/[^0-9]/g, '') || '50'),
            customers: realData.key_metrics?.customers || 100,
            arr: realData.key_metrics?.arr || 6000000,
            gross_margin: realData.key_metrics?.gross_margin || 75.0
          },
          deal_status: 'invested',
          priority: 'high',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: new Date().toISOString()
        }
      }
    }
    
    // Fallback to localStorage if API fails
    const companies = await getAllCompanies()
    return companies.find(company => company.id === id) || null
    
  } catch (error) {
    console.error(`Error fetching company ${id}:`, error)
    
    // Fallback to localStorage on error
    const companies = await getAllCompanies()
    return companies.find(company => company.id === id) || null
  }
}

// Add new company
export const addCompany = async (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company> => {
  const newCompany: Company = {
    ...company,
    id: company.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  try {
    // Try to sync to backend database first
    const response = await fetch('http://localhost:8000/api/v1/companies/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token', // TODO: Replace with real auth
      },
      body: JSON.stringify({
        name: newCompany.name,
        description: newCompany.description,
        website: newCompany.website,
        company_type: newCompany.company_type || 'traditional',
        sector: newCompany.sector,
        founded_year: newCompany.founded_year,
        headquarters: `${newCompany.headquarters.city}, ${newCompany.headquarters.country}`,
        employee_count: newCompany.employee_count?.toString() || '50'
      })
    })
    
    if (response.ok) {
      console.log('✅ Company synced to backend database')
    } else {
      console.warn('⚠️ Failed to sync to backend, saving locally only')
    }
  } catch (error) {
    console.warn('⚠️ Backend unavailable, saving locally only:', error)
  }
  
  // Always save to localStorage as backup
  const companies = await getAllCompanies()
  companies.push(newCompany)
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(companies))
  }
  
  return newCompany
}

// Update company
export const updateCompany = async (id: string, updates: Partial<Company>): Promise<Company | null> => {
  const companies = await getAllCompanies()
  const index = companies.findIndex(company => company.id === id)
  
  if (index === -1) return null
  
  companies[index] = {
    ...companies[index],
    ...updates,
    updated_at: new Date().toISOString()
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(companies))
  }
  
  return companies[index]
}

// Delete company
export const deleteCompany = async (id: string): Promise<boolean> => {
  const companies = await getAllCompanies()
  const index = companies.findIndex(company => company.id === id)
  
  if (index === -1) return false
  
  companies.splice(index, 1)
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(companies))
  }
  
  return true
}

// Get portfolio statistics
export const getPortfolioStats = async () => {
  const companies = await getAllCompanies()
  
  return {
    total_companies: companies.length,
    total_investment: companies.reduce((sum, company) => sum + company.investment.investment_amount, 0),
    total_valuation: companies.reduce((sum, company) => sum + company.investment.valuation, 0),
    active_deals: companies.filter(company => 
      ['due_diligence', 'term_sheet', 'screening'].includes(company.deal_status)
    ).length,
    invested_companies: companies.filter(company => company.deal_status === 'invested').length,
    sectors: Array.from(new Set(companies.map(company => company.sector))),
    stages: Array.from(new Set(companies.map(company => company.stage))),
    average_ownership: companies.reduce((sum, company) => sum + company.investment.ownership_percentage, 0) / companies.length,
    total_arr: companies.reduce((sum, company) => sum + company.metrics.arr, 0),
    total_employees: companies.reduce((sum, company) => sum + company.metrics.employees, 0)
  }
}

// Search companies
export const searchCompanies = async (query: string): Promise<Company[]> => {
  const companies = await getAllCompanies()
  const lowerQuery = query.toLowerCase()
  
  return companies.filter(company => 
    company.name.toLowerCase().includes(lowerQuery) ||
    company.sector.toLowerCase().includes(lowerQuery) ||
    company.description.toLowerCase().includes(lowerQuery) ||
    company.headquarters.city.toLowerCase().includes(lowerQuery)
  )
}

// Smart ticker detection for companies
export const getCompanyTicker = (company: Company): string | null => {
  // Return explicit ticker if available
  if (company.ticker) {
    return company.ticker
  }
  
  // Known company name to ticker mappings
  const tickerMap: Record<string, string> = {
    // Traditional stocks
    'amazon': 'AMZN',
    'apple': 'AAPL',
    'microsoft': 'MSFT',
    'google': 'GOOGL',
    'alphabet': 'GOOGL',
    'meta': 'META',
    'facebook': 'META',
    'tesla': 'TSLA',
    'nvidia': 'NVDA',
    'netflix': 'NFLX',
    'adobe': 'ADBE',
    'salesforce': 'CRM',
    'oracle': 'ORCL',
    'intel': 'INTC',
    'ibm': 'IBM',
    'cisco': 'CSCO',
    'uber': 'UBER',
    'airbnb': 'ABNB',
    'zoom': 'ZM',
    'slack': 'WORK',
    'twitter': 'TWTR',
    'linkedin': 'LNKD',
    'paypal': 'PYPL',
    'square': 'SQ',
    'stripe': 'STRIPE', // Private company
    
    // Crypto/Blockchain companies and their tokens
    'bitcoin': 'BTC',
    'ethereum': 'ETH',
    'chainlink': 'LINK',
    'polygon': 'MATIC',
    'solana': 'SOL',
    'cardano': 'ADA',
    'binance': 'BNB',
    'avalanche': 'AVAX',
    'polkadot': 'DOT',
    'phala network': 'PHA',
    'phala': 'PHA',
    'uniswap': 'UNI',
    'aave': 'AAVE',
    'compound': 'COMP',
    'maker': 'MKR',
    'the graph': 'GRT',
    'filecoin': 'FIL',
    'cosmos': 'ATOM',
    'tezos': 'XTZ',
    'algorand': 'ALGO',
    'near protocol': 'NEAR',
    'fantom': 'FTM',
    'harmony': 'ONE',
    'helium': 'HNT',
    'render token': 'RNDR',
    'arbitrum': 'ARB',
    'optimism': 'OP',
    'immutable': 'IMX',
    'loopring': 'LRC',
    '1inch': '1INCH',
    'synthetix': 'SNX',
    'yearn finance': 'YFI',
    'curve': 'CRV',
    'convex': 'CVX',
    'frax': 'FRAX',
    'lido': 'LDO',
    'rocket pool': 'RPL'
  }
  
  // Check company name variations
  const companyName = company.name.toLowerCase()
  if (tickerMap[companyName]) {
    return tickerMap[companyName]
  }
  
  // Check if company name contains known company names
  for (const [name, ticker] of Object.entries(tickerMap)) {
    if (companyName.includes(name) || name.includes(companyName)) {
      return ticker
    }
  }
  
  // Check domain for known patterns
  if (company.domain) {
    const domain = company.domain.toLowerCase().replace(/\.(com|org|io|net)$/, '')
    if (tickerMap[domain]) {
      return tickerMap[domain]
    }
  }
  
  return null
}

// Determine if company should use crypto or equity data sources
export type CompanyCategory = 'public' | 'crypto' | 'private';

export const getCompanyCategory = (company: Company): CompanyCategory => {
  // Check explicit company type first
  if (company.company_type === 'crypto') {
    return 'crypto'
  }

  // Check if it's a blockchain/crypto company by sector
  const cryptoSectors = [
    'blockchain', 'cryptocurrency', 'crypto', 'defi', 'web3', 'nft', 'metaverse', 'dao'
  ]
  
  const sector = company.sector.toLowerCase()
  if (cryptoSectors.some(cryptoSector => sector.includes(cryptoSector))) {
    return 'crypto'
  }
  
  // Check if ticker is a known crypto symbol
  const ticker = getCompanyTicker(company)
  if (ticker) {
    const cryptoTickers = [
      'BTC', 'ETH', 'LINK', 'MATIC', 'SOL', 'ADA', 'BNB', 'AVAX', 'DOT', 'UNI',
      'AAVE', 'COMP', 'MKR', 'GRT', 'FIL', 'ATOM', 'XTZ', 'ALGO', 'NEAR', 'FTM',
      'ONE', 'HNT', 'RNDR', 'ARB', 'OP', 'IMX', 'LRC', '1INCH', 'SNX', 'YFI',
      'CRV', 'CVX', 'FRAX', 'LDO', 'RPL'
    ]
    
    if (cryptoTickers.includes(ticker)) {
      return 'crypto'
    }
  }

  // Determine if public or private based on known indicators
  if (company.company_type === 'public') {
    // Known public companies (have stock tickers)
    const publicTickers = ['NVDA', 'AMZN', 'MSFT', 'GOOGL', 'AAPL', 'TSLA', 'META', 'NFLX']
    if (ticker && publicTickers.includes(ticker)) {
      return 'public'
    }
    
    // Large companies are likely public
    if (company.employee_count && company.employee_count > 10000) {
      return 'public'
    }
    
    // High valuation traditional companies are likely public
    if (company.metrics?.revenue_current && company.metrics.revenue_current > 1000000000) {
      return 'public'
    }
  }
  
  // Default to private for startups, AI companies, etc.
  return 'private'
}

// Keep backward compatibility
export const getCompanyAssetType = (company: Company): 'crypto' | 'equity' => {
  const category = getCompanyCategory(company)
  return category === 'crypto' ? 'crypto' : 'equity'
}