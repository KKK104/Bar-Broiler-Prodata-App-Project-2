// Frontend Debug Script for Staff Dashboard
// Add this to your browser console to debug the staff dashboard

console.log('🔍 FRONTEND DEBUG: Staff Dashboard Analysis');
console.log('============================================');

// Check if Supabase client is available
if (typeof window !== 'undefined' && window.supabase) {
  console.log('✅ Supabase client found in window');
} else {
  console.log('❌ Supabase client not found in window');
}

// Check environment variables
console.log('📋 Environment Variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');

// Function to test Supabase connection
async function testSupabaseConnection() {
  try {
    console.log('🧪 Testing Supabase connection...');
    
    // Import Supabase client (adjust path as needed)
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Missing Supabase environment variables');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection
    const { data, error } = await supabase
      .from('participants')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Supabase connection failed:', error.message);
    } else {
      console.log('✅ Supabase connection successful');
    }
    
    // Check participants
    const { data: participants, error: participantsError } = await supabase
      .from('participants')
      .select('*')
      .limit(5);
    
    if (participantsError) {
      console.log('❌ Participants error:', participantsError.message);
    } else {
      console.log(`✅ Found ${participants?.length || 0} participants`);
      if (participants && participants.length > 0) {
        console.log('📊 Sample participant:', participants[0]);
      }
    }
    
    // Check buildings
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*');
    
    if (buildingsError) {
      console.log('❌ Buildings error:', buildingsError.message);
    } else {
      console.log(`📊 Total buildings in database: ${buildings?.length || 0}`);
      if (buildings && buildings.length > 0) {
        console.log('📋 Buildings found:', buildings);
      } else {
        console.log('❌ NO BUILDINGS FOUND - This is why dashboard shows "No buildings yet"');
      }
    }
    
  } catch (err) {
    console.log('❌ Debug error:', err.message);
  }
}

// Function to check current participant session
function checkParticipantSession() {
  console.log('👤 Checking participant session...');
  
  // Check localStorage for participant session
  const participantSession = localStorage.getItem('participant-session');
  if (participantSession) {
    console.log('✅ Participant session found:', JSON.parse(participantSession));
  } else {
    console.log('❌ No participant session found');
  }
  
  // Check for any other relevant localStorage items
  console.log('📋 All localStorage items:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.includes('participant') || key.includes('session') || key.includes('auth')) {
      console.log(`  ${key}:`, localStorage.getItem(key));
    }
  }
}

// Function to simulate staff dashboard data fetching
async function simulateStaffDashboardFetch() {
  console.log('🎭 Simulating staff dashboard data fetch...');
  
  try {
    // This simulates what the staff dashboard component does
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Cannot simulate - missing environment variables');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get current participant (simulate)
    const { data: participants } = await supabase
      .from('participants')
      .select('*')
      .limit(1);
    
    if (!participants || participants.length === 0) {
      console.log('❌ No participants found for simulation');
      return;
    }
    
    const farmId = participants[0].farm_id;
    console.log(`🏢 Using farm ID: ${farmId}`);
    
    // Fetch buildings for this farm (this is what the dashboard does)
    const { data: buildings, error: buildingsError } = await supabase
      .from('buildings')
      .select('*')
      .eq('farm_id', farmId);
    
    if (buildingsError) {
      console.log('❌ Buildings fetch error:', buildingsError.message);
    } else {
      console.log(`📊 Buildings fetched: ${buildings?.length || 0}`);
      if (buildings && buildings.length > 0) {
        console.log('✅ Buildings would be displayed in dashboard');
        console.log('📋 Buildings data:', buildings);
      } else {
        console.log('❌ NO BUILDINGS - Dashboard will show "No buildings yet"');
        console.log('🔧 This is the exact issue - no buildings in database');
      }
    }
    
  } catch (err) {
    console.log('❌ Simulation error:', err.message);
  }
}

// Run all debug functions
console.log('🚀 Running frontend debug analysis...');
testSupabaseConnection();
checkParticipantSession();
simulateStaffDashboardFetch();

console.log('📋 Debug Summary:');
console.log('1. Check if Supabase connection works');
console.log('2. Check if participants exist');
console.log('3. Check if buildings exist for participant\'s farm');
console.log('4. If no buildings found, that\'s why dashboard shows "No buildings yet"');
console.log('5. Solution: Add buildings to database or fix RLS policies');
