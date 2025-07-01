import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/lib/supabase';

// GET: Fetch bookings for a given date (YYYY-MM-DD) or range (start, end)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  try {
    if (date) {
      // Get all bookings for the day
      const startDate = `${date}T00:00:00Z`;
      const endDate = `${date}T23:59:59Z`;
      
      const bookings = await BookingService.getBookingsByDateRange(startDate, endDate);
      
      // Return in the format expected by the frontend
      const formattedBookings = bookings.map(booking => ({
        date: booking.date,
        duration: booking.duration,
        participants: booking.participants
      }));
      
      return NextResponse.json({ bookings: formattedBookings });
    } else if (startParam && endParam) {
      // Get all bookings in the range
      const startDate = `${startParam}T00:00:00Z`;
      const endDate = `${endParam}T23:59:59Z`;
      
      const bookings = await BookingService.getBookingsByDateRange(startDate, endDate);
      
      const formattedBookings = bookings.map(booking => ({
        date: booking.date,
        duration: booking.duration,
        participants: booking.participants
      }));
      
      return NextResponse.json({ bookings: formattedBookings });
    } else {
      return NextResponse.json({ error: 'Missing date or start/end' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
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

// POST: Create a new booking
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    // Required fields: date, participantCount, customerName, customerEmail, price
    const { date, participantCount, customerName, customerKana, customerEmail, couponCode, couponDiscount, price, notes, duration } = data;
    if (!date || !participantCount || !customerName || !customerEmail || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const bookingDuration = duration || 60;
    
    // Check if the time slot is available before creating the booking
    const isAvailable = await isTimeSlotAvailable(date, bookingDuration);
    if (!isAvailable) {
      return NextResponse.json({ error: 'Time slot is already booked' }, { status: 409 });
    }
    
    const bookingData = {
      name: customerName,
      kana: customerKana || '',
      email: customerEmail,
      date: new Date(date).toISOString(),
      duration: bookingDuration,
      details: notes || '',
      lesson_type: 'online' as const,
      participants: participantCount,
      coupon: couponCode || undefined,
      regular_price: price,
      discount_amount: couponDiscount || 0,
      final_price: price - (couponDiscount || 0)
    };
    
    const booking = await BookingService.createBooking(bookingData);
    return NextResponse.json({ booking });
  } catch (e) {
    if (e instanceof Error && e.message.includes('duplicate key value')) {
      // Unique constraint failed (double-booking)
      return NextResponse.json({ error: 'Time slot already booked' }, { status: 409 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
