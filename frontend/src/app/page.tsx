'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { DealPipeline } from '@/components/deals/DealPipeline'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { ConversationSidebar } from '@/components/chat/ConversationSidebar'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { ProjectDetail } from '@/components/project/ProjectDetail'
import { NewConversationModal } from '@/components/chat/NewConversationModal'

// Mock conversation data for the selected deal
const initialConversationsData: Record<string, { companyName: string, conversations: any[] }> = {
  '1': {
    companyName: 'LayerZero',
    conversations: [
      { 
        id: '1-1', 
        title: 'Initial Research', 
        last_message: 'Omnichain protocol analysis complete. Strong technical foundation but bridge security needs review.',
        updated_at: '2 hours ago',
        message_count: 15,
        is_active: false
      },
      { 
        id: '1-2', 
        title: 'Team Background Check', 
        last_message: 'Strong technical team with Ethereum experience. Ryan Zarick and Bryan Pellegrino have solid track records.',
        updated_at: '1 day ago',
        message_count: 8,
        is_active: false
      },
      { 
        id: '1-3', 
        title: 'Market Analysis', 
        last_message: 'Cross-chain infrastructure market growing rapidly. LayerZero positioned well against competitors.',
        updated_at: '2 days ago',
        message_count: 22,
        is_active: false
      }
    ]
  },
  '2': {
    companyName: 'Celestia',
    conversations: [
      { 
        id: '2-1', 
        title: 'Market Analysis', 
        last_message: 'Modular blockchain space is heating up. Celestia is the first modular blockchain network.',
        updated_at: '3 hours ago',
        message_count: 12,
        is_active: false
      }
    ]
  },
  '6': {
    companyName: 'Berachain',
    conversations: [
      { 
        id: '6-1', 
        title: 'Proof of Liquidity Analysis', 
        last_message: 'Innovative consensus mechanism that aligns validators with DeFi protocols.',
        updated_at: '2 days ago',
        message_count: 18,
        is_active: false
      },
      { 
        id: '6-2', 
        title: 'Competitive Analysis', 
        last_message: 'Comparing with other L1s - unique approach to solve the liquidity fragmentation problem.',
        updated_at: '1 day ago',
        message_count: 25,
        is_active: false
      },
      { 
        id: '6-3', 
        title: 'Investment Memo Draft', 
        last_message: 'First draft ready for review. Strong technical team, innovative consensus, growing ecosystem.',
        updated_at: '4 hours ago',
        message_count: 7,
        is_active: true
      }
    ]
  }
}

export default function Dashboard() {
  const [selectedDeal, setSelectedDeal] = useState<string | null>(null)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'dashboard' | 'project-detail'>('dashboard')
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false)
  const [conversations, setConversations] = useState(initialConversationsData)
  
  // Store all deals data at the top level
  const [allDeals, setAllDeals] = useState<Record<string, any>>({})
  
  // Store memo content to be added when switching to project detail
  const [pendingMemo, setPendingMemo] = useState<{content: string, dealId: string} | null>(null)

  // Get conversations for the selected deal
  const selectedDealData = selectedDeal ? conversations[selectedDeal] : null
  
  // Auto-select the most recent conversation when deal changes
  useEffect(() => {
    if (selectedDeal && selectedDealData?.conversations.length) {
      // Find the active conversation or default to the most recent
      const activeConv = selectedDealData.conversations.find(c => c.is_active)
      const mostRecent = selectedDealData.conversations[0]
      setActiveConversationId(activeConv?.id || mostRecent.id)
    } else {
      setActiveConversationId(null)
    }
  }, [selectedDeal, selectedDealData])

  const handleNewConversation = () => {
    setIsNewConversationModalOpen(true)
  }

  const handleCreateConversation = (conversationData: {
    title: string
    initialMessage?: string
    type: 'research' | 'analysis' | 'general' | 'memo'
  }) => {
    if (!selectedDeal) return

    const newConversation = {
      id: `${selectedDeal}-${Date.now()}`,
      title: conversationData.title,
      last_message: conversationData.initialMessage || 'Started new conversation',
      updated_at: 'just now',
      message_count: conversationData.initialMessage ? 1 : 0,
      is_active: true,
      type: conversationData.type
    }

    // Update conversations state
    setConversations(prev => ({
      ...prev,
      [selectedDeal]: {
        ...prev[selectedDeal],
        conversations: [
          newConversation,
          ...(prev[selectedDeal]?.conversations.map(c => ({ ...c, is_active: false })) || [])
        ]
      }
    }))

    // Set as active conversation
    setActiveConversationId(newConversation.id)
  }

  const handleDealSelect = (dealId: string) => {
    setSelectedDeal(dealId)
    setCurrentView('dashboard') // Stay in dashboard view when selecting a deal
  }

  const handleNewProject = (newProject: any) => {
    // Add the new project to conversations data
    setConversations(prev => ({
      ...prev,
      [newProject.id]: {
        companyName: newProject.company_name,
        conversations: []
      }
    }))
    
    // Also store the full deal data
    setAllDeals(prev => ({
      ...prev,
      [newProject.id]: newProject
    }))
  }

  const handleViewProjectDetail = (dealId: string) => {
    setSelectedDeal(dealId)
    setCurrentView('project-detail')
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
  }

  const handleStatusChange = (dealId: string, newStatus: string) => {
    // Update deal status in allDeals
    setAllDeals(prev => ({
      ...prev,
      [dealId]: {
        ...prev[dealId],
        status: newStatus
      }
    }))
    console.log('Updating deal status:', dealId, newStatus)
  }

  const handleProjectUpdate = (projectId: string, updatedData: any) => {
    // Update the project data in allDeals
    setAllDeals(prev => ({
      ...prev,
      [projectId]: updatedData
    }))
    
    // Also update the company name in conversations if it changed
    if (updatedData.company_name !== conversations[projectId]?.companyName) {
      setConversations(prev => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          companyName: updatedData.company_name
        }
      }))
    }
  }

  const handleAddToMemo = (content: string, dealId: string) => {
    // Store the memo content to be added
    setPendingMemo({ content, dealId })
    
    // Switch to project detail view
    setSelectedDeal(dealId)
    setCurrentView('project-detail')
    
    console.log('Adding to memo for deal:', dealId, 'Content:', content)
  }

  // Show Project Detail view
  if (currentView === 'project-detail' && selectedDeal) {
    return (
      <div className="min-h-screen bg-dark-900 text-white">
        <Header />
        <div className="p-6">
          <ProjectDetail
            projectId={selectedDeal}
            projectData={allDeals[selectedDeal]}
            onBack={handleBackToDashboard}
            onStatusChange={handleStatusChange}
            onProjectUpdate={handleProjectUpdate}
            pendingMemo={pendingMemo}
            onMemoAdded={() => setPendingMemo(null)}
          />
        </div>
      </div>
    )
  }

  // Default Dashboard view
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Header />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar with Deal Pipeline */}
        <Sidebar>
          <DealPipeline 
            onDealSelect={handleDealSelect}
            selectedDealId={selectedDeal}
            onNewProject={handleNewProject}
            updatedDeals={allDeals}
            onStatusChange={handleStatusChange}
          />
        </Sidebar>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Stats Cards */}
          <div className="p-6 border-b border-dark-700">
            <StatsCards />
          </div>

          {/* Chat Interface with Conversation Sidebar */}
          <div className="flex-1 p-6 flex space-x-6">
            {/* Conversation Sidebar */}
            <ConversationSidebar
              dealId={selectedDeal}
              companyName={selectedDealData?.companyName || ''}
              conversations={selectedDealData?.conversations || []}
              activeConversationId={activeConversationId}
              onConversationSelect={setActiveConversationId}
              onNewConversation={handleNewConversation}
              onViewProjectDetail={handleViewProjectDetail}
              className="flex-shrink-0"
            />
            
            {/* Chat Window */}
            <ChatWindow 
              dealId={selectedDeal}
              conversationId={activeConversationId}
              className="flex-1"
              onAddToMemo={handleAddToMemo}
            />
          </div>
        </div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        projectName={selectedDealData?.companyName || 'Project'}
        onCreateConversation={handleCreateConversation}
      />
    </div>
  )
}