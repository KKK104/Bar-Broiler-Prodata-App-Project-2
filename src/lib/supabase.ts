import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Enhanced error checking for environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('Check NETLIFY_ENVIRONMENT_SETUP.md for setup instructions')
  
  // In development, show a more helpful error
  if (typeof window !== 'undefined') {
    console.error('Current environment:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      url: supabaseUrl ? 'Set' : 'Missing',
      key: supabaseAnonKey ? 'Set' : 'Missing'
    })
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Disable automatic email confirmation for custom code-based verification
      flowType: 'pkce'
    }
  }
)