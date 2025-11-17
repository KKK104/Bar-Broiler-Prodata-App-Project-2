-- DIRECT FIX FOR SECURITY DEFINER VIEW
-- Simple, direct approach to fix the participant_access_summary view
-- Created: September 18, 2025

-- Step 1: Force drop the existing view
DROP VIEW IF EXISTS public.participant_access_summary CASCADE;

-- Step 2: Create a new view WITHOUT any SECURITY DEFINER property
-- Note: By default, views are created as SECURITY INVOKER (which is what we want)
CREATE VIEW public.participant_access_summary AS
SELECT 
    p.id,
    p.name,
    p.code,
    p.created_at,
    p.updated_at,
    f.name as farm_name
FROM public.participants p
JOIN public.farms f ON p.farm_id = f.id
WHERE 
    f.owner_id = auth.uid()  -- Only show participants from farms owned by current user
    OR 
    p.user_id = auth.uid();  -- Or show user's own participant record

-- Step 3: Grant appropriate permissions
GRANT SELECT ON public.participant_access_summary TO authenticated;

-- Step 4: Verify the fix
SELECT 
    'View created successfully' as status,
    viewname,
    schemaname
FROM pg_views 
WHERE viewname = 'participant_access_summary';

-- Final verification: Check for any remaining SECURITY DEFINER issues
-- This should return no rows if the fix worked
SELECT 
    proname,
    prosecdef as is_security_definer
FROM pg_proc 
WHERE proname LIKE '%participant_access_summary%' 
AND prosecdef = true;

