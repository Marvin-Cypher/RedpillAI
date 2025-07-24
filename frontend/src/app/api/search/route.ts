import { NextRequest, NextResponse } from 'next/server'

interface SearchOptions {
  maxResults?: number
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all'
  region?: string
  safeSearch?: boolean
  sites?: string[]
  excluding?: string[]
}

interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
  publishDate?: string
  relevanceScore?: number
}

export async function POST(req: NextRequest) {
  try {
    const { query, options = {} } = await req.json()
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      )
    }

    console.log('Search API called with:', { query, options })

    const results = await performSearch(query, options)
    
    return NextResponse.json({
      success: true,
      results,
      query,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Search request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function performSearch(query: string, options: SearchOptions): Promise<SearchResult[]> {
  const maxResults = options.maxResults || 10
  
  // Try providers in order of preference
  const providers = [
    () => searchWithGoogle(query, options),
    () => searchWithDuckDuckGo(query, options) // Free fallback
  ]

  for (const provider of providers) {
    try {
      const results = await provider()
      if (results.length > 0) {
        return results.slice(0, maxResults)
      }
    } catch (error) {
      console.warn('Search provider failed:', error)
      continue
    }
  }

  console.warn('All search providers failed, returning empty results')
  return []
}

async function searchWithGoogle(query: string, options: SearchOptions): Promise<SearchResult[]> {
  const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY
  const googleCxId = process.env.GOOGLE_SEARCH_CX_ID
  
  if (!googleApiKey || !googleCxId) {
    throw new Error('Google Search API not configured')
  }

  const params = new URLSearchParams({
    key: googleApiKey,
    cx: googleCxId,
    q: query,
    num: (options.maxResults || 10).toString(),
    gl: options.region || 'us',
    lr: 'lang_en'
  })

  if (options.timeRange && options.timeRange !== 'all') {
    const dateFilters = { 'day': 'd1', 'week': 'w1', 'month': 'm1', 'year': 'y1' }
    params.append('dateRestrict', dateFilters[options.timeRange] || '')
  }

  console.log('Calling Google Search API:', params.toString())

  const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Google Search API error:', response.status, errorText)
    throw new Error(`Google Search API error: ${response.status}`)
  }

  const data = await response.json()
  console.log('Google Search response:', data)

  const results: SearchResult[] = []
  
  if (data.items) {
    for (const item of data.items) {
      results.push({
        title: item.title || '',
        url: item.link || '',
        snippet: item.snippet || '',
        source: 'Google Custom Search',
        publishDate: item.pagemap?.metatags?.[0]?.['article:published_time'],
        relevanceScore: 1
      })
    }
  }

  return results
}

async function searchWithDuckDuckGo(query: string, options: SearchOptions): Promise<SearchResult[]> {
  try {
    console.log('Calling DuckDuckGo API for:', query)
    
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`)
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`)
    }

    const data = await response.json()
    const results: SearchResult[] = []
    
    // DuckDuckGo instant answers
    if (data.Abstract) {
      results.push({
        title: data.Heading || 'DuckDuckGo Result',
        url: data.AbstractURL || '',
        snippet: data.Abstract,
        source: 'DuckDuckGo',
        relevanceScore: 1
      })
    }

    // Related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 3)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || 'Related Topic',
            url: topic.FirstURL,
            snippet: topic.Text,
            source: 'DuckDuckGo',
            relevanceScore: 0.8
          })
        }
      }
    }

    console.log('DuckDuckGo results:', results)
    return results

  } catch (error) {
    console.error('DuckDuckGo search failed:', error)
    return []
  }
}