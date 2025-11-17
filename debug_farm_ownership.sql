-- Debug script to check farm ownership and building relationships
-- Run this in your Supabase SQL Editor to diagnose the issue

-- Check all farms and their owners
SELECT 
  f.id as farm_id,
  f.name as farm_name,
  f.owner_id,
  f.created_at as farm_created
FROM farms f
ORDER BY f.created_at DESC;

-- Check all buildings and their farm relationships
SELECT 
  b.id as building_id,
  b.name as building_name,
  b.farm_id,
  f.name as farm_name,
  f.owner_id,
  b.created_at as building_created
FROM buildings b
LEFT JOIN farms f ON b.farm_id = f.id
ORDER BY b.created_at DESC;

-- Check for orphaned buildings (buildings without valid farm_id)
SELECT 
  b.id as building_id,
  b.name as building_name,
  b.farm_id,
  'ORPHANED - No matching farm' as status
FROM buildings b
LEFT JOIN farms f ON b.farm_id = f.id
WHERE f.id IS NULL;

-- Check for buildings with invalid farm_id (using user ID instead of farm ID)
SELECT 
  b.id as building_id,
  b.name as building_name,
  b.farm_id,
  'INVALID - Using user ID as farm ID' as status
FROM buildings b
LEFT JOIN farms f ON b.farm_id = f.id
WHERE f.id IS NULL AND b.farm_id IS NOT NULL;

-- Count buildings per farm
SELECT 
  f.name as farm_name,
  f.owner_id,
  COUNT(b.id) as building_count
FROM farms f
LEFT JOIN buildings b ON f.id = b.farm_id
GROUP BY f.id, f.name, f.owner_id
ORDER BY building_count DESC;

-- Check recent activity
SELECT 
  'Recent Farms' as type,
  f.name,
  f.owner_id,
  f.created_at
FROM farms f
WHERE f.created_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
  'Recent Buildings' as type,
  b.name,
  b.farm_id,
  b.created_at
FROM buildings b
WHERE b.created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
