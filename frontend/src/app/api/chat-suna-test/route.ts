// Test API route for Suna integration
// This allows us to test Suna integration without modifying main chat

import { NextRequest, NextResponse } from 'next/server'
import { VCAssistantSuna } from '@/lib/ai/vc-assistant-suna'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, currentProject, allProjects, marketData } = body

    console.log('🧪 Testing Suna integration with:', {
      messageCount: messages?.length,
      currentProject: currentProject?.name,
      projectCount: allProjects?.length
    })

    const assistant = new VCAssistantSuna()
    
    // Track step updates
    const stepUpdates: any[] = []
    const onStepUpdate = (step: any) => {
      stepUpdates.push({
        ...step,
        timestamp: new Date().toISOString()
      })
      console.log('📝 Step update:', step)
    }

    const response = await assistant.chat(
      messages, 
      currentProject, 
      allProjects, 
      marketData,
      onStepUpdate
    )

    // Add step updates to response for UI
    const responseWithSteps = {
      ...response,
      thought_process: response.thought_process || stepUpdates
    }

    return NextResponse.json(responseWithSteps)

  } catch (error) {
    console.error('❌ Suna test error:', error)
    
    return NextResponse.json(
      { 
        error: 'Suna integration test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        fallback: {
          role: 'assistant',
          content: `Suna integration test encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nThis is expected during development. The integration architecture is working, but needs proper Suna deployment.`
        }
      },
      { status: 500 }
    )
  }
}