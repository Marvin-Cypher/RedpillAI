"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Plus,
  FileText,
  Calendar,
  User,
  ExternalLink,
  Edit,
  Brain,
  MessageSquare,
  Clock
} from 'lucide-react'
import { AIMemoButton } from '@/components/ai'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface Memo {
  id: string
  title: string
  content: string
  chatId?: string
  date: string
  author: string
  projectId?: string
  projectName?: string
  projectType?: 'company' | 'deal' | 'open'
  tags?: string[]
  type: 'ai' | 'manual'
  companyTags?: string[]
  dealStage?: 'sourcing' | 'screening' | 'due_diligence' | 'term_sheet' | 'invested' | 'passed'
  sector?: string
  priority?: 'high' | 'medium' | 'low'
}

export default function NotesPage() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [dealStageFilter, setDealStageFilter] = useState<string>('all')
  const [sectorFilter, setSectorFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [companies, setCompanies] = useState<any[]>([])
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isNewNoteDialogOpen, setIsNewNoteDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', content: '' })

  // Load companies for metadata enrichment
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await fetch('/api/companies')
        if (response.ok) {
          const data = await response.json()
          const companiesData = Array.isArray(data) ? data : data.companies || []
          setCompanies(companiesData)
        }
      } catch (error) {
        console.error('Error loading companies:', error)
      }
    }
    loadCompanies()
  }, [])

  // Load memos from all sources
  useEffect(() => {
    const loadMemos = () => {
      try {
        if (typeof window === 'undefined') return

        const allMemos: Memo[] = []

        // Load AI research memos
        const aiMemos = localStorage.getItem('ai-research-memos')
        if (aiMemos) {
          const aiMemosData = JSON.parse(aiMemos)
          allMemos.push(...aiMemosData.map((memo: any) => ({
            ...memo,
            type: 'ai' as const,
            author: memo.author || 'AI Research Assistant'
          })))
        }

        // Load memos from individual project storages
        const storageKeys = Object.keys(localStorage).filter(key => key.startsWith('memos-'))
        storageKeys.forEach(key => {
          try {
            const projectMemos = JSON.parse(localStorage.getItem(key) || '[]')
            allMemos.push(...projectMemos.map((memo: any) => ({
              ...memo,
              type: memo.type || (memo.author?.includes('AI') ? 'ai' : 'manual')
            })))
          } catch (error) {
            console.error(`Error loading memos from ${key}:`, error)
          }
        })

        // Enrich with company data
        const enrichedMemos = allMemos.map(memo => {
          if (memo.projectId && memo.projectType === 'company') {
            const company = companies.find(c => c.id === memo.projectId)
            if (company) {
              return {
                ...memo,
                dealStage: company.deal_status,
                sector: company.sector,
                priority: company.priority,
                companyTags: [company.sector, company.stage, company.company_type].filter(Boolean)
              }
            }
          }
          return memo
        })

        // Remove duplicates by id
        const uniqueMemos = enrichedMemos.filter((memo, index, self) => 
          index === self.findIndex(m => m.id === memo.id)
        )

        setMemos(uniqueMemos)
      } catch (error) {
        console.error('Error loading memos:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMemos()

    // Listen for memo updates from AI system
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ai-research-memos' || e.key?.startsWith('memos-')) {
        loadMemos()
      }
    }

    const handleMemoUpdate = () => loadMemos()

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('memoUpdated', handleMemoUpdate)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('memoUpdated', handleMemoUpdate)
    }
  }, [companies])

  // Get unique values for filter dropdowns
  const uniqueSectors = [...new Set(memos.map(m => m.sector).filter(Boolean))]
  const uniqueDealStages = [...new Set(memos.map(m => m.dealStage).filter(Boolean))]
  const uniquePriorities = [...new Set(memos.map(m => m.priority).filter(Boolean))]

  // Filter and sort memos
  const filteredMemos = memos
    .filter(memo => {
      const matchesSearch = memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           memo.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           memo.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           memo.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           memo.companyTags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesTypeFilter = selectedFilter === 'all' ||
                               (selectedFilter === 'ai' && memo.type === 'ai') ||
                               (selectedFilter === 'manual' && memo.type === 'manual') ||
                               (selectedFilter === 'company' && memo.projectType === 'company') ||
                               (selectedFilter === 'deal' && memo.projectType === 'deal')
      
      const matchesDealStage = dealStageFilter === 'all' || memo.dealStage === dealStageFilter
      const matchesSector = sectorFilter === 'all' || memo.sector === sectorFilter
      const matchesPriority = priorityFilter === 'all' || memo.priority === priorityFilter
      
      return matchesSearch && matchesTypeFilter && matchesDealStage && matchesSector && matchesPriority
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title': return a.title.localeCompare(b.title)
        case 'date': return new Date(b.date).getTime() - new Date(a.date).getTime()
        case 'author': return a.author.localeCompare(b.author)
        case 'project': return (a.projectName || '').localeCompare(b.projectName || '')
        default: return 0
      }
    })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeIcon = (type: string) => {
    return type === 'ai' ? (
      <Brain className="w-4 h-4 text-blue-500" />
    ) : (
      <FileText className="w-4 h-4 text-gray-500" />
    )
  }

  const getTypeColor = (type: string) => {
    return type === 'ai' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }

  const getProjectTypeColor = (projectType?: string) => {
    switch (projectType) {
      case 'company': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'deal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'open': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  // Handle edit button click
  const handleEdit = (memo: Memo) => {
    setEditingMemo(memo)
    setEditForm({ title: memo.title, content: memo.content })
    setIsEditDialogOpen(true)
  }

  // Save edited memo
  const handleSaveEdit = () => {
    if (!editingMemo) return

    // Update memo in the list
    const updatedMemos = memos.map(m => 
      m.id === editingMemo.id 
        ? { ...m, title: editForm.title, content: editForm.content, date: new Date().toISOString() }
        : m
    )
    setMemos(updatedMemos)

    // Save to localStorage
    const storageKey = editingMemo.projectId 
      ? `memos-${editingMemo.projectId}`
      : 'ai-research-memos'
    
    const storedMemos = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const updatedStoredMemos = storedMemos.map((m: any) => 
      m.id === editingMemo.id 
        ? { ...m, title: editForm.title, content: editForm.content, date: new Date().toISOString() }
        : m
    )
    localStorage.setItem(storageKey, JSON.stringify(updatedStoredMemos))

    // Close dialog
    setIsEditDialogOpen(false)
    setEditingMemo(null)
    setEditForm({ title: '', content: '' })

    // Trigger update event
    window.dispatchEvent(new Event('memoUpdated'))
  }

  // Handle new note
  const handleNewNote = () => {
    setEditForm({ title: '', content: '' })
    setIsNewNoteDialogOpen(true)
  }

  // Save new note
  const handleSaveNewNote = () => {
    const newMemo: Memo = {
      id: `memo-${Date.now()}`,
      title: editForm.title || 'Untitled Note',
      content: editForm.content,
      date: new Date().toISOString(),
      author: 'User',
      type: 'manual',
      projectType: 'open'
    }

    // Add to memos list
    setMemos([newMemo, ...memos])

    // Save to localStorage
    const storedMemos = JSON.parse(localStorage.getItem('ai-research-memos') || '[]')
    storedMemos.unshift(newMemo)
    localStorage.setItem('ai-research-memos', JSON.stringify(storedMemos))

    // Close dialog
    setIsNewNoteDialogOpen(false)
    setEditForm({ title: '', content: '' })

    // Trigger update event
    window.dispatchEvent(new Event('memoUpdated'))
  }

  // Delete memo
  const handleDelete = (memo: Memo) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    // Remove from list
    const updatedMemos = memos.filter(m => m.id !== memo.id)
    setMemos(updatedMemos)

    // Remove from localStorage
    const storageKey = memo.projectId 
      ? `memos-${memo.projectId}`
      : 'ai-research-memos'
    
    const storedMemos = JSON.parse(localStorage.getItem(storageKey) || '[]')
    const updatedStoredMemos = storedMemos.filter((m: any) => m.id !== memo.id)
    localStorage.setItem(storageKey, JSON.stringify(updatedStoredMemos))

    // Trigger update event
    window.dispatchEvent(new Event('memoUpdated'))
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <FileText className="w-8 h-8 mr-3" />
              Notes & Memos
            </h1>
            <p className="text-muted-foreground mt-1">
              All research notes, AI-generated memos, and manual notes
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <AIMemoButton />
            <Button onClick={handleNewNote}>
              <Plus className="w-4 h-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Notes</p>
                <p className="text-3xl font-bold text-foreground">{memos.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Generated</p>
                <p className="text-3xl font-bold text-foreground">
                  {memos.filter(m => m.type === 'ai').length}
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Company Notes</p>
                <p className="text-3xl font-bold text-foreground">
                  {memos.filter(m => m.projectType === 'company').length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deal Notes</p>
                <p className="text-3xl font-bold text-foreground">
                  {memos.filter(m => m.projectType === 'deal').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search notes, projects, tags, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Filter Row 1 */}
            <div className="flex flex-wrap gap-4">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-lg text-sm bg-background min-w-[140px]"
              >
                <option value="all">All Notes</option>
                <option value="ai">AI Generated</option>
                <option value="manual">Manual Notes</option>
                <option value="company">Company Notes</option>
                <option value="deal">Deal Notes</option>
              </select>

              <select
                value={dealStageFilter}
                onChange={(e) => setDealStageFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-lg text-sm bg-background min-w-[140px]"
              >
                <option value="all">All Deal Stages</option>
                {uniqueDealStages.map(stage => (
                  <option key={stage} value={stage}>
                    {(stage as string).replace('_', ' ')}
                  </option>
                ))}
              </select>

              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-lg text-sm bg-background min-w-[140px]"
              >
                <option value="all">All Sectors</option>
                {uniqueSectors.map(sector => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-lg text-sm bg-background min-w-[120px]"
              >
                <option value="all">All Priorities</option>
                {uniquePriorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority} priority
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-input rounded-lg text-sm bg-background min-w-[130px]"
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
                <option value="author">Sort by Author</option>
                <option value="project">Sort by Project</option>
              </select>
            </div>
            
            {/* Active Filters Display */}
            {(selectedFilter !== 'all' || dealStageFilter !== 'all' || sectorFilter !== 'all' || priorityFilter !== 'all' || searchTerm) && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="ml-1 text-muted-foreground hover:text-foreground">
                      ×
                    </button>
                  </Badge>
                )}
                {selectedFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Type: {selectedFilter}
                    <button onClick={() => setSelectedFilter('all')} className="ml-1 text-muted-foreground hover:text-foreground">
                      ×
                    </button>
                  </Badge>
                )}
                {dealStageFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Stage: {dealStageFilter.replace('_', ' ')}
                    <button onClick={() => setDealStageFilter('all')} className="ml-1 text-muted-foreground hover:text-foreground">
                      ×
                    </button>
                  </Badge>
                )}
                {sectorFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Sector: {sectorFilter}
                    <button onClick={() => setSectorFilter('all')} className="ml-1 text-muted-foreground hover:text-foreground">
                      ×
                    </button>
                  </Badge>
                )}
                {priorityFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Priority: {priorityFilter}
                    <button onClick={() => setPriorityFilter('all')} className="ml-1 text-muted-foreground hover:text-foreground">
                      ×
                    </button>
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedFilter('all')
                    setDealStageFilter('all')
                    setSectorFilter('all')
                    setPriorityFilter('all')
                  }}
                  className="text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMemos.map((memo) => (
          <Card key={memo.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
                    {memo.title}
                  </CardTitle>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <Badge className={getTypeColor(memo.type)}>
                      {getTypeIcon(memo.type)}
                      <span className="ml-1 capitalize">{memo.type}</span>
                    </Badge>
                    {memo.projectType && (
                      <Badge variant="outline" className={getProjectTypeColor(memo.projectType)}>
                        {memo.projectType}
                      </Badge>
                    )}
                    {memo.dealStage && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-800 border-orange-200">
                        {memo.dealStage.replace('_', ' ')}
                      </Badge>
                    )}
                    {memo.priority && (
                      <Badge variant="outline" className={`text-xs ${
                        memo.priority === 'high' ? 'bg-red-50 text-red-800 border-red-200' :
                        memo.priority === 'medium' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                        'bg-green-50 text-green-800 border-green-200'
                      }`}>
                        {memo.priority} priority
                      </Badge>
                    )}
                    {memo.sector && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-800 border-blue-200">
                        {memo.sector}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Content Preview */}
              <div className="text-sm text-muted-foreground line-clamp-3">
                {memo.content}
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{memo.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(memo.date)}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {memo.projectId && memo.projectName && (
                    <Link href={`/portfolio/${memo.projectId}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Project
                      </Button>
                    </Link>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(memo)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>

              {/* Project Info */}
              {memo.projectName && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{memo.projectName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {memo.projectType === 'company' ? 'Company' : 
                           memo.projectType === 'deal' ? 'Deal' : 'Research'}
                        </p>
                        {memo.companyTags && memo.companyTags.length > 0 && (
                          <div className="flex gap-1">
                            {memo.companyTags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {memo.companyTags.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{memo.companyTags.length - 2} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {memo.chatId && (
                      <Badge variant="outline" className="text-xs">
                        Chat: {memo.chatId.slice(-6)}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredMemos.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No notes found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? 'Try adjusting your search terms or filters.' : 'Start creating notes and AI memos to see them here.'}
            </p>
            <div className="flex items-center justify-center space-x-3">
              <AIMemoButton />
              <Button onClick={handleNewNote}>
                <Plus className="w-4 h-4 mr-2" />
                Create Note
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{editingMemo ? 'Edit Note' : 'New Note'}</DialogTitle>
            <DialogDescription>
              Make changes to your note. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Enter note title..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="Enter note content..."
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            {editingMemo && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  handleDelete(editingMemo)
                  setIsEditDialogOpen(false)
                }}
                className="mr-auto"
              >
                Delete Note
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Note Dialog */}
      <Dialog open={isNewNoteDialogOpen} onOpenChange={setIsNewNoteDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>
              Create a new manual note or memo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-title">Title</Label>
              <Input
                id="new-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Enter note title..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-content">Content</Label>
              <Textarea
                id="new-content"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="Enter note content..."
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewNote} disabled={!editForm.content.trim()}>
              Create Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}