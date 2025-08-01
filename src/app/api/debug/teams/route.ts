import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Get all teams to debug
    const { data: teams, error } = await supabaseAdmin
      .from('teams')
      .select('id, contactEmail, firstName, lastName, createdAt')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching teams:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      teams: teams || [],
      count: teams?.length || 0
    })
  } catch (error) {
    console.error('Error in debug teams endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}