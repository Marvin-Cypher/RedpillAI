'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'

export default function ChartViewerPage() {
  const params = useParams()
  const router = useRouter()
  const [chartContent, setChartContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filename = params.filename as string

  useEffect(() => {
    loadChart()
  }, [filename])

  const loadChart = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/charts/${filename}`)
      if (!response.ok) {
        throw new Error(`Chart not found: ${filename}`)
      }
      const content = await response.text()
      setChartContent(content)
    } catch (err) {
      console.error('❌ Failed to load chart:', err)
      setError(err instanceof Error ? err.message : 'Failed to load chart')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading chart...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4 text-4xl">📊</div>
          <h1 className="text-xl font-semibold text-gray-200 mb-2">Chart Not Found</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-blue-400 hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen bg-black"
      dangerouslySetInnerHTML={{ __html: chartContent }}
    />
  )
}