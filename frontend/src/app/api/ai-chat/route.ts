import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Server-side AI chat endpoint to keep API keys secure
export async function POST(req: NextRequest) {
  try {
    const { messages, projectId, projectName } = await req.json()
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      )
    }

    // Get API key from environment (server-side only)
    const apiKey = process.env.REDPILL_API_KEY || process.env.NEXT_PUBLIC_REDPILL_API_KEY
    
    if (!apiKey) {
      console.error('Redpill API key not configured')
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    // Initialize OpenAI client on server side (no browser flag needed)
    const client = new OpenAI({
      baseURL: "https://api.redpill.ai/v1",
      apiKey: apiKey,
    })

    // Convert "system" role to "developer" for reasoning models
    const convertedMessages = messages.map((msg: any) => ({
      ...msg,
      role: msg.role === "system" ? "developer" : msg.role
    }))

    console.log('Making Redpill AI request from server:', { 
      messageCount: messages.length,
      projectId,
      projectName 
    })

    const completion = await client.chat.completions.create({
      messages: convertedMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      model: "phala/deepseek-r1-70b",
      stream: false,
      max_completion_tokens: 4000,
    })

    // Extract reasoning content if available
    const choice = completion.choices[0]
    const content = choice?.message?.content || ""
    const reasoningContent = (choice?.message as any)?.reasoning_content || ""
    
    return NextResponse.json({
      success: true,
      content: content,
      reasoning_content: reasoningContent,
      usage: completion.usage,
      model: completion.model,
      projectContext: projectId ? { projectId, projectName } : null
    })

  } catch (error: any) {
    console.error('AI chat API error:', error)
    console.error('Error details:', error.response?.data || error.message)
    
    const errorMessage = error.response?.data?.error || error.message || "Unknown error"
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'AI request failed',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

// Streaming endpoint for future use
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'AI Chat API is running. Use POST to send messages.',
    endpoints: {
      chat: 'POST /api/ai-chat',
      stream: 'Coming soon'
    }
  })
}