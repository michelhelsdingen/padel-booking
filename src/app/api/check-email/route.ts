import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if email already exists
    const { data: existingTeam, error } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('contactEmail', email.toLowerCase().trim())
      .limit(1)

    if (error) {
      console.error('Error checking email:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const exists = existingTeam && existingTeam.length > 0

    return NextResponse.json({ 
      exists,
      message: exists ? 'Dit e-mailadres is al geregistreerd' : 'E-mailadres is beschikbaar'
    })
  } catch (error) {
    console.error('Error in check-email endpoint:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}