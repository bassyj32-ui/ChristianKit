import { createClient } from '@supabase/supabase-js'

console.log('🔧 Supabase: Loading environment variables...')
console.log('🔧 VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('🔧 VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Found (length: ' + import.meta.env.VITE_SUPABASE_ANON_KEY.length + ')' : '❌ Missing')

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase: Missing environment variables!')
  console.error('❌ URL:', supabaseUrl || 'MISSING')
  console.error('❌ Key:', supabaseAnonKey ? 'Found' : 'MISSING')
  console.error('❌ Environment:', isDevelopment ? 'Development' : 'Production')
  console.error('❌ Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  
  // Don't throw error, just log warning and continue in demo mode
} else {
  console.log('✅ Supabase: Environment variables loaded successfully')
  console.log('✅ URL Format Check:', supabaseUrl.includes('supabase.co') ? 'Valid' : 'Invalid format')
  console.log('✅ Key Format Check:', supabaseAnonKey.startsWith('eyJ') ? 'Valid JWT format' : 'Invalid format')
}

// Create client only if we have the required variables
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'X-Client-Info': 'christian-kit'
        }
      }
    })
  : null

if (supabase) {
  console.log('✅ Supabase: Client created successfully')
  
  // Test connection in development
  if (isDevelopment) {
    supabase.from('profiles').select('count', { count: 'exact', head: true })
      .then(({ error, count }) => {
        if (error) {
          console.error('❌ Supabase: Connection test failed:', error.message)
        } else {
          console.log('✅ Supabase: Connection test successful - profiles table accessible')
        }
      })
      .catch(err => {
        console.error('❌ Supabase: Connection test error:', err)
      })
  }
} else {
  console.warn('⚠️ Supabase: Client not created - running in demo mode')
}

// Export auth helpers with null check
export const auth = supabase?.auth || null

// Export connection test function
export const testSupabaseConnection = async (): Promise<boolean> => {
  if (!supabase) {
    console.error('❌ Supabase client not initialized')
    return false
  }
  
  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message)
      return false
    }
    console.log('✅ Supabase connection test passed')
    return true
  } catch (err) {
    console.error('❌ Supabase connection test error:', err)
    return false
  }
}