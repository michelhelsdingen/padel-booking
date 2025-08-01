import { NextRequest, NextResponse } from 'next/server'
import { visitorTracker } from '@/lib/visitor-tracker'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { page, sessionId } = body
    const userAgent = request.headers.get('user-agent') || undefined

    if (sessionId) {
      // Update existing session
      visitorTracker.updateActivity(sessionId, page)
      return NextResponse.json({ sessionId })
    } else {
      // Create new session
      const newSessionId = visitorTracker.trackVisit(page, userAgent)
      return NextResponse.json({ sessionId: newSessionId })
    }
  } catch (error) {
    console.error('Error tracking visit:', error)
    return NextResponse.json({ error: 'Failed to track visit' }, { status: 500 })
  }
}