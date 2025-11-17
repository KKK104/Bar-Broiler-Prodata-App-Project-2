const { createClient } = require('@supabase/supabase-js')
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
      console.log(`📊 Total buildings: ${buildings?.length || 0}`)
      
      if (buildings && buildings.length > 0) {
        console.log('✅ Buildings found:')
        buildings.forEach((building, index) => {
          console.log(`  ${index + 1}. ${building.name} (${building.status})`)
        })
        
        console.log('\n🎉 SUCCESS! Staff dashboard should now show buildings!')
        console.log('\nTo test:')
        console.log('1. Open http://localhost:3000')
        console.log('2. Use participant login with code: 253613')
        console.log('3. Check if buildings appear in dashboard')
      } else {
        console.log('❌ No buildings found - SQL fix may not have worked')
        console.log('🔧 Check Supabase Dashboard for errors')
      }
    }
    
    // Test building creation
    console.log('\n🧪 Testing building creation...')
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
      console.log(`   Created: ${testBuilding.name} (ID: ${testBuilding.id})`)
      
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

testAfterSQLFix()