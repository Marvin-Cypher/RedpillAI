import { SearchService, SearchResult } from '../../services/search-service'
import { RedpillAIProvider } from '../redpill-provider'

export interface ResearchQuery {
  query: string
  context?: string
  maxSources?: number
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all'
  focusAreas?: ('news' | 'technical' | 'financial' | 'team' | 'partnerships')[]
}

export interface ResearchResult {
  summary: string
  keyFindings: string[]
  sources: SearchResult[]
  confidence: 'high' | 'medium' | 'low'
  lastUpdated: string
}

export class WebResearchAgent {
  private searchService: SearchService
  private aiProvider: RedpillAIProvider

  constructor(aiApiKey: string) {
    this.searchService = new SearchService()
    this.aiProvider = new RedpillAIProvider(aiApiKey)
  }

  /**
   * Conduct comprehensive web research on a topic
   */
  async research(researchQuery: ResearchQuery): Promise<ResearchResult> {
    console.log('🔍 Starting web research for:', researchQuery.query)

    try {
      // Step 1: Generate research queries
      const queries = await this.generateResearchQueries(researchQuery)
      console.log('📝 Generated research queries:', queries)

      // Step 2: Search for information
      const allResults: SearchResult[] = []
      
      for (const query of queries) {
        const results = await this.searchService.search(query, {
          maxResults: Math.ceil((researchQuery.maxSources || 10) / queries.length),
          timeRange: researchQuery.timeRange || 'month'
        })
        
        allResults.push(...results)
        
        // Reduced delay to speed up research
        await this.delay(200)
      }

      // Step 3: Deduplicate and rank results
      const uniqueResults = this.deduplicateResults(allResults)
      const rankedResults = this.rankResults(uniqueResults, researchQuery.query)
      const topResults = rankedResults.slice(0, researchQuery.maxSources || 10)

      console.log(`📊 Found ${topResults.length} unique sources`)

      // Step 4: Analyze and synthesize findings
      const analysis = await this.analyzeResults(topResults, researchQuery)

      return {
        summary: analysis.summary,
        keyFindings: analysis.keyFindings,
        sources: topResults,
        confidence: this.assessConfidence(topResults),
        lastUpdated: new Date().toISOString()
      }

    } catch (error) {
      console.error('Web research failed:', error)
      
      return {
        summary: `Unable to complete web research for "${researchQuery.query}". ${error instanceof Error ? error.message : 'Unknown error occurred.'}`,
        keyFindings: ['Research failed due to technical issues'],
        sources: [],
        confidence: 'low',
        lastUpdated: new Date().toISOString()
      }
    }
  }

  /**
   * Research specific to crypto projects
   */
  async researchCryptoProject(projectName: string, focusAreas?: string[]): Promise<ResearchResult> {
    const queries = [
      `${projectName} crypto project latest news`,
      `${projectName} blockchain funding investment`,
      `${projectName} tokenomics whitepaper`,
      `${projectName} team founders background`,
      `${projectName} partnerships integrations`,
      ...(focusAreas || []).map(area => `${projectName} ${area}`)
    ]

    const allResults: SearchResult[] = []
    
    for (const query of queries.slice(0, 5)) { // Limit to 5 queries
      try {
        const results = await this.searchService.searchCrypto(query, {
          maxResults: 3,
          timeRange: 'month'
        })
        allResults.push(...results)
        await this.delay(200)
      } catch (error) {
        console.warn(`Failed to search for: ${query}`, error)
      }
    }

    const uniqueResults = this.deduplicateResults(allResults)
    const topResults = uniqueResults.slice(0, 15)

    if (topResults.length === 0) {
      return {
        summary: `No recent information found for ${projectName}. This might be a new or private project.`,
        keyFindings: ['Limited public information available'],
        sources: [],
        confidence: 'low',
        lastUpdated: new Date().toISOString()
      }
    }

    const analysis = await this.analyzeCryptoProject(topResults, projectName)

    return {
      summary: analysis.summary,
      keyFindings: analysis.keyFindings,
      sources: topResults,
      confidence: this.assessConfidence(topResults),
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Research VC and funding information
   */
  async researchVCIntelligence(query: string): Promise<ResearchResult> {
    const vcResults = await this.searchService.searchVC(query, {
      maxResults: 10,
      timeRange: 'week'
    })

    if (vcResults.length === 0) {
      return {
        summary: `No recent VC intelligence found for "${query}".`,
        keyFindings: ['No recent funding or investment news'],
        sources: [],
        confidence: 'low',
        lastUpdated: new Date().toISOString()
      }
    }

    const analysis = await this.analyzeVCIntelligence(vcResults, query)

    return {
      summary: analysis.summary,
      keyFindings: analysis.keyFindings,
      sources: vcResults,
      confidence: this.assessConfidence(vcResults),
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Generate smart research queries based on the main query
   */
  private async generateResearchQueries(researchQuery: ResearchQuery): Promise<string[]> {
    const prompt = `Given this research query: "${researchQuery.query}"
${researchQuery.context ? `Context: ${researchQuery.context}` : ''}

Generate 4-5 specific search queries that would help gather comprehensive information. Focus on:
- Recent news and developments
- Technical details and capabilities  
- Market position and competitors
- Team and leadership
- Partnerships and integrations

Return only the search queries, one per line, without numbering or explanation.`

    try {
      const response = await this.aiProvider.chat([
        { role: "developer", content: "You are a research strategist. Generate focused search queries for comprehensive research." },
        { role: "user", content: prompt }
      ])

      const queries = response.content
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 0 && !q.match(/^\d+\./) && q !== researchQuery.query)
        .slice(0, 5)

      // Always include the original query
      return [researchQuery.query, ...queries]
    } catch (error) {
      console.warn('Failed to generate research queries, using defaults:', error)
      
      // Fallback queries
      return [
        researchQuery.query,
        `${researchQuery.query} latest news`,
        `${researchQuery.query} analysis report`,
        `${researchQuery.query} market update`
      ]
    }
  }

  /**
   * Analyze search results and synthesize findings
   */
  private async analyzeResults(results: SearchResult[], researchQuery: ResearchQuery): Promise<{
    summary: string
    keyFindings: string[]
  }> {
    if (results.length === 0) {
      return {
        summary: "No relevant information found for this research query.",
        keyFindings: ["No sources available"]
      }
    }

    const sourceMaterial = results.map((result, index) => 
      `Source ${index + 1}: ${result.title}\n${result.snippet}\nURL: ${result.url}\n`
    ).join('\n')

    const analysisPrompt = `Research Query: "${researchQuery.query}"
${researchQuery.context ? `Context: ${researchQuery.context}` : ''}

Based on the following search results, provide a comprehensive analysis:

${sourceMaterial}

Please provide:
1. A clear, concise summary (2-3 paragraphs) of the key information
2. 4-6 key findings as bullet points

Focus on the most important and recent information. If information is conflicting, note the discrepancies.`

    try {
      const response = await this.aiProvider.chat([
        { role: "developer", content: "You are an expert research analyst. Synthesize information from multiple sources into clear, actionable insights." },
        { role: "user", content: analysisPrompt }
      ])

      // Parse the response to extract summary and key findings
      const content = response.content
      const sections = content.split(/(?:Key Findings|Summary)/i)
      
      let summary = content
      let keyFindings: string[] = []

      // Try to extract structured information
      if (sections.length > 1) {
        summary = sections[0].trim()
        const findingsText = sections[sections.length - 1]
        keyFindings = findingsText
          .split('\n')
          .map(line => line.replace(/^[•\-*]\s*/, '').trim())
          .filter(line => line.length > 10)
          .slice(0, 6)
      }

      // Fallback: extract bullet points from the full content
      if (keyFindings.length === 0) {
        keyFindings = content
          .split('\n')
          .filter(line => line.match(/^[•\-*]/))
          .map(line => line.replace(/^[•\-*]\s*/, '').trim())
          .slice(0, 6)
      }

      return {
        summary: summary || "Analysis completed based on available sources.",
        keyFindings: keyFindings.length > 0 ? keyFindings : ["Analysis completed with available information"]
      }
    } catch (error) {
      console.error('Failed to analyze results:', error)
      
      return {
        summary: `Found ${results.length} sources related to "${researchQuery.query}". Analysis temporarily unavailable.`,
        keyFindings: results.slice(0, 3).map(r => `${r.title}: ${r.snippet.slice(0, 100)}...`)
      }
    }
  }

  /**
   * Specialized analysis for crypto projects
   */
  private async analyzeCryptoProject(results: SearchResult[], projectName: string): Promise<{
    summary: string
    keyFindings: string[]
  }> {
    const sourceMaterial = results.map((result, index) => 
      `${result.title}\n${result.snippet}\nSource: ${result.source} | ${result.url}\n`
    ).join('\n---\n')

    const prompt = `Analyze this crypto project: ${projectName}

Research Sources:
${sourceMaterial}

As a crypto VC analyst, provide:
1. A comprehensive summary covering the project's technology, market position, and investment potential
2. Key findings focusing on: technology innovation, team strength, market traction, tokenomics, partnerships, and any red flags

Format as clear summary paragraphs followed by bullet point key findings.`

    try {
      const response = await this.aiProvider.chat([
        { role: "developer", content: "You are a crypto VC analyst specializing in project due diligence and market analysis." },
        { role: "user", content: prompt }
      ])

      const content = response.content
      const parts = content.split(/key findings/i)
      
      let summary = content
      let keyFindings: string[] = []

      if (parts.length > 1) {
        summary = parts[0].trim()
        keyFindings = parts[1]
          .split('\n')
          .map(line => line.replace(/^[•\-*]\s*/, '').trim())
          .filter(line => line.length > 10)
          .slice(0, 6)
      }

      return {
        summary: summary || `Analysis of ${projectName} based on ${results.length} sources.`,
        keyFindings: keyFindings.length > 0 ? keyFindings : [`${results.length} sources analyzed for ${projectName}`]
      }
    } catch (error) {
      console.error('Crypto analysis failed:', error)
      return {
        summary: `Found ${results.length} sources about ${projectName}. Detailed analysis temporarily unavailable.`,
        keyFindings: [`${results.length} sources found`, 'Analysis pending due to technical issues']
      }
    }
  }

  /**
   * Specialized analysis for VC intelligence
   */
  private async analyzeVCIntelligence(results: SearchResult[], query: string): Promise<{
    summary: string
    keyFindings: string[]
  }> {
    const sourceMaterial = results.map(result => 
      `${result.title}\n${result.snippet}\nSource: ${result.source}`
    ).join('\n---\n')

    const prompt = `VC Intelligence Research: "${query}"

Sources:
${sourceMaterial}

Provide VC-focused analysis covering:
1. Recent funding rounds and valuations
2. Notable investors and lead firms
3. Market trends and sector insights
4. Competitive landscape updates

Format as executive summary followed by key findings.`

    try {
      const response = await this.aiProvider.chat([
        { role: "developer", content: "You are a venture capital intelligence analyst tracking funding trends and market movements." },
        { role: "user", content: prompt }
      ])

      const content = response.content
      const parts = content.split(/key findings/i)
      
      return {
        summary: parts[0]?.trim() || content,
        keyFindings: parts[1] ? 
          parts[1].split('\n').map(line => line.replace(/^[•\-*]\s*/, '').trim()).filter(line => line.length > 10).slice(0, 6) :
          [`${results.length} VC intelligence sources analyzed`]
      }
    } catch (error) {
      console.error('VC analysis failed:', error)
      return {
        summary: `VC intelligence gathered from ${results.length} sources.`,
        keyFindings: ['Analysis pending']
      }
    }
  }

  /**
   * Remove duplicate results based on URL and title similarity
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>()
    const unique: SearchResult[] = []

    for (const result of results) {
      const key = `${result.url}|${result.title.toLowerCase().slice(0, 50)}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(result)
      }
    }

    return unique
  }

  /**
   * Rank results by relevance to query
   */
  private rankResults(results: SearchResult[], query: string): SearchResult[] {
    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2)
    
    return results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, queryWords)
      const scoreB = this.calculateRelevanceScore(b, queryWords)
      return scoreB - scoreA
    })
  }

  /**
   * Calculate relevance score for a result
   */
  private calculateRelevanceScore(result: SearchResult, queryWords: string[]): number {
    let score = result.relevanceScore || 0
    
    const text = `${result.title} ${result.snippet}`.toLowerCase()
    
    // Boost score for query word matches
    for (const word of queryWords) {
      const titleMatches = (result.title.toLowerCase().match(new RegExp(word, 'g')) || []).length
      const snippetMatches = (result.snippet.toLowerCase().match(new RegExp(word, 'g')) || []).length
      
      score += titleMatches * 2 + snippetMatches
    }
    
    // Boost for recent dates
    if (result.publishDate) {
      const daysSincePublished = (Date.now() - new Date(result.publishDate).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSincePublished < 7) score += 0.5
      else if (daysSincePublished < 30) score += 0.3
    }
    
    return score
  }

  /**
   * Assess confidence level based on source quality and quantity
   */
  private assessConfidence(results: SearchResult[]): 'high' | 'medium' | 'low' {
    if (results.length >= 8) return 'high'
    if (results.length >= 4) return 'medium'
    return 'low'
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}