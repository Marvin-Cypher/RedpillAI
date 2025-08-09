import { NextRequest, NextResponse } from 'next/server'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE}/api/v1/talent/activities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const activities = await response.json()
    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching talent activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch talent activities' },
      { status: 500 }
    )
  }
}