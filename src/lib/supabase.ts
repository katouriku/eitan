import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role key for admin operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Database types
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

export interface Availability {
  id: string
  day_of_week: number // 0 = Sunday, 1 = Monday, etc.
  start_time: string  // Format: "HH:MM"
  end_time: string    // Format: "HH:MM"
  is_active: boolean
  created_at: string
  updated_at: string
}

// Booking operations
export class BookingService {
  // Check if a time slot is already booked
  static async checkDoubleBooking(date: string, duration: number = 60) {
    const bookingStart = new Date(date)
    const bookingEnd = new Date(bookingStart.getTime() + duration * 60000)
    
    // Get all bookings for the same date (more efficient than time range query)
    const dateStr = bookingStart.toISOString().split('T')[0] // YYYY-MM-DD
    const startOfDay = `${dateStr}T00:00:00.000Z`
    const endOfDay = `${dateStr}T23:59:59.999Z`
    
    const { data: existingBookings, error } = await supabase
      .from('bookings')
      .select('date, duration')
      .gte('date', startOfDay)
      .lte('date', endOfDay)
    
    if (error) {
      console.error('Error checking for double booking:', error)
      throw new Error(`Failed to check for conflicts: ${error.message}`)
    }
    
    // Check if any existing booking conflicts with the new booking
    for (const booking of existingBookings || []) {
      const existingStart = new Date(booking.date)
      const existingEnd = new Date(existingStart.getTime() + booking.duration * 60000)
      
      // Check for overlap: new booking starts before existing ends AND new booking ends after existing starts
      const hasOverlap = bookingStart < existingEnd && bookingEnd > existingStart
      
      if (hasOverlap) {
        return {
          hasConflict: true,
          conflictingBooking: {
            date: booking.date,
            duration: booking.duration
          }
        }
      }
    }
    
    return { hasConflict: false }
  }

  static async createBooking(bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) {
    // Check for double booking first
    const conflictCheck = await this.checkDoubleBooking(bookingData.date, bookingData.duration)
    if (conflictCheck.hasConflict) {
      throw new Error(`Time slot is already booked. Please choose a different time.`)
    }
    
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating booking:', error.message)
      throw new Error(`Failed to create booking: ${error.message}`)
    }
    
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

// Availability operations
export class AvailabilityService {
  static async getWeeklyAvailability() {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('is_active', true)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (error) {
      console.error('Error fetching availability:', error)
      throw error
    }
    
    // Group by day for frontend compatibility
    const grouped = (data || []).reduce((acc, curr) => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const dayName = dayNames[curr.day_of_week]
      
      if (!acc[dayName]) acc[dayName] = []
      acc[dayName].push({ start: curr.start_time, end: curr.end_time })
      return acc
    }, {} as Record<string, { start: string; end: string }[]>)
    
    // Convert to array format expected by frontend
    const result = Object.entries(grouped).map(([day, ranges]) => ({ day, ranges }))
    return result
  }
  
  static async createAvailabilitySlot(dayOfWeek: number, startTime: string, endTime: string) {
    const { data, error } = await supabaseAdmin
      .from('availability')
      .insert({
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        is_active: true
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating availability slot:', error)
      throw error
    }
    
    return data
  }
  
  static async initializeDefaultAvailability() {
    try {
      // Check if availability already exists
      const { data: existing, error: checkError } = await supabase
        .from('availability')
        .select('id')
        .limit(1)
      
      if (checkError) {
        console.error('Error checking availability table:', checkError)
        throw new Error(`Availability table may not exist: ${checkError.message}`)
      }
      
      if (existing && existing.length > 0) {
        console.log('Availability already initialized')
        return
      }
      
      // Create weekday availability from 12pm to 8pm
      const weekdays = [1, 2, 3, 4, 5] // Monday to Friday
      const timeSlots = [
        { start: '12:00', end: '13:00' },
        { start: '13:00', end: '14:00' },
        { start: '14:00', end: '15:00' },
        { start: '15:00', end: '16:00' },
        { start: '16:00', end: '17:00' },
        { start: '17:00', end: '18:00' },
        { start: '18:00', end: '19:00' },
        { start: '19:00', end: '20:00' }
      ]
      
      const availabilitySlots = []
      for (const day of weekdays) {
        for (const slot of timeSlots) {
          availabilitySlots.push({
            day_of_week: day,
            start_time: slot.start,
            end_time: slot.end,
            is_active: true
          })
        }
      }
      
      const { error } = await supabaseAdmin
        .from('availability')
        .insert(availabilitySlots)
      
      if (error) {
        console.error('Error initializing availability:', error)
        throw new Error(`Failed to initialize availability: ${error.message}`)
      }
      
      console.log('Default availability initialized successfully')
    } catch (error) {
      console.error('Error in initializeDefaultAvailability:', error)
      throw error
    }
  }
}
