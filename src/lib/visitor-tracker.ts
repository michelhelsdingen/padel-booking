import { supabaseAdmin } from './supabase'

// Supabase-based visitor tracking
class VisitorTracker {
  // Generate a simple session ID
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // Clean up old sessions (older than 30 minutes)
  private async cleanupOldSessions() {
    const thirtyMinutesAgo = new Date(Date.now() - (30 * 60 * 1000)).toISOString()
    
    await supabaseAdmin
      .from('visitor_sessions')
      .delete()
      .lt('last_activity', thirtyMinutesAgo)
  }

  // Track a page visit
  async trackVisit(page: string, userAgent?: string): Promise<string> {
    await this.cleanupOldSessions()

    const sessionId = this.generateSessionId()
    const now = new Date().toISOString()

    // Create new session
    const { error } = await supabaseAdmin
      .from('visitor_sessions')
      .insert({
        session_id: sessionId,
        page,
        start_time: now,
        last_activity: now,
        user_agent: userAgent
      })

    if (error) {
      console.error('Error creating visitor session:', error)
      return sessionId // Return sessionId even if DB fails
    }

    // Update daily stats
    await this.updateDailyStats()

    return sessionId
  }

  // Update session activity
  async updateActivity(sessionId: string, newPage?: string) {
    const updates: { last_activity: string; page?: string } = {
      last_activity: new Date().toISOString()
    }
    
    if (newPage) {
      updates.page = newPage
    }

    await supabaseAdmin
      .from('visitor_sessions')
      .update(updates)
      .eq('session_id', sessionId)
  }

  // Update daily visitor stats
  private async updateDailyStats() {
    const today = new Date().toISOString().split('T')[0]
    
    // Get today's unique visitors
    const { count: uniqueVisitors } = await supabaseAdmin
      .from('visitor_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('start_time', `${today}T00:00:00Z`)
      .lt('start_time', `${today}T23:59:59Z`)

    // Upsert daily stats
    await supabaseAdmin
      .from('visitor_stats')
      .upsert({
        date: today,
        unique_visitors: uniqueVisitors || 0,
        total_visitors: uniqueVisitors || 0, // For now, same as unique
        updated_at: new Date().toISOString()
      })
  }

  // Get current stats
  async getStats() {
    await this.cleanupOldSessions()

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Get active sessions
    const { data: activeSessions, count: activeVisitors } = await supabaseAdmin
      .from('visitor_sessions')
      .select('*', { count: 'exact' })
      .gte('last_activity', new Date(Date.now() - (30 * 60 * 1000)).toISOString())

    // Get today's visitors
    const { count: todayVisitors } = await supabaseAdmin
      .from('visitor_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('start_time', `${today}T00:00:00Z`)
      .lt('start_time', `${today}T23:59:59Z`)

    // Get total visitors from stats table
    const { data: totalStats } = await supabaseAdmin
      .from('visitor_stats')
      .select('total_visitors')
      .order('date', { ascending: false })
      .limit(1)

    // Calculate average session duration
    const avgSessionDuration = activeSessions && activeSessions.length > 0
      ? Math.round(activeSessions.reduce((acc, session) => {
          const duration = new Date(session.last_activity).getTime() - new Date(session.start_time).getTime()
          return acc + duration
        }, 0) / activeSessions.length / 1000)
      : 0

    // Get page breakdown
    const pageBreakdown: Record<string, number> = {}
    if (activeSessions) {
      activeSessions.forEach(session => {
        pageBreakdown[session.page] = (pageBreakdown[session.page] || 0) + 1
      })
    }

    return {
      totalVisitors: totalStats?.[0]?.total_visitors || 0,
      activeVisitors: activeVisitors || 0,
      todayVisitors: todayVisitors || 0,
      avgSessionDuration,
      pageBreakdown
    }
  }

  // Get active sessions by page
  async getActiveSessionsByPage(page: string): Promise<number> {
    await this.cleanupOldSessions()
    
    const { count } = await supabaseAdmin
      .from('visitor_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('page', page)
      .gte('last_activity', new Date(Date.now() - (30 * 60 * 1000)).toISOString())

    return count || 0
  }
}

// Export singleton instance
export const visitorTracker = new VisitorTracker()