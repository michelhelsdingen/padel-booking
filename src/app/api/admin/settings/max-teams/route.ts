import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'max_teams_per_timeslot')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    const maxTeams = data?.value ? parseInt(data.value) : 5
    
    return NextResponse.json({ maxTeams })
  } catch (error) {
    console.error('Error fetching max teams setting:', error)
    return NextResponse.json({ maxTeams: 5 }) // fallback
  }
}

export async function POST(request: NextRequest) {
  try {
    const { maxTeams } = await request.json()

    if (!maxTeams || maxTeams < 1 || maxTeams > 10) {
      return NextResponse.json(
        { error: 'Max teams must be between 1 and 10' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({
        key: 'max_teams_per_timeslot',
        value: maxTeams.toString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, maxTeams })
  } catch (error) {
    console.error('Error saving max teams setting:', error)
    return NextResponse.json(
      { error: 'Failed to save setting' },
      { status: 500 }
    )
  }
}