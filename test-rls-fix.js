const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRLSFix() {
  try {
    console.log('🧪 Testing RLS Fix')
    console.log('==================\n')
    
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
    console.log('\n🏢 Testing building creation...')
    const { data: testBuilding, error: testError } = await supabase
      .from('buildings')
      .insert({
        name: 'Test Building - RLS Fix',
        farm_id: farmId,
        status: 'active',
        cycle_number: 1
      })
      .select()
      .single()
    
    if (testError) {
      console.log('❌ RLS is still blocking building creation')
      console.log('Error:', testError.message)
      console.log('\n🔧 You need to fix RLS in Supabase Dashboard:')
      console.log('1. Go to Supabase Dashboard → SQL Editor')
      console.log('2. Run: ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;')
      console.log('3. Run this script again')
    } else {
      console.log('✅ RLS fix successful! Building created:')
      console.log(`   ID: ${testBuilding.id}`)
      console.log(`   Name: ${testBuilding.name}`)
      console.log(`   Status: ${testBuilding.status}`)
      
      // Clean up test building
      await supabase
        .from('buildings')
        .delete()
        .eq('id', testBuilding.id)
      console.log('🧹 Test building cleaned up')
      
      console.log('\n🎉 RLS is now disabled! You can create buildings.')
      console.log('Run: node complete-staff-dashboard-fix.js')
    }
    
    // Check current building count
    const { data: allBuildings } = await supabase
      .from('buildings')
      .select('*')
      .eq('farm_id', farmId)
    
    console.log(`\n📊 Current buildings in farm: ${allBuildings?.length || 0}`)
    
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

testRLSFix()
