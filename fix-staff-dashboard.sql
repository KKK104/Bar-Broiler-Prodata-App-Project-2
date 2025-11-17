-- SQL Script to Fix Staff Dashboard
-- Copy and paste this entire block in Supabase Dashboard → SQL Editor

-- Step 1: Drop existing broken policies
DROP POLICY IF EXISTS "Allow building creation" ON buildings;
DROP POLICY IF EXISTS "Allow building selection" ON buildings;
DROP POLICY IF EXISTS "Allow building updates" ON buildings;
DROP POLICY IF EXISTS "Allow building deletion" ON buildings;

-- Step 2: Disable RLS temporarily
ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;

-- Step 3: Create sample buildings
INSERT INTO buildings (name, farm_id, status, cycle_number, cycle_start_date) VALUES
('Production House 1', '39ceb05a-8e33-4d9b-92b6-66c68312c2f3', 'active', 1, '2025-01-01'),
('Production House 2', '39ceb05a-8e33-4d9b-92b6-66c68312c2f3', 'active', 2, '2025-01-15'),
('Production House 3', '39ceb05a-8e33-4d9b-92b6-66c68312c2f3', 'preparing', 3, '2025-02-01');

-- Step 4: Re-enable RLS
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- Step 5: Create working RLS policies
CREATE POLICY "Allow building creation" ON buildings
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow building selection" ON buildings
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow building updates" ON buildings
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow building deletion" ON buildings
FOR DELETE TO authenticated USING (true);