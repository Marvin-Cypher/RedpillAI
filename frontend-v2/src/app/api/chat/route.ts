import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, projectId, conversationHistory } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get auth token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    // Proxy request to backend AI service
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/api/v1/chat/conversations/${projectId || 'general'}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        conversation_id: projectId || 'general',
        role: 'user',
        content: message,
        context: JSON.stringify(conversationHistory || [])
      })
    })

    if (!response.ok) {
      // If backend is unavailable, return a demo response
      if (response.status === 404 || response.status === 502) {
        const chatId = `chat_${Date.now()}_demo`
        return NextResponse.json({
          response: `I understand you're asking about: "${message}". As an AI assistant specialized in venture capital, I can help with deal analysis, market research, due diligence, and investment insights. What specific aspect would you like to explore?`,
          chat_id: chatId,
          model: 'demo-mode',
          timestamp: new Date().toISOString()
        })
      }
      
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      return NextResponse.json(
        { error: errorData.detail || 'AI service error' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      response: data.content || data.response,
      chat_id: data.chat_id || `chat_${Date.now()}`,
      reasoning_content: data.reasoning_content,
      model: data.model || 'redpill-ai',
      usage: data.usage,
      timestamp: data.timestamp || new Date().toISOString()
    })

  } catch (error) {
    console.error('Chat API error:', error)
    
    // Return demo response on error
    const chatId = `chat_${Date.now()}_demo`
    return NextResponse.json({
      response: "I'm currently in demo mode. I can help analyze investment opportunities, research companies, and provide market insights. What would you like to explore?",
      chat_id: chatId,
      model: 'demo-mode',
      timestamp: new Date().toISOString()
    })
  }
}