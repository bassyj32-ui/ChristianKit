import { createClient } from '@supabase/supabase-js'

// Loading Supabase configuration

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

// Check if we're in development mode
const isDevelopment = (import.meta as any).env.DEV

// Fallback to hardcoded values if env vars are not loaded (for testing)
const fallbackUrl = 'https://hrznuhcwdjnpasfnqqwp.supabase.co'
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyem51aGN3ZGpucGFzZm5xcXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mzg3ODAsImV4cCI6MjA3MTIxNDc4MH0.G4x6DJxwgdXGI47Zc4Gro_HBbDW0J2rwxru72f3z_Us'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase: Environment variables not loaded, using fallbacks')
  console.warn('⚠️ This is normal in some dev environments - using hardcoded values for testing')
  // Use fallbacks for development
  const supabaseUrl = fallbackUrl
  const supabaseAnonKey = fallbackKey
} else {
  console.log('✅ Supabase: Environment variables loaded successfully')
}

// Use the corrected variables
const finalUrl = supabaseUrl || fallbackUrl
const finalKey = supabaseAnonKey || fallbackKey

// Create client
export const supabase = createClient(finalUrl, finalKey, {
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

if (supabase) {
  // Supabase client created successfully
  
  // Test connection in development
  if (isDevelopment) {
    (async () => {
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
        if (error) {
          console.error('❌ Supabase: Connection test failed:', error.message)
        } else {
          console.log('✅ Supabase: Initial connection test passed')
        }
      } catch (err: any) {
        console.error('❌ Supabase: Connection test error:', err)
      }
    })()
  }
} else {
  console.warn('⚠️ Supabase: Client not created - running in demo mode')
  console.warn('⚠️ URL:', supabaseUrl)
  console.warn('⚠️ Key:', supabaseAnonKey ? 'Present' : 'Missing')
}

// Export auth helpers with null check
export const auth = supabase?.auth || null

// Export connection test function
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true })
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message)
      return false
    }
    console.log('✅ Supabase connection test successful')
    return true
  } catch (err) {
    console.error('❌ Supabase connection test error:', err)
    return false
  }
}