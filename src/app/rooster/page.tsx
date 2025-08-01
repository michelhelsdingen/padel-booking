'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Users, Mail } from 'lucide-react'
import { formatTimeslot, DAYS_OF_WEEK } from '@/lib/utils'

interface Assignment {
  team: {
    id: string
    name: string
    contactEmail: string
    memberCount: number
  }
  timeslot: {
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
  }
}

interface ScheduleData {
  [key: string]: Assignment[]
}

export default function RoosterPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSchedule()
  }, [])

  const loadSchedule = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/schedule')
      
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      } else {
        setError('Kon rooster niet laden')
      }
    } catch (error) {
      setError('Er is een fout opgetreden')
      console.error('Error loading schedule:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Group assignments by day and time
  const scheduleByDay: ScheduleData = {}
  assignments.forEach(assignment => {
    const key = `${assignment.timeslot.dayOfWeek}-${assignment.timeslot.startTime}`
    if (!scheduleByDay[key]) {
      scheduleByDay[key] = []
    }
    scheduleByDay[key].push(assignment)
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Rooster laden...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
          <div className="text-red-500 mb-4">
            <Calendar className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Fout bij laden rooster</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadSchedule}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">Padelrooster</h1>
                <Link href="/" className="text-blue-600 hover:underline">← Terug naar Home</Link>
              </div>
              
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-600 mb-2">Nog geen rooster beschikbaar</h2>
                <p className="text-gray-500 mb-6">
                  Het rooster wordt gepubliceerd na de loting. Check later terug of schrijf je team in!
                </p>
                <Link 
                  href="/inschrijven"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Team Inschrijven
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold">Padelrooster</h1>
              <Link href="/" className="text-blue-600 hover:underline">← Terug naar Home</Link>
            </div>

            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center text-blue-800">
                <Calendar className="h-5 w-5 mr-2" />
                <span className="font-medium">
                  Rooster voor week {new Date().getWeek()} - Maandag t/m Vrijdag
                </span>
              </div>
            </div>

            <div className="grid gap-6">
              {[1, 2, 3, 4, 5].map(day => (
                <div key={day} className="border rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                    {DAYS_OF_WEEK[day as keyof typeof DAYS_OF_WEEK]}
                  </h2>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {['13:30', '15:30', '17:30', '19:30'].map(startTime => {
                      const key = `${day}-${startTime}`
                      const sessionAssignments = scheduleByDay[key] || []
                      const endTime = startTime === '13:30' ? '15:30' : 
                                     startTime === '15:30' ? '17:30' :
                                     startTime === '17:30' ? '19:30' : '21:30'

                      return (
                        <div key={startTime} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <Clock className="h-4 w-4 mr-2 text-gray-600" />
                            <span className="font-medium text-gray-800">
                              {startTime} - {endTime}
                            </span>
                          </div>

                          {sessionAssignments.length > 0 ? (
                            <div className="space-y-2">
                              {sessionAssignments.map(assignment => (
                                <div 
                                  key={assignment.team.id}
                                  className="bg-white p-3 rounded border border-green-200 hover:border-green-400 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h4 className="font-medium text-green-800">
                                        {assignment.team.name}
                                      </h4>
                                      <div className="flex items-center text-sm text-gray-600 mt-1">
                                        <Users className="h-3 w-3 mr-1" />
                                        <span>{assignment.team.memberCount} spelers</span>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="flex items-center text-xs text-gray-500">
                                        <Mail className="h-3 w-3 mr-1" />
                                        <span className="truncate max-w-[100px]">
                                          {assignment.team.contactEmail}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              <div className="text-sm">Geen teams toegewezen</div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Belangrijk</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Zorg dat je op tijd bent voor je training</li>
                    <li>• Bij wijzigingen neem je contact op met de beheerder</li>
                    <li>• Materiaal kun je ter plaatse huren indien beschikbaar</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get week number (if not available in Date prototype)
declare global {
  interface Date {
    getWeek(): number
  }
}

Date.prototype.getWeek = function() {
  const date = new Date(this.getTime())
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7)
  const week1 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}