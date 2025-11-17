const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Key:', supabaseAnonKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('🔍 Testing connection to Supabase...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('farms')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('📊 Data received:', data);
    return true;
    
  } catch (err) {
    console.error('❌ Network error:', err.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('💥 Tests failed!');
  }
  process.exit(success ? 0 : 1);
});






