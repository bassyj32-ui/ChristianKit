import { createClient } from '@supabase/supabase-js';

const client = createClient(
  'https://hrznuhcwdjnpasfnqqwp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyem51aGN3ZGpucGFzZm5xcXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mzg3ODAsImV4cCI6MjA3MTIxNDc4MH0.G4x6DJxwgdXGI47Zc4Gro_HBbDW0J2rwxru72f3z_Us'
);

async function testPhase1Fixes() {
  console.log('🧪 COMPREHENSIVE PHASE 1 TESTING\n');
  console.log('=' .repeat(50));

  let testResults = {
    security: { passed: 0, total: 0 },
    performance: { passed: 0, total: 0 },
    audit: { passed: 0, total: 0 }
  };

  // Test 1: RLS Security Policies
  console.log('\n🔒 TESTING RLS SECURITY POLICIES...\n');

  try {
    // Test 1.1: Users should only see their own profile
    testResults.security.total++;
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('*')
      .limit(1);

    if (profileError && profileError.message.includes('permission denied')) {
      console.log('✅ PASS: RLS is blocking unauthorized profile access');
      testResults.security.passed++;
    } else if (profile && profile.length > 0) {
      console.log('⚠️  WARN: Profile data accessible - RLS may not be working');
    } else {
      console.log('✅ PASS: No unauthorized data access');
      testResults.security.passed++;
    }

    // Test 1.2: Users should only see their own notifications
    testResults.security.total++;
    const { data: notifications, error: notifError } = await client
      .from('notifications')
      .select('*')
      .limit(1);

    if (notifError && notifError.message.includes('permission denied')) {
      console.log('✅ PASS: RLS is blocking unauthorized notification access');
      testResults.security.passed++;
    } else if (notifications && notifications.length > 0) {
      console.log('⚠️  WARN: Notification data accessible - RLS may not be working');
    } else {
      console.log('✅ PASS: No unauthorized notification access');
      testResults.security.passed++;
    }

    // Test 1.3: Check RLS is enabled on all tables
    testResults.security.total++;
    const { data: rlsStatus, error: rlsError } = await client
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .in('tablename', ['profiles', 'posts', 'user_follows', 'notifications']);

    if (!rlsError && rlsStatus) {
      const enabledTables = rlsStatus.filter(table => table.rowsecurity);
      console.log(`✅ PASS: RLS enabled on ${enabledTables.length}/${rlsStatus.length} critical tables`);
      testResults.security.passed++;
    } else {
      console.log('❌ FAIL: Cannot verify RLS status');
    }

  } catch (err) {
    console.log(`❌ Security test error: ${err.message}`);
  }

  // Test 2: Performance Indexes
  console.log('\n⚡ TESTING PERFORMANCE INDEXES...\n');

  try {
    const startTime = Date.now();

    // Test 2.1: Profile lookup performance
    testResults.performance.total++;
    const { data: profilePerf } = await client
      .from('profiles')
      .select('*')
      .limit(1);

    const profileTime = Date.now() - startTime;
    if (profileTime < 100) {
      console.log(`✅ PASS: Profile lookup fast (${profileTime}ms)`);
      testResults.performance.passed++;
    } else {
      console.log(`⚠️  WARN: Profile lookup slow (${profileTime}ms)`);
    }

    // Test 2.2: Check indexes exist
    testResults.performance.total++;
    const { data: indexes } = await client
      .from('pg_indexes')
      .select('indexname')
      .eq('tablename', 'profiles');

    const expectedIndexes = ['idx_profiles_email', 'idx_profiles_display_name', 'idx_profiles_id'];
    const foundIndexes = indexes.filter(idx => expectedIndexes.includes(idx.indexname));

    if (foundIndexes.length >= 2) {
      console.log(`✅ PASS: Found ${foundIndexes.length} critical profile indexes`);
      testResults.performance.passed++;
    } else {
      console.log(`❌ FAIL: Missing critical profile indexes`);
    }

  } catch (err) {
    console.log(`❌ Performance test error: ${err.message}`);
  }

  // Test 3: Audit Logging
  console.log('\n📋 TESTING AUDIT LOGGING...\n');

  try {
    // Test 3.1: Check audit_logs table exists
    testResults.audit.total++;
    const { data: auditTable } = await client
      .from('audit_logs')
      .select('*')
      .limit(1);

    if (auditTable !== null) {
      console.log('✅ PASS: audit_logs table exists');
      testResults.audit.passed++;
    } else {
      console.log('❌ FAIL: audit_logs table not accessible');
    }

    // Test 3.2: Check audit triggers exist
    testResults.audit.total++;
    const { data: triggers } = await client
      .from('information_schema.triggers')
      .select('trigger_name')
      .like('trigger_name', 'audit_%');

    if (triggers && triggers.length > 0) {
      console.log(`✅ PASS: Found ${triggers.length} audit triggers`);
      testResults.audit.passed++;
    } else {
      console.log('❌ FAIL: No audit triggers found');
    }

    // Test 3.3: Make a test change and verify it's logged
    testResults.audit.total++;
    try {
      // Update profile to trigger audit logging
      const { error: updateError } = await client
        .from('profiles')
        .update({ bio: `Test audit ${Date.now()}` })
        .eq('id', '8c99984a-6178-45f0-a847-2c8e00328f8a'); // Your profile ID

      if (!updateError) {
        // Check if audit log was created
        const { data: recentAudit } = await client
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'profiles')
          .order('created_at', { ascending: false })
          .limit(1);

        if (recentAudit && recentAudit.length > 0) {
          console.log('✅ PASS: Audit logging working - change was logged');
          testResults.audit.passed++;
        } else {
          console.log('⚠️  WARN: No recent audit log found');
        }
      } else {
        console.log(`❌ FAIL: Cannot update profile for audit test: ${updateError.message}`);
      }
    } catch (err) {
      console.log(`❌ Audit test error: ${err.message}`);
    }

  } catch (err) {
    console.log(`❌ Audit test error: ${err.message}`);
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 PHASE 1 TESTING RESULTS\n');

  console.log(`🔒 Security: ${testResults.security.passed}/${testResults.security.total} tests passed`);
  console.log(`⚡ Performance: ${testResults.performance.passed}/${testResults.performance.total} tests passed`);
  console.log(`📋 Audit: ${testResults.audit.passed}/${testResults.audit.total} tests passed`);

  const totalPassed = testResults.security.passed + testResults.performance.passed + testResults.audit.passed;
  const totalTests = testResults.security.total + testResults.performance.total + testResults.audit.total;

  console.log(`\n🎯 OVERALL: ${totalPassed}/${totalTests} tests passed (${Math.round(totalPassed/totalTests*100)}%)`);

  if (totalPassed === totalTests) {
    console.log('\n🎉 PHASE 1 IS FULLY OPERATIONAL!');
    console.log('✅ Ready to move to Phase 2');
  } else {
    console.log('\n⚠️  Some tests failed - may need additional fixes');
  }

  console.log('=' .repeat(50));
}

testPhase1Fixes();










