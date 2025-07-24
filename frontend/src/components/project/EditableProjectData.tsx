'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Edit3,
  Save,
  X,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  Building,
  Globe,
  Plus,
  Trash2
} from 'lucide-react'

interface ProjectData {
  id: string
  company_name: string
  description: string
  website: string
  founded: string
  team_size: string
  valuation: string
  round_size: string
  sector: string
  stage: string
  previous_funding: string
  investors: string[]
  key_metrics: Record<string, string>
}

interface EditableProjectDataProps {
  projectData: ProjectData
  onSave: (updatedData: ProjectData) => void
}

export function EditableProjectData({ projectData, onSave }: EditableProjectDataProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<ProjectData>(projectData)
  const [newInvestor, setNewInvestor] = useState('')
  const [newMetricKey, setNewMetricKey] = useState('')
  const [newMetricValue, setNewMetricValue] = useState('')

  const handleSave = () => {
    onSave(editedData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedData(projectData)
    setIsEditing(false)
    setNewInvestor('')
    setNewMetricKey('')
    setNewMetricValue('')
  }

  const addInvestor = () => {
    if (newInvestor.trim()) {
      setEditedData(prev => ({
        ...prev,
        investors: [...prev.investors, newInvestor.trim()]
      }))
      setNewInvestor('')
    }
  }

  const removeInvestor = (index: number) => {
    setEditedData(prev => ({
      ...prev,
      investors: prev.investors.filter((_, i) => i !== index)
    }))
  }

  const addMetric = () => {
    if (newMetricKey.trim() && newMetricValue.trim()) {
      setEditedData(prev => ({
        ...prev,
        key_metrics: {
          ...prev.key_metrics,
          [newMetricKey.trim()]: newMetricValue.trim()
        }
      }))
      setNewMetricKey('')
      setNewMetricValue('')
    }
  }

  const removeMetric = (key: string) => {
    setEditedData(prev => {
      const { [key]: removed, ...rest } = prev.key_metrics
      return { ...prev, key_metrics: rest }
    })
  }

  const updateMetric = (key: string, value: string) => {
    setEditedData(prev => ({
      ...prev,
      key_metrics: {
        ...prev.key_metrics,
        [key]: value
      }
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Project Information</h2>
        {!isEditing ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </Button>
        ) : (
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCancel}
              className="flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="redpill-button-primary flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </Button>
          </div>
        )}
      </div>

      {/* Basic Information */}
      <Card className="redpill-card">
        <CardHeader>
          <CardTitle className="text-white">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Company Name
              </label>
              {isEditing ? (
                <Input
                  value={editedData.company_name}
                  onChange={(e) => setEditedData(prev => ({ ...prev, company_name: e.target.value }))}
                  className="bg-dark-700 border-dark-600 text-white"
                />
              ) : (
                <p className="text-white">{projectData.company_name}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Website
              </label>
              {isEditing ? (
                <Input
                  value={editedData.website}
                  onChange={(e) => setEditedData(prev => ({ ...prev, website: e.target.value }))}
                  className="bg-dark-700 border-dark-600 text-white"
                />
              ) : (
                <a href={`https://${projectData.website}`} target="_blank" rel="noopener noreferrer" 
                   className="text-redpill-400 hover:text-redpill-300 flex items-center space-x-1">
                  <Globe className="w-4 h-4" />
                  <span>{projectData.website}</span>
                </a>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Founded
              </label>
              {isEditing ? (
                <Input
                  value={editedData.founded}
                  onChange={(e) => setEditedData(prev => ({ ...prev, founded: e.target.value }))}
                  className="bg-dark-700 border-dark-600 text-white"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{projectData.founded}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Sector
              </label>
              {isEditing ? (
                <Input
                  value={editedData.sector}
                  onChange={(e) => setEditedData(prev => ({ ...prev, sector: e.target.value }))}
                  className="bg-dark-700 border-dark-600 text-white"
                />
              ) : (
                <Badge variant="secondary">{projectData.sector}</Badge>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Description
            </label>
            {isEditing ? (
              <Textarea
                value={editedData.description}
                onChange={(e) => setEditedData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-dark-700 border-dark-600 text-white"
                rows={3}
              />
            ) : (
              <p className="text-white">{projectData.description}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Information */}
      <Card className="redpill-card">
        <CardHeader>
          <CardTitle className="text-white">Financial Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Current Round Size
              </label>
              {isEditing ? (
                <Input
                  value={editedData.round_size}
                  onChange={(e) => setEditedData(prev => ({ ...prev, round_size: e.target.value }))}
                  className="bg-dark-700 border-dark-600 text-white"
                  placeholder="e.g., $120M"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-white font-semibold">{projectData.round_size}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Valuation
              </label>
              {isEditing ? (
                <Input
                  value={editedData.valuation}
                  onChange={(e) => setEditedData(prev => ({ ...prev, valuation: e.target.value }))}
                  className="bg-dark-700 border-dark-600 text-white"
                  placeholder="e.g., $3B"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-white font-semibold">{projectData.valuation}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Team Size
              </label>
              {isEditing ? (
                <Input
                  value={editedData.team_size}
                  onChange={(e) => setEditedData(prev => ({ ...prev, team_size: e.target.value }))}
                  className="bg-dark-700 border-dark-600 text-white"
                  placeholder="e.g., 45+"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-white font-semibold">{projectData.team_size}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Stage
              </label>
              {isEditing ? (
                <Input
                  value={editedData.stage}
                  onChange={(e) => setEditedData(prev => ({ ...prev, stage: e.target.value }))}
                  className="bg-dark-700 border-dark-600 text-white"
                  placeholder="e.g., Series B"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{projectData.stage}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Previous Funding
              </label>
              {isEditing ? (
                <Input
                  value={editedData.previous_funding}
                  onChange={(e) => setEditedData(prev => ({ ...prev, previous_funding: e.target.value }))}
                  className="bg-dark-700 border-dark-600 text-white"
                  placeholder="e.g., $293M"
                />
              ) : (
                <span className="text-white">{projectData.previous_funding}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investors */}
      <Card className="redpill-card">
        <CardHeader>
          <CardTitle className="text-white">Investors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {editedData.investors.map((investor, index) => (
              <div key={index} className="flex items-center space-x-1">
                <Badge variant="outline" className="bg-dark-700 border-dark-600">
                  {investor}
                </Badge>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInvestor(index)}
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {isEditing && (
            <div className="flex items-center space-x-2">
              <Input
                value={newInvestor}
                onChange={(e) => setNewInvestor(e.target.value)}
                placeholder="Add investor..."
                className="bg-dark-700 border-dark-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && addInvestor()}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={addInvestor}
                className="flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card className="redpill-card">
        <CardHeader>
          <CardTitle className="text-white">Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {Object.entries(editedData.key_metrics).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                <div className="flex items-center space-x-3 flex-1">
                  <span className="text-gray-400 capitalize min-w-0 flex-1">
                    {key.replace('_', ' ')}
                  </span>
                  {isEditing ? (
                    <Input
                      value={value}
                      onChange={(e) => updateMetric(key, e.target.value)}
                      className="bg-dark-600 border-dark-500 text-white max-w-xs"
                    />
                  ) : (
                    <span className="text-white font-medium">{value}</span>
                  )}
                </div>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMetric(key)}
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {isEditing && (
            <div className="flex items-center space-x-2">
              <Input
                value={newMetricKey}
                onChange={(e) => setNewMetricKey(e.target.value)}
                placeholder="Metric name..."
                className="bg-dark-700 border-dark-600 text-white"
              />
              <Input
                value={newMetricValue}
                onChange={(e) => setNewMetricValue(e.target.value)}
                placeholder="Value..."
                className="bg-dark-700 border-dark-600 text-white"
                onKeyPress={(e) => e.key === 'Enter' && addMetric()}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={addMetric}
                className="flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}