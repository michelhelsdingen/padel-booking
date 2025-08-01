'use client'

import { useState, useEffect } from 'react'

// Type definitions
interface LotteryStatistics {
  totalTeams: number
  assignedTeams: number
  unassignedTeams: number
  assignmentsByMethod: Record<string, number>
  assignmentsByDay: Record<number, number>
  timeslotUtilization: Record<string, { assigned: number; capacity: number; utilization: number }>
  emailStats: { sent: number; pending: number }
}

interface TeamInfo {
  id: string
  firstName: string
  lastName: string
  contactEmail: string
  memberCount: number
}

interface TimeslotInfo {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  maxTeams: number
}

interface AssignmentInfo {
  id: string
  teamId: string
  timeslotId: string
  assignedAt: string
  lotteryRound: number
  assignmentmethod: string
  emailsent: boolean
  emailsentat: string | null
  priority: number
  teams: TeamInfo
  timeslots: TimeslotInfo
}

interface TimeslotDetail {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  maxTeams: number
  assignedTeams: Array<{
    id: string
    firstName: string
    lastName: string
    contactEmail: string
    memberCount: number
    assignmentMethod: string
    priority: number
    emailSent: boolean
    emailSentAt: string | null
  }>
}

interface UnassignedTeam {
  id: string
  firstName: string
  lastName: string
  contactEmail: string
  reason: string
}

interface LotteryResults {
  assignments: AssignmentInfo[]
  unassignedTeams: UnassignedTeam[]
  statistics: LotteryStatistics
  timeslotDetails: TimeslotDetail[]
  hasResults: boolean
}
import { Play, BarChart3, Users, Calendar, Mail, Settings, RefreshCw, Trash2, UserPlus } from 'lucide-react'
import { formatTimeslot, DAYS_OF_WEEK } from '@/lib/utils'
import VisitorStats from '@/components/admin/VisitorStats'

interface Team {
  id: string
  firstName: string
  lastName: string
  contactEmail: string
  memberCount: number
  createdAt: string
  members: Array<{
    firstName: string
    lastName: string
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
  assignments?: Array<{
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
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'lottery' | 'timeslots' | 'settings'>('overview')
  const [teams, setTeams] = useState<Team[]>([])
  const [lotteryStats, setLotteryStats] = useState<LotteryStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRunningLottery, setIsRunningLottery] = useState(false)
  const [timeslots, setTimeslots] = useState<Array<{
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    isActive: boolean
    _count: { preferences: number, assignments: number }
  }>>([])
  const [isUpdatingTimeslot, setIsUpdatingTimeslot] = useState(false)
  
  // Modal states
  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showTimeslotConfigModal, setShowTimeslotConfigModal] = useState(false)
  const [showClearTeamsModal, setShowClearTeamsModal] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isGeneratingDummy, setIsGeneratingDummy] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState<{
    show: boolean
    title: string
    message: string
    type: 'success' | 'info'
  }>({
    show: false,
    title: '',
    message: '',
    type: 'success'
  })
  
  const [showLotteryModal, setShowLotteryModal] = useState(false)
  const [lotteryResults, setLotteryResults] = useState<LotteryResults | null>(null)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [selectedTeamsForEmail, setSelectedTeamsForEmail] = useState<string[]>([])
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  const [hasExistingLottery, setHasExistingLottery] = useState(false)
  const [showLotteryWarningModal, setShowLotteryWarningModal] = useState(false)

  useEffect(() => {
    loadTeams()
    loadLotteryStats()
    loadTimeslots()
    loadLotteryResults()
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

  const loadLotteryResults = async () => {
    try {
      const response = await fetch('/api/admin/lottery/results')
      if (response.ok) {
        const data = await response.json()
        setLotteryResults(data)
        setHasExistingLottery(data.hasResults || false)
        return data
      }
    } catch (err) {
      console.error('Error loading lottery results:', err)
    }
    return null
  }

  const handleLotteryClick = () => {
    if (hasExistingLottery) {
      setShowLotteryWarningModal(true)
    } else {
      setShowLotteryModal(true)
    }
  }

  const runLottery = async () => {
    setShowLotteryModal(false)
    setShowLotteryWarningModal(false)
    setIsRunningLottery(true)
    
    try {
      const response = await fetch('/api/admin/lottery/run-optimized', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        const result = data.result
        setShowSuccessModal({
          show: true,
          title: 'Loting Voltooid!',
          message: `De optimale loting is succesvol uitgevoerd. ${result.statistics.assignedTeams} teams zijn toegewezen van ${result.statistics.totalTeams} teams. Je kunt nu de resultaten bekijken en e-mails versturen naar individuele teams of iedereen tegelijk.`,
          type: 'success'
        })
        loadLotteryStats()
        loadLotteryResults() // Refresh lottery results
        loadTeams() // Refresh teams to see assignments
      } else {
        const error = await response.json()
        setShowSuccessModal({
          show: true,
          title: 'Fout bij Loting',
          message: error.details || error.error || 'Er is een onbekende fout opgetreden bij het uitvoeren van de loting.',
          type: 'info'
        })
      }
    } catch (error) {
      console.error('Lottery error:', error)
      setShowSuccessModal({
        show: true,
        title: 'Fout bij Loting',
        message: 'Er is een fout opgetreden bij de loting. Controleer de console voor meer details.',
        type: 'info'
      })
    } finally {
      setIsRunningLottery(false)
    }
  }

  const sendEmailsToTeams = async (teamIds: string[], emailType: string) => {
    setIsSendingEmails(true)
    try {
      const response = await fetch('/api/admin/lottery/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamIds, emailType })
      })

      const result = await response.json()

      if (response.ok) {
        setShowSuccessModal({
          show: true,
          title: 'E-mails Verstuurd',
          message: `${result.results.successCount} e-mails succesvol verstuurd${result.results.errorCount > 0 ? `, ${result.results.errorCount} fouten` : ''}. Teams hebben hun toewijzing of wachtlijst status ontvangen.`,
          type: 'success'
        })
        // Reload results to update email status
        loadLotteryResults()
      } else {
        setShowSuccessModal({
          show: true,
          title: 'Fout bij E-mails',
          message: result.error || 'Er is een fout opgetreden bij het versturen van e-mails.',
          type: 'info'
        })
      }
    } catch (error) {
      console.error('Email sending error:', error)
      setShowSuccessModal({
        show: true,
        title: 'Fout bij E-mails',
        message: 'Er is een fout opgetreden bij het versturen van e-mails.',
        type: 'info'
      })
    } finally {
      setIsSendingEmails(false)
      setSelectedTeamsForEmail([])
    }
  }

  const showLotteryResults = async () => {
    const results = await loadLotteryResults()
    if (results && results.hasResults) {
      setShowResultsModal(true)
    } else {
      setShowSuccessModal({
        show: true,
        title: 'Geen Resultaten',
        message: 'Er zijn nog geen loting resultaten beschikbaar. Voer eerst een loting uit.',
        type: 'info'
      })
    }
  }

  const loadTimeslots = async () => {
    try {
      const response = await fetch('/api/admin/timeslots')
      if (response.ok) {
        const data = await response.json()
        setTimeslots(data)
      }
    } catch (error) {
      console.error('Error loading timeslots:', error)
    }
  }

  const toggleTimeslot = async (timeslotId: string, isActive: boolean) => {
    setIsUpdatingTimeslot(true)
    try {
      const response = await fetch('/api/admin/timeslots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeslotId, isActive })
      })

      if (response.ok) {
        loadTimeslots() // Reload to get updated data
      } else {
        const error = await response.json()
        alert(`Fout: ${error.message}`)
      }
    } catch (error) {
      alert('Er is een fout opgetreden')
      console.error('Error toggling timeslot:', error)
    } finally {
      setIsUpdatingTimeslot(false)
    }
  }

  const sendNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/notifications/send', { method: 'POST' })
      if (response.ok) {
        setShowSuccessModal({
          show: true,
          title: 'Notificaties Verstuurd',
          message: 'Alle notificaties zijn succesvol verstuurd naar de ingeschreven teams. Zij ontvangen hun toewijzingen en eventuele wachtlijst informatie.',
          type: 'success'
        })
      } else {
        const error = await response.json()
        setShowSuccessModal({
          show: true,
          title: 'Fout bij Versturen',
          message: error.message || 'Er is een onbekende fout opgetreden bij het versturen van notificaties.',
          type: 'info'
        })
      }
    } catch (error) {
      console.error('Notification error:', error)
      setShowSuccessModal({
        show: true,
        title: 'Fout bij Versturen',
        message: 'Er is een fout opgetreden bij het versturen van notificaties. Controleer de console voor meer details.',
        type: 'info'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Modal handlers
  const handlePeriodSave = async (periodData: {
    name: string
    registrationStart: string
    registrationEnd: string
    lotteryDate: string
    description: string
  }) => {
    try {
      const response = await fetch('/api/admin/settings/period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(periodData)
      })
      
      if (response.ok) {
        alert('Periode succesvol opgeslagen!')
        setShowPeriodModal(false)
      } else {
        const error = await response.json()
        alert(`Fout: ${error.message}`)
      }
    } catch {
      alert('Er is een fout opgetreden bij het opslaan')
    }
  }

  const handleTemplateSave = async (templateData: {
    confirmation: { subject: string, body: string }
    assignment: { subject: string, body: string }
    waitlist: { subject: string, body: string }
  }) => {
    try {
      const response = await fetch('/api/admin/settings/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      })
      
      if (response.ok) {
        alert('Templates succesvol opgeslagen!')
        setShowTemplateModal(false)
      } else {
        const error = await response.json()
        alert(`Fout: ${error.message}`)
      }
    } catch {
      alert('Er is een fout opgetreden bij het opslaan')
    }
  }

  const handleTimeslotConfigSave = async (configData: {
    maxTeamsPerSlot: number
    timeSlots: Array<{ startTime: string, endTime: string, enabled: boolean }>
    activeDays: Record<number, boolean>
  }) => {
    try {
      const response = await fetch('/api/admin/settings/timeslots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      })
      
      if (response.ok) {
        alert('Tijdslot configuratie succesvol opgeslagen!')
        setShowTimeslotConfigModal(false)
        loadTimeslots() // Refresh timeslots
      } else {
        const error = await response.json()
        alert(`Fout: ${error.message}`)
      }
    } catch {
      alert('Er is een fout opgetreden bij het opslaan')
    }
  }

  const clearAllTeams = async () => {
    setIsClearing(true)
    try {
      const response = await fetch('/api/admin/teams/clear', { method: 'POST' })
      if (response.ok) {
        const result = await response.json()
        setShowClearTeamsModal(false)
        setShowSuccessModal({
          show: true,
          title: 'Teams Succesvol Verwijderd',
          message: `Alle ${result.deletedCount} teams zijn succesvol verwijderd, inclusief alle teamleden, voorkeuren en toewijzingen. Het systeem is nu gereset voor nieuwe inschrijvingen.`,
          type: 'success'
        })
        loadTeams()
        loadLotteryStats()
        loadTimeslots() // Refresh to update preference counts
      } else {
        const error = await response.json()
        alert(`Fout bij verwijderen: ${error.message}`)
      }
    } catch (error) {
      alert('Er is een fout opgetreden bij het verwijderen van teams')
      console.error('Clear teams error:', error)
    } finally {
      setIsClearing(false)
    }
  }

  const generateDummyData = async () => {
    setIsGeneratingDummy(true)
    try {
      const response = await fetch('/api/admin/teams/dummy', { method: 'POST' })
      if (response.ok) {
        const result = await response.json()
        setShowSuccessModal({
          show: true,
          title: 'Dummy Data Aangemaakt',
          message: `${result.createdCount} teams met realistische Nederlandse namen en willekeurige voorkeuren zijn succesvol toegevoegd. Je kunt nu de loting testen!`,
          type: 'success'
        })
        loadTeams()
        loadLotteryStats()
        loadTimeslots() // Refresh to update preference counts
      } else {
        const error = await response.json()
        alert(`Fout bij aanmaken dummy data: ${error.message}`)
      }
    } catch (error) {
      alert('Er is een fout opgetreden bij het aanmaken van dummy data')
      console.error('Generate dummy data error:', error)
    } finally {
      setIsGeneratingDummy(false)
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
              { id: 'timeslots', label: 'Tijdsloten', icon: Calendar },
              { id: 'settings', label: 'Instellingen', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'teams' | 'lottery' | 'timeslots' | 'settings')}
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
          <div className="space-y-8">
            <VisitorStats />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* Team Management Info Panel */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Team Beheer Tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-3">
                  <UserPlus className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900">Dummy Data Aanmaken</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Genereer 12-15 realistische Nederlandse teams met 2-4 spelers per team en willekeurige tijdslot voorkeuren voor het testen van de loting.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Trash2 className="h-6 w-6 text-red-600 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900">Alle Teams Verwijderen</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Verwijder alle teams, leden, voorkeuren en toewijzingen uit het systeem. Dit reset het systeem volledig voor nieuwe inschrijfperiodes.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Gebruik deze tools via het &apos;Teams&apos; tabblad om het systeem snel te resetten en testdata aan te maken voor het testen van de loting functionaliteit.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Ingeschreven Teams</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={generateDummyData}
                    disabled={isGeneratingDummy}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{isGeneratingDummy ? 'Bezig...' : 'Dummy Data Aanmaken'}</span>
                  </button>
                  <button
                    onClick={() => setShowClearTeamsModal(true)}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Alle Teams Verwijderen</span>
                  </button>
                </div>
              </div>
            </div>
            {teams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-bold text-gray-900">Geen teams ingeschreven</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Er zijn nog geen teams ingeschreven voor deze periode.
                </p>
                <div className="mt-6">
                  <button
                    onClick={generateDummyData}
                    disabled={isGeneratingDummy}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isGeneratingDummy ? 'Bezig...' : 'Dummy Data Aanmaken'}
                  </button>
                </div>
              </div>
            ) : (
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
                        Status
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
                          <div className="font-bold text-gray-900">{team.firstName} {team.lastName}</div>
                          <div className="text-sm text-gray-500">Team ID: {team.id.slice(-8)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{team.contactEmail}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {team.members.slice(1).map(member => 
                              `${member.firstName} ${member.lastName}`
                            ).join(', ')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{team.memberCount} spelers</div>
                          <div className="text-xs text-gray-500">
                            {team.members.map(member => member.firstName).join(', ')}
                          </div>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {team.assignments && team.assignments.length > 0 ? (
                            <div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                Toegewezen
                              </span>
                              <div className="text-xs text-gray-600 mt-1">
                                {formatTimeslot(
                                  team.assignments[0].timeslot.dayOfWeek,
                                  team.assignments[0].timeslot.startTime,
                                  team.assignments[0].timeslot.endTime
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                              Wachtlijst
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(team.createdAt).toLocaleDateString('nl-NL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'lottery' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Loting Beheer</h2>
                <div className="flex space-x-4">
                  <button
                    onClick={handleLotteryClick}
                    disabled={isRunningLottery || teams.length === 0}
                    className={`flex items-center space-x-2 ${
                      hasExistingLottery 
                        ? 'bg-orange-600 hover:bg-orange-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    } disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors`}
                  >
                    <Play className="h-4 w-4" />
                    <span>
                      {isRunningLottery 
                        ? 'Bezig...' 
                        : hasExistingLottery 
                          ? 'Nieuwe Loting Uitvoeren' 
                          : 'Loting Uitvoeren'
                      }
                    </span>
                  </button>
                  <button
                    onClick={showLotteryResults}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>Resultaten Bekijken</span>
                  </button>
                  <button
                    onClick={sendNotifications}
                    disabled={isLoading || !lotteryStats?.assignedTeams}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span>{isLoading ? 'Versturen...' : 'Alle E-mails'}</span>
                  </button>
                </div>
              </div>

              {/* Existing Lottery Status */}
              {hasExistingLottery && lotteryResults && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg text-blue-900">Huidige Loting Status</h3>
                    <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">
                      Uitgevoerd op {lotteryResults.assignments?.[0]?.assignedAt ? 
                        new Date(lotteryResults.assignments[0].assignedAt).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Onbekend'
                      }
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">{lotteryResults.statistics?.totalTeams || 0}</div>
                      <div className="text-sm text-blue-700">Totaal Teams</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{lotteryResults.statistics?.assignedTeams || 0}</div>
                      <div className="text-sm text-green-700">Toegewezen</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{lotteryResults.statistics?.unassignedTeams || 0}</div>
                      <div className="text-sm text-orange-700">Wachtlijst</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {lotteryResults.statistics?.totalTeams ? 
                          Math.round((lotteryResults.statistics.assignedTeams / lotteryResults.statistics.totalTeams) * 100) : 0
                        }%
                      </div>
                      <div className="text-sm text-purple-700">Succes Ratio</div>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-blue-800">
                    <strong>Methoden:</strong> {Object.entries(lotteryResults.statistics?.assignmentsByMethod || {})
                      .map(([method, count]) => `${count} via ${method === 'preference' ? 'voorkeur' : method}`)
                      .join(', ')
                    }
                  </div>
                </div>
              )}

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

        {activeTab === 'timeslots' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Tijdslot Beheer</h2>
              <button
                onClick={loadTimeslots}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Ververs</span>
              </button>
            </div>

            <div className="grid gap-6">
              {[1, 2, 3, 4, 5].map(day => (
                <div key={day} className="border rounded-lg p-4">
                  <h3 className="font-bold text-xl text-gray-900 mb-4">
                    {DAYS_OF_WEEK[day as keyof typeof DAYS_OF_WEEK]}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {timeslots
                      .filter(slot => slot.dayOfWeek === day)
                      .map(slot => (
                        <div 
                          key={slot.id} 
                          className={`p-4 rounded-lg border-2 transition-colors ${
                            slot.isActive 
                              ? slot._count.preferences >= 5 
                                ? 'bg-orange-50 border-orange-300' 
                                : 'bg-green-50 border-green-300'
                              : 'bg-gray-100 border-gray-300'
                          }`}
                        >
                          <div className="text-center">
                            <p className="font-bold text-gray-900">
                              {slot.startTime} - {slot.endTime}
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                              {slot._count.preferences} inschrijvingen
                            </p>
                            <p className="text-sm text-gray-700">
                              {slot._count.assignments} toegewezen
                            </p>
                            
                            <button
                              onClick={() => toggleTimeslot(slot.id, !slot.isActive)}
                              disabled={isUpdatingTimeslot}
                              className={`mt-2 px-3 py-1 text-xs rounded transition-colors ${
                                slot.isActive
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              } disabled:bg-gray-400`}
                            >
                              {slot.isActive ? 'Deactiveren' : 'Activeren'}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-2">Legenda</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><span className="inline-block w-4 h-4 bg-green-300 rounded mr-2"></span>Actief tijdslot</p>
                <p><span className="inline-block w-4 h-4 bg-orange-300 rounded mr-2"></span>Vol (5+ inschrijvingen)</p>
                <p><span className="inline-block w-4 h-4 bg-gray-300 rounded mr-2"></span>Gedeactiveerd tijdslot</p>
              </div>
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
                <button 
                  onClick={() => setShowPeriodModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Periode Bewerken
                </button>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">E-mail Templates</h3>
                <p className="text-base font-medium text-gray-900 mb-4">
                  Pas de e-mail templates aan voor bevestigingen en notificaties.
                </p>
                <button 
                  onClick={() => setShowTemplateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Templates Bewerken
                </button>
              </div>

              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Tijdslot Configuratie</h3>
                <p className="text-base font-medium text-gray-900 mb-4">
                  Beheer beschikbare tijdsloten en capaciteit per slot.
                </p>
                <button 
                  onClick={() => setShowTimeslotConfigModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Tijdsloten Bewerken
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Period Management Modal */}
        {showPeriodModal && (
          <PeriodModal 
            onClose={() => setShowPeriodModal(false)}
            onSave={handlePeriodSave}
          />
        )}

        {/* Template Management Modal */}
        {showTemplateModal && (
          <TemplateModal 
            onClose={() => setShowTemplateModal(false)}
            onSave={handleTemplateSave}
          />
        )}

        {/* Timeslot Configuration Modal */}
        {showTimeslotConfigModal && (
          <TimeslotConfigModal 
            onClose={() => setShowTimeslotConfigModal(false)}
            onSave={handleTimeslotConfigSave}
          />
        )}

        {/* Clear All Teams Confirmation Modal */}
        {showClearTeamsModal && (
          <ClearTeamsModal 
            onClose={() => setShowClearTeamsModal(false)}
            onConfirm={clearAllTeams}
            isClearing={isClearing}
            teamCount={teams.length}
          />
        )}

        {/* Lottery Confirmation Modal */}
        {showLotteryModal && (
          <LotteryConfirmationModal 
            onClose={() => setShowLotteryModal(false)}
            onConfirm={runLottery}
            isRunning={isRunningLottery}
            teamCount={teams.length}
          />
        )}

        {/* Lottery Warning Modal */}
        {showLotteryWarningModal && (
          <LotteryWarningModal 
            onClose={() => setShowLotteryWarningModal(false)}
            onConfirm={runLottery}
            isRunning={isRunningLottery}
            existingLotteryStats={lotteryResults?.statistics}
          />
        )}

        {/* Lottery Results Modal */}
        {showResultsModal && lotteryResults && (
          <LotteryResultsModal 
            results={lotteryResults}
            onClose={() => setShowResultsModal(false)}
            onSendEmails={sendEmailsToTeams}
            selectedTeams={selectedTeamsForEmail}
            onTeamSelectionChange={setSelectedTeamsForEmail}
            isSendingEmails={isSendingEmails}
          />
        )}

        {/* Success Modal */}
        {showSuccessModal.show && (
          <SuccessModal 
            title={showSuccessModal.title}
            message={showSuccessModal.message}
            type={showSuccessModal.type}
            onClose={() => setShowSuccessModal(prev => ({ ...prev, show: false }))}
          />
        )}
      </div>
    </div>
  )
}

// Lottery Results Modal Component
function LotteryResultsModal({ results, onClose, onSendEmails, selectedTeams, onTeamSelectionChange, isSendingEmails }: {
  results: LotteryResults
  onClose: () => void
  onSendEmails: (teamIds: string[], emailType: string) => void
  selectedTeams: string[]
  onTeamSelectionChange: (teams: string[]) => void
  isSendingEmails: boolean
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'emails'>('overview')

  const toggleTeamSelection = (teamId: string) => {
    if (selectedTeams.includes(teamId)) {
      onTeamSelectionChange(selectedTeams.filter(id => id !== teamId))
    } else {
      onTeamSelectionChange([...selectedTeams, teamId])
    }
  }

  const selectAllAssigned = () => {
    const assignedTeamIds = results.timeslotDetails
      .flatMap((slot: TimeslotDetail) => slot.assignedTeams)
      .map((team) => team.id)
    onTeamSelectionChange(assignedTeamIds)
  }

  const selectAllUnassigned = () => {
    const unassignedTeamIds = results.unassignedTeams.map((team) => team.id)
    onTeamSelectionChange(unassignedTeamIds)
  }

  const clearSelection = () => {
    onTeamSelectionChange([])
  }

  const getDayName = (dayOfWeek: number): string => {
    const days = ['', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag']
    return days[dayOfWeek] || ''
  }

  const getMethodBadge = (method: string) => {
    const styles = {
      'preference': 'bg-green-100 text-green-800',
      'optimization': 'bg-blue-100 text-blue-800',
      'random': 'bg-yellow-100 text-yellow-800'
    }
    const labels = {
      'preference': 'Voorkeur',
      'optimization': 'Optimaal',
      'random': 'Willekeurig'
    }
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[method as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[method as keyof typeof labels] || method}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Loting Resultaten</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b">
          {[
            { id: 'overview', label: 'Overzicht', icon: '📊' },
            { id: 'assignments', label: 'Toewijzingen', icon: '👥' },
            { id: 'emails', label: 'E-mail Beheer', icon: '📧' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'assignments' | 'emails')}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-900">{results.statistics.totalTeams}</div>
                  <div className="text-sm text-blue-700">Totaal Teams</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-900">{results.statistics.assignedTeams}</div>
                  <div className="text-sm text-green-700">Toegewezen</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-900">{results.statistics.unassignedTeams}</div>
                  <div className="text-sm text-orange-700">Wachtlijst</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-900">
                    {Math.round((results.statistics.assignedTeams / results.statistics.totalTeams) * 100)}%
                  </div>
                  <div className="text-sm text-purple-700">Succes Ratio</div>
                </div>
              </div>

              {/* Assignment Methods */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3">Toewijzing Methoden</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(results.statistics.assignmentsByMethod).map(([method, count]) => (
                    <div key={method} className="text-center">
                      {getMethodBadge(method)}
                      <div className="mt-2 text-xl font-bold">{count as number}</div>
                      <div className="text-sm text-gray-600">teams</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeslot Utilization */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3">Tijdslot Bezetting</h3>
                <div className="space-y-3">
                  {results.timeslotDetails.map((slot) => {
                    const utilization = results.statistics.timeslotUtilization[slot.id]
                    return (
                      <div key={slot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{getDayName(slot.dayOfWeek)} {slot.startTime}-{slot.endTime}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-600">
                            {utilization.assigned}/{utilization.capacity}
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                utilization.utilization >= 100 ? 'bg-red-500' :
                                utilization.utilization >= 80 ? 'bg-orange-500' :
                                utilization.utilization >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(utilization.utilization, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{utilization.utilization}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-6">
              {/* Assigned Teams by Timeslot */}
              <div>
                <h3 className="font-bold text-lg mb-4">Toegewezen Teams per Tijdslot</h3>
                <div className="space-y-4">
                  {results.timeslotDetails.map((slot) => (
                    <div key={slot.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-lg">
                          {getDayName(slot.dayOfWeek)} {slot.startTime}-{slot.endTime}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {slot.assignedTeams.length}/{slot.maxTeams} teams
                        </span>
                      </div>
                      {slot.assignedTeams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {slot.assignedTeams.map((team) => (
                            <div key={team.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium">{team.firstName} {team.lastName}</span>
                                <span className="text-sm text-gray-500 ml-2">({team.memberCount} spelers)</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {team.priority && (
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                    P{team.priority}
                                  </span>
                                )}
                                {getMethodBadge(team.assignmentMethod)}
                                {team.emailSent ? (
                                  <span className="text-green-500 text-sm">✓ Mail</span>
                                ) : (
                                  <span className="text-orange-500 text-sm">⏳ Pending</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">Geen teams toegewezen</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Unassigned Teams */}
              {results.unassignedTeams.length > 0 && (
                <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                  <h3 className="font-bold text-lg mb-3 text-orange-900">Wachtlijst ({results.unassignedTeams.length} teams)</h3>
                  <div className="space-y-2">
                    {results.unassignedTeams.map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-2 bg-white rounded">
                        <span className="font-medium">{team.firstName} {team.lastName}</span>
                        <span className="text-sm text-orange-600">{team.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'emails' && (
            <div className="space-y-6">
              {/* Email Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-900">{results.statistics.emailStats.sent}</div>
                  <div className="text-sm text-green-700">E-mails Verzonden</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-900">{results.statistics.emailStats.pending}</div>
                  <div className="text-sm text-orange-700">Nog Te Verzenden</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-900">{selectedTeams.length}</div>
                  <div className="text-sm text-blue-700">Geselecteerd</div>
                </div>
              </div>

              {/* Email Controls */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-bold text-lg mb-4">E-mail Beheer</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={selectAllAssigned}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                  >
                    Alle Toegewezen ({results.statistics.assignedTeams})
                  </button>
                  <button
                    onClick={selectAllUnassigned}
                    className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm hover:bg-orange-200"
                  >
                    Alle Wachtlijst ({results.statistics.unassignedTeams})
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm hover:bg-gray-200"
                  >
                    Deselecteer Alles
                  </button>
                </div>

                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => onSendEmails(selectedTeams, 'all')}
                    disabled={selectedTeams.length === 0 || isSendingEmails}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center space-x-2"
                  >
                    {isSendingEmails ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Verzenden...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        <span>Verstuur Geselecteerde ({selectedTeams.length})</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onSendEmails(selectedTeams, 'assignment')}
                    disabled={selectedTeams.length === 0 || isSendingEmails}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                  >
                    Alleen Toewijzingen
                  </button>
                  <button
                    onClick={() => onSendEmails(selectedTeams, 'waitlist')}
                    disabled={selectedTeams.length === 0 || isSendingEmails}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400"
                  >
                    Alleen Wachtlijst
                  </button>
                </div>
              </div>

              {/* Team Selection List */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-bold text-lg mb-4">Team Selectie</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {/* Assigned Teams */}
                  {results.timeslotDetails.map((slot) => 
                    slot.assignedTeams.map((team) => (
                      <div key={team.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedTeams.includes(team.id)}
                            onChange={() => toggleTeamSelection(team.id)}
                            className="rounded border-gray-300"
                          />
                          <div>
                            <span className="font-medium">{team.firstName} {team.lastName}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              - {getDayName(slot.dayOfWeek)} {slot.startTime}-{slot.endTime}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Toegewezen</span>
                          {team.emailSent ? (
                            <span className="text-green-500 text-sm">✓ Verzonden</span>
                          ) : (
                            <span className="text-orange-500 text-sm">⏳ Pending</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  
                  {/* Unassigned Teams */}
                  {results.unassignedTeams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedTeams.includes(team.id)}
                          onChange={() => toggleTeamSelection(team.id)}
                          className="rounded border-gray-300"
                        />
                        <div>
                          <span className="font-medium">{team.firstName} {team.lastName}</span>
                          <span className="text-sm text-gray-500 ml-2">- Wachtlijst</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">Wachtlijst</span>
                        <span className="text-orange-500 text-sm">⏳ Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  )
}

// Lottery Confirmation Modal Component
function LotteryConfirmationModal({ onClose, onConfirm, isRunning, teamCount }: { 
  onClose: () => void
  onConfirm: () => void
  isRunning: boolean
  teamCount: number
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-green-900">Loting Uitvoeren</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isRunning}
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-green-800">
                  Klaar om de loting uit te voeren
                </h3>
              </div>
            </div>
          </div>
          <p className="text-base font-medium text-gray-900 mb-2">
            Je staat op het punt om de loting uit te voeren voor <strong>{teamCount} ingeschreven teams</strong>.
          </p>
          <p className="text-sm text-gray-700 mb-4">
            Dit proces zal:
          </p>
          <ul className="text-sm text-gray-700 space-y-1 mb-4">
            <li>• Alle bestaande toewijzingen vervangen</li>
            <li>• Teams toewijzen op basis van hun voorkeuren</li>
            <li>• Prioriteit geven aan eerste keuzes</li>
            <li>• Een eerlijk lotingsysteem gebruiken</li>
            <li>• Resultaten opslaan in de database</li>
          </ul>
          <p className="text-sm font-bold text-green-700">
            Na de loting kunnen teams een e-mail ontvangen met hun toewijzing.
          </p>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            disabled={isRunning || teamCount === 0}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center space-x-2"
          >
            {isRunning ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Bezig...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Ja, start loting</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Success Modal Component
function SuccessModal({ title, message, type, onClose }: { 
  title: string
  message: string
  type: 'success' | 'info'
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
            type === 'success' ? 'bg-green-100' : 'bg-blue-100'
          }`}>
            {type === 'success' ? (
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className={`text-lg font-bold mb-3 ${
            type === 'success' ? 'text-green-900' : 'text-blue-900'
          }`}>
            {title}
          </h3>
          <p className="text-gray-700 mb-6 leading-relaxed">
            {message}
          </p>
          <button
            onClick={onClose}
            className={`w-full px-4 py-2 rounded-lg text-white font-medium transition-colors ${
              type === 'success' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  )
}

// Period Management Modal Component
function PeriodModal({ onClose, onSave }: { 
  onClose: () => void
  onSave: (data: {
    name: string
    registrationStart: string
    registrationEnd: string
    lotteryDate: string
    description: string
  }) => void 
}) {
  const [formData, setFormData] = useState({
    name: '',
    registrationStart: '',
    registrationEnd: '',
    lotteryDate: '',
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Inschrijfperiode Bewerken</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Periode Naam
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Bijvoorbeeld: Week 1-10"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Inschrijving Start
            </label>
            <input
              type="datetime-local"
              value={formData.registrationStart}
              onChange={(e) => setFormData({ ...formData, registrationStart: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Inschrijving Einde
            </label>
            <input
              type="datetime-local"
              value={formData.registrationEnd}
              onChange={(e) => setFormData({ ...formData, registrationEnd: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Loting Datum
            </label>
            <input
              type="datetime-local"
              value={formData.lotteryDate}
              onChange={(e) => setFormData({ ...formData, lotteryDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Beschrijving (optioneel)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Extra informatie over deze periode"
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Template Management Modal Component
function TemplateModal({ onClose, onSave }: { 
  onClose: () => void
  onSave: (data: {
    confirmation: { subject: string, body: string }
    assignment: { subject: string, body: string }
    waitlist: { subject: string, body: string }
  }) => void 
}) {
  const [activeTemplate, setActiveTemplate] = useState<'confirmation' | 'assignment' | 'waitlist'>('confirmation')
  const [templates, setTemplates] = useState({
    confirmation: {
      subject: 'Bevestiging inschrijving LTC Padel Lessen',
      body: `Beste {{firstName}} {{lastName}},

Bedankt voor je inschrijving voor de padellessen bij LTC de Kei!

Je hebt je ingeschreven met de volgende voorkeuren:
{{preferences}}

De loting vindt plaats op {{lotteryDate}} en je ontvangt dan bericht over de toewijzing.

Met sportieve groet,
LTC de Kei`
    },
    assignment: {
      subject: 'Toewijzing padellessen LTC de Kei',
      body: `Beste {{firstName}} {{lastName}},

Goed nieuws! Je team is toegewezen aan het volgende tijdslot:
{{assignment}}

Datum: Elke {{dayOfWeek}}
Tijd: {{timeSlot}}

Zorg ervoor dat je op tijd aanwezig bent voor de lessen.

Met sportieve groet,
LTC de Kei`
    },
    waitlist: {
      subject: 'Wachtlijst padellessen LTC de Kei',
      body: `Beste {{firstName}} {{lastName}},

Helaas konden we je team niet toewijzen aan een van je voorkeuren.
Je staat nu op de wachtlijst en wordt op de hoogte gehouden als er plekken vrijkomen.

Met sportieve groet,
LTC de Kei`
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(templates)
  }

  const updateTemplate = (type: 'confirmation' | 'assignment' | 'waitlist', field: 'subject' | 'body', value: string) => {
    setTemplates(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">E-mail Templates Bewerken</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex space-x-4 mb-6">
          {[
            { id: 'confirmation', label: 'Bevestiging' },
            { id: 'assignment', label: 'Toewijzing' },
            { id: 'waitlist', label: 'Wachtlijst' }
          ].map(template => (
            <button
              key={template.id}
              onClick={() => setActiveTemplate(template.id as 'confirmation' | 'assignment' | 'waitlist')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTemplate === template.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {template.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Onderwerp
            </label>
            <input
              type="text"
              value={templates[activeTemplate].subject}
              onChange={(e) => updateTemplate(activeTemplate, 'subject', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Bericht
            </label>
            <textarea
              value={templates[activeTemplate].body}
              onChange={(e) => updateTemplate(activeTemplate, 'body', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={12}
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-bold text-blue-900 mb-2">Beschikbare variabelen:</h4>
            <div className="text-sm text-blue-800 grid grid-cols-2 gap-2">
              <div>{'{{firstName}}'} - Voornaam</div>
              <div>{'{{lastName}}'} - Achternaam</div>
              <div>{'{{preferences}}'} - Voorkeuren lijst</div>
              <div>{'{{lotteryDate}}'} - Loting datum</div>
              <div>{'{{assignment}}'} - Toegewezen slot</div>
              <div>{'{{dayOfWeek}}'} - Dag van de week</div>
              <div>{'{{timeSlot}}'} - Tijdslot</div>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Alle Templates Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Timeslot Configuration Modal Component
function TimeslotConfigModal({ onClose, onSave }: { 
  onClose: () => void
  onSave: (data: {
    maxTeamsPerSlot: number
    timeSlots: Array<{ startTime: string, endTime: string, enabled: boolean }>
    activeDays: Record<number, boolean>
  }) => void 
}) {
  const [config, setConfig] = useState({
    maxTeamsPerSlot: 5,
    timeSlots: [
      { startTime: '13:30', endTime: '14:30', enabled: true },
      { startTime: '14:30', endTime: '15:30', enabled: true },
      { startTime: '15:30', endTime: '16:30', enabled: true },
      { startTime: '16:30', endTime: '17:30', enabled: true },
      { startTime: '17:30', endTime: '18:30', enabled: true },
      { startTime: '18:30', endTime: '19:30', enabled: true },
      { startTime: '19:30', endTime: '20:30', enabled: true },
      { startTime: '20:30', endTime: '21:30', enabled: true }
    ],
    activeDays: {
      1: true, // Monday
      2: true, // Tuesday
      3: true, // Wednesday
      4: true, // Thursday
      5: true  // Friday
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(config)
  }

  const toggleTimeSlot = (index: number) => {
    setConfig(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) => 
        i === index ? { ...slot, enabled: !slot.enabled } : slot
      )
    }))
  }

  const toggleDay = (day: number) => {
    setConfig(prev => ({
      ...prev,
      activeDays: {
        ...prev.activeDays,
        [day]: !prev.activeDays[day as keyof typeof prev.activeDays]
      }
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Tijdslot Configuratie</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Maximum Teams per Tijdslot
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.maxTeamsPerSlot}
              onChange={(e) => setConfig({ ...config, maxTeamsPerSlot: parseInt(e.target.value) })}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <h4 className="font-bold text-lg text-gray-900 mb-3">Actieve Dagen</h4>
            <div className="grid grid-cols-5 gap-3">
              {[
                { day: 1, label: 'Maandag' },
                { day: 2, label: 'Dinsdag' },
                { day: 3, label: 'Woensdag' },
                { day: 4, label: 'Donderdag' },
                { day: 5, label: 'Vrijdag' }
              ].map(({ day, label }) => (
                <label key={day} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.activeDays[day as keyof typeof config.activeDays]}
                    onChange={() => toggleDay(day)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg text-gray-900 mb-3">Beschikbare Tijdsloten</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {config.timeSlots.map((slot, index) => (
                <label key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={slot.enabled}
                    onChange={() => toggleTimeSlot(index)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Configuratie Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Clear All Teams Confirmation Modal Component
function ClearTeamsModal({ onClose, onConfirm, isClearing, teamCount }: { 
  onClose: () => void
  onConfirm: () => void
  isClearing: boolean
  teamCount: number
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-red-900">Alle Teams Verwijderen</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isClearing}
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-red-800">
                  Let op: Deze actie kan niet ongedaan worden gemaakt!
                </h3>
              </div>
            </div>
          </div>
          <p className="text-base font-medium text-gray-900 mb-2">
            Je staat op het punt om <strong>{teamCount} teams</strong> te verwijderen.
          </p>
          <p className="text-sm text-gray-700 mb-4">
            Dit zal het volgende verwijderen:
          </p>
          <ul className="text-sm text-gray-700 space-y-1 mb-4">
            <li>• Alle ingeschreven teams</li>
            <li>• Alle teamleden</li>
            <li>• Alle voorkeuren</li>
            <li>• Alle toewijzingen</li>
            <li>• Alle loting gegevens</li>
          </ul>
          <p className="text-sm font-bold text-red-700">
            Het systeem wordt volledig leeggemaakt voor nieuwe inschrijvingen.
          </p>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isClearing}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            disabled={isClearing || teamCount === 0}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
          >
            {isClearing ? 'Bezig met verwijderen...' : `Ja, verwijder ${teamCount} teams`}
          </button>
        </div>
      </div>
    </div>
  )
}

// Lottery Warning Modal Component
function LotteryWarningModal({ onClose, onConfirm, isRunning, existingLotteryStats }: { 
  onClose: () => void
  onConfirm: () => void
  isRunning: boolean
  existingLotteryStats?: LotteryStatistics
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-orange-900">Nieuwe Loting Uitvoeren</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isRunning}
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.32 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-orange-800">
                  Er is al een loting uitgevoerd!
                </h3>
              </div>
            </div>
          </div>
          
          {existingLotteryStats && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="font-bold text-blue-900 mb-2">Huidige Loting Resultaten:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• {existingLotteryStats.assignedTeams} teams toegewezen</div>
                <div>• {existingLotteryStats.unassignedTeams} teams op wachtlijst</div>
                <div>• {existingLotteryStats.totalTeams > 0 ? Math.round((existingLotteryStats.assignedTeams / existingLotteryStats.totalTeams) * 100) : 0}% succes ratio</div>
              </div>
            </div>
          )}
          
          <p className="text-base font-medium text-gray-900 mb-2">
            Weet je zeker dat je een nieuwe loting wilt uitvoeren?
          </p>
          <p className="text-sm text-gray-700 mb-4">
            Dit zal:
          </p>
          <ul className="text-sm text-gray-700 space-y-1 mb-4">
            <li>• Alle huidige toewijzingen vervangen</li>
            <li>• Een nieuwe loting uitvoeren voor alle teams</li>
            <li>• Mogelijk andere resultaten opleveren</li>
            <li>• E-mail status resetten</li>
          </ul>
          <p className="text-sm font-bold text-orange-700">
            Let op: Deze actie kan niet ongedaan worden gemaakt!
          </p>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            disabled={isRunning}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 flex items-center justify-center space-x-2"
          >
            {isRunning ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Bezig...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Ja, nieuwe loting</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}