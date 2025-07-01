import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { BookingService } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

function createICS({ summary, description, start, end, location }: { summary: string; description: string; start: string; end: string; location?: string }) {
  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Your Company//Booking//EN\nBEGIN:VEVENT\nUID:${Date.now()}@yourdomain.com\nDTSTAMP:${formatICSDate(new Date())}\nDTSTART:${formatICSDate(new Date(start))}\nDTEND:${formatICSDate(new Date(end))}\nSUMMARY:${summary}\nDESCRIPTION:${description}\n${location ? `LOCATION:${location}\n` : ''}END:VEVENT\nEND:VCALENDAR`;
}

function formatICSDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export async function POST(req: NextRequest) {
  const { name, kana, email, date, duration, details, lessonType, participants, coupon, regularPrice, discountAmount, finalPrice } = await req.json();
  const start = new Date(date);
  const end = new Date(start.getTime() + (duration || 60) * 60000);

  const icsContentUser = createICS({
    summary: 'レッスン＠エイタン',
    description: details || '',
    start: start.toISOString(),
    end: end.toISOString(),
  });
  const icsContentAdmin = createICS({
    summary: `Lesson with ${name}`,
    description: details || '',
    start: start.toISOString(),
    end: end.toISOString(),
  });

  let priceBreakdown = `<ul style='font-size:15px;line-height:1.7;padding-left:1em;'>`;
  priceBreakdown += `<li>通常料金: <strong>${regularPrice?.toLocaleString?.() ?? regularPrice}円</strong></li>`;
  if (coupon && discountAmount) {
    priceBreakdown += `<li>クーポン (${coupon}): -${discountAmount?.toLocaleString?.() ?? discountAmount}円</li>`;
  }
  priceBreakdown += `<li>合計金額: <strong>${finalPrice === 0 ? '無料' : (finalPrice?.toLocaleString?.() ?? finalPrice) + '円'}</strong></li>`;
  priceBreakdown += `<li>参加者数: <strong>${participants}名</strong></li>`;
  priceBreakdown += `</ul>`;

  // Prepare booking data
  const bookingData = {
    name,
    kana,
    email,
    date: start.toISOString(),
    duration: duration || 60,
    details: details || '',
    lesson_type: lessonType as 'online' | 'in-person',
    participants: participants || 1,
    coupon: coupon || undefined,
    regular_price: regularPrice || 0,
    discount_amount: discountAmount || 0,
    final_price: finalPrice || 0
  }

  try {
    // Check for double booking before sending any emails
    const conflictCheck = await BookingService.checkDoubleBooking(bookingData.date, bookingData.duration)
    if (conflictCheck.hasConflict) {
      return NextResponse.json({ 
        error: 'このお時間は既に予約済みです。別のお時間をお選びください。',
        errorCode: 'DOUBLE_BOOKING'
      }, { status: 409 })
    }

    // Send confirmation to user (with BCC to you)
    await resend.emails.send({
      from: 'luke@eigotankentai.com',
      to: email,
      bcc: 'luke@eigotankentai.com',
      subject: '予約確定',
      html: `<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ご予約確認</title>
  </head>
  <body style="font-family: sans-serif; background-color: #f9f9f9; padding: 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 30px;">
      <tr>
        <td>
          <h2 style="color: #333333;">${name} 様</h2>
          <p style="font-size: 16px; color: #555555; line-height: 1.6;">
            このたびはご予約いただきありがとうございます。<br>
            ご希望の日時でレッスンを承りました。<br><br>
            <strong>ご予約内容:</strong><br>
            ${priceBreakdown}
            ご不明な点がございましたら、いつでもお気軽にご連絡ください。
          </p>

          <p style="font-size: 16px; color: #555555; line-height: 1.6;">
            レッスン当日を楽しみにしております！
          </p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;" />

          <p style="font-size: 14px; color: #888888;">
            青木ルーカス<br>
            <a href="mailto:luke@eigotankentai.com" style="color: #888888; text-decoration: none;">luke@eigotankentai.com</a>
          </p>
        </td>
      </tr>
    </table>
  </body>` ,
      attachments: [{
        filename: 'booking.ics',
        content: icsContentUser,
      }],
    });
  } catch (err) {
    console.error('Error sending confirmation email:', err);
    return NextResponse.json({ ok: false, error: 'Failed to send confirmation email', details: String(err) }, { status: 500 });
  }

  try {
    // Send notification to yourself (admin)
    await resend.emails.send({
      from: 'luke@eigotankentai.com',
      to: 'luke@eigotankentai.com',
      subject: 'New Booking',
      html: `<p>New booking from <strong>${name} (${kana})</strong> &lt;${email}&gt; on ${start.toLocaleString()}</p>
      <hr style="margin:24px 0;">
      <div style="font-size:15px;line-height:1.7;">
        <strong>ご予約内容:</strong><br>
        ${priceBreakdown}
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-top:16px;">
        <div style="font-size:15px;line-height:1.5;">
          <strong>青木ルーカス</strong><br/>
          <span>英語探検隊（Eigotankentai.com）</span><br/>
          <a href="mailto:luke@eigotankentai.com" style="color:#3881ff;">luke@eigotankentai.com</a>
        </div>
      </div>` ,
      attachments: [{
        filename: 'booking.ics',
        content: icsContentAdmin,
      }],
    });
  } catch (err) {
    console.error('Error sending admin notification email:', err);
    // Don't fail the whole request if admin notification fails
  }

  // Store booking in database
  try {
    await BookingService.createBooking(bookingData)
  } catch (err) {
    console.error('Error saving booking to database:', err instanceof Error ? err.message : String(err))
    
    // If this is a double booking error, return a proper error response
    if (err instanceof Error && err.message.includes('Time slot is already booked')) {
      return NextResponse.json({ 
        error: 'このお時間は既に予約済みです。別のお時間をお選びください。',
        errorCode: 'DOUBLE_BOOKING'
      }, { status: 409 })
    }
    
    // For other database errors, still fail the request since this is critical
    return NextResponse.json({ 
      error: 'ご予約の保存中にエラーが発生しました。もう一度お試しください。',
      errorCode: 'DATABASE_ERROR'
    }, { status: 500 })
  }

  return NextResponse.json({ ok: true });
}
