import { CryptoResearchAgent } from "./agents/crypto-research-agent"
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
  private coinGeckoService: CoinGeckoService
  private apiKey: string

  constructor(apiKey: string, coinGeckoApiKey: string) {
    this.apiKey = apiKey
    this.researchAgent = new CryptoResearchAgent(apiKey)
    this.coinGeckoService = new CoinGeckoService(coinGeckoApiKey)
  }

  async chat(
    message: string, 
    projectId?: string, 
    conversationHistory: Message[] = []
  ): Promise<string> {
    try {
      // Check if this is a market data query
      if (this.isMarketDataQuery(message)) {
        const projectName = projectId ? await this.getProjectName(projectId) : undefined
        return await this.handleMarketDataQuery(message, projectName)
      }

      // Determine if this is a research query
      if (this.isResearchQuery(message)) {
        const projectName = projectId ? await this.getProjectName(projectId) : undefined
        const marketData = projectName ? await this.getMarketDataForProject(projectName) : undefined
        return await this.researchAgent.research(message, projectName, marketData)
      }

      // For general chat, use simple AI response
      return await this.generalChat(message, conversationHistory)
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
    const researchKeywords = [
      "analyze", "research", "compare", "evaluate", "assess",
      "due diligence", "market", "competition", "tokenomics",
      "team", "technical", "risks", "opportunities", "investment",
      "protocol", "blockchain", "defi", "layer", "smart contract"
    ]
    
    const lowerMessage = message.toLowerCase()
    return researchKeywords.some(keyword => lowerMessage.includes(keyword))
  }

  private isMarketDataQuery(message: string): boolean {
    const marketKeywords = [
      "price", "market cap", "volume", "trading", "liquidity",
      "supply", "token", "chart", "performance", "mcap",
      "fdv", "tvl", "current price", "24h", "ath", "atl"
    ]
    
    const lowerMessage = message.toLowerCase()
    return marketKeywords.some(keyword => lowerMessage.includes(keyword))
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
    // For now, try to get from localStorage or return a generic name
    try {
      const projects = JSON.parse(localStorage.getItem('projects') || '[]')
      const project = projects.find((p: any) => p.id === projectId)
      return project?.company_name || project?.name || `Project ${projectId}`
    } catch (error) {
      // Fallback to generic project name
      return `Project ${projectId}`
    }
  }

  private async generalChat(message: string, history: Message[]): Promise<string> {
    // Create context from conversation history
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