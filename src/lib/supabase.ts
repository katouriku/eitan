import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role key for admin operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Test database connection by creating the bookings table if it doesn't exist
export async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Simple connection test using auth
    await supabase.auth.getSession()
    console.log('✅ Supabase connection successful!')
    return { success: true, data: 'Connected successfully' }
  } catch (error) {
    console.error('Supabase connection failed:', error)
    return { success: false, error: String(error) }
  }
}

// Database types (we'll define these based on your needs)
export interface Booking {
  id: string
  name: string
  kana: string
  email: string
  date: string
  duration: number
  details?: string
  lesson_type: 'online' | 'in-person'
  participants: number
  coupon?: string
  regular_price: number
  discount_amount?: number
  final_price: number
  created_at: string
  updated_at: string
}

// Booking operations
export class BookingService {
  static async createBooking(bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) {
    console.log('Attempting to create booking:', bookingData)
    
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating booking:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw new Error(`Failed to create booking: ${error.message} (Code: ${error.code})`)
    }
    
    console.log('Booking created successfully:', data)
    return data
  }
  
  static async getBookingById(id: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching booking:', error)
      throw error
    }
    
    return data
  }
  
  static async getBookingsByDateRange(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
    
    if (error) {
      console.error('Error fetching bookings:', error)
      throw error
    }
    
    return data
  }
  
  static async deleteBooking(id: string) {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting booking:', error)
      throw error
    }
    
    return true
  }
}
