import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    const url = new URL(request.url)
    const searchParams = url.searchParams
    
    // Build backend URL with query parameters
    const backendUrl = `${BACKEND_URL}/api/v1/market/equity/${encodeURIComponent(ticker)}/news`
    const backendUrlWithParams = new URL(backendUrl)
    
    // Forward query parameters (limit, etc.)
    searchParams.forEach((value, key) => {
      backendUrlWithParams.searchParams.set(key, value)
    })

    console.log(`[API] Proxying equity news request: ${backendUrlWithParams.toString()}`)

    // Forward request to backend
    const response = await fetch(backendUrlWithParams.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward auth headers if present
        ...(request.headers.get('authorization') && {
          'authorization': request.headers.get('authorization')!
        })
      }
    })

    if (!response.ok) {
      console.error(`[API] Backend equity news request failed: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Backend equity news request failed: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    console.log(`[API] Equity news data fetched for: ${ticker} - ${data?.news?.length || 0} articles`)

    return NextResponse.json(data)

  } catch (error) {
    console.error('[API] Equity news proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equity news' },
      { status: 500 }
    )
  }
}