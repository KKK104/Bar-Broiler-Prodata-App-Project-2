#!/usr/bin/env node

/**
 * Script to verify Supabase connection and environment variables
 * Run this locally to test your Supabase setup
 */

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Supabase Connection Verification\n');

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('📋 Environment Variables Check:');
console.log(`✅ Supabase URL: ${supabaseUrl ? 'Set' : '❌ Missing'}`);
console.log(`✅ Supabase Anon Key: ${supabaseAnonKey ? 'Set' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('\n❌ Missing environment variables!');
  console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.log('Check QUICK_FIX_GUIDE.md for setup instructions');
  process.exit(1);
}

// Test connection
console.log('\n🔗 Testing Supabase connection...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase.from('participants').select('count').limit(1);
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      
      if (error.message.includes('JWT')) {
        console.log('💡 This might be a CORS or authentication issue');
        console.log('   Check your Supabase project settings');
      }
      
      return false;
    }
    
    console.log('✅ Connection successful!');
    console.log('✅ Supabase is responding correctly');
    return true;
    
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Your Supabase setup is working correctly!');
    console.log('   You can now deploy to Netlify with these environment variables.');
  } else {
    console.log('\n⚠️  Please check your Supabase project settings:');
    console.log('   1. Ensure your project is active');
    console.log('   2. Verify the URL and key are correct');
    console.log('   3. Check CORS settings for your domain');
  }
});
