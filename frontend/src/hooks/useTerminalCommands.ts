import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface CommandResult {
  type: 'direct' | 'stream'
  success: boolean
  message: string
  data?: any
  stream?: AsyncIterable<string>
}

export function useTerminalCommands() {
  const [isExecuting, setIsExecuting] = useState(false)
  const { token } = useAuth()

  const executeCommand = useCallback(async (command: string): Promise<CommandResult> => {
    setIsExecuting(true)
    
    try {
      // Send natural language command to backend AI interpreter
      // The backend will parse intent and route to appropriate OpenBB functions
      const response = await fetch('/api/v1/terminal/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          command,
          context: {
            // Include any relevant context for the AI to understand the command better
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Command failed: ${response.statusText}`)
      }

      // Check if response is streaming
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('text/event-stream')) {
        // Return streaming response for real-time updates
        return {
          type: 'stream',
          success: true,
          message: 'Streaming response',
          stream: streamResponse(response)
        }
      }

      // Parse JSON response for direct results
      const result = await response.json()
      
      return {
        type: 'direct',
        success: true,
        message: result.message || 'Command executed successfully',
        data: result.data
      }
    } catch (error) {
      console.error('Command execution error:', error)
      return {
        type: 'direct',
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    } finally {
      setIsExecuting(false)
    }
  }, [token])

  return {
    executeCommand,
    isExecuting
  }
}

// Helper function to handle streaming responses
async function* streamResponse(response: Response): AsyncIterable<string> {
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  
  if (!reader) {
    throw new Error('No response body')
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            return
          }
          try {
            const parsed = JSON.parse(data)
            yield parsed.content || parsed.message || ''
          } catch {
            // If not JSON, yield as plain text
            yield data
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}