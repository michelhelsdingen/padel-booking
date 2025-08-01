import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatTimeslot } from '@/lib/utils'

// This is a placeholder for the email notification system
// In production, you would integrate with a service like SendGrid, Nodemailer, etc.

export async function POST() {
  try {
    // Get all teams with their assignments
    const teamsWithAssignments = await prisma.team.findMany({
      include: {
        assignments: {
          include: {
            timeslot: true
          }
        },
        members: true
      }
    })

    const emailsSent = []
    const emailsFailed = []

    for (const team of teamsWithAssignments) {
      try {
        if (team.assignments.length > 0) {
          // Team has assignment - send success email
          const assignment = team.assignments[0] // Assuming one assignment per team
          const timeslotInfo = formatTimeslot(
            assignment.timeslot.dayOfWeek,
            assignment.timeslot.startTime,
            assignment.timeslot.endTime
          )

          // TODO: Send actual email
          // await sendAssignmentEmail(team.contactEmail, {
          //   teamName: team.name,
          //   timeslot: timeslotInfo,
          //   members: team.members
          // })

          console.log(`Would send assignment email to ${team.contactEmail}: ${timeslotInfo}`)
          emailsSent.push(team.contactEmail)
        } else {
          // Team has no assignment - send waiting list email
          // TODO: Send actual email
          // await sendWaitingListEmail(team.contactEmail, {
          //   teamName: team.name
          // })

          console.log(`Would send waiting list email to ${team.contactEmail}`)
          emailsSent.push(team.contactEmail)
        }
      } catch (error) {
        console.error(`Failed to send email to ${team.contactEmail}:`, error)
        emailsFailed.push(team.contactEmail)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notificaties verstuurd naar ${emailsSent.length} teams`,
      emailsSent: emailsSent.length,
      emailsFailed: emailsFailed.length,
      failedEmails: emailsFailed
    })
  } catch (error) {
    console.error('Error sending notifications:', error)
    return NextResponse.json(
      { error: 'Fout bij versturen notificaties' },
      { status: 500 }
    )
  }
}

// Placeholder email functions - implement with your preferred email service
async function sendAssignmentEmail(email: string, data: {
  teamName: string
  timeslot: string
  members: any[]
}) {
  // Implementation with email service
  console.log('Send assignment email:', { email, data })
}

async function sendWaitingListEmail(email: string, data: {
  teamName: string
}) {
  // Implementation with email service
  console.log('Send waiting list email:', { email, data })
}