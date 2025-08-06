import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_BASE_URL = 'http://localhost:8000'

// GET /api/companies - List all companies with deal status
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    
    const url = `${API_BASE_URL}/api/v1/companies${queryString ? `?${queryString}` : ''}`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch companies', status: response.status },
        { status: response.status }
      )
    }

    const companiesData = await response.json()
    
    // Also fetch deals to enrich companies with deal status
    let dealsData = []
    try {
      // Use internal API route which handles auth properly
      const dealsResponse = await fetch(`http://localhost:3000/api/deals`, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
      })
      
      if (dealsResponse.ok) {
        dealsData = await dealsResponse.json()
        console.log('✅ Fetched deals for enrichment:', dealsData?.length || 0)
      } else {
        console.log('⚠️ Could not fetch deals via internal API, status:', dealsResponse.status)
        // Try direct backend call as fallback
        const backendResponse = await fetch(`${API_BASE_URL}/api/v1/deals/`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        })
        if (backendResponse.ok) {
          dealsData = await backendResponse.json()
          console.log('✅ Fetched deals via backend fallback:', dealsData?.length || 0)
        }
      }
    } catch (error) {
      console.log('⚠️ Error fetching deals:', error.message)
    }

    // Enrich companies with deal status if we have deals data
    let enrichedCompanies = companiesData
    if (Array.isArray(companiesData) && Array.isArray(dealsData) && dealsData.length > 0) {
      enrichedCompanies = companiesData.map(company => {
        // Find the most recent active deal for this company
        const companyDeals = dealsData.filter(deal => deal.company_id === company.id)
        const latestDeal = companyDeals
          .filter(deal => deal.status !== 'closed' && deal.status !== 'passed')
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
        
        return {
          ...company,
          deal_status: latestDeal?.status || null,
          deal_stage: latestDeal?.stage || null,
          deal_id: latestDeal?.id || null
        }
      })
      console.log('✅ Enriched companies with deal status')
    }

    return NextResponse.json(enrichedCompanies)
  } catch (error) {
    console.error('Companies API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/companies - Create new company
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    const body = await request.json()
    
    const response = await fetch(`${API_BASE_URL}/api/v1/companies`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create company' }))
      return NextResponse.json(
        { error: 'Failed to create company', message: errorData.message },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Create company API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}