const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPolicyCreation() {
  try {
    console.log('🧪 Testing RLS Policy Creation')
    console.log('==============================\n')
    
    // Get farm ID
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
    console.log('\n🏢 Testing building creation with new policies...')
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
      console.log('❌ RLS policies are still blocking building creation')
      console.log('Error:', testError.message)
      console.log('\n🔧 Make sure you ran the SQL commands in Supabase Dashboard:')
      console.log('1. Go to Supabase Dashboard → SQL Editor')
      console.log('2. Run the CREATE POLICY commands I provided')
      console.log('3. Run this script again')
    } else {
      console.log('✅ RLS policies working! Building created successfully:')
      console.log(`   ID: ${testBuilding.id}`)
      console.log(`   Name: ${testBuilding.name}`)
      console.log(`   Status: ${testBuilding.status}`)
      
      // Clean up test building
      await supabase
        .from('buildings')
        .delete()
        .eq('id', testBuilding.id)
      console.log('🧹 Test building cleaned up')
      
      console.log('\n🎉 RLS policies are working! Now creating sample buildings...')
      
      // Create sample buildings for the staff dashboard
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
    }
    
    // Check final building count
    const { data: allBuildings } = await supabase
      .from('buildings')
      .select('*')
      .eq('farm_id', farmId)
    
    console.log(`\n📊 Final building count: ${allBuildings?.length || 0}`)
    
    if (allBuildings && allBuildings.length > 0) {
      console.log('✅ Buildings found:')
      allBuildings.forEach((building, index) => {
        console.log(`  ${index + 1}. ${building.name} (${building.status})`)
      })
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testPolicyCreation()
