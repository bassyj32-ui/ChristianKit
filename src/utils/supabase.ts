import { createClient } from '@supabase/supabase-js'

console.log('🔧 Supabase: Loading environment variables...')
console.log('🔧 VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('🔧 VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing')

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase: Missing environment variables! Running in demo mode.')
  console.warn('⚠️ URL:', supabaseUrl)
  console.warn('⚠️ Key:', supabaseAnonKey ? 'Found' : 'Missing')
  console.warn('⚠️ Environment:', isDevelopment ? 'Development' : 'Production')
  
  // Don't throw error, just log warning and continue in demo mode
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