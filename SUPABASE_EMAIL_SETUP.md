# Supabase Custom Email Setup Instructions

## Setting up Custom Email Sender (registration@eigotankentai.com)

To use your custom email address instead of Supabase's default email, you need to configure SMTP settings in your Supabase project dashboard.

### Steps:

1. **Go to your Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project: `eigotankentai` (wnhimhkdfwlaylygveot)

2. **Navigate to Authentication Settings**
   - Go to Authentication → Settings
   - Click on the "SMTP Settings" section

3. **Configure SMTP Settings**
   You'll need these details from your email provider:
   
   ```
   SMTP Host: [Your email provider's SMTP server]
   SMTP Port: [Usually 587 for TLS or 465 for SSL]
   SMTP User: registration@eigotankentai.com
   SMTP Pass: [Your email password/app password]
   SMTP Sender Name: EigoTankentai Registration
   SMTP Sender Email: registration@eigotankentai.com
   ```

4. **Common SMTP Settings for Different Providers:**

   **Gmail (if using Gmail for business):**
   - Host: smtp.gmail.com
   - Port: 587
   - Security: TLS
   - Note: You'll need to use an App Password, not your regular password

   **Custom Domain Email (recommended):**
   - Contact your domain/hosting provider for SMTP details
   - Usually something like: mail.eigotankentai.com or smtp.eigotankentai.com

5. **Update Email Templates**
   - In the same Authentication settings, you can customize:
     - Email confirmation template
     - Password reset template
     - Email change template

6. **Test the Configuration**
   - Supabase provides a test email feature
   - Make sure to test before going live

### Benefits of Custom Email:
- ✅ Professional appearance (registration@eigotankentai.com)
- ✅ Better deliverability
- ✅ Consistent branding
- ✅ No "via Supabase" in email headers

### Alternative: Email Service Providers
For better deliverability, consider using:
- SendGrid
- Mailgun  
- Amazon SES
- Resend (you already have this configured!)

**Note:** You already have Resend configured in your .env file. You could potentially use Resend for authentication emails too by setting it up as your SMTP provider in Supabase.
