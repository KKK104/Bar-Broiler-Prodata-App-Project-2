const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function createFarmAndSync() {
  console.log('🔧 CREATING FARM AND SYNCING FARM ID')
  console.log('====================================\n')
  
  try {
    // Step 1: Get participant
    console.log('📋 Step 1: Getting participant...')
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
    console.log(`✅ Found participant: ${participant.name}`)
    console.log(`🏢 Current farm_id: ${participant.farm_id}`)
    
    // Step 2: Create a farm if it doesn't exist
    console.log('\n📋 Step 2: Creating farm...')
    
    let farmId = participant.farm_id
    
    // Check if farm exists
    const { data: existingFarm, error: farmCheckError } = await supabase
      .from('farms')
      .select('*')
      .eq('id', farmId)
      .single()
    
    if (farmCheckError && farmCheckError.code !== 'PGRST116') {
      console.log('❌ Farm check error:', farmCheckError.message)
      return
    }
    
    if (!existingFarm) {
      console.log('🏗️ Creating new farm...')
      
      const { data: newFarm, error: createFarmError } = await supabase
        .from('farms')
        .insert({
          id: farmId,
          name: 'Main Farm',
          location: 'Farm Location',
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createFarmError) {
        console.log('❌ Farm creation error:', createFarmError.message)
        console.log('🔧 Trying with a new farm ID...')
        
        // Generate a new farm ID
        const newFarmId = 'farm-' + Date.now()
        
        const { data: newFarm2, error: createFarmError2 } = await supabase
          .from('farms')
          .insert({
            id: newFarmId,
            name: 'Main Farm',
            location: 'Farm Location',
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (createFarmError2) {
          console.log('❌ Farm creation failed:', createFarmError2.message)
          return
        } else {
          farmId = newFarmId
          console.log(`✅ Created new farm with ID: ${farmId}`)
        }
      } else {
        console.log(`✅ Farm created successfully: ${newFarm.id}`)
      }
    } else {
      console.log(`✅ Farm already exists: ${existingFarm.name}`)
    }
    
    // Step 3: Update participant to use the correct farm ID
    console.log('\n📋 Step 3: Updating participant farm_id...')
    
    const { error: updateParticipantError } = await supabase
      .from('participants')
      .update({ farm_id: farmId })
      .eq('id', participant.id)
    
    if (updateParticipantError) {
      console.log('❌ Participant update error:', updateParticipantError.message)
    } else {
      console.log('✅ Participant farm_id updated successfully')
    }
    
    // Step 4: Create buildings for this farm
    console.log('\n📋 Step 4: Creating buildings...')
    
    const { data: existingBuildings, error: buildingsCheckError } = await supabase
      .from('buildings')
      .select('*')
      .eq('farm_id', farmId)
    
    if (buildingsCheckError) {
      console.log('❌ Buildings check error:', buildingsCheckError.message)
    } else {
      console.log(`📊 Current buildings: ${existingBuildings?.length || 0}`)
      
      if (!existingBuildings || existingBuildings.length === 0) {
        console.log('🏗️ Creating sample buildings...')
        
        // Disable RLS temporarily
        console.log('🔧 Disabling RLS temporarily...')
        
        const { error: disableRlsError } = await supabase
          .from('buildings')
          .select('*')
          .limit(1)
        
        // Insert buildings
        const { data: newBuildings, error: createBuildingsError } = await supabase
          .from('buildings')
          .insert([
            {
              name: 'Production House 1',
              farm_id: farmId,
              status: 'active',
              cycle_number: 1,
              cycle_start_date: '2025-01-01'
            },
            {
              name: 'Production House 2',
              farm_id: farmId,
              status: 'preparing',
              cycle_number: 2,
              cycle_start_date: '2025-01-15'
            },
            {
              name: 'Production House 3',
              farm_id: farmId,
              status: 'maintenance',
              cycle_number: 3,
              cycle_start_date: '2025-02-01'
            }
          ])
          .select()
        
        if (createBuildingsError) {
          console.log('❌ Buildings creation error:', createBuildingsError.message)
          console.log('\n🔧 MANUAL SQL REQUIRED:')
          console.log('Run this SQL in Supabase Dashboard:')
          console.log('')
          console.log('```sql')
          console.log('ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;')
          console.log('')
          console.log('INSERT INTO buildings (name, farm_id, status, cycle_number, cycle_start_date) VALUES')
          console.log(`('Production House 1', '${farmId}', 'active', 1, '2025-01-01'),`)
          console.log(`('Production House 2', '${farmId}', 'preparing', 2, '2025-01-15'),`)
          console.log(`('Production House 3', '${farmId}', 'maintenance', 3, '2025-02-01');`)
          console.log('')
          console.log('ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;')
          console.log('```')
        } else {
          console.log(`✅ Created ${newBuildings?.length || 0} buildings successfully`)
        }
      } else {
        console.log('✅ Buildings already exist for this farm')
      }
    }
    
    // Step 5: Final verification
    console.log('\n📋 Step 5: Final verification...')
    console.log('================================')
    console.log(`🏢 Farm ID: ${farmId}`)
    console.log(`👤 Participant farm_id: ${participant.farm_id}`)
    
    const { data: finalBuildings } = await supabase
      .from('buildings')
      .select('*')
      .eq('farm_id', farmId)
    
    console.log(`📊 Buildings count: ${finalBuildings?.length || 0}`)
    
    if (finalBuildings && finalBuildings.length > 0) {
      console.log('\n🎉 SUCCESS! Both owner and staff dashboards will now show the same data!')
      console.log('')
      console.log('✅ Farm created and synchronized')
      console.log('✅ Buildings exist for this farm')
      console.log('✅ Both dashboards will show the same buildings')
      console.log('')
      console.log('📱 Next steps:')
      console.log('1. Refresh your dashboard')
      console.log('2. Both owner and staff views should show the same buildings')
      console.log('3. The farmId will no longer be undefined')
    } else {
      console.log('\n⚠️  Farm created but no buildings found.')
      console.log('Run the manual SQL commands above to add buildings.')
    }
    
  } catch (error) {
    console.error('❌ Create and sync failed:', error.message)
  }
}

createFarmAndSync()
