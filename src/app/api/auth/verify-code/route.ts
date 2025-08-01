import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json()
    
    if (!email || !code) {
      return NextResponse.json({ error: 'E-mailadres en code zijn verplicht' }, { status: 400 })
    }

    // Find the team first
    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('contactEmail', email.toLowerCase().trim())
      .limit(1)
      .single()

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team niet gevonden' }, { status: 404 })
    }

    // Find valid, unused code
    const { data: editCode, error: codeError } = await supabaseAdmin
      .from('edit_codes')
      .select('*')
      .eq('team_id', team.id)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (codeError || !editCode) {
      return NextResponse.json({ 
        error: 'Ongeldige of verlopen code',
        expired: true 
      }, { status: 400 })
    }

    // Mark code as used
    await supabaseAdmin
      .from('edit_codes')
      .update({ used: true })
      .eq('id', editCode.id)

    // Get full team data with members and preferences
    const { data: fullTeam, error: fullTeamError } = await supabaseAdmin
      .from('teams')
      .select(`
        *,
        members:team_members(
          firstName,
          lastName,
          email
        ),
        preferences:team_preferences(
          *,
          timeslot:timeslots(
            id,
            dayOfWeek,
            startTime,
            endTime
          )
        )
      `)
      .eq('id', team.id)
      .single()

    if (fullTeamError) {
      throw fullTeamError
    }

    // Transform the data to match the form structure
    const formData = {
      team: {
        firstName: fullTeam.firstName,
        lastName: fullTeam.lastName,
        contactEmail: fullTeam.contactEmail,
        members: fullTeam.members
          .filter((member: { firstName: string; lastName: string; email: string }) => member.email !== fullTeam.contactEmail) // Exclude contact person
          .map((member: { firstName: string; lastName: string; email: string }) => ({
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email || ''
          }))
      },
      preferences: {
        preferences: fullTeam.preferences
          .map((pref: { timeslotId: string; priority: number }) => ({
            timeslotId: pref.timeslotId,
            priority: pref.priority
          }))
          .sort((a: { priority: number }, b: { priority: number }) => a.priority - b.priority)
      }
    }

    return NextResponse.json({
      success: true,
      teamId: fullTeam.id,
      formData,
      isEdit: true
    })
  } catch (error) {
    console.error('Error in verify-code endpoint:', error)
    return NextResponse.json({ error: 'Server fout' }, { status: 500 })
  }
}