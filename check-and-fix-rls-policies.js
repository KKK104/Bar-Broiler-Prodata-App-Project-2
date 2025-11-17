const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAndFixRLSPolicies() {
  try {
    console.log('🔍 CHECKING AND FIXING RLS POLICIES')
    console.log('====================================\n')
    
    // Step 1: Test current building creation
    console.log('📋 Step 1: Testing current building creation')
    console.log('---------------------------------------------')
    
    const { data: participants } = await supabase
      .from('participants')
      .select('farm_id')
      .limit(1)
    
    if (!participants || participants.length === 0) {
      console.log('❌ No participants found')
      return
    }
    
    const farmId = participants[0].farm_id
    console.log(`✅ Using farm ID: ${farmId}`)
    
    // Try to create a test building
    const { data: testBuilding, error: testError } = await supabase
      .from('buildings')
      .insert({
        name: 'RLS Test Building',
        farm_id: farmId,
        status: 'active',
        cycle_number: 1
      })
      .select()
      .single()
    
    if (testError) {
      console.log('❌ Building creation still blocked:', testError.message)
      console.log('🔧 RLS policies need to be fixed')
    } else {
      console.log('✅ Building creation working!')
      console.log(`   Created: ${testBuilding.name} (ID: ${testBuilding.id})`)
      
      // Clean up
      await supabase
        .from('buildings')
        .delete()
        .eq('id', testBuilding.id)
      console.log('🧹 Test building cleaned up')
      
      console.log('\n🎉 RLS policies are working! Creating sample buildings...')
      
      // Create sample buildings
      const sampleBuildings = [
        {
          name: 'Production House 1',
          farm_id: farmId,
          status: 'active',
          cycle_number: 1,
          cycle_start_date: '2025-01-01'
        },
        {
          name: 'Production House 2',
          farm_id: farmId,
          status: 'active',
          cycle_number: 2,
          cycle_start_date: '2025-01-15'
        },
        {
          name: 'Production House 3',
          farm_id: farmId,
          status: 'preparing',
          cycle_number: 3,
          cycle_start_date: '2025-02-01'
        }
      ]
      
      let successCount = 0
      for (const building of sampleBuildings) {
        try {
          const { data: newBuilding, error: buildingError } = await supabase
            .from('buildings')
            .insert(building)
            .select()
            .single()

          if (buildingError) {
            console.log(`❌ Failed to create ${building.name}: ${buildingError.message}`)
          } else {
            console.log(`✅ Created ${building.name} with ID: ${newBuilding.id}`)
            successCount++
          }
        } catch (err) {
          console.log(`❌ Error creating ${building.name}: ${err.message}`)
        }
      }
      
      if (successCount > 0) {
        console.log(`\n🎉 Successfully created ${successCount} buildings!`)
        console.log('✅ Staff dashboard should now show buildings!')
        console.log('\nTo test:')
        console.log('1. Open http://localhost:3000')
        console.log('2. Use participant login with code: 253613')
        console.log('3. Check if buildings appear in dashboard')
      }
      
      return
    }
    
    // Step 2: If still blocked, provide SQL fixes
    console.log('\n📋 Step 2: RLS Policy Fix Required')
    console.log('-----------------------------------')
    console.log('The RLS policies exist but are not working correctly.')
    console.log('You need to run these SQL commands in Supabase Dashboard:')
    console.log('')
    console.log('🔧 SQL COMMANDS TO RUN:')
    console.log('======================')
    console.log('')
    console.log('1. Drop existing policies:')
    console.log('   DROP POLICY IF EXISTS "Allow building creation" ON buildings;')
    console.log('   DROP POLICY IF EXISTS "Allow building selection" ON buildings;')
    console.log('   DROP POLICY IF EXISTS "Allow building updates" ON buildings;')
    console.log('   DROP POLICY IF EXISTS "Allow building deletion" ON buildings;')
    console.log('')
    console.log('2. Create new working policies:')
    console.log('   CREATE POLICY "Allow building creation" ON buildings')
    console.log('   FOR INSERT TO authenticated WITH CHECK (true);')
    console.log('')
    console.log('   CREATE POLICY "Allow building selection" ON buildings')
    console.log('   FOR SELECT TO authenticated USING (true);')
    console.log('')
    console.log('   CREATE POLICY "Allow building updates" ON buildings')
    console.log('   FOR UPDATE TO authenticated USING (true) WITH CHECK (true);')
    console.log('')
    console.log('   CREATE POLICY "Allow building deletion" ON buildings')
    console.log('   FOR DELETE TO authenticated USING (true);')
    console.log('')
    console.log('3. Alternative - Disable RLS temporarily:')
    console.log('   ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('4. After creating buildings, re-enable RLS:')
    console.log('   ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('🎯 INSTRUCTIONS:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Run the SQL commands above')
    console.log('3. Run this script again: node check-and-fix-rls-policies.js')
    console.log('4. Test staff dashboard with participant login')
    
    // Check current building count
    const { data: allBuildings } = await supabase
      .from('buildings')
      .select('*')
    
    console.log(`\n📊 Current building count: ${allBuildings?.length || 0}`)
    
    if (allBuildings && allBuildings.length > 0) {
      console.log('✅ Buildings found:')
      allBuildings.forEach((building, index) => {
        console.log(`  ${index + 1}. ${building.name} (${building.status})`)
      })
    }

  } catch (error) {
    console.error('❌ Check failed:', error)
  }
}

checkAndFixRLSPolicies()
