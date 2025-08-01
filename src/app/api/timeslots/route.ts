import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const timeslots = await prisma.timeslot.findMany({
      where: { isActive: true },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json(timeslots)
  } catch (error) {
    console.error('Error fetching timeslots:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen tijdsloten' },
      { status: 500 }
    )
  }
}