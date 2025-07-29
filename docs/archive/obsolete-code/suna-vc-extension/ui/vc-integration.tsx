// VC UI Integration for Suna
// This shows how to add VC features to Suna's existing UI

import React from 'react'

// Example: Add VC menu items to Suna's navigation
export const VCNavigationItems = [
  {
    label: 'Deal Pipeline',
    href: '/vc/pipeline',
    icon: 'chart-bar',
    description: 'Manage investment opportunities'
  },
  {
    label: 'Portfolio',
    href: '/vc/portfolio', 
    icon: 'briefcase',
    description: 'Track portfolio companies'
  },
  {
    label: 'LP Reports',
    href: '/vc/reports',
    icon: 'document-report',
    description: 'Generate investor updates'
  },
  {
    label: 'VC Analytics',
    href: '/vc/analytics',
    icon: 'chart-pie',
    description: 'Investment performance metrics'
  }
]

// Example: VC-specific chat prompts for Suna's AI
export const VCChatPrompts = [
  {
    category: 'Due Diligence',
    prompts: [
      'Analyze [Company] for Series A investment',
      'Compare [Company] with competitors in [Sector]',
      'Research founding team of [Company]',
      'What are the key risks investing in [Company]?'
    ]
  },
  {
    category: 'Portfolio Management',
    prompts: [
      'Generate monthly portfolio update',
      'Which portfolio companies have news this week?',
      'Track metrics for [Portfolio Company]',
      'Alert me to significant portfolio changes'
    ]
  },
  {
    category: 'Market Research',
    prompts: [
      'What are the hot sectors for VC investment?',
      'Analyze trends in [Sector] startups',
      'Find recent funding rounds in [Industry]',
      'Who are the active VCs in [Sector]?'
    ]
  }
]

// Example: VC Dashboard Component that uses Suna's auth/data
export function VCDashboard({ sunaUser, sunaClient }) {
  // This component would be added to Suna's pages
  return (
    <div className="vc-dashboard">
      <h1>VC Command Center</h1>
      
      {/* Use Suna's existing components */}
      <SunaChat 
        initialPrompt="What's new with my portfolio companies today?"
        customTools={['vc_deal_analyzer', 'portfolio_monitor']}
      />
      
      {/* Add VC-specific widgets */}
      <div className="vc-widgets">
        <DealPipelineWidget />
        <PortfolioPerformanceWidget />
        <UpcomingMeetingsWidget />
      </div>
      
      {/* Integrate with Suna's workflow system */}
      <SunaWorkflowTrigger
        workflow="daily_portfolio_update"
        schedule="9am daily"
      />
    </div>
  )
}

// Example: How to call our custom VC tools from UI
export async function analyzeNewDeal(companyName: string, sunaClient: any) {
  const result = await sunaClient.callTool('vc_deal_analyzer', {
    company_name: companyName,
    sector: 'fintech',
    stage: 'series-a'
  })
  
  return result
}

// Example: Custom VC workflow trigger
export const vcWorkflows = {
  weeklyPortfolioUpdate: {
    name: 'Weekly Portfolio Update',
    description: 'Analyze all portfolio companies and generate LP update',
    trigger: 'schedule:monday-9am',
    steps: [
      { tool: 'portfolio_monitor', params: { action: 'get_all' } },
      { tool: 'web_search', params: { query: '$company news this week' } },
      { tool: 'ai_chat', params: { prompt: 'Summarize portfolio updates' } },
      { tool: 'document_create', params: { template: 'lp_update' } }
    ]
  },
  
  newDealAlert: {
    name: 'New Deal Alert',
    description: 'Alert partners about promising new deals',
    trigger: 'webhook:/api/new-deal',
    steps: [
      { tool: 'vc_deal_analyzer', params: { company_name: '$company' } },
      { tool: 'ai_chat', params: { prompt: 'Should we take this deal to partners?' } },
      { tool: 'email_send', params: { to: 'partners@vcfirm.com' } }
    ]
  }
}