import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { action, table, query } = await request.json()
    
    let result;
    
    if (action === 'count' && table) {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) throw error
      result = { count }
      
    } else if (action === 'select' && table) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(100)
      
      if (error) throw error
      result = { data, count: data?.length || 0 }
      
    } else if (action === 'custom' && query) {
      // For custom queries, use the from() method with custom SQL
      const { data, error } = await supabaseAdmin
        .from(query.table || 'teams')
        .select(query.select || '*')
        .limit(query.limit || 100)
      
      if (error) throw error
      result = { data, count: data?.length || 0 }
      
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use: count, select, or custom' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('Debug API Error:', error)
    
    return NextResponse.json(
      { 
        error: 'Database query failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}