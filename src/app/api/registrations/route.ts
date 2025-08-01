import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { completeRegistrationSchema } from '@/lib/validations'
import { sendConfirmationEmail } from '@/lib/email'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    console.log('Registration POST request received')
    const body = await request.json()
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    // Validate request data
    const validatedData = completeRegistrationSchema.parse(body)
    console.log('Data validated successfully')
    
    // Ensure timeslots exist, create default ones if none exist
    const { count } = await supabaseAdmin
      .from('timeslots')
      .select('*', { count: 'exact', head: true })
      
    if (count === 0) {
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
      
      const { error: insertError } = await supabaseAdmin
        .from('timeslots')
        .insert(timeSlotsToCreate)
        
      if (insertError) {
        throw insertError
      }
    }
    
    // Check if registration period is active, create one if none exists
    const { data: activeRegistrations } = await supabaseAdmin
      .from('registration_periods')
      .select('*')
      .eq('isActive', true)
      .limit(1)
      
    let activeRegistration = activeRegistrations?.[0]
    
    if (!activeRegistration) {
      // Auto-create an active registration period
      const now = new Date()
      const registrationEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days
      const lotteryDate = new Date(registrationEnd.getTime() + (1 * 24 * 60 * 60 * 1000)) // 1 day after

      const { data: newRegistration, error: createError } = await supabaseAdmin
        .from('registration_periods')
        .insert({
          name: `Inschrijfperiode ${now.toLocaleDateString('nl-NL')}`,
          registrationStart: now.toISOString(),
          registrationEnd: registrationEnd.toISOString(),
          lotteryDate: lotteryDate.toISOString(),
          isActive: true,
          description: 'Automatisch aangemaakte inschrijfperiode'
        })
        .select()
        .single()
        
      if (createError) {
        throw createError
      }
      
      activeRegistration = newRegistration
    }
    
    const now = new Date()
    const regStart = new Date(activeRegistration.registrationStart)
    const regEnd = new Date(activeRegistration.registrationEnd)
    
    if (now < regStart || now > regEnd) {
      return NextResponse.json(
        { error: 'De inschrijfperiode is gesloten' },
        { status: 400 }
      )
    }
    
    // Check if team email is already registered
    const { data: existingTeam } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('contactEmail', validatedData.team.contactEmail)
      .limit(1)
    
    if (existingTeam && existingTeam.length > 0) {
      return NextResponse.json(
        { error: 'Dit e-mailadres is al geregistreerd' },
        { status: 400 }
      )
    }
    
    // Validate timeslots exist
    const timeslotIds = validatedData.preferences.preferences.map(p => p.timeslotId)
    const { data: timeslots } = await supabaseAdmin
      .from('timeslots')
      .select('id')
      .in('id', timeslotIds)
      .eq('isActive', true)
    
    if (!timeslots || timeslots.length !== timeslotIds.length) {
      return NextResponse.json(
        { error: 'Een of meer geselecteerde tijdsloten zijn niet geldig' },
        { status: 400 }
      )
    }

    // Create team with generated UUID
    const teamId = uuidv4()
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .insert({
        id: teamId,
        firstName: validatedData.team.firstName,
        lastName: validatedData.team.lastName,
        contactEmail: validatedData.team.contactEmail,
        memberCount: validatedData.team.members.length + 1, // +1 for the contact person
      })
      .select()
      .single()

    if (teamError) {
      throw teamError
    }

    // Create team members
    const membersToCreate = [
      // Add contact person as first member
      {
        id: uuidv4(),
        teamId: team.id,
        firstName: validatedData.team.firstName,
        lastName: validatedData.team.lastName,
        email: validatedData.team.contactEmail
      },
      // Add other members
      ...validatedData.team.members.map(member => ({
        id: uuidv4(),
        teamId: team.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email
      }))
    ]

    const { error: membersError } = await supabaseAdmin
      .from('team_members')
      .insert(membersToCreate)

    if (membersError) {
      throw membersError
    }

    // Create preferences
    const preferencesToCreate = validatedData.preferences.preferences.map(pref => ({
      id: uuidv4(),
      teamId: team.id,
      timeslotId: pref.timeslotId,
      priority: pref.priority
    }))

    const { error: preferencesError } = await supabaseAdmin
      .from('team_preferences')
      .insert(preferencesToCreate)

    if (preferencesError) {
      throw preferencesError
    }

    // Get team data with preferences and members for email
    const { data: teamWithDetails } = await supabaseAdmin
      .from('teams')
      .select(`
        *,
        members:team_members(*),
        preferences:team_preferences(
          *,
          timeslot:timeslots(*)
        )
      `)
      .eq('id', team.id)
      .single()

    if (teamWithDetails) {
      // Send confirmation email
      try {
        console.log('Attempting to send confirmation email to:', teamWithDetails.contactEmail)
        await sendConfirmationEmail(teamWithDetails)
        console.log('Confirmation email sent successfully')
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
        console.error('Email error details:', {
          message: emailError instanceof Error ? emailError.message : 'Unknown error',
          type: emailError?.constructor?.name
        })
        // Don't fail the registration if email fails
      }
    }

    return NextResponse.json({
      success: true,
      teamId: team.id,
      message: 'Team succesvol ingeschreven. Je ontvangt een bevestigingsmail.'
    })

  } catch (error) {
    console.error('Registration error:', error)
    console.error('Error type:', error?.constructor?.name)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ongeldige gegevens', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij de inschrijving',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const { data: teams, error } = await supabaseAdmin
      .from('teams')
      .select(`
        *,
        members:team_members(*),
        preferences:team_preferences(
          *,
          timeslot:timeslots(*)
        ),
        assignments:assignments(
          *,
          timeslot:timeslots(*)
        )
      `)
      .order('createdAt', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(teams || [])
  } catch (error) {
    console.error('Error fetching registrations:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen inschrijvingen' },
      { status: 500 }
    )
  }
}