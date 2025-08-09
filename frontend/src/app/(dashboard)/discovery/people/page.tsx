"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Search,
  Target,
  TrendingUp,
  Filter,
  Eye,
  Linkedin,
  Twitter,
  Github,
  Mail,
  Globe,
  Sparkles,
  Building,
  MapPin,
  Calendar,
  UserCheck,
  Plus,
  ArrowUpRight,
  Briefcase,
  Award,
  MessageSquare,
  Zap,
  Rocket,
  Star,
  Clock,
  ExternalLink,
  Activity,
  Bell,
  GitBranch
} from 'lucide-react'

interface TalentActivity {
  id: string
  person_id: string
  person_name: string
  person_avatar?: string
  person_company?: string
  person_role?: string
  activity_type: 'github_commit' | 'github_release' | 'linkedin_post' | 'linkedin_job_change' | 'twitter_post' | 'twitter_thread' | 'funding' | 'achievement' | 'news_mention'
  title: string
  description: string
  timestamp: string
  source: string
  source_url?: string
  metadata?: {
    company_name?: string
    funding_amount?: string
    event_name?: string
    post_engagement?: number
    achievement_type?: string
  }
  signal_strength?: number
  is_tracked?: boolean
}

const ACTIVITY_ICONS = {
  github_commit: <Github className="w-5 h-5" />,
  github_release: <GitBranch className="w-5 h-5" />,
  linkedin_post: <Linkedin className="w-5 h-5" />,
  linkedin_job_change: <Briefcase className="w-5 h-5" />,
  twitter_post: <Twitter className="w-5 h-5" />,
  twitter_thread: <MessageSquare className="w-5 h-5" />,
  funding: <TrendingUp className="w-5 h-5" />,
  achievement: <Award className="w-5 h-5" />,
  news_mention: <Globe className="w-5 h-5" />
}

const ACTIVITY_COLORS = {
  github_commit: 'bg-gray-100 text-gray-700',
  github_release: 'bg-slate-100 text-slate-700',
  linkedin_post: 'bg-blue-100 text-blue-700',
  linkedin_job_change: 'bg-blue-200 text-blue-800',
  twitter_post: 'bg-sky-100 text-sky-700',
  twitter_thread: 'bg-cyan-100 text-cyan-700',
  funding: 'bg-green-100 text-green-700',
  achievement: 'bg-purple-100 text-purple-700',
  news_mention: 'bg-red-100 text-red-700'
}

export default function TalentDiscoveryPage() {
  const [activities, setActivities] = useState<TalentActivity[]>([])
  const [filteredActivities, setFilteredActivities] = useState<TalentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActivity, setFilterActivity] = useState<string>('all')
  const [filterTracked, setFilterTracked] = useState<string>('all')
  const [filterSignal, setFilterSignal] = useState<string>('all')

  useEffect(() => {
    fetchTalentActivities()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [activities, searchTerm, filterActivity, filterTracked, filterSignal])

  const fetchTalentActivities = async () => {
    try {
      const response = await fetch('/api/v1/talent/activities')
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      } else {
        // API failed, use mock data
        console.log('API returned error, using mock data')
        setActivities(getMockActivities())
      }
    } catch (error) {
      console.error('Error fetching talent activities:', error)
      // Fallback to mock data for demo
      setActivities(getMockActivities())
    } finally {
      setLoading(false)
    }
  }

  const getMockActivities = (): TalentActivity[] => [
    {
      id: '1',
      person_id: 'p1',
      person_name: 'Marvin Tong',
      person_avatar: undefined,
      person_company: 'Phala Network',
      person_role: 'CEO & Co-Founder',
      activity_type: 'github_release',
      title: 'Released Phala Network v1.8.0 with Enhanced Privacy Features',
      description: 'Major release includes zero-knowledge proof improvements, TEE optimizations, and new developer SDK. 127 commits merged.',
      timestamp: '2024-01-08T14:30:00Z',
      source: 'GitHub',
      source_url: 'https://github.com/Phala-Network/phala-blockchain/releases/tag/v1.8.0',
      metadata: {
        commits: 127,
        contributors: 12
      },
      signal_strength: 88,
      is_tracked: true
    },
    {
      id: '2',
      person_id: 'p2',
      person_name: 'Jensen Huang',
      person_avatar: undefined,
      person_company: 'NVIDIA',
      person_role: 'CEO',
      activity_type: 'twitter_thread',
      title: 'Shared Vision for AI Acceleration in 2024',
      description: '15-tweet thread on the future of AI computing, GPU architecture evolution, and democratizing AI access. 89K likes, 42K retweets.',
      timestamp: '2024-01-08T09:15:00Z',
      source: 'Twitter',
      source_url: 'https://twitter.com/jensenhuang/status/1744289456',
      metadata: {
        likes: 89000,
        retweets: 42000,
        thread_length: 15
      },
      signal_strength: 96,
      is_tracked: false
    },
    {
      id: '3',
      person_id: 'p3',
      person_name: 'Sarah Chen',
      person_avatar: undefined,
      person_company: 'Anthropic',
      person_role: 'Head of Safety',
      activity_type: 'linkedin_job_change',
      title: 'Joined Anthropic as Head of AI Safety',
      description: 'Transitioned from Google DeepMind to lead AI safety research at Anthropic. Excited to work on constitutional AI and alignment research.',
      timestamp: '2024-01-07T16:45:00Z',
      source: 'LinkedIn',
      source_url: 'https://linkedin.com/in/sarachen-ai',
      metadata: {
        previous_company: 'Google DeepMind',
        new_company: 'Anthropic'
      },
      signal_strength: 92,
      is_tracked: true
    },
    {
      id: '4',
      person_id: 'p4',
      person_name: 'Vitalik Buterin',
      person_avatar: undefined,
      person_company: 'Ethereum Foundation',
      person_role: 'Co-Founder',
      activity_type: 'github_commit',
      title: 'Committed EIP-4844 Proto-Danksharding Implementation',
      description: 'Pushed critical updates to Ethereum improvement proposal for blob transactions and data availability. 23 files changed, +2,847 -1,203 lines.',
      timestamp: '2024-01-07T11:20:00Z',
      source: 'GitHub',
      source_url: 'https://github.com/ethereum/EIPs/commit/abc123def456',
      metadata: {
        files_changed: 23,
        lines_added: 2847,
        lines_removed: 1203
      },
      signal_strength: 94,
      is_tracked: true
    },
    {
      id: '5',
      person_id: 'p5',
      person_name: 'Dario Amodei',
      person_avatar: undefined,
      person_company: 'Anthropic',
      person_role: 'CEO',
      activity_type: 'linkedin_post',
      title: 'Anthropic Achieves Constitutional AI Breakthrough',
      description: 'Shared insights on our latest constitutional AI research showing 40% improvement in helpfulness while maintaining safety standards. The future of AI alignment looks promising.',
      timestamp: '2024-01-06T13:30:00Z',
      source: 'LinkedIn',
      source_url: 'https://linkedin.com/feed/update/urn:li:activity:7152345678901',
      metadata: {
        engagement: 15600,
        comments: 342
      },
      signal_strength: 90,
      is_tracked: true
    },
    {
      id: '6',
      person_id: 'p6',
      person_name: 'Balaji Srinivasan',
      person_avatar: undefined,
      person_company: 'Independent',
      person_role: 'Investor & Writer',
      activity_type: 'twitter_post',
      title: 'AI + Crypto = The Network State Revolution',
      description: 'Posted viral analysis on how AI and blockchain will enable new forms of digital governance. Discussion of decentralized autonomous organizations powered by AI.',
      timestamp: '2024-01-06T08:45:00Z',
      source: 'Twitter',
      source_url: 'https://twitter.com/balajis/status/1744156789',
      metadata: {
        likes: 67000,
        retweets: 28000,
        replies: 4200
      },
      signal_strength: 85,
      is_tracked: false
    },
    {
      id: '7',
      person_id: 'p1',
      person_name: 'Marvin Tong',
      person_avatar: undefined,
      person_company: 'Phala Network',
      person_role: 'CEO & Co-Founder',
      activity_type: 'linkedin_post',
      title: 'Privacy-First Web3 Infrastructure is the Future',
      description: 'Detailed post on why privacy-preserving computation will be essential for mainstream Web3 adoption. Discussed TEE technology and decentralized cloud computing.',
      timestamp: '2024-01-05T14:20:00Z',
      source: 'LinkedIn',
      source_url: 'https://linkedin.com/feed/update/urn:li:activity:7152098765432',
      metadata: {
        engagement: 8900,
        comments: 156
      },
      signal_strength: 78,
      is_tracked: true
    },
    {
      id: '8',
      person_id: 'p7',
      person_name: 'Gavin Wood',
      person_avatar: undefined,
      person_company: 'Parity Technologies',
      person_role: 'Founder',
      activity_type: 'github_commit',
      title: 'Substrate Runtime Upgrade with Cross-Chain Messaging',
      description: 'Major commit implementing XCMP (Cross-Consensus Message Passing) protocol improvements. Enables better interoperability between Polkadot parachains.',
      timestamp: '2024-01-05T09:15:00Z',
      source: 'GitHub',
      source_url: 'https://github.com/paritytech/substrate/commit/def789abc123',
      metadata: {
        files_changed: 47,
        lines_added: 3421,
        lines_removed: 892
      },
      signal_strength: 87,
      is_tracked: false
    },
    {
      id: '9',
      person_id: 'p8',
      person_name: 'Meltem Demirors',
      person_avatar: undefined,
      person_company: 'CoinShares',
      person_role: 'Chief Strategy Officer',
      activity_type: 'twitter_thread',
      title: 'Bitcoin ETF Approval Impact Analysis',
      description: '12-tweet thread analyzing the long-term implications of Bitcoin ETF approvals on institutional adoption and crypto market maturation. Comprehensive data-driven analysis.',
      timestamp: '2024-01-04T15:30:00Z',
      source: 'Twitter',
      source_url: 'https://twitter.com/meltemdemirors/status/1743987654',
      metadata: {
        likes: 45000,
        retweets: 18000,
        thread_length: 12
      },
      signal_strength: 82,
      is_tracked: true
    },
    {
      id: '10',
      person_id: 'p9',
      person_name: 'Naval Ravikant',
      person_avatar: undefined,
      person_company: 'AngelList',
      person_role: 'Founder & Chairman',
      activity_type: 'twitter_post',
      title: 'AI Will Democratize Wealth Creation',
      description: 'Philosophical take on how AI tools will enable individual wealth creation at unprecedented scale. Discussion of personal AI assistants and autonomous businesses.',
      timestamp: '2024-01-03T12:00:00Z',
      source: 'Twitter',
      source_url: 'https://twitter.com/naval/status/1743567890',
      metadata: {
        likes: 78000,
        retweets: 35000,
        quotes: 8900
      },
      signal_strength: 91,
      is_tracked: false
    },
    {
      id: '11',
      person_id: 'p4',
      person_name: 'Vitalik Buterin',
      person_avatar: undefined,
      person_company: 'Ethereum Foundation',
      person_role: 'Co-Founder',
      activity_type: 'linkedin_post',
      title: 'Ethereum Roadmap 2024: The Surge and Beyond',
      description: 'Comprehensive update on Ethereum\'s scaling roadmap including Proto-Danksharding, account abstraction, and the path to 100,000+ TPS.',
      timestamp: '2024-01-02T10:45:00Z',
      source: 'LinkedIn',
      source_url: 'https://linkedin.com/feed/update/urn:li:activity:7151765432109',
      metadata: {
        engagement: 25000,
        comments: 892
      },
      signal_strength: 95,
      is_tracked: true
    },
    {
      id: '12',
      person_id: 'p10',
      person_name: 'Kathy Woods',
      person_avatar: undefined,
      person_company: 'ARK Invest',
      person_role: 'CEO',
      activity_type: 'github_release',
      title: 'Open-Sourced ARK Big Ideas 2024 Research Models',
      description: 'Released comprehensive data models and analysis tools for disruptive innovation research. Includes AI, robotics, blockchain, and genomics forecasting models.',
      timestamp: '2024-01-01T16:00:00Z',
      source: 'GitHub',
      source_url: 'https://github.com/arkInvest/big-ideas-2024',
      metadata: {
        stars: 2847,
        forks: 456
      },
      signal_strength: 79,
      is_tracked: false
    }
  ]

  const applyFilters = () => {
    let filtered = activities

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(activity => 
        activity.person_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.person_company?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Activity type filter
    if (filterActivity !== 'all') {
      filtered = filtered.filter(activity => activity.activity_type === filterActivity)
    }

    // Tracked filter
    if (filterTracked !== 'all') {
      filtered = filtered.filter(activity => 
        filterTracked === 'tracked' ? activity.is_tracked : !activity.is_tracked
      )
    }

    // Signal strength filter
    if (filterSignal !== 'all') {
      filtered = filtered.filter(activity => {
        const strength = activity.signal_strength || 0
        switch (filterSignal) {
          case 'hot': return strength >= 90
          case 'strong': return strength >= 70 && strength < 90
          case 'moderate': return strength >= 50 && strength < 70
          default: return true
        }
      })
    }

    setFilteredActivities(filtered)
  }

  const handleTrackPerson = async (personId: string) => {
    try {
      const response = await fetch(`/api/v1/persons/${personId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Added from talent discovery' })
      })
      
      if (response.ok) {
        setActivities(prev => prev.map(activity => 
          activity.person_id === personId ? { ...activity, is_tracked: true } : activity
        ))
      }
    } catch (error) {
      console.error('Error tracking person:', error)
    }
  }

  const getSignalBadge = (strength?: number) => {
    if (!strength) return null
    
    if (strength >= 90) {
      return <Badge className="bg-red-500 text-white">🔥 Hot</Badge>
    } else if (strength >= 70) {
      return <Badge className="bg-orange-500 text-white">Strong</Badge>
    } else if (strength >= 50) {
      return <Badge className="bg-yellow-500 text-white">Moderate</Badge>
    }
    return <Badge variant="secondary">Low</Badge>
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) {
      return `${diffDays}d ago`
    } else if (diffHours > 0) {
      return `${diffHours}h ago`
    } else {
      return 'Just now'
    }
  }

  const getActivityTypeLabel = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Founder Radar</h1>
          <div className="flex items-center gap-1 ml-2">
            <Github className="w-5 h-5 text-gray-600" />
            <Linkedin className="w-5 h-5 text-blue-600" />
            <Twitter className="w-5 h-5 text-sky-500" />
          </div>
        </div>
        <p className="text-muted-foreground">
          Mixed timeline of founder activities from GitHub commits, LinkedIn updates, and Twitter posts
        </p>
        
        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium">{activities.filter(a => a.is_tracked).length} Tracked Updates</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-600" />
            <span className="text-sm font-medium">{activities.filter(a => (a.signal_strength || 0) >= 90).length} Hot Signals</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium">{activities.length} Total Activities</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by person, activity, company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterActivity} onValueChange={setFilterActivity}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="github_commit">GitHub Commits</SelectItem>
                  <SelectItem value="github_release">GitHub Releases</SelectItem>
                  <SelectItem value="linkedin_post">LinkedIn Posts</SelectItem>
                  <SelectItem value="linkedin_job_change">LinkedIn Job Changes</SelectItem>
                  <SelectItem value="twitter_post">Twitter Posts</SelectItem>
                  <SelectItem value="twitter_thread">Twitter Threads</SelectItem>
                  <SelectItem value="funding">Funding</SelectItem>
                  <SelectItem value="achievement">Achievements</SelectItem>
                  <SelectItem value="news_mention">News Mentions</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTracked} onValueChange={setFilterTracked}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tracking" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All People</SelectItem>
                  <SelectItem value="tracked">Tracked Only</SelectItem>
                  <SelectItem value="untracked">Not Tracked</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSignal} onValueChange={setFilterSignal}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Signal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Signals</SelectItem>
                  <SelectItem value="hot">🔥 Hot (90+)</SelectItem>
                  <SelectItem value="strong">Strong (70+)</SelectItem>
                  <SelectItem value="moderate">Moderate (50+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Stream */}
      <div className="space-y-0">
        <Separator />
        {filteredActivities.map((activity, index) => (
          <React.Fragment key={activity.id}>
            <div className="grid items-center gap-4 px-4 py-6 md:grid-cols-5 hover:bg-muted/30 transition-colors">
              {/* Person & Activity Type */}
              <div className="order-2 flex items-center gap-3 md:order-none">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${ACTIVITY_COLORS[activity.activity_type]}`}>
                  {ACTIVITY_ICONS[activity.activity_type]}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      {activity.person_avatar ? (
                        <img src={activity.person_avatar} alt={activity.person_name} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {activity.person_name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{activity.person_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.person_role}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Details */}
              <div className="order-1 md:order-none md:col-span-2">
                <h3 className="font-semibold text-lg mb-1">{activity.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {getActivityTypeLabel(activity.activity_type)}
                  </Badge>
                  {getSignalBadge(activity.signal_strength)}
                  {activity.is_tracked && (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Tracked
                    </Badge>
                  )}
                </div>
              </div>

              {/* Metadata & Source */}
              <div className="order-3 md:order-none">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {activity.source === 'GitHub' && <Github className="w-3 h-3" />}
                    {activity.source === 'LinkedIn' && <Linkedin className="w-3 h-3" />}
                    {activity.source === 'Twitter' && <Twitter className="w-3 h-3" />}
                    {!['GitHub', 'LinkedIn', 'Twitter'].includes(activity.source) && <Globe className="w-3 h-3" />}
                    <span>{activity.source}</span>
                  </div>
                  {/* Platform-specific metadata */}
                  {activity.activity_type.startsWith('github_') && activity.metadata && (
                    <div className="text-xs text-muted-foreground">
                      {activity.metadata.files_changed && `${activity.metadata.files_changed} files`}
                      {activity.metadata.commits && `${activity.metadata.commits} commits`}
                      {activity.metadata.stars && `★ ${activity.metadata.stars}`}
                    </div>
                  )}
                  {activity.activity_type.startsWith('twitter_') && activity.metadata && (
                    <div className="text-xs text-muted-foreground">
                      {activity.metadata.likes && `❤ ${(activity.metadata.likes / 1000).toFixed(1)}K`}
                      {activity.metadata.retweets && ` • ↻ ${(activity.metadata.retweets / 1000).toFixed(1)}K`}
                    </div>
                  )}
                  {activity.activity_type.startsWith('linkedin_') && activity.metadata && (
                    <div className="text-xs text-muted-foreground">
                      {activity.metadata.engagement && `💬 ${activity.metadata.engagement} engagements`}
                      {activity.metadata.comments && ` • ${activity.metadata.comments} comments`}
                    </div>
                  )}
                  {activity.person_company && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building className="w-3 h-3" />
                      <span>{activity.person_company}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="order-4 md:order-none flex items-center gap-2 justify-end">
                {activity.source_url && (
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={activity.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">View</span>
                    </a>
                  </Button>
                )}
                
                {!activity.is_tracked ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTrackPerson(activity.person_id)}
                    className="gap-1"
                  >
                    <Target className="w-4 h-4" />
                    <span className="hidden sm:inline">Track</span>
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" className="text-green-600 gap-1">
                    <UserCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Tracked</span>
                  </Button>
                )}
              </div>
            </div>
            <Separator />
          </React.Fragment>
        ))}
      </div>

      {filteredActivities.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No activity found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterActivity !== 'all' || filterTracked !== 'all' || filterSignal !== 'all'
                ? 'Try adjusting your search and filters'
                : 'No talent activity available yet'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}