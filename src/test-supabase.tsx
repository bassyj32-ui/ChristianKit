import { supabase } from './utils/supabase'

export async function testSupabaseConnection() {
  try {
    // Test the connection
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Supabase Error:', error.message)
      return false
    }
    
    console.log('✅ Supabase Connected Successfully!')
    console.log('📊 Data:', data)
    return true
    
  } catch (err) {
    console.log('❌ Connection Failed:', err)
    return false
  }
}