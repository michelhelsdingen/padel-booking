import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Check if timeslots exist, create them if they don't
    const { count } = await supabaseAdmin
      .from('Timeslot')
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
        .from('Timeslot')
        .insert(timeSlotsToCreate)
        
      if (insertError) {
        throw insertError
      }
    }

    // Get timeslots with preference counts
    const { data: timeslots, error } = await supabaseAdmin
      .from('Timeslot')
      .select(`
        id,
        dayOfWeek,
        startTime,
        endTime,
        maxTeams,
        isActive,
        TeamPreference(*)
      `)
      .eq('isActive', true)
      .order('dayOfWeek', { ascending: true })
      .order('startTime', { ascending: true })

    if (error) {
      throw error
    }

    // Format the response to match expected structure
    const timeslotsWithCounts = timeslots?.map(timeslot => ({
      id: timeslot.id,
      dayOfWeek: timeslot.dayOfWeek,
      startTime: timeslot.startTime,
      endTime: timeslot.endTime,
      maxTeams: timeslot.maxTeams,
      isActive: timeslot.isActive,
      preferenceCount: Array.isArray(timeslot.TeamPreference) ? timeslot.TeamPreference.length : 0
    })) || []

    return NextResponse.json(timeslotsWithCounts)
  } catch (error) {
    console.error('Error fetching timeslots:', error)
    return NextResponse.json(
      { 
        error: 'Fout bij ophalen tijdsloten',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}