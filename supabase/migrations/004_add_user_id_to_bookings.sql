-- Add user_id column to bookings table to link bookings to users
-- This allows us to associate anonymous bookings with created user accounts

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'bookings' AND column_name = 'user_id') THEN
        ALTER TABLE public.bookings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated, anon;
GRANT ALL ON public.bookings TO service_role;

-- Update RLS policies to allow users to see their own bookings
CREATE POLICY IF NOT EXISTS "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow service role to manage all bookings
CREATE POLICY IF NOT EXISTS "Service role can manage all bookings" ON public.bookings
  USING (current_setting('role') = 'service_role');
