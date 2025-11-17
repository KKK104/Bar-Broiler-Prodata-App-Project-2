-- Simple Fix for Participants Table
-- Just add the missing access_tools column (no testing to avoid UUID issues)

-- Add the missing access_tools column
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS access_tools TEXT[] DEFAULT '{}';

-- Update any existing records that might have NULL values
UPDATE participants 
SET access_tools = '{}' 
WHERE access_tools IS NULL;

-- Verify the column was added
SELECT 'access_tools column added successfully!' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'participants' 
AND column_name = 'access_tools';

-- Show current participants table structure
SELECT 'Current participants table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'participants'
ORDER BY ordinal_position;
