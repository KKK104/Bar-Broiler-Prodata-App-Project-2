-- ============================================
-- USER VERIFICATION TRACKING SYSTEM
-- ============================================

-- Create a table to track user verification status and onboarding progress
CREATE TABLE IF NOT EXISTS user_verification_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    is_new_user BOOLEAN DEFAULT TRUE,
    has_completed_onboarding BOOLEAN DEFAULT FALSE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_verification_status_user_id ON user_verification_status(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verification_status_email ON user_verification_status(email);
CREATE INDEX IF NOT EXISTS idx_user_verification_status_is_verified ON user_verification_status(is_verified);
CREATE INDEX IF NOT EXISTS idx_user_verification_status_is_new_user ON user_verification_status(is_new_user);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_verification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_verification_status_updated_at 
    BEFORE UPDATE ON user_verification_status 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_verification_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE user_verification_status ENABLE ROW LEVEL SECURITY;

-- Create policies for user_verification_status table
-- Users can view their own verification status
CREATE POLICY "Users can view their own verification status" ON user_verification_status
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own verification status
CREATE POLICY "Users can insert their own verification status" ON user_verification_status
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own verification status
CREATE POLICY "Users can update their own verification status" ON user_verification_status
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS FOR VERIFICATION MANAGEMENT
-- ============================================

-- Function to mark user as verified
CREATE OR REPLACE FUNCTION mark_user_verified(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_email TEXT;
    verification_record RECORD;
BEGIN
    -- Get user email
    SELECT email INTO user_email FROM auth.users WHERE id = user_uuid;
    
    IF user_email IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Check if verification record exists
    SELECT * INTO verification_record FROM user_verification_status WHERE user_id = user_uuid;
    
    IF verification_record IS NULL THEN
        -- Create new verification record
        INSERT INTO user_verification_status (
            user_id, 
            email, 
            is_verified, 
            verified_at,
            is_new_user
        ) VALUES (
            user_uuid,
            user_email,
            TRUE,
            NOW(),
            TRUE
        );
    ELSE
        -- Update existing verification record
        UPDATE user_verification_status 
        SET 
            is_verified = TRUE,
            verified_at = NOW(),
            updated_at = NOW()
        WHERE user_id = user_uuid;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark user as not new (completed onboarding)
CREATE OR REPLACE FUNCTION mark_user_onboarding_complete(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_verification_status 
    SET 
        is_new_user = FALSE,
        has_completed_onboarding = TRUE,
        onboarding_completed_at = NOW(),
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user verification status
CREATE OR REPLACE FUNCTION get_user_verification_status(user_uuid UUID)
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    is_verified BOOLEAN,
    verified_at TIMESTAMP WITH TIME ZONE,
    is_new_user BOOLEAN,
    has_completed_onboarding BOOLEAN,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uvs.user_id,
        uvs.email,
        uvs.is_verified,
        uvs.verified_at,
        uvs.is_new_user,
        uvs.has_completed_onboarding,
        uvs.onboarding_completed_at
    FROM user_verification_status uvs
    WHERE uvs.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATE EXISTING USERS
-- ============================================

-- Insert verification records for existing users
INSERT INTO user_verification_status (
    user_id,
    email,
    is_verified,
    verified_at,
    is_new_user,
    has_completed_onboarding
)
SELECT 
    u.id,
    u.email,
    CASE 
        WHEN u.email_confirmed_at IS NOT NULL THEN TRUE
        ELSE FALSE
    END as is_verified,
    u.email_confirmed_at as verified_at,
    CASE 
        -- Consider user new if account created within last 24 hours and email verified
        WHEN u.created_at > NOW() - INTERVAL '24 hours' 
             AND u.email_confirmed_at IS NOT NULL 
             AND u.email_confirmed_at > NOW() - INTERVAL '24 hours' THEN TRUE
        ELSE FALSE
    END as is_new_user,
    CASE 
        -- Consider onboarding complete if user has data (buildings or participants)
        WHEN EXISTS (
            SELECT 1 FROM farms f 
            WHERE f.owner_id = u.id 
            AND (
                EXISTS (SELECT 1 FROM buildings b WHERE b.farm_id = f.id)
                OR EXISTS (SELECT 1 FROM participants p WHERE p.farm_id = f.id)
            )
        ) THEN TRUE
        ELSE FALSE
    END as has_completed_onboarding
FROM auth.users u
WHERE u.email IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check verification status for all users
SELECT 
    u.email,
    uvs.is_verified,
    uvs.verified_at,
    uvs.is_new_user,
    uvs.has_completed_onboarding,
    u.created_at as account_created_at,
    u.email_confirmed_at as supabase_verified_at
FROM auth.users u
LEFT JOIN user_verification_status uvs ON u.id = uvs.user_id
WHERE u.email IS NOT NULL
ORDER BY u.created_at DESC;

-- ============================================
-- CLEANUP AND MAINTENANCE
-- ============================================

-- Function to clean up old verification records (optional)
CREATE OR REPLACE FUNCTION cleanup_old_verification_records()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete verification records for users that no longer exist
    DELETE FROM user_verification_status 
    WHERE user_id NOT IN (SELECT id FROM auth.users);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION COMPLETE
-- ============================================

SELECT 'User verification tracking system created successfully!' as status;
SELECT COUNT(*) as total_users FROM auth.users WHERE email IS NOT NULL;
SELECT COUNT(*) as verification_records FROM user_verification_status;







