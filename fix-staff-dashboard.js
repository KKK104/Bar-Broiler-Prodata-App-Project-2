const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixStaffDashboard() {
  try {
    console.log('🔧 Fixing Staff Dashboard - Backend Data Issue')
    console.log('===============================================\n')
    
    // Step 1: Check current state
    console.log('📊 Step 1: Checking current database state...')
    
    const { data: participants } = await supabase
      .from('participants')
      .select('farm_id')
      .limit(1)
    
    if (!participants || participants.length === 0) {
      console.log('❌ No participants found. Cannot proceed.')
      return
    }
    
    const farmId = participants[0].farm_id
    console.log(`✅ Found farm ID: ${farmId}`)
    
    // Check existing buildings
    const { data: existingBuildings } = await supabase
      .from('buildings')
      .select('*')
      .eq('farm_id', farmId)
    
    console.log(`📊 Current buildings: ${existingBuildings?.length || 0}`)
    
    if (existingBuildings && existingBuildings.length > 0) {
      console.log('✅ Buildings already exist! Staff dashboard should work.')
      existingBuildings.forEach((building, index) => {
        console.log(`  ${index + 1}. ${building.name} (${building.status})`)
      })
      return
    }
    
    // Step 2: The RLS issue
    console.log('\n🔒 Step 2: RLS Policy Issue Detected')
    console.log('The database has Row Level Security (RLS) enabled that prevents')
    console.log('creating buildings without proper authentication.')
    console.log('')
    console.log('SOLUTION OPTIONS:')
    console.log('==================')
    console.log('')
    console.log('Option 1: Use the Admin Dashboard (Recommended)')
    console.log('1. Open your app in browser: http://localhost:3000')
    console.log('2. Sign in as admin/owner')
    console.log('3. Go to Dashboard')
    console.log('4. Add buildings through the interface')
    console.log('')
    console.log('Option 2: Disable RLS Temporarily (Development Only)')
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Go to SQL Editor')
    console.log('3. Run this SQL:')
    console.log('   ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;')
    console.log('4. Then run this script again')
    console.log('5. Re-enable RLS: ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('Option 3: Fix RLS Policies (Advanced)')
    console.log('1. Go to Supabase Dashboard > Authentication > Policies')
    console.log('2. Create a policy for buildings table:')
    console.log('   - Policy Name: "Allow authenticated users to insert buildings"')
    console.log('   - Operation: INSERT')
    console.log('   - Target Roles: authenticated')
    console.log('   - USING expression: true')
    console.log('')
    
    // Step 3: Try to create buildings anyway (in case RLS is not the issue)
    console.log('🔧 Step 3: Attempting to create buildings...')
    
    const buildings = [
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
      console.log('The staff dashboard should now show data.')
    } else {
      console.log('\n❌ Could not create buildings due to RLS policies.')
      console.log('Please follow one of the solution options above.')
    }
    
    // Final check
    const { data: finalBuildings } = await supabase
      .from('buildings')
      .select('*')
      .eq('farm_id', farmId)
    
    console.log(`\n📊 Final building count: ${finalBuildings?.length || 0}`)
    
    if (finalBuildings && finalBuildings.length > 0) {
      console.log('✅ Staff dashboard should now display buildings!')
      console.log('')
      console.log('To test:')
      console.log('1. Open http://localhost:3000')
      console.log('2. Use participant login with code from database')
      console.log('3. Check if buildings appear in the dashboard')
    }

  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

fixStaffDashboard()
