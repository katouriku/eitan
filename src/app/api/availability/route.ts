import { NextResponse } from 'next/server';
import { AvailabilityService } from '@/lib/supabase';

export async function GET() {
  try {
    // Try to initialize default availability if needed
    try {
      await AvailabilityService.initializeDefaultAvailability();
    } catch {
      console.log('Availability table may not exist yet, using fallback schedule');
      // Return fallback availability if table doesn't exist
      return NextResponse.json({ 
        weeklyAvailability: getFallbackAvailability() 
      });
    }
    
    // Get availability from Supabase
    const weeklyAvailability = await AvailabilityService.getWeeklyAvailability();
    
    return NextResponse.json({ weeklyAvailability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    
    // Return fallback availability on any error
    return NextResponse.json({ 
      weeklyAvailability: getFallbackAvailability() 
    });
  }
}

function getFallbackAvailability() {
  return [
    {
      day: 'Monday',
      ranges: [
        { start: '12:00', end: '13:00' },
        { start: '13:00', end: '14:00' },
        { start: '14:00', end: '15:00' },
        { start: '15:00', end: '16:00' },
        { start: '16:00', end: '17:00' },
        { start: '17:00', end: '18:00' },
        { start: '18:00', end: '19:00' },
        { start: '19:00', end: '20:00' }
      ]
    },
    {
      day: 'Tuesday',
      ranges: [
        { start: '12:00', end: '13:00' },
        { start: '13:00', end: '14:00' },
        { start: '14:00', end: '15:00' },
        { start: '15:00', end: '16:00' },
        { start: '16:00', end: '17:00' },
        { start: '17:00', end: '18:00' },
        { start: '18:00', end: '19:00' },
        { start: '19:00', end: '20:00' }
      ]
    },
    {
      day: 'Wednesday',
      ranges: [
        { start: '12:00', end: '13:00' },
        { start: '13:00', end: '14:00' },
        { start: '14:00', end: '15:00' },
        { start: '15:00', end: '16:00' },
        { start: '16:00', end: '17:00' },
        { start: '17:00', end: '18:00' },
        { start: '18:00', end: '19:00' },
        { start: '19:00', end: '20:00' }
      ]
    },
    {
      day: 'Thursday',
      ranges: [
        { start: '12:00', end: '13:00' },
        { start: '13:00', end: '14:00' },
        { start: '14:00', end: '15:00' },
        { start: '15:00', end: '16:00' },
        { start: '16:00', end: '17:00' },
        { start: '17:00', end: '18:00' },
        { start: '18:00', end: '19:00' },
        { start: '19:00', end: '20:00' }
      ]
    },
    {
      day: 'Friday',
      ranges: [
        { start: '12:00', end: '13:00' },
        { start: '13:00', end: '14:00' },
        { start: '14:00', end: '15:00' },
        { start: '15:00', end: '16:00' },
        { start: '16:00', end: '17:00' },
        { start: '17:00', end: '18:00' },
        { start: '18:00', end: '19:00' },
        { start: '19:00', end: '20:00' }
      ]
    }
  ];
}
