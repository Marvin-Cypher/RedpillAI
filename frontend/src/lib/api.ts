// API client for Redpill backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_BASE_URL
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      (headers as Record<string, string>).Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(errorData.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ access_token: string; token_type: string }>('/api/v1/auth/login/json', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async getCurrentUser() {
    return this.request<any>('/api/v1/auth/me')
  }

  // Deal endpoints
  async getDeals(params?: { status?: string; stage?: string; skip?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const query = searchParams.toString()
    return this.request<any[]>(`/api/v1/deals/${query ? `?${query}` : ''}`)
  }

  async getDeal(id: string) {
    return this.request<any>(`/api/v1/deals/${id}`)
  }

  async createDeal(data: any) {
    return this.request<any>('/api/v1/deals/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateDeal(id: string, data: any) {
    return this.request<any>(`/api/v1/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async updateDealStatus(id: string, status: string, notes?: string) {
    return this.request<any>(`/api/v1/deals/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        new_status: status,
        ...(notes && { notes }),
      }),
    })
  }

  async getPipelineStats() {
    return this.request<any>('/api/v1/deals/stats/pipeline')
  }

  // Company endpoints
  async getCompanies(params?: { sector?: string; search?: string; skip?: number; limit?: number }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const query = searchParams.toString()
    return this.request<any[]>(`/api/v1/companies/${query ? `?${query}` : ''}`)
  }

  async createCompany(data: any) {
    return this.request<any>('/api/v1/companies/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Chat endpoints
  async getDealConversations(dealId: string) {
    return this.request<any[]>(`/api/v1/chat/conversations/deal/${dealId}`)
  }

  async getConversationMessages(conversationId: string, limit?: number) {
    const query = limit ? `?limit=${limit}` : ''
    return this.request<any[]>(`/api/v1/chat/conversations/${conversationId}/messages${query}`)
  }

  async sendMessage(conversationId: string, content: string, context?: string) {
    return this.request<any>(`/api/v1/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: conversationId,
        role: 'user',
        content,
        context,
      }),
    })
  }

  async quickAnalysis(dealId: string, analysisType: string) {
    return this.request<any>('/api/v1/chat/quick-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        deal_id: dealId,
        analysis_type: analysisType,
      }),
    })
  }

  // Health check
  async healthCheck() {
    return this.request<any>('/health')
  }
}

// Export a singleton instance
export const apiClient = new ApiClient()