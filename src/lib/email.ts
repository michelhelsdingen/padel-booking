import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY is not set in environment variables')
}

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy-key-for-dev')

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

interface AssignmentData {
  id: string
  firstName: string
  lastName: string
  contactEmail: string
  assignment: {
    timeslot: {
      dayOfWeek: number
      startTime: string
      endTime: string
    }
  }
}

interface WaitlistData {
  id: string
  firstName: string
  lastName: string
  contactEmail: string
}

interface EditCodeData {
  email: string
  firstName: string
  lastName: string
  code: string
}

export async function sendEditCodeEmail(data: EditCodeData) {
  try {
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
        .code-box {
          background-color: #2d3748;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 4px;
        }
        .warning {
          background-color: #fed7d7;
          border: 1px solid #fc8181;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
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
        <h1>Wijzigingscode voor je Inschrijving</h1>
        <p>LTC de Kei - Padellessen</p>
      </div>
      
      <div class="content">
        <p>Beste ${data.firstName} ${data.lastName},</p>
        <p>Je hebt een wijzigingscode aangevraagd voor je inschrijving bij de padellessen. Gebruik onderstaande code om je gegevens te wijzigen:</p>
        
        <div class="code-box">
          ${data.code}
        </div>
        
        <div class="warning">
          <strong>Let op:</strong>
          <ul>
            <li>Deze code is 15 minuten geldig</li>
            <li>De code kan maar één keer gebruikt worden</li>
            <li>Deel deze code niet met anderen</li>
          </ul>
        </div>
        
        <p>Als je deze code niet hebt aangevraagd, kun je deze e-mail negeren.</p>
        
        <div class="footer">
          <p>Met vriendelijke groet,<br>LTC de Kei</p>
          <p style="font-size: 12px;">Deze e-mail is automatisch verstuurd. Voor vragen kun je contact opnemen via padel@ltcdekei.nl</p>
        </div>
      </div>
    </body>
    </html>
    `

    const { data: emailData, error } = await resend.emails.send({
      from: 'LTC de Kei Padel <padel@ltcdekei.nl>',
      to: data.email,
      subject: 'Wijzigingscode voor je padel inschrijving - LTC de Kei',
      html: html,
    })

    if (error) {
      console.error('Error sending edit code email:', error)
      throw error
    }

    console.log('Edit code email sent successfully:', emailData)
    return emailData
  } catch (error) {
    console.error('Failed to send edit code email:', error)
    throw error
  }
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

export async function sendAssignmentEmail(data: AssignmentData) {
  try {
    const timeslot = data.assignment.timeslot
    const dayName = getDayName(timeslot.dayOfWeek)
    
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
          background-color: #48bb78;
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
        .assignment-box {
          background-color: #48bb78;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 18px;
          font-weight: bold;
        }
        .info-section {
          background-color: white;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #48bb78;
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
        <h1>🎉 Gefeliciteerd!</h1>
        <p>Je team is toegewezen aan een tijdslot</p>
      </div>
      
      <div class="content">
        <p>Beste ${data.firstName} ${data.lastName},</p>
        <p>Goed nieuws! De loting is uitgevoerd en je team is toegewezen aan het volgende tijdslot:</p>
        
        <div class="assignment-box">
          ${dayName}<br>
          ${timeslot.startTime} - ${timeslot.endTime}
        </div>
        
        <div class="info-section">
          <h3>Belangrijke informatie:</h3>
          <ul>
            <li>Dit tijdslot geldt voor de hele lesperiode</li>
            <li>Zorg ervoor dat je team op tijd aanwezig is</li>
            <li>Bij afwezigheid, geef dit tijdig door</li>
            <li>Het lesrooster start binnenkort</li>
          </ul>
        </div>
        
        <p>We kijken ernaar uit je op de baan te zien!</p>
        
        <div class="footer">
          <p>Met sportieve groet,<br>LTC de Kei</p>
          <p style="font-size: 12px;">Voor vragen kun je contact opnemen via padel@ltcdekei.nl</p>
        </div>
      </div>
    </body>
    </html>
    `

    const { data: emailData, error } = await resend.emails.send({
      from: 'LTC de Kei Padel <padel@ltcdekei.nl>',
      to: data.contactEmail,
      subject: '🎉 Je tijdslot is toegewezen - LTC de Kei Padellessen',
      html: html,
    })

    if (error) {
      console.error('Error sending assignment email:', error)
      throw error
    }

    console.log('Assignment email sent successfully:', emailData)
    return emailData
  } catch (error) {
    console.error('Failed to send assignment email:', error)
    throw error
  }
}

export async function sendWaitlistEmail(data: WaitlistData) {
  try {
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
          background-color: #ed8936;
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
        .waitlist-box {
          background-color: #fed7d7;
          border: 2px solid #fc8181;
          color: #742a2a;
          padding: 20px;
          text-align: center;
          border-radius: 8px;
          margin: 20px 0;
          font-weight: bold;
        }
        .info-section {
          background-color: white;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #ed8936;
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
        <h1>Wachtlijst Padellessen</h1>
        <p>LTC de Kei</p>
      </div>
      
      <div class="content">
        <p>Beste ${data.firstName} ${data.lastName},</p>
        <p>De loting voor de padellessen is uitgevoerd. Helaas konden we je team niet toewijzen aan een van de beschikbare tijdsloten.</p>
        
        <div class="waitlist-box">
          Je staat nu op de wachtlijst
        </div>
        
        <div class="info-section">
          <h3>Wat betekent dit?</h3>
          <ul>
            <li>Je staat op de wachtlijst voor eventuele vrijkomende plekken</li>
            <li>Als er een plek vrijkomt, nemen we contact met je op</li>
            <li>Dit kan gebeuren als teams zich afmelden</li>
            <li>Je hoeft verder niets te doen</li>
          </ul>
        </div>
        
        <p>We houden je op de hoogte als er mogelijkheden ontstaan. Bedankt voor je begrip!</p>
        
        <div class="footer">
          <p>Met vriendelijke groet,<br>LTC de Kei</p>
          <p style="font-size: 12px;">Voor vragen kun je contact opnemen via padel@ltcdekei.nl</p>
        </div>
      </div>
    </body>
    </html>
    `

    const { data: emailData, error } = await resend.emails.send({
      from: 'LTC de Kei Padel <padel@ltcdekei.nl>',
      to: data.contactEmail,
      subject: 'Wachtlijst padellessen - LTC de Kei',
      html: html,
    })

    if (error) {
      console.error('Error sending waitlist email:', error)
      throw error
    }

    console.log('Waitlist email sent successfully:', emailData)
    return emailData
  } catch (error) {
    console.error('Failed to send waitlist email:', error)
    throw error
  }
}