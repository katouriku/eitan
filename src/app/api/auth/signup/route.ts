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
    const { 
      email, 
      password, 
      full_name, 
      full_name_kana,
      // Student information (optional)
      isStudentBooker,
      studentName,
      studentAge,
      studentGrade,
      studentEnglishLevel,
      studentNotes,
      // Flag to auto-confirm user (for booking flow)
      autoConfirm = false
    } = await req.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create user account
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: autoConfirm, // Auto-confirm for booking flow, require confirmation for regular signup
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
          : 'アカウント作成に失敗しました。',
        details: error.message
      }, { status: 400 });
    }

    console.log('User created successfully:', data.user?.email, 'confirmed:', data.user?.email_confirmed_at ? 'yes' : 'no');

    if (data.user) {
      // Create corresponding user_profiles record
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
      }

      // Create student record if student information is provided
      if (!isStudentBooker && studentName) {
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            parent_id: data.user.id,
            name: studentName,
            age: studentAge || '',
            grade_level: studentGrade || '',
            english_ability: studentEnglishLevel || '',
            notes: studentNotes || ''
          });

        if (studentError) {
          console.error('Student creation error:', studentError);
        }
      }
    }

    return NextResponse.json({ 
      user: data.user,
      message: 'アカウント登録成功',
      confirmed: data.user?.email_confirmed_at ? true : false
    });

  } catch (err) {
    console.error('Signup API error:', err);
    return NextResponse.json({ 
      error: 'サーバーエラーが発生しました。' 
    }, { status: 500 });
  }
}
