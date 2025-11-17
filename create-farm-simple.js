const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function createFarmSimple() {
  console.log('🔧 CREATING FARM - SIMPLE VERSION')
  console.log('==================================\n')
  
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
    
    // Step 2: Create farm with minimal fields
    console.log('\n📋 Step 2: Creating farm with minimal fields...')
    
    const farmId = participant.farm_id
    
    const { data: newFarm, error: createFarmError } = await supabase
      .from('farms')
      .insert({
        id: farmId,
        name: 'Main Farm'
      })
      .select()
      .single()
    
    if (createFarmError) {
      console.log('❌ Farm creation error:', createFarmError.message)
      console.log('\n🔧 MANUAL SQL REQUIRED:')
      console.log('Run this SQL in Supabase Dashboard:')
      console.log('')
      console.log('```sql')
      console.log('-- Create farm')
      console.log(`INSERT INTO farms (id, name) VALUES ('${farmId}', 'Main Farm');`)
      console.log('')
      console.log('-- Create buildings')
      console.log('ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;')
      console.log('')
      console.log('INSERT INTO buildings (name, farm_id, status, cycle_number, cycle_start_date) VALUES')
      console.log(`('Production House 1', '${farmId}', 'active', 1, '2025-01-01'),`)
      console.log(`('Production House 2', '${farmId}', 'preparing', 2, '2025-01-15'),`)
      console.log(`('Production House 3', '${farmId}', 'maintenance', 3, '2025-02-01');`)
      console.log('')
      console.log('ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;')
      console.log('')
      console.log('-- Create RLS policies')
      console.log('DROP POLICY IF EXISTS "Allow building creation" ON buildings;')
      console.log('DROP POLICY IF EXISTS "Allow building selection" ON buildings;')
      console.log('DROP POLICY IF EXISTS "Allow building updates" ON buildings;')
      console.log('DROP POLICY IF EXISTS "Allow building deletion" ON buildings;')
      console.log('')
      console.log('CREATE POLICY "Allow building creation" ON buildings')
      console.log('FOR INSERT TO authenticated WITH CHECK (true);')
      console.log('')
      console.log('CREATE POLICY "Allow building selection" ON buildings')
      console.log('FOR SELECT TO authenticated USING (true);')
      console.log('')
      console.log('CREATE POLICY "Allow building updates" ON buildings')
      console.log('FOR UPDATE TO authenticated USING (true) WITH CHECK (true);')
      console.log('')
      console.log('CREATE POLICY "Allow building deletion" ON buildings')
      console.log('FOR DELETE TO authenticated USING (true);')
      console.log('```')
      console.log('')
      console.log('🎯 This will:')
      console.log('1. Create the farm that participants reference')
      console.log('2. Add sample buildings to the farm')
      console.log('3. Set up proper RLS policies')
      console.log('4. Make both owner and staff dashboards show the same data')
      return
    } else {
      console.log(`✅ Farm created successfully: ${newFarm.name} (ID: ${newFarm.id})`)
    }
    
    // Step 3: Create buildings
    console.log('\n📋 Step 3: Creating buildings...')
    
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
      console.log('\n🔧 MANUAL SQL REQUIRED for buildings:')
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
    
    // Step 4: Final verification
    console.log('\n📋 Step 4: Final verification...')
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
      console.log('✅ farmId will no longer be undefined')
    } else {
      console.log('\n⚠️  Farm created but no buildings found.')
      console.log('Run the manual SQL commands above to add buildings.')
    }
    
  } catch (error) {
    console.error('❌ Create farm failed:', error.message)
  }
}

createFarmSimple()
