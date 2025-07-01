import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: '全ての必須項目を入力してください。' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください。' },
        { status: 400 }
      );
    }

    // Send email to yourself with user's email as the "from" address
    // This allows you to reply directly to the user
    await resend.emails.send({
      from: `${name} <${email}>`, // User's name and email as sender
      to: 'luke@eigotankentai.com', // Your email
      replyTo: email, // Ensure replies go to the user
      subject: `[お問い合わせ] ${subject}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #3881ff; border-bottom: 2px solid #3881ff; padding-bottom: 10px;">
            新しいお問い合わせ
          </h2>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>お名前:</strong> ${name}</p>
            <p><strong>メールアドレス:</strong> ${email}</p>
            <p><strong>件名:</strong> ${subject}</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border-left: 4px solid #3881ff; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #3881ff;">メッセージ内容:</h3>
            <div style="white-space: pre-wrap; font-family: inherit;">${message.replace(/\n/g, '<br>')}</div>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <div style="font-size: 14px; color: #666;">
            <p><strong>返信方法:</strong> このメールに直接返信することで、${name} さん (${email}) にお返事できます。</p>
            <p><strong>送信日時:</strong> ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
          </div>
        </div>
      `,
    });

    // Send confirmation email to the user
    await resend.emails.send({
      from: 'luke@eigotankentai.com',
      to: email,
      subject: 'お問い合わせを受付いたしました - 英語探検隊',
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #3881ff; border-bottom: 2px solid #3881ff; padding-bottom: 10px;">
            お問い合わせありがとうございます
          </h2>
          
          <p>こんにちは、${name} 様</p>
          
          <p>
            この度は英語探検隊にお問い合わせいただき、誠にありがとうございます。<br>
            以下の内容でお問い合わせを受付いたしました。
          </p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>件名:</strong> ${subject}</p>
            <p><strong>受付日時:</strong> ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border-left: 4px solid #3881ff; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #3881ff;">お問い合わせ内容:</h3>
            <div style="white-space: pre-wrap; font-family: inherit;">${message.replace(/\n/g, '<br>')}</div>
          </div>
          
          <p>
            通常24時間以内にお返事いたします。しばらくお待ちください。<br>
            ご不明な点がございましたら、いつでもお気軽にお問い合わせください。
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <div style="font-size: 14px; color: #666; text-align: center;">
            <p>
              <strong>英語探検隊 (Eigotankentai.com)</strong><br>
              青木ルーカス<br>
              Email: luke@eigotankentai.com<br>
              Website: <a href="https://www.eigotankentai.com" style="color: #3881ff;">www.eigotankentai.com</a>
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'メッセージの送信中にエラーが発生しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}
