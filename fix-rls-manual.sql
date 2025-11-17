-- SQL Script to Fix RLS and Create Buildings
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Disable RLS temporarily
ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;

-- Step 2: Create sample buildings (adjust farm_id as needed)
INSERT INTO buildings (name, farm_id, status, cycle_number, cycle_start_date) VALUES
('Production House 1', '39ceb05a-8e33-4d9b-92b6-66c68312c2f3', 'active', 1, '2025-01-01'),
('Production House 2', '39ceb05a-8e33-4d9b-92b6-66c68312c2f3', 'active', 2, '2025-01-15'),
('Production House 3', '39ceb05a-8e33-4d9b-92b6-66c68312c2f3', 'preparing', 3, '2025-02-01');

-- Step 3: Re-enable RLS
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- Step 4: Create proper RLS policies
CREATE POLICY "Allow building creation" ON buildings
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow building selection" ON buildings
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow building updates" ON buildings
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow building deletion" ON buildings
FOR DELETE TO authenticated USING (true);
