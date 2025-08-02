import { NextRequest, NextResponse } from "next/server";

// Proxy requests to our existing backend AI endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Extract the message from CopilotKit's request format
    const message = body.messages?.[body.messages.length - 1]?.content || 
                   body.message || 
                   "Hello";

    // Forward to our existing backend
    const backendResponse = await fetch('http://localhost:8000/api/v1/chat/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        project_id: body.project_id,
        project_type: body.project_type,
        conversation_history: body.conversation_history || []
      })
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.status}`);
    }

    const data = await backendResponse.json();
    
    // Log the response for debugging
    console.log('Backend response chat_id:', data.chat_id);
    
    // Format response for CopilotKit - include chat ID in the content
    const contentWithChatId = `${data.content}\n\n_Chat ID: ${data.chat_id}_`;
    
    return NextResponse.json({
      choices: [{
        message: {
          role: "assistant",
          content: contentWithChatId
        }
      }],
      usage: data.usage
    });

  } catch (error) {
    console.error('CopilotKit proxy error:', error);
    return NextResponse.json({ 
      error: 'AI service temporarily unavailable' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'CopilotKit proxy active',
    backend: 'http://localhost:8000/api/v1/chat/ai-chat'
  });
}