import { CryptoResearchAgent } from "./agents/crypto-research-agent"
import { DeepResearchAgent } from "./agents/deep-research-agent"
import { QuickResearchAgent } from "./quick-research-agent"
import { CoinGeckoService } from "../services/coingecko"
import { RedpillAIProvider } from "./redpill-provider"

export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  projectId?: string
  conversationId?: string
  metadata?: {
    type?: "research" | "analysis" | "general"
    step?: string
    isStreaming?: boolean
  }
}

export interface StreamingCallback {
  onStep?: (step: string, content: string) => void
  onComplete?: (finalAnswer: string) => void
  onError?: (error: string) => void
}

export class VCAssistant {
  private researchAgent: CryptoResearchAgent
  private deepResearchAgent: DeepResearchAgent
  private quickResearchAgent: QuickResearchAgent
  private coinGeckoService: CoinGeckoService
  private apiKey: string

  constructor(apiKey: string, coinGeckoApiKey?: string) {
    this.apiKey = apiKey
    // Note: Research agents still use API key directly for now
    // TODO: Migrate these to server-side endpoints for better security
    this.researchAgent = new CryptoResearchAgent(apiKey)
    this.deepResearchAgent = new DeepResearchAgent(apiKey, {
      maxIterations: 1, // Reduced for speed
      maxSources: 5,    // Reduced for speed
      confidenceThreshold: 0.5
    })
    this.quickResearchAgent = new QuickResearchAgent(apiKey)
    this.coinGeckoService = new CoinGeckoService(coinGeckoApiKey || '')
  }

  async chat(
    message: string, 
    projectId?: string, 
    conversationHistory: Message[] = [],
    onStepUpdate?: (step: any) => void
  ): Promise<string> {
    console.log('🤖 VCAssistant.chat called:', {
      message: message.substring(0, 50) + '...',
      projectId,
      hasStepCallback: !!onStepUpdate,
      conversationLength: conversationHistory.length
    })
    
    try {
      // Check if this is a system task that should bypass routing
      if (message.startsWith('[SYSTEM_TASK]')) {
        console.log('🔧 System task detected, routing directly to AI')
        const cleanMessage = message.replace('[SYSTEM_TASK]', '').trim()
        return await this.generalChat(cleanMessage, conversationHistory, null)
      }
      
      // Check query types with logging
      const isMarketData = this.isMarketDataQuery(message)
      const isDeepResearch = this.isDeepResearchQuery(message)
      const isRegularResearch = this.isResearchQuery(message)
      
      console.log('🔍 Query classification:', {
        message: message.substring(0, 30) + '...',
        isMarketData,
        isDeepResearch,
        isRegularResearch
      })

      // Check if this is a market data query
      if (isMarketData) {
        console.log('📊 Routing to market data handler')
        const projectName = projectId ? await this.getProjectName(projectId) : undefined
        return await this.handleMarketDataQuery(message, projectName)
      }

      // Check for deep research queries first
      if (isDeepResearch) {
        console.log('🧠 Routing to deep research handler')
        const projectName = projectId ? await this.getProjectName(projectId) : undefined
        const researchQuery = projectName ? `${message} ${projectName}` : message
        return await this.handleDeepResearch(researchQuery, projectName, onStepUpdate)
      }

      // Determine if this is a research query
      if (isRegularResearch) {
        console.log('🚀 Routing to quick research handler')
        const projectName = projectId ? await this.getProjectName(projectId) : undefined
        
        // Use quick research for faster results with progress
        const researchQuery = projectName ? `${message} ${projectName}` : message
        return await this.handleQuickResearch(researchQuery, projectName, onStepUpdate)
      }

      // For general chat, use simple AI response with project context
      console.log('💬 Routing to general chat handler')
      const projectName = projectId ? await this.getProjectName(projectId) : undefined
      return await this.generalChat(message, conversationHistory, projectName)
    } catch (error) {
      console.error("VCAssistant error:", error)
      console.error("Error details:", error instanceof Error ? error.message : 'Unknown error')
      console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack')
      
      // Return a fallback response instead of throwing
      return `I'm currently experiencing technical difficulties with the AI service. This might be due to:

1. **API Connection Issues**: The Redpill AI service might be temporarily unavailable
2. **Authentication**: API key might need verification
3. **Rate Limits**: Too many requests in a short time

For now, I can help with basic information about crypto projects and VCs. Please try again in a moment, or check the console for detailed error logs.

**Error**: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  async streamChat(
    message: string,
    projectId?: string,
    conversationHistory: Message[] = [],
    callbacks: StreamingCallback = {}
  ): Promise<void> {
    try {
      if (this.isResearchQuery(message)) {
        const projectName = projectId ? await this.getProjectName(projectId) : undefined
        
        await this.researchAgent.streamResearch(
          message,
          projectName,
          callbacks.onStep
        )
      } else {
        // For general chat, use streaming response
        await this.streamGeneralChat(message, conversationHistory, callbacks)
      }
    } catch (error) {
      console.error("VCAssistant streaming error:", error)
      callbacks.onError?.("I encountered an error while processing your request. Please try again.")
    }
  }

  private isResearchQuery(message: string): boolean {
    // Trigger research for broader set of research-related queries
    const researchKeywords = [
      "research", "analysis", "investigate", "find out", "look up", "search for",
      "what's the latest", "recent", "current", "update", "news about",
      "comprehensive research", "detailed analysis", "full report",
      "extensive evaluation", "thorough assessment", "in-depth study"
    ]
    
    const lowerMessage = message.toLowerCase()
    return researchKeywords.some(keyword => lowerMessage.includes(keyword))
  }

  private isDeepResearchQuery(message: string): boolean {
    // Only trigger deep research for very specific requests
    const deepResearchKeywords = [
      "due diligence", "investment memo", "research report", 
      "deep dive analysis", "comprehensive report"
    ]
    
    const lowerMessage = message.toLowerCase()
    return deepResearchKeywords.some(keyword => lowerMessage.includes(keyword))
  }

  private isMarketDataQuery(message: string): boolean {
    const marketKeywords = [
      "price", "market cap", "volume", "trading", "liquidity",
      "supply", "token", "chart", "performance", "mcap",
      "fdv", "tvl", "current price", "24h", "ath", "atl",
      "arr", "revenue", "valuation", "funding", "investment",
      "latest arr", "annual recurring revenue", "financial"
    ]
    
    const lowerMessage = message.toLowerCase()
    return marketKeywords.some(keyword => lowerMessage.includes(keyword))
  }

  private async handleDeepResearch(
    query: string, 
    projectName?: string,
    onStepUpdate?: (step: any) => void
  ): Promise<string> {
    try {
      console.log(`🔬 Conducting deep research for: "${query}"`, {
        hasStepCallback: !!onStepUpdate,
        projectName
      })
      
      const researchState = await this.deepResearchAgent.conductDeepResearch(
        query,
        (state) => {
          console.log(`📊 Research progress: ${this.deepResearchAgent.getProgressSummary(state)}`)
        },
        onStepUpdate
      )

      // Format the research results for VC context
      let report = `# Deep Research Report\n\n**Query:** ${query}\n\n`
      
      if (researchState.synthesis) {
        report += `${researchState.synthesis}\n\n`
      }

      if (researchState.findings.length > 0) {
        report += `## Key Research Findings\n\n`
        researchState.findings.forEach((finding, idx) => {
          report += `${idx + 1}. ${finding}\n`
        })
        report += `\n`
      }

      if (researchState.sources_cited.length > 0) {
        report += `## Sources\n\n`
        report += `*Research based on ${researchState.search_results.length} sources with ${Math.round(researchState.confidence_score * 100)}% confidence*\n\n`
        
        researchState.search_results.slice(0, 8).forEach((source, idx) => {
          report += `${idx + 1}. [${source.title}](${source.url}) - ${source.source}\n`
        })
      }

      report += `\n*Research completed: ${new Date().toLocaleString()}*`

      return report

    } catch (error) {
      console.error('Deep research failed:', error)
      return `I attempted to conduct comprehensive research on "${query}" but encountered technical difficulties. 

Here's what I can tell you based on my knowledge base:

${projectName ? `${projectName} is a cryptocurrency project that I can analyze using available information.` : 'I can provide general analysis based on available information.'}

For the most current information, you might want to:
- Check recent news sources directly
- Review the project's official documentation
- Look at recent funding announcements
- Examine community discussions and social media

Please try your query again, or ask me to focus on specific aspects I can analyze with available data.`
    }
  }

  private async handleQuickResearch(
    query: string, 
    projectName?: string,
    onStepUpdate?: (step: any) => void
  ): Promise<string> {
    try {
      console.log(`🚀 Conducting quick research for: "${query}"`, {
        hasStepCallback: !!onStepUpdate,
        projectName
      })
      
      const result = await this.quickResearchAgent.conductQuickResearch(
        query,
        onStepUpdate
      )

      // Format the research results for VC context
      let report = `# Research Report\n\n**Query:** ${query}\n\n`
      
      if (result.summary) {
        report += `${result.summary}\n\n`
      }

      if (result.keyFindings.length > 0) {
        report += `## Key Research Findings\n\n`
        result.keyFindings.forEach((finding, idx) => {
          report += `${idx + 1}. ${finding}\n`
        })
        report += `\n`
      }

      if (result.sources.length > 0) {
        report += `## Sources\n\n`
        report += `*Research based on ${result.sources.length} sources with ${Math.round(result.confidence * 100)}% confidence*\n\n`
        
        result.sources.slice(0, 5).forEach((source, idx) => {
          report += `${idx + 1}. [${source.title}](${source.url}) - ${source.source}\n`
        })
      }

      report += `\n*Research completed: ${result.timestamp.toLocaleString()}*`

      return report

    } catch (error) {
      console.error('Quick research failed:', error)
      return `I attempted to research "${query}" but encountered technical difficulties. 

Here's what I can tell you based on my knowledge base:

${projectName ? `${projectName} is a project that I can analyze using available information.` : 'I can provide general analysis based on available information.'}

For the most current information, please try a more specific query or check back later.`
    }
  }

  private async handleMarketDataQuery(message: string, projectName?: string): Promise<string> {
    if (!projectName) {
      return "Please select a project first to get market data analysis."
    }

    try {
      // First try to get CoinGecko data, but don't fail if it's unavailable
      let marketDataSummary = ""
      try {
        const searchResults = await this.coinGeckoService.searchTokens(projectName)
        
        if (searchResults.length > 0) {
          const tokenId = searchResults[0].id
          const tokenInfo = await this.coinGeckoService.getTokenInfo(tokenId)
          
          if (tokenInfo) {
            const formattedData = this.coinGeckoService.formatTokenDataForVC(tokenInfo)
            marketDataSummary = this.coinGeckoService.generateVCSummary(tokenId, formattedData)
          }
        }
      } catch (coinGeckoError) {
        console.log("CoinGecko unavailable, proceeding without market data:", coinGeckoError)
        marketDataSummary = "*Market data from CoinGecko is currently unavailable*"
      }

      // Always provide analysis even without CoinGecko data
      const analysisPrompt = `
User Question: ${message}

Project: ${projectName}

${marketDataSummary ? `Market Data:\n${marketDataSummary}` : "Market data is currently unavailable, so please focus on fundamental analysis."}

As a crypto VC analyst, provide insights about ${projectName} based on the user's question. Focus on:
- Investment thesis and fundamentals
- Project positioning in the crypto ecosystem
- Technology and team assessment
- Market opportunity and competition
- Risk factors and due diligence considerations

If specific market data isn't available, use your knowledge of crypto projects and VC analysis principles.
`

      // Create a temporary instance to analyze market data
      const aiProvider = new RedpillAIProvider(this.apiKey)
      const response = await aiProvider.chat([
        { role: "system", content: "You are an expert crypto VC analyst. You can analyze projects with or without real-time market data by focusing on fundamentals, technology, team, and market positioning." },
        { role: "user", content: analysisPrompt }
      ])

      return response.content

    } catch (error) {
      console.error("Market data query error:", error)
      return `I can still help analyze ${projectName} from a VC perspective. What specific aspects would you like me to focus on? (team, technology, market opportunity, competitive landscape, etc.)`
    }
  }

  private async getMarketDataForProject(projectName: string): Promise<string | undefined> {
    try {
      const searchResults = await this.coinGeckoService.searchTokens(projectName)
      
      if (searchResults.length === 0) return undefined

      const tokenId = searchResults[0].id
      const tokenInfo = await this.coinGeckoService.getTokenInfo(tokenId)
      
      if (!tokenInfo) return undefined

      const formattedData = this.coinGeckoService.formatTokenDataForVC(tokenInfo)
      return this.coinGeckoService.generateVCSummary(tokenId, formattedData)

    } catch (error) {
      console.error("Error getting market data:", error)
      return undefined
    }
  }

  private async getProjectName(projectId: string): Promise<string | undefined> {
    // In a real implementation, this would query the database
    // For now, check localStorage and URL-based project names
    try {
      // First check localStorage for projects
      if (typeof window !== 'undefined') {
        const projects = JSON.parse(localStorage.getItem('projects') || '[]')
        const project = projects.find((p: any) => p.id === projectId)
        if (project?.company_name || project?.name) {
          return project.company_name || project.name
        }
      }
      
      // Check if projectId is actually a company name from URL (like "chainlink", "polkadot")
      if (projectId && isNaN(Number(projectId))) {
        // Capitalize first letter for display
        return projectId.charAt(0).toUpperCase() + projectId.slice(1)
      }
      
      // Fallback to mock project data for demo
      const mockProjects: Record<string, string> = {
        "1": "LayerZero",
        "2": "Celestia", 
        "3": "Monad Labs",
        "4": "Eigenlayer",
        "5": "Babylon",
        "6": "Berachain",
        "7": "Scroll",
        "chainlink": "Chainlink",
        "polkadot": "Polkadot"
      }
      
      return mockProjects[projectId] || `Project ${projectId}`
    } catch (error) {
      // Fallback to generic project name
      return projectId || 'Unknown Project'
    }
  }

  private async generalChat(message: string, history: Message[], projectName?: string): Promise<string> {
    // Create context from conversation history
    const systemPrompt = projectName 
      ? `You are an expert crypto venture capital assistant analyzing ${projectName}. You help VCs with:
- Investment research and analysis for ${projectName}
- Market intelligence and trends
- Due diligence insights
- Portfolio management advice
- Crypto and blockchain expertise

Focus your analysis specifically on ${projectName}. Keep responses concise, actionable, and focused on VC decision-making.`
      : `You are an expert crypto venture capital assistant. You help VCs with:
- Investment research and analysis
- Market intelligence and trends
- Due diligence insights
- Portfolio management advice
- Crypto and blockchain expertise

Keep responses concise, actionable, and focused on VC decision-making.`

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...history.slice(-10).map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      })),
      {
        role: "user", 
        content: message
      }
    ]

    const aiProvider = new RedpillAIProvider(this.apiKey)
    const response = await aiProvider.chat(messages)
    return response.content
  }

  private async streamGeneralChat(
    message: string, 
    history: Message[], 
    callbacks: StreamingCallback
  ): Promise<void> {
    const messages = [
      {
        role: "system",
        content: `You are an expert crypto venture capital assistant. You help VCs with:
- Investment research and analysis  
- Market intelligence and trends
- Due diligence insights
- Portfolio management advice
- Crypto and blockchain expertise

Keep responses concise, actionable, and focused on VC decision-making.`
      },
      ...history.slice(-10).map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      })),
      {
        role: "user",
        content: message
      }
    ]

    try {
      const aiProvider = new RedpillAIProvider(this.apiKey)
      const stream = await aiProvider.streamChat(messages)
      let fullResponse = ""
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ""
        if (content) {
          fullResponse += content
          callbacks.onStep?.("generating", content)
        }
      }
      
      callbacks.onComplete?.(fullResponse)
    } catch (error) {
      callbacks.onError?.("Failed to generate response")
    }
  }

  // Method to get conversation context for a specific deal/project
  async getProjectContext(projectId: string): Promise<string> {
    // This would fetch project-specific context from the knowledge base
    // For now, return mock context
    const projectName = await this.getProjectName(projectId)
    
    return `You are discussing ${projectName}. This conversation is focused on analyzing this specific crypto project from a VC investment perspective. Consider all previous research, documents, and conversations about this project in your responses.`
  }

  // Method to analyze uploaded documents
  async analyzeDocument(documentContent: string, projectId?: string): Promise<string> {
    const projectName = projectId ? await this.getProjectName(projectId) : undefined
    const query = `Analyze this document and provide key insights for VC investment consideration${projectName ? ` for ${projectName}` : ''}: ${documentContent.substring(0, 1000)}...`
    
    return await this.researchAgent.research(query, projectName)
  }
}