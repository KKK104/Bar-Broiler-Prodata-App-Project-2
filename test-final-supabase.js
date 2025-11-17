const { createClient } = require('@supabase/supabase-js');

// Correct Supabase credentials
const supabaseUrl = 'https://yusqlnqtsszjjmyqaibp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1c3FsbnF0c3N6ampteXFhaWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMzk5MjMsImV4cCI6MjA2NzYxNTkyM30.RTBBNk_SXYQBAMf9q0AfR5VkrGCw9IvAtLcLG1YtC88';

console.log('🔍 Testing Supabase connection with correct credentials...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? 'Set' : 'Missing');

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
    console.log('✅ Ready to build APK with fixed connection');
  } else {
    console.log('💥 Connection test failed!');
  }
  process.exit(success ? 0 : 1);
});






