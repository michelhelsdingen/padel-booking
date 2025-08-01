import { z } from 'zod'

export const teamMemberSchema = z.object({
  name: z.string().min(2, 'Naam moet minimaal 2 karakters bevatten'),
  email: z.string().email('Ongeldig e-mailadres')
})

export const teamRegistrationSchema = z.object({
  teamName: z.string().min(2, 'Teamnaam moet minimaal 2 karakters bevatten'),
  contactEmail: z.string().email('Ongeldig e-mailadres'),
  members: z.array(teamMemberSchema)
    .min(1, 'Voeg minimaal 1 teamlid toe')
    .max(3, 'Maximaal 3 extra teamleden toegestaan')
    .refine((members) => {
      const emails = members.map(m => m.email.toLowerCase())
      const uniqueEmails = new Set(emails)
      return emails.length === uniqueEmails.size
    }, {
      message: 'E-mailadressen moeten uniek zijn'
    })
})

export const timeslotPreferenceSchema = z.object({
  timeslotId: z.string(),
  priority: z.number().min(1).max(4)
})

export const preferencesSchema = z.object({
  preferences: z.array(timeslotPreferenceSchema)
    .min(1, 'Selecteer minimaal 1 tijdslot')
    .max(4, 'Maximaal 4 tijdsloten toegestaan')
    .refine((prefs) => {
      const priorities = prefs.map(p => p.priority)
      const uniquePriorities = new Set(priorities)
      return priorities.length === uniquePriorities.size
    }, {
      message: 'Elke prioriteit mag maar één keer gebruikt worden'
    })
})

export const completeRegistrationSchema = z.object({
  team: teamRegistrationSchema,
  preferences: preferencesSchema
})