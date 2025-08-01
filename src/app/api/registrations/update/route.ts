import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { completeRegistrationSchema } from '@/lib/validations'
import { sendConfirmationEmail } from '@/lib/email'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

export async function PUT(request: NextRequest) {
  try {
    console.log('Registration UPDATE request received')
    
    const requestText = await request.text()
    console.log('Raw request text:', requestText)
    
    if (!requestText || requestText.length === 0) {
      console.error('Empty request body')
      return NextResponse.json(
        { error: 'Request body is empty' },
        { status: 400 }
      )
    }
    
    let body
    try {
      body = JSON.parse(requestText)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    const { teamId, ...formData } = body
    
    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required for updates' },
        { status: 400 }
      )
    }
    
    // Validate request data
    const validatedData = completeRegistrationSchema.parse(formData)
    console.log('Data validated successfully')
    
    // Check if team exists
    const { data: existingTeam, error: teamCheckError } = await supabaseAdmin
      .from('teams')
      .select('id, contactEmail')
      .eq('id', teamId)
      .single()
      
    if (teamCheckError || !existingTeam) {
      return NextResponse.json(
        { error: 'Team niet gevonden' },
        { status: 404 }
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

    const timestamp = new Date().toISOString()
    
    // Update team
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .update({
        firstName: validatedData.team.firstName,
        lastName: validatedData.team.lastName,
        contactEmail: validatedData.team.contactEmail,
        memberCount: validatedData.team.members.length + 1, // +1 for the contact person
        updatedAt: timestamp
      })
      .eq('id', teamId)
      .select()
      .single()

    if (teamError) {
      console.error('Team update error:', teamError)
      throw teamError
    }

    // Delete existing members and preferences
    await Promise.all([
      supabaseAdmin.from('team_members').delete().eq('teamId', teamId),
      supabaseAdmin.from('team_preferences').delete().eq('teamId', teamId)
    ])

    // Create new team members
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

    // Create new preferences
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
    const { data: teamWithDetails, error: fetchError } = await supabaseAdmin
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
      
    if (fetchError) {
      console.error('Error fetching team details for email:', fetchError)
    }

    if (teamWithDetails) {
      // Send confirmation email
      try {
        console.log('Attempting to send update confirmation email to:', teamWithDetails.contactEmail)
        await sendConfirmationEmail(teamWithDetails)
        console.log('Update confirmation email sent successfully')
      } catch (emailError) {
        console.error('Failed to send update confirmation email:', emailError)
        // Don't fail the update if email fails
      }
    }

    return NextResponse.json({
      success: true,
      teamId: team.id,
      message: 'Je gegevens zijn succesvol bijgewerkt. Je ontvangt een bevestigingsmail.'
    })

  } catch (error) {
    console.error('Registration update error:', error)
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
        error: 'Er is een fout opgetreden bij het bijwerken van je gegevens',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error?.constructor?.name
      },
      { status: 500 }
    )
  }
}