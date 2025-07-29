// Quick Research Agent - Optimized for speed
// Performs single-step research with minimal AI processing

import { SearchService, SearchResult } from '../services/search-service'
import { RedpillAIProvider } from './redpill-provider'

export interface QuickResearchResult {
  query: string
  summary: string
  keyFindings: string[]
  sources: SearchResult[]
  confidence: number
  timestamp: Date
}

export class QuickResearchAgent {
  private searchService: SearchService
  private aiProvider: RedpillAIProvider

  constructor(aiApiKey: string) {
    this.searchService = new SearchService()
    this.aiProvider = new RedpillAIProvider(aiApiKey)
  }

  /**
   * Fast research - search + single AI analysis
   */
  async conductQuickResearch(
    query: string,
    onStepUpdate?: (step: { type: string, title: string, content: string, status: string }) => void
  ): Promise<QuickResearchResult> {
    console.log(`🚀 Quick research for: "${query}"`)
    
    try {
      // Step 1: Search
      onStepUpdate?.({
        type: 'search',
        title: 'Searching for information',
        content: `Looking up recent information about ${query}...`,
        status: 'active'
      })

      const searchResults = await this.searchService.search(query, {
        maxResults: 5,
        timeRange: 'month' // Focus on recent results
      })

      console.log(`🔍 Search results for "${query}":`, {
        resultCount: searchResults.length,
        results: searchResults.map(r => ({ title: r.title, url: r.url }))
      })

      onStepUpdate?.({
        type: 'search',
        title: 'Search completed',
        content: `Found ${searchResults.length} relevant sources`,
        status: 'complete'
      })

      // Step 2: Quick analysis
      onStepUpdate?.({
        type: 'analysis',
        title: 'Analyzing results',
        content: 'Synthesizing key findings...',
        status: 'active'
      })

      const analysisPrompt = `You are a research analyst. Analyze these search results for "${query}" and provide a structured response.

SEARCH RESULTS:
${searchResults.map((result, idx) => `
${idx + 1}. ${result.title}
   ${result.snippet}
   Source: ${result.url}
`).join('\n')}

Please respond in this exact format:

SUMMARY:
[Write 2-3 sentences summarizing the most important recent developments]

KEY_FINDINGS:
• [Finding 1 - most recent/important news]
• [Finding 2 - financial/business impact] 
• [Finding 3 - market implications]
• [Finding 4 - future outlook]

Focus on the most recent and relevant information. Be specific and factual.`

      const response = await this.aiProvider.chat([{
        role: 'user',
        content: analysisPrompt
      }])

      onStepUpdate?.({
        type: 'analysis', 
        title: 'Analysis completed',
        content: 'Research findings ready',
        status: 'complete'
      })

      // Extract summary and findings from structured response
      const content = response.content || 'No analysis available'
      
      // Parse the structured response (using [\s\S] instead of 's' flag for compatibility)
      const summaryMatch = content.match(/SUMMARY:\s*([\s\S]*?)(?=KEY_FINDINGS:|$)/)
      const findingsMatch = content.match(/KEY_FINDINGS:\s*([\s\S]*?)$/)
      
      const summary = summaryMatch 
        ? summaryMatch[1].trim().replace(/\n/g, ' ').substring(0, 300)
        : `Analysis of ${query}: Found ${searchResults.length} recent sources with relevant information.`
      
      const keyFindings = findingsMatch
        ? findingsMatch[1].trim().split('\n')
            .filter(line => line.trim().startsWith('•'))
            .map(line => line.replace(/^•\s*/, '').trim())
            .slice(0, 5)
        : []

      return {
        query,
        summary,
        keyFindings: keyFindings.length > 0 ? keyFindings : [
          `Located ${searchResults.length} recent sources about ${query}`,
          'Current market information retrieved from live sources',
          'Analysis based on latest available data',
          'Research completed with real-time information'
        ],
        sources: searchResults,
        confidence: 0.75, // Default confidence
        timestamp: new Date()
      }

    } catch (error) {
      console.error('Quick research failed:', error)
      
      // Return fallback result
      return {
        query,
        summary: `Research was attempted for "${query}" but encountered technical difficulties. Try a more specific query or check back later.`,
        keyFindings: [
          'Research process initiated',
          'Technical difficulties encountered', 
          'Fallback analysis provided'
        ],
        sources: [],
        confidence: 0.3,
        timestamp: new Date()
      }
    }
  }
}