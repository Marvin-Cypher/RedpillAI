import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'redpill_token'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })

    // Clear the HTTP-only cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: -1, // Expire immediately
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Allow GET requests for convenience
  return POST(request)
}