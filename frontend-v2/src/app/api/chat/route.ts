import { NextRequest, NextResponse } from 'next/server'
import { VCAssistant, type Message } from '@/lib/ai/vc-assistant'

// Check if API keys are present
if (!process.env.REDPILL_AI_API_KEY) {
  console.error('REDPILL_AI_API_KEY is not set in environment variables')
}
if (!process.env.COINGECKO_API_KEY) {
  console.error('COINGECKO_API_KEY is not set in environment variables')
}

const assistant = new VCAssistant(
  process.env.REDPILL_AI_API_KEY || 'sk-9JABKD0bYW6s8VN6PoIG0LUOj1uo44TrXm0MNJWXe7GWP1wR',
  process.env.COINGECKO_API_KEY || 'CG-Nw4CrwxrHFD43vtwc4ccBp3H'
)

export async function POST(req: NextRequest) {
  try {
    const { message, projectId, conversationHistory, stream = false } = await req.json()
    
    console.log('Chat API called with:', {
      message,
      projectId,
      hasConversationHistory: !!conversationHistory,
      stream,
      apiKeyPresent: !!process.env.REDPILL_AI_API_KEY,
      coinGeckoKeyPresent: !!process.env.COINGECKO_API_KEY
    })

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    // For streaming responses
    if (stream) {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            await assistant.streamChat(
              message,
              projectId,
              conversationHistory || [],
              {
                onStep: (step: string, content: string) => {
                  const data = JSON.stringify({ type: 'step', step, content })
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                },
                onComplete: (finalAnswer: string) => {
                  const data = JSON.stringify({ type: 'complete', content: finalAnswer })
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                  controller.close()
                },
                onError: (error: string) => {
                  const data = JSON.stringify({ type: 'error', error })
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`))
                  controller.close()
                }
              }
            )
          } catch (error) {
            const data = JSON.stringify({ 
              type: 'error', 
              error: 'Failed to process chat request' 
            })
            controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // For non-streaming responses
    const response = await assistant.chat(message, projectId, conversationHistory || [])

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chat API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error type:', typeof error)
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown')
    
    // Check if it's a specific AI provider error
    let errorMessage = 'Failed to process chat request'
    let errorDetails = 'Unknown error'
    
    if (error instanceof Error) {
      errorDetails = error.message
      
      if (error.message.includes('AI request failed')) {
        errorMessage = 'AI service is temporarily unavailable'
        errorDetails = 'The AI provider returned an error. Please try again in a moment.'
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Unable to connect to AI service'
        errorDetails = 'Network connection to AI provider failed.'
      } else if (error.message.includes('API key')) {
        errorMessage = 'Authentication error'
        errorDetails = 'Invalid or missing API key for AI service.'
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Handle document analysis
export async function PUT(req: NextRequest) {
  try {
    const { documentContent, projectId } = await req.json()

    if (!documentContent) {
      return NextResponse.json(
        { error: 'Document content is required' },
        { status: 400 }
      )
    }

    const analysis = await assistant.analyzeDocument(documentContent, projectId)

    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Document analysis error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to analyze document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}