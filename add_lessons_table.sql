-- Simple script to add a lessons table to Supabase
-- Run this in your Supabase SQL Editor

-- Create lessons table for storing lesson/booking data
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    lesson_type TEXT NOT NULL CHECK (lesson_type IN ('online', 'in-person')),
    lesson_date DATE NOT NULL,
    lesson_time TIME NOT NULL,
    participants INTEGER DEFAULT 1,
    total_price INTEGER DEFAULT 0,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'cancelled', 'failed')),
    payment_method TEXT CHECK (payment_method IN ('card', 'cash')),
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- Create policies for lessons table
CREATE POLICY "Users can view own lessons" ON public.lessons
    FOR SELECT USING (
        auth.uid() = user_id OR 
        customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

CREATE POLICY "Anyone can create lessons" ON public.lessons
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own lessons" ON public.lessons
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        customer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_lessons_user_id ON public.lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_email ON public.lessons(customer_email);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON public.lessons(lesson_date);
