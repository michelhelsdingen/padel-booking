import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const timeslots = await prisma.timeslot.findMany({
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })
    
    return NextResponse.json(timeslots)
  } catch (error) {
    console.error('Error fetching timeslots:', error)
    return NextResponse.json(
      { message: 'Fout bij ophalen van tijdsloten' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()
    
    // Update maxTeams for all existing timeslots
    await prisma.timeslot.updateMany({
      data: { maxTeams: config.maxTeamsPerSlot }
    })
    
    // Handle day activation/deactivation
    for (const [day, isActive] of Object.entries(config.activeDays)) {
      const dayNum = parseInt(day)
      
      if (isActive) {
        // Ensure all time slots exist for this day
        for (const slot of config.timeSlots) {
          if (slot.enabled) {
            await prisma.timeslot.upsert({
              where: {
                dayOfWeek_startTime: {
                  dayOfWeek: dayNum,
                  startTime: slot.startTime
                }
              },
              update: {
                endTime: slot.endTime,
                maxTeams: config.maxTeamsPerSlot,
                isActive: true
              },
              create: {
                dayOfWeek: dayNum,
                startTime: slot.startTime,
                endTime: slot.endTime,
                maxTeams: config.maxTeamsPerSlot,
                isActive: true
              }
            })
          }
        }
      } else {
        // Deactivate all slots for this day
        await prisma.timeslot.updateMany({
          where: { dayOfWeek: dayNum },
          data: { isActive: false }
        })
      }
    }
    
    // Handle individual timeslot enabling/disabling
    for (const slot of config.timeSlots) {
      for (const [day, isDayActive] of Object.entries(config.activeDays)) {
        const dayNum = parseInt(day)
        
        if (isDayActive) {
          await prisma.timeslot.updateMany({
            where: {
              dayOfWeek: dayNum,
              startTime: slot.startTime
            },
            data: { isActive: slot.enabled }
          })
        }
      }
    }
    
    return NextResponse.json({ message: 'Tijdslot configuratie succesvol opgeslagen' })
  } catch (error) {
    console.error('Error updating timeslot config:', error)
    return NextResponse.json(
      { message: 'Fout bij opslaan van tijdslot configuratie' },
      { status: 500 }
    )
  }
}