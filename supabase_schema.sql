-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
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

-- Create an index on date for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);

-- Create an index on email for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON bookings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for the bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for the bookings table
-- Allow all operations for authenticated users (you can restrict this further based on your needs)
CREATE POLICY "Allow all operations for authenticated users" ON bookings
    FOR ALL USING (true);

-- Allow read access for anonymous users (if you want public read access)
-- You might want to remove this depending on your security requirements
CREATE POLICY "Allow read access for all" ON bookings
    FOR SELECT USING (true);
