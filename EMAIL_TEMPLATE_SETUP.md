# Supabase Email Template Setup Instructions

## HTML Template (Primary)
Copy the content from `supabase-email-template.html` into your Supabase dashboard.

## Text Version (Fallback)
For users who can't view HTML emails, also set up this text version:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎌 EigoTankentai - アカウント確認
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EigoTankentaiへのご登録ありがとうございます！

アカウントを有効化するには、下のリンクをクリックしてください：

👉 {{ .ConfirmationURL }}

⚠️ 重要：
• このリンクは24時間で期限切れになります
• 確認後、通常通りログインできます
• 心当たりがない場合は、このメールを無視してください

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

このメールは EigoTankentai から自動送信されています
© 2025 EigoTankentai. All rights reserved.

Website: {{ .SiteURL }}
```

## Setup Steps:

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Navigate to Email Templates**
   - Go to Authentication → Email Templates
   - Click on "Confirm signup"

3. **Update the Template**
   - Replace the default HTML with the content from `supabase-email-template.html`
   - Set the subject line to: "アカウント確認 - EigoTankentai"
   - Optionally add the text version as fallback

4. **Configure Sender**
   - Set sender name: "EigoTankentai"
   - Set sender email: "registration@eigotankentai.com" (once SMTP is configured)

## Template Features:
✅ Professional, branded design
✅ Mobile responsive
✅ Clear call-to-action button
✅ Alternative link for accessibility
✅ Important security notes
✅ Japanese language support
✅ Modern gradient design matching your site
✅ Fallback text version included

## Variables Used:
- `{{ .ConfirmationURL }}` - The confirmation link
- `{{ .SiteURL }}` - Your website URL

The template is ready to copy and paste directly into Supabase!
