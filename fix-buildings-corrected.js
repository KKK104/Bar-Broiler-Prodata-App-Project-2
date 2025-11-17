const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixBuildingsCorrected() {
  console.log('🔧 FIXING BUILDINGS - CORRECTED VERSION')
  console.log('======================================\n')
  
  try {
    // Get participant and farm ID
    const { data: participants } = await supabase
      .from('participants')
      .select('*')
      .limit(1)
    
    if (!participants || participants.length === 0) {
      console.log('❌ No participants found')
      return
    }
    
    const participant = participants[0]
    console.log(`✅ Found participant: ${participant.name}`)
    console.log(`🏢 Farm ID: ${participant.farm_id}`)
    
    // Check current table structure
    console.log('\n📋 Checking buildings table structure...')
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*')
      .limit(1)
    
    if (buildingsError) {
      console.log('❌ Buildings error:', buildingsError.message)
    } else {
      console.log('✅ Buildings table accessible')
      if (buildings && buildings.length > 0) {
        console.log('📊 Sample building columns:', Object.keys(buildings[0]))
      }
    }
    
    console.log('\n🔧 CORRECTED SQL COMMANDS:')
    console.log('==========================')
    console.log('')
    console.log('1. Go to: https://supabase.com/dashboard')
    console.log('2. Select project: yusqlnqtsszjjmyqaibp')
    console.log('3. Go to: SQL Editor')
    console.log('4. Copy and run this CORRECTED SQL:')
    console.log('')
    console.log('```sql')
    console.log('-- =================================================================================')
    console.log('-- FIX BUILDINGS RLS AND INSERT SAMPLE DATA (CORRECTED)')
    console.log('-- =================================================================================')
    console.log('')
    console.log('-- Step 1: Disable RLS temporarily')
    console.log('ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- Step 2: Clear any existing sample data (optional)')
    console.log(`DELETE FROM buildings WHERE farm_id = '${participant.farm_id}' AND name LIKE 'Production House %';`)
    console.log('')
    console.log('-- Step 3: Insert sample buildings (using only existing columns)')
    console.log('INSERT INTO buildings (name, farm_id, status, cycle_number, cycle_start_date) VALUES')
    console.log(`('Production House 1', '${participant.farm_id}', 'active', 1, '2025-01-01'),`)
    console.log(`('Production House 2', '${participant.farm_id}', 'preparing', 2, '2025-01-15'),`)
    console.log(`('Production House 3', '${participant.farm_id}', 'maintenance', 3, '2025-02-01');`)
    console.log('')
    console.log('-- Step 4: Re-enable RLS')
    console.log('ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- Step 5: Drop existing policies to avoid conflicts')
    console.log('DROP POLICY IF EXISTS "Allow building creation" ON buildings;')
    console.log('DROP POLICY IF EXISTS "Allow building selection" ON buildings;')
    console.log('DROP POLICY IF EXISTS "Allow building updates" ON buildings;')
    console.log('DROP POLICY IF EXISTS "Allow building deletion" ON buildings;')
    console.log('')
    console.log('-- Step 6: Create new RLS policies')
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
    console.log('')
    console.log('-- Step 7: Verify the data')
    console.log(`SELECT COUNT(*) as total_buildings FROM buildings WHERE farm_id = '${participant.farm_id}';`)
    console.log('```')
    console.log('')
    console.log('=====================================')
    console.log('')
    console.log('🎯 KEY CHANGES:')
    console.log('• Removed "capacity" column (doesn\'t exist)')
    console.log('• Removed "current_birds" column (doesn\'t exist)')
    console.log('• Using only existing columns: name, farm_id, status, cycle_number, cycle_start_date')
    console.log('')
    console.log('✅ This should work without errors!')
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message)
  }
}

fixBuildingsCorrected()
