-- Add student information columns to the bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS is_student_booker BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS student_name TEXT,
ADD COLUMN IF NOT EXISTS student_age TEXT,
ADD COLUMN IF NOT EXISTS student_grade TEXT,
ADD COLUMN IF NOT EXISTS student_english_level TEXT,
ADD COLUMN IF NOT EXISTS student_notes TEXT;

-- Add a comment to document the new columns
COMMENT ON COLUMN bookings.is_student_booker IS 'Whether the person making the booking is also the student';
COMMENT ON COLUMN bookings.student_name IS 'Name of the student (if different from booker)';
COMMENT ON COLUMN bookings.student_age IS 'Age of the student';
COMMENT ON COLUMN bookings.student_grade IS 'Grade level of the student';
COMMENT ON COLUMN bookings.student_english_level IS 'English proficiency level of the student';
COMMENT ON COLUMN bookings.student_notes IS 'Special notes about the student or lesson requirements';
