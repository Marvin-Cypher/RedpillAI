import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Proxy request to backend to get user info
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      // If token is invalid, clear the cookie
      if (response.status === 401) {
        const newCookieStore = await cookies()
        newCookieStore.delete('access_token')
      }
      
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: response.status }
      )
    }

    const userData = await response.json()
    return NextResponse.json(userData)

  } catch (error) {
    console.error('Auth check API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}