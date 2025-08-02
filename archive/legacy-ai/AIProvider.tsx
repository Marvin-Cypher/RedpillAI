'use client'

import { ReactNode, useState } from 'react'
import { OpenResearchCanvas } from './OpenResearchCanvas'

// Context for easy access to AI functions
export interface AIContextType {
  openAI: (memoId?: string) => void
  closeAI: () => void
}

interface AIProviderProps {
  children: ReactNode | ((context: AIContextType) => ReactNode)
  projectId?: string
  projectName?: string
  projectType?: 'company' | 'deal' | 'open'  
  enableAI?: boolean
}

export function AIProvider({ 
  children, 
  projectId, 
  projectName, 
  projectType = 'open',
  enableAI = true 
}: AIProviderProps) {
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [currentMemoId, setCurrentMemoId] = useState<string | undefined>()
  
  // Expose methods to child components
  const contextValue = {
    openAI: (memoId?: string) => {
      setCurrentMemoId(memoId)
      setIsAIOpen(true)
    },
    closeAI: () => {
      setIsAIOpen(false)
      setCurrentMemoId(undefined)
    }
  }

  // Make context available to children via props
  const childrenWithProps = typeof children === 'function' 
    ? children(contextValue)
    : children
  
  if (!enableAI) {
    return <>{childrenWithProps}</>
  }

  return (
    <div className="relative">
      {childrenWithProps}
      {isAIOpen && (
        <OpenResearchCanvas
          projectId={projectId}
          projectName={projectName}
          projectType={projectType}
          memoId={currentMemoId}
          isOpen={isAIOpen}
          onClose={() => setIsAIOpen(false)}
          onSaveMemo={(memo) => {
            console.log('Memo saved:', memo)
            // Trigger memo update event for other components
            window.dispatchEvent(new Event('memoUpdated'))
          }}
        />
      )}
    </div>
  )
}