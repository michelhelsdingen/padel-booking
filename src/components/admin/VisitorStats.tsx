'use client'

import { useState, useEffect } from 'react'
import { Users, Eye, TrendingUp, Clock } from 'lucide-react'

interface VisitorData {
  totalVisitors: number
  activeVisitors: number
  todayVisitors: number
  avgSessionDuration: number
}

export default function VisitorStats() {
  const [visitorData, setVisitorData] = useState<VisitorData>({
    totalVisitors: 0,
    activeVisitors: 0,
    todayVisitors: 0,
    avgSessionDuration: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchVisitorStats = async () => {
      try {
        const response = await fetch('/api/admin/analytics/visitors')
        if (response.ok) {
          const data = await response.json()
          setVisitorData(data)
        }
      } catch (error) {
        console.error('Failed to fetch visitor stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVisitorStats()
    
    const interval = setInterval(fetchVisitorStats, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Realtime Visitor Stats</h3>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Realtime Visitor Stats</h3>
        <div className="flex items-center text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          <span className="text-sm">Live</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Active Now</p>
              <p className="text-2xl font-bold text-blue-900">{visitorData.activeVisitors}</p>
            </div>
            <Eye className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Today</p>
              <p className="text-2xl font-bold text-green-900">{visitorData.todayVisitors}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total</p>
              <p className="text-2xl font-bold text-purple-900">{visitorData.totalVisitors.toLocaleString()}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Avg Session</p>
              <p className="text-2xl font-bold text-orange-900">{formatDuration(visitorData.avgSessionDuration)}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>
    </div>
  )
}