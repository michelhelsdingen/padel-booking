import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default timeslots (Monday to Friday, 4 slots per day)
  const timeslots = []
  
  for (let day = 1; day <= 5; day++) {
    const daySlots = [
      { startTime: '13:30', endTime: '15:30' },
      { startTime: '15:30', endTime: '17:30' },
      { startTime: '17:30', endTime: '19:30' },
      { startTime: '19:30', endTime: '21:30' }
    ]
    
    for (const slot of daySlots) {
      timeslots.push({
        dayOfWeek: day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxTeams: 4
      })
    }
  }

  // Create timeslots
  for (const slot of timeslots) {
    await prisma.timeslot.upsert({
      where: {
        dayOfWeek_startTime: {
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime
        }
      },
      update: {},
      create: slot
    })
  }

  // Create a default registration period
  const now = new Date()
  const registrationEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
  const lotteryDate = new Date(registrationEnd.getTime() + 1 * 24 * 60 * 60 * 1000) // 1 day after registration ends

  await prisma.registrationPeriod.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'Standaard Inschrijfperiode',
      registrationStart: now,
      registrationEnd: registrationEnd,
      lotteryDate: lotteryDate,
      isActive: true,
      description: 'Inschrijving voor de wekelijkse padellessen'
    }
  })

  // Create default admin user (password: admin123)
  const bcrypt = await import('bcryptjs')
  const hashedPassword = await bcrypt.hash('admin123', 12)

  await prisma.admin.upsert({
    where: { email: 'admin@padelclub.nl' },
    update: {},
    create: {
      email: 'admin@padelclub.nl',
      name: 'Admin',
      password: hashedPassword,
      isActive: true
    }
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })