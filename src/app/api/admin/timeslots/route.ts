import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // First get all timeslots
    const { data: timeslots, error: timeslotsError } = await supabaseAdmin
      .from('timeslots')
      .select('*')
      .order('dayOfWeek', { ascending: true })
      .order('startTime', { ascending: true })

    if (timeslotsError) {
      throw timeslotsError
    }

    // Then get counts for each timeslot
    const timeslotsWithCounts = await Promise.all(
      (timeslots || []).map(async (timeslot) => {
        const [preferencesResult, assignmentsResult] = await Promise.all([
          supabaseAdmin
            .from('team_preferences')
            .select('id', { count: 'exact', head: true })
            .eq('timeslotId', timeslot.id),
          supabaseAdmin
            .from('assignments')
            .select('id', { count: 'exact', head: true })
            .eq('timeslotId', timeslot.id)
        ])

        return {
          ...timeslot,
          _count: {
            preferences: preferencesResult.count || 0,
            assignments: assignmentsResult.count || 0
          }
        }
      })
    )

    return NextResponse.json(timeslotsWithCounts)
  } catch (error) {
    console.error('Error fetching timeslots:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen tijdsloten' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { timeslotId, isActive } = await request.json()

    const { data: updatedTimeslot, error } = await supabaseAdmin
      .from('timeslots')
      .update({ isActive })
      .eq('id', timeslotId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      timeslot: updatedTimeslot,
      message: `Tijdslot ${isActive ? 'geactiveerd' : 'gedeactiveerd'}`
    })
  } catch (error) {
    console.error('Error updating timeslot:', error)
    return NextResponse.json(
      { error: 'Fout bij bijwerken tijdslot' },
      { status: 500 }
    )
  }
}