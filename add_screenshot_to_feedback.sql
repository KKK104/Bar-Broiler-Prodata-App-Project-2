-- Add screenshot column to feedback table
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS screenshot TEXT;

-- Add comment to document the column
COMMENT ON COLUMN feedback.screenshot IS 'Base64 encoded screenshot image data';

-- Update RLS policies to include screenshot field
-- (The existing policies should work fine since they're based on user_email and farm_id)
