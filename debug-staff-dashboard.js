const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugStaffDashboard() {
  try {
    console.log('🔍 DEBUGGING STAFF DASHBOARD - COMPLETE ANALYSIS')
    console.log('================================================\n')
    
    // Step 1: Check environment variables
    console.log('📋 Step 1: Environment Variables')
    console.log('--------------------------------')
    console.log('✅ Supabase URL:', supabaseUrl)
    console.log('✅ Supabase Key:', supabaseKey ? 'Set' : 'Missing')
    console.log('')
    
    // Step 2: Test Supabase connection
    console.log('📋 Step 2: Supabase Connection Test')
    console.log('-----------------------------------')
    try {
      const { data: testData, error: testError } = await supabase
        .from('participants')
        .select('count')
        .limit(1)
      
      if (testError) {
        console.log('❌ Supabase connection failed:', testError.message)
        return
      } else {
        console.log('✅ Supabase connection successful')
      }
    } catch (err) {
      console.log('❌ Connection error:', err.message)
      return
    }
    console.log('')
    
    // Step 3: Check participants
    console.log('📋 Step 3: Participants Analysis')
    console.log('--------------------------------')
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (participantsError) {
      console.log('❌ Participants error:', participantsError.message)
    } else {
      console.log(`✅ Found ${participants?.length || 0} participants`)
      if (participants && participants.length > 0) {
        console.log('📊 Sample participants:')
        participants.forEach((p, index) => {
          console.log(`  ${index + 1}. ${p.name} (Code: ${p.code})`)
          console.log(`     Farm ID: ${p.farm_id}`)
          console.log(`     Access Tools: ${p.access_tools?.join(', ') || 'None'}`)
          console.log('')
        })
      }
    }
    console.log('')
    
    // Step 4: Check farms
    console.log('📋 Step 4: Farms Analysis')
    console.log('-------------------------')
    const { data: farms, error: farmsError } = await supabase
      .from('farms')
      .select('*')
      .limit(5)
    
    if (farmsError) {
      console.log('❌ Farms error:', farmsError.message)
    } else {
      console.log(`✅ Found ${farms?.length || 0} farms`)
      if (farms && farms.length > 0) {
        console.log('📊 Sample farms:')
        farms.forEach((f, index) => {
          console.log(`  ${index + 1}. ${f.name || 'Unnamed'} (ID: ${f.id})`)
          console.log(`     Owner ID: ${f.owner_id}`)
          console.log('')
        })
      }
    }
    console.log('')
    
    // Step 5: Check buildings for each farm
    console.log('📋 Step 5: Buildings Analysis')
    console.log('-----------------------------')
    
    if (participants && participants.length > 0) {
      const farmIds = [...new Set(participants.map(p => p.farm_id))]
      console.log(`🔍 Checking buildings for ${farmIds.length} unique farms:`)
      
      for (const farmId of farmIds) {
        console.log(`\n  🏢 Farm ID: ${farmId}`)
        
        const { data: farmBuildings, error: buildingsError } = await supabase
          .from('buildings')
          .select('*')
          .eq('farm_id', farmId)
        
        if (buildingsError) {
          console.log(`    ❌ Buildings error: ${buildingsError.message}`)
        } else {
          console.log(`    📊 Buildings count: ${farmBuildings?.length || 0}`)
          if (farmBuildings && farmBuildings.length > 0) {
            console.log('    📋 Buildings found:')
            farmBuildings.forEach((building, index) => {
              console.log(`      ${index + 1}. ${building.name} (${building.status})`)
              console.log(`         ID: ${building.id}`)
              console.log(`         Cycle: ${building.cycle_number || 'N/A'}`)
              console.log(`         Start Date: ${building.cycle_start_date || 'N/A'}`)
            })
          } else {
            console.log('    ❌ NO BUILDINGS FOUND FOR THIS FARM!')
            console.log('    🔧 This is why staff dashboard shows "No buildings yet"')
          }
        }
      }
    }
    console.log('')
    
    // Step 6: Test building creation
    console.log('📋 Step 6: Building Creation Test')
    console.log('----------------------------------')
    
    if (participants && participants.length > 0) {
      const farmId = participants[0].farm_id
      console.log(`🧪 Testing building creation for farm: ${farmId}`)
      
      try {
        const { data: testBuilding, error: testError } = await supabase
          .from('buildings')
          .insert({
            name: 'Debug Test Building',
            farm_id: farmId,
            status: 'active',
            cycle_number: 1
          })
          .select()
          .single()
        
        if (testError) {
          console.log('❌ Building creation failed:', testError.message)
          console.log('🔒 RLS is blocking building creation')
          console.log('💡 Solution: Create RLS policies in Supabase Dashboard')
        } else {
          console.log('✅ Building creation successful!')
          console.log(`   Created: ${testBuilding.name} (ID: ${testBuilding.id})`)
          
          // Clean up test building
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
    console.log('')
    
    // Step 7: Summary and recommendations
    console.log('📋 Step 7: DIAGNOSIS & RECOMMENDATIONS')
    console.log('======================================')
    
    const { data: allBuildings } = await supabase
      .from('buildings')
      .select('*')
    
    const totalBuildings = allBuildings?.length || 0
    
    if (totalBuildings === 0) {
      console.log('🚨 ROOT CAUSE IDENTIFIED: NO BUILDINGS IN DATABASE')
      console.log('')
      console.log('📊 Current State:')
      console.log(`   - Total buildings in database: ${totalBuildings}`)
      console.log(`   - Participants: ${participants?.length || 0}`)
      console.log(`   - Farms: ${farms?.length || 0}`)
      console.log('')
      console.log('🔧 SOLUTIONS:')
      console.log('1. Create RLS policies in Supabase Dashboard:')
      console.log('   - Go to Supabase Dashboard → SQL Editor')
      console.log('   - Run the CREATE POLICY commands I provided earlier')
      console.log('')
      console.log('2. Add buildings manually through admin interface:')
      console.log('   - Open http://localhost:3000')
      console.log('   - Sign in as admin/owner')
      console.log('   - Add buildings through the interface')
      console.log('')
      console.log('3. Disable RLS temporarily:')
      console.log('   - Run: ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;')
      console.log('   - Create buildings programmatically')
      console.log('   - Re-enable: ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;')
    } else {
      console.log('✅ Buildings exist in database!')
      console.log(`   Total buildings: ${totalBuildings}`)
      console.log('')
      console.log('🔍 If staff dashboard still shows "No buildings yet":')
      console.log('1. Check participant access_tools')
      console.log('2. Check farm_id matching')
      console.log('3. Check frontend data fetching logic')
      console.log('4. Check browser console for JavaScript errors')
    }
    
    console.log('\n🎯 NEXT STEPS:')
    console.log('1. Fix the building creation issue using one of the solutions above')
    console.log('2. Test staff dashboard with participant login')
    console.log('3. Verify buildings appear in the dashboard')

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugStaffDashboard()
