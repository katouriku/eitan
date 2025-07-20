import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const error = requestUrl.searchParams.get('error')
  
  // Debug logging
  console.log('Auth callback params:', {
    code: code ? 'present' : 'missing',
    type,
    error,
    fullUrl: requestUrl.toString()
  })

  if (error) {
    console.error('Auth callback received error:', error)
    return NextResponse.redirect(`${requestUrl.origin}?error=${error}`)
  }

  if (code) {
    try {
      // Use direct Supabase client for auth callback
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(`${requestUrl.origin}?error=auth_error`)
      }
      
      console.log('Auth callback successful, type:', type)
      
      // If this is a password reset, redirect to password reset page
      if (type === 'recovery') {
        console.log('Redirecting to reset password page')
        return NextResponse.redirect(`${requestUrl.origin}/reset-password`)
      }
      
    } catch (error) {
      console.error('Auth callback exchange error:', error)
      return NextResponse.redirect(`${requestUrl.origin}?error=auth_error`)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}
