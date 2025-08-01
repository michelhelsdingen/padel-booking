import { supabaseAdmin } from './supabase'

interface TeamPreference {
  teamId: string
  timeslotId: string
  priority: number
  team: {
    id: string
    firstName: string
    lastName: string
    contactEmail: string
    memberCount: number
  }
  timeslot: {
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    maxTeams: number
  }
}

interface Assignment {
  teamId: string
  timeslotId: string
  assignmentMethod: 'preference' | 'random' | 'optimization'
  assignmentRound: number
  priority?: number
}

interface LotteryResult {
  assignments: Assignment[]
  unassignedTeams: Array<{
    id: string
    firstName: string
    lastName: string
    contactEmail: string
    reason: string
  }>
  statistics: {
    totalTeams: number
    assignedTeams: number
    unassignedTeams: number
    assignmentsByMethod: Record<string, number>
    assignmentsByDay: Record<number, number>
    timeslotUtilization: Record<string, { assigned: number, capacity: number, utilization: number }>
  }
  timeslotDetails: Array<{
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
      priority?: number
    }>
  }>
}

// Fisher-Yates shuffle algorithm for randomization
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export async function runOptimizedLottery(): Promise<LotteryResult> {
  console.log('Starting optimized lottery...')
  
  // Get all teams with their preferences
  const { data: teamsData, error: teamsError } = await supabaseAdmin
    .from('teams')
    .select(`
      id,
      firstName,
      lastName,
      contactEmail,
      memberCount,
      preferences:team_preferences(
        timeslotId,
        priority,
        timeslot:timeslots(
          id,
          dayOfWeek,
          startTime,
          endTime,
          maxTeams,
          isActive
        )
      )
    `)
    .order('createdAt', { ascending: true })

  if (teamsError || !teamsData) {
    throw new Error(`Failed to fetch teams: ${teamsError?.message}`)
  }

  // Get all active timeslots
  const { data: timeslots, error: timeslotsError } = await supabaseAdmin
    .from('timeslots')
    .select('*')
    .eq('isActive', true)
    .order('dayOfWeek', { ascending: true })
    .order('startTime', { ascending: true })

  if (timeslotsError || !timeslots) {
    throw new Error(`Failed to fetch timeslots: ${timeslotsError?.message}`)
  }

  // Clear existing assignments
  await supabaseAdmin.from('assignments').delete().neq('id', '')

  // Prepare data structures
  const assignments: Assignment[] = []
  const assignedTeams = new Set<string>()
  const timeslotCapacity: Record<string, number> = {}
  const assignmentsByMethod: Record<string, number> = {}
  const assignmentsByDay: Record<number, number> = {}

  // Initialize capacity tracking
  timeslots.forEach(slot => {
    timeslotCapacity[slot.id] = slot.maxTeams
  })

  // Flatten preferences for easier processing
  const allPreferences: TeamPreference[] = []
  teamsData.forEach(team => {
    team.preferences.forEach((pref: any) => {
      if (pref.timeslot && pref.timeslot.isActive) {
        allPreferences.push({
          teamId: team.id,
          timeslotId: pref.timeslotId,
          priority: pref.priority,
          team: {
            id: team.id,
            firstName: team.firstName,
            lastName: team.lastName,
            contactEmail: team.contactEmail,
            memberCount: team.memberCount
          },
          timeslot: pref.timeslot
        })
      }
    })
  })

  console.log(`Processing ${teamsData.length} teams with ${allPreferences.length} total preferences`)

  // Phase 1: Honor first preferences (priority 1) with randomization for fairness
  console.log('Phase 1: Processing first preferences...')
  const firstPreferences = allPreferences.filter(p => p.priority === 1)
  const shuffledFirstPrefs = shuffleArray(firstPreferences)
  
  let assignedInPhase1 = 0
  for (const pref of shuffledFirstPrefs) {
    if (assignedTeams.has(pref.teamId)) continue
    if (timeslotCapacity[pref.timeslotId] > 0) {
      assignments.push({
        teamId: pref.teamId,
        timeslotId: pref.timeslotId,
        assignmentMethod: 'preference',
        assignmentRound: 1,
        priority: 1
      })
      assignedTeams.add(pref.teamId)
      timeslotCapacity[pref.timeslotId]--
      assignmentsByMethod['preference'] = (assignmentsByMethod['preference'] || 0) + 1
      assignmentsByDay[pref.timeslot.dayOfWeek] = (assignmentsByDay[pref.timeslot.dayOfWeek] || 0) + 1
      assignedInPhase1++
    }
  }
  console.log(`Phase 1 complete: ${assignedInPhase1} teams assigned to their first preference`)

  // Phase 2: Process remaining preferences (2, 3, 4) in randomized order
  console.log('Phase 2: Processing remaining preferences...')
  for (let priority = 2; priority <= 4; priority++) {
    const priorityPreferences = allPreferences.filter(p => 
      p.priority === priority && !assignedTeams.has(p.teamId)
    )
    const shuffledPriorityPrefs = shuffleArray(priorityPreferences)
    
    let assignedInPriority = 0
    for (const pref of shuffledPriorityPrefs) {
      if (assignedTeams.has(pref.teamId)) continue
      if (timeslotCapacity[pref.timeslotId] > 0) {
        assignments.push({
          teamId: pref.teamId,
          timeslotId: pref.timeslotId,
          assignmentMethod: 'preference',
          assignmentRound: priority,
          priority
        })
        assignedTeams.add(pref.teamId)
        timeslotCapacity[pref.timeslotId]--
        assignmentsByMethod['preference'] = (assignmentsByMethod['preference'] || 0) + 1
        assignmentsByDay[pref.timeslot.dayOfWeek] = (assignmentsByDay[pref.timeslot.dayOfWeek] || 0) + 1
        assignedInPriority++
      }
    }
    console.log(`Priority ${priority}: ${assignedInPriority} teams assigned`)
  }

  // Phase 3: Optimal assignment for remaining teams
  console.log('Phase 3: Optimal assignment for remaining teams...')
  const unassignedTeams = teamsData.filter(team => !assignedTeams.has(team.id))
  const availableSlots = timeslots.filter(slot => timeslotCapacity[slot.id] > 0)
  
  // Create optimized distribution - spread teams across different days and times
  const slotsByDay: Record<number, typeof timeslots> = {}
  availableSlots.forEach(slot => {
    if (!slotsByDay[slot.dayOfWeek]) slotsByDay[slot.dayOfWeek] = []
    slotsByDay[slot.dayOfWeek].push(slot)
  })

  // Randomize team order for fairness
  const shuffledUnassigned = shuffleArray(unassignedTeams)
  
  let assignedInPhase3 = 0
  for (const team of shuffledUnassigned) {
    if (assignedTeams.has(team.id)) continue
    
    // Find best available slot (prefer less crowded days first)
    const dayOptions = Object.keys(slotsByDay)
      .map(day => parseInt(day))
      .sort((a, b) => {
        const aCount = assignmentsByDay[a] || 0
        const bCount = assignmentsByDay[b] || 0
        return aCount - bCount // Less crowded days first
      })
    
    let assigned = false
    for (const day of dayOptions) {
      const daySlots = slotsByDay[day].filter(slot => timeslotCapacity[slot.id] > 0)
      if (daySlots.length === 0) continue
      
      // Randomly pick from available slots on this day
      const randomSlot = daySlots[Math.floor(Math.random() * daySlots.length)]
      
      assignments.push({
        teamId: team.id,
        timeslotId: randomSlot.id,
        assignmentMethod: 'optimization',
        assignmentRound: 5
      })
      assignedTeams.add(team.id)
      timeslotCapacity[randomSlot.id]--
      assignmentsByMethod['optimization'] = (assignmentsByMethod['optimization'] || 0) + 1
      assignmentsByDay[randomSlot.dayOfWeek] = (assignmentsByDay[randomSlot.dayOfWeek] || 0) + 1
      assignedInPhase3++
      assigned = true
      break
    }
    
    if (!assigned) {
      // Try completely random assignment if optimization fails
      const anyAvailableSlot = availableSlots.find(slot => timeslotCapacity[slot.id] > 0)
      if (anyAvailableSlot) {
        assignments.push({
          teamId: team.id,
          timeslotId: anyAvailableSlot.id,
          assignmentMethod: 'random',
          assignmentRound: 6
        })
        assignedTeams.add(team.id)
        timeslotCapacity[anyAvailableSlot.id]--
        assignmentsByMethod['random'] = (assignmentsByMethod['random'] || 0) + 1
        assignmentsByDay[anyAvailableSlot.dayOfWeek] = (assignmentsByDay[anyAvailableSlot.dayOfWeek] || 0) + 1
        assignedInPhase3++
      }
    }
  }
  console.log(`Phase 3 complete: ${assignedInPhase3} teams assigned optimally/randomly`)

  // Save assignments to database
  if (assignments.length > 0) {
    console.log(`Attempting to save ${assignments.length} assignments to database`)
    
    const insertData = assignments.map(a => ({
      id: crypto.randomUUID(),
      teamId: a.teamId,
      timeslotId: a.timeslotId,
      assignmentmethod: a.assignmentMethod,
      lotteryRound: a.assignmentRound,
      priority: a.priority,
      emailsent: false,
      assignedAt: new Date().toISOString()
    }))
    
    console.log('Insert data sample:', insertData[0])
    
    const { data: insertResult, error: saveError } = await supabaseAdmin
      .from('assignments')
      .insert(insertData)
    
    if (saveError) {
      console.error('Error saving assignments:', saveError)
      throw new Error(`Failed to save assignments: ${saveError.message}`)
    }
    
    console.log(`Successfully saved ${assignments.length} assignments`, insertResult)
  } else {
    console.log('No assignments to save')
  }

  // Calculate final statistics and create detailed result
  const finalUnassignedTeams = teamsData
    .filter(team => !assignedTeams.has(team.id))
    .map(team => ({
      id: team.id,
      firstName: team.firstName,
      lastName: team.lastName,
      contactEmail: team.contactEmail,
      reason: 'Geen beschikbare tijdsloten'
    }))

  // Calculate timeslot utilization
  const timeslotUtilization: Record<string, { assigned: number, capacity: number, utilization: number }> = {}
  timeslots.forEach(slot => {
    const assigned = slot.maxTeams - timeslotCapacity[slot.id]
    timeslotUtilization[slot.id] = {
      assigned,
      capacity: slot.maxTeams,
      utilization: Math.round((assigned / slot.maxTeams) * 100)
    }
  })

  // Create detailed timeslot information
  const timeslotDetails = await Promise.all(timeslots.map(async (slot) => {
    const slotAssignments = assignments.filter(a => a.timeslotId === slot.id)
    const assignedTeamIds = slotAssignments.map(a => a.teamId)
    const assignedTeamsData = teamsData.filter(team => assignedTeamIds.includes(team.id))
    
    return {
      id: slot.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxTeams: slot.maxTeams,
      assignedTeams: assignedTeamsData.map(team => {
        const assignment = slotAssignments.find(a => a.teamId === team.id)!
        return {
          id: team.id,
          firstName: team.firstName,
          lastName: team.lastName,
          contactEmail: team.contactEmail,
          memberCount: team.memberCount,
          assignmentMethod: assignment.assignmentMethod,
          priority: assignment.priority
        }
      })
    }
  }))

  const result: LotteryResult = {
    assignments,
    unassignedTeams: finalUnassignedTeams,
    statistics: {
      totalTeams: teamsData.length,
      assignedTeams: assignedTeams.size,
      unassignedTeams: finalUnassignedTeams.length,
      assignmentsByMethod,
      assignmentsByDay,
      timeslotUtilization
    },
    timeslotDetails
  }

  console.log('Lottery completed successfully:', {
    totalTeams: result.statistics.totalTeams,
    assigned: result.statistics.assignedTeams,
    unassigned: result.statistics.unassignedTeams,
    methods: assignmentsByMethod
  })

  return result
}