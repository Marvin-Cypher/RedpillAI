import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'redpill_token'

export async function POST(request: NextRequest) {
  console.log('🔐 Login API route called')
  
  try {
    const body = await request.json()
    const { email, password, useHttpOnlyCookie = true } = body

    console.log('📧 Attempting login for:', email)

    // Forward login request to backend  
    const backendResponse = await fetch(`${API_BASE_URL}/auth/login/json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await backendResponse.json()

    if (!backendResponse.ok) {
      console.error('❌ Backend login failed:', data)
      return NextResponse.json(
        { error: data.detail || 'Invalid credentials' },
        { status: backendResponse.status }
      )
    }

    console.log('✅ Backend login successful')
    const token = data.access_token

    // Create response
    const response = NextResponse.json({
      success: true,
      token: useHttpOnlyCookie ? undefined : token,
      user: data.user || { id: 'demo-user', email, name: email.split('@')[0] },
    })

    // Set HTTP-only cookie if requested
    if (useHttpOnlyCookie && token) {
      response.cookies.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
      console.log('🍪 Set HTTP-only cookie')
    }

    return response
    
  } catch (error) {
    console.error('❌ Login proxy error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}