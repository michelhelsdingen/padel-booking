import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const timeslots = await prisma.timeslot.findMany({
      include: {
        _count: {
          select: {
            preferences: true,
            assignments: true
          }
        }
      },
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

export async function PATCH(request: NextRequest) {
  try {
    const { timeslotId, isActive } = await request.json()

    const updatedTimeslot = await prisma.timeslot.update({
      where: { id: timeslotId },
      data: { isActive }
    })

    return NextResponse.json({
      success: true,
      timeslot: updatedTimeslot,
      message: `Tijdslot ${isActive ? 'geactiveerd' : 'gedeactiveerd'}`
    })
  } catch (error) {
    console.error('Error updating timeslot:', error)
    return NextResponse.json(
      { error: 'Fout bij bijwerken tijdslot' },
      { status: 500 }
    )
  }
}