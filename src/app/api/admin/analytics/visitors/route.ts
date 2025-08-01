import { NextResponse } from 'next/server'
import { visitorTracker } from '@/lib/visitor-tracker'

export async function GET() {
  try {
    const stats = visitorTracker.getStats()
    
    // Get page-specific breakdowns
    const homeVisitors = visitorTracker.getActiveSessionsByPage('home')
    const signupVisitors = visitorTracker.getActiveSessionsByPage('signup')
    
    const responseData = {
      totalVisitors: stats.totalVisitors,
      activeVisitors: stats.activeVisitors,
      todayVisitors: stats.todayVisitors,
      avgSessionDuration: stats.avgSessionDuration,
      pageBreakdown: {
        home: homeVisitors,
        signup: signupVisitors,
        ...stats.pageBreakdown
      }
    }
    
    console.log('Real visitor stats:', responseData)
    
    return NextResponse.json(responseData)
    
  } catch (error) {
    console.error('Error fetching real visitor stats:', error)
    
    // Fallback data
    return NextResponse.json({
      totalVisitors: 0,
      activeVisitors: 0,
      todayVisitors: 0,
      avgSessionDuration: 0,
      pageBreakdown: {
        home: 0,
        signup: 0
      }
    })
  }
}