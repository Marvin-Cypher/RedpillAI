'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Shield, Users, DollarSign, Zap } from 'lucide-react'
import { QuickStartGuide } from '@/components/import/QuickStartGuide'

export function Header() {
  const [isQuickStartOpen, setIsQuickStartOpen] = useState(false)
  
  return (
    <>
      <header className="bg-dark-900 border-b border-dark-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-full">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-redpill-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <h1 className="text-xl font-bold text-white">Redpill</h1>
            </div>
            
            {/* TEE Security Badge */}
            <Badge 
              variant="outline" 
              className="bg-green-900/30 border-green-700 text-green-400 flex items-center space-x-2"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <Shield className="w-3 h-3" />
              <span className="text-xs font-medium">TEE Secured</span>
            </Badge>
          </div>

          {/* Navigation and Stats */}
          <div className="flex items-center space-x-6">
            <Button 
              variant="ghost" 
              onClick={() => setIsQuickStartOpen(true)}
              className="text-gray-300 hover:text-white flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>Quick Start</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="text-gray-300 hover:text-white"
            >
              Fund Admin
            </Button>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1 text-gray-400">
                <Users className="w-4 h-4" />
                <span>Pipeline: <span className="text-white font-semibold">24</span></span>
              </div>
              <div className="flex items-center space-x-1 text-gray-400">
                <DollarSign className="w-4 h-4" />
                <span>Portfolio: <span className="text-green-400 font-semibold">$485M</span></span>
              </div>
            </div>

            {/* User Avatar */}
            <Avatar className="w-8 h-8">
              <AvatarImage src="/avatar.png" />
              <AvatarFallback className="bg-dark-600 text-white text-xs">
                DU
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>
      
      {/* Quick Start Guide Modal */}
      <QuickStartGuide
        isOpen={isQuickStartOpen}
        onClose={() => setIsQuickStartOpen(false)}
      />
    </>
  )
}