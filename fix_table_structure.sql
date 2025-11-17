-- ============================================
-- FIX TABLE STRUCTURE FOR VERIFICATION SYSTEM
-- ============================================

-- First, let's see what columns actually exist
SELECT 
    'Current table structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'user_verification_status'
ORDER BY ordinal_position;

-- Check if we need to add missing columns
DO $$ 
BEGIN
    -- Add email column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_verification_status' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE user_verification_status ADD COLUMN email TEXT;
        RAISE NOTICE 'Added email column';
    ELSE
        RAISE NOTICE 'Email column already exists';
    END IF;

    -- Add is_new_user column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_verification_status' 
        AND column_name = 'is_new_user'
    ) THEN
        ALTER TABLE user_verification_status ADD COLUMN is_new_user BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_new_user column';
    ELSE
        RAISE NOTICE 'is_new_user column already exists';
    END IF;

    -- Add has_completed_onboarding column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_verification_status' 
        AND column_name = 'has_completed_onboarding'
    ) THEN
        ALTER TABLE user_verification_status ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added has_completed_onboarding column';
    ELSE
        RAISE NOTICE 'has_completed_onboarding column already exists';
    END IF;

    -- Add onboarding_completed_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_verification_status' 
        AND column_name = 'onboarding_completed_at'
    ) THEN
        ALTER TABLE user_verification_status ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added onboarding_completed_at column';
    ELSE
        RAISE NOTICE 'onboarding_completed_at column already exists';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_verification_status' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE user_verification_status ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    ELSE
        RAISE NOTICE 'created_at column already exists';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_verification_status' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE user_verification_status ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;

END $$;

-- Show the updated table structure
SELECT 
    'Updated table structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'user_verification_status'
ORDER BY ordinal_position;

-- Update existing records to have proper defaults
UPDATE user_verification_status 
SET 
    is_new_user = COALESCE(is_new_user, TRUE),
    has_completed_onboarding = COALESCE(has_completed_onboarding, FALSE),
    created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE is_new_user IS NULL 
   OR has_completed_onboarding IS NULL 
   OR created_at IS NULL 
   OR updated_at IS NULL;

-- Show sample data after update
SELECT 
    'Sample data after update' as info,
    user_id,
    email,
    is_verified,
    verified_at,
    is_new_user,
    has_completed_onboarding,
    onboarding_completed_at,
    created_at,
    updated_at
FROM user_verification_status 
LIMIT 5;

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_verification_status_updated_at ON user_verification_status;

-- Create the trigger
CREATE TRIGGER update_user_verification_status_updated_at
    BEFORE UPDATE ON user_verification_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Show final table structure
SELECT 
    'Final table structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_verification_status'
ORDER BY ordinal_position;

-- Show table statistics
SELECT 
    'Table statistics' as info,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE is_verified = TRUE) as verified_users,
    COUNT(*) FILTER (WHERE is_new_user = TRUE) as new_users,
    COUNT(*) FILTER (WHERE has_completed_onboarding = TRUE) as completed_onboarding
FROM user_verification_status;






