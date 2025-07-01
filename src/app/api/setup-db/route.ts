import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('Setting up database schema...')
    
    // Create the bookings table
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .limit(1)
    
    if (error && error.code === '42P01') {
      // Table doesn't exist, we need to create it
      // Since we can't use RPC, let's return instructions
      return NextResponse.json({
        success: false,
        message: 'Bookings table does not exist. Please run the SQL schema manually.',
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to the SQL Editor',
          '3. Run the SQL commands from supabase_schema.sql',
          '4. Come back and test the connection again'
        ],
        sqlFile: 'Check supabase_schema.sql in your project root'
      })
    }
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Database setup failed',
        error: error.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database schema is already set up!',
      tableCount: data.length
    })
    
  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json({
      success: false,
      message: 'Database setup failed',
      error: String(error)
    }, { status: 500 })
  }
}
