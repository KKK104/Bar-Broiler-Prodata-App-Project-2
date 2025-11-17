const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use the correct project ID (without extra 'm')
const supabaseUrl = 'https://yusqlnqtsszjjmyqaibp.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection with correct project ID...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? 'Set' : 'Missing');

if (!supabaseAnonKey) {
  console.error('❌ Missing Supabase anon key!');
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
    console.log('🎉 Connection test passed!');
    console.log('Now you can rebuild your app and deploy the APK online.');
  } else {
    console.log('💥 Connection test failed!');
  }
  process.exit(success ? 0 : 1);
});






