import { createClient } from '@supabase/supabase-js'

console.log('🔧 Supabase: Loading environment variables...')
console.log('🔧 VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('🔧 VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing')

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV

if (!supabaseUrl || !supabaseAnonKey) {
  if (isDevelopment) {
    console.error('❌ Supabase: Missing environment variables in development!')
    console.error('❌ URL:', supabaseUrl)
    console.error('❌ Key:', supabaseAnonKey ? 'Found' : 'Missing')
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
  } else {
    // In production (Vercel), log warning but don't crash
    console.warn('⚠️ Supabase: Environment variables missing in production. App will work without backend features.')
  }
}

console.log('✅ Supabase: Environment variables loaded successfully')

// Create client only if we have the required variables
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null

console.log('✅ Supabase: Client created successfully')

// Export auth helpers with null check
export const auth = supabase?.auth || null