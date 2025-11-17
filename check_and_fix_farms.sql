-- Check and fix farms table structure
-- Run this in your Supabase SQL Editor

-- First, check the current structure of the farms table
SELECT 'Current farms table structure:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'farms'
ORDER BY ordinal_position;

-- Check if owner_id column exists
SELECT 'Checking for owner_id column:' as status;
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'farms' AND column_name = 'owner_id'
) as owner_id_exists;

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

-- Check current farms data
SELECT 'Current farms data:' as status;
SELECT 
  f.id as farm_id,
  f.name as farm_name,
  f.owner_id,
  f.created_at,
  f.updated_at
FROM farms f
ORDER BY f.created_at DESC;

-- Check if there are any farms without owner_id
SELECT 'Farms without owner_id:' as status;
SELECT 
  f.id as farm_id,
  f.name as farm_name,
  f.owner_id,
  'MISSING OWNER_ID' as status
FROM farms f
WHERE f.owner_id IS NULL;

-- Check for the specific farm ID that's causing the error
SELECT 'Checking for farm ID 0547162c-2525-4f23-831e-352dc8f0b305:' as status;
SELECT 
  f.id as farm_id,
  f.name as farm_name,
  f.owner_id,
  CASE 
    WHEN f.id IS NOT NULL THEN 'EXISTS'
    ELSE 'NOT FOUND'
  END as status
FROM farms f
WHERE f.id = '0547162c-2525-4f23-831e-352dc8f0b305';

-- Show all users who might need farms
SELECT 'Users who might need farms:' as status;
SELECT 
  u.id as user_id,
  u.email,
  CASE 
    WHEN f.id IS NOT NULL THEN 'HAS FARM'
    ELSE 'NEEDS FARM'
  END as farm_status,
  f.id as farm_id
FROM auth.users u
LEFT JOIN farms f ON u.id = f.owner_id
WHERE u.email = 'leolansangan27@gmail.com'
ORDER BY u.created_at DESC;
