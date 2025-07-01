-- Create bookings table
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

-- Create availability table
CREATE TABLE IF NOT EXISTS public.availability (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON public.bookings(email);
CREATE INDEX IF NOT EXISTS idx_availability_day ON public.availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_availability_active ON public.availability(is_active);

-- Create unique constraint to prevent double bookings (one booking per exact datetime)
CREATE UNIQUE INDEX IF NOT EXISTS unique_booking_datetime ON public.bookings (date);

-- Create unique constraint for availability slots
CREATE UNIQUE INDEX IF NOT EXISTS unique_availability_slot ON public.availability (day_of_week, start_time, end_time);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_availability_updated_at ON public.availability;
CREATE TRIGGER update_availability_updated_at
    BEFORE UPDATE ON public.availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings table
DROP POLICY IF EXISTS "Service role can manage bookings" ON public.bookings;
CREATE POLICY "Service role can manage bookings" ON public.bookings
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Public can read bookings for availability" ON public.bookings;
CREATE POLICY "Public can read bookings for availability" ON public.bookings
    FOR SELECT USING (true);

-- Create policies for availability table
DROP POLICY IF EXISTS "Service role can manage availability" ON public.availability;
CREATE POLICY "Service role can manage availability" ON public.availability
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Public can read availability" ON public.availability;
CREATE POLICY "Public can read availability" ON public.availability
    FOR SELECT USING (true);
