const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function finalStaffDashboardFix() {
  try {
    console.log('🚀 FINAL STAFF DASHBOARD FIX')
    console.log('============================\n')
    
    console.log('📊 Current Status:')
    console.log('- Database: 0 buildings')
    console.log('- RLS: Still blocking building creation')
    console.log('- Staff dashboard: Shows "No buildings yet"')
    console.log('')
    
    console.log('🔧 SOLUTION: You need to run SQL commands in Supabase Dashboard')
    console.log('')
    console.log('📋 STEP-BY-STEP INSTRUCTIONS:')
    console.log('==============================')
    console.log('')
    console.log('1. Open your browser and go to: https://supabase.com/dashboard')
    console.log('2. Select your project: yusqlnqtsszjjmyqaibp')
    console.log('3. Click on "SQL Editor" in the left sidebar')
    console.log('4. Click "New query"')
    console.log('5. Copy and paste the ENTIRE SQL block below:')
    console.log('')
    console.log('```sql')
    console.log('-- Step 1: Drop existing broken policies')
    console.log('DROP POLICY IF EXISTS "Allow building creation" ON buildings;')
    console.log('DROP POLICY IF EXISTS "Allow building selection" ON buildings;')
    console.log('DROP POLICY IF EXISTS "Allow building updates" ON buildings;')
    console.log('DROP POLICY IF EXISTS "Allow building deletion" ON buildings;')
    console.log('')
    console.log('-- Step 2: Disable RLS temporarily')
    console.log('ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- Step 3: Create sample buildings')
    console.log('INSERT INTO buildings (name, farm_id, status, cycle_number, cycle_start_date) VALUES')
    console.log('(\'Production House 1\', \'39ceb05a-8e33-4d9b-92b6-66c68312c2f3\', \'active\', 1, \'2025-01-01\'),')
    console.log('(\'Production House 2\', \'39ceb05a-8e33-4d9b-92b6-66c68312c2f3\', \'active\', 2, \'2025-01-15\'),')
    console.log('(\'Production House 3\', \'39ceb05a-8e33-4d9b-92b6-66c68312c2f3\', \'preparing\', 3, \'2025-02-01\');')
    console.log('')
    console.log('-- Step 4: Re-enable RLS')
    console.log('ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- Step 5: Create working RLS policies')
    console.log('CREATE POLICY "Allow building creation" ON buildings')
    console.log('FOR INSERT TO authenticated WITH CHECK (true);')
    console.log('')
    console.log('CREATE POLICY "Allow building selection" ON buildings')
    console.log('FOR SELECT TO authenticated USING (true);')
    console.log('')
    console.log('CREATE POLICY "Allow building updates" ON buildings')
    console.log('FOR UPDATE TO authenticated USING (true) WITH CHECK (true);')
    console.log('')
    console.log('CREATE POLICY "Allow building deletion" ON buildings')
    console.log('FOR DELETE TO authenticated USING (true);')
    console.log('```')
    console.log('')
    console.log('6. Click the "Run" button (or press Ctrl+Enter)')
    console.log('7. Wait for the query to complete')
    console.log('8. You should see "Success" message')
    console.log('')
    console.log('📋 AFTER RUNNING SQL:')
    console.log('=====================')
    console.log('')
    console.log('Run this command to test:')
    console.log('node test-after-sql-fix.js')
    console.log('')
    console.log('🎯 EXPECTED RESULT:')
    console.log('- Should show "3 buildings found"')
    console.log('- Should show "Building creation working!"')
    console.log('- Staff dashboard will show buildings instead of "No buildings yet"')
    console.log('')
    console.log('📋 ALTERNATIVE SOLUTION (If SQL Fails):')
    console.log('=======================================')
    console.log('')
    console.log('If the SQL approach doesn\'t work:')
    console.log('1. Open http://localhost:3000')
    console.log('2. Sign in as admin/owner (not participant)')
    console.log('3. Look for "Add Building" or "Buildings" section')
    console.log('4. Add these buildings manually:')
    console.log('   - Production House 1 (Status: Active, Cycle: 1)')
    console.log('   - Production House 2 (Status: Active, Cycle: 2)')
    console.log('   - Production House 3 (Status: Preparing, Cycle: 3)')
    console.log('5. Test staff dashboard with participant login')
    console.log('')
    console.log('🎉 FINAL RESULT:')
    console.log('- Owner dashboard: Shows real buildings (not mock data)')
    console.log('- Staff dashboard: Shows real buildings (not "No buildings yet")')
    console.log('- Both dashboards: Display the same real data from database')
    
    // Create a simple SQL file for easy copying
    const sqlContent = `-- SQL Script to Fix Staff Dashboard
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
FOR DELETE TO authenticated USING (true);`
    
    require('fs').writeFileSync('fix-staff-dashboard.sql', sqlContent)
    console.log('\n✅ Created fix-staff-dashboard.sql file')
    console.log('📁 You can copy the contents of this file to Supabase Dashboard')
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

finalStaffDashboardFix()
