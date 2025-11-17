// Test script to verify the unique constraint on daily_records table
const { createClient } = require('@supabase/supabase-js')

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUniqueConstraint() {
  console.log('🔍 Testing unique constraint on daily_records table...')
  
  try {
    // Test 1: Insert a record
    console.log('📋 Test 1: Inserting first record...')
    const testRecord1 = {
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
      remarks: 'Test record 1',
      mortality_image: null,
      updated_at: new Date().toISOString()
    }
    
    const { data: insertData1, error: insertError1 } = await supabase
      .from('daily_records')
      .insert([testRecord1])
      .select()
    
    if (insertError1) {
      console.error('❌ Error inserting first record:', insertError1)
      return
    }
    
    console.log('✅ First record inserted successfully:', insertData1[0].id)
    
    // Test 2: Try to insert a duplicate record (same building_id and date)
    console.log('📋 Test 2: Attempting to insert duplicate record...')
    const testRecord2 = {
      farm_id: 'test-farm-id',
      building_id: 'test-building-id', // Same building
      date: '2025-01-01', // Same date
      age: 1,
      daily_feeds: 150,
      cumulative_feeds: 250,
      feeds_delivery: 0,
      remaining_feeds: 100,
      daily_mortality: 0,
      cumulative_mortality: 0,
      mortality_percent: 0,
      ending_heads: 1000,
      alw: 55,
      adg: 5,
      remarks: 'Test record 2 (duplicate)',
      mortality_image: null,
      updated_at: new Date().toISOString()
    }
    
    const { data: insertData2, error: insertError2 } = await supabase
      .from('daily_records')
      .insert([testRecord2])
      .select()
    
    if (insertError2) {
      if (insertError2.code === '23505') {
        console.log('✅ Unique constraint working correctly - duplicate prevented')
        console.log('📋 Error details:', insertError2.message)
      } else {
        console.error('❌ Unexpected error:', insertError2)
      }
    } else {
      console.log('❌ UNIQUE CONSTRAINT NOT WORKING - duplicate was inserted!')
    }
    
    // Test 3: Insert a record with different date (should work)
    console.log('📋 Test 3: Inserting record with different date...')
    const testRecord3 = {
      farm_id: 'test-farm-id',
      building_id: 'test-building-id', // Same building
      date: '2025-01-02', // Different date
      age: 1,
      daily_feeds: 150,
      cumulative_feeds: 250,
      feeds_delivery: 0,
      remaining_feeds: 100,
      daily_mortality: 0,
      cumulative_mortality: 0,
      mortality_percent: 0,
      ending_heads: 1000,
      alw: 55,
      adg: 5,
      remarks: 'Test record 3 (different date)',
      mortality_image: null,
      updated_at: new Date().toISOString()
    }
    
    const { data: insertData3, error: insertError3 } = await supabase
      .from('daily_records')
      .insert([testRecord3])
      .select()
    
    if (insertError3) {
      console.error('❌ Error inserting record with different date:', insertError3)
    } else {
      console.log('✅ Record with different date inserted successfully:', insertData3[0].id)
    }
    
    // Clean up test records
    console.log('🧹 Cleaning up test records...')
    const testIds = [insertData1[0].id]
    if (insertData3 && insertData3.length > 0) {
      testIds.push(insertData3[0].id)
    }
    
    const { error: deleteError } = await supabase
      .from('daily_records')
      .delete()
      .in('id', testIds)
    
    if (deleteError) {
      console.error('❌ Error cleaning up test records:', deleteError)
    } else {
      console.log('✅ Test records cleaned up successfully')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the test
testUniqueConstraint()
