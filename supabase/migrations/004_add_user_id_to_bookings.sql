-- Note: The bookings table doesn't need a user_id column since it stores email directly
-- This migration ensures proper RLS policies are in place for the bookings table

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated, anon;
GRANT ALL ON public.bookings TO service_role;

-- Enable RLS on bookings table if not already enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to allow users to see bookings with their email
CREATE POLICY IF NOT EXISTS "Users can view bookings with their email" ON public.bookings
  FOR SELECT USING (
    auth.jwt()->>'email' = email OR 
    current_setting('role') = 'service_role'
  );

-- Allow service role to manage all bookings
CREATE POLICY IF NOT EXISTS "Service role can manage all bookings" ON public.bookings
  USING (current_setting('role') = 'service_role');
