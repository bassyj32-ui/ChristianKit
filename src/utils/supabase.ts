import { createClient } from '@supabase/supabase-js'

console.log('🔧 Supabase: Loading environment variables...')
console.log('🔧 VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('🔧 VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing')

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase: Missing environment variables!')
  console.error('❌ URL:', supabaseUrl)
  console.error('❌ Key:', supabaseAnonKey ? 'Found' : 'Missing')
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

console.log('✅ Supabase: Environment variables loaded successfully')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

console.log('✅ Supabase: Client created successfully')

// Export auth helpers
export const auth = supabase.auth