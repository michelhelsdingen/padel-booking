import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        team: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            contactEmail: true,
            memberCount: true
          }
        },
        timeslot: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true
          }
        }
      },
      orderBy: [
        { timeslot: { dayOfWeek: 'asc' } },
        { timeslot: { startTime: 'asc' } }
      ]
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen rooster' },
      { status: 500 }
    )
  }
}