import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

// Dutch first names
const DUTCH_FIRST_NAMES = [
  'Jan', 'Kees', 'Piet', 'Henk', 'Gerrit', 'Dirk', 'Cor', 'Wim', 'Arie', 'Ton',
  'Hans', 'Ben', 'Jos', 'Rob', 'Erik', 'Peter', 'Paul', 'Mark', 'Frank', 'Sander',
  'Anna', 'Marie', 'Els', 'Ria', 'Joke', 'Truus', 'Nel', 'Wil', 'Corrie', 'Riet',
  'Ingrid', 'Marieke', 'Petra', 'Sandra', 'Linda', 'Monique', 'Esther', 'Natasja', 'Kim', 'Laura'
]

// Dutch last names
const DUTCH_LAST_NAMES = [
  'de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Janssen', 'Visser',
  'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Peters', 'Bos', 'Vos', 'van Leeuwen',
  'Dekker', 'Brouwer', 'de Wit', 'Dijkstra', 'Smeets', 'de Graaf', 'van der Meer', 'van der Laan',
  'Koning', 'Hermans', 'van den Heuvel', 'van der Heijden', 'Schouten', 'van Beek', 'Willems',
  'van Vliet', 'van de Ven', 'Hoekstra', 'Maas', 'Verhoeven', 'Koster', 'van Dam', 'van der Wal'
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function generateRandomName() {
  const firstName = getRandomElement(DUTCH_FIRST_NAMES)
  const lastName = getRandomElement(DUTCH_LAST_NAMES)
  return { firstName, lastName }
}

function generateRandomEmail(firstName: string, lastName: string) {
  const domains = ['gmail.com', 'hotmail.com', 'ziggo.nl', 'kpn.nl', 'xs4all.nl', 'live.nl']
  const cleanLastName = lastName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '')
  const domain = getRandomElement(domains)
  return `${firstName.toLowerCase()}.${cleanLastName}@${domain}`
}

function getRandomIntInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export async function POST() {
  try {
    // First, get all active timeslots
    const { data: timeslots, error: timeslotsError } = await supabaseAdmin
      .from('timeslots')
      .select('id')
      .eq('isActive', true)

    if (timeslotsError) {
      throw timeslotsError
    }

    if (!timeslots || timeslots.length === 0) {
      return NextResponse.json(
        { error: 'Geen actieve tijdsloten gevonden om voorkeuren aan toe te wijzen' },
        { status: 400 }
      )
    }

    const teams: Array<{
      firstName: string;
      lastName: string;
      contactEmail: string;
      memberCount: number;
      members: Array<{
        firstName: string;
        lastName: string;
        email: string;
      }>;
      preferences: Array<{
        timeslotId: string;
        priority: number;
      }>;
    }> = []
    const teamNames = new Set<string>()

    // Generate 12-15 teams
    const numberOfTeams = getRandomIntInRange(12, 15)

    for (let i = 0; i < numberOfTeams; i++) {
      let teamName: string
      let contactPerson: { firstName: string, lastName: string }
      
      // Ensure unique team names
      do {
        contactPerson = generateRandomName()
        teamName = `${contactPerson.firstName} ${contactPerson.lastName}`
      } while (teamNames.has(teamName))
      
      teamNames.add(teamName)

      // Generate 2-4 team members
      const memberCount = getRandomIntInRange(2, 4)
      const members = []
      const memberEmails = new Set<string>()

      // Add contact person as first member
      const contactEmail = generateRandomEmail(contactPerson.firstName, contactPerson.lastName)
      members.push({
        firstName: contactPerson.firstName,
        lastName: contactPerson.lastName,
        email: contactEmail
      })
      memberEmails.add(contactEmail)

      // Add additional members
      for (let j = 1; j < memberCount; j++) {
        let member: { firstName: string, lastName: string }
        let email: string
        
        // Ensure unique emails within team
        do {
          member = generateRandomName()
          email = generateRandomEmail(member.firstName, member.lastName)
        } while (memberEmails.has(email))
        
        memberEmails.add(email)
        members.push({
          firstName: member.firstName,
          lastName: member.lastName,
          email
        })
      }

      // Generate 1-4 timeslot preferences
      const preferenceCount = getRandomIntInRange(1, Math.min(4, timeslots.length))
      const selectedTimeslots = new Set<string>()
      const preferences = []

      for (let k = 0; k < preferenceCount; k++) {
        let timeslotId: string
        
        // Ensure unique timeslot preferences
        do {
          timeslotId = getRandomElement(timeslots).id
        } while (selectedTimeslots.has(timeslotId))
        
        selectedTimeslots.add(timeslotId)
        preferences.push({
          timeslotId,
          priority: k + 1
        })
      }

      teams.push({
        firstName: contactPerson.firstName,
        lastName: contactPerson.lastName,
        contactEmail: contactEmail,
        memberCount,
        members,
        preferences
      })
    }

    // Create all teams with their members and preferences
    const createdTeams = []
    const timestamp = new Date().toISOString()

    for (const teamData of teams) {
      const teamId = uuidv4()
      
      // Create team
      const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .insert({
          id: teamId,
          firstName: teamData.firstName,
          lastName: teamData.lastName,
          contactEmail: teamData.contactEmail,
          memberCount: teamData.memberCount,
          createdAt: timestamp,
          updatedAt: timestamp
        })
        .select()
        .single()

      if (teamError) {
        throw teamError
      }

      // Create team members
      const membersToCreate = teamData.members.map(member => ({
        id: uuidv4(),
        teamId: team.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email
      }))

      const { error: membersError } = await supabaseAdmin
        .from('team_members')
        .insert(membersToCreate)

      if (membersError) {
        throw membersError
      }

      // Create preferences
      const preferencesToCreate = teamData.preferences.map(pref => ({
        id: uuidv4(),
        teamId: team.id,
        timeslotId: pref.timeslotId,
        priority: pref.priority
      }))

      const { error: preferencesError } = await supabaseAdmin
        .from('team_preferences')
        .insert(preferencesToCreate)

      if (preferencesError) {
        throw preferencesError
      }

      createdTeams.push(team)
    }

    return NextResponse.json({ 
      success: true,
      createdCount: createdTeams.length,
      message: `${createdTeams.length} dummy teams succesvol aangemaakt`,
      teams: createdTeams
    })
  } catch (error) {
    console.error('Error generating dummy data:', error)
    
    // Handle unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { error: 'Er bestaat al een team met een van deze email adressen. Probeer opnieuw.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Fout bij aanmaken van dummy data' },
      { status: 500 }
    )
  }
}