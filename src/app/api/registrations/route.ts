import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { completeRegistrationSchema } from '@/lib/validations'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request data
    const validatedData = completeRegistrationSchema.parse(body)
    
    // Check if registration period is active, create one if none exists
    let activeRegistration = await prisma.registrationPeriod.findFirst({
      where: { isActive: true }
    })
    
    if (!activeRegistration) {
      // Auto-create an active registration period
      const now = new Date()
      const registrationEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days
      const lotteryDate = new Date(registrationEnd.getTime() + (1 * 24 * 60 * 60 * 1000)) // 1 day after

      activeRegistration = await prisma.registrationPeriod.create({
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
    
    const now = new Date()
    if (now < activeRegistration.registrationStart || now > activeRegistration.registrationEnd) {
      return NextResponse.json(
        { error: 'De inschrijfperiode is gesloten' },
        { status: 400 }
      )
    }
    
    // Check if team email is already registered
    const existingTeam = await prisma.team.findUnique({
      where: { contactEmail: validatedData.team.contactEmail }
    })
    
    if (existingTeam) {
      return NextResponse.json(
        { error: 'Dit e-mailadres is al geregistreerd' },
        { status: 400 }
      )
    }
    
    // Validate timeslots exist
    const timeslotIds = validatedData.preferences.preferences.map(p => p.timeslotId)
    const timeslots = await prisma.timeslot.findMany({
      where: { 
        id: { in: timeslotIds },
        isActive: true
      }
    })
    
    if (timeslots.length !== timeslotIds.length) {
      return NextResponse.json(
        { error: 'Een of meer geselecteerde tijdsloten zijn niet geldig' },
        { status: 400 }
      )
    }

    // Create team with members and preferences in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create team
      const team = await tx.team.create({
        data: {
          firstName: validatedData.team.firstName,
          lastName: validatedData.team.lastName,
          contactEmail: validatedData.team.contactEmail,
          memberCount: validatedData.team.members.length + 1, // +1 for the contact person
        }
      })

      // Create team members
      await tx.teamMember.createMany({
        data: [
          // Add contact person as first member
          {
            teamId: team.id,
            firstName: validatedData.team.firstName,
            lastName: validatedData.team.lastName,
            email: validatedData.team.contactEmail
          },
          // Add other members
          ...validatedData.team.members.map(member => ({
            teamId: team.id,
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email
          }))
        ]
      })

      // Create preferences
      await tx.teamPreference.createMany({
        data: validatedData.preferences.preferences.map(pref => ({
          teamId: team.id,
          timeslotId: pref.timeslotId,
          priority: pref.priority
        }))
      })

      return team
    })

    // TODO: Send confirmation email here
    // await sendConfirmationEmail(result, validatedData)

    return NextResponse.json({
      success: true,
      teamId: result.id,
      message: 'Team succesvol ingeschreven'
    })

  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ongeldige gegevens', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij de inschrijving' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        members: true,
        preferences: {
          include: {
            timeslot: true
          },
          orderBy: { priority: 'asc' }
        },
        assignments: {
          include: {
            timeslot: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen inschrijvingen' },
      { status: 500 }
    )
  }
}