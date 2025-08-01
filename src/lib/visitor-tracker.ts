// Simple in-memory visitor tracking
interface VisitorSession {
  id: string
  page: string
  startTime: number
  lastActivity: number
  userAgent?: string
}

class VisitorTracker {
  private sessions: Map<string, VisitorSession> = new Map()
  private dailyVisitors: Set<string> = new Set()
  private totalVisitors = 0
  private lastResetDate = new Date().toDateString()

  // Generate a simple session ID
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // Clean up old sessions (older than 30 minutes)
  private cleanupOldSessions() {
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000)
    for (const [sessionId, session] of this.sessions) {
      if (session.lastActivity < thirtyMinutesAgo) {
        this.sessions.delete(sessionId)
      }
    }
  }

  // Reset daily counter if it's a new day
  private checkDailyReset() {
    const today = new Date().toDateString()
    if (this.lastResetDate !== today) {
      this.dailyVisitors.clear()
      this.lastResetDate = today
    }
  }

  // Track a page visit
  trackVisit(page: string, userAgent?: string): string {
    this.cleanupOldSessions()
    this.checkDailyReset()

    const sessionId = this.generateSessionId()
    const now = Date.now()

    // Create new session
    this.sessions.set(sessionId, {
      id: sessionId,
      page,
      startTime: now,
      lastActivity: now,
      userAgent
    })

    // Add to daily visitors
    this.dailyVisitors.add(sessionId)
    this.totalVisitors++

    return sessionId
  }

  // Update session activity
  updateActivity(sessionId: string, newPage?: string) {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.lastActivity = Date.now()
      if (newPage) {
        session.page = newPage
      }
    }
  }

  // Get current stats
  getStats() {
    this.cleanupOldSessions()
    this.checkDailyReset()

    const activeVisitors = this.sessions.size
    const todayVisitors = this.dailyVisitors.size
    
    // Calculate average session duration
    const activeSessions = Array.from(this.sessions.values())
    const avgSessionDuration = activeSessions.length > 0 
      ? Math.round(activeSessions.reduce((acc, session) => 
          acc + (session.lastActivity - session.startTime), 0) / activeSessions.length / 1000)
      : 0

    // Get page breakdown
    const pageBreakdown: Record<string, number> = {}
    activeSessions.forEach(session => {
      pageBreakdown[session.page] = (pageBreakdown[session.page] || 0) + 1
    })

    return {
      totalVisitors: this.totalVisitors,
      activeVisitors,
      todayVisitors,
      avgSessionDuration,
      pageBreakdown
    }
  }

  // Get active sessions by page
  getActiveSessionsByPage(page: string) {
    this.cleanupOldSessions()
    return Array.from(this.sessions.values()).filter(session => session.page === page).length
  }
}

// Export singleton instance
export const visitorTracker = new VisitorTracker()