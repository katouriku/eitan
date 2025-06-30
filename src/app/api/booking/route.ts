import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch bookings for a given date (YYYY-MM-DD) or range (start, end)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date'); // Expecting 'YYYY-MM-DD'
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');

  if (date) {
    // Get all bookings for the day
    console.log('Booking API: Querying for date', date);
    const start = new Date(date + 'T00:00:00'); // Remove Z to use local time
    const end = new Date(date + 'T23:59:59.999');
    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      select: { date: true },
    });
    console.log('Booking API: Found bookings', bookings);
    return NextResponse.json({ bookings });
  } else if (startParam && endParam) {
    // Get all bookings in the range
    console.log('Booking API: Querying for range', startParam, endParam);
    const start = new Date(startParam + 'T00:00:00'); // Remove Z to use local time
    const end = new Date(endParam + 'T23:59:59.999');
    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      select: { date: true },
    });
    console.log('Booking API: Found bookings', bookings);
    return NextResponse.json({ bookings });
  } else {
    return NextResponse.json({ error: 'Missing date or start/end' }, { status: 400 });
  }
}

// POST: Create a new booking
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    // Required fields: date, participantCount, customerName, customerEmail, price
    const { date, participantCount, customerName, customerKana, customerEmail, couponCode, couponDiscount, price, paymentIntentId, status, notes } = data;
    if (!date || !participantCount || !customerName || !customerEmail || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Prevent double-booking (unique constraint on date)
    const booking = await prisma.booking.create({
      data: {
        date: new Date(date),
        participantCount,
        customerName,
        customerKana,
        customerEmail,
        couponCode,
        couponDiscount,
        price,
        paymentIntentId,
        status: status || 'pending',
        notes,
      },
    });
    return NextResponse.json({ booking });
  } catch (e) {
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code?: string }).code === 'P2002'
    ) {
      // Unique constraint failed (double-booking)
      return NextResponse.json({ error: 'Time slot already booked' }, { status: 409 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
