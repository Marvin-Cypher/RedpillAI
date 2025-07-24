'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  MessageSquare,
  TrendingUp,
  Shield,
  Users,
  BarChart3,
  FileText,
  Brain,
  Lightbulb
} from 'lucide-react'

interface NewConversationModalProps {
  isOpen: boolean
  onClose: () => void
  projectName: string
  onCreateConversation: (conversation: {
    title: string
    initialMessage?: string
    type: 'research' | 'analysis' | 'general' | 'memo'
  }) => void
}

const conversationTemplates = [
  {
    id: 'research',
    title: 'Project Research',
    icon: Brain,
    description: 'Deep dive analysis of the project',
    color: 'bg-blue-600',
    initialMessage: 'Conduct comprehensive research on this project including technical analysis, tokenomics, team background, and market positioning.',
    type: 'research' as const
  },
  {
    id: 'competitive',
    title: 'Competitive Analysis',
    icon: TrendingUp,
    description: 'Compare with competitors and market',
    color: 'bg-green-600',
    initialMessage: 'Analyze the competitive landscape and positioning of this project compared to similar protocols in the space.',
    type: 'analysis' as const
  },
  {
    id: 'risks',
    title: 'Risk Assessment',
    icon: Shield,
    description: 'Identify and evaluate investment risks',
    color: 'bg-red-600',
    initialMessage: 'Evaluate all potential risks for this investment including technical, market, regulatory, and team risks.',
    type: 'analysis' as const
  },
  {
    id: 'team',
    title: 'Team Analysis',
    icon: Users,
    description: 'Research founders and team',
    color: 'bg-purple-600',
    initialMessage: 'Research the founding team, advisors, and key personnel. Analyze their backgrounds, experience, and track record.',
    type: 'research' as const
  },
  {
    id: 'market',
    title: 'Market Analysis',
    icon: BarChart3,
    description: 'Market size and opportunity analysis',
    color: 'bg-orange-600',
    initialMessage: 'Analyze the total addressable market, growth potential, and market dynamics for this sector.',
    type: 'analysis' as const
  },
  {
    id: 'memo',
    title: 'Investment Memo',
    icon: FileText,
    description: 'Generate investment recommendation',
    color: 'bg-indigo-600',
    initialMessage: 'Generate a comprehensive investment memo with thesis, risks, opportunities, and recommendation.',
    type: 'memo' as const
  },
  {
    id: 'custom',
    title: 'Custom Research',
    icon: Lightbulb,
    description: 'Start with your own question',
    color: 'bg-gray-600',
    initialMessage: '',
    type: 'general' as const
  }
]

export function NewConversationModal({ 
  isOpen, 
  onClose, 
  projectName, 
  onCreateConversation 
}: NewConversationModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [customMessage, setCustomMessage] = useState('')

  if (!isOpen) return null

  const handleCreateConversation = () => {
    if (selectedTemplate === 'custom') {
      if (!customTitle.trim()) return
      onCreateConversation({
        title: customTitle.trim(),
        initialMessage: customMessage.trim() || undefined,
        type: 'general'
      })
    } else {
      const template = conversationTemplates.find(t => t.id === selectedTemplate)
      if (!template) return
      
      onCreateConversation({
        title: `${projectName}: ${template.title}`,
        initialMessage: template.initialMessage,
        type: template.type
      })
    }

    // Reset form
    setSelectedTemplate(null)
    setCustomTitle('')
    setCustomMessage('')
    onClose()
  }

  const selectedTemplateData = conversationTemplates.find(t => t.id === selectedTemplate)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl bg-dark-800 border-dark-600 max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-white">
                Start New Research
              </CardTitle>
              <p className="text-gray-400 text-sm mt-1">
                Begin a new AI conversation for {projectName}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Template Selection */}
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Choose Research Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {conversationTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all border-2 ${
                      selectedTemplate === template.id
                        ? 'border-redpill-600 bg-redpill-950'
                        : 'border-dark-600 hover:border-gray-500 bg-dark-700'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center`}>
                          <template.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1">{template.title}</h4>
                          <p className="text-sm text-gray-400">{template.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Custom Input for Custom Template */}
            {selectedTemplate === 'custom' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Conversation Title <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g., Technical Architecture Review"
                    className="bg-dark-700 border-dark-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Initial Question (optional)
                  </label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="What would you like to research about this project?"
                    className="bg-dark-700 border-dark-600 text-white"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Selected Template Preview */}
            {selectedTemplateData && selectedTemplate !== 'custom' && (
              <div className="bg-dark-700 rounded-lg p-4 border border-dark-600">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-8 h-8 ${selectedTemplateData.color} rounded-lg flex items-center justify-center`}>
                    <selectedTemplateData.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{projectName}: {selectedTemplateData.title}</h4>
                    <p className="text-sm text-gray-400">AI will start with this research focus</p>
                  </div>
                </div>
                <div className="bg-dark-800 rounded p-3 text-sm text-gray-300">
                  <strong>Initial AI prompt:</strong> {selectedTemplateData.initialMessage}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-dark-700">
              <Button
                variant="secondary"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateConversation}
                disabled={!selectedTemplate || (selectedTemplate === 'custom' && !customTitle.trim())}
                className="redpill-button-primary"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Research
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}