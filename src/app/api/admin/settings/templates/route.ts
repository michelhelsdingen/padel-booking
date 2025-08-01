import { NextRequest, NextResponse } from 'next/server'

// We'll store templates in a simple JSON format for now
// In a production app, you might want a dedicated EmailTemplate model

const DEFAULT_TEMPLATES = {
  confirmation: {
    subject: 'Bevestiging inschrijving LTC Padel Lessen',
    body: `Beste {{firstName}} {{lastName}},

Bedankt voor je inschrijving voor de padellessen bij LTC de Kei!

Je hebt je ingeschreven met de volgende voorkeuren:
{{preferences}}

De loting vindt plaats op {{lotteryDate}} en je ontvangt dan bericht over de toewijzing.

Met sportieve groet,
LTC de Kei`
  },
  assignment: {
    subject: 'Toewijzing padellessen LTC de Kei',
    body: `Beste {{firstName}} {{lastName}},

Goed nieuws! Je team is toegewezen aan het volgende tijdslot:
{{assignment}}

Datum: Elke {{dayOfWeek}}
Tijd: {{timeSlot}}

Zorg ervoor dat je op tijd aanwezig bent voor de lessen.

Met sportieve groet,
LTC de Kei`
  },
  waitlist: {
    subject: 'Wachtlijst padellessen LTC de Kei',
    body: `Beste {{firstName}} {{lastName}},

Helaas konden we je team niet toewijzen aan een van je voorkeuren.
Je staat nu op de wachtlijst en wordt op de hoogte gehouden als er plekken vrijkomen.

Met sportieve groet,
LTC de Kei`
  }
}

export async function GET() {
  try {
    // For now, return default templates
    // In production, you'd fetch from database
    return NextResponse.json(DEFAULT_TEMPLATES)
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { message: 'Fout bij ophalen van templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const templates = await request.json()
    
    // Validate template structure
    const requiredTypes = ['confirmation', 'assignment', 'waitlist']
    for (const type of requiredTypes) {
      if (!templates[type] || !templates[type].subject || !templates[type].body) {
        return NextResponse.json(
          { message: `Template ${type} is onvolledig` },
          { status: 400 }
        )
      }
    }
    
    // For now, we'll just validate and return success
    // In production, you'd save to database
    console.log('Templates saved:', templates)
    
    return NextResponse.json({ message: 'Templates succesvol opgeslagen' })
  } catch (error) {
    console.error('Error saving templates:', error)
    return NextResponse.json(
      { message: 'Fout bij opslaan van templates' },
      { status: 500 }
    )
  }
}