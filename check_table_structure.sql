-- ============================================
-- CHECK ACTUAL TABLE STRUCTURE
-- ============================================

-- Check the actual columns in the table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'user_verification_status'
ORDER BY ordinal_position;

-- Check the actual data in the table
SELECT 
    user_id,
    email,
    is_verified,
    verified_at,
    created_at,
    updated_at
FROM user_verification_status 
LIMIT 5;

-- Check if any additional columns exist
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'user_verification_status' 
AND column_name LIKE '%new%' OR column_name LIKE '%onboard%' OR column_name LIKE '%complete%';

-- Show table constraints
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'user_verification_status';
