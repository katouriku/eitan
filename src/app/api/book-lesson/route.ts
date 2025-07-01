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

  // Format the date and time nicely
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo'
    }).format(date);
  };

  // Create booking details section
  const bookingDetails = `
    <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📅 ご予約詳細</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #555; width: 120px;">日時：</td>
          <td style="padding: 8px 0; color: #333;">${formatDate(start)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #555;">時間：</td>
          <td style="padding: 8px 0; color: #333;">${duration}分間</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #555;">レッスン形式：</td>
          <td style="padding: 8px 0; color: #333;">${lessonType === 'online' ? 'オンライン' : '対面'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #555;">参加者数：</td>
          <td style="padding: 8px 0; color: #333;">${participants}名</td>
        </tr>
        ${details ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #555; vertical-align: top;">ご要望：</td>
          <td style="padding: 8px 0; color: #333;">${details}</td>
        </tr>
        ` : ''}
      </table>
    </div>
  `;

  const priceBreakdown = `
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 18px;">💰 料金詳細</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #555;">通常料金：</td>
          <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #333;">${regularPrice?.toLocaleString?.() ?? regularPrice}円</td>
        </tr>
        ${coupon && discountAmount ? `
        <tr>
          <td style="padding: 8px 0; color: #555;">クーポン割引 (${coupon})：</td>
          <td style="padding: 8px 0; text-align: right; color: #28a745;">-${discountAmount?.toLocaleString?.() ?? discountAmount}円</td>
        </tr>
        ` : ''}
        <tr style="border-top: 2px solid #ffc107;">
          <td style="padding: 12px 0 8px 0; font-weight: bold; color: #333; font-size: 16px;">合計金額：</td>
          <td style="padding: 12px 0 8px 0; text-align: right; font-weight: bold; color: #333; font-size: 18px;">
            ${finalPrice === 0 ? '無料' : (finalPrice?.toLocaleString?.() ?? finalPrice) + '円'}
          </td>
        </tr>
      </table>
    </div>
  `;

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
      html: `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ご予約確認 - 英語探検隊</title>
</head>
<body style="font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">✅ ご予約確定のお知らせ</h1>
        <p style="color: #e3f2fd; margin: 10px 0 0 0; font-size: 16px;">英語探検隊 (Eigotankentai.com)</p>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 30px;">
        <h2 style="color: #333333; margin-top: 0; margin-bottom: 20px; font-size: 20px;">${name} 様</h2>
        
        <p style="font-size: 16px; color: #555555; margin-bottom: 25px;">
          この度はレッスンをご予約いただき、誠にありがとうございます。<br>
          ご希望の日時でレッスンを承りました。
        </p>

        ${bookingDetails}
        
        ${priceBreakdown}
        
        <div style="background-color: #e3f2fd; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 18px;">📎 カレンダー登録</h3>
          <p style="color: #555; margin: 0; font-size: 14px;">
            添付のカレンダーファイル（booking.ics）をダウンロードして、お使いのカレンダーアプリに追加してください。
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <p style="font-size: 16px; color: #555555; margin: 0;">
            ご不明な点やご質問がございましたら、いつでもお気軽にお返事ください。<br>
            レッスン当日を心よりお待ちしております！
          </p>
        </div>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f9fa; padding: 25px; border-top: 1px solid #e9ecef;">
        <div style="text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #333;">青木ルーカス</p>
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">英語探検隊 講師</p>
          <p style="margin: 0; font-size: 14px;">
            <a href="mailto:luke@eigotankentai.com" style="color: #007bff; text-decoration: none;">luke@eigotankentai.com</a>
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`,
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
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Booking Notification</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; line-height: 1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); overflow: hidden;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 25px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;">🎉 New Booking Received</h1>
        <p style="color: #d4edda; margin: 8px 0 0 0; font-size: 14px;">Eigotankentai.com Admin Panel</p>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding: 30px;">
        <div style="background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
          <h3 style="color: #333; margin-top: 0; margin-bottom: 15px; font-size: 18px;">👤 Customer Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #555; width: 100px;">Name:</td>
              <td style="padding: 6px 0; color: #333;">${name} (${kana})</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #555;">Email:</td>
              <td style="padding: 6px 0; color: #333;"><a href="mailto:${email}" style="color: #007bff; text-decoration: none;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold; color: #555;">Date:</td>
              <td style="padding: 6px 0; color: #333;">${formatDate(start)}</td>
            </tr>
          </table>
        </div>
        
        ${bookingDetails}
        
        ${priceBreakdown}
        
        <div style="background-color: #e3f2fd; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <p style="color: #555; margin: 0; font-size: 14px;">
            📎 Calendar event attached - add to your calendar to stay organized!
          </p>
        </div>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8f9fa; padding: 20px; border-top: 1px solid #e9ecef; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #888;">
          This is an automated notification from your booking system.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
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
