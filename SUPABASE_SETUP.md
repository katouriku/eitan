# Supabase Setup Instructions

## 1. Database Schema Setup

To complete the Supabase integration, you need to create the database schema. Follow these steps:

### Step 1: Access Supabase Dashboard
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in to your account
3. Select your project: `wnhimhkdfwlaylygveot`

### Step 2: Create the Database Schema
1. In your Supabase dashboard, navigate to **SQL Editor** (in the left sidebar)
2. Click **New Query**
3. Copy and paste the following SQL code:

```sql
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
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
-- Allow all operations for service role
CREATE POLICY "Allow all operations for service role" ON bookings
    FOR ALL USING (true);

-- Allow read access for authenticated users
CREATE POLICY "Allow read access for authenticated users" ON bookings
    FOR SELECT USING (auth.role() = 'authenticated');
```

4. Click **Run** to execute the SQL

### Step 3: Verify Setup
1. After running the SQL, you should see a success message
2. Navigate to **Table Editor** in your Supabase dashboard
3. You should see the `bookings` table listed
4. Test the connection by running: `GET http://localhost:3000/api/test-db`

## 2. What's Been Implemented

✅ **Removed Prisma completely** - All Prisma packages and files have been removed
✅ **Added Supabase client** - Full Supabase integration with TypeScript types
✅ **Updated environment variables** - Clean .env.local with only necessary variables
✅ **Created database models** - Booking interface and service methods
✅ **Updated booking API** - Now saves bookings to Supabase after sending emails
✅ **Added connection tests** - API endpoints to test database connectivity

## 3. Available API Endpoints

- `GET /api/test-db` - Test Supabase connection
- `POST /api/setup-db` - Check if database schema is set up
- `POST /api/book-lesson` - Create bookings (now saves to Supabase)

## 4. Database Operations Available

The `BookingService` class provides:
- `createBooking()` - Insert new booking
- `getBookingById()` - Fetch booking by ID
- `getBookingsByDateRange()` - Get bookings within date range
- `deleteBooking()` - Remove booking

## 5. Next Steps

After setting up the database schema:
1. Test the connection: `GET http://localhost:3000/api/test-db`
2. Try creating a test booking through your booking form
3. Check the Supabase dashboard to see the booking data

## 6. Security Notes

- Row Level Security (RLS) is enabled
- Service role key is used for server-side operations
- Anonymous key is used for client-side operations
- Policies restrict access appropriately

Your booking system is now fully integrated with Supabase Postgres!
