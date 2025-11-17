const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugStaffVsOwner() {
  try {
    console.log('🔍 DEBUGGING: Owner vs Staff Dashboard Data Access')
    console.log('===================================================\n')
    
    // Step 1: Check all buildings in database
    console.log('📋 Step 1: Checking ALL buildings in database')
    console.log('----------------------------------------------')
    const { data: allBuildings, error: allBuildingsError } = await supabase
      .from('buildings')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (allBuildingsError) {
      console.log('❌ Error fetching all buildings:', allBuildingsError.message)
    } else {
      console.log(`✅ Total buildings in database: ${allBuildings?.length || 0}`)
      if (allBuildings && allBuildings.length > 0) {
        console.log('📊 All buildings found:')
        allBuildings.forEach((building, index) => {
          console.log(`  ${index + 1}. ${building.name} (Farm: ${building.farm_id})`)
          console.log(`     Status: ${building.status}, Cycle: ${building.cycle_number}`)
          console.log(`     Created: ${building.created_at}`)
        })
      } else {
        console.log('❌ NO BUILDINGS FOUND IN DATABASE')
        console.log('🔧 This explains why both owner and staff dashboards show no buildings')
        return
      }
    }
    console.log('')
    
    // Step 2: Check participants and their farm access
    console.log('📋 Step 2: Checking participants and farm access')
    console.log('-----------------------------------------------')
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (participantsError) {
      console.log('❌ Participants error:', participantsError.message)
    } else {
      console.log(`✅ Found ${participants?.length || 0} participants`)
      
      if (participants && participants.length > 0) {
        // Group participants by farm
        const participantsByFarm = {}
        participants.forEach(p => {
          if (!participantsByFarm[p.farm_id]) {
            participantsByFarm[p.farm_id] = []
          }
          participantsByFarm[p.farm_id].push(p)
        })
        
        console.log('📊 Participants grouped by farm:')
        for (const farmId of Object.keys(participantsByFarm)) {
          console.log(`\n  🏢 Farm ID: ${farmId}`)
          console.log(`     Participants: ${participantsByFarm[farmId].length}`)
          participantsByFarm[farmId].forEach(p => {
            console.log(`       - ${p.name} (Code: ${p.code})`)
            console.log(`         Access: ${p.access_tools?.join(', ') || 'None'}`)
          })
          
          // Check buildings for this farm
          const { data: farmBuildings, error: farmBuildingsError } = await supabase
            .from('buildings')
            .select('*')
            .eq('farm_id', farmId)
          
          if (farmBuildingsError) {
            console.log(`     ❌ Buildings error: ${farmBuildingsError.message}`)
          } else {
            console.log(`     📊 Buildings for this farm: ${farmBuildings?.length || 0}`)
            if (farmBuildings && farmBuildings.length > 0) {
              farmBuildings.forEach((building, index) => {
                console.log(`       ${index + 1}. ${building.name} (${building.status})`)
              })
            } else {
              console.log('     ❌ NO BUILDINGS FOR THIS FARM')
            }
          }
        }
      }
    }
    console.log('')
    
    // Step 3: Simulate staff dashboard data fetching
    console.log('📋 Step 3: Simulating staff dashboard data fetch')
    console.log('------------------------------------------------')
    
    if (participants && participants.length > 0) {
      // Test with first participant (simulate staff login)
      const testParticipant = participants[0]
      console.log(`🧪 Testing with participant: ${testParticipant.name} (Code: ${testParticipant.code})`)
      console.log(`🏢 Participant's farm ID: ${testParticipant.farm_id}`)
      console.log(`🔧 Access tools: ${testParticipant.access_tools?.join(', ') || 'None'}`)
      
      // This is what the staff dashboard does - fetch buildings for participant's farm
      const { data: staffBuildings, error: staffBuildingsError } = await supabase
        .from('buildings')
        .select('*')
        .eq('farm_id', testParticipant.farm_id)
      
      if (staffBuildingsError) {
        console.log('❌ Staff dashboard buildings fetch error:', staffBuildingsError.message)
        console.log('🔒 This could be an RLS policy issue')
      } else {
        console.log(`📊 Buildings visible to staff dashboard: ${staffBuildings?.length || 0}`)
        
        if (staffBuildings && staffBuildings.length > 0) {
          console.log('✅ Staff dashboard SHOULD show buildings:')
          staffBuildings.forEach((building, index) => {
            console.log(`  ${index + 1}. ${building.name} (${building.status})`)
          })
          console.log('')
          console.log('🔍 If staff dashboard still shows "No buildings yet":')
          console.log('1. Check browser console for JavaScript errors')
          console.log('2. Check if participant session is correct')
          console.log('3. Check if frontend is using correct farm_id')
        } else {
          console.log('❌ Staff dashboard will show "No buildings yet"')
          console.log('🔧 This participant has no buildings in their farm')
        }
      }
    }
    console.log('')
    
    // Step 4: Check RLS policies
    console.log('📋 Step 4: Testing RLS policies')
    console.log('-------------------------------')
    
    if (participants && participants.length > 0) {
      const testParticipant = participants[0]
      console.log(`🧪 Testing RLS with participant: ${testParticipant.name}`)
      
      // Try to fetch buildings as this participant would
      try {
        const { data: testBuildings, error: testError } = await supabase
          .from('buildings')
          .select('*')
          .eq('farm_id', testParticipant.farm_id)
        
        if (testError) {
          console.log('❌ RLS is blocking staff access:', testError.message)
          console.log('🔧 Need to create RLS policies for staff access')
        } else {
          console.log('✅ RLS allows staff access to buildings')
        }
      } catch (err) {
        console.log('❌ RLS test error:', err.message)
      }
    }
    console.log('')
    
    // Step 5: Diagnosis
    console.log('📋 Step 5: DIAGNOSIS')
    console.log('====================')
    
    const totalBuildings = allBuildings?.length || 0
    const totalParticipants = participants?.length || 0
    
    if (totalBuildings === 0) {
      console.log('🚨 ISSUE: No buildings in database at all')
      console.log('🔧 Solution: Add buildings through admin interface or fix RLS')
    } else if (totalParticipants === 0) {
      console.log('🚨 ISSUE: No participants found')
      console.log('🔧 Solution: Create participants first')
    } else {
      console.log('🔍 POSSIBLE ISSUES:')
      console.log('1. RLS policies blocking staff access to buildings')
      console.log('2. Frontend not fetching buildings correctly')
      console.log('3. Participant session not working properly')
      console.log('4. Farm ID mismatch between participant and buildings')
      
      console.log('\n🔧 SOLUTIONS:')
      console.log('1. Create RLS policies for staff access:')
      console.log('   CREATE POLICY "Staff can view buildings" ON buildings')
      console.log('   FOR SELECT TO authenticated USING (true);')
      console.log('')
      console.log('2. Check browser console for JavaScript errors')
      console.log('3. Verify participant login is working')
      console.log('4. Check if buildings exist for participant\'s farm')
    }

  } catch (error) {
    console.error('❌ Debug failed:', error)
  }
}

debugStaffVsOwner()
