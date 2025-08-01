import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    // Count teams before deletion
    const { count: teamCount } = await supabaseAdmin
      .from('teams')
      .select('*', { count: 'exact', head: true })
    
    // Clear all data in the correct order due to foreign key constraints
    // Delete assignments first (has foreign keys to teams and timeslots)
    await supabaseAdmin.from('assignments').delete().neq('id', '')
    
    // Delete team preferences (has foreign keys to teams and timeslots)
    await supabaseAdmin.from('team_preferences').delete().neq('id', '')
    
    // Delete team members (has foreign key to teams)
    await supabaseAdmin.from('team_members').delete().neq('id', '')
    
    // Finally delete teams
    await supabaseAdmin.from('teams').delete().neq('id', '')

    return NextResponse.json({ 
      success: true,
      deletedCount: teamCount || 0,
      message: `Alle ${teamCount || 0} teams zijn succesvol verwijderd`
    })
  } catch (error) {
    console.error('Error clearing all teams:', error)
    return NextResponse.json(
      { error: 'Fout bij verwijderen van alle teams' },
      { status: 500 }
    )
  }
}