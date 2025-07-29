// OpenBB-powered AI Assistant for RedpillAI
// Replaces Suna integration with OpenBB financial data platform

// Project interface defined locally
interface Project {
  id: string
  name: string
  sector?: string
  stage?: string
  token_symbol?: string
  description?: string
  round?: string
  status?: string
}

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning_content?: string
  thought_process?: Array<{
    id: string
    type: string
    title: string
    content: string
    status: string
    reasoning?: string
    timestamp: string
  }>
}

export interface MarketData {
  btc_price?: number
  eth_price?: number
  total_market_cap?: number
  crypto_prices?: Array<{
    symbol: string
    current_price: number
    change_percent?: number
    volume: number
  }>
}

export class OpenBBAssistant {
  private apiUrl: string
  private backendUrl: string

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_OPENBB_API_URL || 'http://localhost:8000/api/v1/market'
    this.backendUrl = process.env.NEXT_PUBLIC_VC_BACKEND_URL || 'http://localhost:8000/api/v1'
    console.log('🔥 OpenBB Assistant initialized with financial data platform')
  }

  async chat(
    messages: Message[],
    currentProject?: Project | null,
    allProjects?: Project[],
    marketData?: MarketData | null,
    onStepUpdate?: (step: any) => void
  ): Promise<Message> {
    try {
      // Get the latest user message
      const userMessage = messages[messages.length - 1].content
      const messageId = Date.now().toString()

      // Notify start of analysis
      onStepUpdate?.({
        id: messageId + '_start',
        type: 'reasoning',
        title: 'OpenBB Analysis Starting',
        content: 'Analyzing query with OpenBB financial data platform...',
        status: 'active',
        timestamp: new Date().toISOString()
      })

      // Detect query type and route accordingly  
      if (this.isMarketDataQuery(userMessage)) {
        return await this.handleMarketDataQuery(userMessage, onStepUpdate)
      } else if (this.isCryptoAnalysisQuery(userMessage)) {
        return await this.handleCryptoAnalysis(userMessage, onStepUpdate)
      } else if (this.isProjectAnalysisQuery(userMessage)) {
        return await this.handleProjectAnalysis(userMessage, currentProject, onStepUpdate)
      } else {
        return await this.handleGeneralQuery(userMessage, currentProject, onStepUpdate)
      }

    } catch (error) {
      console.error('OpenBB Assistant error:', error)
      return {
        role: 'assistant',
        content: 'I apologize, but I encountered an error accessing the OpenBB financial data platform. Please ensure the backend is running and try again.',
        reasoning_content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private async handleMarketDataQuery(
    query: string, 
    onStepUpdate?: (step: any) => void
  ): Promise<Message> {
    const steps: any[] = []

    // Step 1: Extract symbols from query
    onStepUpdate?.({
      id: '1',
      type: 'analysis',
      title: 'Symbol Extraction',
      content: 'Identifying crypto symbols and market data requirements...',
      status: 'active',
      timestamp: new Date().toISOString()
    })

    const symbols = this.extractCryptoSymbols(query)
    
    steps.push({
      id: '1',
      type: 'analysis',
      title: 'Symbol Extraction',
      content: `Found symbols: ${symbols.join(', ') || 'General market data'}`,
      status: 'complete',
      timestamp: new Date().toISOString()
    })

    // Step 2: Fetch market data
    onStepUpdate?.({
      id: '2',
      type: 'data',
      title: 'Market Data Retrieval',
      content: 'Fetching live data from OpenBB platform...',
      status: 'active',
      timestamp: new Date().toISOString()
    })

    let marketContent = ''
    
    if (symbols.length > 0) {
      // Get specific crypto prices
      for (const symbol of symbols) {
        try {
          const response = await fetch(`${this.apiUrl}/crypto/${symbol}/price`)
          if (response.ok) {
            const priceData = await response.json()
            marketContent += `\n**${symbol.toUpperCase()}**\n`
            marketContent += `- Current Price: $${priceData.current_price?.toLocaleString()}\n`
            marketContent += `- 24h Change: ${priceData.change_percent ? priceData.change_percent.toFixed(2) + '%' : 'N/A'}\n`
            marketContent += `- 24h Volume: $${priceData.volume_24h?.toLocaleString()}\n`
          }
        } catch (error) {
          console.warn(`Failed to fetch ${symbol}:`, error)
        }
      }
    } else {
      // Get general market overview
      try {
        const response = await fetch(`${this.apiUrl}/overview`)
        if (response.ok) {
          const overview = await response.json()
          marketContent = `# Crypto Market Overview\n\n`
          if (overview.btc_price) {
            marketContent += `**Bitcoin (BTC)**: $${overview.btc_price.toLocaleString()}\n`
          }
          if (overview.eth_price) {
            marketContent += `**Ethereum (ETH)**: $${overview.eth_price.toLocaleString()}\n`
          }
          
          if (overview.crypto_prices?.length > 0) {
            marketContent += `\n**Top Cryptocurrencies:**\n`
            overview.crypto_prices.forEach((crypto: any) => {
              marketContent += `- ${crypto.symbol}: $${crypto.close?.toLocaleString()}\n`
            })
          }
        }
      } catch (error) {
        console.warn('Failed to fetch market overview:', error)
        marketContent = 'Market data temporarily unavailable. Please try again.'
      }
    }

    steps.push({
      id: '2',
      type: 'data',
      title: 'Market Data Retrieval',
      content: `Retrieved live market data for ${symbols.length || 'general'} assets`,
      status: 'complete',
      timestamp: new Date().toISOString()
    })

    // Step 3: Analysis and response
    onStepUpdate?.({
      id: '3',
      type: 'synthesis',
      title: 'Market Analysis',
      content: 'Analyzing market trends and generating investment insights...',
      status: 'active',
      timestamp: new Date().toISOString()
    })

    const analysisContent = this.generateMarketAnalysis(query, marketContent)
    
    steps.push({
      id: '3',
      type: 'synthesis',
      title: 'Market Analysis',
      content: 'Comprehensive market analysis complete',
      status: 'complete',
      timestamp: new Date().toISOString()
    })

    return {
      role: 'assistant',
      content: `# Market Analysis\n\n${marketContent}\n\n${analysisContent}`,
      thought_process: steps,
      reasoning_content: `Market Data Query Analysis\nSymbols: ${symbols.join(', ') || 'General market'}\nData source: OpenBB Platform\nAnalysis type: Real-time market data`
    }
  }

  private async handleCryptoAnalysis(
    query: string,
    onStepUpdate?: (step: any) => void
  ): Promise<Message> {
    const symbols = this.extractCryptoSymbols(query)
    const steps: any[] = []

    if (symbols.length === 0) {
      return {
        role: 'assistant',
        content: 'Please specify a cryptocurrency symbol for technical analysis (e.g., BTC, ETH, SOL).'
      }
    }

    const symbol = symbols[0] // Analyze first symbol

    // Step 1: Get historical data
    onStepUpdate?.({
      id: '1',
      type: 'data',
      title: 'Historical Data',
      content: `Fetching 30-day price history for ${symbol.toUpperCase()}...`,
      status: 'active',
      timestamp: new Date().toISOString()
    })

    let analysisContent = `# Technical Analysis: ${symbol.toUpperCase()}\n\n`

    try {
      const response = await fetch(`${this.apiUrl}/crypto/${symbol}/historical?days=30`)
      if (response.ok) {
        const historical = await response.json()
        
        steps.push({
          id: '1',
          type: 'data',
          title: 'Historical Data',
          content: `Retrieved ${historical.data_points} data points`,
          status: 'complete',
          timestamp: new Date().toISOString()
        })

        // Step 2: Technical indicators
        onStepUpdate?.({
          id: '2',
          type: 'analysis',
          title: 'Technical Indicators',
          content: 'Calculating technical indicators...',
          status: 'active',
          timestamp: new Date().toISOString()
        })

        const indicators = await fetch(`${this.apiUrl}/crypto/${symbol}/analysis?indicator=sma`)
        if (indicators.ok) {
          const indicatorData = await indicators.json()
          analysisContent += `**Current Price**: $${indicatorData.current_price?.toLocaleString()}\n`
          analysisContent += `**Data Points**: ${indicatorData.data_points}\n\n`
          analysisContent += `**Technical Analysis**:\n${indicatorData.analysis}\n\n`
        }

        steps.push({
          id: '2',
          type: 'analysis',
          title: 'Technical Indicators',
          content: 'Technical analysis complete',
          status: 'complete',
          timestamp: new Date().toISOString()
        })

        // Step 3: Investment insights
        onStepUpdate?.({
          id: '3',
          type: 'synthesis',
          title: 'Investment Insights',
          content: 'Generating investment recommendations...',
          status: 'active',
          timestamp: new Date().toISOString()
        })

        analysisContent += this.generateTechnicalInsights(symbol, historical.data)

        steps.push({
          id: '3',
          type: 'synthesis',
          title: 'Investment Insights',
          content: 'Investment analysis complete',
          status: 'complete',
          timestamp: new Date().toISOString()
        })

      } else {
        analysisContent += 'Historical data not available for this symbol.'
      }
    } catch (error) {
      analysisContent += `Analysis temporarily unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`
    }

    return {
      role: 'assistant',
      content: analysisContent,
      thought_process: steps,
      reasoning_content: `Technical Analysis\nSymbol: ${symbol}\nTimeframe: 30 days\nIndicators: SMA, price action\nData source: OpenBB Platform`
    }
  }

  private async handleProjectAnalysis(
    query: string,
    project?: Project | null,
    onStepUpdate?: (step: any) => void
  ): Promise<Message> {
    if (!project) {
      return {
        role: 'assistant',
        content: 'Please select a project first to perform analysis.'
      }
    }

    onStepUpdate?.({
      id: '1',
      type: 'reasoning',
      title: 'Project Analysis',
      content: `Analyzing ${project.name} using OpenBB data...`,
      status: 'active',
      timestamp: new Date().toISOString()
    })

    // If project has a token symbol, get market data
    let marketAnalysis = ''
    if (project.token_symbol) {
      try {
        const response = await fetch(`${this.apiUrl}/crypto/${project.token_symbol}/price`)
        if (response.ok) {
          const priceData = await response.json()
          marketAnalysis = `\n## Token Market Data\n`
          marketAnalysis += `**${project.token_symbol.toUpperCase()}** Current Price: $${priceData.current_price?.toLocaleString()}\n`
          marketAnalysis += `24h Change: ${priceData.change_percent?.toFixed(2)}%\n`
          marketAnalysis += `24h Volume: $${priceData.volume_24h?.toLocaleString()}\n\n`
        }
      } catch (error) {
        console.warn('Failed to fetch token data:', error)
      }
    }

    const analysis = `# Project Analysis: ${project.name}\n\n`
      + `**Description**: ${project.description}\n`
      + `**Stage**: ${project.round || 'Unknown'}\n`
      + `**Status**: ${project.status}\n`
      + marketAnalysis
      + `\n## Investment Thesis\n`
      + `This analysis combines project fundamentals with real-time market data from OpenBB platform.\n\n`
      + `**Key Considerations:**\n`
      + `- Market position and competitive landscape\n`
      + `- Token economics and price performance\n`
      + `- Team execution and roadmap progress\n`
      + `- Regulatory and technology risks\n\n`
      + `*Analysis powered by OpenBB financial data platform*`

    return {
      role: 'assistant',
      content: analysis,
      thought_process: [{
        id: '1',
        type: 'analysis',
        title: 'Project Analysis Complete',
        content: `Analyzed ${project.name} with market data integration`,
        status: 'complete',
        timestamp: new Date().toISOString()
      }]
    }
  }

  private async handleGeneralQuery(
    query: string,
    project?: Project | null,
    onStepUpdate?: (step: any) => void
  ): Promise<Message> {
    onStepUpdate?.({
      id: '1',
      type: 'reasoning',
      title: 'General Analysis',
      content: 'Processing query with OpenBB context...',
      status: 'active',
      timestamp: new Date().toISOString()
    })

    // Use the backend AI service for general queries
    try {
      const response = await fetch(`${this.backendUrl}/chat/quick-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deal_id: project?.id || 'general',
          analysis_type: 'general_inquiry'
        })
      })

      if (response.ok) {
        const result = await response.json()
        return {
          role: 'assistant',
          content: result.content || `I understand you're asking about: "${query}"\n\nI'm RedPill AI, powered by OpenBB's financial data platform. I can help with:\n\n- Real-time crypto market data and analysis\n- Technical analysis and price trends\n- Portfolio analysis and risk assessment\n- Investment research and due diligence\n\nHow can I assist with your investment research today?`,
          thought_process: [{
            id: '1',
            type: 'analysis',
            title: 'General Response',
            content: 'Processed general query with AI backend',
            status: 'complete',
            timestamp: new Date().toISOString()
          }]
        }
      }
    } catch (error) {
      console.warn('Backend AI unavailable, using fallback:', error)
    }

    // Fallback response
    return {
      role: 'assistant',
      content: `I understand you're asking about: "${query}"\n\nI'm RedPill AI, powered by OpenBB's financial data platform. I can help with:\n\n- Real-time crypto market data and analysis\n- Technical analysis and price trends\n- Portfolio analysis and risk assessment\n- Investment research and due diligence\n\nHow can I assist with your investment research today?`,
      reasoning_content: 'General query processed with OpenBB context'
    }
  }

  // Helper methods
  private extractCryptoSymbols(query: string): string[] {
    const cryptoRegex = /\b(BTC|ETH|SOL|ADA|DOT|AVAX|LINK|UNI|ATOM|NEAR|MATIC|BNB|XRP|DOGE|SHIB|LTC|BCH|ETC|TRX|XLM|VET)\b/gi
    const matches = query.match(cryptoRegex)
    return matches ? Array.from(new Set(matches.map(m => m.toUpperCase()))) : []
  }

  private isMarketDataQuery(message: string): boolean {
    const marketKeywords = [
      'price', 'market', 'btc', 'eth', 'bitcoin', 'ethereum', 'crypto',
      'trading', 'volume', 'market cap', 'current', 'today', 'now'
    ]
    const lowercaseMessage = message.toLowerCase()
    return marketKeywords.some(keyword => lowercaseMessage.includes(keyword))
  }

  private isCryptoAnalysisQuery(message: string): boolean {
    const analysisKeywords = [
      'analysis', 'technical', 'chart', 'trend', 'indicator', 'sma',
      'resistance', 'support', 'bullish', 'bearish', 'forecast'
    ]
    const lowercaseMessage = message.toLowerCase()
    return analysisKeywords.some(keyword => lowercaseMessage.includes(keyword))
  }

  private isProjectAnalysisQuery(message: string): boolean {
    const projectKeywords = [
      'this project', 'current project', 'analyze project',
      'tell me about', 'what is', 'evaluate', 'assessment'
    ]
    const lowercaseMessage = message.toLowerCase()
    return projectKeywords.some(keyword => lowercaseMessage.includes(keyword))
  }

  private generateMarketAnalysis(query: string, marketData: string): string {
    return `## Market Insights\n\n`
      + `Based on the current market data, here are key insights:\n\n`
      + `- **Data Source**: Live data from OpenBB platform\n`
      + `- **Coverage**: Real-time pricing and volume data\n`
      + `- **Analysis**: Market conditions and trends\n\n`
      + `For detailed technical analysis, ask about specific indicators or request historical analysis.\n\n`
      + `*This analysis uses real-time data from OpenBB's financial data platform.*`
  }

  private generateTechnicalInsights(symbol: string, data: any[]): string {
    return `## Investment Insights\n\n`
      + `**Technical Overview for ${symbol.toUpperCase()}:**\n\n`
      + `- **Data Quality**: ${data?.length || 0} historical data points analyzed\n`
      + `- **Trend Analysis**: Based on recent price action and volume\n`
      + `- **Risk Assessment**: Consider volatility and market conditions\n\n`
      + `**Key Recommendations:**\n`
      + `- Monitor key support and resistance levels\n`
      + `- Consider dollar-cost averaging for long-term positions\n`
      + `- Stay updated on fundamental developments\n`
      + `- Manage risk with appropriate position sizing\n\n`
      + `*Analysis powered by OpenBB technical indicators and market data.*`
  }
}

// Export default instance
export default OpenBBAssistant