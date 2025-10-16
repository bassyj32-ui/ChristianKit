import { createClient } from '@supabase/supabase-js';

const client = createClient(
  'https://hrznuhcwdjnpasfnqqwp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyem51aGN3ZGpucGFzZm5xcXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mzg3ODAsImV4cCI6MjA3MTIxNDc4MH0.G4x6DJxwgdXGI47Zc4Gro_HBbDW0J2rwxru72f3z_Us'
);

async function diagnoseIssues() {
  console.log('🔍 DIAGNOSING PHASE 1 ISSUES...\n');

  try {
    // Check RLS status
    console.log('1. Checking RLS status...\n');
    const { data: rlsTables, error: rlsError } = await client
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .in('tablename', ['profiles', 'posts', 'user_follows', 'notifications']);

    if (rlsError) {
      console.log('❌ RLS Error:', rlsError.message);
    } else if (rlsTables) {
      console.log('RLS Status:');
      rlsTables.forEach(table => {
        console.log(`  ${table.tablename}: ${table.rowsecurity ? '✅ ENABLED' : '❌ DISABLED'}`);
      });
    }

    // Check policies
    console.log('\n2. Checking RLS policies...\n');
    try {
      const { data: policies, error: policiesError } = await client
        .from('pg_policies')
        .select('tablename, policyname');

      if (policiesError) {
        console.log('❌ Policies Error:', policiesError.message);
      } else if (policies) {
        console.log('Found policies:');
        policies.forEach(policy => {
          console.log(`  ${policy.tablename}: ${policy.policyname}`);
        });
      } else {
        console.log('❌ No policies found');
      }
    } catch (err) {
      console.log('❌ Cannot check policies:', err.message);
    }

    // Check audit triggers
    console.log('\n3. Checking audit triggers...\n');
    try {
      const { data: triggers, error: triggersError } = await client
        .from('information_schema.triggers')
        .select('trigger_name, event_manipulation')
        .like('trigger_name', 'audit_%');

      if (triggersError) {
        console.log('❌ Triggers Error:', triggersError.message);
      } else if (triggers) {
        console.log('Found audit triggers:');
        triggers.forEach(trigger => {
          console.log(`  ${trigger.trigger_name}: ${trigger.event_manipulation}`);
        });
      } else {
        console.log('❌ No audit triggers found');
      }
    } catch (err) {
      console.log('❌ Cannot check triggers:', err.message);
    }

    // Test a simple profile access
    console.log('\n4. Testing profile access...\n');
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('id, display_name')
      .limit(1);

    if (profileError) {
      console.log('❌ Profile access error:', profileError.message);
    } else if (profile && profile.length > 0) {
      console.log('✅ Profile accessible:', profile[0]);
      console.log('⚠️  This suggests RLS policies may not be working correctly');
    } else {
      console.log('✅ No profile data accessible (good for security)');
    }

  } catch (err) {
    console.log('❌ General error:', err.message);
  }
}

diagnoseIssues();










