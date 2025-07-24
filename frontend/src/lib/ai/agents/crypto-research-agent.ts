import { RedpillAIProvider } from "../redpill-provider"

export interface ResearchState {
  query: string
  project?: string
  context: string[]
  research_findings: string[]
  analysis: string
  final_answer: string
  step: string
}

export class CryptoResearchAgent {
  private aiProvider: RedpillAIProvider

  constructor(apiKey: string) {
    this.aiProvider = new RedpillAIProvider(apiKey)
  }

  private async gatherContext(state: ResearchState): Promise<Partial<ResearchState>> {
    const prompt = `
You are a crypto venture capital research assistant. Given this query: "${state.query}"

First, identify what type of research is needed:
1. Project analysis (technical, tokenomics, team)
2. Market analysis (sector trends, competition)
3. Due diligence (risks, opportunities)
4. Portfolio analysis (performance, metrics)

Provide context about what areas need to be researched.
${state.project ? `Focus specifically on: ${state.project}` : ''}
`

    const response = await this.aiProvider.chat([
      { role: "system", content: "You are an expert crypto VC research assistant." },
      { role: "user", content: prompt }
    ])

    return {
      context: [response.content],
      step: "Context gathered"
    }
  }

  private async researchProject(state: ResearchState): Promise<Partial<ResearchState>> {
    const prompt = `
Based on the context: ${state.context.join("\n")}

Research the following areas for crypto project analysis:

1. **Technical Analysis**:
   - Protocol architecture and innovation
   - Smart contract security and audits
   - Scalability and performance metrics

2. **Tokenomics**:
   - Token distribution and vesting
   - Utility and value accrual mechanisms
   - Inflation/deflation mechanisms

3. **Market Position**:
   - Total Addressable Market (TAM)
   - Competitive landscape
   - Unique value proposition

4. **Team & Governance**:
   - Founder and team backgrounds
   - Advisory board strength
   - Governance structure and community

5. **Ecosystem & Partnerships**:
   - Strategic partnerships
   - Developer activity
   - Community engagement

Provide specific findings for each area relevant to: ${state.query}
${state.project ? `Specifically for project: ${state.project}` : ''}
`

    const response = await this.aiProvider.chat([
      { role: "system", content: "You are an expert crypto project researcher with deep knowledge of DeFi, L1/L2, and Web3 infrastructure." },
      { role: "user", content: prompt }
    ])

    return {
      research_findings: [response.content],
      step: "Research completed"
    }
  }

  private async analyzeFindings(state: ResearchState): Promise<Partial<ResearchState>> {
    const prompt = `
Context: ${state.context.join("\n")}

Research Findings: ${state.research_findings.join("\n")}

Now analyze these findings from a VC investment perspective:

1. **Investment Thesis**:
   - What's the core value proposition?
   - How does this fit current market trends?

2. **Risk Assessment**:
   - Technical risks (smart contract, centralization)
   - Market risks (competition, adoption)
   - Regulatory risks
   - Team risks

3. **Opportunity Assessment**:
   - Market timing and positioning
   - Scalability potential
   - Revenue model viability

4. **Competitive Analysis**:
   - Direct and indirect competitors
   - Differentiation factors
   - Market share potential

5. **Investment Recommendation**:
   - Investment attractiveness (1-10 scale)
   - Suggested follow-up actions
   - Key questions for due diligence

Provide a structured analysis with clear reasoning.
`

    const response = await this.aiProvider.chat([
      { role: "system", content: "You are a senior crypto VC partner with 10+ years of experience in evaluating blockchain investments." },
      { role: "user", content: prompt }
    ])

    return {
      analysis: response.content,
      step: "Analysis completed"
    }
  }

  private async generateAnswer(state: ResearchState): Promise<Partial<ResearchState>> {
    const prompt = `
Original Query: ${state.query}

Context: ${state.context.join("\n")}

Research: ${state.research_findings.join("\n")}

Analysis: ${state.analysis}

Synthesize all this information into a clear, actionable response for a crypto VC. 

Structure your response as:

## Executive Summary
Brief overview of key findings

## Key Insights
Most important discoveries from research

## Investment Perspective
VC-specific analysis and recommendations

## Next Steps
Concrete actions to take

## Risk Factors
Main concerns to monitor

Keep it concise but comprehensive, focusing on actionable intelligence.
`

    const response = await this.aiProvider.chat([
      { role: "system", content: "You are an expert crypto VC research assistant providing final synthesis and recommendations." },
      { role: "user", content: prompt }
    ])

    return {
      final_answer: response.content,
      step: "Complete"
    }
  }

  async research(query: string, project?: string, marketData?: string): Promise<string> {
    const initialState: ResearchState = {
      query,
      project,
      context: [],
      research_findings: [],
      analysis: "",
      final_answer: "",
      step: "Starting"
    }

    // Execute the workflow manually in sequence
    let currentState = initialState

    // Step 1: Gather Context
    currentState = { ...currentState, ...(await this.gatherContext(currentState)) }
    
    // Step 2: Research Project
    currentState = { ...currentState, ...(await this.researchProject(currentState)) }
    
    // Step 3: Analyze Findings
    currentState = { ...currentState, ...(await this.analyzeFindings(currentState)) }
    
    // Step 4: Generate Final Answer
    currentState = { ...currentState, ...(await this.generateAnswer(currentState)) }

    return currentState.final_answer || "Research completed but no final answer generated."
  }

  async streamResearch(query: string, project?: string, onStep?: (step: string, content: string) => void): Promise<string> {
    const initialState: ResearchState = {
      query,
      project,
      context: [],
      research_findings: [],
      analysis: "",
      final_answer: "",
      step: "Starting"
    }

    // For streaming, we'll execute each step and call the callback
    let currentState = initialState

    // Step 1: Gather Context
    onStep?.("gather_context", "🔍 Analyzing your query and gathering context...")
    currentState = { ...currentState, ...(await this.gatherContext(currentState)) }
    onStep?.("gather_context", currentState.context[0] || "Context gathered")

    // Step 2: Research Project
    onStep?.("research_project", "📊 Conducting deep research on crypto project...")
    currentState = { ...currentState, ...(await this.researchProject(currentState)) }
    onStep?.("research_project", currentState.research_findings[0] || "Research completed")

    // Step 3: Analyze Findings
    onStep?.("analyze_findings", "🧠 Analyzing findings from VC investment perspective...")
    currentState = { ...currentState, ...(await this.analyzeFindings(currentState)) }
    onStep?.("analyze_findings", currentState.analysis || "Analysis completed")

    // Step 4: Generate Final Answer
    onStep?.("generate_answer", "✍️ Synthesizing insights and recommendations...")
    currentState = { ...currentState, ...(await this.generateAnswer(currentState)) }
    onStep?.("generate_answer", currentState.final_answer || "Research completed")

    return currentState.final_answer || "Research completed but no final answer generated."
  }
}