'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  Building,
  Globe,
  Users,
  DollarSign,
  Calendar,
  Flame,
  Upload,
  FileText,
  Link,
  MessageSquare,
  TrendingUp,
  Star,
  Download,
  Eye,
  Trash2,
  Brain
} from 'lucide-react'
import { StatusSelector } from '@/components/deals/StatusSelector'
import { DocumentUpload } from './DocumentUpload'
import { EditableProjectData } from './EditableProjectData'
import { InvestmentMemoManager } from '../memo/InvestmentMemoManager'
import { AgenticChatInterface, AgenticChatButton } from '@/components/ai/AgenticChatInterface'
import { cn } from '@/lib/utils'

interface ProjectDetailProps {
  projectId: string
  projectData?: any
  onBack: () => void
  onStatusChange: (projectId: string, newStatus: string) => void
  onProjectUpdate?: (projectId: string, updatedData: any) => void
  pendingMemo?: {content: string, dealId: string} | null
  onMemoAdded?: () => void
}

interface Document {
  id: string
  name: string
  type: 'pdf' | 'doc' | 'link' | 'image'
  size?: string
  uploadedAt: string
  url?: string
  description?: string
}

// Mock project data - in real app would come from API
const mockProjects: Record<string, any> = {
  '1': {
  id: '1',
  company_name: 'LayerZero',
  status: 'research',
  stage: 'Series B',
  round_size: '$120M',
  sector: 'Infrastructure', 
  is_hot: true,
  website: 'layerzero.network',
  description: 'Omnichain interoperability protocol enabling seamless cross-chain applications',
  founded: '2021',
  team_size: '45+',
  valuation: '$3B',
  previous_funding: '$293M',
  investors: ['a16z', 'Sequoia', 'FTX Ventures', 'Coinbase Ventures'],
  key_metrics: {
    tvl: '$6.2B',
    transactions: '25M+',
    chains_supported: '50+',
    dapps_using: '200+'
  },
  documents: [
    {
      id: 'doc-1',
      name: 'LayerZero Whitepaper v2.pdf',
      type: 'pdf' as const,
      size: '2.4 MB',
      uploadedAt: '2 hours ago',
      description: 'Technical whitepaper detailing the omnichain protocol'
    },
    {
      id: 'doc-2', 
      name: 'Pitch Deck - Series B.pdf',
      type: 'pdf' as const,
      size: '15.6 MB',
      uploadedAt: '1 day ago',
      description: 'Investment deck with market analysis and roadmap'
    },
    {
      id: 'doc-3',
      name: 'Stargate Finance Analysis',
      type: 'link' as const,
      uploadedAt: '3 days ago',
      url: 'https://stargate.finance',
      description: 'DeFi bridge protocol built on LayerZero'
    },
    {
      id: 'doc-4',
      name: 'Team Background Research',
      type: 'doc' as const,
      size: '856 KB',
      uploadedAt: '1 week ago',
      description: 'Founder and key team member backgrounds'
    }
  ],
  ai_insights: [
    {
      title: 'Market Position',
      summary: 'LayerZero is positioned as the leading omnichain protocol with strong developer adoption',
      confidence: 85,
      updated: '4 hours ago'
    },
    {
      title: 'Technical Analysis',
      summary: 'Novel approach to cross-chain messaging without traditional bridge vulnerabilities',
      confidence: 92,
      updated: '1 day ago'
    },
    {
      title: 'Competitive Landscape',
      summary: 'Main competitors include Axelar, Wormhole, and Multichain with different technical approaches',
      confidence: 78,
      updated: '2 days ago'
    }
  ],
  investment_memos: [
    {
      id: 'memo-1',
      title: 'LayerZero Series B Investment Analysis',
      content: `# LayerZero Investment Memo\n\n## Executive Summary\n\nLayerZero presents a compelling investment opportunity in the omnichain infrastructure space. The protocol's novel approach to cross-chain messaging addresses key vulnerabilities in traditional bridge architectures while maintaining strong developer adoption.\n\n**Recommendation: BUY** - $5M initial investment at $3B valuation\n\n## Investment Thesis\n\n### Technical Innovation\n- First-of-its-kind omnichain protocol\n- Eliminates need for traditional bridges\n- Ultra Light Node architecture reduces attack vectors\n\n### Market Opportunity\n- $50B+ cross-chain transaction volume annually\n- Growing demand for seamless multi-chain applications\n- Limited direct competition in omnichain space\n\n### Team & Execution\n- Strong technical leadership with deep blockchain experience\n- Proven ability to ship complex infrastructure\n- Growing ecosystem of 200+ integrated applications\n\n## Key Risks\n\n1. **Technical Complexity**: Novel architecture may have undiscovered vulnerabilities\n2. **Regulatory Risk**: Cross-chain protocols face uncertain regulatory landscape\n3. **Competition**: Established players like Wormhole and Axelar have significant traction\n\n## Financial Projections\n\n- Revenue Model: Transaction fees + protocol fees\n- 2024 Revenue Projection: $50M\n- 2025 Revenue Projection: $150M\n- Path to $1B+ valuation justified by protocol metrics\n\n## Conclusion\n\nLayerZero's technical innovation and market positioning make it an attractive investment at current valuation. The team's execution track record and growing ecosystem adoption support a positive investment decision.`,
      summary: 'Comprehensive analysis recommending $5M investment in LayerZero at $3B valuation based on technical innovation and market opportunity.',
      recommendation: 'buy' as const,
      author: 'Investment Team',
      created_at: '2 days ago',
      updated_at: '2 days ago',
      is_ai_generated: false,
      status: 'approved' as const
    },
    {
      id: 'memo-2',
      title: 'AI-Generated Risk Assessment',
      content: `# LayerZero Risk Analysis\n\n## Technical Risks\n\n### Smart Contract Security\n- Complex multi-chain architecture increases attack surface\n- Ultra Light Node implementation requires careful security review\n- Recommendation: Third-party security audit before investment\n\n### Centralization Concerns\n- Reliance on Oracle and Relayer infrastructure\n- Potential single points of failure\n- Mitigation: Diversified infrastructure providers\n\n## Market Risks\n\n### Competition\n- Wormhole: $2.5B valuation, established bridging protocol\n- Axelar: Growing Cosmos ecosystem integration\n- Multichain: Broad chain support but security concerns\n\n### Regulatory Environment\n- Cross-chain protocols may face increased scrutiny\n- Potential classification as money transmission\n- Geographic restrictions possible\n\n## Mitigation Strategies\n\n1. Staged investment approach\n2. Technical due diligence with security experts\n3. Regular competitive analysis\n4. Legal framework review\n\n## Overall Risk Rating: MEDIUM-HIGH\n\nRecommendation: Proceed with investment but implement risk mitigation measures.`,
      summary: 'AI-generated risk assessment identifying technical and market risks with mitigation strategies.',
      recommendation: 'hold' as const,
      author: 'AI Assistant',
      created_at: '1 day ago',
      updated_at: '1 day ago',
      is_ai_generated: true,
      status: 'review' as const
    }
  ]
  },
  '2': {
    id: '2',
    company_name: 'Celestia',
    status: 'planned',
    stage: 'Series A',
    round_size: '$55M',
    sector: 'Data Availability',
    is_hot: false,
    website: 'celestia.org',
    description: 'Modular blockchain network that enables anyone to easily deploy their own blockchain with minimal overhead',
    founded: '2019',
    team_size: '30+',
    valuation: '$1B',
    previous_funding: '$100M',
    investors: ['Bain Capital', 'Polychain Capital'],
    key_metrics: {
      validators: '100+',
      data_availability: '1GB blocks',
      rollups_supported: '10+'
    },
    documents: [],
    ai_insights: [],
    investment_memos: []
  }
}

// Default structure for new projects
const getDefaultProject = (projectId: string, companyName?: string) => ({
  id: projectId,
  company_name: companyName || 'New Company',
  status: 'planned',
  stage: 'Unknown',
  round_size: 'TBD',
  sector: 'Unknown',
  is_hot: false,
  website: '',
  description: '',
  founded: '',
  team_size: '',
  valuation: '',
  previous_funding: '',
  investors: [],
  key_metrics: {},
  documents: [],
  ai_insights: [],
  investment_memos: []
})

export function ProjectDetail({ projectId, projectData: passedProjectData, onBack, onStatusChange, onProjectUpdate, pendingMemo, onMemoAdded }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMode, setChatMode] = useState<'slide' | 'inline' | 'fullscreen'>('slide')
  
  // Get project data - prefer passed data, then check mock data, then create default
  const rawProject = passedProjectData || (projectId ? (mockProjects[projectId] || getDefaultProject(projectId, passedProjectData?.company_name)) : getDefaultProject('new'))
  
  // Ensure all required fields exist
  const initialProject = {
    ...getDefaultProject(rawProject.id || projectId, rawProject.company_name),
    ...rawProject,
    investors: rawProject.investors || [],
    key_metrics: rawProject.key_metrics || {},
    documents: rawProject.documents || [],
    ai_insights: rawProject.ai_insights || [],
    investment_memos: rawProject.investment_memos || []
  }
  
  const [documents, setDocuments] = useState<Document[]>(initialProject.documents)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [projectData, setProjectData] = useState(initialProject)
  const [memos, setMemos] = useState(initialProject.investment_memos)

  const project = projectData

  // Handle pending memo from chat
  useEffect(() => {
    if (pendingMemo && pendingMemo.dealId === projectId) {
      // Auto-create memo from chat content
      const newMemo = {
        title: `AI Chat Insights - ${new Date().toLocaleDateString()}`,
        content: pendingMemo.content,
        summary: pendingMemo.content.substring(0, 200) + '...',
        recommendation: 'hold' as const,
        author: 'AI Assistant',
        is_ai_generated: true,
        status: 'draft' as const
      }
      
      // Add the memo
      handleCreateMemo(newMemo)
      
      // Switch to memos tab
      setActiveTab('memos')
      
      // Clear the pending memo
      if (onMemoAdded) {
        onMemoAdded()
      }
    }
  }, [pendingMemo, projectId, onMemoAdded])

  const handleDocumentUpload = (newDocument: Omit<Document, 'id' | 'uploadedAt'>) => {
    const document: Document = {
      ...newDocument,
      id: Date.now().toString(),
      uploadedAt: 'just now'
    }
    setDocuments(prev => [document, ...prev])
  }

  const handleDocumentDelete = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId))
  }

  const handleProjectDataSave = (updatedData: any) => {
    setProjectData(updatedData)
    // Notify parent component about the update
    if (onProjectUpdate) {
      onProjectUpdate(projectId, updatedData)
    }
    // In real app: API call to save data
    console.log('Saving project data:', updatedData)
  }

  const handleCreateMemo = (memo: any) => {
    const newMemo = {
      ...memo,
      id: Date.now().toString(),
      created_at: 'just now',
      updated_at: 'just now'
    }
    setMemos(prev => [newMemo, ...prev])
  }

  const handleUpdateMemo = (id: string, updates: any) => {
    setMemos(prev => prev.map(memo => 
      memo.id === id ? { ...memo, ...updates, updated_at: 'just now' } : memo
    ))
  }

  const handleDeleteMemo = (id: string) => {
    setMemos(prev => prev.filter(memo => memo.id !== id))
  }

  const handleGenerateAIMemo = async (): Promise<string> => {
    // Generate AI memo using the chat API
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Generate a comprehensive investment memo for ${project.company_name}. Include executive summary, investment thesis, risks, financial analysis, and recommendation.`,
        projectId: projectId
      })
    })
    
    const data = await response.json()
    return data.response || 'Failed to generate memo'
  }

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-400" />
      case 'doc':
        return <FileText className="w-4 h-4 text-blue-400" />
      case 'link':
        return <Link className="w-4 h-4 text-green-400" />
      case 'image':
        return <Eye className="w-4 h-4 text-purple-400" />
      default:
        return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pipeline
          </Button>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white">{project.company_name}</h1>
            {project.is_hot && <Flame className="w-5 h-5 text-red-400" />}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <AgenticChatButton 
            project={project}
            onClick={() => setChatOpen(true)}
          />
          <StatusSelector
            currentStatus={project.status}
            dealId={project.id}
            companyName={project.name}
            onStatusChange={onStatusChange}
          />
          <Button variant="secondary" size="sm">
            <Star className="w-4 h-4 mr-2" />
            Follow
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="redpill-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
              <DollarSign className="w-4 h-4" />
              <span>Round Size</span>
            </div>
            <div className="text-lg font-semibold text-white">{project.round_size}</div>
          </CardContent>
        </Card>
        <Card className="redpill-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Valuation</span>
            </div>
            <div className="text-lg font-semibold text-white">{project.valuation}</div>
          </CardContent>
        </Card>
        <Card className="redpill-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
              <Users className="w-4 h-4" />
              <span>Team Size</span>
            </div>
            <div className="text-lg font-semibold text-white">{project.team_size}</div>
          </CardContent>
        </Card>
        <Card className="redpill-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span>Founded</span>
            </div>
            <div className="text-lg font-semibold text-white">{project.founded}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-dark-800 border-dark-600">
          <TabsTrigger value="overview" className="data-[state=active]:bg-redpill-600">
            Overview
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-redpill-600">
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-redpill-600">
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="conversations" className="data-[state=active]:bg-redpill-600">
            Conversations
          </TabsTrigger>
          <TabsTrigger value="memos" className="data-[state=active]:bg-redpill-600">
            Memos ({memos.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <EditableProjectData
            projectData={project}
            onSave={handleProjectDataSave}
          />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Knowledge Base</h3>
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="redpill-button-primary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </div>

          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id} className="redpill-card hover:border-redpill-600 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getDocumentIcon(doc.type)}
                      <div>
                        <p className="font-medium text-white">{doc.name}</p>
                        {doc.description && (
                          <p className="text-sm text-gray-400">{doc.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          {doc.size && <span>{doc.size}</span>}
                          <span>{doc.uploadedAt}</span>
                          {doc.type === 'link' && doc.url && (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer"
                               className="text-redpill-400 hover:text-redpill-300">
                              View Link
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDocumentDelete(doc.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="space-y-4">
            {project.ai_insights.map((insight, index) => (
              <Card key={index} className="redpill-card">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-white">{insight.title}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-green-900/30 border-green-700 text-green-400">
                        {insight.confidence}% confidence
                      </Badge>
                      <span className="text-xs text-gray-500">{insight.updated}</span>
                    </div>
                  </div>
                  <p className="text-gray-300">{insight.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-6">
          <Card className="redpill-card">
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Start a Conversation</h3>
              <p className="text-gray-400 mb-4">
                Use AI to research and analyze this project
              </p>
              <AgenticChatButton 
                project={project}
                onClick={() => setChatOpen(true)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Memos Tab */}
        <TabsContent value="memos" className="space-y-6">
          <InvestmentMemoManager
            projectName={project.company_name}
            memos={memos}
            onCreateMemo={handleCreateMemo}
            onUpdateMemo={handleUpdateMemo}
            onDeleteMemo={handleDeleteMemo}
            onGenerateAIMemo={handleGenerateAIMemo}
          />
        </TabsContent>
      </Tabs>

      {/* Document Upload Modal */}
      <DocumentUpload
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleDocumentUpload}
      />
      
      {/* Agentic AI Chat Interface */}
      <AgenticChatInterface
        project={project}
        isOpen={chatOpen}
        onToggle={setChatOpen}
      >
        <div></div>
      </AgenticChatInterface>
    </div>
  )
}