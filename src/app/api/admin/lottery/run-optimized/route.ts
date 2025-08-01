import { NextResponse } from 'next/server'
import { runOptimizedLottery } from '@/lib/lottery-supabase'

export async function POST() {
  try {
    console.log('Starting optimized lottery execution...')
    
    const result = await runOptimizedLottery()
    
    console.log('Lottery completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Loting succesvol uitgevoerd',
      result
    })
  } catch (error) {
    console.error('Error running optimized lottery:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Er is een fout opgetreden bij de loting',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}