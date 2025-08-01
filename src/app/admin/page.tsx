'use client'

import { useState, useEffect } from 'react'
import { Play, BarChart3, Users, Calendar, Mail, Settings, RefreshCw } from 'lucide-react'
import { formatTimeslot, DAYS_OF_WEEK } from '@/lib/utils'

interface Team {
  id: string
  name: string
  contactEmail: string
  memberCount: number
  createdAt: string
  members: Array<{
    name: string
    email: string
  }>
  preferences: Array<{
    priority: number
    timeslot: {
      id: string
      dayOfWeek: number
      startTime: string
      endTime: string
    }
  }>
}

interface LotteryStats {
  totalTeams: number
  assignedTeams: number
  unassignedTeams: number
  assignmentsByRound: Record<number, number>
  assignmentsByDay: Record<number, number>
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'lottery' | 'settings'>('overview')
  const [teams, setTeams] = useState<Team[]>([])
  const [lotteryStats, setLotteryStats] = useState<LotteryStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRunningLottery, setIsRunningLottery] = useState(false)

  useEffect(() => {
    loadTeams()
    loadLotteryStats()
  }, [])

  const loadTeams = async () => {
    try {
      const response = await fetch('/api/admin/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
      }
    } catch (err) {
      console.error('Error loading teams:', err)
    }
  }

  const loadLotteryStats = async () => {
    try {
      const response = await fetch('/api/admin/lottery/stats')
      if (response.ok) {
        const data = await response.json()
        setLotteryStats(data)
      }
    } catch (err) {
      console.error('Error loading lottery stats:', err)
    }
  }

  const runLottery = async () => {
    if (!confirm('Weet je zeker dat je de loting wilt uitvoeren? Dit overschrijft eventuele bestaande toewijzingen.')) {
      return
    }

    setIsRunningLottery(true)
    try {
      const response = await fetch('/api/admin/lottery/run', { method: 'POST' })
      if (response.ok) {
        const result = await response.json()
        alert(`Loting voltooid! ${result.statistics.assignedTeams} teams toegewezen van ${result.statistics.totalTeams} teams.`)
        loadLotteryStats()
      } else {
        const error = await response.json()
        alert(`Fout bij loting: ${error.message}`)
      }
    } catch (error) {
      alert('Er is een fout opgetreden bij de loting')
      console.error('Lottery error:', error)
    } finally {
      setIsRunningLottery(false)
    }
  }

  const sendNotifications = async () => {
    if (!confirm('Weet je zeker dat je alle notificaties wilt versturen?')) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/notifications/send', { method: 'POST' })
      if (response.ok) {
        alert('Notificaties succesvol verstuurd!')
      } else {
        const error = await response.json()
        alert(`Fout bij versturen: ${error.message}`)
      }
    } catch (error) {
      alert('Er is een fout opgetreden bij het versturen van notificaties')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadTeams}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                title="Ververs data"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overzicht', icon: BarChart3 },
              { id: 'teams', label: 'Teams', icon: Users },
              { id: 'lottery', label: 'Loting', icon: Play },
              { id: 'settings', label: 'Instellingen', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'teams' | 'lottery' | 'settings')}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-base font-bold text-gray-900">Totaal Teams</p>
                  <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-base font-bold text-gray-900">Toegewezen</p>
                  <p className="text-2xl font-bold text-gray-900">{lotteryStats?.assignedTeams || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-base font-bold text-gray-900">Niet toegewezen</p>
                  <p className="text-2xl font-bold text-gray-900">{lotteryStats?.unassignedTeams || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-base font-bold text-gray-900">Succesvol %</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {lotteryStats?.totalTeams ? Math.round((lotteryStats.assignedTeams / lotteryStats.totalTeams) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Ingeschreven Teams</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Leden
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Voorkeuren
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Ingeschreven
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teams.map(team => (
                    <tr key={team.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{team.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{team.contactEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{team.memberCount} spelers</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {team.preferences
                            .sort((a, b) => a.priority - b.priority)
                            .map(pref => (
                              <div key={pref.timeslot.id} className="mb-1">
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1">
                                  #{pref.priority}
                                </span>
                                {formatTimeslot(pref.timeslot.dayOfWeek, pref.timeslot.startTime, pref.timeslot.endTime)}
                              </div>
                            ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(team.createdAt).toLocaleDateString('nl-NL')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'lottery' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Loting Beheer</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={runLottery}
                    disabled={isRunningLottery || teams.length === 0}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    <span>{isRunningLottery ? 'Bezig...' : 'Loting Uitvoeren'}</span>
                  </button>
                  <button
                    onClick={sendNotifications}
                    disabled={isLoading || !lotteryStats?.assignedTeams}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span>{isLoading ? 'Versturen...' : 'Notificaties Versturen'}</span>
                  </button>
                </div>
              </div>

              {lotteryStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-3">Toewijzingen per Ronde</h3>
                    <div className="space-y-2">
                      {Object.entries(lotteryStats.assignmentsByRound).map(([round, count]) => (
                        <div key={round} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>Ronde {round === '5' ? 'Extra' : round}</span>
                          <span className="font-medium">{count} teams</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-3">Toewijzingen per Dag</h3>
                    <div className="space-y-2">
                      {Object.entries(lotteryStats.assignmentsByDay).map(([day, count]) => (
                        <div key={day} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>{DAYS_OF_WEEK[parseInt(day) as keyof typeof DAYS_OF_WEEK]}</span>
                          <span className="font-medium">{count} teams</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Instellingen</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Inschrijfperiode</h3>
                <p className="text-base font-medium text-gray-900 mb-4">
                  Beheer wanneer teams zich kunnen inschrijven en wanneer de loting plaatsvindt.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Periode Bewerken
                </button>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">E-mail Templates</h3>
                <p className="text-base font-medium text-gray-900 mb-4">
                  Pas de e-mail templates aan voor bevestigingen en notificaties.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Templates Bewerken
                </button>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Tijdslot Configuratie</h3>
                <p className="text-base font-medium text-gray-900 mb-4">
                  Beheer beschikbare tijdsloten en capaciteit per slot.
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Tijdsloten Bewerken
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}