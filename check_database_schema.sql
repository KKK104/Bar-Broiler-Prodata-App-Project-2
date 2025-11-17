-- Database Schema Check Script
-- Run this to check your current participants table structure

-- Check current participants table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'participants' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if new access control columns exist
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'participants' 
              AND column_name = 'access_level'
        ) THEN 'access_level column EXISTS'
        ELSE 'access_level column MISSING - needs migration'
    END as access_level_status,
    
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'participants' 
              AND column_name = 'role'
        ) THEN 'role column EXISTS'
        ELSE 'role column MISSING - needs migration'
    END as role_status;

-- Count current participants by access tools (for migration planning)
SELECT 
    'Current Participants Analysis' as analysis_type,
    COUNT(*) as total_participants,
    COUNT(CASE WHEN 'Production Input' = ANY(access_tools) THEN 1 END) as has_production_input,
    COUNT(CASE WHEN 'Production Performance' = ANY(access_tools) THEN 1 END) as has_production_performance,
    COUNT(CASE WHEN 'Cost Management' = ANY(access_tools) THEN 1 END) as has_cost_management,
    COUNT(CASE WHEN 'Harvest Input' = ANY(access_tools) THEN 1 END) as has_harvest_input,
    COUNT(CASE WHEN 'Harvest Output' = ANY(access_tools) THEN 1 END) as has_harvest_output
FROM participants;

-- Show sample participants data
SELECT 
    name,
    code,
    access_tools,
    created_at
FROM participants 
ORDER BY created_at DESC 
LIMIT 5;

