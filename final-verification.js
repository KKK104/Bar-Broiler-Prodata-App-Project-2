const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function finalVerification() {
  console.log('🧪 FINAL VERIFICATION - NEW WORKER DASHBOARD')
  console.log('============================================\n')
  
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
        console.log(`     Cycle: ${building.cycle_number || 'N/A'}`)
        console.log(`     Start Date: ${building.cycle_start_date || 'N/A'}`)
        console.log(`     ID: ${building.id}`)
        console.log('')
      })
      
      console.log('🎉 SUCCESS! Your new worker dashboard should now show buildings!')
      console.log('')
      console.log('📱 Dashboard Features:')
      console.log('• Modern card-based layout')
      console.log('• Statistics cards showing counts')
      console.log('• Search and filter functionality')
      console.log('• Status badges with icons')
      console.log('• Responsive grid design')
      console.log('• Debug information panel')
      console.log('')
      console.log('🚀 Next steps:')
      console.log('1. Refresh your dashboard in the browser')
      console.log('2. You should see 3 buildings with different statuses')
      console.log('3. Try the search and filter features')
      console.log('4. Test the sort functionality')
      console.log('5. Check the statistics cards at the top')
      
    } else {
      console.log('❌ NO BUILDINGS FOUND')
      console.log('')
      console.log('🔧 Please run the CORRECTED SQL commands:')
      console.log('1. Go to: https://supabase.com/dashboard')
      console.log('2. Select project: yusqlnqtsszjjmyqaibp')
      console.log('3. Go to: SQL Editor')
      console.log('4. Run the corrected SQL from the previous script')
      console.log('5. Run this verification script again')
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

finalVerification()
