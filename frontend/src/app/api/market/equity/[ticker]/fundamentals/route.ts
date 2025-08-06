import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    
    // Build backend URL
    const backendUrl = `${BACKEND_URL}/api/v1/market/equity/${encodeURIComponent(ticker)}/fundamentals`

    console.log(`[API] Proxying equity fundamentals request: ${backendUrl}`)

    // Forward request to backend
    const response = await fetch(backendUrl, {
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
      console.error(`[API] Backend equity fundamentals request failed: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Backend equity fundamentals request failed: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    console.log(`[API] Equity fundamentals data fetched for: ${ticker}`)

    return NextResponse.json(data)

  } catch (error) {
    console.error('[API] Equity fundamentals proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equity fundamentals' },
      { status: 500 }
    )
  }
}