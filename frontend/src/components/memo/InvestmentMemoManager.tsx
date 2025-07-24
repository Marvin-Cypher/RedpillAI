'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus,
  FileText,
  Edit3,
  Save,
  X,
  Calendar,
  User,
  Star,
  Download,
  Eye,
  Trash2,
  Brain,
  Copy
} from 'lucide-react'

interface InvestmentMemo {
  id: string
  title: string
  content: string
  summary: string
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'pass'
  author: string
  created_at: string
  updated_at: string
  is_ai_generated: boolean
  status: 'draft' | 'review' | 'approved' | 'final'
}

interface InvestmentMemoManagerProps {
  projectName: string
  memos: InvestmentMemo[]
  onCreateMemo: (memo: Omit<InvestmentMemo, 'id' | 'created_at' | 'updated_at'>) => void
  onUpdateMemo: (id: string, memo: Partial<InvestmentMemo>) => void
  onDeleteMemo: (id: string) => void
  onGenerateAIMemo: () => Promise<string>
}

const recommendationColors = {
  strong_buy: 'bg-green-600',
  buy: 'bg-blue-600', 
  hold: 'bg-yellow-600',
  pass: 'bg-red-600'
}

const recommendationLabels = {
  strong_buy: 'Strong Buy',
  buy: 'Buy',
  hold: 'Hold',
  pass: 'Pass'
}

export function InvestmentMemoManager({
  projectName,
  memos,
  onCreateMemo,
  onUpdateMemo,
  onDeleteMemo,
  onGenerateAIMemo
}: InvestmentMemoManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingMemo, setEditingMemo] = useState<string | null>(null)
  const [selectedMemo, setSelectedMemo] = useState<InvestmentMemo | null>(null)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [newMemo, setNewMemo] = useState({
    title: '',
    content: '',
    summary: '',
    recommendation: 'buy' as const,
    author: 'Current User',
    is_ai_generated: false,
    status: 'draft' as const
  })

  const handleCreateMemo = () => {
    if (!newMemo.title.trim() || !newMemo.content.trim()) return

    onCreateMemo(newMemo)
    setNewMemo({
      title: '',
      content: '',
      summary: '',
      recommendation: 'buy',
      author: 'Current User',
      is_ai_generated: false,
      status: 'draft'
    })
    setIsCreating(false)
  }

  const handleGenerateAIMemo = async () => {
    setIsGeneratingAI(true)
    try {
      const aiContent = await onGenerateAIMemo()
      
      // Extract sections from AI content
      const sections = aiContent.split('\n\n')
      const summary = sections.find(s => s.includes('Executive Summary'))?.split('\n').slice(1).join('\n') || ''
      
      setNewMemo({
        title: `${projectName} Investment Analysis`,
        content: aiContent,
        summary: summary.substring(0, 200) + '...',
        recommendation: 'buy',
        author: 'AI Assistant',
        is_ai_generated: true,
        status: 'draft'
      })
      setIsCreating(true)
    } catch (error) {
      console.error('Error generating AI memo:', error)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Investment Memos</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGenerateAIMemo}
            disabled={isGeneratingAI}
            className="flex items-center space-x-2"
          >
            <Brain className="w-4 h-4" />
            <span>{isGeneratingAI ? 'Generating...' : 'AI Memo'}</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            className="redpill-button-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Memo</span>
          </Button>
        </div>
      </div>

      {/* Memo List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {memos.map((memo) => (
          <Card key={memo.id} className="redpill-card hover:border-redpill-600 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-white text-base">{memo.title}</CardTitle>
                  <div className="flex items-center space-x-4 text-xs text-gray-400 mt-2">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{memo.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{memo.updated_at}</span>
                    </div>
                    {memo.is_ai_generated && (
                      <Badge variant="outline" className="bg-blue-900/30 border-blue-700 text-blue-400">
                        AI Generated
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge className={`${recommendationColors[memo.recommendation]} text-white`}>
                    {recommendationLabels[memo.recommendation]}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm mb-4 line-clamp-3">{memo.summary}</p>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {memo.status.charAt(0).toUpperCase() + memo.status.slice(1)}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMemo(memo)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(memo.content)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingMemo(memo.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteMemo(memo.id)}
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create New Memo Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl bg-dark-800 border-dark-600 max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-dark-700">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-white">
                  {newMemo.is_ai_generated ? 'AI Generated Investment Memo' : 'New Investment Memo'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreating(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Title
                  </label>
                  <Input
                    value={newMemo.title}
                    onChange={(e) => setNewMemo(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-dark-700 border-dark-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    Recommendation
                  </label>
                  <select
                    value={newMemo.recommendation}
                    onChange={(e) => setNewMemo(prev => ({ ...prev, recommendation: e.target.value as any }))}
                    className="w-full p-2 bg-dark-700 border border-dark-600 rounded-md text-white"
                  >
                    <option value="strong_buy">Strong Buy</option>
                    <option value="buy">Buy</option>
                    <option value="hold">Hold</option>
                    <option value="pass">Pass</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Summary
                </label>
                <Textarea
                  value={newMemo.summary}
                  onChange={(e) => setNewMemo(prev => ({ ...prev, summary: e.target.value }))}
                  className="bg-dark-700 border-dark-600 text-white"
                  rows={3}
                  placeholder="Brief summary of the investment thesis..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Content
                </label>
                <Textarea
                  value={newMemo.content}
                  onChange={(e) => setNewMemo(prev => ({ ...prev, content: e.target.value }))}
                  className="bg-dark-700 border-dark-600 text-white"
                  rows={12}
                  placeholder="Full investment memo content..."
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-dark-700">
                <Button
                  variant="secondary"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateMemo}
                  disabled={!newMemo.title.trim() || !newMemo.content.trim()}
                  className="redpill-button-primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Memo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Memo Modal */}
      {selectedMemo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl bg-dark-800 border-dark-600 max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b border-dark-700">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-white">
                    {selectedMemo.title}
                  </CardTitle>
                  <div className="flex items-center space-x-4 text-sm text-gray-400 mt-2">
                    <span>By {selectedMemo.author}</span>
                    <span>{selectedMemo.updated_at}</span>
                    <Badge className={`${recommendationColors[selectedMemo.recommendation]} text-white`}>
                      {recommendationLabels[selectedMemo.recommendation]}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMemo(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-gray-300">{selectedMemo.content}</pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}