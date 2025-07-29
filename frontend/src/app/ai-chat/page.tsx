'use client'

import { useState } from 'react'
import { AgenticChatInterface } from '@/components/ai/AgenticChatInterface'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare,
  Brain,
  Zap,
  TrendingUp,
  BarChart3,
  FileText,
  Globe,
  Building
} from 'lucide-react'

export default function AIChatPage() {
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)

  // Sample projects for quick selection
  const sampleProjects = [
    {
      id: '1',
      name: 'LayerZero',
      sector: 'Blockchain Infrastructure',
      stage: 'Series B',
      dealStatus: 'due_diligence'
    },
    {
      id: '2', 
      name: 'Celestia',
      sector: 'Modular Blockchain',
      stage: 'Series A',
      dealStatus: 'term_sheet'
    },
    {
      id: '3',
      name: 'Berachain',
      sector: 'DeFi Infrastructure', 
      stage: 'Seed',
      dealStatus: 'screening'
    }
  ]

  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'Advanced Reasoning',
      description: 'Powered by DeepSeek-R1 with chain-of-thought analysis'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Multi-Agent Workflows',
      description: 'Specialized agents for due diligence, market analysis, and more'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Real-time Data',
      description: 'Live market data and financial metrics integration'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Investment Memos',
      description: 'Automated generation of comprehensive investment reports'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Research Assistant</h1>
              <p className="text-gray-600">Global investment analysis and research platform</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
              Online
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              DeepSeek-R1 Reasoning Model
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Multi-Agent Workflows
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Features Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-600" />
                  AI Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2 text-green-600" />
                  Quick Project Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sampleProjects.map((project) => (
                    <Button
                      key={project.id}
                      variant="outline"
                      className="w-full justify-start text-left h-auto p-3"
                      onClick={() => {
                        setSelectedProject(project)
                        setChatOpen(true)
                      }}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{project.name}</div>
                        <div className="text-xs text-gray-500">
                          {project.sector} • {project.stage}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {project.dealStatus}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Column */}
          <div className="lg:col-span-2">
            <Card className="h-[800px]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    AI Research Chat
                  </div>
                  {selectedProject && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Analyzing: {selectedProject.name}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                <AgenticChatInterface
                  project={selectedProject}
                  isOpen={true}
                  onToggle={() => {}}
                >
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Brain className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      AI Research Assistant Ready
                    </h3>
                    <p className="text-center text-gray-500 mb-6 max-w-md">
                      Select a project from the sidebar or start a general conversation. 
                      I can help with investment analysis, market research, and more.
                    </p>
                    <Button
                      onClick={() => setChatOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Start Conversation
                    </Button>
                  </div>
                </AgenticChatInterface>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedProject(null)
              setChatOpen(true)
            }}
          >
            <Globe className="w-4 h-4 mr-2" />
            General Research Chat
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/ai-demo'}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            View Demo Features
          </Button>
        </div>
      </div>
    </div>
  )
}