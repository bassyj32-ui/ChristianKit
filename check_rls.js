import { createClient } from '@supabase/supabase-js';

const client = createClient(
  'https://hrznuhcwdjnpasfnqqwp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyem51aGN3ZGpucGFzZm5xcXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mzg3ODAsImV4cCI6MjA3MTIxNDc4MH0.G4x6DJxwgdXGI47Zc4Gro_HBbDW0J2rwxru72f3z_Us'
);

async function checkRLS() {
  console.log('🔍 Checking current RLS status...\n');

  try {
    // Check if RLS is enabled on each table
    const tables = ['users', 'profiles', 'posts', 'followers', 'notifications'];

    for (const table of tables) {
      // Simple check - try to access a table that requires auth
      const { data, error } = await client
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.message.includes('permission denied')) {
        console.log(`✅ ${table}: RLS ENABLED (access denied without auth)`);
      } else if (error) {
        console.log(`❌ ${table}: RLS DISABLED or other error: ${error.message}`);
      } else {
        console.log(`⚠️ ${table}: RLS status unclear (data accessible)`);
      }
    }

    console.log('\n📋 Checking for existing policies...\n');

    // Check if we can query system tables (requires admin access)
    try {
      const { data: policies, error: policiesError } = await client
        .rpc('get_policies_info');

      if (policiesError) {
        console.log(`❌ Cannot check policies: ${policiesError.message}`);
      } else if (policies && policies.length > 0) {
        console.log('📜 Found RLS policies:');
        policies.forEach(policy => {
          console.log(`   - ${policy.tablename}: ${policy.policyname}`);
        });
      } else {
        console.log('📭 No RLS policies found');
      }
    } catch (err) {
      console.log('❌ Cannot access policy information');
    }

  } catch (err) {
    console.log('❌ Connection error:', err.message);
  }
}

checkRLS();










