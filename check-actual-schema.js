const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...')
    
    // Check farms table structure
    console.log('\n📊 Checking farms table...')
    const { data: farms, error: farmsError } = await supabase
      .from('farms')
      .select('*')
      .limit(1)
    
    if (farmsError) {
      console.log('Farms error:', farmsError.message)
    } else {
      console.log('✅ Farms table accessible')
      if (farms && farms.length > 0) {
        console.log('Sample farm:', farms[0])
      }
    }

    // Check buildings table
    console.log('\n🏢 Checking buildings table...')
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*')
      .limit(1)
    
    if (buildingsError) {
      console.log('Buildings error:', buildingsError.message)
    } else {
      console.log('✅ Buildings table accessible')
      if (buildings && buildings.length > 0) {
        console.log('Sample building:', buildings[0])
      }
    }

    // Check participants and their farm_id
    console.log('\n👥 Checking participants...')
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .limit(5)
    
    if (participantsError) {
      console.log('Participants error:', participantsError.message)
    } else {
      console.log(`✅ Found ${participants?.length || 0} participants`)
      if (participants && participants.length > 0) {
        console.log('Sample participant:', participants[0])
        
        // Try to get buildings for this participant's farm
        const farmId = participants[0].farm_id
        console.log(`\n🔍 Checking buildings for farm ${farmId}...`)
        
        const { data: farmBuildings, error: farmBuildingsError } = await supabase
          .from('buildings')
          .select('*')
          .eq('farm_id', farmId)
        
        if (farmBuildingsError) {
          console.log('Farm buildings error:', farmBuildingsError.message)
        } else {
          console.log(`✅ Found ${farmBuildings?.length || 0} buildings for this farm`)
          if (farmBuildings && farmBuildings.length > 0) {
            console.log('Sample building:', farmBuildings[0])
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error)
  }
}

checkSchema()
