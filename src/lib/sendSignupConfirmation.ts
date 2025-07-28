import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendSignupConfirmation(email: string, name: string) {
  return resend.emails.send({
    from: 'welcome@eigotankentai.com',
    to: email,
    subject: '【英語探検隊】アカウント登録ありがとうございます',
    html: `
      <div style="font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif; background: #f8f9fa; padding: 32px; border-radius: 12px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3881ff;">${name} 様</h2>
        <p>この度は英語探検隊にご登録いただき、誠にありがとうございます。</p>
        <p>ご登録が完了しました。マイページからプロフィールや生徒情報の管理、レッスン予約が可能です。</p>
        <ul style="margin: 16px 0; padding-left: 20px;">
          <li>マイページ: <a href="https://eigotankentai.com/profile" style="color: #3881ff;">https://eigotankentai.com/profile</a></li>
        </ul>
        <p>ご不明な点がございましたら、いつでもご連絡ください。</p>
        <p style="margin-top: 32px; color: #888;">英語探検隊<br>青木ルーカス<br><a href="mailto:luke@eigotankentai.com">luke@eigotankentai.com</a></p>
      </div>
    `,
  });
}
