import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params
    
    // Get auth token from cookies or headers
    const authCookie = request.cookies.get('auth_token')
    const authHeader = request.headers.get('authorization')
    const token = authCookie?.value || authHeader?.replace('Bearer ', '')

    const response = await fetch(`${API_BASE_URL}/api/v1/persons/company/${companyId}/founders`, {
      method: 'GET',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('Backend API error:', response.status, await response.text())
      return NextResponse.json(
        { error: `Failed to fetch founders: ${response.status}` },
        { status: response.status }
      )
    }

    const founders = await response.json()
    return NextResponse.json(founders)

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}