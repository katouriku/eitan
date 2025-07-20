import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Use direct Supabase client (works better with Next.js 15)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Test password reset email (this will use your SMTP settings)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${request.nextUrl.origin}/reset-password?from=email`
    })
    
    if (error) {
      console.error('Email send error:', error)
      return NextResponse.json({ 
        error: error.message,
        details: 'SMTP configuration may be incorrect'
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully' 
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
