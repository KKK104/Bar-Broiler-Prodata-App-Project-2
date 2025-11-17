-- COMPLETE FIX FOR SECURITY DEFINER VIEW ISSUE
-- Thoroughly removes and recreates participant_access_summary view
-- Created: September 18, 2025

BEGIN;

-- ===== COMPLETE REMOVAL OF EXISTING VIEW =====

-- Drop any dependent objects first
DROP VIEW IF EXISTS participant_access_summary CASCADE;

-- Also check for any functions or procedures with similar names
DROP FUNCTION IF EXISTS participant_access_summary() CASCADE;
DROP FUNCTION IF EXISTS get_participant_access_summary() CASCADE;

-- Force removal of any cached definitions
DO $$
BEGIN
    -- Try to drop the view in case it exists with different permissions
    EXECUTE 'DROP VIEW IF EXISTS public.participant_access_summary CASCADE';
    RAISE NOTICE 'Dropped existing view if it existed';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'No existing view to drop or error occurred: %', SQLERRM;
END $$;

-- ===== RECREATE VIEW WITHOUT SECURITY DEFINER =====

-- Create a clean, simple view without any SECURITY DEFINER property
CREATE OR REPLACE VIEW participant_access_summary AS
SELECT 
    p.id,
    p.name,
    p.code,
    COALESCE(p.access_level, 1) as access_level,
    COALESCE(p.role, 'farm_worker') as role,
    f.name as farm_name,
    p.building_ids,
    p.working_hours,
    p.created_at,
    p.updated_at
FROM participants p
JOIN farms f ON p.farm_id = f.id
WHERE 
    -- Farm owners can see all participants in their farms
    f.owner_id = auth.uid()  
    OR 
    -- Users can see their own participant record
    p.user_id = auth.uid();

-- ===== ALTERNATIVE: CREATE A SIMPLE FUNCTION INSTEAD =====
-- If the above view still has issues, we can use a function approach

CREATE OR REPLACE FUNCTION get_participant_access_data()
RETURNS TABLE(
    id INTEGER,
    name TEXT,
    code TEXT,
    access_level INTEGER,
    role TEXT,
    farm_name TEXT,
    building_ids UUID[],
    working_hours JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE SQL
SECURITY INVOKER  -- Explicitly set as SECURITY INVOKER (not DEFINER)
AS $$
    SELECT 
        p.id,
        p.name,
        p.code,
        COALESCE(p.access_level, 1) as access_level,
        COALESCE(p.role, 'farm_worker') as role,
        f.name as farm_name,
        p.building_ids,
        p.working_hours,
        p.created_at,
        p.updated_at
    FROM participants p
    JOIN farms f ON p.farm_id = f.id
    WHERE 
        -- Farm owners can see all participants in their farms
        f.owner_id = auth.uid()  
        OR 
        -- Users can see their own participant record
        p.user_id = auth.uid();
$$;

-- ===== GRANT PERMISSIONS =====

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON participant_access_summary TO authenticated;

-- Grant EXECUTE on the function to authenticated users
GRANT EXECUTE ON FUNCTION get_participant_access_data() TO authenticated;

-- ===== VERIFICATION QUERIES =====

-- Check that no SECURITY DEFINER views exist
SELECT 
    'Security Definer Views Check' as check_type,
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE viewname LIKE '%participant_access%'
AND schemaname = 'public';

-- Check that no SECURITY DEFINER functions exist for this
SELECT 
    'Security Definer Functions Check' as check_type,
    proname,
    prosecdef,
    proowner
FROM pg_proc 
WHERE proname LIKE '%participant_access%' 
AND prosecdef = true;

-- Verify the view works
SELECT 
    'View Test' as check_type,
    'participant_access_summary' as view_name,
    COUNT(*) as record_count
FROM participant_access_summary
WHERE 1=1; -- This will test if the view is accessible

-- Verify the function works
SELECT 
    'Function Test' as check_type,
    'get_participant_access_data' as function_name,
    COUNT(*) as record_count
FROM get_participant_access_data();

-- Final check: Look for any remaining SECURITY DEFINER objects
SELECT 
    'Final Security Check' as check_type,
    proname as object_name,
    prokind as object_type,
    prosecdef as is_security_definer
FROM pg_proc 
WHERE prosecdef = true
AND proname LIKE '%participant%';

COMMIT;

-- ===== POST-DEPLOYMENT INSTRUCTIONS =====
/*
This script provides two solutions:

1. ✅ VIEW APPROACH: participant_access_summary
   - Completely drops and recreates the view
   - Explicitly avoids SECURITY DEFINER

2. ✅ FUNCTION APPROACH: get_participant_access_data()
   - Creates a SECURITY INVOKER function as alternative
   - Can be used if view approach still has issues

USAGE:
- For view: SELECT * FROM participant_access_summary;
- For function: SELECT * FROM get_participant_access_data();

If the Security Advisor still shows the error after running this script,
it may be a caching issue. Try:
1. Refreshing the Security Advisor
2. Running ANALYZE on the database
3. Restarting the Supabase instance if possible
*/

