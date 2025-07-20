// Email Testing and Troubleshooting Guide

## Common SMTP Issues with Supabase

### 1. Verify SMTP Settings in Supabase Dashboard

Go to **Authentication → Settings → SMTP Settings** and verify:

**For MXRoute SMTP:**
- **Host**: Should be something like `mail.eigotankentai.com` or the server provided by MXRoute
- **Port**: 
  - `587` (TLS/STARTTLS) - Most common
  - `465` (SSL) - Alternative
  - `25` (Unencrypted) - Not recommended
- **Username**: `noreply@eigotankentai.com`
- **Password**: The email account password (not your domain password)
- **Sender Name**: `EigoTankentai`
- **Sender Email**: `noreply@eigotankentai.com`

### 2. Common MXRoute Configuration Issues

**Check these settings:**
- ✅ **Email account exists**: Make sure `noreply@eigotankentai.com` is created in MXRoute
- ✅ **Password is correct**: Use the specific email password, not domain password
- ✅ **Port and encryption**: Try both 587 (TLS) and 465 (SSL)
- ✅ **Host format**: Usually `mail.yourdomain.com` or server-specific like `arrow.mxrouting.net`

### 3. Test SMTP Connection

You can test SMTP outside of Supabase first:

**Option 1: Use an SMTP testing tool**
- Try https://www.smtper.net/
- Enter your MXRoute SMTP details
- Send a test email

**Option 2: Check MXRoute control panel**
- Login to MXRoute control panel
- Check email logs for any send attempts
- Verify account status and quotas

### 4. Supabase-Specific Issues

**Authentication Method:**
- Supabase requires SMTP AUTH
- Make sure your email account allows SMTP authentication
- Some providers require "Less secure app access" to be enabled

**Rate Limits:**
- Check if you've hit any rate limits
- MXRoute has sending limits per hour/day

### 5. Debugging Steps

1. **Test with default Supabase email first**
   - Temporarily switch back to Supabase's email service
   - If it works, the issue is SMTP configuration

2. **Check Supabase logs**
   - Go to Supabase Dashboard → Logs
   - Look for authentication/email related errors

3. **Verify email account**
   - Try sending an email from noreply@eigotankentai.com manually
   - Use a regular email client to test SMTP settings

### 6. Common Error Messages and Solutions

**"Authentication failed"**
- Wrong username/password
- Email account doesn't exist
- SMTP auth not enabled

**"Connection timeout"**
- Wrong host or port
- Firewall blocking connection
- Try different port (587 vs 465)

**"Relay access denied"**
- SMTP authentication not working
- Wrong sender email domain

### 7. MXRoute Specific Notes

- MXRoute typically uses hostname format like `arrow.mxrouting.net`
- Check your MXRoute welcome email for exact server details
- Some MXRoute servers require specific hostnames

### 8. Recommended Test Process

1. **Get exact SMTP details from MXRoute**
   - Server hostname (not just mail.yourdomain.com)
   - Exact port recommendations
   - Any specific requirements

2. **Test with email client first**
   - Configure Thunderbird/Outlook with same settings
   - Try sending test email

3. **Apply working settings to Supabase**
   - Use exact same settings that worked in email client

### 9. Alternative: Use Resend (You already have it configured!)

Since you already have Resend configured in your .env file, you could:
- Set up Resend as your SMTP provider in Supabase
- Use Resend's SMTP settings instead of MXRoute
- This might be more reliable for transactional emails

**Resend SMTP Settings:**
- Host: smtp.resend.com
- Port: 587
- Username: resend
- Password: Your Resend API key

Would you like me to help you set up Resend as your SMTP provider instead, or do you want to continue troubleshooting MXRoute?
