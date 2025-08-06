import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params
    
    // Build backend URL
    const backendUrl = `${BACKEND_URL}/api/v1/market/crypto/${encodeURIComponent(symbol)}/price`

    console.log(`[API] Proxying crypto price request: ${backendUrl}`)

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
      console.error(`[API] Backend crypto price request failed: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Backend crypto price request failed: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    console.log(`[API] Crypto price data fetched for: ${symbol} - $${data?.current_price || 'N/A'}`)

    return NextResponse.json(data)

  } catch (error) {
    console.error('[API] Crypto price proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crypto price' },
      { status: 500 }
    )
  }
}