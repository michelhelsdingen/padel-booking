import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check if timeslots exist, create them if they don't
    const existingCount = await prisma.timeslot.count()
    
    if (existingCount === 0) {
      const timeSlotsToCreate = []
      
      // Days: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday
      for (let day = 1; day <= 5; day++) {
        // Times: 13:30-14:30, 14:30-15:30, ..., 20:30-21:30
        for (let hour = 13; hour <= 20; hour++) {
          const startTime = `${hour.toString().padStart(2, '0')}:30`
          const endTime = `${(hour + 1).toString().padStart(2, '0')}:30`
          
          timeSlotsToCreate.push({
            dayOfWeek: day,
            startTime,
            endTime,
            maxTeams: 5,
            isActive: true
          })
        }
      }
      
      await prisma.timeslot.createMany({
        data: timeSlotsToCreate
      })
    }

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