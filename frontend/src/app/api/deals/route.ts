import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const API_BASE_URL = 'http://localhost:8000'

// File-based storage for demo deals persistence
const DEALS_FILE = join(process.cwd(), 'demo-deals.json')

function loadMockDeals(): any[] {
  try {
    if (existsSync(DEALS_FILE)) {
      const data = readFileSync(DEALS_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.log('No existing deals file or parse error, starting fresh')
  }
  return []
}

function saveMockDeals(deals: any[]): void {
  try {
    writeFileSync(DEALS_FILE, JSON.stringify(deals, null, 2))
  } catch (error) {
    console.error('Failed to save deals file:', error)
  }
}

// GET /api/deals - Get all deals
async function ensureDemoAuth(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get('access_token')?.value
  
  if (!token) {
    console.log('🔑 No auth token found, creating demo token')
    // Create demo token
    const demoToken = 'demo-token-' + Date.now()
    cookieStore.set('access_token', demoToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    token = demoToken
  }
  
  return token
}

export async function GET(request: NextRequest) {
  try {
    const token = await ensureDemoAuth()

    // Prepare headers with demo token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/deals/`, {
      headers,
    })

    if (!response.ok) {
      console.log('⚠️ Backend deals fetch failed, falling back to mock deals')
      const mockDeals = loadMockDeals()
      return NextResponse.json(mockDeals)
    }

    const data = await response.json()
    
    // Return backend deals directly (no merging needed as backend has all deals)
    return NextResponse.json(Array.isArray(data) ? data : [])
  } catch (error) {
    console.error('Deals API error:', error)
    // Return mock deals as fallback
    const mockDeals = loadMockDeals()
    return NextResponse.json(mockDeals)
  }
}

// POST /api/deals - Create new deal
export async function POST(request: NextRequest) {
  try {
    const token = await ensureDemoAuth()
    const body = await request.json()
    
    console.log('🔄 Creating deal with data:', JSON.stringify(body, null, 2))
    console.log('🔑 Using demo token:', token)
    
    // Prepare headers with demo token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
    
    const response = await fetch(`${API_BASE_URL}/api/v1/deals/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    console.log('📡 Backend response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Backend error response:', errorText)
      
      // If backend is returning 500 error, fall back to mock deal creation for demo purposes
      if (response.status === 500) {
        console.log('🎭 Backend 500 error, creating mock deal for demo purposes')
        const mockDeal = {
          id: `deal-${Date.now()}`,
          company_id: body.company_id,
          stage: body.stage || 'pre_seed',
          status: body.status || 'planned',
          valuation: body.valuation,
          round_size: body.round_size,
          our_investment: body.our_investment,
          our_target: body.our_target,
          probability: body.probability || 50,
          next_milestone: body.next_milestone || 'Initial screening',
          internal_notes: body.internal_notes || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Store mock deal for demo mode
        const mockDeals = loadMockDeals()
        mockDeals.push(mockDeal)
        saveMockDeals(mockDeals)
        console.log('✅ Mock deal created and stored:', mockDeal)
        return NextResponse.json(mockDeal)
      }
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText || 'Failed to create deal' }
      }
      
      return NextResponse.json(
        { error: 'Failed to create deal', message: errorData.message || errorData.detail, details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ Deal created successfully:', data)
    
    // Also store in mock deals for consistency in demo mode
    const mockDeals = loadMockDeals()
    if (data && !mockDeals.find(d => d.id === data.id)) {
      mockDeals.push(data)
      saveMockDeals(mockDeals)
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('💥 Create deal API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}