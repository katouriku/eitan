import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { date, duration = 60 } = await req.json();
    
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }
    
    const isAvailable = await isTimeSlotAvailable(date, duration);
    
    return NextResponse.json({ 
      available: isAvailable,
      date,
      duration 
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}

// Check if a specific time slot is available
async function isTimeSlotAvailable(date: string, duration: number = 60): Promise<boolean> {
  try {
    const bookingDate = new Date(date);
    const bookingEndTime = new Date(bookingDate.getTime() + duration * 60000);
    
    // Check for overlapping bookings
    const dayStart = new Date(bookingDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(bookingDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    const existingBookings = await BookingService.getBookingsByDateRange(
      dayStart.toISOString(),
      dayEnd.toISOString()
    );
    
    // Check for time conflicts
    for (const booking of existingBookings) {
      const existingStart = new Date(booking.date);
      const existingEnd = new Date(existingStart.getTime() + booking.duration * 60000);
      
      // Check if times overlap
      if (
        (bookingDate >= existingStart && bookingDate < existingEnd) ||
        (bookingEndTime > existingStart && bookingEndTime <= existingEnd) ||
        (bookingDate <= existingStart && bookingEndTime >= existingEnd)
      ) {
        return false; // Time slot is not available
      }
    }
    
    return true; // Time slot is available
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    return false; // Default to not available on error
  }
}
