interface CoinGeckoToken {
  id: string
  symbol: string
  name: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation: number
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  circulating_supply: number
  total_supply: number
  max_supply: number
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
}

interface CoinGeckoTokenInfo {
  id: string
  symbol: string
  name: string
  description: {
    en: string
  }
  links: {
    homepage: string[]
    blockchain_site: string[]
    official_forum_url: string[]
    chat_url: string[]
    announcement_url: string[]
    twitter_screen_name: string
    facebook_username: string
    bitcointalk_thread_identifier: string
    telegram_channel_identifier: string
    subreddit_url: string
    repos_url: {
      github: string[]
    }
  }
  market_data: {
    current_price: { usd: number }
    market_cap: { usd: number }
    total_volume: { usd: number }
    circulating_supply: number
    total_supply: number
    max_supply: number
    fdv_to_tvl_ratio: number
    mcap_to_tvl_ratio: number
  }
  community_data: {
    facebook_likes: number
    twitter_followers: number
    reddit_average_posts_48h: number
    reddit_average_comments_48h: number
    reddit_subscribers: number
    reddit_accounts_active_48h: number
    telegram_channel_user_count: number
  }
  developer_data: {
    forks: number
    stars: number
    subscribers: number
    total_issues: number
    closed_issues: number
    pull_requests_merged: number
    pull_request_contributors: number
    code_additions_deletions_4_weeks: {
      additions: number
      deletions: number
    }
    commit_count_4_weeks: number
  }
}

export class CoinGeckoService {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.baseUrl = 'https://api.coingecko.com/api/v3'
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`)
    
    // Add API key to params for query string
    params.x_cg_demo_api_key = this.apiKey
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    // Also add API key to headers as backup
    const headers = {
      'Accept': 'application/json',
      'x-cg-demo-api-key': this.apiKey
    }

    const response = await fetch(url.toString(), { headers })
    
    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`)
      console.error(`URL: ${url.toString()}`)
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async searchTokens(query: string): Promise<any[]> {
    try {
      const response = await this.request('/search', { query }) as any
      return response.coins || []
    } catch (error) {
      console.error('Error searching tokens:', error)
      return []
    }
  }

  async getTokenInfo(tokenId: string): Promise<CoinGeckoTokenInfo | null> {
    try {
      return await this.request(`/coins/${tokenId}`, {
        localization: 'false',
        tickers: 'false',
        market_data: 'true',
        community_data: 'true',
        developer_data: 'true',
        sparkline: 'false'
      }) as CoinGeckoTokenInfo
    } catch (error) {
      console.error(`Error fetching token info for ${tokenId}:`, error)
      return null
    }
  }

  async getTokenPrice(tokenId: string): Promise<CoinGeckoToken | null> {
    try {
      const response = await this.request('/coins/markets', {
        vs_currency: 'usd',
        ids: tokenId,
        order: 'market_cap_desc',
        per_page: '1',
        page: '1',
        sparkline: 'false'
      })
      return response[0] || null
    } catch (error) {
      console.error(`Error fetching token price for ${tokenId}:`, error)
      return null
    }
  }

  async getTokensByMarketCap(limit: number = 100): Promise<CoinGeckoToken[]> {
    try {
      return await this.request('/coins/markets', {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: limit.toString(),
        page: '1',
        sparkline: 'false'
      })
    } catch (error) {
      console.error('Error fetching top tokens:', error)
      return []
    }
  }

  async getTokenPriceHistory(tokenId: string, days: number = 30): Promise<number[][]> {
    try {
      const response = await this.request(`/coins/${tokenId}/market_chart`, {
        vs_currency: 'usd',
        days: days.toString()
      }) as any
      return response.prices || []
    } catch (error) {
      console.error(`Error fetching price history for ${tokenId}:`, error)
      return []
    }
  }

  // Helper method to extract key metrics for VC analysis
  formatTokenDataForVC(tokenInfo: CoinGeckoTokenInfo): {
    overview: string
    metrics: Record<string, any>
    links: Record<string, string>
    community: Record<string, number>
    development: Record<string, number>
  } {
    return {
      overview: tokenInfo.description?.en || 'No description available',
      metrics: {
        marketCap: tokenInfo.market_data?.market_cap?.usd,
        currentPrice: tokenInfo.market_data?.current_price?.usd,
        volume24h: tokenInfo.market_data?.total_volume?.usd,
        circulatingSupply: tokenInfo.market_data?.circulating_supply,
        totalSupply: tokenInfo.market_data?.total_supply,
        maxSupply: tokenInfo.market_data?.max_supply,
        fdvToTvlRatio: tokenInfo.market_data?.fdv_to_tvl_ratio,
        mcapToTvlRatio: tokenInfo.market_data?.mcap_to_tvl_ratio
      },
      links: {
        website: tokenInfo.links?.homepage?.[0] || '',
        twitter: tokenInfo.links?.twitter_screen_name ? `https://twitter.com/${tokenInfo.links.twitter_screen_name}` : '',
        github: tokenInfo.links?.repos_url?.github?.[0] || '',
        telegram: tokenInfo.links?.telegram_channel_identifier ? `https://t.me/${tokenInfo.links.telegram_channel_identifier}` : '',
        discord: tokenInfo.links?.chat_url?.find(url => url.includes('discord')) || '',
        reddit: tokenInfo.links?.subreddit_url || ''
      },
      community: {
        twitterFollowers: tokenInfo.community_data?.twitter_followers || 0,
        redditSubscribers: tokenInfo.community_data?.reddit_subscribers || 0,
        telegramUsers: tokenInfo.community_data?.telegram_channel_user_count || 0,
        facebookLikes: tokenInfo.community_data?.facebook_likes || 0
      },
      development: {
        githubStars: tokenInfo.developer_data?.stars || 0,
        githubForks: tokenInfo.developer_data?.forks || 0,
        commits4Weeks: tokenInfo.developer_data?.commit_count_4_weeks || 0,
        contributors: tokenInfo.developer_data?.pull_request_contributors || 0,
        openIssues: (tokenInfo.developer_data?.total_issues || 0) - (tokenInfo.developer_data?.closed_issues || 0)
      }
    }
  }

  // Helper to generate VC-focused summary
  generateVCSummary(tokenId: string, tokenData: ReturnType<typeof this.formatTokenDataForVC>): string {
    const { metrics, community, development } = tokenData

    const marketCapCategory = 
      metrics.marketCap > 10_000_000_000 ? 'Large Cap (>$10B)' :
      metrics.marketCap > 1_000_000_000 ? 'Mid Cap ($1B-$10B)' :
      metrics.marketCap > 100_000_000 ? 'Small Cap ($100M-$1B)' :
      'Micro Cap (<$100M)'

    const devActivity = 
      development.commits4Weeks > 100 ? 'Very High' :
      development.commits4Weeks > 50 ? 'High' :
      development.commits4Weeks > 20 ? 'Medium' :
      development.commits4Weeks > 0 ? 'Low' : 'Inactive'

    const communitySize = 
      community.twitterFollowers > 500_000 ? 'Very Large' :
      community.twitterFollowers > 100_000 ? 'Large' :
      community.twitterFollowers > 50_000 ? 'Medium' :
      community.twitterFollowers > 10_000 ? 'Small' : 'Very Small'

    return `## ${tokenId.toUpperCase()} Market Analysis

**Market Position:** ${marketCapCategory}
- Market Cap: $${(metrics.marketCap / 1_000_000).toFixed(1)}M
- 24h Volume: $${(metrics.volume24h / 1_000_000).toFixed(1)}M
- Current Price: $${metrics.currentPrice?.toFixed(4) || 'N/A'}

**Community Metrics:** ${communitySize}
- Twitter: ${community.twitterFollowers?.toLocaleString() || 0} followers
- Reddit: ${community.redditSubscribers?.toLocaleString() || 0} subscribers
- Telegram: ${community.telegramUsers?.toLocaleString() || 0} members

**Development Activity:** ${devActivity}
- GitHub Stars: ${development.githubStars?.toLocaleString() || 0}
- Recent Commits: ${development.commits4Weeks || 0} (4 weeks)
- Contributors: ${development.contributors || 0}
- Open Issues: ${development.openIssues || 0}

**Token Economics:**
- Circulating Supply: ${metrics.circulatingSupply?.toLocaleString() || 'N/A'}
- Total Supply: ${metrics.totalSupply?.toLocaleString() || 'N/A'}
- Max Supply: ${metrics.maxSupply?.toLocaleString() || 'Unlimited'}
${metrics.fdvToTvlRatio ? `- FDV/TVL Ratio: ${metrics.fdvToTvlRatio.toFixed(2)}` : ''}
${metrics.mcapToTvlRatio ? `- MCap/TVL Ratio: ${metrics.mcapToTvlRatio.toFixed(2)}` : ''}`
  }
}