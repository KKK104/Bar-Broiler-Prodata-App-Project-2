const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRLSStatus() {
  try {
    console.log('🔍 Checking RLS Status and Database State')
    console.log('==========================================\n')
    
    // Check if we can query buildings table
    console.log('📊 Checking buildings table access...')
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*')
      .limit(5)
    
    if (buildingsError) {
      console.log('❌ Buildings table error:', buildingsError.message)
    } else {
      console.log(`✅ Buildings table accessible - Found ${buildings?.length || 0} buildings`)
    }
    
    // Check participants and their farm
    console.log('\n👥 Checking participants...')
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('name, code, farm_id, access_tools')
      .limit(3)
    
    if (participantsError) {
      console.log('❌ Participants error:', participantsError.message)
    } else {
      console.log(`✅ Found ${participants?.length || 0} participants`)
      if (participants && participants.length > 0) {
        const farmId = participants[0].farm_id
        console.log(`✅ Using farm ID: ${farmId}`)
        
        // Check buildings for this specific farm
        console.log('\n🏢 Checking buildings for this farm...')
        const { data: farmBuildings, error: farmBuildingsError } = await supabase
          .from('buildings')
          .select('*')
          .eq('farm_id', farmId)
        
        if (farmBuildingsError) {
          console.log('❌ Farm buildings error:', farmBuildingsError.message)
        } else {
          console.log(`📊 Buildings in farm: ${farmBuildings?.length || 0}`)
          if (farmBuildings && farmBuildings.length > 0) {
            farmBuildings.forEach((building, index) => {
              console.log(`  ${index + 1}. ${building.name} (${building.status})`)
            })
          }
        }
      }
    }
    
    // Try to create a test building
    console.log('\n🧪 Testing building creation...')
    try {
      const { data: testBuilding, error: testError } = await supabase
        .from('buildings')
        .insert({
          name: 'Test Building',
          farm_id: participants?.[0]?.farm_id || 'test-farm-id',
          status: 'active'
        })
        .select()
        .single()
      
      if (testError) {
        console.log('❌ Test building creation failed:', testError.message)
        console.log('🔒 RLS is still blocking building creation')
      } else {
        console.log('✅ Test building created successfully!')
        console.log('🔓 RLS is disabled or policy allows creation')
        
        // Clean up test building
        await supabase
          .from('buildings')
          .delete()
          .eq('id', testBuilding.id)
        console.log('🧹 Test building cleaned up')
      }
    } catch (err) {
      console.log('❌ Test creation error:', err.message)
    }
    
    console.log('\n🔧 SOLUTION OPTIONS:')
    console.log('===================')
    console.log('')
    console.log('Option 1: Manual Building Creation (Recommended)')
    console.log('1. Open http://localhost:3000')
    console.log('2. Sign in as admin/owner')
    console.log('3. Add buildings through the interface')
    console.log('')
    console.log('Option 2: Fix RLS in Supabase Dashboard')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Run: ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;')
    console.log('3. Verify with: SELECT * FROM pg_tables WHERE tablename = \'buildings\';')
    console.log('4. Run this script again to test')
    console.log('')
    console.log('Option 3: Create RLS Policy')
    console.log('1. Go to Supabase Dashboard → Authentication → Policies')
    console.log('2. Create policy for buildings table:')
    console.log('   - Name: "Allow building creation"')
    console.log('   - Operation: INSERT')
    console.log('   - Roles: authenticated')
    console.log('   - USING: true')

  } catch (error) {
    console.error('❌ Check failed:', error)
  }
}

checkRLSStatus()
