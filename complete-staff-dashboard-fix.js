const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function completeStaffDashboardFix() {
  try {
    console.log('🔧 Complete Staff Dashboard Fix')
    console.log('================================\n')
    
    // Step 1: Check current state
    console.log('📊 Step 1: Checking database state...')
    
    const { data: participants } = await supabase
      .from('participants')
      .select('*')
      .limit(5)
    
    if (!participants || participants.length === 0) {
      console.log('❌ No participants found. Cannot proceed.')
      return
    }
    
    console.log(`✅ Found ${participants.length} participants`)
    const farmId = participants[0].farm_id
    console.log(`✅ Using farm ID: ${farmId}`)
    
    // Check existing buildings
    const { data: existingBuildings } = await supabase
      .from('buildings')
      .select('*')
      .eq('farm_id', farmId)
    
    console.log(`📊 Current buildings: ${existingBuildings?.length || 0}`)
    
    if (existingBuildings && existingBuildings.length > 0) {
      console.log('✅ Buildings already exist!')
      existingBuildings.forEach((building, index) => {
        console.log(`  ${index + 1}. ${building.name} (${building.status})`)
      })
      console.log('\n🎉 Staff dashboard should now work!')
      console.log('Try logging in with participant code to test.')
      return
    }
    
    // Step 2: Try to create buildings with different approaches
    console.log('\n🏢 Step 2: Attempting to create buildings...')
    
    // Try with minimal data first
    const buildings = [
      {
        name: 'Production House 1',
        farm_id: farmId,
        status: 'active'
      },
      {
        name: 'Production House 2', 
        farm_id: farmId,
        status: 'active'
      },
      {
        name: 'Production House 3',
        farm_id: farmId,
        status: 'preparing'
      }
    ]
    
    let successCount = 0
    for (const building of buildings) {
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
    } else {
      console.log('\n❌ Could not create buildings due to RLS policies.')
      console.log('\n🔧 MANUAL SOLUTION REQUIRED:')
      console.log('============================')
      console.log('')
      console.log('Since RLS policies prevent programmatic creation, you need to:')
      console.log('')
      console.log('1. Open your browser and go to: http://localhost:3000')
      console.log('2. Sign in as the farm owner/admin')
      console.log('3. Navigate to the main dashboard')
      console.log('4. Look for "Add Building" or "Buildings" section')
      console.log('5. Add these buildings manually:')
      console.log('   - Production House 1 (Status: Active)')
      console.log('   - Production House 2 (Status: Active)')
      console.log('   - Production House 3 (Status: Preparing)')
      console.log('')
      console.log('6. After adding buildings, test the staff dashboard:')
      console.log('   - Go to participant login')
      console.log('   - Use participant code from database')
      console.log('   - Check if buildings appear')
      console.log('')
      console.log('ALTERNATIVE: Disable RLS temporarily in Supabase Dashboard')
      console.log('1. Go to Supabase Dashboard → SQL Editor')
      console.log('2. Run: ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;')
      console.log('3. Run this script again')
      console.log('4. Re-enable: ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;')
    }
    
    // Final verification
    const { data: finalBuildings } = await supabase
      .from('buildings')
      .select('*')
      .eq('farm_id', farmId)
    
    console.log(`\n📊 Final building count: ${finalBuildings?.length || 0}`)
    
    if (finalBuildings && finalBuildings.length > 0) {
      console.log('\n✅ SUCCESS! Staff dashboard should now display buildings.')
      console.log('')
      console.log('To test:')
      console.log('1. Open http://localhost:3000')
      console.log('2. Use participant login')
      console.log('3. Check if buildings appear in dashboard')
      console.log('')
      console.log('Available participant codes:')
      participants.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} - Code: ${p.code}`)
      })
    } else {
      console.log('\n❌ No buildings found. Please follow the manual solution above.')
    }

  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

completeStaffDashboardFix()
