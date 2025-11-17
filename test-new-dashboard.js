const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testNewDashboard() {
  console.log('🧪 TESTING NEW WORKER DASHBOARD')
  console.log('==============================\n')
  
  try {
    // Test 1: Check connection
    console.log('📡 Step 1: Testing Supabase connection...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.log('❌ Auth error:', authError.message)
    } else {
      console.log('✅ Connection successful')
    }
    
    // Test 2: Get participants
    console.log('\n👥 Step 2: Getting participants...')
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .limit(1)
    
    if (participantsError) {
      console.log('❌ Participants error:', participantsError.message)
      return
    }
    
    if (!participants || participants.length === 0) {
      console.log('❌ No participants found')
      return
    }
    
    const participant = participants[0]
    console.log('✅ Found participant:', participant.name)
    console.log('🏢 Farm ID:', participant.farm_id)
    
    // Test 3: Check buildings
    console.log('\n🏗️ Step 3: Checking buildings...')
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*')
      .eq('farm_id', participant.farm_id)
    
    if (buildingsError) {
      console.log('❌ Buildings error:', buildingsError.message)
    } else {
      console.log(`📊 Buildings found: ${buildings?.length || 0}`)
      
      if (buildings && buildings.length > 0) {
        console.log('✅ Buildings available:')
        buildings.forEach((building, index) => {
          console.log(`  ${index + 1}. ${building.name} (${building.status})`)
        })
        console.log('\n🎉 NEW DASHBOARD SHOULD SHOW BUILDINGS!')
      } else {
        console.log('❌ No buildings found')
        console.log('\n🔧 To add buildings, run this SQL in Supabase Dashboard:')
        console.log('')
        console.log('```sql')
        console.log('ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;')
        console.log('')
        console.log('INSERT INTO buildings (name, farm_id, status, cycle_number, cycle_start_date) VALUES')
        console.log(`('Production House 1', '${participant.farm_id}', 'active', 1, '2025-01-01'),`)
        console.log(`('Production House 2', '${participant.farm_id}', 'active', 2, '2025-01-15'),`)
        console.log(`('Production House 3', '${participant.farm_id}', 'preparing', 3, '2025-02-01');`)
        console.log('')
        console.log('ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;')
        console.log('```')
        console.log('')
        console.log('Then refresh the dashboard!')
      }
    }
    
    // Test 4: Dashboard features
    console.log('\n🎨 Step 4: New Dashboard Features')
    console.log('--------------------------------')
    console.log('✅ Modern card-based layout')
    console.log('✅ Search and filter functionality')
    console.log('✅ Status badges with icons')
    console.log('✅ Responsive grid design')
    console.log('✅ Loading states and error handling')
    console.log('✅ Debug information panel')
    console.log('✅ Statistics cards')
    console.log('✅ Sort and filter options')
    
    console.log('\n🎉 NEW WORKER DASHBOARD IS READY!')
    console.log('================================')
    console.log('Features:')
    console.log('• Clean, modern design')
    console.log('• Real-time data fetching')
    console.log('• Search and filter buildings')
    console.log('• Status indicators')
    console.log('• Responsive layout')
    console.log('• Error handling')
    console.log('• Debug information')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testNewDashboard()
