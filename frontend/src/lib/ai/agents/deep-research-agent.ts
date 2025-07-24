// Deep Research Agent inspired by LangGraph patterns
// Implements multi-step research workflow with state management

import { SearchService, SearchResult } from '../../services/search-service'
import { RedpillAIProvider } from '../redpill-provider'

export interface ResearchState {
  query: string
  research_plan: string[]
  current_step: number
  search_results: SearchResult[]
  findings: string[]
  synthesis: string
  confidence_score: number
  sources_cited: string[]
  next_action: 'search' | 'analyze' | 'refine' | 'synthesize' | 'complete'
  iteration_count: number
  max_iterations: number
}

export interface ResearchConfig {
  maxIterations?: number
  maxSources?: number
  confidenceThreshold?: number
  enableIterativeRefinement?: boolean
}

export class DeepResearchAgent {
  private searchService: SearchService
  private aiProvider: RedpillAIProvider
  private config: Required<ResearchConfig>

  constructor(aiApiKey: string, config: ResearchConfig = {}) {
    this.searchService = new SearchService()
    this.aiProvider = new RedpillAIProvider(aiApiKey)
    this.config = {
      maxIterations: config.maxIterations || 5,
      maxSources: config.maxSources || 20,
      confidenceThreshold: config.confidenceThreshold || 0.7,
      enableIterativeRefinement: config.enableIterativeRefinement ?? true
    }
  }

  /**
   * Main research orchestrator using LangGraph-inspired state machine
   */
  async conductDeepResearch(
    query: string, 
    onProgress?: (state: ResearchState) => void,
    onStepUpdate?: (step: { type: string, title: string, content: string, status: string, reasoning?: string }) => void
  ): Promise<ResearchState> {
    console.log(`🔬 Starting deep research for: "${query}"`)

    // Initialize research state
    let state: ResearchState = {
      query,
      research_plan: [],
      current_step: 0,
      search_results: [],
      findings: [],
      synthesis: '',
      confidence_score: 0,
      sources_cited: [],
      next_action: 'search',
      iteration_count: 0,
      max_iterations: this.config.maxIterations
    }

    // Step 1: Plan the research
    onStepUpdate?.({
      type: 'reasoning',
      title: 'Planning Research Strategy',
      content: 'Analyzing query and generating focused research plan...',
      status: 'active'
    })
    
    state = await this.planResearch(state)
    onProgress?.(state)
    
    onStepUpdate?.({
      type: 'reasoning', 
      title: 'Research Plan Created',
      content: `Generated ${state.research_plan.length} targeted research queries`,
      status: 'complete'
    })

    // Execute research workflow
    while (state.next_action !== 'complete' && state.iteration_count < state.max_iterations) {
      console.log(`📍 Research iteration ${state.iteration_count + 1}, action: ${state.next_action}`)
      
      switch (state.next_action) {
        case 'search':
          onStepUpdate?.({
            type: 'search',
            title: `Search Step ${state.current_step + 1}`,
            content: `Searching: "${state.research_plan[state.current_step] || 'Research query'}"`,
            status: 'active'
          })
          state = await this.executeSearch(state)
          onStepUpdate?.({
            type: 'search',
            title: `Search Completed`,
            content: `Found ${state.search_results.length} total sources`,
            status: 'complete'
          })
          break
        case 'analyze':
          onStepUpdate?.({
            type: 'analysis',
            title: 'Analyzing Sources',
            content: `Processing ${state.search_results.length} sources for key insights...`,
            status: 'active'
          })
          state = await this.analyzeResults(state)
          onStepUpdate?.({
            type: 'analysis',
            title: 'Analysis Complete',
            content: `Extracted ${state.findings.length} key findings with ${Math.round(state.confidence_score * 100)}% confidence`,
            status: 'complete'
          })
          break
        case 'refine':
          onStepUpdate?.({
            type: 'reasoning',
            title: 'Refining Research',
            content: 'Confidence below threshold, generating additional queries...',
            status: 'active'
          })
          state = await this.refineResearch(state)
          break
        case 'synthesize':
          onStepUpdate?.({
            type: 'synthesis',
            title: 'Synthesizing Report',
            content: 'Creating comprehensive research summary and recommendations...',
            status: 'active'
          })
          state = await this.synthesizeFindings(state)
          onStepUpdate?.({
            type: 'synthesis',
            title: 'Research Complete',
            content: 'Comprehensive research report generated with executive summary',
            status: 'complete'
          })
          break
      }

      state.iteration_count++
      onProgress?.(state)

      // Safety check
      if (state.iteration_count >= state.max_iterations) {
        console.log('⚠️ Max iterations reached, completing research')
        state.next_action = 'complete'
        break
      }
    }

    // Final synthesis if not already done
    if (!state.synthesis && state.findings.length > 0) {
      state = await this.synthesizeFindings(state)
    }

    console.log(`✅ Deep research completed in ${state.iteration_count} iterations`)
    return state
  }

  /**
   * Step 1: Create a structured research plan
   */
  private async planResearch(state: ResearchState): Promise<ResearchState> {
    console.log('📋 Planning research approach...')

    const planningPrompt = `As an expert research strategist, create a comprehensive research plan for this query: "${state.query}"

Generate 4-6 specific research steps that will provide thorough coverage. Each step should be a focused search query or research angle.

Examples of good research steps:
- "Company X funding history and investors"
- "Company X technology architecture and innovations" 
- "Company X competitive landscape and market position"
- "Company X team background and leadership"
- "Company X recent partnerships and developments"

Provide only the research steps, one per line, without numbering or explanations.`

    try {
      const response = await this.aiProvider.chat([
        { role: "developer", content: "You are an expert research strategist who plans thorough, systematic investigations." },
        { role: "user", content: planningPrompt }
      ])

      const researchPlan = response.content
        .split('\n')
        .map(step => step.replace(/^\d+\.?\s*/, '').trim())
        .filter(step => step.length > 10)
        .slice(0, 6)

      return {
        ...state,
        research_plan: researchPlan.length > 0 ? researchPlan : [state.query],
        next_action: 'search'
      }
    } catch (error) {
      console.error('Research planning failed:', error)
      return {
        ...state,
        research_plan: [state.query],
        next_action: 'search'
      }
    }
  }

  /**
   * Step 2: Execute search for current research step
   */
  private async executeSearch(state: ResearchState): Promise<ResearchState> {
    if (state.current_step >= state.research_plan.length) {
      console.log('✅ All search steps completed, moving to analysis')
      return { ...state, next_action: 'analyze' }
    }

    const currentQuery = state.research_plan[state.current_step]
    console.log(`🔍 Deep Research Search Step ${state.current_step + 1}/${state.research_plan.length}: "${currentQuery}"`)

    try {
      const results = await this.searchService.search(currentQuery, {
        maxResults: Math.ceil(this.config.maxSources / state.research_plan.length),
        timeRange: 'month'
      })

      console.log(`📊 Search results for "${currentQuery}": ${results.length} sources found`)
      
      if (results.length > 0) {
        results.forEach((result, idx) => {
          console.log(`   ${idx + 1}. ${result.title} - ${result.source}`)
        })
      }

      const newResults = this.deduplicateResults([...state.search_results, ...results])
      const nextStep = state.current_step + 1

      console.log(`📈 Total sources collected: ${newResults.length} (${results.length} new)`)

      return {
        ...state,
        search_results: newResults,
        current_step: nextStep,
        next_action: nextStep >= state.research_plan.length ? 'analyze' : 'search'
      }
    } catch (error) {
      console.error(`❌ Search execution failed for "${currentQuery}":`, error)
      return {
        ...state,
        current_step: state.current_step + 1,
        next_action: state.current_step + 1 >= state.research_plan.length ? 'analyze' : 'search'
      }
    }
  }

  /**
   * Step 3: Analyze collected results and extract findings
   */
  private async analyzeResults(state: ResearchState): Promise<ResearchState> {
    if (state.search_results.length === 0) {
      return {
        ...state,
        findings: ['No sources found for analysis'],
        confidence_score: 0.1,
        next_action: 'synthesize'
      }
    }

    console.log(`📊 Analyzing ${state.search_results.length} sources...`)

    const sourceMaterial = state.search_results
      .slice(0, 15) // Limit to prevent token overflow
      .map((result, idx) => 
        `Source ${idx + 1}: ${result.title}\n${result.snippet}\nURL: ${result.url}\n`
      ).join('\n---\n')

    const analysisPrompt = `Original Query: "${state.query}"

Research Plan Executed:
${state.research_plan.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

Search Results:
${sourceMaterial}

Extract key findings from these sources. Focus on:
1. Direct answers to the original query
2. Important facts and data points
3. Trends and patterns
4. Potential concerns or red flags
5. Notable developments or changes

Provide 5-8 concise, factual findings. Each finding should be specific and actionable for venture capital decision-making.

Format as bullet points starting with "•"`

    try {
      const response = await this.aiProvider.chat([
        { role: "developer", content: "You are an expert research analyst who extracts actionable insights from multiple sources." },
        { role: "user", content: analysisPrompt }
      ])

      const findings = response.content
        .split('\n')
        .map(line => line.replace(/^[•\-*]\s*/, '').trim())
        .filter(line => line.length > 20)
        .slice(0, 8)

      const confidenceScore = this.calculateConfidenceScore(state.search_results, findings)

      // Determine next action based on confidence and iteration count
      let nextAction: ResearchState['next_action'] = 'synthesize'
      
      if (this.config.enableIterativeRefinement && 
          confidenceScore < this.config.confidenceThreshold && 
          state.iteration_count < state.max_iterations - 1) {
        nextAction = 'refine'
      }

      return {
        ...state,
        findings,
        confidence_score: confidenceScore,
        sources_cited: state.search_results.slice(0, 10).map(r => r.url),
        next_action: nextAction
      }
    } catch (error) {
      console.error('Results analysis failed:', error)
      return {
        ...state,
        findings: ['Analysis failed due to technical issues'],
        confidence_score: 0.2,
        next_action: 'synthesize'
      }
    }
  }

  /**
   * Step 4: Refine research based on gaps or low confidence
   */
  private async refineResearch(state: ResearchState): Promise<ResearchState> {
    console.log('🔧 Refining research approach...')

    const refinementPrompt = `Current research query: "${state.query}"

Findings so far:
${state.findings.map(f => `• ${f}`).join('\n')}

Confidence score: ${state.confidence_score}/1.0

The research confidence is below threshold. Identify 2-3 additional search queries that would strengthen our understanding and fill knowledge gaps.

Focus on areas that seem under-researched or where more recent information might be available.

Provide only the additional search queries, one per line.`

    try {
      const response = await this.aiProvider.chat([
        { role: "developer", content: "You are a research quality assessor who identifies gaps and suggests improvements." },
        { role: "user", content: refinementPrompt }
      ])

      const additionalQueries = response.content
        .split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 10)
        .slice(0, 3)

      if (additionalQueries.length > 0) {
        return {
          ...state,
          research_plan: [...state.research_plan, ...additionalQueries],
          next_action: 'search'
        }
      } else {
        return { ...state, next_action: 'synthesize' }
      }
    } catch (error) {
      console.error('Research refinement failed:', error)
      return { ...state, next_action: 'synthesize' }
    }
  }

  /**
   * Step 5: Synthesize all findings into final answer
   */
  private async synthesizeFindings(state: ResearchState): Promise<ResearchState> {
    console.log('🧠 Synthesizing final research report...')

    if (state.findings.length === 0) {
      return {
        ...state,
        synthesis: `Unable to find sufficient information about "${state.query}". This may indicate a new, private, or niche topic requiring alternative research approaches.`,
        next_action: 'complete'
      }
    }

    const synthesisPrompt = `Original Research Query: "${state.query}"

Key Findings from Deep Research:
${state.findings.map(f => `• ${f}`).join('\n')}

Research Confidence: ${Math.round(state.confidence_score * 100)}%
Sources Analyzed: ${state.search_results.length}
Research Iterations: ${state.iteration_count}

Synthesize these findings into a comprehensive research report suitable for venture capital decision-making. Structure as:

1. **Executive Summary** (2-3 sentences)
2. **Key Insights** (main findings organized by importance)
3. **Investment Implications** (what this means for VCs)
4. **Recommendations** (next steps or areas for deeper investigation)

Keep the tone professional and actionable. Highlight any uncertainties or areas requiring further investigation.`

    try {
      const response = await this.aiProvider.chat([
        { role: "developer", content: "You are a senior research analyst preparing executive briefings for venture capital partners." },
        { role: "user", content: synthesisPrompt }
      ])

      return {
        ...state,
        synthesis: response.content,
        next_action: 'complete'
      }
    } catch (error) {
      console.error('Synthesis failed:', error)
      return {
        ...state,
        synthesis: `Research completed with ${state.findings.length} key findings. Detailed synthesis temporarily unavailable.`,
        next_action: 'complete'
      }
    }
  }

  /**
   * Calculate confidence score based on source quality and finding consistency
   */
  private calculateConfidenceScore(sources: SearchResult[], findings: string[]): number {
    let score = 0

    // Source quantity factor (0.0 - 0.4)
    const sourceScore = Math.min(sources.length / 10, 1) * 0.4

    // Finding quality factor (0.0 - 0.3)
    const findingScore = Math.min(findings.length / 6, 1) * 0.3

    // Source diversity factor (0.0 - 0.3)
    const uniqueDomains = new Set(sources.map(s => new URL(s.url).hostname)).size
    const diversityScore = Math.min(uniqueDomains / 5, 1) * 0.3

    score = sourceScore + findingScore + diversityScore

    return Math.min(Math.max(score, 0.1), 1.0) // Clamp between 0.1 and 1.0
  }

  /**
   * Remove duplicate search results
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>()
    return results.filter(result => {
      const key = `${result.url}|${result.title.toLowerCase().slice(0, 30)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * Get research progress summary
   */
  getProgressSummary(state: ResearchState): string {
    return `Research Progress: Step ${state.current_step}/${state.research_plan.length} | ` +
           `Sources: ${state.search_results.length} | ` +
           `Findings: ${state.findings.length} | ` +
           `Confidence: ${Math.round(state.confidence_score * 100)}%`
  }
}