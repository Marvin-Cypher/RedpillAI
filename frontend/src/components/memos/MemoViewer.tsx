"use client"

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Edit, 
  Save, 
  X, 
  Brain, 
  User, 
  Calendar,
  Eye,
  FileText
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export interface Memo {
  id: string
  title: string
  content: string
  type: 'ai' | 'manual'
  author?: string
  createdAt: string
  updatedAt: string
  projectId: string
  projectType: string
  projectName: string
}

interface MemoViewerProps {
  memo: Memo
  isOpen: boolean
  onClose: () => void
  onSave?: (memo: Memo) => void
  onDelete?: (memoId: string) => void
}

export function MemoViewer({ memo, isOpen, onClose, onSave, onDelete }: MemoViewerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(memo.content)
  const [editedTitle, setEditedTitle] = useState(memo.title)

  const handleSave = () => {
    if (onSave) {
      const updatedMemo: Memo = {
        ...memo,
        title: editedTitle,
        content: editedContent,
        updatedAt: new Date().toISOString()
      }
      onSave(updatedMemo)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedContent(memo.content)
    setEditedTitle(memo.title)
    setIsEditing(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[100vw] h-[100vh] max-w-none max-h-none m-0 p-6 overflow-hidden flex flex-col border-0 rounded-none">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="w-full text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
                  placeholder="Memo title..."
                />
              ) : (
                <DialogTitle className="text-lg font-semibold truncate">
                  {memo.title}
                </DialogTitle>
              )}
              
              <div className="flex items-center gap-3 mt-2">
                <Badge 
                  className={memo.type === 'ai' 
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" 
                    : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                  }
                >
                  {memo.type === 'ai' ? (
                    <>
                      <Brain className="w-3 h-3 mr-1" />
                      AI Generated
                    </>
                  ) : (
                    <>
                      <FileText className="w-3 h-3 mr-1" />
                      Manual
                    </>
                  )}
                </Badge>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  {memo.type === 'ai' ? (
                    <>
                      <Brain className="w-3 h-3 mr-1" />
                      <span>AI Research Assistant</span>
                    </>
                  ) : memo.author ? (
                    <>
                      <User className="w-3 h-3 mr-1" />
                      <span>{memo.author}</span>
                    </>
                  ) : null}
                </div>
                
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span>{formatDate(memo.createdAt)}</span>
                </div>
              </div>
              
              <DialogDescription className="mt-1">
                {memo.projectType}: {memo.projectName}
              </DialogDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        <div className="flex-1 overflow-auto">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Content (Markdown supported)
                </label>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder="Write your memo content using markdown..."
                  className="min-h-[75vh] font-mono text-sm resize-none"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {editedContent.length} characters • Supports markdown formatting
                </div>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="prose prose-base max-w-none dark:prose-invert">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom styling for markdown elements
                      h1: ({ children }) => <h1 className="text-3xl font-bold mb-6 text-foreground border-b border-border pb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl font-semibold mb-4 text-foreground">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-medium mb-3 text-foreground">{children}</h3>,
                      p: ({ children }) => <p className="mb-4 text-foreground leading-relaxed text-base">{children}</p>,
                      ul: ({ children }) => <ul className="mb-4 ml-6 space-y-2 text-foreground">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-4 ml-6 space-y-2 text-foreground">{children}</ol>,
                      li: ({ children }) => <li className="text-foreground">{children}</li>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-6 italic text-muted-foreground mb-4 bg-muted/20 py-2 rounded-r">{children}</blockquote>,
                      code: ({ children }) => <code className="bg-muted px-2 py-1 rounded text-sm font-mono">{children}</code>,
                      pre: ({ children }) => <pre className="bg-muted p-6 rounded-lg overflow-x-auto mb-4 border">{children}</pre>,
                    }}
                  >
                    {memo.content}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="mt-4">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-3 h-3 mr-1" />
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="text-xs text-muted-foreground">
                {memo.updatedAt !== memo.createdAt && `Last updated: ${formatDate(memo.updatedAt)}`}
              </div>
              <Button variant="outline" onClick={onClose}>
                <Eye className="w-3 h-3 mr-1" />
                Close
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for managing memos in localStorage
export function useMemos() {
  const getMemos = (): Memo[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem('ai_memos')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const getMemosByProject = (projectId: string, projectType: string): Memo[] => {
    return getMemos().filter(memo => 
      memo.projectId === projectId && memo.projectType === projectType
    )
  }

  const saveMemo = (memo: Memo) => {
    const memos = getMemos()
    const existingIndex = memos.findIndex(m => m.id === memo.id)
    
    if (existingIndex >= 0) {
      memos[existingIndex] = memo
    } else {
      memos.push(memo)
    }
    
    localStorage.setItem('ai_memos', JSON.stringify(memos))
  }

  const deleteMemo = (memoId: string) => {
    const memos = getMemos().filter(m => m.id !== memoId)
    localStorage.setItem('ai_memos', JSON.stringify(memos))
  }

  return {
    getMemos,
    getMemosByProject,
    saveMemo,
    deleteMemo
  }
}