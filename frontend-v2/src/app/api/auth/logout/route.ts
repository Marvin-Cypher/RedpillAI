import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Clear the HTTP-only cookie
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    cookieStore.delete('access_token')

    // Optionally proxy logout to backend to invalidate session
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    try {
      await fetch(`${backendUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
      })
    } catch (error) {
      // Log but don't fail if backend logout fails
      console.warn('Backend logout failed:', error)
    }

    return NextResponse.json({ message: 'Logged out successfully' })

  } catch (error) {
    console.error('Logout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}