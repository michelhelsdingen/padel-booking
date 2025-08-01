'use client'

import { useEffect, useState } from 'react'

interface VisitorTrackerProps {
  page: string
}

export default function VisitorTracker({ page }: VisitorTrackerProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const trackVisit = async () => {
      try {
        const response = await fetch('/api/track-visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page,
            sessionId: sessionId
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (!sessionId) {
            setSessionId(data.sessionId)
            // Store session ID in sessionStorage to persist across page reloads
            sessionStorage.setItem('visitorSessionId', data.sessionId)
          }
        }
      } catch (error) {
        console.error('Failed to track visit:', error)
      }
    }

    // Get existing session ID from sessionStorage
    const existingSessionId = sessionStorage.getItem('visitorSessionId')
    if (existingSessionId && !sessionId) {
      setSessionId(existingSessionId)
    }

    // Track initial visit
    trackVisit()

    // Update activity every 30 seconds
    const interval = setInterval(trackVisit, 30000)

    return () => clearInterval(interval)
  }, [page, sessionId])

  // This component renders nothing, it just tracks visits
  return null
}