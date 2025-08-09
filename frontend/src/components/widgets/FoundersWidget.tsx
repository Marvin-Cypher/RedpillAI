"use client"

import React, { useState, useEffect } from 'react'
import { BaseWidget } from './BaseWidget'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { WidgetComponentProps } from '@/lib/widgets/types'
import {
  Users,
  Linkedin,
  Twitter,
  Github,
  Globe,
  Mail,
  Plus,
  UserPlus,
  Target,
  TrendingUp,
  Sparkles
} from 'lucide-react'

interface Founder {
  id: string
  name: string
  title?: string
  email?: string
  linkedin_url?: string
  twitter_handle?: string
  github_username?: string
  bio?: string
  avatar_url?: string
  primary_role?: string
  is_tracked?: boolean
  is_founder?: boolean
  signal_strength?: number
  startup_stage?: string
  expertise_areas?: string[]
  achievements?: string[]
}

export function FoundersWidget({
  widget,
  companyId,
  data,
  loading = false,
  error = null,
  onRefresh,
  onUpdate,
  onRemove,
  isEditing = false
}: WidgetComponentProps) {
  const companyName = widget?.config?.companyName || 'Company'
  const [founders, setFounders] = useState<Founder[]>([])
  const [isLoading, setIsLoading] = useState(loading)
  const [fetchError, setFetchError] = useState<string | null>(error)

  useEffect(() => {
    if (data?.founders) {
      setFounders(data.founders)
    } else if (!data && companyId) {
      // Self-fetch if no data provided
      fetchFounders()
    }
  }, [data, companyId])

  const fetchFounders = async () => {
    if (!companyId) return
    
    setIsLoading(true)
    setFetchError(null)
    
    try {
      const response = await fetch(`/api/v1/persons/company/${companyId}/founders`)
      if (!response.ok) throw new Error('Failed to fetch founders')
      
      const foundersData = await response.json()
      setFounders(foundersData)
    } catch (err) {
      console.error('Error fetching founders:', err)
      setFetchError('Failed to load founders')
      // Fallback to mock data for demo
      setFounders(getMockFounders())
    } finally {
      setIsLoading(false)
    }
  }

  const getMockFounders = (): Founder[] => {
    // Generate mock founders based on company data
    if (data?.enriched_data?.founders) {
      return data.enriched_data.founders.map((name: string, index: number) => ({
        id: `founder-${index}`,
        name: name,
        title: index === 0 ? 'CEO & Co-Founder' : 'CTO & Co-Founder',
        primary_role: index === 0 ? 'CEO' : 'CTO',
        is_founder: true,
        is_tracked: false,
        signal_strength: Math.random() * 100,
        expertise_areas: index === 0 
          ? ['Business Strategy', 'Fundraising', 'Product']
          : ['Engineering', 'AI/ML', 'Architecture'],
        linkedin_url: `https://linkedin.com/in/${name.toLowerCase().replace(' ', '-')}`,
        twitter_handle: `@${name.split(' ')[0].toLowerCase()}`,
        github_username: index === 1 ? name.split(' ')[0].toLowerCase() : undefined
      }))
    }
    
    // Default mock founders
    return [
      {
        id: 'f1',
        name: 'Sarah Chen',
        title: 'CEO & Co-Founder',
        email: 'sarah@example.com',
        linkedin_url: 'https://linkedin.com/in/sarachen',
        twitter_handle: '@sarachen',
        bio: 'Serial entrepreneur with 10+ years in AI/ML. Previously founded and exited 2 startups.',
        primary_role: 'CEO',
        is_founder: true,
        is_tracked: true,
        signal_strength: 85,
        expertise_areas: ['AI/ML', 'Business Strategy', 'Fundraising'],
        achievements: ['Forbes 30 Under 30', '2x successful exits']
      },
      {
        id: 'f2',
        name: 'Michael Rodriguez',
        title: 'CTO & Co-Founder',
        linkedin_url: 'https://linkedin.com/in/mrodriguez',
        github_username: 'mrodriguez',
        twitter_handle: '@mrodriguez_dev',
        bio: 'Former Google engineer, specialized in distributed systems and ML infrastructure.',
        primary_role: 'CTO',
        is_founder: true,
        is_tracked: false,
        signal_strength: 72,
        expertise_areas: ['Distributed Systems', 'ML Infrastructure', 'Engineering'],
        achievements: ['Google AI Impact Challenge Winner', '15+ patents']
      }
    ]
  }

  const handleTrackFounder = async (founderId: string) => {
    try {
      const response = await fetch(`/api/v1/persons/${founderId}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: `Founder of ${companyName}`
        })
      })
      
      if (response.ok) {
        // Update local state
        setFounders(prev => prev.map(f => 
          f.id === founderId ? { ...f, is_tracked: true } : f
        ))
      }
    } catch (err) {
      console.error('Error tracking founder:', err)
    }
  }

  const getSignalBadge = (strength?: number) => {
    if (!strength) return null
    
    if (strength > 80) {
      return <Badge className="bg-red-500 text-white">🔥 Hot Signal</Badge>
    } else if (strength > 60) {
      return <Badge className="bg-orange-500 text-white">Strong Signal</Badge>
    } else if (strength > 40) {
      return <Badge className="bg-yellow-500 text-white">Active</Badge>
    }
    return <Badge variant="secondary">Monitoring</Badge>
  }

  const content = (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex items-start gap-3 p-3 border rounded-lg animate-pulse">
              <div className="w-12 h-12 bg-muted rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-32 mb-2" />
                <div className="h-3 bg-muted rounded w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : founders.length > 0 ? (
        <div className="space-y-3">
          {founders.map((founder) => (
            <div key={founder.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <Avatar className="w-12 h-12">
                {founder.avatar_url ? (
                  <img src={founder.avatar_url} alt={founder.name} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {founder.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{founder.name}</h4>
                    <p className="text-xs text-muted-foreground">{founder.title || founder.primary_role}</p>
                  </div>
                  {founder.is_tracked && getSignalBadge(founder.signal_strength)}
                </div>
                
                {founder.bio && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {founder.bio}
                  </p>
                )}
                
                {founder.expertise_areas && founder.expertise_areas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {founder.expertise_areas.slice(0, 3).map((area) => (
                      <Badge key={area} variant="outline" className="text-xs px-1 py-0">
                        {area}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-3 mt-2">
                  {founder.linkedin_url && (
                    <a 
                      href={founder.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {founder.twitter_handle && (
                    <a 
                      href={`https://twitter.com/${founder.twitter_handle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {founder.github_username && (
                    <a
                      href={`https://github.com/${founder.github_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {founder.email && (
                    <a
                      href={`mailto:${founder.email}`}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                  
                  {!founder.is_tracked && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs ml-auto"
                      onClick={() => handleTrackFounder(founder.id)}
                    >
                      <Target className="w-3 h-3 mr-1" />
                      Track
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No founder information available</p>
          <Button 
            size="sm" 
            variant="outline" 
            className="mt-3"
            onClick={onRefresh || fetchFounders}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Founders
          </Button>
        </div>
      )}
      
      {founders.some(f => f.is_tracked) && (
        <div className="pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3" />
            <span>Tracking {founders.filter(f => f.is_tracked).length} founder(s) for signals</span>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <BaseWidget
      widget={widget}
      title="Founders & Team"
      icon={<Users className="w-4 h-4" />}
      className="h-full"
      onRefresh={onRefresh || fetchFounders}
      onUpdate={onUpdate}
      onRemove={onRemove}
      isEditing={isEditing}
      actions={
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
          <Plus className="w-4 h-4" />
        </Button>
      }
    >
      {content}
    </BaseWidget>
  )
}