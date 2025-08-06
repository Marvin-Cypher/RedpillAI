import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Demo authentication endpoint - creates a demo token for testing
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Create a demo token (in a real app, this would be a JWT from the backend)
    const demoToken = 'demo-token-' + Date.now()
    
    // Set the token in cookies
    cookieStore.set('access_token', demoToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({
      success: true,
      message: 'Demo authentication successful',
      token: demoToken
    })
  } catch (error) {
    console.error('Demo auth error:', error)
    return NextResponse.json(
      { error: 'Failed to create demo authentication' },
      { status: 500 }
    )
  }
}