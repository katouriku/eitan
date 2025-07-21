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
    return NextResponse.redirect(`${requestUrl.origin}?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    try {
      // Use direct Supabase client for auth callback
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) {
        console.error('Auth callback error:', exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}?error=${encodeURIComponent('auth_error')}`)
      }
      
      console.log('Auth callback successful, type:', type)
      
      // If this is an email confirmation (signup), create user profile if it doesn't exist
      if (type === 'signup' && data.user) {
        try {
          // Use service role key for admin operations
          const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          
          // Check if profile already exists
          const { data: existingProfile } = await adminSupabase
            .from('user_profiles')
            .select('id')
            .eq('id', data.user.id)
            .single()
          
          if (!existingProfile) {
            // Create user profile
            const { error: profileError } = await adminSupabase
              .from('user_profiles')
              .insert({
                id: data.user.id,
                email: data.user.email,
                full_name: data.user.user_metadata?.full_name || '',
                full_name_kana: data.user.user_metadata?.full_name_kana || '',
                preferred_location: data.user.user_metadata?.preferred_location || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            
            if (profileError) {
              console.error('Profile creation error during email confirmation:', profileError)
            } else {
              console.log('Profile created successfully for confirmed user:', data.user.email)
            }
          }
        } catch (profileErr) {
          console.error('Profile creation error during email confirmation:', profileErr)
        }
      }
      
      // If this is a password reset, redirect to password reset page
      if (type === 'recovery') {
        console.log('Redirecting to reset password page')
        return NextResponse.redirect(`${requestUrl.origin}/reset-password`)
      }
      
    } catch (error) {
      console.error('Auth callback exchange error:', error)
      return NextResponse.redirect(`${requestUrl.origin}?error=${encodeURIComponent('auth_error')}`)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}?message=${encodeURIComponent('Successfully verified email')}`)
}
