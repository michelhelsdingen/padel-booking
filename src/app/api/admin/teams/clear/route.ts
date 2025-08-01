import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Clear all data in the correct order due to foreign key constraints
    const deletedCount = await prisma.$transaction(async (tx) => {
      // Count teams before deletion
      const teamCount = await tx.team.count()
      
      // Delete assignments first (has foreign keys to teams and timeslots)
      await tx.assignment.deleteMany()
      
      // Delete team preferences (has foreign keys to teams and timeslots)
      await tx.teamPreference.deleteMany()
      
      // Delete team members (has foreign key to teams)
      await tx.teamMember.deleteMany()
      
      // Finally delete teams
      await tx.team.deleteMany()
      
      return teamCount
    })

    return NextResponse.json({ 
      success: true,
      deletedCount,
      message: `Alle ${deletedCount} teams zijn succesvol verwijderd`
    })
  } catch (error) {
    console.error('Error clearing all teams:', error)
    return NextResponse.json(
      { error: 'Fout bij verwijderen van alle teams' },
      { status: 500 }
    )
  }
}