'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ChartViewerContent() {
  const searchParams = useSearchParams()
  const chartUrl = searchParams.get('url')

  if (!chartUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chart Viewer</h1>
          <p className="text-gray-400">No chart URL provided</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">📊 RedPill Chart Viewer</h1>
          <div className="flex space-x-4">
            <button 
              onClick={() => window.history.back()}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm"
            >
              ← Back
            </button>
            <button 
              onClick={() => window.open(chartUrl, '_blank')}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm"
            >
              Open in New Tab
            </button>
          </div>
        </div>
      </div>

      {/* Chart Display */}
      <div className="h-full">
        <iframe
          src={chartUrl}
          className="w-full h-full border-0"
          title="Interactive Chart"
          style={{ height: 'calc(100vh - 60px)' }}
        />
      </div>
    </div>
  )
}

export default function ChartViewer() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <ChartViewerContent />
    </Suspense>
  )
}