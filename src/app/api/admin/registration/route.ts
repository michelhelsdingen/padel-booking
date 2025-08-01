import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Check if there's already an active registration period
    const existing = await prisma.registrationPeriod.findFirst({
      where: { isActive: true }
    })

    if (existing) {
      return NextResponse.json({
        message: 'Er is al een actieve inschrijfperiode',
        period: existing
      })
    }

    // Create a new active registration period (30 days from now)
    const now = new Date()
    const registrationEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days
    const lotteryDate = new Date(registrationEnd.getTime() + (1 * 24 * 60 * 60 * 1000)) // 1 day after registration ends

    const period = await prisma.registrationPeriod.create({
      data: {
        name: `Inschrijfperiode ${now.toLocaleDateString('nl-NL')}`,
        registrationStart: now,
        registrationEnd: registrationEnd,
        lotteryDate: lotteryDate,
        isActive: true,
        description: 'Automatisch aangemaakte inschrijfperiode'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Actieve inschrijfperiode aangemaakt',
      period
    })

  } catch (error) {
    console.error('Error creating registration period:', error)
    return NextResponse.json(
      { error: 'Fout bij aanmaken inschrijfperiode' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const periods = await prisma.registrationPeriod.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(periods)
  } catch (error) {
    console.error('Error fetching registration periods:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen inschrijfperiodes' },
      { status: 500 }
    )
  }
}