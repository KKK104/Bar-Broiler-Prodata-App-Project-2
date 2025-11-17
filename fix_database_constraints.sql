-- Comprehensive Database Fix Script
-- Run this in your Supabase SQL Editor to fix all foreign key constraint issues

-- 1. First, let's check the current state of all tables
SELECT '=== DATABASE DIAGNOSTIC REPORT ===' as status;

-- Check farms table structure
SELECT 'Farms table structure:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'farms'
ORDER BY ordinal_position;

-- Check participants table structure
SELECT 'Participants table structure:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'participants'
ORDER BY ordinal_position;

-- Check calculator_sessions table structure
SELECT 'Calculator_sessions table structure:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'calculator_sessions'
ORDER BY ordinal_position;

-- 2. Check for orphaned records
SELECT '=== ORPHANED RECORDS CHECK ===' as status;

-- Check participants with invalid farm_id
SELECT 'Participants with invalid farm_id:' as status;
SELECT 
  p.id as participant_id,
  p.name as participant_name,
  p.farm_id,
  CASE 
    WHEN f.id IS NULL THEN 'ORPHANED - FARM NOT FOUND'
    ELSE 'VALID'
  END as status
FROM participants p
LEFT JOIN farms f ON p.farm_id = f.id
WHERE f.id IS NULL;

-- Check calculator_sessions with invalid farm_id
SELECT 'Calculator_sessions with invalid farm_id:' as status;
SELECT 
  cs.id as session_id,
  cs.farm_id,
  cs.building_id,
  CASE 
    WHEN f.id IS NULL THEN 'ORPHANED - FARM NOT FOUND'
    ELSE 'VALID'
  END as status
FROM calculator_sessions cs
LEFT JOIN farms f ON cs.farm_id = f.id
WHERE f.id IS NULL;

-- Check buildings with invalid farm_id
SELECT 'Buildings with invalid farm_id:' as status;
SELECT 
  b.id as building_id,
  b.building_number,
  b.farm_id,
  CASE 
    WHEN f.id IS NULL THEN 'ORPHANED - FARM NOT FOUND'
    ELSE 'VALID'
  END as status
FROM buildings b
LEFT JOIN farms f ON b.farm_id = f.id
WHERE f.id IS NULL;

-- 3. Fix the farms table first
SELECT '=== FIXING FARMS TABLE ===' as status;

-- Add owner_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'farms' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE farms ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added owner_id column to farms table';
  ELSE
    RAISE NOTICE 'owner_id column already exists';
  END IF;
END $$;

-- 4. Create missing farm for the user if needed
SELECT '=== CREATING MISSING FARM ===' as status;

-- Check if the user has a farm
DO $$
DECLARE
  user_farm_id UUID;
  user_id UUID;
BEGIN
  -- Get the user ID for leonacinintal@gmail.com
  SELECT id INTO user_id FROM auth.users WHERE email = 'leonacinintal@gmail.com';
  
  IF user_id IS NOT NULL THEN
    -- Check if user already has a farm
    SELECT id INTO user_farm_id FROM farms WHERE owner_id = user_id LIMIT 1;
    
    IF user_farm_id IS NULL THEN
      -- Create a new farm for the user
      INSERT INTO farms (id, name, owner_id, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'Default Farm',
        user_id,
        NOW(),
        NOW()
      )
      RETURNING id INTO user_farm_id;
      
      RAISE NOTICE 'Created new farm with ID: % for user: %', user_farm_id, user_id;
    ELSE
      RAISE NOTICE 'User already has farm with ID: %', user_farm_id;
    END IF;
  ELSE
    RAISE NOTICE 'User not found: leonacinintal@gmail.com';
  END IF;
END $$;

-- 5. Update orphaned records to use the correct farm_id
SELECT '=== FIXING ORPHANED RECORDS ===' as status;

-- Get the correct farm_id for the user
DO $$
DECLARE
  user_farm_id UUID;
  user_id UUID;
BEGIN
  -- Get the user ID and their farm ID
  SELECT u.id, f.id INTO user_id, user_farm_id 
  FROM auth.users u
  LEFT JOIN farms f ON u.id = f.owner_id
  WHERE u.email = 'leonacinintal@gmail.com';
  
  IF user_farm_id IS NOT NULL THEN
    -- Update orphaned participants
    UPDATE participants 
    SET farm_id = user_farm_id 
    WHERE farm_id NOT IN (SELECT id FROM farms);
    
    -- Update orphaned calculator_sessions
    UPDATE calculator_sessions 
    SET farm_id = user_farm_id 
    WHERE farm_id NOT IN (SELECT id FROM farms);
    
    -- Update orphaned buildings
    UPDATE buildings 
    SET farm_id = user_farm_id 
    WHERE farm_id NOT IN (SELECT id FROM farms);
    
    RAISE NOTICE 'Updated orphaned records to use farm_id: %', user_farm_id;
  ELSE
    RAISE NOTICE 'No valid farm found for user';
  END IF;
END $$;

-- 6. Verify the fixes
SELECT '=== VERIFICATION ===' as status;

-- Check if all foreign key constraints are now valid
SELECT 'Participants with valid farm_id:' as status;
SELECT COUNT(*) as valid_participants
FROM participants p
JOIN farms f ON p.farm_id = f.id;

SELECT 'Calculator_sessions with valid farm_id:' as status;
SELECT COUNT(*) as valid_sessions
FROM calculator_sessions cs
JOIN farms f ON cs.farm_id = f.id;

SELECT 'Buildings with valid farm_id:' as status;
SELECT COUNT(*) as valid_buildings
FROM buildings b
JOIN farms f ON b.farm_id = f.id;

-- Show the final state
SELECT '=== FINAL STATE ===' as status;
SELECT 
  f.id as farm_id,
  f.name as farm_name,
  f.owner_id,
  u.email as owner_email,
  f.created_at
FROM farms f
LEFT JOIN auth.users u ON f.owner_id = u.id
ORDER BY f.created_at DESC;
