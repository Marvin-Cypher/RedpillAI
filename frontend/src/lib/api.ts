// Enhanced API client for Redpill backend with auth, 401 handling, and abort signals

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'redpill_token'

export interface ApiRequestOptions {
  signal?: AbortSignal
  skipAuth?: boolean
  useFormData?: boolean
}

export class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_BASE_URL
    // Get token from localStorage if available (fallback for non-cookie mode)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string, persistInLocalStorage = false) {
    this.token = token
    if (persistInLocalStorage && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  private handleUnauthorized() {
    // Clear any stored tokens
    this.clearToken()
    
    // Redirect to login page with return URL
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search
      const returnUrl = encodeURIComponent(currentPath)
      window.location.href = `/login?returnUrl=${returnUrl}`
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & ApiRequestOptions = {}
  ): Promise<T> {
    const { signal, skipAuth = false, useFormData = false, ...fetchOptions } = options
    const url = `${this.baseURL}${endpoint}`
    
    const headers: HeadersInit = {
      ...(useFormData ? {} : { 'Content-Type': 'application/json' }),
      ...fetchOptions.headers,
    }

    // Add authorization header if not skipped and token available
    if (!skipAuth && this.token) {
      (headers as Record<string, string>).Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal,
      credentials: 'include', // Include cookies for HTTP-only auth
    })

    // Handle 401 unauthorized
    if (response.status === 401 && !skipAuth) {
      this.handleUnauthorized()
      throw new Error('Unauthorized - redirecting to login')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        detail: `HTTP ${response.status}: ${response.statusText}` 
      }))
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`)
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T
    }

    return response.json()
  }

  // HTTP method helpers with enhanced options support
  async get<T>(
    endpoint: string, 
    options?: { params?: Record<string, any> } & ApiRequestOptions
  ): Promise<T> {
    const { params, ...requestOptions } = options || {}
    let url = endpoint
    
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString())
        }
      })
      const query = searchParams.toString()
      if (query) {
        url += (url.includes('?') ? '&' : '?') + query
      }
    }
    
    return this.request<T>(url, { method: 'GET', ...requestOptions })
  }

  async post<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const { useFormData, ...requestOptions } = options || {}
    
    return this.request<T>(endpoint, {
      method: 'POST',
      body: useFormData 
        ? data // FormData objects should be passed directly
        : data ? JSON.stringify(data) : undefined,
      useFormData,
      ...requestOptions,
    })
  }

  async put<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const { useFormData, ...requestOptions } = options || {}
    
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: useFormData 
        ? data 
        : data ? JSON.stringify(data) : undefined,
      useFormData,
      ...requestOptions,
    })
  }

  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', ...options })
  }

  // Auth endpoints - use proxy routes for cookie support
  async login(email: string, password: string, useHttpOnlyCookie = true) {
    // Use Next.js API proxy route for login to handle HTTP-only cookies
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, useHttpOnlyCookie }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Login failed' }))
      throw new Error(errorData.error || 'Login failed')
    }

    const data = await response.json()
    
    // If not using HTTP-only cookie, store token in memory/localStorage
    if (!useHttpOnlyCookie && data.token) {
      this.setToken(data.token, true)
    }

    return data
  }

  async logout() {
    try {
      // Call proxy route to clear HTTP-only cookie
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.warn('Logout proxy failed:', error)
    }
    
    // Always clear local token
    this.clearToken()
  }

  async getCurrentUser() {
    return this.request<any>('/auth/me')
  }

  // Deal endpoints
  async getDeals(
    params?: { status?: string; stage?: string; skip?: number; limit?: number },
    options?: ApiRequestOptions
  ) {
    return this.get<any[]>('/api/v1/deals/', { params, ...options })
  }

  async getDeal(id: string, options?: ApiRequestOptions) {
    return this.get<any>(`/api/v1/deals/${id}`, options)
  }

  async createDeal(data: any, options?: ApiRequestOptions) {
    return this.post<any>('/api/v1/deals/', data, options)
  }

  async updateDeal(id: string, data: any, options?: ApiRequestOptions) {
    return this.put<any>(`/api/v1/deals/${id}`, data, options)
  }

  async updateDealStatus(id: string, status: string, notes?: string, options?: ApiRequestOptions) {
    return this.request<any>(`/api/v1/deals/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        new_status: status,
        ...(notes && { notes }),
      }),
      useFormData: true,
      ...options,
    })
  }

  async getPipelineStats(options?: ApiRequestOptions) {
    return this.get<any>('/api/v1/deals/stats/pipeline', options)
  }

  // Company endpoints
  async getCompanies(
    params?: { sector?: string; search?: string; skip?: number; limit?: number },
    options?: ApiRequestOptions
  ) {
    return this.get<any[]>('/api/v1/companies/', { params, ...options })
  }

  async createCompany(data: any, options?: ApiRequestOptions) {
    return this.post<any>('/api/v1/companies/', data, options)
  }

  // Chat endpoints
  async getDealConversations(dealId: string, options?: ApiRequestOptions) {
    return this.get<any[]>(`/api/v1/chat/conversations/deal/${dealId}`, options)
  }

  async getConversationMessages(conversationId: string, limit?: number, options?: ApiRequestOptions) {
    return this.get<any[]>(
      `/api/v1/chat/conversations/${conversationId}/messages`,
      { params: limit ? { limit } : undefined, ...options }
    )
  }

  async sendMessage(conversationId: string, content: string, context?: string, options?: ApiRequestOptions) {
    return this.post<any>(
      `/api/v1/chat/conversations/${conversationId}/messages`,
      {
        conversation_id: conversationId,
        role: 'user',
        content,
        context,
      },
      options
    )
  }

  async quickAnalysis(dealId: string, analysisType: string, options?: ApiRequestOptions) {
    return this.request<any>('/api/v1/chat/quick-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        deal_id: dealId,
        analysis_type: analysisType,
      }),
      useFormData: true,
      ...options,
    })
  }

  // Health check
  async healthCheck(options?: ApiRequestOptions) {
    return this.get<any>('/health', options)
  }
}

// Export a singleton instance
export const apiClient = new ApiClient()