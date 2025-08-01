import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const timeslots = await prisma.timeslot.findMany({
      where: { isActive: true },
      include: {
        preferences: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    // Add preference count to each timeslot
    const timeslotsWithCounts = timeslots.map(timeslot => ({
      id: timeslot.id,
      dayOfWeek: timeslot.dayOfWeek,
      startTime: timeslot.startTime,
      endTime: timeslot.endTime,
      maxTeams: timeslot.maxTeams,
      isActive: timeslot.isActive,
      preferenceCount: timeslot.preferences.length
    }))

    return NextResponse.json(timeslotsWithCounts)
  } catch (error) {
    console.error('Error fetching timeslots:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen tijdsloten' },
      { status: 500 }
    )
  }
}