const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function completeTerminalFix() {
  try {
    console.log('🚀 COMPLETE TERMINAL FIX FOR STAFF DASHBOARD')
    console.log('==========================================\n')
    
    // Step 1: Show the exact SQL commands needed
    console.log('📋 Step 1: SQL Commands to Run in Supabase Dashboard')
    console.log('----------------------------------------------------')
    console.log('')
    console.log('🔧 COPY AND PASTE THESE COMMANDS IN SUPABASE DASHBOARD:')
    console.log('')
    console.log('1. Go to: https://supabase.com/dashboard')
    console.log('2. Select your project: yusqlnqtsszjjmyqaibp')
    console.log('3. Go to: SQL Editor')
    console.log('4. Copy and paste this entire block:')
    console.log('')
    console.log('```sql')
    console.log('-- Disable RLS temporarily')
    console.log('ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- Create sample buildings')
    console.log('INSERT INTO buildings (name, farm_id, status, cycle_number, cycle_start_date) VALUES')
    console.log('(\'Production House 1\', \'39ceb05a-8e33-4d9b-92b6-66c68312c2f3\', \'active\', 1, \'2025-01-01\'),')
    console.log('(\'Production House 2\', \'39ceb05a-8e33-4d9b-92b6-66c68312c2f3\', \'active\', 2, \'2025-01-15\'),')
    console.log('(\'Production House 3\', \'39ceb05a-8e33-4d9b-92b6-66c68312c2f3\', \'preparing\', 3, \'2025-02-01\');')
    console.log('')
    console.log('-- Re-enable RLS')
    console.log('ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- Create proper RLS policies')
    console.log('CREATE POLICY "Allow building creation" ON buildings')
    console.log('FOR INSERT TO authenticated WITH CHECK (true);')
    console.log('')
    console.log('CREATE POLICY "Allow building selection" ON buildings')
    console.log('FOR SELECT TO authenticated USING (true);')
    console.log('```')
    console.log('')
    console.log('5. Click "Run" to execute')
    console.log('')
    
    // Step 2: Wait for user to run SQL
    console.log('📋 Step 2: After Running SQL, Test the Fix')
    console.log('-------------------------------------------')
    console.log('')
    console.log('After you run the SQL commands above, run this command:')
    console.log('')
    console.log('node test-after-sql-fix.js')
    console.log('')
    
    // Step 3: Create the test script
    const testScript = `const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAfterSQLFix() {
  try {
    console.log('🧪 TESTING AFTER SQL FIX')
    console.log('========================\n')
    
    // Check if buildings exist
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*')
    
    if (buildingsError) {
      console.log('❌ Error fetching buildings:', buildingsError.message)
    } else {
      console.log(\`📊 Total buildings: \${buildings?.length || 0}\`)
      
      if (buildings && buildings.length > 0) {
        console.log('✅ Buildings found:')
        buildings.forEach((building, index) => {
          console.log(\`  \${index + 1}. \${building.name} (\${building.status})\`)
        })
        
        console.log('\\n🎉 SUCCESS! Staff dashboard should now show buildings!')
        console.log('\\nTo test:')
        console.log('1. Open http://localhost:3000')
        console.log('2. Use participant login with code: 253613')
        console.log('3. Check if buildings appear in dashboard')
      } else {
        console.log('❌ No buildings found - SQL fix may not have worked')
        console.log('🔧 Check Supabase Dashboard for errors')
      }
    }
    
    // Test building creation
    console.log('\\n🧪 Testing building creation...')
    const { data: testBuilding, error: testError } = await supabase
      .from('buildings')
      .insert({
        name: 'Test Building - Post Fix',
        farm_id: '39ceb05a-8e33-4d9b-92b6-66c68312c2f3',
        status: 'active',
        cycle_number: 4
      })
      .select()
      .single()
    
    if (testError) {
      console.log('❌ Building creation still blocked:', testError.message)
    } else {
      console.log('✅ Building creation working!')
      console.log(\`   Created: \${testBuilding.name} (ID: \${testBuilding.id})\`)
      
      // Clean up
      await supabase
        .from('buildings')
        .delete()
        .eq('id', testBuilding.id)
      console.log('🧹 Test building cleaned up')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAfterSQLFix()`
    
    require('fs').writeFileSync('test-after-sql-fix.js', testScript)
    console.log('✅ Created test-after-sql-fix.js')
    console.log('')
    
    // Step 4: Alternative solution
    console.log('📋 Step 3: Alternative Solution (If SQL Fails)')
    console.log('-----------------------------------------------')
    console.log('')
    console.log('If the SQL approach doesn\'t work, try this:')
    console.log('')
    console.log('1. Open http://localhost:3000')
    console.log('2. Sign in as admin/owner (not participant)')
    console.log('3. Look for "Add Building" button in the dashboard')
    console.log('4. Add these buildings manually:')
    console.log('   - Production House 1 (Status: Active, Cycle: 1)')
    console.log('   - Production House 2 (Status: Active, Cycle: 2)')
    console.log('   - Production House 3 (Status: Preparing, Cycle: 3)')
    console.log('5. Test staff dashboard with participant login')
    console.log('')
    
    // Step 5: Final instructions
    console.log('📋 Step 4: Final Instructions')
    console.log('-----------------------------')
    console.log('')
    console.log('🎯 WHAT TO DO NOW:')
    console.log('1. Run the SQL commands in Supabase Dashboard')
    console.log('2. Run: node test-after-sql-fix.js')
    console.log('3. If successful, test staff dashboard')
    console.log('4. If not successful, use the manual interface approach')
    console.log('')
    console.log('🎉 EXPECTED RESULT:')
    console.log('- Staff dashboard will show buildings instead of "No buildings yet"')
    console.log('- Both owner and staff dashboards will show the same real data')
    console.log('- No more mock/placeholder data discrepancy')
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

completeTerminalFix()
