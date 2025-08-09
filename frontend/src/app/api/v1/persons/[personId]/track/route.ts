import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(
  request: NextRequest,
  { params }: { params: { personId: string } }
) {
  try {
    const { personId } = params
    const body = await request.json()
    
    // Get auth token from cookies or headers
    const authCookie = request.cookies.get('auth_token')
    const authHeader = request.headers.get('authorization')
    const token = authCookie?.value || authHeader?.replace('Bearer ', '')

    const response = await fetch(`${API_BASE_URL}/api/v1/persons/${personId}/track`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      console.error('Backend API error:', response.status, await response.text())
      return NextResponse.json(
        { error: `Failed to track person: ${response.status}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { personId: string } }
) {
  try {
    const { personId } = params
    
    // Get auth token from cookies or headers
    const authCookie = request.cookies.get('auth_token')
    const authHeader = request.headers.get('authorization')
    const token = authCookie?.value || authHeader?.replace('Bearer ', '')

    const response = await fetch(`${API_BASE_URL}/api/v1/persons/${personId}/untrack`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Backend API error:', response.status, await response.text())
      return NextResponse.json(
        { error: `Failed to untrack person: ${response.status}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}