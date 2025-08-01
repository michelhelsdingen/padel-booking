import { NextResponse } from 'next/server'
import { runLottery } from '@/lib/lottery'

export async function POST() {
  try {
    const result = await runLottery()
    
    return NextResponse.json({
      success: true,
      message: 'Loting succesvol uitgevoerd',
      ...result
    })
  } catch (error) {
    console.error('Lottery error:', error)
    return NextResponse.json(
      { error: 'Fout bij uitvoeren loting' },
      { status: 500 }
    )
  }
}