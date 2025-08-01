import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendAssignmentEmail, sendWaitlistEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { teamIds, emailType } = await request.json()
    
    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
      return NextResponse.json(
        { error: 'Geen teams geselecteerd' },
        { status: 400 }
      )
    }

    if (!emailType || !['assignment', 'waitlist', 'all'].includes(emailType)) {
      return NextResponse.json(
        { error: 'Ongeldig email type' },
        { status: 400 }
      )
    }

    console.log(`Sending ${emailType} emails to ${teamIds.length} teams`)

    let successCount = 0
    let errorCount = 0
    const results: Array<{ teamId: string, success: boolean, error?: string }> = []

    for (const teamId of teamIds) {
      try {
        // Get team details with assignment/waitlist status
        const { data: team, error: teamError } = await supabaseAdmin
          .from('teams')
          .select(`
            *,
            assignment:assignments(
              *,
              timeslot:timeslots(*)
            )
          `)
          .eq('id', teamId)
          .single()

        if (teamError || !team) {
          console.error(`Team ${teamId} not found:`, teamError)
          results.push({ teamId, success: false, error: 'Team niet gevonden' })
          errorCount++
          continue
        }

        const hasAssignment = team.assignment && team.assignment.length > 0
        let emailSent = false

        if (emailType === 'assignment' && hasAssignment) {
          // Send assignment email
          await sendAssignmentEmail({
            ...team,
            assignment: team.assignment[0]
          })
          emailSent = true
        } else if (emailType === 'waitlist' && !hasAssignment) {
          // Send waitlist email
          await sendWaitlistEmail(team)
          emailSent = true
        } else if (emailType === 'all') {
          // Send appropriate email based on status
          if (hasAssignment) {
            await sendAssignmentEmail({
              ...team,
              assignment: team.assignment[0]
            })
          } else {
            await sendWaitlistEmail(team)
          }
          emailSent = true
        }

        if (emailSent) {
          // Update email sent status in assignments table if applicable
          if (hasAssignment) {
            await supabaseAdmin
              .from('assignments')
              .update({ 
                emailsent: true, 
                emailsentat: new Date().toISOString() 
              })
              .eq('teamId', teamId)
          }

          results.push({ teamId, success: true })
          successCount++
          console.log(`Email sent successfully to team ${teamId}`)
        } else {
          results.push({ teamId, success: false, error: 'Geen geschikt email type voor dit team' })
          errorCount++
        }

      } catch (emailError) {
        console.error(`Failed to send email to team ${teamId}:`, emailError)
        results.push({ 
          teamId, 
          success: false, 
          error: `Email verzenden mislukt: ${emailError instanceof Error ? emailError.message : 'Unknown error'}` 
        })
        errorCount++
      }

      // Small delay to avoid overwhelming the email service
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`Email sending completed: ${successCount} success, ${errorCount} errors`)

    return NextResponse.json({
      success: true,
      message: `${successCount} emails succesvol verstuurd${errorCount > 0 ? `, ${errorCount} fouten` : ''}`,
      results: {
        successCount,
        errorCount,
        details: results
      }
    })

  } catch (error) {
    console.error('Error in send-emails endpoint:', error)
    
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het versturen van emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}