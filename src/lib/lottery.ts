import { prisma } from './prisma'

interface TeamPreference {
  teamId: string
  timeslotId: string
  priority: number
  team: {
    id: string
    name: string
    contactEmail: string
  }
  timeslot: {
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    maxTeams: number
  }
}

interface LotteryResult {
  assignments: Array<{
    teamId: string
    timeslotId: string
    lotteryRound: number
  }>
  unassignedTeams: string[]
  statistics: {
    totalTeams: number
    assignedTeams: number
    assignmentsByRound: Record<number, number>
  }
}

export async function runLottery(): Promise<LotteryResult> {
  // Get all team preferences with team and timeslot data
  const preferences = await prisma.teamPreference.findMany({
    include: {
      team: {
        select: {
          id: true,
          name: true,
          contactEmail: true
        }
      },
      timeslot: {
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          maxTeams: true
        }
      }
    },
    orderBy: [
      { priority: 'asc' },
      // Add some randomization to ensure fairness within same priority
      { teamId: 'asc' }
    ]
  })

  // Check if there are existing assignments and clear them
  await prisma.assignment.deleteMany({})

  const assignments: Array<{
    teamId: string
    timeslotId: string
    lotteryRound: number
  }> = []
  
  const assignedTeams = new Set<string>()
  const timeslotCapacity: Record<string, number> = {}
  const assignmentsByRound: Record<number, number> = {}

  // Initialize timeslot capacity tracking
  preferences.forEach(pref => {
    if (!timeslotCapacity[pref.timeslotId]) {
      timeslotCapacity[pref.timeslotId] = pref.timeslot.maxTeams
    }
  })

  // Group preferences by priority and randomize within each priority group
  const preferencesByPriority: Record<number, TeamPreference[]> = {}
  preferences.forEach(pref => {
    if (!preferencesByPriority[pref.priority]) {
      preferencesByPriority[pref.priority] = []
    }
    preferencesByPriority[pref.priority].push(pref)
  })

  // Randomize each priority group for fairness
  Object.keys(preferencesByPriority).forEach(priority => {
    preferencesByPriority[parseInt(priority)] = shuffleArray(preferencesByPriority[parseInt(priority)])
  })

  // Run lottery rounds (1-4 for priorities)
  for (let round = 1; round <= 4; round++) {
    const roundPreferences = preferencesByPriority[round] || []
    let roundAssignments = 0

    for (const pref of roundPreferences) {
      // Skip if team is already assigned
      if (assignedTeams.has(pref.teamId)) {
        continue
      }

      // Check if timeslot has capacity
      if (timeslotCapacity[pref.timeslotId] > 0) {
        assignments.push({
          teamId: pref.teamId,
          timeslotId: pref.timeslotId,
          lotteryRound: round
        })
        
        assignedTeams.add(pref.teamId)
        timeslotCapacity[pref.timeslotId]--
        roundAssignments++
      }
    }

    assignmentsByRound[round] = roundAssignments
  }

  // Get all unique team IDs to find unassigned teams
  const allTeamIds = new Set(preferences.map(p => p.teamId))
  const unassignedTeams = Array.from(allTeamIds).filter(teamId => !assignedTeams.has(teamId))

  // Try to assign unassigned teams to any available slots (round 5)
  if (unassignedTeams.length > 0) {
    let finalRoundAssignments = 0
    
    for (const teamId of unassignedTeams) {
      // Find any available timeslot
      const availableTimeslot = Object.entries(timeslotCapacity)
        .find(([, capacity]) => capacity > 0)
      
      if (availableTimeslot) {
        const [timeslotId] = availableTimeslot
        assignments.push({
          teamId,
          timeslotId,
          lotteryRound: 5
        })
        
        assignedTeams.add(teamId)
        timeslotCapacity[timeslotId]--
        finalRoundAssignments++
      }
    }

    if (finalRoundAssignments > 0) {
      assignmentsByRound[5] = finalRoundAssignments
    }
  }

  // Save assignments to database
  if (assignments.length > 0) {
    await prisma.assignment.createMany({
      data: assignments.map(assignment => ({
        teamId: assignment.teamId,
        timeslotId: assignment.timeslotId,
        lotteryRound: assignment.lotteryRound
      }))
    })
  }

  // Calculate final unassigned teams
  const finalUnassignedTeams = Array.from(allTeamIds).filter(teamId => !assignedTeams.has(teamId))

  return {
    assignments,
    unassignedTeams: finalUnassignedTeams,
    statistics: {
      totalTeams: allTeamIds.size,
      assignedTeams: assignedTeams.size,
      assignmentsByRound
    }
  }
}

// Fisher-Yates shuffle algorithm for fairness
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export async function getLotteryStatistics() {
  const [teams, assignments, preferences] = await Promise.all([
    prisma.team.count(),
    prisma.assignment.findMany({
      include: {
        team: { select: { name: true, contactEmail: true } },
        timeslot: { select: { dayOfWeek: true, startTime: true, endTime: true } }
      }
    }),
    prisma.teamPreference.count()
  ])

  const assignmentsByRound = assignments.reduce((acc, assignment) => {
    const round = assignment.lotteryRound || 0
    acc[round] = (acc[round] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  const assignmentsByDay = assignments.reduce((acc, assignment) => {
    const day = assignment.timeslot.dayOfWeek
    acc[day] = (acc[day] || 0) + 1
    return acc
  }, {} as Record<number, number>)

  return {
    totalTeams: teams,
    assignedTeams: assignments.length,
    unassignedTeams: teams - assignments.length,
    totalPreferences: preferences,
    assignmentsByRound,
    assignmentsByDay,
    assignments
  }
}