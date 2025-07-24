// Mock Suna client for testing integration without full Suna deployment
// This simulates Suna's responses to validate our integration approach

import { SunaThread, SunaMessage, SunaResearchResult } from './suna-client'

export class MockSunaClient {
  private threads: Map<string, SunaThread> = new Map()
  private messages: Map<string, SunaMessage[]> = new Map()

  async createThread(context?: Record<string, any>): Promise<SunaThread> {
    const thread: SunaThread = {
      id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      metadata: context
    }

    this.threads.set(thread.id, thread)
    this.messages.set(thread.id, [])
    
    console.log('🧵 Mock Suna: Created thread', thread.id, 'with context:', context)
    return thread
  }

  async sendMessage(
    threadId: string, 
    message: string,
    options?: {
      tools?: string[]
      stream?: boolean
    }
  ): Promise<SunaMessage> {
    console.log('💬 Mock Suna: Processing message in thread', threadId)
    console.log('📝 Message:', message)
    console.log('🔧 Tools:', options?.tools)

    // Simulate processing delay
    await this.delay(1000)

    // Generate mock response based on message content
    let response = this.generateMockResponse(message, options?.tools || [])

    const sunaMessage: SunaMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      thread_id: threadId,
      role: 'assistant',
      content: response,
      created_at: new Date().toISOString(),
      metadata: {
        tools_used: options?.tools,
        processing_time: '1.2s'
      }
    }

    // Store message
    const threadMessages = this.messages.get(threadId) || []
    threadMessages.push({
      id: `msg_user_${Date.now()}`,
      thread_id: threadId,
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    })
    threadMessages.push(sunaMessage)
    this.messages.set(threadId, threadMessages)

    return sunaMessage
  }

  async conductResearch(query: string, context?: string): Promise<SunaResearchResult> {
    console.log('🔬 Mock Suna: Conducting research for:', query)
    console.log('📋 Context:', context)

    // Simulate longer processing for research
    await this.delay(2000)

    return {
      summary: `Mock research summary for "${query}": This is a simulated comprehensive analysis that would normally be powered by Suna's web search, scraping, and AI analysis capabilities. The system would gather data from multiple sources, cross-reference information, and provide actionable insights for VC decision-making.`,
      sources: [
        {
          title: `${query} - Official Website`,
          url: `https://example.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
          snippet: `Official information about ${query} including recent updates and announcements.`
        },
        {
          title: `${query} Funding News - TechCrunch`,
          url: 'https://techcrunch.com/mock-article',
          snippet: `Recent funding and investment news related to ${query}.`
        },
        {
          title: `${query} Analysis - CoinDesk`,
          url: 'https://coindesk.com/mock-analysis',
          snippet: `Market analysis and technical review of ${query}.`
        }
      ],
      findings: [
        `${query} shows strong market traction with recent user growth`,
        'Technology stack appears robust with good scalability potential',
        'Team has relevant experience in the sector',
        'Competitive landscape is active but not oversaturated',
        'Recent funding round indicates healthy investor interest'
      ],
      confidence: 0.85
    }
  }

  private generateMockResponse(message: string, tools: string[]): string {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('research') || lowerMessage.includes('analyze')) {
      return `🔍 **Suna Research Analysis** (Mock)

Based on my analysis using ${tools.length} tools (${tools.join(', ')}), here's what I found:

**Key Findings:**
• Strong market position with growing user base
• Technology architecture shows good scalability
• Team has relevant industry experience
• Recent funding indicates healthy investor interest

**Market Context:**
The sector shows positive growth trends with increasing adoption rates. Competitive landscape is active but not oversaturated.

**Investment Implications:**
This appears to be a promising opportunity with manageable risk profile. Recommend deeper due diligence on team execution and market timing.

*Note: This is a mock response. Real Suna would provide live web research data.*`
    }

    if (lowerMessage.includes('project') || lowerMessage.includes('company')) {
      return `📊 **Project Analysis** (Mock)

**Overview:**
Mock company analysis showing strong fundamentals and growth potential.

**Technology:**
• Solid technical foundation
• Good scalability architecture
• Active development team

**Market Position:**
• Growing market segment
• Competitive but differentiated approach
• Strong user adoption metrics

**Team Assessment:**
• Experienced leadership
• Relevant industry background
• Good execution track record

*Note: This is a mock response demonstrating Suna integration.*`
    }

    if (lowerMessage.includes('investors') || lowerMessage.includes('vc')) {
      return `💰 **Investor Research** (Mock)

**Relevant VCs:**
1. **Mock Ventures** - Andreessen Horowitz-style firm
   - Focus: Early-stage tech
   - Portfolio: 100+ companies
   - Contact: partners@mockventures.com

2. **Demo Capital** - Sequoia Capital-style firm
   - Focus: Series A/B
   - AUM: $5B+
   - Contact: deals@democapital.com

3. **Test Partners** - Specialized fund
   - Focus: Crypto/Web3
   - Recent investments: 50+ deals
   - Contact: hello@testpartners.vc

*Note: This is mock data for testing Suna integration.*`
    }

    // Default response
    return `Hello! I'm a mock Suna AI assistant. In a real deployment, I would use tools like ${tools.join(', ')} to provide comprehensive answers with live web research, document analysis, and multi-step reasoning.

Your message: "${message}"

*This is a simulation to test our Suna integration architecture.*`
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Additional mock methods for completeness
  async generateMemo(projectData: any): Promise<SunaMessage> {
    const thread = await this.createThread({ type: 'investment_memo', project: projectData })
    
    return this.sendMessage(thread.id, 
      `Generate investment memo for ${projectData.name}`,
      { tools: ['web_search', 'file_create'] }
    )
  }

  async searchInvestors(criteria: string): Promise<SunaMessage> {
    const thread = await this.createThread({ type: 'investor_search' })
    
    return this.sendMessage(thread.id, 
      `Search for investors: ${criteria}`,
      { tools: ['web_search', 'linkedin_scrape'] }
    )
  }

  async monitorPortfolio(companies: string[]): Promise<SunaMessage> {
    const thread = await this.createThread({ type: 'portfolio_monitoring' })
    
    return this.sendMessage(thread.id, 
      `Monitor portfolio companies: ${companies.join(', ')}`,
      { tools: ['web_search', 'news_search'] }
    )
  }
}