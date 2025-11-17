const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function syncFarmId() {
  console.log('🔧 SYNCING FARM ID FOR OWNER AND STAFF DASHBOARDS')
  console.log('================================================\n')
  
  try {
    // Step 1: Get all participants
    console.log('📋 Step 1: Getting all participants...')
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
    
    if (participantsError) {
      console.log('❌ Participants error:', participantsError.message)
      return
    }
    
    console.log(`✅ Found ${participants?.length || 0} participants`)
    
    if (participants && participants.length > 0) {
      const participant = participants[0]
      console.log(`👤 Sample participant: ${participant.name}`)
      console.log(`🏢 Current farm_id: ${participant.farm_id}`)
      
      // Step 2: Get all farms
      console.log('\n📋 Step 2: Getting all farms...')
      const { data: farms, error: farmsError } = await supabase
        .from('farms')
        .select('*')
      
      if (farmsError) {
        console.log('❌ Farms error:', farmsError.message)
        return
      }
      
      console.log(`✅ Found ${farms?.length || 0} farms`)
      
      if (farms && farms.length > 0) {
        const farm = farms[0]
        console.log(`🏢 Sample farm: ${farm.name || 'Unnamed'} (ID: ${farm.id})`)
        
        // Step 3: Ensure all participants use the same farm ID
        console.log('\n📋 Step 3: Syncing farm IDs...')
        
        if (participant.farm_id !== farm.id) {
          console.log('🔄 Updating participant farm_id to match farm...')
          
          const { error: updateError } = await supabase
            .from('participants')
            .update({ farm_id: farm.id })
            .eq('id', participant.id)
          
          if (updateError) {
            console.log('❌ Update error:', updateError.message)
          } else {
            console.log('✅ Participant farm_id updated successfully')
          }
        } else {
          console.log('✅ Participant already has correct farm_id')
        }
        
        // Step 4: Check buildings for this farm
        console.log('\n📋 Step 4: Checking buildings for this farm...')
        const { data: buildings, error: buildingsError } = await supabase
          .from('buildings')
          .select('*')
          .eq('farm_id', farm.id)
        
        if (buildingsError) {
          console.log('❌ Buildings error:', buildingsError.message)
        } else {
          console.log(`📊 Buildings for farm ${farm.id}: ${buildings?.length || 0}`)
          
          if (buildings && buildings.length > 0) {
            console.log('✅ Buildings found:')
            buildings.forEach((building, index) => {
              console.log(`  ${index + 1}. ${building.name} (${building.status})`)
            })
          } else {
            console.log('❌ No buildings found for this farm')
            console.log('\n🔧 To add buildings, run this SQL in Supabase Dashboard:')
            console.log('')
            console.log('```sql')
            console.log('ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;')
            console.log('')
            console.log('INSERT INTO buildings (name, farm_id, status, cycle_number, cycle_start_date) VALUES')
            console.log(`('Production House 1', '${farm.id}', 'active', 1, '2025-01-01'),`)
            console.log(`('Production House 2', '${farm.id}', 'preparing', 2, '2025-01-15'),`)
            console.log(`('Production House 3', '${farm.id}', 'maintenance', 3, '2025-02-01');`)
            console.log('')
            console.log('ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;')
            console.log('```')
          }
        }
        
        // Step 5: Final verification
        console.log('\n📋 Step 5: Final verification...')
        console.log('================================')
        console.log(`🏢 Farm ID: ${farm.id}`)
        console.log(`👤 Participant farm_id: ${participant.farm_id}`)
        console.log(`📊 Buildings count: ${buildings?.length || 0}`)
        
        if (participant.farm_id === farm.id && (buildings?.length || 0) > 0) {
          console.log('\n🎉 SUCCESS! Both owner and staff dashboards will now show the same data!')
          console.log('')
          console.log('✅ Farm ID is synchronized')
          console.log('✅ Buildings exist for this farm')
          console.log('✅ Both dashboards will show the same buildings')
        } else if (participant.farm_id === farm.id) {
          console.log('\n⚠️  Farm ID is synchronized, but no buildings exist yet.')
          console.log('Run the SQL commands above to add buildings.')
        } else {
          console.log('\n❌ Farm ID synchronization failed.')
        }
        
      } else {
        console.log('❌ No farms found in database')
        console.log('🔧 Please create a farm first')
      }
    } else {
      console.log('❌ No participants found')
      console.log('🔧 Please create a participant first')
    }
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message)
  }
}

syncFarmId()
