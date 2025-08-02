'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TestResult {
  status: 'pending' | 'running' | 'success' | 'error'
  message: string
  timestamp?: Date
}

export function SimpleMVP() {
  const [tests, setTests] = useState<Record<string, TestResult>>({
    backend: { status: 'pending', message: 'Not tested' },
    agents: { status: 'pending', message: 'Not tested' },
    market: { status: 'pending', message: 'Not tested' },
    portfolio: { status: 'pending', message: 'Not tested' }
  })

  const updateTest = (testId: string, result: TestResult) => {
    setTests(prev => ({
      ...prev,
      [testId]: { ...result, timestamp: new Date() }
    }))
  }

  const testBackendConnection = async () => {
    updateTest('backend', { status: 'running', message: 'Testing backend connection...' })
    
    try {
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        updateTest('backend', { 
          status: 'success', 
          message: `Backend healthy: ${data.status || 'OK'}` 
        })
      } else {
        updateTest('backend', { 
          status: 'error', 
          message: `Backend error: ${response.status}` 
        })
      }
    } catch (error) {
      updateTest('backend', { 
        status: 'error', 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    }
  }

  const testAgentSystem = async () => {
    updateTest('agents', { status: 'running', message: 'Testing AI agent system...' })
    
    try {
      // Mock agent test - simulate agent response
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      updateTest('agents', { 
        status: 'success', 
        message: 'Mock AI agents ready (AG-UI Protocol simulated)' 
      })
    } catch (error) {
      updateTest('agents', { 
        status: 'error', 
        message: `Agent system failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    }
  }

  const testMarketData = async () => {
    updateTest('market', { status: 'running', message: 'Testing market data access...' })
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/market/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        updateTest('market', { 
          status: 'success', 
          message: `Market data available: ${data.message || 'OpenBB connected'}` 
        })
      } else {
        updateTest('market', { 
          status: 'error', 
          message: `Market data error: ${response.status}` 
        })
      }
    } catch (error) {
      updateTest('market', { 
        status: 'error', 
        message: `Market connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    }
  }

  const testPortfolioSystem = async () => {
    updateTest('portfolio', { status: 'running', message: 'Testing portfolio system...' })
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/portfolio/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const data = await response.json()
        updateTest('portfolio', { 
          status: 'success', 
          message: `Portfolio system ready: ${data.message || 'OpenProject accessible'}` 
        })
      } else {
        updateTest('portfolio', { 
          status: 'error', 
          message: `Portfolio error: ${response.status}` 
        })
      }
    } catch (error) {
      updateTest('portfolio', { 
        status: 'error', 
        message: `Portfolio connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    }
  }

  const runAllTests = async () => {
    await testBackendConnection()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testAgentSystem()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testMarketData()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testPortfolioSystem()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      case 'running': return 'bg-yellow-500 animate-pulse'
      default: return 'bg-gray-300'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-800">✅ Success</Badge>
      case 'error': return <Badge className="bg-red-100 text-red-800">❌ Error</Badge>
      case 'running': return <Badge className="bg-yellow-100 text-yellow-800 animate-pulse">🔄 Running</Badge>
      default: return <Badge className="bg-gray-100 text-gray-800">⏳ Pending</Badge>
    }
  }

  const testItems = [
    {
      id: 'backend',
      name: '🔗 Backend API',
      description: 'FastAPI server health check',
      action: testBackendConnection
    },
    {
      id: 'agents',
      name: '🤖 AI Agents',
      description: 'AG-UI Protocol agent system',
      action: testAgentSystem
    },
    {
      id: 'market',
      name: '📊 Market Data',
      description: 'OpenBB Platform financial data',
      action: testMarketData
    },
    {
      id: 'portfolio',
      name: '🏢 Portfolio',
      description: 'OpenProject portfolio management',
      action: testPortfolioSystem
    }
  ]

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🧪 Simple MVP Testing
        </h1>
        <p className="text-gray-600">
          Basic connectivity tests for Three-Pillar Architecture
        </p>
      </div>

      {/* System Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {testItems.map((item) => (
              <div key={item.id} className="text-center">
                <div className={`w-4 h-4 rounded-full ${getStatusColor(tests[item.id].status)} mx-auto mb-2`}></div>
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-600">{tests[item.id].status}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Individual Tests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testItems.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{item.name}</CardTitle>
                {getStatusBadge(tests[item.id].status)}
              </div>
              <p className="text-sm text-gray-600">{item.description}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-gray-100 rounded text-sm">
                  <p className="font-medium">Status:</p>
                  <p>{tests[item.id].message}</p>
                  {tests[item.id].timestamp && (
                    <p className="text-xs text-gray-500 mt-1">
                      {tests[item.id].timestamp?.toLocaleTimeString()}
                    </p>
                  )}
                </div>
                
                <Button 
                  onClick={item.action}
                  disabled={tests[item.id].status === 'running'}
                  size="sm"
                  className="w-full"
                >
                  {tests[item.id].status === 'running' ? 'Testing...' : 'Test Connection'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>🎮 Test Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button 
              onClick={runAllTests}
              disabled={Object.values(tests).some(t => t.status === 'running')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              🚀 Run All Tests
            </Button>
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
            >
              🔄 Reset Tests
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Instructions:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Start with "Backend API" test to verify server connection</li>
              <li>Then test individual pillars (Agents, Market Data, Portfolio)</li>
              <li>Check browser console for detailed error messages</li>
              <li>Green = working, Red = needs fixing, Yellow = testing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}