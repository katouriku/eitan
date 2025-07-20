import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Use direct Supabase client (works better with Next.js 15)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    console.log('Testing Resend SMTP with domain verification check...')
    
    // Test with likely unverified domain first
    console.log('Test 1: Testing with eigotankentai.com domain (likely unverified)...')
    const test1 = await supabase.auth.resetPasswordForEmail('test@gmail.com', {
      redirectTo: 'http://localhost:3000/auth/callback'
    })
    
    // Also test signup to see detailed error
    console.log('Test 2: Testing signup with eigotankentai.com domain...')
    const test2 = await supabase.auth.signUp({
      email: 'test' + Date.now() + '@gmail.com',
      password: 'TestPassword123!',
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback'
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Resend domain verification test completed',
      tests: {
        passwordReset: {
          error: test1.error?.message || null,
          status: test1.error ? 'failed' : 'success'
        },
        signUp: {
          error: test2.error?.message || null,
          status: test2.error ? 'failed' : 'success',
          userCreated: !!test2.data.user
        }
      },
      diagnostics: {
        commonIssues: [
          'Domain eigotankentai.com not verified in Resend',
          'Sender email should be onboarding@resend.dev if domain not verified',
          'SMTP settings might be incorrect',
          'Email confirmations might be disabled in Supabase'
        ],
        solutions: [
          'Check https://resend.com/domains for domain verification status',
          'If not verified, change sender email to onboarding@resend.dev',
          'Verify domain by adding DNS records if you want custom email',
          'Consider using Gmail SMTP as alternative'
        ]
      },
      instructions: [
        '1. Check if you received any emails',
        '2. If no emails but success=true: Domain verification issue',
        '3. Go to https://resend.com/domains to check status',
        '4. If domain not verified: Change sender to onboarding@resend.dev',
        '5. If still failing: Try Gmail SMTP instead'
      ]
    })
    
  } catch (error) {
    console.error('Resend domain test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Resend domain verification test failed'
    }, { status: 500 })
  }
}
