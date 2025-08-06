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
const COMPANIES_VERSION_KEY = 'redpill-companies-version'
const CURRENT_VERSION = '2.0'

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

// Default companies data
const DEFAULT_COMPANIES: Company[] = [
  {
    id: '9b1e0492-0117-449b-93df-f8578b0c8e95',
    name: 'NVIDIA',
    domain: 'nvidia.com',
    website: 'https://nvidia.com',
    ticker: 'NVDA',
    company_type: 'public',
    sector: 'AI/Computing',
    stage: 'Public',
    founded_year: 1993,
    headquarters: {
      city: 'Santa Clara',
      country: 'USA'
    },
    description: 'NVIDIA is a multinational technology company known for graphics processing units (GPUs) and AI computing platforms.',
    employee_count: 26196,
    funding_total: 0,
    investment: {
      round_type: 'Public',
      investment_amount: 50000000,
      valuation: 2000000000000, // $2T market cap
      ownership_percentage: 0.0025,
      investment_date: '2023-01-15',
      lead_partner: 'RedPill VC'
    },
    metrics: {
      revenue_current: 60900000000, // $60.9B revenue
      revenue_growth: 126,
      burn_rate: 0,
      runway_months: 999,
      employees: 26196,
      customers: 40000,
      arr: 60900000000,
      gross_margin: 0.73
    },
    deal_status: 'invested',
    priority: 'high',
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2024-12-01T00:00:00Z'
  },
  {
    id: 'c06fc5fc-e0b7-4ddf-a5f4-e5db44d6b0ef',
    name: 'Chainlink',
    domain: 'chain.link',
    website: 'https://chain.link',
    ticker: 'LINK',
    company_type: 'crypto',
    sector: 'Blockchain Infrastructure',
    stage: 'Growth',
    founded_year: 2017,
    headquarters: {
      city: 'San Francisco',
      country: 'USA'
    },
    description: 'Chainlink is a decentralized oracle network that enables smart contracts to securely access off-chain data feeds.',
    employee_count: 150,
    funding_total: 32000000,
    investment: {
      round_type: 'Series A',
      investment_amount: 15000000,
      valuation: 2000000000,
      ownership_percentage: 0.75,
      investment_date: '2021-09-15',
      lead_partner: 'RedPill VC'
    },
    metrics: {
      revenue_current: 45000000,
      revenue_growth: 89,
      burn_rate: 3500000,
      runway_months: 24,
      employees: 150,
      customers: 1500,
      arr: 45000000,
      gross_margin: 0.85
    },
    deal_status: 'invested',
    priority: 'high',
    created_at: '2021-09-15T00:00:00Z',
    updated_at: '2024-12-01T00:00:00Z'
  },
  {
    id: '7b21930e-100f-4cbe-8561-d774e8f65453',
    name: 'Anthropic',
    domain: 'anthropic.com',
    website: 'https://anthropic.com',
    company_type: 'private',
    sector: 'AI/ML',
    stage: 'Growth',
    founded_year: 2021,
    headquarters: {
      city: 'San Francisco',
      country: 'USA'
    },
    description: 'Anthropic is an AI safety company focused on building safe, beneficial AI systems.',
    employee_count: 500,
    funding_total: 7300000000,
    investment: {
      round_type: 'Series C',
      investment_amount: 25000000,
      valuation: 18400000000,
      ownership_percentage: 0.136,
      investment_date: '2024-03-15',
      lead_partner: 'RedPill VC'
    },
    metrics: {
      revenue_current: 157000000,
      revenue_growth: 245,
      burn_rate: 45000000,
      runway_months: 18,
      employees: 500,
      customers: 15000,
      arr: 157000000,
      gross_margin: 0.82
    },
    deal_status: 'term_sheet',
    priority: 'high',
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-12-01T00:00:00Z'
  },
  {
    id: 'bd97cbbf-655d-467b-b012-464ed6478ec5',
    name: 'OpenAI',
    domain: 'openai.com',
    website: 'https://openai.com',
    company_type: 'private',
    sector: 'AI/ML',
    stage: 'Growth',
    founded_year: 2015,
    headquarters: {
      city: 'San Francisco',
      country: 'USA'
    },
    description: 'OpenAI is an AI research and deployment company focused on ensuring artificial general intelligence benefits humanity.',
    employee_count: 1000,
    funding_total: 11300000000,
    investment: {
      round_type: 'Series C',
      investment_amount: 0,
      valuation: 157000000000,
      ownership_percentage: 0,
      investment_date: '2024-01-15',
      lead_partner: 'N/A'
    },
    metrics: {
      revenue_current: 3400000000,
      revenue_growth: 1700,
      burn_rate: 150000000,
      runway_months: 36,
      employees: 1000,
      customers: 100000000,
      arr: 3400000000,
      gross_margin: 0.75
    },
    deal_status: 'passed',
    priority: 'medium',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-12-01T00:00:00Z'
  },
  {
    id: '31fa433e-03e8-42e2-a4b3-335017e19f13',
    name: 'Google',
    domain: 'google.com',
    website: 'https://google.com',
    ticker: 'GOOGL',
    company_type: 'public',
    sector: 'Technology',
    stage: 'Public',
    founded_year: 1998,
    headquarters: {
      city: 'Mountain View',
      country: 'USA'
    },
    description: 'Google is a multinational technology company specializing in Internet-related services and products.',
    employee_count: 180895,
    funding_total: 0,
    investment: {
      round_type: 'Public',
      investment_amount: 0,
      valuation: 2000000000000, // $2T market cap
      ownership_percentage: 0,
      investment_date: '2020-01-15',
      lead_partner: 'N/A'
    },
    metrics: {
      revenue_current: 307400000000, // $307.4B revenue
      revenue_growth: 13.8,
      burn_rate: 0,
      runway_months: 999,
      employees: 180895,
      customers: 4000000000,
      arr: 307400000000,
      gross_margin: 0.56
    },
    deal_status: 'passed',
    priority: 'low',
    created_at: '2020-01-15T00:00:00Z',
    updated_at: '2024-12-01T00:00:00Z'
  }
]

// Storage functions
export const getAllCompanies = async (): Promise<Company[]> => {
  if (typeof window === 'undefined') return DEFAULT_COMPANIES

  try {
    const storedVersion = localStorage.getItem(COMPANIES_VERSION_KEY)
    const stored = localStorage.getItem(COMPANIES_STORAGE_KEY)
    
    // Check if we need to migrate or reset data
    if (storedVersion !== CURRENT_VERSION) {
      console.log('Migrating company data to version', CURRENT_VERSION)
      // Clear old data and use new defaults with UUIDs
      localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(DEFAULT_COMPANIES))
      localStorage.setItem(COMPANIES_VERSION_KEY, CURRENT_VERSION)
      return DEFAULT_COMPANIES
    }
    
    if (stored) {
      const companies = JSON.parse(stored)
      // Update deal statuses with any persisted changes
      return companies.map((company: Company) => ({
        ...company,
        deal_status: getDealStatusForCompany(company.name) || company.deal_status
      }))
    } else {
      // First time - save defaults
      localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(DEFAULT_COMPANIES))
      localStorage.setItem(COMPANIES_VERSION_KEY, CURRENT_VERSION)
      return DEFAULT_COMPANIES
    }
  } catch (error) {
    console.error('Error loading companies:', error)
    return DEFAULT_COMPANIES
  }
}

export const getCompanyById = async (id: string): Promise<Company | null> => {
  const companies = await getAllCompanies()
  return companies.find(c => c.id === id) || null
}

export interface PortfolioStats {
  total_companies: number
  invested_companies: number
  active_deals: number
  total_investment: number
  total_valuation: number
  total_arr: number
  total_employees: number
  average_ownership: number
  sectors: string[]
}

export const getPortfolioStats = async (): Promise<PortfolioStats> => {
  const companies = await getAllCompanies()
  
  return {
    total_companies: companies.length,
    invested_companies: companies.filter(c => c.deal_status === 'invested').length,
    active_deals: companies.filter(c => ['due_diligence', 'term_sheet'].includes(c.deal_status)).length,
    total_investment: companies.reduce((sum, c) => sum + c.investment.investment_amount, 0),
    total_valuation: companies.reduce((sum, c) => sum + c.investment.valuation, 0),
    total_arr: companies.reduce((sum, c) => sum + c.metrics.arr, 0),
    total_employees: companies.reduce((sum, c) => sum + c.metrics.employees, 0),
    average_ownership: companies.reduce((sum, c) => sum + c.investment.ownership_percentage, 0) / companies.length,
    sectors: [...new Set(companies.map(c => c.sector))]
  }
}

// Simple UUID generator
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const addCompany = async (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Promise<Company> => {
  const companies = await getAllCompanies()
  const now = new Date().toISOString()
  
  const newCompany: Company = {
    ...company,
    id: generateUUID(),
    created_at: now,
    updated_at: now
  }
  
  const updatedCompanies = [...companies, newCompany]
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(updatedCompanies))
  }
  
  return newCompany
}