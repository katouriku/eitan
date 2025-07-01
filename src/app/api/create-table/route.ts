import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('Creating bookings table...')
    
    // Create the bookings table using raw SQL
    const { data, error } = await supabaseAdmin.rpc('sql', {
      query: `
        CREATE TABLE IF NOT EXISTS public.bookings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            kana VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            date TIMESTAMPTZ NOT NULL,
            duration INTEGER NOT NULL DEFAULT 60,
            details TEXT,
            lesson_type VARCHAR(50) NOT NULL CHECK (lesson_type IN ('online', 'in-person')),
            participants INTEGER NOT NULL DEFAULT 1,
            coupon VARCHAR(100),
            regular_price INTEGER NOT NULL,
            discount_amount INTEGER DEFAULT 0,
            final_price INTEGER NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(date);
        CREATE INDEX IF NOT EXISTS idx_bookings_email ON public.bookings(email);

        -- Create a function to automatically update the updated_at column
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Create trigger to automatically update updated_at
        DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
        CREATE TRIGGER update_bookings_updated_at 
            BEFORE UPDATE ON public.bookings 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();

        -- Enable Row Level Security (RLS) for the bookings table
        ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow all operations for service role" ON public.bookings;
        DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.bookings;

        -- Create policies for the bookings table
        CREATE POLICY "Allow all operations for service role" ON public.bookings
            FOR ALL USING (true);

        CREATE POLICY "Allow read access for authenticated users" ON public.bookings
            FOR SELECT USING (auth.role() = 'authenticated');
      `
    })
    
    if (error) {
      console.error('Error creating table with RPC:', error)
      return NextResponse.json({
        success: false,
        message: 'Failed to create table automatically',
        error: error.message,
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to the SQL Editor',
          '3. Copy and paste the SQL from SUPABASE_SETUP.md',
          '4. Click Run to execute the SQL'
        ]
      }, { status: 500 })
    }
    
    console.log('✅ Bookings table created successfully!')
    return NextResponse.json({
      success: true,
      message: 'Bookings table created successfully!',
      data
    })
    
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to set up database schema',
      error: String(error),
      instructions: [
        '1. Go to your Supabase dashboard',
        '2. Navigate to the SQL Editor', 
        '3. Copy and paste the SQL from SUPABASE_SETUP.md',
        '4. Click Run to execute the SQL'
      ]
    }, { status: 500 })
  }
}
