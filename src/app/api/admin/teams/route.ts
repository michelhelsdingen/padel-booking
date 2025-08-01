import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        preferences: {
          include: {
            timeslot: {
              select: {
                id: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true
              }
            }
          },
          orderBy: { priority: 'asc' }
        },
        assignments: {
          include: {
            timeslot: {
              select: {
                id: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen teams' },
      { status: 500 }
    )
  }
}