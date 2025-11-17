const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSampleBuildings() {
  try {
    console.log('🔍 Getting existing farm ID...')
    
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
    
    // Create sample buildings
    console.log('\n🏢 Creating sample buildings...')
    const { data: newBuildings, error: buildingsError } = await supabase
      .from('buildings')
      .insert([
        {
          name: 'Building A - Production House 1',
          farm_id: farmId,
          status: 'active',
          cycle_number: 1,
          cycle_start_date: '2025-01-01',
          building_number: 1,
          capacity: 10000
        },
        {
          name: 'Building B - Production House 2', 
          farm_id: farmId,
          status: 'active',
          cycle_number: 2,
          cycle_start_date: '2025-01-15',
          building_number: 2,
          capacity: 12000
        },
        {
          name: 'Building C - Production House 3',
          farm_id: farmId,
          status: 'preparing',
          cycle_number: 3,
          cycle_start_date: '2025-02-01',
          building_number: 3,
          capacity: 15000
        }
      ])
      .select()

    if (buildingsError) {
      console.error('❌ Failed to create buildings:', buildingsError)
    } else {
      console.log(`✅ Created ${newBuildings?.length || 0} sample buildings`)
      newBuildings?.forEach((building, index) => {
        console.log(`  ${index + 1}. ${building.name} (Status: ${building.status})`)
      })
    }

    // Create some sample daily records for the buildings
    console.log('\n📊 Creating sample daily records...')
    if (newBuildings && newBuildings.length > 0) {
      for (const building of newBuildings) {
        const { data: dailyRecord, error: recordError } = await supabase
          .from('daily_records')
          .insert({
            building_id: building.id,
            date: new Date().toISOString().split('T')[0],
            starting_heads: 10000,
            ending_heads: 9800,
            mortality: 200,
            mortality_percent: 2.0,
            feed_consumed: 1500,
            cumulative_feeds: 15000,
            alw: 2500,
            cumulative_weight: 24500
          })
          .select()

        if (recordError) {
          console.log(`⚠️  Could not create daily record for ${building.name}:`, recordError.message)
        } else {
          console.log(`✅ Created daily record for ${building.name}`)
        }
      }
    }

    console.log('\n🎉 Sample data creation complete!')
    console.log('You can now test the staff dashboard - it should show buildings.')

  } catch (error) {
    console.error('❌ Sample data creation failed:', error)
  }
}

createSampleBuildings()
