import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const availabilities = await prisma.availability.findMany();
  // Group by day for frontend compatibility
  const grouped = availabilities.reduce((acc, curr) => {
    if (!acc[curr.day]) acc[curr.day] = [];
    acc[curr.day].push({ start: curr.startTime, end: curr.endTime });
    return acc;
  }, {} as Record<string, { start: string; end: string }[]>);
  // Convert to array format expected by frontend
  const result = Object.entries(grouped).map(([day, ranges]) => ({ day, ranges }));
  return NextResponse.json({ weeklyAvailability: result });
}
