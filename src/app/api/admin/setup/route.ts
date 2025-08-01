import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Check if timeslots exist
    const existingTimeslots = await prisma.timeslot.count()
    
    if (existingTimeslots === 0) {
      // Create default timeslots for Monday to Friday, 13:30-21:30
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

    // Check if registration period exists
    const activeRegistration = await prisma.registrationPeriod.findFirst({
      where: { isActive: true }
    })
    
    if (!activeRegistration) {
      const now = new Date()
      const registrationEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days
      const lotteryDate = new Date(registrationEnd.getTime() + (1 * 24 * 60 * 60 * 1000)) // 1 day after

      await prisma.registrationPeriod.create({
        data: {
          name: `Inschrijfperiode ${now.toLocaleDateString('nl-NL')}`,
          registrationStart: now,
          registrationEnd: registrationEnd,
          lotteryDate: lotteryDate,
          isActive: true,
          description: 'Automatisch aangemaakte inschrijfperiode'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed',
      timeslotsCreated: existingTimeslots === 0,
      registrationPeriodCreated: !activeRegistration
    })

  } catch (error) {
    console.error('Error setting up database:', error)
    return NextResponse.json(
      { error: 'Fout bij database setup' },
      { status: 500 }
    )
  }
}