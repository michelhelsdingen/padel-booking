import { NextResponse } from 'next/server'
import { getLotteryStatistics } from '@/lib/lottery'

export async function GET() {
  try {
    const stats = await getLotteryStatistics()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching lottery statistics:', error)
    return NextResponse.json(
      { error: 'Fout bij ophalen loting statistieken' },
      { status: 500 }
    )
  }
}