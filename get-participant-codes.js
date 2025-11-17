const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function getParticipantCodes() {
  try {
    console.log('🔍 Getting Participant Codes for Testing')
    console.log('=========================================\n')
    
    const { data: participants, error } = await supabase
      .from('participants')
      .select('name, code, access_tools, farm_id')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (error) {
      console.error('❌ Error fetching participants:', error.message)
      return
    }
    
    if (!participants || participants.length === 0) {
      console.log('❌ No participants found in database')
      return
    }
    
    console.log(`✅ Found ${participants.length} participants\n`)
    console.log('📋 Available Participant Codes:')
    console.log('================================')
    
    participants.forEach((participant, index) => {
      console.log(`${index + 1}. Name: ${participant.name}`)
      console.log(`   Code: ${participant.code}`)
      console.log(`   Access: ${participant.access_tools.join(', ') || 'None'}`)
      console.log(`   Farm ID: ${participant.farm_id}`)
      console.log('')
    })
    
    console.log('🧪 Testing Instructions:')
    console.log('=======================')
    console.log('1. Open http://localhost:3000')
    console.log('2. Click "Participant Login"')
    console.log('3. Use any of the codes above')
    console.log('4. Check if staff dashboard shows buildings')
    console.log('')
    console.log('💡 If dashboard shows "No buildings yet":')
    console.log('   - Add buildings through admin interface first')
    console.log('   - Then test with participant login')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

getParticipantCodes()
