import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: teams, error } = await supabaseAdmin
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
        ),
        assignments:assignments(
          *,
          timeslot:timeslots(
            id,
            dayOfWeek,
            startTime,
            endTime
          )
        )
      `)
      .order('createdAt', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(teams || [])
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen teams' },
      { status: 500 }
    )
  }
}