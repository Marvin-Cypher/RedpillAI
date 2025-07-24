'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, TrendingUp, Rocket, DollarSign } from 'lucide-react'

export function StatsCards() {
  const stats = [
    {
      title: '🎯 ACTIVE DEALS',
      value: '24 companies',
      subtitle: '$2.1B+ pipeline',
      icon: Target,
      trend: null
    },
    {
      title: '📊 PORTFOLIO',
      value: '$485M total',
      subtitle: '+34% returns',
      icon: DollarSign,
      trend: '+34%'
    },
    {
      title: '🚀 THIS MONTH',
      value: '3 new deals',
      subtitle: '2 exits planned',
      icon: Rocket,
      trend: null
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="redpill-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-white mb-1">
                  {stat.value}
                </p>
                <p className={`text-sm ${
                  stat.trend 
                    ? 'text-green-400' 
                    : 'text-gray-400'
                }`}>
                  {stat.subtitle}
                </p>
              </div>
              {stat.icon && (
                <stat.icon className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}