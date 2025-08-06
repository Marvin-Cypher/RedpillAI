import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_BASE_URL = 'http://localhost:8000'

async function ensureDemoAuth(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get('access_token')?.value
  
  if (!token) {
    console.log('🔑 No auth token found, creating demo token')
    const demoToken = 'demo-token-' + Date.now()
    cookieStore.set('access_token', demoToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })
    token = demoToken
  }
  return token
}

// PUT /api/deals/[id] - Update deal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await ensureDemoAuth()
    const body = await request.json()
    const { id } = await params
    
    console.log(`🔄 Updating deal ${id} with data:`, JSON.stringify(body, null, 2))
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE_URL}/api/v1/deals/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })

    console.log('📡 Backend response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Backend error response:', errorText)
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText || 'Failed to update deal' }
      }
      
      return NextResponse.json(
        { error: 'Failed to update deal', message: errorData.message || errorData.detail, details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ Deal updated successfully:', data)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('💥 Update deal API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}