-- Fix RLS Policy Infinite Recursion Issue
-- This script fixes the circular reference in participant policies

-- ===== DROP PROBLEMATIC POLICIES =====
DROP POLICY IF EXISTS "Users can view participants from their farms" ON participants;
DROP POLICY IF EXISTS "Users can manage participants in their farms" ON participants;

-- ===== CREATE SAFE POLICIES =====

-- Policy 1: Farm owners can view all participants in their farms
CREATE POLICY "Farm owners can view their participants" ON participants
    FOR SELECT USING (
        farm_id IN (
            SELECT id FROM farms WHERE owner_id = auth.uid()
        )
    );

-- Policy 2: Farm owners can manage all participants in their farms
CREATE POLICY "Farm owners can manage their participants" ON participants
    FOR ALL USING (
        farm_id IN (
            SELECT id FROM farms WHERE owner_id = auth.uid()
        )
    );

-- Policy 3: Participants can view their own record
CREATE POLICY "Participants can view own record" ON participants
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- Policy 4: High-level participants can view other participants (optional)
-- Only enable this if you have the new access control columns
/*
CREATE POLICY "High level participants can view others" ON participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM participants p
            WHERE p.user_id = auth.uid()
            AND p.farm_id = participants.farm_id
            AND p.access_level >= 4  -- Level 4+ can view others
        )
    );
*/

-- ===== VERIFY POLICIES =====
-- Check that policies are created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'participants';

-- ===== ENABLE RLS =====
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

-- ===== TEST QUERIES (for debugging) =====
-- These should work without infinite recursion
-- Run these one by one to test

-- Test 1: Check if current user owns any farms
-- SELECT id, name FROM farms WHERE owner_id = auth.uid();

-- Test 2: Check participants for owned farms
-- SELECT * FROM participants WHERE farm_id IN (SELECT id FROM farms WHERE owner_id = auth.uid());

-- ===== GRANT NECESSARY PERMISSIONS =====
-- Ensure authenticated users can access the tables
GRANT SELECT, INSERT, UPDATE, DELETE ON participants TO authenticated;
GRANT SELECT ON farms TO authenticated;

COMMIT;

