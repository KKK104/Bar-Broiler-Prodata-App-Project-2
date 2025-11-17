// Test script to check daily_records table structure and functionality
const { createClient } = require('@supabase/supabase-js')

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDailyRecordsTable() {
  console.log('🔍 Testing daily_records table...')
  
  try {
    // Test 1: Check if table exists by trying to select from it
    console.log('📋 Test 1: Checking if daily_records table exists...')
    const { data, error } = await supabase
      .from('daily_records')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error accessing daily_records table:', error)
      return
    }
    
    console.log('✅ daily_records table exists and is accessible')
    
    // Test 2: Check table structure
    console.log('📋 Test 2: Checking table structure...')
    const { data: structureData, error: structureError } = await supabase
      .from('daily_records')
      .select('*')
      .limit(0)
    
    if (structureError) {
      console.error('❌ Error checking table structure:', structureError)
    } else {
      console.log('✅ Table structure check passed')
    }
    
    // Test 3: Try to insert a test record
    console.log('📋 Test 3: Testing insert operation...')
    const testRecord = {
      farm_id: 'test-farm-id',
      building_id: 'test-building-id',
      date: '2025-01-01',
      age: 0,
      daily_feeds: 100,
      cumulative_feeds: 100,
      feeds_delivery: 0,
      remaining_feeds: 100,
      daily_mortality: 0,
      cumulative_mortality: 0,
      mortality_percent: 0,
      ending_heads: 1000,
      alw: 50,
      adg: 0,
      remarks: 'Test record',
      mortality_image: null,
      updated_at: new Date().toISOString()
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('daily_records')
      .insert([testRecord])
      .select()
    
    if (insertError) {
      console.error('❌ Error inserting test record:', insertError)
      console.error('Error details:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
    } else {
      console.log('✅ Test record inserted successfully:', insertData)
      
      // Clean up test record
      if (insertData && insertData.length > 0) {
        const { error: deleteError } = await supabase
          .from('daily_records')
          .delete()
          .eq('id', insertData[0].id)
        
        if (deleteError) {
          console.error('❌ Error cleaning up test record:', deleteError)
        } else {
          console.log('✅ Test record cleaned up successfully')
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the test
testDailyRecordsTable()
