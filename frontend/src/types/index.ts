// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

// Deal Types
export type DealStatus = 
  | 'planned' 
  | 'meeting' 
  | 'research' 
  | 'deal' 
  | 'track' 
  | 'passed' 
  | 'closed'

export type InvestmentStage = 
  | 'pre_seed'
  | 'seed' 
  | 'series_a'
  | 'series_b'
  | 'series_c'
  | 'series_d_plus'
  | 'pre_tge'
  | 'post_tge'

export type CompanySector = 
  | 'defi'
  | 'infrastructure'
  | 'layer1'
  | 'layer2'
  | 'gaming'
  | 'nfts'
  | 'tools'
  | 'privacy'
  | 'trading'
  | 'lending'
  | 'derivatives'
  | 'oracles'
  | 'dao'
  | 'metaverse'
  | 'ai'
  | 'other'

export interface Company {
  id: string
  name: string
  description?: string
  website?: string
  sector: CompanySector
  token_symbol?: string
  twitter_handle?: string
  github_repo?: string
  whitepaper_url?: string
  founded_year?: number
  team_size?: number
  headquarters?: string
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  company_id: string
  status: DealStatus
  stage: InvestmentStage
  valuation?: number
  round_size?: number
  our_investment?: number
  our_target?: number
  probability?: number
  next_milestone?: string
  next_meeting_date?: string
  internal_notes?: string
  created_by: string
  created_at: string
  updated_at: string
  company: Company
}

// Chat Types
export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  context?: string
  tokens_used?: number
  processing_time_ms?: number
  created_at: string
}

export interface Conversation {
  id: string
  deal_id: string
  user_id: string
  title?: string
  is_active: boolean
  created_at: string
  updated_at: string
  message_count?: number
}

// User Types
export type UserRole = 
  | 'admin'
  | 'partner'
  | 'principal'
  | 'associate'
  | 'analyst'
  | 'observer'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  avatar_url?: string
  bio?: string
  linkedin_url?: string
  investment_focus?: string
  created_at: string
  updated_at: string
  last_login?: string
}

export interface AuthToken {
  access_token: string
  token_type: string
}

// Portfolio Types
export type PortfolioStatus = 
  | 'active'
  | 'exited'
  | 'written_off'
  | 'acquired'
  | 'ipo'
  | 'tge'

export interface PortfolioCompany {
  id: string
  deal_id: string
  company_id: string
  entry_date: string
  entry_valuation?: number
  current_valuation?: number
  ownership_percentage?: number
  status: PortfolioStatus
  created_at: string
  updated_at: string
  company: Company
}

// API Client Types
export interface ApiError {
  detail: string
  status_code: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}