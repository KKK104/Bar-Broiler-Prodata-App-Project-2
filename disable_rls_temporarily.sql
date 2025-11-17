-- TEMPORARY FIX: Disable RLS for testing
-- WARNING: This removes security constraints - use only for development/testing

-- Disable RLS on main tables
ALTER TABLE participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE farms DISABLE ROW LEVEL SECURITY;
ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records DISABLE ROW LEVEL SECURITY;

-- Grant public access for testing
GRANT ALL ON participants TO anon, authenticated;
GRANT ALL ON farms TO anon, authenticated;
GRANT ALL ON buildings TO anon, authenticated;
GRANT ALL ON daily_records TO anon, authenticated;

-- To re-enable RLS later, run:
-- ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;

SELECT 'RLS temporarily disabled for testing' as status;
