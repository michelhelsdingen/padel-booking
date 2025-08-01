import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Simple database connectivity test
    const result = await prisma.$executeRaw`SELECT 1 as test`
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      result
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      DATABASE_URL_SET: !!process.env.DATABASE_URL
    }, { status: 500 })
  }
}