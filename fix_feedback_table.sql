-- Fix feedback table to allow NULL farm_id values
-- Run this in your Supabase SQL Editor

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_farm_id_fkey;

-- Add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE feedback 
ADD CONSTRAINT feedback_farm_id_fkey 
FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE SET NULL;

-- Make sure farm_id can be NULL (it should already be, but let's be explicit)
ALTER TABLE feedback ALTER COLUMN farm_id DROP NOT NULL;

-- Update RLS policies to handle NULL farm_id
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;

CREATE POLICY "Users can view their own feedback" ON feedback
    FOR SELECT USING (
        user_email = current_setting('request.jwt.claims', true)::json->>'email' OR
        farm_id IS NOT NULL OR
        user_email IS NOT NULL
    );

-- Grant necessary permissions
GRANT ALL ON feedback TO authenticated;
