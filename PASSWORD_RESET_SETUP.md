# Password Reset Email Template Setup

## Password Reset Template Created
I've created `supabase-password-reset-template.html` with a professional design for password reset emails.

## Setup Instructions

### 1. Configure Password Reset Email Template in Supabase

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Navigate to Email Templates**
   - Go to Authentication → Email Templates
   - Click on "Reset password"

3. **Update the Template**
   - Replace the default HTML with the content from `supabase-password-reset-template.html`
   - Set the subject line to: "パスワードリセット - EigoTankentai"

### 2. Password Reset Email Template Features

✅ **Professional Design**: Matches your brand colors and style
✅ **Security Warning**: Orange icon with lock symbol
✅ **Clear Instructions**: Step-by-step guidance in Japanese
✅ **Security Notes**: Important warnings about link expiration and security
✅ **Password Tips**: Helpful suggestions for creating strong passwords
✅ **Mobile Responsive**: Looks great on all devices
✅ **Fallback Link**: Copy-paste URL if button doesn't work

### 3. Authentication Modal Updates

The authentication modal now includes:

- ✅ **Password Reset Button**: Shows only on login screen (not registration)
- ✅ **Dedicated Reset Screen**: Clean interface for entering email
- ✅ **Success/Error Messaging**: Clear feedback for users
- ✅ **Easy Navigation**: Back button to return to login

### 4. User Flow

1. **User clicks "パスワードを忘れた方はこちら"** on login screen
2. **Password reset screen appears** with email input
3. **User enters email** and clicks "リセットメールを送信"
4. **System sends branded email** with reset instructions
5. **User clicks reset link** in email
6. **User is redirected** to password change page
7. **User sets new password** and can login normally

### 5. Technical Implementation

**AuthContext Updates:**
- Added `resetPassword` function using `supabase.auth.resetPasswordForEmail()`
- Proper redirect URL set to `/auth/callback?type=recovery`
- Error handling for reset requests

**AuthModal Updates:**
- New `showPasswordReset` state for reset screen
- Dedicated reset form with email input
- Success/error message handling with proper styling
- Navigation between login and reset screens

### 6. Security Features

- ✅ **1-hour link expiration** (standard Supabase behavior)
- ✅ **Email verification** before password change
- ✅ **Secure redirect** through auth callback
- ✅ **Clear security warnings** in email template

### 7. Customization Options

You can customize:
- Link expiration time (in Supabase settings)
- Email template colors and branding
- Password complexity requirements
- Redirect URLs for different flows

The password reset system is now fully functional and ready for production use!
