import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name, full_name_kana } = await req.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create user account
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for booking flow
      user_metadata: {
        full_name,
        full_name_kana,
      }
    });

    if (error) {
      console.error('Signup error:', error);
      return NextResponse.json({ 
        error: error.message.includes('already registered') 
          ? 'このメールアドレスは既に登録されています。' 
          : 'アカウント作成に失敗しました。' 
      }, { status: 400 });
    }

    // Create corresponding user_profiles record
    if (data.user) {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          full_name,
          full_name_kana,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't fail the entire signup if profile creation fails
        // The user can still be created in auth.users
      }
    }

    return NextResponse.json({ 
      user: data.user,
      message: 'Account created successfully' 
    });

  } catch (err) {
    console.error('Signup API error:', err);
    return NextResponse.json({ 
      error: 'サーバーエラーが発生しました。' 
    }, { status: 500 });
  }
}
