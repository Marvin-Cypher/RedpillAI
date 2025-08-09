"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  Search,
  Target,
  TrendingUp,
  Filter,
  Eye,
  EyeOff,
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
  Grid3X3,
  List,
  ExternalLink
} from 'lucide-react'

interface Person {
  id: string
  name: string
  title?: string
  email?: string
  linkedin_url?: string
  twitter_handle?: string
  github_username?: string
  website_url?: string
  bio?: string
  avatar_url?: string
  primary_role?: string
  is_tracked?: boolean
  is_founder?: boolean
  signal_strength?: number
  startup_stage?: string
  expertise_areas?: string[]
  achievements?: string[]
  company_name?: string
  location?: string
  last_activity?: string
  track_reason?: string
  tracked_since?: string
}

export default function TalentPage() {
  const [persons, setPersons] = useState<Person[]>([])
  const [filteredPersons, setFilteredPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterTracked, setFilterTracked] = useState<string>('all')
  const [filterFounder, setFilterFounder] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  useEffect(() => {
    fetchPersons()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [persons, searchTerm, filterRole, filterTracked, filterFounder])

  const fetchPersons = async () => {
    try {
      const response = await fetch('/api/v1/persons')
      if (response.ok) {
        const data = await response.json()
        setPersons(data)
      }
    } catch (error) {
      console.error('Error fetching persons:', error)
      // Fallback to mock data for demo
      setPersons(getMockPersons())
    } finally {
      setLoading(false)
    }
  }

  const getMockPersons = (): Person[] => [
    {
      id: '1',
      name: 'Marvin Tong',
      title: 'CEO & Co-Founder',
      email: 'marvin@phala.network',
      linkedin_url: 'https://linkedin.com/in/marvin-tong',
      twitter_handle: '@MarvinTong_',
      github_username: 'kvinwang',
      bio: 'Serial entrepreneur and blockchain visionary focused on privacy-preserving computing and decentralized infrastructure.',
      primary_role: 'CEO',
      is_founder: true,
      is_tracked: true,
      signal_strength: 88.5,
      expertise_areas: ['Blockchain', 'Privacy Computing', 'Distributed Systems'],
      achievements: ['Forbes 30 Under 30', 'Built privacy-preserving cloud protocol'],
      company_name: 'Phala Network',
      location: 'San Francisco, CA',
      last_activity: '2 hours ago',
      track_reason: 'Founder of portfolio company',
      tracked_since: '2024-01-15'
    },
    {
      id: '2',
      name: 'Hang Yin',
      title: 'CTO & Co-Founder',
      linkedin_url: 'https://linkedin.com/in/hang-yin',
      twitter_handle: '@h4x3rotab',
      github_username: 'h4x3rotab',
      bio: 'Former Google engineer specializing in cryptography, consensus algorithms, and privacy-preserving technologies.',
      primary_role: 'CTO',
      is_founder: true,
      is_tracked: true,
      signal_strength: 82.3,
      expertise_areas: ['Cryptography', 'Consensus Algorithms', 'Systems Engineering'],
      achievements: ['Google Senior Engineer', 'Cryptography researcher', 'TEE expert'],
      company_name: 'Phala Network',
      location: 'Singapore',
      last_activity: '1 day ago',
      track_reason: 'Co-founder of portfolio company',
      tracked_since: '2024-01-15'
    },
    {
      id: '3',
      name: 'Jensen Huang',
      title: 'CEO & Founder',
      email: 'jensen@nvidia.com',
      linkedin_url: 'https://linkedin.com/in/jensen-huang',
      bio: 'Visionary leader in AI computing and graphics processing. Co-founded NVIDIA in 1993 and has led the AI revolution.',
      primary_role: 'CEO',
      is_founder: true,
      is_tracked: false,
      signal_strength: 95.8,
      expertise_areas: ['AI Computing', 'GPU Architecture', 'Semiconductors', 'Leadership'],
      achievements: ['Forbes Billionaire', 'Time 100 Most Influential', 'AI Pioneer', 'Led $2T market cap company'],
      company_name: 'NVIDIA',
      location: 'Santa Clara, CA',
      last_activity: '3 hours ago'
    },
    {
      id: '4',
      name: 'Sarah Chen',
      title: 'VP Engineering',
      email: 'sarah@techstartup.com',
      linkedin_url: 'https://linkedin.com/in/sarachen',
      twitter_handle: '@sarachen_dev',
      github_username: 'sarachen',
      bio: 'Former Google AI researcher, now scaling distributed ML systems at high-growth startup.',
      primary_role: 'VP Engineering',
      is_founder: false,
      is_tracked: true,
      signal_strength: 76.2,
      expertise_areas: ['Machine Learning', 'Distributed Systems', 'Leadership'],
      achievements: ['Google AI Impact Award', 'ML Conference Speaker'],
      company_name: 'TechStartup Inc',
      location: 'Palo Alto, CA',
      last_activity: '5 hours ago',
      track_reason: 'Potential hire - ML expertise',
      tracked_since: '2024-02-20'
    }
  ]

  const applyFilters = () => {
    let filtered = persons

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(person => 
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.expertise_areas?.some(area => 
          area.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(person => 
        person.primary_role?.toLowerCase().includes(filterRole.toLowerCase())
      )
    }

    // Tracked filter
    if (filterTracked !== 'all') {
      filtered = filtered.filter(person => 
        filterTracked === 'tracked' ? person.is_tracked : !person.is_tracked
      )
    }

    // Founder filter
    if (filterFounder !== 'all') {
      filtered = filtered.filter(person => 
        filterFounder === 'founder' ? person.is_founder : !person.is_founder
      )
    }

    setFilteredPersons(filtered)
  }

  const handleTrackPerson = async (personId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/v1/persons/${personId}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'Added from talent page' })
      })
      
      if (response.ok) {
        setPersons(prev => prev.map(p => 
          p.id === personId ? { 
            ...p, 
            is_tracked: true,
            track_reason: reason || 'Added from talent page',
            tracked_since: new Date().toISOString().split('T')[0]
          } : p
        ))
      }
    } catch (error) {
      console.error('Error tracking person:', error)
    }
  }

  const handleUntrackPerson = async (personId: string) => {
    try {
      const response = await fetch(`/api/v1/persons/${personId}/track`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setPersons(prev => prev.map(p => 
          p.id === personId ? { 
            ...p, 
            is_tracked: false,
            track_reason: undefined,
            tracked_since: undefined
          } : p
        ))
      }
    } catch (error) {
      console.error('Error untracking person:', error)
    }
  }

  const getSignalBadge = (strength?: number) => {
    if (!strength) return null
    
    if (strength > 90) {
      return <Badge className="bg-red-500 text-white">🔥 Hot</Badge>
    } else if (strength > 80) {
      return <Badge className="bg-orange-500 text-white">Strong</Badge>
    } else if (strength > 60) {
      return <Badge className="bg-yellow-500 text-white">Active</Badge>
    }
    return <Badge variant="secondary">Monitoring</Badge>
  }

  const trackedCount = persons.filter(p => p.is_tracked).length
  const founderCount = persons.filter(p => p.is_founder).length

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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
          <Users className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Talent Network</h1>
        </div>
        <p className="text-muted-foreground">
          Track and monitor key talent across your portfolio and industry
        </p>
        
        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium">{trackedCount} Tracked</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium">{founderCount} Founders</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium">{persons.length} Total</span>
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
                  placeholder="Search by name, company, expertise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="ceo">CEO</SelectItem>
                  <SelectItem value="cto">CTO</SelectItem>
                  <SelectItem value="founder">Founder</SelectItem>
                  <SelectItem value="vp">VP</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTracked} onValueChange={setFilterTracked}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tracking" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="tracked">Tracked</SelectItem>
                  <SelectItem value="untracked">Not Tracked</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterFounder} onValueChange={setFilterFounder}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="founder">Founders</SelectItem>
                  <SelectItem value="employee">Employees</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="border rounded-lg p-1 flex bg-background">
                <Button
                  variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="h-8 px-3"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 px-3"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPersons.map((person) => (
            <Card key={person.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt={person.name} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {person.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{person.name}</h3>
                      <p className="text-sm text-muted-foreground">{person.title}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {person.is_founder && (
                      <Badge variant="outline" className="text-xs">Founder</Badge>
                    )}
                    {getSignalBadge(person.signal_strength)}
                  </div>
                </div>

                {person.company_name && (
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{person.company_name}</span>
                  </div>
                )}

                {person.location && (
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{person.location}</span>
                  </div>
                )}

                {person.bio && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {person.bio}
                  </p>
                )}

                {person.expertise_areas && person.expertise_areas.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {person.expertise_areas.slice(0, 3).map((area) => (
                      <Badge key={area} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {person.linkedin_url && (
                      <a 
                        href={person.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {person.twitter_handle && (
                      <a 
                        href={`https://twitter.com/${person.twitter_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                    {person.github_username && (
                      <a
                        href={`https://github.com/${person.github_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {person.email && (
                      <a
                        href={`mailto:${person.email}`}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {person.is_tracked ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUntrackPerson(person.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Tracking
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTrackPerson(person.id)}
                    >
                      <Target className="w-4 h-4 mr-1" />
                      Track
                    </Button>
                  )}
                </div>

                {person.is_tracked && person.track_reason && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="w-3 h-3" />
                      <span>Tracking: {person.track_reason}</span>
                    </div>
                    {person.last_activity && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Last activity: {person.last_activity}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Person</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expertise</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead>Links</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPersons.map((person) => (
                  <TableRow key={person.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          {person.avatar_url ? (
                            <img src={person.avatar_url} alt={person.name} />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                              {person.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium">{person.name}</div>
                          {person.location && (
                            <div className="text-xs text-muted-foreground truncate">
                              {person.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{person.company_name || '-'}</span>
                        {person.is_founder && (
                          <Badge variant="outline" className="text-xs ml-2">Founder</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{person.title || person.primary_role || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-48">
                        {person.expertise_areas?.slice(0, 2).map((area) => (
                          <Badge key={area} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        )) || '-'}
                        {person.expertise_areas && person.expertise_areas.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{person.expertise_areas.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSignalBadge(person.signal_strength)}
                        {person.is_tracked && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <Eye className="w-3 h-3" />
                            Tracked
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {person.linkedin_url && (
                          <a 
                            href={person.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                        {person.twitter_handle && (
                          <a 
                            href={`https://twitter.com/${person.twitter_handle.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Twitter className="w-4 h-4" />
                          </a>
                        )}
                        {person.github_username && (
                          <a
                            href={`https://github.com/${person.github_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Github className="w-4 h-4" />
                          </a>
                        )}
                        {person.email && (
                          <a
                            href={`mailto:${person.email}`}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {person.is_tracked ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUntrackPerson(person.id)}
                          className="text-green-600 hover:text-green-700 h-8"
                        >
                          <EyeOff className="w-4 h-4 mr-1" />
                          Untrack
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTrackPerson(person.id)}
                          className="h-8"
                        >
                          <Target className="w-4 h-4 mr-1" />
                          Track
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {filteredPersons.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No talent found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterRole !== 'all' || filterTracked !== 'all' || filterFounder !== 'all'
                ? 'Try adjusting your search and filters'
                : 'No talent profiles available yet'
              }
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Talent
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}