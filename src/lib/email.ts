import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface TeamData {
  id: string
  firstName: string
  lastName: string
  contactEmail: string
  memberCount: number
  members: Array<{
    firstName: string
    lastName: string
    email: string
  }>
  preferences: Array<{
    timeslot: {
      dayOfWeek: number
      startTime: string
      endTime: string
    }
    priority: number
  }>
}

const getDayName = (dayOfWeek: number): string => {
  const days = ['', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag']
  return days[dayOfWeek] || ''
}

export async function sendConfirmationEmail(team: TeamData) {
  try {
    // Sort preferences by priority
    const sortedPreferences = [...team.preferences].sort((a, b) => a.priority - b.priority)
    
    // Create HTML email template
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #4a5568;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background-color: #f7fafc;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .section {
          margin-bottom: 25px;
        }
        .label {
          font-weight: bold;
          color: #2d3748;
        }
        .preferences {
          background-color: white;
          padding: 15px;
          border-radius: 8px;
          margin-top: 10px;
        }
        .preference-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .preference-item:last-child {
          border-bottom: none;
        }
        .priority {
          background-color: #48bb78;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 14px;
        }
        .team-members {
          background-color: white;
          padding: 15px;
          border-radius: 8px;
          margin-top: 10px;
        }
        .member-item {
          padding: 5px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 14px;
          color: #718096;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Inschrijving Bevestigd</h1>
        <p>LTC de Kei - Padellessen</p>
      </div>
      
      <div class="content">
        <div class="section">
          <p>Beste ${team.firstName} ${team.lastName},</p>
          <p>Bedankt voor je inschrijving voor de padellessen bij LTC de Kei! We hebben je aanmelding succesvol ontvangen.</p>
        </div>

        <div class="section">
          <p class="label">Teamgegevens:</p>
          <div class="team-members">
            <div class="member-item">
              <strong>Contactpersoon:</strong> ${team.firstName} ${team.lastName} (${team.contactEmail})
            </div>
            ${team.members.map(member => `
              <div class="member-item">
                <strong>Teamlid:</strong> ${member.firstName} ${member.lastName} (${member.email})
              </div>
            `).join('')}
          </div>
        </div>

        <div class="section">
          <p class="label">Voorkeurtijdsloten:</p>
          <div class="preferences">
            ${sortedPreferences.map(pref => `
              <div class="preference-item">
                <span>${getDayName(pref.timeslot.dayOfWeek)} ${pref.timeslot.startTime} - ${pref.timeslot.endTime}</span>
                <span class="priority">Prioriteit ${pref.priority}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="section">
          <p><strong>Wat gebeurt er nu?</strong></p>
          <ul>
            <li>Na sluiting van de inschrijfperiode vindt de loting plaats</li>
            <li>Je ontvangt een e-mail met je toegewezen tijdslot</li>
            <li>Het toegewezen tijdslot geldt voor de hele lesperiode</li>
          </ul>
        </div>

        <div class="footer">
          <p>Met vriendelijke groet,<br>LTC de Kei</p>
          <p style="font-size: 12px;">Deze e-mail is automatisch verstuurd. Voor vragen kun je contact opnemen via padel@ltcdekei.nl</p>
        </div>
      </div>
    </body>
    </html>
    `

    // Send email
    const { data, error } = await resend.emails.send({
      from: 'LTC de Kei Padel <padel@ltcdekei.nl>',
      to: team.contactEmail,
      subject: 'Bevestiging inschrijving padellessen - LTC de Kei',
      html: html,
    })

    if (error) {
      console.error('Error sending email:', error)
      throw error
    }

    console.log('Confirmation email sent successfully:', data)
    return data
  } catch (error) {
    console.error('Failed to send confirmation email:', error)
    throw error
  }
}