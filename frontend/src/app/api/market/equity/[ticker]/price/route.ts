import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    
    // Build backend URL
    const backendUrl = `${BACKEND_URL}/api/v1/market/equity/${encodeURIComponent(ticker)}/price`

    console.log(`[API] Proxying equity price request: ${backendUrl}`)

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
      console.error(`[API] Backend equity price request failed: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Backend equity price request failed: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    console.log(`[API] Equity price data fetched for: ${ticker} - $${data?.current_price || 'N/A'}`)

    return NextResponse.json(data)

  } catch (error) {
    console.error('[API] Equity price proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equity price' },
      { status: 500 }
    )
  }
}