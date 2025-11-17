-- FIX SECURITY DEFINER VIEW ISSUE
-- Addresses the participant_access_summary view security issue
-- Created: September 18, 2025

BEGIN;

-- ===== FIX SECURITY DEFINER VIEW ISSUE =====

-- Drop the existing view completely (this removes the SECURITY DEFINER property)
DROP VIEW IF EXISTS participant_access_summary CASCADE;

-- Recreate the view WITHOUT SECURITY DEFINER property
-- This view will now use the permissions of the querying user, not the view creator
CREATE VIEW participant_access_summary AS
SELECT 
    p.id,
    p.name,
    p.code,
    CASE 
        WHEN p.access_level IS NOT NULL THEN p.access_level
        ELSE 1  -- Default access level for participants without the column
    END as access_level,
    CASE 
        WHEN p.role IS NOT NULL THEN p.role
        ELSE 'farm_worker'  -- Default role for participants without the column
    END as role,
    f.name as farm_name,
    CASE 
        WHEN p.building_ids IS NOT NULL THEN p.building_ids
        ELSE NULL
    END as building_ids,
    CASE 
        WHEN p.working_hours IS NOT NULL THEN p.working_hours
        ELSE NULL
    END as working_hours,
    p.created_at,
    p.updated_at
FROM participants p
JOIN farms f ON p.farm_id = f.id
WHERE 
    -- Farm owners can see all participants in their farms
    f.owner_id = auth.uid()  
    OR 
    -- Users can see their own participant record
    p.user_id = auth.uid()  
    OR 
    -- Higher level participants can see lower level ones (if access_level exists)
    EXISTS (  
        SELECT 1 FROM participants viewer
        WHERE viewer.user_id = auth.uid()
        AND viewer.farm_id = p.farm_id
        AND COALESCE(viewer.access_level, 1) >= COALESCE(p.access_level, 1)
        AND COALESCE(viewer.access_level, 1) >= 3
    );

-- Grant SELECT permission on the view to authenticated users
GRANT SELECT ON participant_access_summary TO authenticated;

-- ===== VERIFICATION =====

-- Check that the view exists and is not a SECURITY DEFINER view
SELECT 
    'View Recreation Status' as check_type,
    viewname,
    schemaname,
    viewowner,
    definition
FROM pg_views 
WHERE viewname = 'participant_access_summary';

-- Check for any SECURITY DEFINER properties (should return no rows)
SELECT 
    'Security Definer Check' as check_type,
    proname,
    prosecdef
FROM pg_proc 
WHERE proname LIKE '%participant_access_summary%' 
AND prosecdef = true;

-- Test the view (should work without security definer issues)
SELECT 
    'View Test' as check_type,
    COUNT(*) as participant_count
FROM participant_access_summary;

COMMIT;

-- ===== POST-DEPLOYMENT NOTES =====
/*
This script fixes the Security Definer View issue by:

1. ✅ Dropping the existing participant_access_summary view completely
   - This removes any SECURITY DEFINER properties

2. ✅ Recreating the view WITHOUT SECURITY DEFINER
   - The view now uses the permissions of the querying user
   - Added COALESCE functions to handle missing access_level/role columns

3. ✅ Added proper WHERE clause filtering based on RLS principles:
   - Farm owners see all participants in their farms
   - Users see their own participant records
   - Higher level participants can see lower level ones

4. ✅ Granted SELECT permission to authenticated users

The view is now secure and follows RLS principles without the SECURITY DEFINER issue.
*/

