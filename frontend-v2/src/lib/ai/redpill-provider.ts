import OpenAI from "openai"

export class RedpillAIProvider {
  private client: OpenAI
  
  constructor(apiKey: string) {
    this.client = new OpenAI({
      baseURL: "https://api.redpill.ai/v1",
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Required for browser usage
    })
  }

  async chat(messages: Array<{ role: string; content: string }>, model = "phala/gpt-oss-120b") {
    try {
      console.log("Making Redpill AI request:", { messages, model })
      
      // Convert "system" role to "developer" for reasoning models
      const convertedMessages = messages.map(msg => ({
        ...msg,
        role: msg.role === "system" ? "developer" : msg.role
      }))
      
      const completion = await this.client.chat.completions.create({
        messages: convertedMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        model: model,
        stream: false,
        // Use only supported parameters for reasoning models
        max_completion_tokens: 4000,
      })

      console.log("Redpill AI response:", completion)

      // Extract reasoning content if available
      const choice = completion.choices[0]
      const content = choice?.message?.content || ""
      const reasoningContent = (choice?.message as any)?.reasoning_content || ""
      
      return {
        content: content,
        reasoning_content: reasoningContent,
        usage: completion.usage,
        model: completion.model,
      }
    } catch (error: any) {
      console.error("Redpill AI error:", error)
      console.error("Error details:", error.response?.data || error.message)
      console.error("Error status:", error.status)
      console.error("Error code:", error.code)
      const errorMessage = error.response?.data?.error || error.message || "Unknown error"
      throw new Error(`AI request failed: ${errorMessage}`)
    }
  }

  async streamChat(messages: Array<{ role: string; content: string }>, model = "phala/gpt-oss-120b") {
    try {
      console.log("Making Redpill AI streaming request:", { messages, model })
      
      // Convert "system" role to "developer" for reasoning models
      const convertedMessages = messages.map(msg => ({
        ...msg,
        role: msg.role === "system" ? "developer" : msg.role
      }))
      
      const stream = await this.client.chat.completions.create({
        messages: convertedMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        model: model,
        stream: true,
        // Use only supported parameters for reasoning models
        max_completion_tokens: 4000,
      })

      return stream
    } catch (error) {
      console.error("Redpill AI streaming error:", error)
      console.error("Error details:", error.response?.data || error.message)
      console.error("Error status:", error.status)
      console.error("Error code:", error.code)
      throw new Error(`AI streaming failed: ${error}`)
    }
  }
}