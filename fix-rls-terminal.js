const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixRLSTerminal() {
  try {
    console.log('🔧 FIXING RLS POLICIES VIA TERMINAL')
    console.log('===================================\n')
    
    // Step 1: Try to disable RLS directly
    console.log('📋 Step 1: Attempting to disable RLS')
    console.log('------------------------------------')
    
    try {
      // Try to disable RLS using SQL
      const { data: disableResult, error: disableError } = await supabase
        .rpc('exec_sql', { sql: 'ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;' })
      
      if (disableError) {
        console.log('❌ Cannot disable RLS via API:', disableError.message)
        console.log('🔧 Need to use Supabase Dashboard or service role key')
      } else {
        console.log('✅ RLS disabled successfully')
      }
    } catch (err) {
      console.log('❌ RLS disable failed:', err.message)
      console.log('🔧 This is expected - need admin access')
    }
    
    // Step 2: Try to create buildings anyway
    console.log('\n📋 Step 2: Attempting to create buildings')
    console.log('------------------------------------------')
    
    const { data: participants } = await supabase
      .from('participants')
      .select('farm_id')
      .limit(1)
    
    if (!participants || participants.length === 0) {
      console.log('❌ No participants found')
      return
    }
    
    const farmId = participants[0].farm_id
    console.log(`✅ Using farm ID: ${farmId}`)
    
    // Try different approaches to create buildings
    const buildingAttempts = [
      {
        name: 'Terminal Building 1',
        farm_id: farmId,
        status: 'active'
      },
      {
        name: 'Terminal Building 2',
        farm_id: farmId,
        status: 'active',
        cycle_number: 1
      },
      {
        name: 'Terminal Building 3',
        farm_id: farmId,
        status: 'preparing',
        cycle_number: 2,
        cycle_start_date: '2025-01-01'
      }
    ]
    
    let successCount = 0
    for (const building of buildingAttempts) {
      try {
        console.log(`\n🏢 Attempting to create: ${building.name}`)
        
        const { data: newBuilding, error: buildingError } = await supabase
          .from('buildings')
          .insert(building)
          .select()
          .single()
        
        if (buildingError) {
          console.log(`❌ Failed: ${buildingError.message}`)
          
          // Try with minimal data
          console.log('🔄 Trying with minimal data...')
          const minimalBuilding = {
            name: building.name,
            farm_id: farmId
          }
          
          const { data: minimalResult, error: minimalError } = await supabase
            .from('buildings')
            .insert(minimalBuilding)
            .select()
            .single()
          
          if (minimalError) {
            console.log(`❌ Minimal data also failed: ${minimalError.message}`)
          } else {
            console.log(`✅ Minimal data succeeded: ${minimalResult.name}`)
            successCount++
          }
        } else {
          console.log(`✅ Created successfully: ${newBuilding.name} (ID: ${newBuilding.id})`)
          successCount++
        }
      } catch (err) {
        console.log(`❌ Error creating ${building.name}: ${err.message}`)
      }
    }
    
    // Step 3: Check final result
    console.log('\n📋 Step 3: Final Result')
    console.log('------------------------')
    
    const { data: allBuildings } = await supabase
      .from('buildings')
      .select('*')
    
    console.log(`📊 Total buildings created: ${successCount}`)
    console.log(`📊 Total buildings in database: ${allBuildings?.length || 0}`)
    
    if (allBuildings && allBuildings.length > 0) {
      console.log('✅ Buildings found:')
      allBuildings.forEach((building, index) => {
        console.log(`  ${index + 1}. ${building.name} (${building.status})`)
      })
      
      console.log('\n🎉 SUCCESS! Staff dashboard should now show buildings!')
      console.log('\nTo test:')
      console.log('1. Open http://localhost:3000')
      console.log('2. Use participant login with code: 253613')
      console.log('3. Check if buildings appear in dashboard')
    } else {
      console.log('\n❌ NO BUILDINGS CREATED')
      console.log('\n🔧 MANUAL SOLUTION REQUIRED:')
      console.log('============================')
      console.log('')
      console.log('Since RLS is blocking all programmatic creation, you need to:')
      console.log('')
      console.log('1. Go to Supabase Dashboard → SQL Editor')
      console.log('2. Run: ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;')
      console.log('3. Run this script again: node fix-rls-terminal.js')
      console.log('4. Re-enable RLS: ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;')
      console.log('')
      console.log('OR')
      console.log('')
      console.log('1. Open http://localhost:3000')
      console.log('2. Sign in as admin/owner')
      console.log('3. Add buildings through the interface')
      console.log('4. Test staff dashboard with participant login')
    }
    
    // Step 4: Create a simple SQL script for manual execution
    console.log('\n📋 Step 4: Creating SQL Script for Manual Execution')
    console.log('---------------------------------------------------')
    
    const sqlScript = `-- SQL Script to Fix RLS and Create Buildings
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Disable RLS temporarily
ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;

-- Step 2: Create sample buildings (adjust farm_id as needed)
INSERT INTO buildings (name, farm_id, status, cycle_number, cycle_start_date) VALUES
('Production House 1', '${farmId}', 'active', 1, '2025-01-01'),
('Production House 2', '${farmId}', 'active', 2, '2025-01-15'),
('Production House 3', '${farmId}', 'preparing', 3, '2025-02-01');

-- Step 3: Re-enable RLS
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- Step 4: Create proper RLS policies
CREATE POLICY "Allow building creation" ON buildings
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow building selection" ON buildings
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow building updates" ON buildings
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow building deletion" ON buildings
FOR DELETE TO authenticated USING (true);
`
    
    require('fs').writeFileSync('fix-rls-manual.sql', sqlScript)
    console.log('✅ Created fix-rls-manual.sql file')
    console.log('📁 Copy the contents and run in Supabase Dashboard → SQL Editor')
    
  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

fixRLSTerminal()
