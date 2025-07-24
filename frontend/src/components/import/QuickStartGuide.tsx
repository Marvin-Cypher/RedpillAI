'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Upload, 
  Database,
  FileText,
  Zap,
  CheckCircle,
  ArrowRight,
  Download,
  Copy,
  ExternalLink
} from 'lucide-react'

interface QuickStartGuideProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickStartGuide({ isOpen, onClose }: QuickStartGuideProps) {
  const [activeTab, setActiveTab] = useState<'csv' | 'notion' | 'airtable' | 'zapier'>('csv')

  if (!isOpen) return null

  const csvTemplate = `company_name,stage,amount,sector,website,description
"Polygon Labs","Series C","450M","Infrastructure","polygon.technology","Ethereum scaling solution"
"Arbitrum","Series B","120M","Layer 2","arbitrum.io","L2 scaling for Ethereum"
"Chainlink","Series A","32M","Infrastructure","chain.link","Decentralized oracle network"`

  const zapierWorkflows = [
    {
      name: "Airtable → Redpill",
      description: "Sync new records from Airtable base to Redpill pipeline",
      trigger: "New record in Airtable",
      action: "Create project in Redpill"
    },
    {
      name: "Gmail → Redpill", 
      description: "Create projects from pitch deck emails",
      trigger: "Email with attachments",
      action: "Extract company info and create project"
    },
    {
      name: "Notion → Redpill",
      description: "Two-way sync between Notion database and Redpill",
      trigger: "Database item updated",
      action: "Update project status"
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl bg-dark-800 border-dark-600 max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b border-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-white">
                Quick Start: Import Your Deal Flow
              </CardTitle>
              <p className="text-gray-400 text-sm mt-1">
                Get your existing pipeline into Redpill in minutes
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-dark-700 p-1 rounded-lg">
            {[
              { id: 'csv', label: 'CSV Import', icon: Upload },
              { id: 'notion', label: 'Notion', icon: FileText },
              { id: 'airtable', label: 'Airtable', icon: Database },
              { id: 'zapier', label: 'Zapier', icon: Zap }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-redpill-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-dark-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* CSV Import Tab */}
          {activeTab === 'csv' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">1. Download Template</h3>
                  <Card className="border-dark-600 bg-dark-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-white">CSV Template</p>
                          <p className="text-sm text-gray-400">Standard format for deal import</p>
                        </div>
                        <Button size="sm" variant="secondary">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <div className="bg-dark-800 rounded p-3 text-xs text-gray-300 font-mono overflow-x-auto">
                        <pre>{csvTemplate}</pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-4">2. What We Auto-Enrich</h3>
                  <div className="space-y-3">
                    {[
                      { icon: '🏢', title: 'Company Data', desc: 'Logo, description, team size' },
                      { icon: '💰', title: 'Funding History', desc: 'Previous rounds, investors' },
                      { icon: '🌐', title: 'Web Presence', desc: 'Social media, GitHub, metrics' },
                      { icon: '📊', title: 'Market Data', desc: 'Competitor analysis, sector trends' },
                      { icon: '🔗', title: 'Connections', desc: 'Mutual connections, warm intros' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-dark-700 rounded-lg">
                        <span className="text-lg">{item.icon}</span>
                        <div>
                          <p className="font-medium text-white text-sm">{item.title}</p>
                          <p className="text-xs text-gray-400">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-400 mb-1">Pro Tip</p>
                    <p className="text-sm text-gray-300">
                      Our AI will automatically match your companies against our database of 50,000+ crypto/web3 companies 
                      and enrich with market data, funding history, and team information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notion Tab */}
          {activeTab === 'notion' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Connect Your Notion Database</h3>
                  <Card className="border-dark-600 bg-dark-700">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-8 h-8 text-gray-300" />
                        </div>
                        <h4 className="font-medium text-white mb-2">Two-Way Sync</h4>
                        <p className="text-sm text-gray-400 mb-4">
                          Changes in Notion automatically update Redpill and vice versa
                        </p>
                        <Button className="redpill-button-primary w-full">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Connect Notion
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-white mb-4">Required Properties</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'Company Name', type: 'Title', required: true },
                      { name: 'Stage', type: 'Select', required: true },
                      { name: 'Status', type: 'Select', required: false },
                      { name: 'Amount', type: 'Number', required: false },
                      { name: 'Sector', type: 'Multi-select', required: false },
                      { name: 'Notes', type: 'Rich Text', required: false }
                    ].map((prop, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-dark-700 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-white">{prop.name}</span>
                          {prop.required && (
                            <Badge variant="outline" className="text-xs bg-red-900/30 border-red-700 text-red-400">
                              Required
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{prop.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Airtable Tab */}
          {activeTab === 'airtable' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Database className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Airtable Integration</h3>
                <p className="text-gray-400 mb-6">
                  Import your existing deal flow and maintain two-way sync
                </p>
                <Button className="redpill-button-primary">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect Airtable Base
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { step: '1', title: 'Connect Base', desc: 'Link your Airtable base with deal data' },
                  { step: '2', title: 'Map Fields', desc: 'We auto-map common fields like company, stage, amount' },
                  { step: '3', title: 'Sync Data', desc: 'Import existing records and enable real-time sync' }
                ].map((item, index) => (
                  <Card key={index} className="border-dark-600 bg-dark-700">
                    <CardContent className="p-4 text-center">
                      <div className="w-8 h-8 bg-redpill-600 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold">
                        {item.step}
                      </div>
                      <h4 className="font-medium text-white mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Zapier Tab */}
          {activeTab === 'zapier' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Zapier Automation</h3>
                <p className="text-gray-400 mb-6">
                  Connect Redpill with 5,000+ apps using pre-built workflows
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-white">Popular Workflows</h4>
                {zapierWorkflows.map((workflow, index) => (
                  <Card key={index} className="border-dark-600 bg-dark-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-white mb-1">{workflow.name}</h5>
                          <p className="text-sm text-gray-400 mb-2">{workflow.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Trigger: {workflow.trigger}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span>Action: {workflow.action}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="secondary">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Setup
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Zap className="w-5 h-5 text-orange-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-400 mb-1">Coming Soon</p>
                    <p className="text-sm text-gray-300">
                      We're building native Zapier integration. For now, use our API or webhooks to connect with your existing tools.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-dark-700">
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>AI auto-enrichment</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Real-time sync</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Secure & private</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button className="redpill-button-primary">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}