'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Brain, 
  Globe, 
  TrendingUp, 
  Database,
  Clock,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { VCAssistant } from '@/lib/ai/vc-assistant'
import { DeepResearchAgent } from '@/lib/ai/agents/deep-research-agent'
import { WebResearchAgent } from '@/lib/ai/agents/web-research-agent'
import { SearchService } from '@/lib/services/search-service'

interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
  publishDate?: string
  relevanceScore?: number
}

interface ResearchProgress {
  step: string
  status: 'pending' | 'active' | 'complete'
  title: string
  content: string
  reasoning?: string
}

interface SearchInterfaceProps {
  projectId?: string
  projectName?: string
  onResultSelect?: (result: any) => void
}

export function SearchInterface({ projectId, projectName, onResultSelect }: SearchInterfaceProps) {
  const [query, setQuery] = useState('')
  const [activeMode, setActiveMode] = useState<'quick' | 'web' | 'deep' | 'market'>('quick')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [researchProgress, setResearchProgress] = useState<ResearchProgress[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [filters, setFilters] = useState({
    timeRange: 'month' as 'day' | 'week' | 'month' | 'year' | 'all',
    sources: [] as string[],
    resultCount: 10
  })

  const searchModes = [
    {
      id: 'quick' as const,
      name: 'Quick Search',
      icon: Search,
      description: 'Fast web search results',
      color: 'blue'
    },
    {
      id: 'web' as const,
      name: 'Web Research',
      icon: Globe,
      description: 'Comprehensive web analysis',
      color: 'green'
    },
    {
      id: 'deep' as const,
      name: 'Deep Research',
      icon: Brain,
      description: 'Multi-step agentic research',
      color: 'purple'
    },
    {
      id: 'market' as const,
      name: 'Market Data',
      icon: TrendingUp,
      description: 'Financial & market analysis',
      color: 'orange'
    }
  ]

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setResults([])
    setResearchProgress([])
    
    // Add to search history
    if (!searchHistory.includes(query)) {
      setSearchHistory(prev => [query, ...prev.slice(0, 9)])
    }

    try {
      switch (activeMode) {
        case 'quick':
          await performQuickSearch()
          break
        case 'web':
          await performWebResearch()
          break
        case 'deep':
          await performDeepResearch()
          break
        case 'market':
          await performMarketSearch()
          break
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const performQuickSearch = async () => {
    const searchService = new SearchService()
    const searchResults = await searchService.search(query, {
      maxResults: filters.resultCount,
      timeRange: filters.timeRange
    })
    setResults(searchResults)
  }

  const performWebResearch = async () => {
    const apiKey = process.env.NEXT_PUBLIC_REDPILL_API_KEY || 'demo-key'
    const webAgent = new WebResearchAgent(apiKey)
    
    const research = await webAgent.research({
      query,
      maxSources: filters.resultCount,
      timeRange: filters.timeRange,
      context: projectName ? `Research context: ${projectName}` : undefined
    })

    // Convert research results to search results format
    setResults(research.sources)
    
    // Trigger callback with research summary if provided
    if (onResultSelect) {
      onResultSelect({
        type: 'web_research',
        query,
        summary: research.summary,
        keyFindings: research.keyFindings,
        confidence: research.confidence,
        sources: research.sources
      })
    }
  }

  const performDeepResearch = async () => {
    const apiKey = process.env.NEXT_PUBLIC_REDPILL_API_KEY || 'demo-key'
    const deepAgent = new DeepResearchAgent(apiKey)
    
    setResearchProgress([{
      step: 'init',
      status: 'active',
      title: 'Initializing Deep Research',
      content: 'Setting up multi-step research workflow...'
    }])

    const researchState = await deepAgent.conductDeepResearch(
      query,
      // Progress callback
      (state) => {
        console.log('Research progress:', state)
      },
      // Step update callback
      (step) => {
        setResearchProgress(prev => {
          const updated = [...prev]
          const existingIndex = updated.findIndex(p => p.step === step.type)
          
          if (existingIndex >= 0) {
            updated[existingIndex] = {
              step: step.type,
              status: step.status as any,
              title: step.title,
              content: step.content,
              reasoning: step.reasoning
            }
          } else {
            updated.push({
              step: step.type,
              status: step.status as any,
              title: step.title,
              content: step.content,
              reasoning: step.reasoning
            })
          }
          
          return updated
        })
      }
    )

    // Convert research results
    setResults(researchState.search_results)
    
    // Trigger callback with comprehensive research
    if (onResultSelect) {
      onResultSelect({
        type: 'deep_research',
        query,
        synthesis: researchState.synthesis,
        findings: researchState.findings,
        confidence: researchState.confidence_score,
        sources: researchState.search_results,
        researchPlan: researchState.research_plan
      })
    }
  }

  const performMarketSearch = async () => {
    // Use VC Assistant for market data queries
    const apiKey = process.env.NEXT_PUBLIC_REDPILL_API_KEY || 'demo-key'
    const coinGeckoKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || ''
    const vcAssistant = new VCAssistant(apiKey, coinGeckoKey)
    
    const response = await vcAssistant.chat(
      `Market analysis and data for: ${query}`,
      projectId
    )
    
    // Create a mock result for the response
    setResults([{
      title: `Market Analysis: ${query}`,
      url: '#market-analysis',
      snippet: response.substring(0, 200) + '...',
      source: 'RedPill AI Market Analysis',
      publishDate: new Date().toISOString(),
      relevanceScore: 1
    }])
    
    if (onResultSelect) {
      onResultSelect({
        type: 'market_analysis',
        query,
        analysis: response,
        projectId,
        projectName
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'active': return <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getModeColor = (mode: string) => {
    const modeConfig = searchModes.find(m => m.id === mode)
    return modeConfig?.color || 'blue'
  }

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900">AI-Powered Search</h3>
        {projectName && (
          <Badge variant="outline" className="text-xs">
            Context: {projectName}
          </Badge>
        )}
      </div>

      {/* Search Modes */}
      <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as any)}>
        <TabsList className="grid w-full grid-cols-4 mb-4">
          {searchModes.map((mode) => {
            const Icon = mode.icon
            return (
              <TabsTrigger key={mode.id} value={mode.id} className="text-xs">
                <Icon className="w-3 h-3 mr-1" />
                {mode.name}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Search Input */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={`Enter ${searchModes.find(m => m.id === activeMode)?.description.toLowerCase()}...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={isSearching}
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <Button 
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            className={`bg-${getModeColor(activeMode)}-600 hover:bg-${getModeColor(activeMode)}-700`}
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-600 mb-2">Recent Searches:</div>
            <div className="flex flex-wrap gap-1">
              {searchHistory.slice(0, 5).map((hist, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => setQuery(hist)}
                >
                  {hist.length > 20 ? hist.substring(0, 20) + '...' : hist}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Mode-specific content */}
        {searchModes.map((mode) => (
          <TabsContent key={mode.id} value={mode.id} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <mode.icon className={`w-4 h-4 text-${mode.color}-600`} />
                <span className="font-medium text-sm">{mode.name}</span>
              </div>
              <p className="text-xs text-gray-600">{mode.description}</p>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Research Progress (for deep research) */}
      {activeMode === 'deep' && researchProgress.length > 0 && (
        <div className="border rounded-lg p-3 bg-purple-50">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            Research Progress
          </h4>
          <div className="space-y-2">
            {researchProgress.map((progress, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                {getStatusIcon(progress.status)}
                <div className="flex-1">
                  <div className="font-medium">{progress.title}</div>
                  <div className="text-gray-600 text-xs">{progress.content}</div>
                  {progress.reasoning && (
                    <div className="text-gray-500 text-xs italic mt-1">
                      {progress.reasoning}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">
              Search Results ({results.length})
            </h4>
            <Badge variant="outline" className="text-xs">
              {activeMode}
            </Badge>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {results.map((result, idx) => (
              <div 
                key={idx}
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onResultSelect?.(result)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-sm text-blue-700 hover:text-blue-800 line-clamp-1">
                      {result.title}
                    </h5>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {result.snippet}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {result.source}
                      </Badge>
                      {result.publishDate && (
                        <span className="text-xs text-gray-500">
                          {new Date(result.publishDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && results.length === 0 && query && (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No results found for "{query}"</p>
          <p className="text-xs">Try a different search term or mode</p>
        </div>
      )}
    </div>
  )
}