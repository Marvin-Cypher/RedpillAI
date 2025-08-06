import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const searchParams = url.searchParams
    
    // Build backend URL with query parameters
    const backendUrl = `${BACKEND_URL}/api/v1/data/companies/${encodeURIComponent(id)}/refresh-for-widgets`
    const backendUrlWithParams = new URL(backendUrl)
    
    // Forward query parameters
    searchParams.forEach((value, key) => {
      backendUrlWithParams.searchParams.set(key, value)
    })

    console.log(`[API] Proxying widget refresh request: ${backendUrlWithParams.toString()}`)

    // Forward request to backend
    const response = await fetch(backendUrlWithParams.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward auth headers if present
        ...(request.headers.get('authorization') && {
          'authorization': request.headers.get('authorization')!
        })
      }
    })

    if (!response.ok) {
      console.error(`[API] Backend refresh request failed: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Backend refresh request failed: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    console.log(`[API] Widget refresh completed for: ${data?.company_name || id}`)

    return NextResponse.json(data)

  } catch (error) {
    console.error('[API] Widget refresh proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh widget data' },
      { status: 500 }
    )
  }
}