// Secure AI Service that uses server-side API routes
// This prevents API key exposure in the browser

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIResponse {
  content: string
  reasoning_content?: string
  usage?: any
  model?: string
}

export class SecureAIService {
  private getApiEndpoint(): string {
    // Use window.location.origin for browser or fallback for server-side
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/chat`
    }
    // Fallback for server-side rendering
    return '/api/chat'
  }

  async chat(
    messages: AIMessage[], 
    projectId?: string,
    projectName?: string
  ): Promise<AIResponse> {
    try {
      const response = await fetch(this.getApiEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          projectId,
          projectName
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('AI service error:', response.status, errorData)
        throw new Error(errorData.error || `AI service error: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'AI request failed')
      }

      return {
        content: data.content,
        reasoning_content: data.reasoning_content,
        usage: data.usage,
        model: data.model
      }
    } catch (error) {
      console.error('AI chat error:', error)
      throw error
    }
  }

  // Future: Add streaming support
  async *streamChat(
    messages: AIMessage[],
    projectId?: string,
    projectName?: string
  ): AsyncGenerator<string, void, unknown> {
    // To be implemented with server-sent events
    throw new Error('Streaming not yet implemented - use chat() instead')
  }
}

// Export singleton instance
export const aiService = new SecureAIService()