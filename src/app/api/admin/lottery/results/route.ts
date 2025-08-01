import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Get all assignments with team and timeslot details
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        teams!inner(
          id,
          firstName,
          lastName,
          contactEmail,
          memberCount
        ),
        timeslots!inner(
          id,
          dayOfWeek,
          startTime,
          endTime,
          maxTeams
        )
      `)
      .order('assignedAt', { ascending: false })

    if (assignmentsError) {
      throw assignmentsError
    }

    // Get all teams to find unassigned ones
    const { data: allTeams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('id, firstName, lastName, contactEmail, memberCount')

    if (teamsError) {
      throw teamsError
    }

    // Get all active timeslots
    const { data: timeslots, error: timeslotsError } = await supabaseAdmin
      .from('timeslots')
      .select('*')
      .eq('isActive', true)
      .order('dayOfWeek', { ascending: true })
      .order('startTime', { ascending: true })

    if (timeslotsError) {
      throw timeslotsError
    }

    // Find unassigned teams
    const assignedTeamIds = new Set(assignments?.map(a => a.teamId) || [])
    const unassignedTeams = allTeams?.filter(team => !assignedTeamIds.has(team.id)) || []

    // Calculate statistics
    const assignmentsByMethod: Record<string, number> = {}
    const assignmentsByDay: Record<number, number> = {}
    const emailStats = { sent: 0, pending: 0 }

    assignments?.forEach(assignment => {
      const method = assignment.assignmentmethod || 'unknown'
      assignmentsByMethod[method] = (assignmentsByMethod[method] || 0) + 1
      
      const dayOfWeek = assignment.timeslots?.dayOfWeek
      if (dayOfWeek) {
        assignmentsByDay[dayOfWeek] = (assignmentsByDay[dayOfWeek] || 0) + 1
      }

      if (assignment.emailsent) {
        emailStats.sent++
      } else {
        emailStats.pending++
      }
    })

    // Calculate timeslot utilization
    const timeslotUtilization: Record<string, { assigned: number, capacity: number, utilization: number }> = {}
    timeslots?.forEach(slot => {
      const assignedCount = assignments?.filter(a => a.timeslotId === slot.id).length || 0
      timeslotUtilization[slot.id] = {
        assigned: assignedCount,
        capacity: slot.maxTeams,
        utilization: Math.round((assignedCount / slot.maxTeams) * 100)
      }
    })

    // Group assignments by timeslot for detailed view
    const timeslotDetails = timeslots?.map(slot => {
      const slotAssignments = assignments?.filter(a => a.timeslotId === slot.id) || []
      return {
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxTeams: slot.maxTeams,
        assignedTeams: slotAssignments.map(assignment => ({
          id: assignment.teams.id,
          firstName: assignment.teams.firstName,
          lastName: assignment.teams.lastName,
          contactEmail: assignment.teams.contactEmail,
          memberCount: assignment.teams.memberCount,
          assignmentMethod: assignment.assignmentmethod,
          priority: assignment.priority,
          emailSent: assignment.emailsent,
          emailSentAt: assignment.emailsentat
        }))
      }
    }) || []

    const result = {
      assignments: assignments || [],
      unassignedTeams: unassignedTeams.map(team => ({
        id: team.id,       firstName: team.firstName,
        lastName: team.lastName,
        contactEmail: team.contactEmail,
        reason: 'Geen beschikbare tijdsloten'
      })),
      statistics: {
        totalTeams: allTeams?.length || 0,
        assignedTeams: assignments?.length || 0,
        unassignedTeams: unassignedTeams.length,
        assignmentsByMethod,
        assignmentsByDay,
        timeslotUtilization,
        emailStats
      },
      timeslotDetails,
      hasResults: (assignments?.length || 0) > 0
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching lottery results:', error)
    
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het ophalen van loting resultaten',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}