-- Fix Database Schema Issues
-- This script adds missing columns that are causing the "Could not find column" errors

-- 1. Fix participants table - add missing 'access_tools' column (not 'access')
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS access_tools TEXT[] DEFAULT '{}';

-- Update existing records to have empty access_tools array if null
UPDATE participants 
SET access_tools = '{}' 
WHERE access_tools IS NULL;

-- 2. Fix buildings table - add missing 'capacity' column
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 0;

-- Update existing records to have default capacity if null
UPDATE buildings 
SET capacity = 0 
WHERE capacity IS NULL;

-- 3. Add missing 'type' column to buildings if it doesn't exist
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';

-- Update existing records to have default type if null
UPDATE buildings 
SET type = 'general' 
WHERE type IS NULL;

-- 4. Add missing 'building_number' column to buildings if it doesn't exist
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS building_number INTEGER;

-- 5. Add missing 'cycle_number' column to buildings if it doesn't exist
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS cycle_number INTEGER DEFAULT 1;

-- Update existing records to have default cycle_number if null
UPDATE buildings 
SET cycle_number = 1 
WHERE cycle_number IS NULL;

-- 6. Add missing 'cycle_start_date' column to buildings if it doesn't exist
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS cycle_start_date DATE;

-- 7. Add missing 'status' column to buildings if it doesn't exist
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Update existing records to have default status if null
UPDATE buildings 
SET status = 'active' 
WHERE status IS NULL;

-- 8. Verify the fixes
SELECT '=== VERIFYING FIXES ===' as status;

-- Check participants table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'participants' 
AND column_name IN ('access_tools', 'name', 'code', 'farm_id')
ORDER BY column_name;

-- Check buildings table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'buildings' 
AND column_name IN ('capacity', 'type', 'name', 'farm_id', 'building_number', 'status', 'cycle_number', 'cycle_start_date')
ORDER BY column_name;

-- 9. Test data insertion
SELECT '=== TESTING DATA INSERTION ===' as status;

-- Test participant insertion (this should work now)
DO $$
DECLARE
    test_farm_id UUID;
    test_participant_id UUID;
    test_building_id UUID;
BEGIN
    -- Get a test farm ID
    SELECT id INTO test_farm_id FROM farms LIMIT 1;
    
    IF test_farm_id IS NOT NULL THEN
        -- Test participant insertion
        INSERT INTO participants (name, access_tools, code, farm_id, created_at, updated_at)
        VALUES ('Test Participant', ARRAY['Production Input'], '123456', test_farm_id, NOW(), NOW())
        RETURNING id INTO test_participant_id;
        
        RAISE NOTICE 'Test participant inserted with ID: %', test_participant_id;
        
        -- Test building insertion
        INSERT INTO buildings (name, type, capacity, farm_id, building_number, status, cycle_number, cycle_start_date, created_at, updated_at)
        VALUES ('Test Building', 'general', 1000, test_farm_id, 1, 'active', 1, '2025-01-01', NOW(), NOW())
        RETURNING id INTO test_building_id;
        
        RAISE NOTICE 'Test building inserted with ID: %', test_building_id;
        
        -- Clean up test data
        DELETE FROM participants WHERE id = test_participant_id;
        DELETE FROM buildings WHERE id = test_building_id;
        
        RAISE NOTICE 'Test data cleaned up successfully';
    ELSE
        RAISE NOTICE 'No farms found for testing';
    END IF;
END $$;

SELECT '=== SCHEMA FIX COMPLETE ===' as status;
