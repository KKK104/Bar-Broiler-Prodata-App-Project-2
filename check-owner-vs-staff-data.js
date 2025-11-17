const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOwnerVsStaffData() {
  try {
    console.log('🔍 CHECKING: Owner vs Staff Dashboard Data Discrepancy')
    console.log('======================================================\n')
    
    // Step 1: Check if buildings actually exist
    console.log('📋 Step 1: Verifying buildings in database')
    console.log('-------------------------------------------')
    
    const { data: allBuildings, error: allBuildingsError } = await supabase
      .from('buildings')
      .select('*')
    
    if (allBuildingsError) {
      console.log('❌ Error fetching buildings:', allBuildingsError.message)
    } else {
      console.log(`📊 Total buildings in database: ${allBuildings?.length || 0}`)
      
      if (allBuildings && allBuildings.length > 0) {
        console.log('✅ Buildings found in database:')
        allBuildings.forEach((building, index) => {
          console.log(`  ${index + 1}. ${building.name}`)
          console.log(`     ID: ${building.id}`)
          console.log(`     Farm ID: ${building.farm_id}`)
          console.log(`     Status: ${building.status}`)
          console.log(`     Cycle: ${building.cycle_number}`)
          console.log(`     Created: ${building.created_at}`)
          console.log('')
        })
      } else {
        console.log('❌ NO BUILDINGS IN DATABASE')
        console.log('')
        console.log('🤔 POSSIBLE EXPLANATIONS:')
        console.log('1. Owner dashboard is showing MOCK/PLACEHOLDER data')
        console.log('2. Owner dashboard is using cached data')
        console.log('3. Owner dashboard is connected to different database')
        console.log('4. Buildings were deleted after owner viewed them')
        console.log('')
        console.log('🔧 TO VERIFY:')
        console.log('1. Check browser console in owner dashboard')
        console.log('2. Look for "mock", "placeholder", or "sample" data')
        console.log('3. Check if owner dashboard is using different API')
        console.log('4. Clear browser cache and refresh')
      }
    }
    
    // Step 2: Check if there are any farms
    console.log('📋 Step 2: Checking farms')
    console.log('--------------------------')
    
    const { data: farms, error: farmsError } = await supabase
      .from('farms')
      .select('*')
    
    if (farmsError) {
      console.log('❌ Farms error:', farmsError.message)
    } else {
      console.log(`📊 Total farms in database: ${farms?.length || 0}`)
      if (farms && farms.length > 0) {
        console.log('✅ Farms found:')
        farms.forEach((farm, index) => {
          console.log(`  ${index + 1}. ${farm.name || 'Unnamed'} (ID: ${farm.id})`)
        })
      } else {
        console.log('❌ NO FARMS IN DATABASE')
        console.log('🔧 This explains why no buildings exist')
      }
    }
    
    // Step 3: Check participants
    console.log('\n📋 Step 3: Checking participants')
    console.log('---------------------------------')
    
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .limit(3)
    
    if (participantsError) {
      console.log('❌ Participants error:', participantsError.message)
    } else {
      console.log(`📊 Total participants: ${participants?.length || 0}`)
      if (participants && participants.length > 0) {
        console.log('✅ Sample participants:')
        participants.forEach((p, index) => {
          console.log(`  ${index + 1}. ${p.name} (Code: ${p.code})`)
          console.log(`     Farm ID: ${p.farm_id}`)
          console.log(`     Access: ${p.access_tools?.join(', ') || 'None'}`)
        })
      }
    }
    
    // Step 4: Test building creation
    console.log('\n📋 Step 4: Testing building creation')
    console.log('------------------------------------')
    
    if (participants && participants.length > 0) {
      const farmId = participants[0].farm_id
      console.log(`🧪 Testing building creation for farm: ${farmId}`)
      
      try {
        const { data: testBuilding, error: testError } = await supabase
          .from('buildings')
          .insert({
            name: 'Test Building - Debug',
            farm_id: farmId,
            status: 'active',
            cycle_number: 1
          })
          .select()
          .single()
        
        if (testError) {
          console.log('❌ Building creation failed:', testError.message)
          console.log('🔒 RLS is blocking building creation')
        } else {
          console.log('✅ Building creation successful!')
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
    
    // Step 5: Final diagnosis
    console.log('\n📋 Step 5: FINAL DIAGNOSIS')
    console.log('==========================')
    
    const totalBuildings = allBuildings?.length || 0
    const totalFarms = farms?.length || 0
    const totalParticipants = participants?.length || 0
    
    if (totalBuildings === 0 && totalFarms === 0) {
      console.log('🚨 ROOT CAUSE: No farms or buildings in database')
      console.log('🔧 Solution: Create farms and buildings first')
    } else if (totalBuildings === 0 && totalFarms > 0) {
      console.log('🚨 ROOT CAUSE: No buildings for existing farms')
      console.log('🔧 Solution: Add buildings to farms')
    } else if (totalBuildings > 0) {
      console.log('✅ Buildings exist in database')
      console.log('🔍 If staff dashboard still shows "No buildings yet":')
      console.log('1. Check RLS policies for staff access')
      console.log('2. Check participant farm_id matching')
      console.log('3. Check frontend data fetching logic')
    }
    
    console.log('\n🎯 IMMEDIATE ACTION REQUIRED:')
    console.log('1. If owner dashboard shows buildings but database has 0:')
    console.log('   - Owner dashboard is using mock/placeholder data')
    console.log('   - Need to create real buildings in database')
    console.log('')
    console.log('2. If database has buildings but staff dashboard shows none:')
    console.log('   - RLS policies blocking staff access')
    console.log('   - Need to create RLS policies for staff')
    console.log('')
    console.log('3. If both show no buildings:')
    console.log('   - No buildings in database')
    console.log('   - Need to add buildings through admin interface')

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

checkOwnerVsStaffData()
