// Search Service for Internet Research
// Supports multiple search providers with fallbacks

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
  private serpApiKey?: string
  private googleApiKey?: string
  private googleCxId?: string
  private bingApiKey?: string

  constructor() {
    // Initialize API keys from environment
    this.serpApiKey = process.env.SERPAPI_KEY
    this.googleApiKey = process.env.GOOGLE_SEARCH_API_KEY
    this.googleCxId = process.env.GOOGLE_SEARCH_CX_ID
    this.bingApiKey = process.env.BING_SEARCH_API_KEY
  }

  /**
   * Main search method with provider fallbacks
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const maxResults = options.maxResults || 10
    
    console.log(`Searching for: "${query}" with options:`, options)

    // Try providers in order of preference
    const providers = [
      () => this.searchWithSerpApi(query, options),
      () => this.searchWithGoogle(query, options),
      () => this.searchWithBing(query, options),
      () => this.searchWithDuckDuckGo(query, options) // Fallback, no API key needed
    ]

    for (const provider of providers) {
      try {
        const results = await provider()
        if (results.length > 0) {
          return results.slice(0, maxResults)
        }
      } catch (error) {
        console.warn('Search provider failed:', error)
        continue
      }
    }

    console.warn('All search providers failed, returning empty results')
    return []
  }

  /**
   * Search specifically for crypto/blockchain content
   */
  async searchCrypto(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const cryptoSites = [
      'coindesk.com',
      'cointelegraph.com',
      'decrypt.co',
      'theblock.co',
      'messari.io',
      'defipulse.com',
      'delphi.digital',
      'bankless.com'
    ]

    return this.search(`${query} crypto blockchain`, {
      ...options,
      sites: [...(options.sites || []), ...cryptoSites]
    })
  }

  /**
   * Search for VC and startup news
   */
  async searchVC(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const vcSites = [
      'techcrunch.com',
      'pitchbook.com',
      'crunchbase.com',
      'venturebeat.com',
      'axios.com',
      'theinformation.com',
      'forbes.com/fintech',
      'bloomberg.com'
    ]

    return this.search(`${query} venture capital funding`, {
      ...options,
      sites: [...(options.sites || []), ...vcSites]
    })
  }

  /**
   * Search with SerpApi (Google results via API)
   */
  private async searchWithSerpApi(query: string, options: SearchOptions): Promise<SearchResult[]> {
    if (!this.serpApiKey) {
      throw new Error('SerpApi key not configured')
    }

    const params = new URLSearchParams({
      q: query,
      api_key: this.serpApiKey,
      engine: 'google',
      num: (options.maxResults || 10).toString(),
      gl: options.region || 'us',
      hl: 'en'
    })

    if (options.timeRange && options.timeRange !== 'all') {
      params.append('tbs', this.getTimeFilter(options.timeRange))
    }

    if (options.sites && options.sites.length > 0) {
      const siteQuery = options.sites.map(site => `site:${site}`).join(' OR ')
      params.set('q', `${query} (${siteQuery})`)
    }

    const response = await fetch(`https://serpapi.com/search?${params}`)
    
    if (!response.ok) {
      throw new Error(`SerpApi error: ${response.status}`)
    }

    const data = await response.json()
    return this.parseSerpApiResults(data)
  }

  /**
   * Search with Google Custom Search API
   */
  private async searchWithGoogle(query: string, options: SearchOptions): Promise<SearchResult[]> {
    if (!this.googleApiKey || !this.googleCxId) {
      throw new Error('Google Search API not configured')
    }

    const params = new URLSearchParams({
      key: this.googleApiKey,
      cx: this.googleCxId,
      q: query,
      num: (options.maxResults || 10).toString(),
      gl: options.region || 'us',
      lr: 'lang_en'
    })

    if (options.timeRange && options.timeRange !== 'all') {
      params.append('dateRestrict', this.getGoogleDateFilter(options.timeRange))
    }

    const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`)
    
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`)
    }

    const data = await response.json()
    return this.parseGoogleResults(data)
  }

  /**
   * Search with Bing Search API
   */
  private async searchWithBing(query: string, options: SearchOptions): Promise<SearchResult[]> {
    if (!this.bingApiKey) {
      throw new Error('Bing Search API not configured')
    }

    const params = new URLSearchParams({
      q: query,
      count: (options.maxResults || 10).toString(),
      mkt: options.region === 'us' ? 'en-US' : 'en-GB',
      safeSearch: options.safeSearch ? 'Strict' : 'Moderate'
    })

    if (options.timeRange && options.timeRange !== 'all') {
      params.append('freshness', this.getBingFreshnessFilter(options.timeRange))
    }

    const response = await fetch(`https://api.bing.microsoft.com/v7.0/search?${params}`, {
      headers: {
        'Ocp-Apim-Subscription-Key': this.bingApiKey
      }
    })
    
    if (!response.ok) {
      throw new Error(`Bing Search API error: ${response.status}`)
    }

    const data = await response.json()
    return this.parseBingResults(data)
  }

  /**
   * Fallback search using DuckDuckGo (no API key needed)
   */
  private async searchWithDuckDuckGo(query: string, options: SearchOptions): Promise<SearchResult[]> {
    try {
      // DuckDuckGo Instant Answer API (limited but free)
      const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`)
      
      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status}`)
      }

      const data = await response.json()
      return this.parseDuckDuckGoResults(data)
    } catch (error) {
      console.warn('DuckDuckGo search failed:', error)
      return []
    }
  }

  // Result parsers for different providers
  private parseSerpApiResults(data: any): SearchResult[] {
    const results: SearchResult[] = []
    
    if (data.organic_results) {
      for (const result of data.organic_results) {
        results.push({
          title: result.title || '',
          url: result.link || '',
          snippet: result.snippet || '',
          source: 'Google (SerpApi)',
          publishDate: result.date,
          relevanceScore: result.position ? 1/result.position : 0
        })
      }
    }

    return results
  }

  private parseGoogleResults(data: any): SearchResult[] {
    const results: SearchResult[] = []
    
    if (data.items) {
      for (const item of data.items) {
        results.push({
          title: item.title || '',
          url: item.link || '',
          snippet: item.snippet || '',
          source: 'Google Custom Search',
          publishDate: item.pagemap?.metatags?.[0]?.['article:published_time'],
          relevanceScore: 1 // Google doesn't provide explicit scoring
        })
      }
    }

    return results
  }

  private parseBingResults(data: any): SearchResult[] {
    const results: SearchResult[] = []
    
    if (data.webPages?.value) {
      for (const result of data.webPages.value) {
        results.push({
          title: result.name || '',
          url: result.url || '',
          snippet: result.snippet || '',
          source: 'Bing',
          publishDate: result.dateLastCrawled,
          relevanceScore: 1 // Bing doesn't provide explicit scoring
        })
      }
    }

    return results
  }

  private parseDuckDuckGoResults(data: any): SearchResult[] {
    const results: SearchResult[] = []
    
    // DuckDuckGo instant answers
    if (data.Abstract) {
      results.push({
        title: data.Heading || 'DuckDuckGo Result',
        url: data.AbstractURL || '',
        snippet: data.Abstract,
        source: 'DuckDuckGo',
        relevanceScore: 1
      })
    }

    // Related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 3)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || 'Related Topic',
            url: topic.FirstURL,
            snippet: topic.Text,
            source: 'DuckDuckGo',
            relevanceScore: 0.8
          })
        }
      }
    }

    return results
  }

  // Time filter helpers
  private getTimeFilter(timeRange: string): string {
    const filters = {
      'day': 'qdr:d',
      'week': 'qdr:w', 
      'month': 'qdr:m',
      'year': 'qdr:y'
    }
    return filters[timeRange as keyof typeof filters] || ''
  }

  private getGoogleDateFilter(timeRange: string): string {
    const filters = {
      'day': 'd1',
      'week': 'w1',
      'month': 'm1', 
      'year': 'y1'
    }
    return filters[timeRange as keyof typeof filters] || ''
  }

  private getBingFreshnessFilter(timeRange: string): string {
    const filters = {
      'day': 'Day',
      'week': 'Week',
      'month': 'Month',
      'year': 'Year'
    }
    return filters[timeRange as keyof typeof filters] || ''
  }

  /**
   * Get search-powered insights for a specific query
   */
  async getInsights(query: string, context?: string): Promise<string> {
    try {
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