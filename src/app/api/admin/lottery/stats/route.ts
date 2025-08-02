import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    console.log('Lottery stats API called')
    console.log('Request URL:', request.url)
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    console.log('Database URL configured:', !!process.env.DATABASE_URL)
    console.log('Environment:', process.env.NODE_ENV)
    
    // Test database connection first
    await prisma.$queryRaw`SELECT 1`
    console.log('Database connection successful')
    
    // Get total teams
    const totalTeams = await prisma.team.count()
    console.log('Total teams found:', totalTeams)
    
    // Get assignments with team and timeslot details
    const assignments = await prisma.assignment.findMany({
      include: {
        team: true,
        timeslot: true
      }
    })
    
    // Count assigned teams (teams with at least one assignment)
    const assignedTeamIds = new Set(assignments.map(a => a.teamId))
    const assignedTeams = assignedTeamIds.size
    const unassignedTeams = totalTeams - assignedTeams
    
    // Get total preferences
    const totalPreferences = await prisma.teamPreference.count()
    
    // Group assignments by round
    const assignmentsByRound: Record<number, number> = {}
    assignments.forEach(assignment => {
      const round = assignment.lotteryRound || 0
      assignmentsByRound[round] = (assignmentsByRound[round] || 0) + 1
    })
    
    // Group assignments by day
    const assignmentsByDay: Record<number, number> = {}
    assignments.forEach(assignment => {
      const day = assignment.timeslot.dayOfWeek
      assignmentsByDay[day] = (assignmentsByDay[day] || 0) + 1
    })
    
    return NextResponse.json({
      totalTeams,
      assignedTeams,
      unassignedTeams,
      totalPreferences,
      assignmentsByRound,
      assignmentsByDay,
      assignments: assignments.map(a => ({
        id: a.id,
        teamId: a.teamId,
        teamName: `${a.team.firstName} ${a.team.lastName}`,
        timeslotId: a.timeslotId,
        dayOfWeek: a.timeslot.dayOfWeek,
        startTime: a.timeslot.startTime,
        endTime: a.timeslot.endTime,
        lotteryRound: a.lotteryRound
      }))
    })
  } catch (error) {
    console.error('Error fetching lottery statistics:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        error: 'Fout bij ophalen loting statistieken',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}