-- Fix script for farm ownership issues
-- Run this in your Supabase SQL Editor to fix existing problems

-- First, let's see what we're dealing with
SELECT 'Before fix - Invalid buildings:' as status;
SELECT 
  b.id as building_id,
  b.name as building_name,
  b.farm_id,
  'INVALID - Using user ID as farm ID' as status
FROM buildings b
LEFT JOIN farms f ON b.farm_id = f.id
WHERE f.id IS NULL AND b.farm_id IS NOT NULL;

-- Step 1: Create farms for users who have buildings but no farm
-- This creates a farm for each user who has buildings with invalid farm_id
INSERT INTO farms (name, owner_id, building_count, created_at)
SELECT DISTINCT
  'Auto-created Farm for ' || b.farm_id as name,
  b.farm_id as owner_id,
  COUNT(*) as building_count,
  NOW() as created_at
FROM buildings b
LEFT JOIN farms f ON b.farm_id = f.owner_id
WHERE f.id IS NULL 
  AND b.farm_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = b.farm_id)
GROUP BY b.farm_id
ON CONFLICT (owner_id) DO NOTHING;

-- Step 2: Update buildings to use the correct farm_id
-- This updates buildings that were using user ID as farm_id to use the actual farm ID
UPDATE buildings 
SET farm_id = f.id
FROM farms f
WHERE buildings.farm_id = f.owner_id
  AND buildings.farm_id != f.id;

-- Step 3: Clean up orphaned buildings (buildings with farm_id that don't exist)
-- First, let's see what would be deleted
SELECT 'Buildings that would be deleted:' as status;
SELECT 
  b.id as building_id,
  b.name as building_name,
  b.farm_id,
  'ORPHANED - No matching farm' as status
FROM buildings b
LEFT JOIN farms f ON b.farm_id = f.id
WHERE f.id IS NULL;

-- Uncomment the following line to actually delete orphaned buildings
-- DELETE FROM buildings WHERE farm_id NOT IN (SELECT id FROM farms);

-- Verify the fix
SELECT 'After fix - All buildings should have valid farm_id:' as status;
SELECT 
  b.id as building_id,
  b.name as building_name,
  b.farm_id,
  f.name as farm_name,
  f.owner_id,
  CASE 
    WHEN f.id IS NOT NULL THEN 'VALID'
    ELSE 'STILL INVALID'
  END as status
FROM buildings b
LEFT JOIN farms f ON b.farm_id = f.id
ORDER BY b.created_at DESC;

-- Show final summary
SELECT 'Final Summary:' as status;
SELECT 
  f.name as farm_name,
  f.owner_id,
  COUNT(b.id) as building_count
FROM farms f
LEFT JOIN buildings b ON f.id = b.farm_id
GROUP BY f.id, f.name, f.owner_id
ORDER BY building_count DESC;
