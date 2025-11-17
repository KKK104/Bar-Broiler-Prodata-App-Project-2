-- Fix Authentication Session Missing Error
-- This script creates more flexible RLS policies that handle missing auth sessions

-- ===== DROP EXISTING POLICIES =====
DROP POLICY IF EXISTS "Farm owners can view their participants" ON participants;
DROP POLICY IF EXISTS "Farm owners can manage their participants" ON participants;
DROP POLICY IF EXISTS "Participants can view own record" ON participants;

-- ===== CREATE FLEXIBLE POLICIES =====

-- Policy 1: Allow access if user owns the farm OR if no auth is required for read operations
CREATE POLICY "Flexible participant access" ON participants
    FOR ALL USING (
        -- Allow if user owns the farm
        (auth.uid() IS NOT NULL AND farm_id IN (
            SELECT id FROM farms WHERE owner_id = auth.uid()
        ))
        OR
        -- Allow read access for participants table (for participant login flow)
        (auth.uid() IS NULL AND current_setting('request.method', true) = 'GET')
    );

-- ===== ALTERNATIVE: DISABLE RLS TEMPORARILY FOR TESTING =====
-- Uncomment these lines if you want to disable RLS temporarily for testing
-- ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE farms DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;

-- ===== CREATE SERVICE ROLE BYPASS (FOR DEVELOPMENT) =====
-- This allows service role to bypass RLS for development
CREATE POLICY "Service role bypass" ON participants
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role bypass farms" ON farms
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ===== CHECK CURRENT AUTH STATE =====
-- Run this to see current auth state
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    current_setting('request.jwt.claims', true) as jwt_claims;

-- ===== GRANT PERMISSIONS FOR ANON ACCESS =====
-- Allow anonymous access for participant authentication
GRANT SELECT ON participants TO anon;
GRANT SELECT ON farms TO anon;

COMMIT;

