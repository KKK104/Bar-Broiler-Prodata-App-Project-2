-- ============================================
-- CHECK EXISTING DATABASE OBJECTS
-- ============================================

-- Check if the table exists
SELECT 
    'Table exists' as check_type,
    tablename,
    schemaname
FROM pg_tables 
WHERE tablename = 'user_verification_status';

-- Check existing indexes
SELECT 
    'Existing indexes' as check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'user_verification_status'
ORDER BY indexname;

-- Check existing policies
SELECT 
    'Existing policies' as check_type,
    policyname,
    tablename,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_verification_status'
ORDER BY policyname;

-- Check existing functions
SELECT 
    'Existing functions' as check_type,
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname LIKE '%verification%' OR proname LIKE '%user%'
ORDER BY proname;

-- Check existing materialized views
SELECT 
    'Existing materialized views' as check_type,
    matviewname,
    schemaname
FROM pg_matviews 
WHERE matviewname LIKE '%verification%' OR matviewname LIKE '%user%';

-- Check existing triggers
SELECT 
    'Existing triggers' as check_type,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_verification_status'
ORDER BY trigger_name;

-- Check table structure
SELECT 
    'Table structure' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_verification_status'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    'RLS status' as check_type,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_verification_status';

-- Check sample data
SELECT 
    'Sample data' as check_type,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE is_verified = TRUE) as verified_users,
    COUNT(*) FILTER (WHERE is_new_user = TRUE) as new_users,
    COUNT(*) FILTER (WHERE has_completed_onboarding = TRUE) as completed_onboarding
FROM user_verification_status;







