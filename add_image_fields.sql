-- Add image storage fields to calculator_sessions table
-- This will store the feed source and DOC images as base64 strings

-- Add feed_source_image field to store feed source image
ALTER TABLE calculator_sessions 
ADD COLUMN IF NOT EXISTS feed_source_image TEXT;

-- Add doc_image field to store DOC image  
ALTER TABLE calculator_sessions 
ADD COLUMN IF NOT EXISTS doc_image TEXT;

-- Add mortality_image field to daily_records table to store mortality photos
ALTER TABLE daily_records 
ADD COLUMN IF NOT EXISTS mortality_image TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN calculator_sessions.feed_source_image IS 'Base64 encoded image data for feed source photo';
COMMENT ON COLUMN calculator_sessions.doc_image IS 'Base64 encoded image data for DOC photo';
COMMENT ON COLUMN daily_records.mortality_image IS 'Base64 encoded image data for mortality photo';

-- Show success message
SELECT 'Image fields added successfully to calculator_sessions and daily_records tables!' as status;
