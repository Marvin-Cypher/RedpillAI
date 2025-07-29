// Deal Status Synchronization Utility
// This utility ensures deal status changes are synced across all pages

export interface DealStatusUpdate {
  dealId: string
  companyId: string
  companyName: string
  newStatus: 'sourcing' | 'screening' | 'due_diligence' | 'term_sheet' | 'invested' | 'passed'
  updatedAt: string
}

const DEAL_STATUS_STORAGE_KEY = 'deal-status-updates'

// Get all deal status updates
export const getDealStatusUpdates = (): DealStatusUpdate[] => {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(DEAL_STATUS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading deal status updates:', error)
    return []
  }
}

// Update deal status and sync across pages
export const updateDealStatus = (
  dealId: string, 
  companyName: string, 
  newStatus: DealStatusUpdate['newStatus']
): void => {
  if (typeof window === 'undefined') return

  try {
    const updates = getDealStatusUpdates()
    const companyId = companyName.toLowerCase().replace(/\s+/g, '-')
    
    const existingUpdateIndex = updates.findIndex(u => u.dealId === dealId)
    const newUpdate: DealStatusUpdate = {
      dealId,
      companyId,
      companyName,
      newStatus,
      updatedAt: new Date().toISOString()
    }

    if (existingUpdateIndex >= 0) {
      updates[existingUpdateIndex] = newUpdate
    } else {
      updates.push(newUpdate)
    }

    localStorage.setItem(DEAL_STATUS_STORAGE_KEY, JSON.stringify(updates))
    
    // Trigger custom event to notify other components
    window.dispatchEvent(new CustomEvent('dealStatusChanged', {
      detail: newUpdate
    }))
    
    console.log('Deal status updated:', newUpdate)
  } catch (error) {
    console.error('Error updating deal status:', error)
  }
}

// Get deal status for a specific company
export const getDealStatusForCompany = (companyId: string): DealStatusUpdate['newStatus'] | null => {
  const updates = getDealStatusUpdates()
  const companyUpdate = updates.find(u => u.companyId === companyId)
  return companyUpdate?.newStatus || null
}

// Listen for deal status changes
export const subscribeToDealStatusChanges = (callback: (update: DealStatusUpdate) => void) => {
  if (typeof window === 'undefined') return () => {}

  const handleStatusChange = (event: CustomEvent<DealStatusUpdate>) => {
    callback(event.detail)
  }

  window.addEventListener('dealStatusChanged', handleStatusChange as EventListener)
  
  return () => {
    window.removeEventListener('dealStatusChanged', handleStatusChange as EventListener)
  }
}

// Initialize default deal statuses (for existing deals)
export const initializeDealStatuses = () => {
  const updates = getDealStatusUpdates()
  
  // If no existing data, initialize with mock data
  if (updates.length === 0) {
    const defaultDeals = [
      { dealId: '1', companyId: 'quantum-ai', companyName: 'Quantum AI', newStatus: 'due_diligence' as const },
      { dealId: '2', companyId: 'greentech-solutions', companyName: 'GreenTech Solutions', newStatus: 'screening' as const },
      { dealId: '3', companyId: 'fintech-pro', companyName: 'FinTech Pro', newStatus: 'term_sheet' as const },
      { dealId: '4', companyId: 'healthtech-analytics', companyName: 'HealthTech Analytics', newStatus: 'sourcing' as const }
    ]

    defaultDeals.forEach(deal => {
      updateDealStatus(deal.dealId, deal.companyName, deal.newStatus)
    })
  }
}