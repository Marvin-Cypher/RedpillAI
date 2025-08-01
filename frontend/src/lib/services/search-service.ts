// Search Service for Internet Research
// Uses server-side API routes for all search operations

export interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
  publishDate?: string
  relevanceScore?: number
}

export interface SearchOptions {
  maxResults?: number
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all'
  region?: string
  safeSearch?: boolean
  sites?: string[] // Specific sites to search
  excluding?: string[] // Sites to exclude
}

export class SearchService {
  constructor() {
    console.log('SearchService initialized - using server-side API routes')
  }

  private getApiUrl(path: string): string {
    // When running server-side, we need a full URL
    if (typeof window === 'undefined') {
      // Server-side: use localhost
      return `http://localhost:3000${path}`
    }
    // Client-side: use relative URL
    return path
  }

  /**
   * Main search method using server-side API
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    console.log(`🔍 Searching for: "${query}" with options:`, options)

    try {
      const response = await fetch(this.getApiUrl('/api/search'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          options
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Search API error:', response.status, errorData)
        throw new Error(`Search API error: ${response.status} - ${errorData.error || 'Unknown error'}`)
      }

      const data = await response.json()
      
      if (data.success) {
        console.log(`✅ Search successful: found ${data.results.length} results for "${query}"`)
        return data.results || []
      } else {
        throw new Error(data.error || 'Search failed')
      }

    } catch (error) {
      console.error('❌ Search request failed for query:', query, error)
      console.error('Search service error details:', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        query: query,
        options: options
      })
      
      // Return empty array instead of throwing to prevent breaking the research flow
      return []
    }
  }

  /**
   * Search specifically for crypto/blockchain content
   */
  async searchCrypto(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const cryptoQuery = `${query} crypto blockchain`
    console.log(`🪙 Crypto search: "${cryptoQuery}"`)
    
    return this.search(cryptoQuery, {
      ...options,
      sites: [
        ...(options.sites || []),
        'coindesk.com',
        'cointelegraph.com',
        'decrypt.co',
        'theblock.co',
        'messari.io',
        'defipulse.com',
        'delphi.digital',
        'bankless.com'
      ]
    })
  }

  /**
   * Search for VC and startup news
   */
  async searchVC(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const vcQuery = `${query} venture capital funding`
    console.log(`💰 VC search: "${vcQuery}"`)
    
    return this.search(vcQuery, {
      ...options,
      sites: [
        ...(options.sites || []),
        'techcrunch.com',
        'pitchbook.com',
        'crunchbase.com',
        'venturebeat.com',
        'axios.com',
        'theinformation.com',
        'forbes.com',
        'bloomberg.com'
      ]
    })
  }

  /**
   * Get search-powered insights for a specific query
   */
  async getInsights(query: string, context?: string): Promise<string> {
    try {
      console.log(`🧠 Getting insights for: "${query}"`)
      
      const results = await this.search(query, { maxResults: 5, timeRange: 'month' })
      
      if (results.length === 0) {
        return "No recent information found for this query."
      }

      let insights = `**Recent Information about "${query}":**\n\n`
      
      for (const result of results) {
        insights += `• **${result.title}**\n`
        insights += `  ${result.snippet}\n`
        insights += `  Source: ${result.source} | ${result.url}\n\n`
      }

      insights += `*Last updated: ${new Date().toLocaleDateString()}*`
      
      return insights
    } catch (error) {
      console.error('Failed to get search insights:', error)
      return "Unable to fetch recent information at this time."
    }
  }
}