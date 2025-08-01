import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEditCodeEmail } from '@/lib/email'

// Generate a 6-digit random code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'E-mailadres is verplicht' }, { status: 400 })
    }

    // Check if team exists with this email
    const { data: existingTeam, error: checkError } = await supabaseAdmin
      .from('teams')
      .select('id, firstName, lastName, contactEmail')
      .eq('contactEmail', email.toLowerCase().trim())
      .limit(1)

    if (checkError) {
      console.error('Error checking for existing team:', checkError)
      return NextResponse.json({ error: 'Database fout' }, { status: 500 })
    }

    if (!existingTeam || existingTeam.length === 0) {
      return NextResponse.json({ error: 'Geen team gevonden met dit e-mailadres' }, { status: 404 })
    }

    const team = existingTeam[0]
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

    // Store the code in the database (we'll need to create a table for this)
    const { error: insertError } = await supabaseAdmin
      .from('edit_codes')
      .insert({
        team_id: team.id,
        code,
        expires_at: expiresAt.toISOString(),
        used: false
      })

    if (insertError) {
      console.error('Error storing edit code:', insertError)
      return NextResponse.json({ error: 'Fout bij aanmaken code' }, { status: 500 })
    }

    // Send email with the code
    try {
      await sendEditCodeEmail({
        email: team.contactEmail,
        firstName: team.firstName,
        lastName: team.lastName,
        code
      })
    } catch (emailError) {
      console.error('Error sending edit code email:', emailError)
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({
      success: true,
      message: 'Een wijzigingscode is verstuurd naar je e-mailadres'
    })
  } catch (error) {
    console.error('Error in send-code endpoint:', error)
    return NextResponse.json({ error: 'Server fout' }, { status: 500 })
  }
}