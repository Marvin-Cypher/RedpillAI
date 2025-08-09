import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/persons`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const persons = await response.json()
    return NextResponse.json(persons)
  } catch (error) {
    console.error('Error fetching persons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch persons' },
      { status: 500 }
    )
  }
}