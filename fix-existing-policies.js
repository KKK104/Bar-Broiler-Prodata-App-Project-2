const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixExistingPolicies() {
  try {
    console.log('🔧 FIXING EXISTING RLS POLICIES')
    console.log('===============================\n')
    
    console.log('📋 The policies exist but are not working correctly.')
    console.log('You need to run these SQL commands in Supabase Dashboard:')
    console.log('')
    console.log('🔧 COPY AND PASTE THESE COMMANDS IN SUPABASE DASHBOARD:')
    console.log('')
    console.log('1. Go to: https://supabase.com/dashboard')
    console.log('2. Select your project: yusqlnqtsszjjmyqaibp')
    console.log('3. Go to: SQL Editor')
    console.log('4. Copy and paste this entire block:')
    console.log('')
    console.log('```sql')
    console.log('-- Drop existing policies that are not working')
    console.log('DROP POLICY IF EXISTS "Allow building creation" ON buildings;')
    console.log('DROP POLICY IF EXISTS "Allow building selection" ON buildings;')
    console.log('DROP POLICY IF EXISTS "Allow building updates" ON buildings;')
    console.log('DROP POLICY IF EXISTS "Allow building deletion" ON buildings;')
    console.log('')
    console.log('-- Disable RLS temporarily to create buildings')
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
    console.log('-- Create new working policies')
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
    console.log('5. Click "Run" to execute')
    console.log('')
    
    // Test current state
    console.log('📋 Step 2: Testing Current State')
    console.log('--------------------------------')
    
    const { data: allBuildings } = await supabase
      .from('buildings')
      .select('*')
    
    console.log(`📊 Current buildings in database: ${allBuildings?.length || 0}`)
    
    if (allBuildings && allBuildings.length > 0) {
      console.log('✅ Buildings already exist!')
      allBuildings.forEach((building, index) => {
        console.log(`  ${index + 1}. ${building.name} (${building.status})`)
      })
      
      console.log('\n🎉 SUCCESS! Staff dashboard should now show buildings!')
      console.log('\nTo test:')
      console.log('1. Open http://localhost:3000')
      console.log('2. Use participant login with code: 253613')
      console.log('3. Check if buildings appear in dashboard')
    } else {
      console.log('❌ No buildings found - need to run SQL commands above')
    }
    
    // Test building creation
    console.log('\n📋 Step 3: Testing Building Creation')
    console.log('-------------------------------------')
    
    const { data: participants } = await supabase
      .from('participants')
      .select('farm_id')
      .limit(1)
    
    if (participants && participants.length > 0) {
      const farmId = participants[0].farm_id
      console.log(`🧪 Testing building creation for farm: ${farmId}`)
      
      try {
        const { data: testBuilding, error: testError } = await supabase
          .from('buildings')
          .insert({
            name: 'Test Building - Policy Fix',
            farm_id: farmId,
            status: 'active',
            cycle_number: 1
          })
          .select()
          .single()
        
        if (testError) {
          console.log('❌ Building creation still blocked:', testError.message)
          console.log('🔧 Need to run the SQL commands above')
        } else {
          console.log('✅ Building creation working!')
          console.log(`   Created: ${testBuilding.name} (ID: ${testBuilding.id})`)
          
          // Clean up
          await supabase
            .from('buildings')
            .delete()
            .eq('id', testBuilding.id)
          console.log('🧹 Test building cleaned up')
        }
      } catch (err) {
        console.log('❌ Building creation error:', err.message)
      }
    }
    
    console.log('\n📋 Step 4: After Running SQL Commands')
    console.log('--------------------------------------')
    console.log('')
    console.log('After you run the SQL commands above, test with:')
    console.log('')
    console.log('node test-after-sql-fix.js')
    console.log('')
    console.log('🎯 EXPECTED RESULT:')
    console.log('- 3 buildings will be created in database')
    console.log('- Staff dashboard will show buildings instead of "No buildings yet"')
    console.log('- Both owner and staff dashboards will show the same real data')
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

fixExistingPolicies()
