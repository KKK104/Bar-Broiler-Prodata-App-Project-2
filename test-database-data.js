const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing database data...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? 'Set' : 'Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabase() {
  try {
    // Check farms
    console.log('\n📊 Checking farms...')
    const { data: farms, error: farmsError } = await supabase
      .from('farms')
      .select('*')
    
    if (farmsError) {
      console.error('❌ Farms error:', farmsError)
    } else {
      console.log(`✅ Found ${farms?.length || 0} farms`)
      if (farms && farms.length > 0) {
        console.log('Farm details:', farms[0])
      }
    }

    // Check buildings
    console.log('\n🏢 Checking buildings...')
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*')
    
    if (buildingsError) {
      console.error('❌ Buildings error:', buildingsError)
    } else {
      console.log(`✅ Found ${buildings?.length || 0} buildings`)
      if (buildings && buildings.length > 0) {
        console.log('Building details:', buildings[0])
      }
    }

    // Check participants
    console.log('\n👥 Checking participants...')
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
    
    if (participantsError) {
      console.error('❌ Participants error:', participantsError)
    } else {
      console.log(`✅ Found ${participants?.length || 0} participants`)
      if (participants && participants.length > 0) {
        console.log('Participant details:', participants[0])
      }
    }

    // If no data, create sample data
    if ((!farms || farms.length === 0) && (!buildings || buildings.length === 0)) {
      console.log('\n🔧 Creating sample data...')
      
      // Create a sample farm
      const { data: newFarm, error: farmError } = await supabase
        .from('farms')
        .insert({
          name: 'Sample Farm',
          location: 'Sample Location',
          owner_id: 'sample-owner-id'
        })
        .select()
        .single()

      if (farmError) {
        console.error('❌ Failed to create farm:', farmError)
      } else {
        console.log('✅ Created sample farm:', newFarm.id)
        
        // Create sample buildings
        const { data: newBuildings, error: buildingsError } = await supabase
          .from('buildings')
          .insert([
            {
              name: 'Building A',
              farm_id: newFarm.id,
              status: 'active',
              cycle_number: 1,
              cycle_start_date: '2025-01-01'
            },
            {
              name: 'Building B', 
              farm_id: newFarm.id,
              status: 'active',
              cycle_number: 2,
              cycle_start_date: '2025-01-15'
            }
          ])
          .select()

        if (buildingsError) {
          console.error('❌ Failed to create buildings:', buildingsError)
        } else {
          console.log(`✅ Created ${newBuildings?.length || 0} sample buildings`)
        }

        // Create sample participant
        const { data: newParticipant, error: participantError } = await supabase
          .from('participants')
          .insert({
            name: 'Test Worker',
            code: 'WORKER001',
            farm_id: newFarm.id,
            access_tools: ['Production Input', 'Production Performance']
          })
          .select()
          .single()

        if (participantError) {
          console.error('❌ Failed to create participant:', participantError)
        } else {
          console.log('✅ Created sample participant:', newParticipant.name)
        }
      }
    }

  } catch (error) {
    console.error('❌ Database test failed:', error)
  }
}

testDatabase()
