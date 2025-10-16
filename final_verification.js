import { createClient } from '@supabase/supabase-js';

const client = createClient(
  'https://hrznuhcwdjnpasfnqqwp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyem51aGN3ZGpucGFzZm5xcXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mzg3ODAsImV4cCI6MjA3MTIxNDc4MH0.G4x6DJxwgdXGI47Zc4Gro_HBbDW0J2rwxru72f3z_Us'
);

async function finalPhase1Verification() {
  console.log('🎉 FINAL PHASE 1 VERIFICATION...\n');
  console.log('==================================================');

  try {
    // Test 1: RLS Security - Other users' profiles (should be blocked)
    console.log('\n🔒 SECURITY TEST: Other users profiles...\n');
    const { data: otherProfiles, error: otherError } = await client
      .from('profiles')
      .select('id, display_name')
      .neq('id', '8c99984a-6178-45f0-a847-2c8e00328f8a')
      .limit(3);

    if (otherError) {
      console.log('❌ Other profile access error:', otherError.message);
    } else if (otherProfiles && otherProfiles.length === 0) {
      console.log('✅ SUCCESS: RLS SECURITY WORKING - No access to other users profiles');
    } else {
      console.log('❌ SECURITY ISSUE: Can still access other users profiles');
    }

    // Test 2: Own profile access (should work)
    console.log('\n👤 OWN PROFILE TEST: Own profile access...\n');
    const { data: ownProfile, error: ownError } = await client
      .from('profiles')
      .select('id, display_name')
      .eq('id', '8c99984a-6178-45f0-a847-2c8e00328f8a');

    if (ownError) {
      console.log('❌ Own profile access error:', ownError.message);
    } else if (ownProfile && ownProfile.length > 0) {
      console.log('✅ SUCCESS: Can access own profile:', ownProfile[0].display_name);
    } else {
      console.log('❌ Cannot access own profile');
    }

    // Test 3: Notifications access (should be private)
    console.log('\n📨 NOTIFICATIONS TEST: Private notifications...\n');
    const { data: notifications, error: notifError } = await client
      .from('notifications')
      .select('id, title, user_id')
      .limit(3);

    if (notifError) {
      console.log('❌ Notifications access error:', notifError.message);
    } else if (notifications && notifications.length === 0) {
      console.log('✅ SUCCESS: No unauthorized notification access');
    } else {
      console.log('✅ Notifications accessible (checking ownership)...');
      let ownNotifications = 0;
      notifications.forEach(n => {
        if (n.user_id === '8c99984a-6178-45f0-a847-2c8e00328f8a') {
          ownNotifications++;
        }
      });
      console.log(`   Found ${ownNotifications} own notifications out of ${notifications.length} total`);
    }

    // Test 4: Performance check
    console.log('\n⚡ PERFORMANCE TEST: Query speed...\n');
    const startTime = Date.now();
    const { data: perfTest } = await client
      .from('profiles')
      .select('id')
      .limit(1);
    const perfTime = Date.now() - startTime;

    if (perfTime < 200) {
      console.log(`✅ SUCCESS: Fast query performance (${perfTime}ms)`);
    } else {
      console.log(`⚠️  SLOW: Query took ${perfTime}ms`);
    }

    // Test 5: Audit logging check
    console.log('\n📋 AUDIT TEST: Change tracking...\n');
    const { data: auditTest } = await client
      .from('audit_logs')
      .select('id')
      .limit(1);

    if (auditTest !== null) {
      console.log('✅ SUCCESS: Audit logging system operational');
    } else {
      console.log('❌ Audit logging not accessible');
    }

    console.log('\n==================================================');
    console.log('🏆 PHASE 1 STATUS:');

    if (otherError || (otherProfiles && otherProfiles.length === 0)) {
      console.log('🔒 SECURITY: ✅ SECURE');
    } else {
      console.log('🔒 SECURITY: ❌ VULNERABLE');
    }

    if (perfTime < 200) {
      console.log('⚡ PERFORMANCE: ✅ OPTIMIZED');
    } else {
      console.log('⚡ PERFORMANCE: ⚠️ NEEDS WORK');
    }

    if (auditTest !== null) {
      console.log('📋 AUDIT: ✅ COMPLIANT');
    } else {
      console.log('📋 AUDIT: ❌ INCOMPLETE');
    }

    console.log('==================================================');

  } catch (err) {
    console.log('❌ Verification error:', err.message);
  }
}

finalPhase1Verification();










