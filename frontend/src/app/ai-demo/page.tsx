'use client'

import { useState } from 'react'
import { AgenticChatInterface, AgenticChatButton } from '@/components/ai/AgenticChatInterface'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Brain, Zap, Eye, Users } from 'lucide-react'
import Link from 'next/link'

const demoProjects = [
  {
    id: 'polkadot',
    name: 'Polkadot',
    sector: 'Infrastructure',
    stage: 'Mainnet',
    dealStatus: 'due_diligence' as const
  },
  {
    id: 'chainlink',
    name: 'Chainlink',
    sector: 'Oracle',
    stage: 'Series A',
    dealStatus: 'term_sheet' as const
  },
  {
    id: 'solana',
    name: 'Solana',
    sector: 'Layer 1',
    stage: 'Series B',
    dealStatus: 'closed' as const
  }
]

export default function AIDemoPage() {
  const [selectedProject, setSelectedProject] = useState(demoProjects[0])
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Brain className="w-8 h-8 mr-3 text-blue-600" />
                  AI Agent Interface Demo
                </h1>
                <p className="text-gray-600 mt-1">
                  Experience the next generation of AI-powered investment analysis
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                DeepSeek-R1 Active
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Multi-Agent Workflows
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Features */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Zap className="w-5 h-5 mr-2 text-blue-600" />
                  Advanced Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">Reasoning Traces</div>
                      <div className="text-xs text-gray-600">
                        See the AI's step-by-step thought process
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">Multi-Agent Workflows</div>
                      <div className="text-xs text-gray-600">
                        Specialized agents for planning, execution, and evaluation
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">Streaming Responses</div>
                      <div className="text-xs text-gray-600">
                        Real-time progress with step-by-step updates
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">Rich Markdown</div>
                      <div className="text-xs text-gray-600">
                        Code highlighting, math equations, and tables
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-pink-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">Context Awareness</div>
                      <div className="text-xs text-gray-600">
                        Knows specific company details and investment context
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="w-5 h-5 mr-2 text-green-600" />
                  Try These Prompts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="font-medium text-blue-900">Market Analysis</div>
                    <div className="text-blue-700 text-xs mt-1">
                      "Analyze the market opportunity, size, growth trends, and competitive dynamics for this company"
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="font-medium text-green-900">Due Diligence</div>
                    <div className="text-green-700 text-xs mt-1">
                      "Conduct comprehensive due diligence analysis"
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="font-medium text-purple-900">Financial Deep Dive</div>
                    <div className="text-purple-700 text-xs mt-1">
                      "Perform detailed financial analysis including revenue model and unit economics"
                    </div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="font-medium text-orange-900">Investment Memo</div>
                    <div className="text-orange-700 text-xs mt-1">
                      "Generate comprehensive investment memo with recommendation"
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Panel - Project Selection */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Eye className="w-5 h-5 mr-2 text-purple-600" />
                  Select a Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {demoProjects.map((project) => (
                    <div
                      key={project.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedProject.id === project.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {project.sector} • {project.stage}
                          </div>
                        </div>
                        <Badge 
                          variant="outline"
                          className={`text-xs ${
                            project.dealStatus === 'closed' ? 'bg-green-50 text-green-700 border-green-200' :
                            project.dealStatus === 'due_diligence' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            project.dealStatus === 'term_sheet' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {project.dealStatus.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="text-center">
                    <AgenticChatButton 
                      project={selectedProject}
                      onClick={() => setChatOpen(true)}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Click to start analyzing {selectedProject.name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Info */}
          <div>
            <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Brain className="w-8 h-8 mr-3" />
                  <div>
                    <div className="font-bold text-lg">AI Agent System</div>
                    <div className="text-blue-100 text-sm">DeepSeek-R1 Reasoning Model</div>
                  </div>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="font-semibold mb-2">🧠 Reasoning Process</div>
                    <div className="text-blue-100">
                      Watch the AI think through complex investment decisions with transparent reasoning traces.
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-semibold mb-2">⚡ Multi-Step Workflows</div>
                    <div className="text-blue-100">
                      Specialized agents handle different aspects: planning, execution, and evaluation.
                    </div>
                  </div>
                  
                  <div>
                    <div className="font-semibold mb-2">📊 Rich Responses</div>
                    <div className="text-blue-100">
                      Formatted output with markdown, code highlighting, tables, and mathematical equations.
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold mb-2">🎯 Context Aware</div>
                    <div className="text-blue-100">
                      Understands specific company details and provides targeted investment analysis.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Chat Interface */}
      <AgenticChatInterface
        project={selectedProject}
        isOpen={chatOpen}
        onToggle={setChatOpen}
      >
        <div></div>
      </AgenticChatInterface>
    </div>
  )
}