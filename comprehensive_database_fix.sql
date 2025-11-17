-- Comprehensive Database Fix for Bar Broiler Prodata App
-- Run this in your Supabase SQL Editor to fix all issues

-- ============================================
-- STEP 1: DIAGNOSTIC REPORT
-- ============================================

SELECT '=== STARTING COMPREHENSIVE DATABASE FIX ===' as status;

-- Check current user
SELECT 'Current user context:' as status;
SELECT 
  current_setting('request.jwt.claims', true)::json->>'email' as current_user_email;

-- Check all table structures
SELECT '=== TABLE STRUCTURES ===' as status;

-- Farms table
SELECT 'Farms table structure:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'farms'
ORDER BY ordinal_position;

-- Participants table
SELECT 'Participants table structure:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'participants'
ORDER BY ordinal_position;

-- Buildings table
SELECT 'Buildings table structure:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buildings'
ORDER BY ordinal_position;

-- Calculator_sessions table
SELECT 'Calculator_sessions table structure:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'calculator_sessions'
ORDER BY ordinal_position;

-- ============================================
-- STEP 2: FIND ORPHANED RECORDS
-- ============================================

SELECT '=== ORPHANED RECORDS ANALYSIS ===' as status;

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

-- ============================================
-- STEP 3: FIX FARMS TABLE
-- ============================================

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

-- ============================================
-- STEP 4: CREATE MISSING FARMS
-- ============================================

SELECT '=== CREATING MISSING FARMS ===' as status;

-- Create farms for users who need them
DO $$
DECLARE
  user_record RECORD;
  new_farm_id UUID;
BEGIN
  -- Loop through all users and ensure they have farms
  FOR user_record IN 
    SELECT id, email FROM auth.users 
    WHERE email IS NOT NULL
  LOOP
    -- Check if user already has a farm
    IF NOT EXISTS (SELECT 1 FROM farms WHERE owner_id = user_record.id) THEN
      -- Create a new farm for the user
      INSERT INTO farms (id, name, owner_id, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        'Farm for ' || user_record.email,
        user_record.id,
        NOW(),
        NOW()
      )
      RETURNING id INTO new_farm_id;
      
      RAISE NOTICE 'Created farm % for user % (%)', new_farm_id, user_record.email, user_record.id;
    ELSE
      RAISE NOTICE 'User % already has a farm', user_record.email;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- STEP 5: FIX ORPHANED RECORDS
-- ============================================

SELECT '=== FIXING ORPHANED RECORDS ===' as status;

-- Fix orphaned participants by assigning them to the correct farm
DO $$
DECLARE
  participant_record RECORD;
  user_farm_id UUID;
BEGIN
  -- Loop through orphaned participants
  FOR participant_record IN 
    SELECT p.id, p.farm_id, p.name
    FROM participants p
    LEFT JOIN farms f ON p.farm_id = f.id
    WHERE f.id IS NULL AND p.farm_id IS NOT NULL
  LOOP
    -- Try to find a farm for this participant's farm_id (which might be a user_id)
    SELECT f.id INTO user_farm_id 
    FROM farms f 
    WHERE f.owner_id = participant_record.farm_id;
    
    IF user_farm_id IS NOT NULL THEN
      -- Update the participant to use the correct farm_id
      UPDATE participants 
      SET farm_id = user_farm_id 
      WHERE id = participant_record.id;
      
      RAISE NOTICE 'Fixed participant % (%), assigned to farm %', 
        participant_record.name, participant_record.id, user_farm_id;
    ELSE
      -- If no farm found, assign to the first available farm
      SELECT f.id INTO user_farm_id FROM farms f LIMIT 1;
      IF user_farm_id IS NOT NULL THEN
        UPDATE participants 
        SET farm_id = user_farm_id 
        WHERE id = participant_record.id;
        
        RAISE NOTICE 'Fixed participant % (%), assigned to default farm %', 
          participant_record.name, participant_record.id, user_farm_id;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Fix orphaned buildings
DO $$
DECLARE
  building_record RECORD;
  user_farm_id UUID;
BEGIN
  FOR building_record IN 
    SELECT b.id, b.farm_id, b.building_number
    FROM buildings b
    LEFT JOIN farms f ON b.farm_id = f.id
    WHERE f.id IS NULL AND b.farm_id IS NOT NULL
  LOOP
    -- Try to find a farm for this building's farm_id (which might be a user_id)
    SELECT f.id INTO user_farm_id 
    FROM farms f 
    WHERE f.owner_id = building_record.farm_id;
    
    IF user_farm_id IS NOT NULL THEN
      UPDATE buildings 
      SET farm_id = user_farm_id 
      WHERE id = building_record.id;
      
      RAISE NOTICE 'Fixed building % (%), assigned to farm %', 
        building_record.building_number, building_record.id, user_farm_id;
    ELSE
      -- Assign to first available farm
      SELECT f.id INTO user_farm_id FROM farms f LIMIT 1;
      IF user_farm_id IS NOT NULL THEN
        UPDATE buildings 
        SET farm_id = user_farm_id 
        WHERE id = building_record.id;
        
        RAISE NOTICE 'Fixed building % (%), assigned to default farm %', 
          building_record.building_number, building_record.id, user_farm_id;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Fix orphaned calculator_sessions
DO $$
DECLARE
  session_record RECORD;
  user_farm_id UUID;
BEGIN
  FOR session_record IN 
    SELECT cs.id, cs.farm_id, cs.building_id
    FROM calculator_sessions cs
    LEFT JOIN farms f ON cs.farm_id = f.id
    WHERE f.id IS NULL AND cs.farm_id IS NOT NULL
  LOOP
    -- Try to find a farm for this session's farm_id
    SELECT f.id INTO user_farm_id 
    FROM farms f 
    WHERE f.owner_id = session_record.farm_id;
    
    IF user_farm_id IS NOT NULL THEN
      UPDATE calculator_sessions 
      SET farm_id = user_farm_id 
      WHERE id = session_record.id;
      
      RAISE NOTICE 'Fixed calculator session %, assigned to farm %', 
        session_record.id, user_farm_id;
    ELSE
      -- Assign to first available farm
      SELECT f.id INTO user_farm_id FROM farms f LIMIT 1;
      IF user_farm_id IS NOT NULL THEN
        UPDATE calculator_sessions 
        SET farm_id = user_farm_id 
        WHERE id = session_record.id;
        
        RAISE NOTICE 'Fixed calculator session %, assigned to default farm %', 
          session_record.id, user_farm_id;
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- STEP 6: CLEAN UP DUPLICATE RECORDS
-- ============================================

SELECT '=== CLEANING UP DUPLICATES ===' as status;

-- Remove duplicate participants (keep the most recent one)
DELETE FROM participants 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY name, farm_id ORDER BY created_at DESC) as rn
    FROM participants
  ) t 
  WHERE rn > 1
);

-- Remove duplicate calculator sessions (keep the most recent one)
DELETE FROM calculator_sessions 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY farm_id, building_id, session_name ORDER BY created_at DESC) as rn
    FROM calculator_sessions
  ) t 
  WHERE rn > 1
);

-- ============================================
-- STEP 7: VERIFICATION
-- ============================================

SELECT '=== VERIFICATION ===' as status;

-- Check if all foreign key constraints are now valid
SELECT 'Participants with valid farm_id:' as status;
SELECT COUNT(*) as valid_participants
FROM participants p
JOIN farms f ON p.farm_id = f.id;

SELECT 'Buildings with valid farm_id:' as status;
SELECT COUNT(*) as valid_buildings
FROM buildings b
JOIN farms f ON b.farm_id = f.id;

SELECT 'Calculator_sessions with valid farm_id:' as status;
SELECT COUNT(*) as valid_sessions
FROM calculator_sessions cs
JOIN farms f ON cs.farm_id = f.id;

-- Show the final state
SELECT '=== FINAL STATE ===' as status;
SELECT 
  f.id as farm_id,
  f.name as farm_name,
  f.owner_id,
  u.email as owner_email,
  f.created_at,
  (SELECT COUNT(*) FROM participants p WHERE p.farm_id = f.id) as participant_count,
  (SELECT COUNT(*) FROM buildings b WHERE b.farm_id = f.id) as building_count
FROM farms f
LEFT JOIN auth.users u ON f.owner_id = u.id
ORDER BY f.created_at DESC;

SELECT '=== DATABASE FIX COMPLETED ===' as status;
