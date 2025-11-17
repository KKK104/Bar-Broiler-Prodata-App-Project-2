const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyBuildingsFix() {
  console.log('🧪 VERIFYING BUILDINGS FIX')
  console.log('==========================\n')
  
  try {
    // Get participant
    const { data: participants } = await supabase
      .from('participants')
      .select('*')
      .limit(1)
    
    if (!participants || participants.length === 0) {
      console.log('❌ No participants found')
      return
    }
    
    const participant = participants[0]
    console.log(`👤 Participant: ${participant.name}`)
    console.log(`🏢 Farm ID: ${participant.farm_id}`)
    
    // Check buildings
    console.log('\n📊 Checking buildings...')
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*')
      .eq('farm_id', participant.farm_id)
      .order('created_at', { ascending: false })
    
    if (buildingsError) {
      console.log('❌ Error fetching buildings:', buildingsError.message)
      return
    }
    
    console.log(`📈 Total buildings found: ${buildings?.length || 0}`)
    
    if (buildings && buildings.length > 0) {
      console.log('\n✅ BUILDINGS FOUND:')
      buildings.forEach((building, index) => {
        console.log(`  ${index + 1}. ${building.name}`)
        console.log(`     Status: ${building.status}`)
        console.log(`     Cycle: ${building.cycle_number}`)
        console.log(`     Capacity: ${building.capacity || 'N/A'}`)
        console.log(`     Current Birds: ${building.current_birds || 'N/A'}`)
        console.log(`     Start Date: ${building.cycle_start_date || 'N/A'}`)
        console.log('')
      })
      
      console.log('🎉 SUCCESS! Your new worker dashboard should now show buildings!')
      console.log('')
      console.log('📱 Next steps:')
      console.log('1. Refresh your dashboard in the browser')
      console.log('2. You should see 3 buildings with different statuses')
      console.log('3. Try the search and filter features')
      console.log('4. Test the sort functionality')
      
    } else {
      console.log('❌ NO BUILDINGS FOUND')
      console.log('')
      console.log('🔧 The SQL commands may not have been run yet.')
      console.log('Please:')
      console.log('1. Go to: https://supabase.com/dashboard')
      console.log('2. Select project: yusqlnqtsszjjmyqaibp')
      console.log('3. Go to: SQL Editor')
      console.log('4. Run the SQL commands from the previous script')
      console.log('5. Run this verification script again')
    }
    
    // Test building creation
    console.log('\n🧪 Testing building creation...')
    try {
      const { data: testBuilding, error: createError } = await supabase
        .from('buildings')
        .insert({
          name: 'Test Building',
          farm_id: participant.farm_id,
          status: 'preparing',
          cycle_number: 99,
          cycle_start_date: '2025-01-01'
        })
        .select()
        .single()
      
      if (createError) {
        console.log('❌ Building creation still blocked:', createError.message)
        console.log('🔧 RLS policies may need to be recreated')
      } else {
        console.log('✅ Building creation works!')
        console.log(`   Created: ${testBuilding.name} (ID: ${testBuilding.id})`)
        
        // Clean up test building
        await supabase
          .from('buildings')
          .delete()
          .eq('id', testBuilding.id)
        console.log('🧹 Test building cleaned up')
      }
    } catch (err) {
      console.log('❌ Building creation test failed:', err.message)
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

verifyBuildingsFix()
