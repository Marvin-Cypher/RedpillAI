'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SunaTestPage() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testSunaIntegration = async () => {
    if (!message.trim()) return

    setLoading(true)
    setResponse(null)

    try {
      const res = await fetch('/api/chat-suna-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: message }
          ],
          currentProject: {
            id: 'test-project',
            name: 'Test Project',
            description: 'A test crypto project for Suna integration'
          },
          allProjects: [],
          marketData: null
        })
      })

      const data = await res.json()
      setResponse(data)
    } catch (error) {
      console.error('Test error:', error)
      setResponse({
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Suna AI Integration Test</h1>
        <p className="text-gray-600 mt-2">
          Test the Suna AI integration with RedpillAI. This uses a mock client for testing the architecture.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter a test message (try: 'Conduct comprehensive research on Bitcoin ETFs' or 'Analyze this project')"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={testSunaIntegration}
              disabled={loading || !message.trim()}
              className="w-full"
            >
              {loading ? 'Testing Suna Integration...' : 'Test Suna AI'}
            </Button>
          </CardContent>
        </Card>

        {response && (
          <Card>
            <CardHeader>
              <CardTitle>Suna Response</CardTitle>
            </CardHeader>
            <CardContent>
              {response.error ? (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <h3 className="font-semibold text-red-800">Error</h3>
                    <p className="text-red-600">{response.details}</p>
                  </div>
                  {response.fallback && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                      <h3 className="font-semibold text-blue-800">Fallback Response</h3>
                      <p className="text-blue-600 whitespace-pre-wrap">{response.fallback.content}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <h3 className="font-semibold text-green-800">AI Response</h3>
                    <div className="text-green-700 whitespace-pre-wrap mt-2">
                      {response.content}
                    </div>
                  </div>

                  {response.reasoning_content && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded">
                      <h3 className="font-semibold text-purple-800">Reasoning</h3>
                      <p className="text-purple-600 whitespace-pre-wrap">{response.reasoning_content}</p>
                    </div>
                  )}

                  {response.thought_process && response.thought_process.length > 0 && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded">
                      <h3 className="font-semibold text-gray-800">Thought Process</h3>
                      <div className="space-y-2 mt-2">
                        {response.thought_process.map((step: any, index: number) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className={`w-2 h-2 rounded-full ${
                              step.status === 'complete' ? 'bg-green-500' : 
                              step.status === 'active' ? 'bg-blue-500' : 'bg-gray-400'
                            }`} />
                            <div>
                              <span className="font-medium">{step.title}</span>
                              <span className="text-gray-600 ml-2">- {step.content}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Test Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setMessage('Conduct comprehensive due diligence research on this project')}
                className="w-full justify-start"
              >
                📊 Test Deep Research
              </Button>
              <Button
                variant="outline"
                onClick={() => setMessage('Analyze this project and provide investment recommendations')}
                className="w-full justify-start"
              >
                💡 Test Project Analysis
              </Button>
              <Button
                variant="outline"
                onClick={() => setMessage('Find VCs that invest in crypto and blockchain companies')}
                className="w-full justify-start"
              >
                💰 Test Investor Search
              </Button>
              <Button
                variant="outline"
                onClick={() => setMessage('What are the latest trends in DeFi investments?')}
                className="w-full justify-start"
              >
                📈 Test General Query
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Mock Suna Client Ready</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>VCAssistantSuna Integration</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>Full Suna Deployment (In Progress)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span>Production Migration (Pending)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}