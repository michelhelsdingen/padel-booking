import { NextResponse } from 'next/server'
import { getLotteryStatistics } from '@/lib/lottery'

export async function GET() {
  try {
    // For now, return basic empty stats since lottery system uses Prisma
    // TODO: Convert lottery system to Supabase
    return NextResponse.json({
      totalTeams: 0,
      assignedTeams: 0,
      unassignedTeams: 0,
      totalPreferences: 0,
      assignmentsByRound: {},
      assignmentsByDay: {},
      assignments: []
    })
  } catch (error) {
    console.error('Error fetching lottery statistics:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen loting statistieken' },
      { status: 500 }
    )
  }
}