const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixBuildingsTerminal() {
  console.log('🔧 FIXING BUILDINGS ISSUE FROM TERMINAL')
  console.log('========================================\n')
  
  try {
    // Step 1: Get participant and farm ID
    console.log('📋 Step 1: Getting participant and farm ID...')
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .limit(1)
    
    if (participantsError) {
      console.error('❌ Error fetching participants:', participantsError.message)
      return
    }
    
    if (!participants || participants.length === 0) {
      console.error('❌ No participants found')
      return
    }
    
    const participant = participants[0]
    console.log(`✅ Found participant: ${participant.name}`)
    console.log(`🏢 Farm ID: ${participant.farm_id}`)
    
    // Step 2: Check current buildings
    console.log('\n📋 Step 2: Checking current buildings...')
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*')
      .eq('farm_id', participant.farm_id)
    
    if (buildingsError) {
      console.log('❌ Buildings error:', buildingsError.message)
    } else {
      console.log(`📊 Current buildings: ${buildings?.length || 0}`)
    }
    
    // Step 3: Generate SQL commands
    console.log('\n📋 Step 3: Generating SQL commands...')
    console.log('=====================================')
    console.log('')
    console.log('🔧 COPY AND RUN THIS SQL IN SUPABASE DASHBOARD:')
    console.log('')
    console.log('1. Go to: https://supabase.com/dashboard')
    console.log('2. Select project: yusqlnqtsszjjmyqaibp')
    console.log('3. Go to: SQL Editor')
    console.log('4. Copy the SQL below and click "Run"')
    console.log('')
    console.log('```sql')
    console.log('-- =================================================================================')
    console.log('-- FIX BUILDINGS RLS AND INSERT SAMPLE DATA')
    console.log('-- =================================================================================')
    console.log('')
    console.log('-- Step 1: Disable RLS temporarily')
    console.log('ALTER TABLE buildings DISABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- Step 2: Clear any existing sample data (optional)')
    console.log(`DELETE FROM buildings WHERE farm_id = '${participant.farm_id}' AND name LIKE 'Production House %';`)
    console.log('')
    console.log('-- Step 3: Insert sample buildings')
    console.log('INSERT INTO buildings (name, farm_id, status, cycle_number, cycle_start_date, capacity, current_birds) VALUES')
    console.log(`('Production House 1', '${participant.farm_id}', 'active', 1, '2025-01-01', 10000, 9500),`)
    console.log(`('Production House 2', '${participant.farm_id}', 'preparing', 2, '2025-01-15', 12000, 0),`)
    console.log(`('Production House 3', '${participant.farm_id}', 'maintenance', 3, '2025-02-01', 8000, 0);`)
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
    console.log('🎯 AFTER RUNNING THE SQL:')
    console.log('1. Refresh your dashboard')
    console.log('2. You should see 3 buildings:')
    console.log('   - Production House 1 (Active)')
    console.log('   - Production House 2 (Preparing)')
    console.log('   - Production House 3 (Maintenance)')
    console.log('')
    console.log('🔧 If you get errors:')
    console.log('- Make sure you have admin access to the Supabase project')
    console.log('- Check that the farm_id exists in your database')
    console.log('- Try running the SQL commands one by one')
    
  } catch (error) {
    console.error('❌ Terminal fix failed:', error.message)
  }
}

fixBuildingsTerminal()
