const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function addBuildingsViaAdmin() {
  try {
    console.log('🔍 Attempting to add buildings through admin interface...')
    
    // Get the first participant to get their farm_id
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('farm_id')
      .limit(1)
    
    if (participantsError || !participants || participants.length === 0) {
      console.error('❌ No participants found')
      return
    }
    
    const farmId = participants[0].farm_id
    console.log(`✅ Using farm ID: ${farmId}`)
    
    // Try to create buildings with minimal required fields
    console.log('\n🏢 Creating buildings with minimal data...')
    
    const buildings = [
      {
        name: 'Building A',
        farm_id: farmId,
        status: 'active'
      },
      {
        name: 'Building B', 
        farm_id: farmId,
        status: 'active'
      }
    ]
    
    for (const building of buildings) {
      try {
        const { data: newBuilding, error: buildingError } = await supabase
          .from('buildings')
          .insert(building)
          .select()
          .single()

        if (buildingError) {
          console.log(`❌ Failed to create ${building.name}:`, buildingError.message)
        } else {
          console.log(`✅ Created ${building.name} with ID: ${newBuilding.id}`)
        }
      } catch (err) {
        console.log(`❌ Error creating ${building.name}:`, err.message)
      }
    }

    // Check final count
    const { data: allBuildings, error: checkError } = await supabase
      .from('buildings')
      .select('*')
      .eq('farm_id', farmId)
    
    if (checkError) {
      console.log('❌ Error checking buildings:', checkError.message)
    } else {
      console.log(`\n📊 Total buildings in farm: ${allBuildings?.length || 0}`)
      if (allBuildings && allBuildings.length > 0) {
        allBuildings.forEach((building, index) => {
          console.log(`  ${index + 1}. ${building.name} (${building.status})`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Building creation failed:', error)
  }
}

addBuildingsViaAdmin()
