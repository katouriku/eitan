import { NextResponse } from 'next/server'
import { testSupabaseConnection, BookingService } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testing Supabase database connection...')
    
    // Test basic connection
    const connectionTest = await testSupabaseConnection()
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        message: 'Supabase connection failed',
        error: connectionTest.error
      }, { status: 500 })
    }
    
    // Test if bookings table exists by trying to select from it
    try {
      const testBookings = await BookingService.getBookingsByDateRange(
        '2025-01-01T00:00:00Z',
        '2025-01-02T00:00:00Z'
      )
      
      return NextResponse.json({
        success: true,
        message: 'Supabase connection successful!',
        connectionData: connectionTest.data,
        bookingsTableTest: {
          success: true,
          message: 'Bookings table is accessible',
          bookingCount: testBookings.length
        }
      })
    } catch (bookingError) {
      return NextResponse.json({
        success: true,
        message: 'Supabase connection successful, but bookings table needs setup',
        connectionData: connectionTest.data,
        bookingsTableTest: {
          success: false,
          error: String(bookingError),
          message: 'Run the SQL schema to create the bookings table'
        }
      })
    }
    
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Database test failed',
      error: String(error)
    }, { status: 500 })
  }
}
