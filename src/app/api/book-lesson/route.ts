import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function createICS({ summary, description, start, end, location }: { summary: string; description: string; start: string; end: string; location?: string }) {
  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Your Company//Booking//EN\nBEGIN:VEVENT\nUID:${Date.now()}@yourdomain.com\nDTSTAMP:${formatICSDate(new Date())}\nDTSTART:${formatICSDate(new Date(start))}\nDTEND:${formatICSDate(new Date(end))}\nSUMMARY:${summary}\nDESCRIPTION:${description}\n${location ? `LOCATION:${location}\n` : ''}END:VEVENT\nEND:VCALENDAR`;
}

function formatICSDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export async function POST(req: NextRequest) {
  const { name, email, date, duration, details } = await req.json();
  const start = new Date(date);
  const end = new Date(start.getTime() + (duration || 60) * 60000); // default 60 min

  const icsContent = createICS({
    summary: `Lesson with ${name}`,
    description: details || '',
    start: start.toISOString(),
    end: end.toISOString(),
  });

  // Send confirmation to user (with BCC to you)
  await resend.emails.send({
    from: '',
    to: email,
    bcc: 'lucaswilsoncontact@gmail.com',
    subject: 'Booking Confirmation',
    html: `<p>Thank you for booking, ${name}!</p>`,
    attachments: [{
      filename: 'booking.ics',
      content: icsContent,
    }],
  });

  // Send notification to yourself (admin)
  await resend.emails.send({
    from: '',
    to: 'lucaswilsoncontact@gmail.com',
    subject: 'New Booking',
    html: `<p>New booking from ${name} (${email}) on ${start.toLocaleString()}</p>`,
    attachments: [{
      filename: 'booking.ics',
      content: icsContent,
    }],
  });

  return NextResponse.json({ ok: true });
}
