import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const periods = await prisma.registrationPeriod.findMany({
      orderBy: { registrationStart: 'desc' }
    })
    
    return NextResponse.json(periods)
  } catch (error) {
    console.error('Error fetching periods:', error)
    return NextResponse.json(
      { message: 'Fout bij ophalen van periodes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Deactivate all current periods
    await prisma.registrationPeriod.updateMany({
      data: { isActive: false }
    })
    
    // Create new period
    const period = await prisma.registrationPeriod.create({
      data: {
        name: data.name,
        registrationStart: new Date(data.registrationStart),
        registrationEnd: new Date(data.registrationEnd),
        lotteryDate: new Date(data.lotteryDate),
        description: data.description || null,
        isActive: true
      }
    })
    
    return NextResponse.json(period)
  } catch (error) {
    console.error('Error creating period:', error)
    return NextResponse.json(
      { message: 'Fout bij aanmaken van periode' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, ...data } = await request.json()
    
    const period = await prisma.registrationPeriod.update({
      where: { id },
      data: {
        name: data.name,
        registrationStart: data.registrationStart ? new Date(data.registrationStart) : undefined,
        registrationEnd: data.registrationEnd ? new Date(data.registrationEnd) : undefined,
        lotteryDate: data.lotteryDate ? new Date(data.lotteryDate) : undefined,
        description: data.description,
        isActive: data.isActive
      }
    })
    
    return NextResponse.json(period)
  } catch (error) {
    console.error('Error updating period:', error)
    return NextResponse.json(
      { message: 'Fout bij bijwerken van periode' },
      { status: 500 }
    )
  }
}