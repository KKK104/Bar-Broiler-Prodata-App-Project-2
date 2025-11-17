-- ============================================
-- TEST USER VERIFICATION SYSTEM
-- ============================================

-- Test 1: Check if the table exists
SELECT 'Test 1: Checking if user_verification_status table exists' as test_name;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_verification_status'
) as table_exists;

-- Test 2: Check if functions exist
SELECT 'Test 2: Checking if verification functions exist' as test_name;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('mark_user_verified', 'mark_user_onboarding_complete', 'get_user_verification_status')
ORDER BY routine_name;

-- Test 3: Check current users and their verification status
SELECT 'Test 3: Current users and verification status' as test_name;
SELECT 
    u.email,
    u.created_at as account_created,
    u.email_confirmed_at as supabase_verified,
    uvs.is_verified as db_verified,
    uvs.verified_at as db_verified_at,
    uvs.is_new_user as db_new_user,
    uvs.has_completed_onboarding as db_onboarding_complete
FROM auth.users u
LEFT JOIN user_verification_status uvs ON u.id = uvs.user_id
WHERE u.email IS NOT NULL
ORDER BY u.created_at DESC;

-- Test 4: Test the mark_user_verified function (replace with actual user ID)
SELECT 'Test 4: Testing mark_user_verified function' as test_name;
-- Note: Replace 'your-user-id-here' with an actual user ID from your database
-- SELECT mark_user_verified('your-user-id-here');

-- Test 5: Check verification status for a specific user (replace with actual user ID)
SELECT 'Test 5: Testing get_user_verification_status function' as test_name;
-- Note: Replace 'your-user-id-here' with an actual user ID from your database
-- SELECT * FROM get_user_verification_status('your-user-id-here');

-- Test 6: Check RLS policies
SELECT 'Test 6: Checking RLS policies' as test_name;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_verification_status'
ORDER BY policyname;

-- Test 7: Check table structure
SELECT 'Test 7: Checking table structure' as test_name;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_verification_status'
ORDER BY ordinal_position;

-- Test 8: Check indexes
SELECT 'Test 8: Checking indexes' as test_name;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_verification_status'
ORDER BY indexname;

-- ============================================
-- MANUAL TESTING INSTRUCTIONS
-- ============================================

SELECT 'Manual Testing Instructions:' as instruction;

SELECT '1. Run the user_verification_tracking.sql script in your Supabase SQL editor' as step;
SELECT '2. Check the results of the migration queries above' as step;
SELECT '3. Test with a real user by calling mark_user_verified(user_id)' as step;
SELECT '4. Verify the user_verification_status table is populated correctly' as step;
SELECT '5. Test the frontend integration by signing up a new user' as step;

-- ============================================
-- TROUBLESHOOTING QUERIES
-- ============================================

-- If you encounter issues, run these queries:

-- Check for any errors in the verification table
SELECT 'Troubleshooting: Check for orphaned records' as query_name;
SELECT 
    uvs.user_id,
    uvs.email,
    CASE 
        WHEN u.id IS NULL THEN 'ORPHANED - USER NOT FOUND'
        ELSE 'VALID'
    END as status
FROM user_verification_status uvs
LEFT JOIN auth.users u ON uvs.user_id = u.id
WHERE u.id IS NULL;

-- Check for users without verification records
SELECT 'Troubleshooting: Users without verification records' as query_name;
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.email_confirmed_at
FROM auth.users u
LEFT JOIN user_verification_status uvs ON u.id = uvs.user_id
WHERE uvs.user_id IS NULL
AND u.email IS NOT NULL;







