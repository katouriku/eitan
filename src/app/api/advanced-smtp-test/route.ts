import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Use direct Supabase client (works better with Next.js 15)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    console.log('Testing advanced SMTP diagnostics...')
    
    // Test 1: Check if email confirmations are enabled
    console.log('Test 1: Checking auth settings...')
    
    // Test 2: Attempt password reset with detailed logging
    console.log('Test 2: Attempting password reset...')
    const { data, error } = await supabase.auth.resetPasswordForEmail('luke@eigotankentai.com', {
      redirectTo: 'http://localhost:3000/auth/callback'
    })
    
    console.log('Password reset response data:', data)
    console.log('Password reset error:', error)
    
    // Test 3: Try sign up (which should trigger confirmation email)
    console.log('Test 3: Testing signup confirmation email...')
    const signUpResult = await supabase.auth.signUp({
      email: 'test+' + Date.now() + '@eigotankentai.com',
      password: 'TestPassword123!',
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback'
      }
    })
    
    console.log('Signup result:', signUpResult)
    
    return NextResponse.json({
      success: true,
      message: 'Advanced SMTP diagnostics completed',
      tests: {
        passwordReset: {
          data,
          error: error?.message || null,
          status: error ? 'failed' : 'success'
        },
        signUp: {
          data: signUpResult.data,
          error: signUpResult.error?.message || null,
          status: signUpResult.error ? 'failed' : 'success',
          userCreated: !!signUpResult.data.user,
          confirmationSent: !signUpResult.error && !!signUpResult.data.user
        }
      },
      instructions: [
        '1. Check your email for both password reset and signup confirmation',
        '2. If no emails received but status shows success, SMTP config is likely wrong',
        '3. Check Supabase Dashboard > Authentication > Settings',
        '4. Verify SMTP settings and that email confirmations are enabled',
        '5. Consider using Resend SMTP instead of MXRoute'
      ]
    })
    
  } catch (error) {
    console.error('Advanced SMTP test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Advanced SMTP diagnostics failed'
    }, { status: 500 })
  }
}
