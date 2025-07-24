// Suna AI Client - Integration layer for Suna AI backend
// This replaces our custom deep search implementation with Suna's enterprise features

export interface SunaConfig {
  apiUrl: string
  apiKey: string
  timeout?: number
}

export interface SunaThread {
  id: string
  created_at: string
  metadata?: Record<string, any>
}

export interface SunaMessage {
  id: string
  thread_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  metadata?: Record<string, any>
}

export interface SunaResearchResult {
  summary: string
  sources: Array<{
    title: string
    url: string
    snippet: string
  }>
  findings: string[]
  confidence: number
}

export class SunaClient {
  private config: SunaConfig

  constructor(config: SunaConfig) {
    this.config = {
      timeout: 60000, // 60 second default timeout
      ...config
    }
  }

  /**
   * Create a new conversation thread with context
   */
  async createThread(context?: Record<string, any>): Promise<SunaThread> {
    const response = await this.request('/threads', {
      method: 'POST',
      body: JSON.stringify({ metadata: context })
    })

    return response.json()
  }

  /**
   * Send a message to Suna and get AI response
   */
  async sendMessage(
    threadId: string, 
    message: string,
    options?: {
      tools?: string[] // Enable specific Suna tools
      stream?: boolean
    }
  ): Promise<SunaMessage> {
    const response = await this.request(`/threads/${threadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: message,
        tools: options?.tools || ['web_search', 'web_scrape', 'file_ops'],
        stream: options?.stream || false
      })
    })

    return response.json()
  }

  /**
   * Perform deep web research using Suna's capabilities
   */
  async conductResearch(query: string, context?: string): Promise<SunaResearchResult> {
    // Create a research-specific thread
    const thread = await this.createThread({
      type: 'research',
      context: context || 'VC due diligence research'
    })

    // Send research request with web tools enabled
    const response = await this.sendMessage(thread.id, 
      `Conduct comprehensive research on: ${query}. 
       Use web search, scraping, and analysis tools.
       Provide summary, key findings, and sources.`,
      {
        tools: ['web_search', 'web_scrape', 'tavily_search', 'firecrawl']
      }
    )

    // Parse Suna's response into our format
    return this.parseResearchResponse(response)
  }

  /**
   * Analyze a crypto/startup project
   */
  async analyzeProject(projectName: string, additionalInfo?: string): Promise<SunaMessage> {
    const thread = await this.createThread({
      type: 'project_analysis',
      project: projectName
    })

    const prompt = `Analyze the crypto/startup project "${projectName}".
    ${additionalInfo ? `Additional context: ${additionalInfo}` : ''}
    
    Please research and provide:
    1. Company overview and founding team
    2. Product/technology analysis
    3. Market position and competitors
    4. Recent funding and investors
    5. Key risks and opportunities
    
    Use web search and scraping to gather current information.`

    return this.sendMessage(thread.id, prompt, {
      tools: ['web_search', 'web_scrape', 'tavily_search']
    })
  }

  /**
   * Search for VCs and investors
   */
  async searchInvestors(criteria: string): Promise<SunaMessage> {
    const thread = await this.createThread({
      type: 'investor_search'
    })

    const prompt = `Search for venture capital firms and investors based on: ${criteria}
    
    Use web search and databases to find:
    1. Relevant VC firms with websites and contact info
    2. Investment focus and portfolio
    3. Recent investments
    4. Key partners/decision makers
    
    Format as a structured list with contact information where available.`

    return this.sendMessage(thread.id, prompt, {
      tools: ['web_search', 'web_scrape', 'linkedin_scrape']
    })
  }

  /**
   * Generate investment memo
   */
  async generateMemo(projectData: any): Promise<SunaMessage> {
    const thread = await this.createThread({
      type: 'investment_memo',
      project: projectData
    })

    const prompt = `Generate a professional investment memo for ${projectData.name}.
    
    Context: ${JSON.stringify(projectData, null, 2)}
    
    Research current information and create a comprehensive memo including:
    1. Executive Summary
    2. Market Analysis
    3. Product/Technology Deep Dive
    4. Team Assessment
    5. Financial Projections
    6. Risk Analysis
    7. Investment Recommendation
    
    Use web research to supplement the provided data with current market information.`

    return this.sendMessage(thread.id, prompt, {
      tools: ['web_search', 'web_scrape', 'file_create']
    })
  }

  /**
   * Monitor portfolio companies
   */
  async monitorPortfolio(companies: string[]): Promise<SunaMessage> {
    const thread = await this.createThread({
      type: 'portfolio_monitoring',
      companies
    })

    const prompt = `Monitor these portfolio companies for recent updates: ${companies.join(', ')}
    
    For each company, search for:
    1. Recent news and announcements
    2. Product updates or launches
    3. Funding or partnership news
    4. Team changes
    5. Market performance
    
    Summarize key developments and flag any critical updates.`

    return this.sendMessage(thread.id, prompt, {
      tools: ['web_search', 'tavily_search', 'news_search']
    })
  }

  /**
   * Make HTTP request to Suna API
   */
  private async request(endpoint: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout!)

    try {
      const response = await fetch(`${this.config.apiUrl}/api/v1${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Suna API error: ${response.status} ${response.statusText}`)
      }

      return response
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Parse Suna's response into our research format
   */
  private parseResearchResponse(message: SunaMessage): SunaResearchResult {
    // Extract structured data from Suna's response
    // This is a simplified parser - enhance based on actual Suna response format
    const content = message.content

    // Try to extract sections
    const summaryMatch = content.match(/summary:?\s*([\s\S]*?)(?=findings:|sources:|$)/i)
    const findingsMatch = content.match(/findings:?\s*([\s\S]*?)(?=sources:|$)/i)
    const sourcesMatch = content.match(/sources:?\s*([\s\S]*?)$/i)

    const summary = summaryMatch?.[1]?.trim() || content.slice(0, 500)
    
    const findings = findingsMatch?.[1]
      ?.split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-•*]\s*/, '').trim()) || []

    const sources = this.extractUrls(content).map(url => ({
      title: url,
      url: url,
      snippet: ''
    }))

    return {
      summary,
      sources,
      findings,
      confidence: 0.8 // Suna provides high-quality results
    }
  }

  /**
   * Extract URLs from text
   */
  private extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
    return [...new Set(text.match(urlRegex) || [])]
  }
}

// Factory function to create Suna client with environment config
export function createSunaClient(): SunaClient {
  const apiUrl = process.env.SUNA_API_URL || process.env.NEXT_PUBLIC_SUNA_API_URL
  const apiKey = process.env.SUNA_API_KEY || process.env.NEXT_PUBLIC_SUNA_API_KEY

  if (!apiUrl || !apiKey) {
    console.warn('Suna API credentials not configured. AI features will be limited.')
    // Return a mock client or throw error based on your needs
  }

  return new SunaClient({
    apiUrl: apiUrl || 'http://localhost:8000', // Default for local Suna
    apiKey: apiKey || 'demo-key'
  })
}