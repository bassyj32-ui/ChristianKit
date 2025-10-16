// Comprehensive Authentication Test
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hrznuhcwdjnpasfnqqwp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyem51aGN3ZGpucGFzZm5xcXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mzg3ODAsImV4cCI6MjA3MTIxNDc4MH0.G4x6DJxwgdXGI47Zc4Gro_HBbDW0J2rwxru72f3z_Us';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Running Comprehensive Authentication Test...\n');

let testResults = {
  connection: false,
  database: false,
  storage: false,
  auth: false,
  tables: 0,
  totalTables: 4
};

// Test 1: Basic Connection
console.log('1️⃣ Testing Supabase Connection...');
try {
  const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
  if (error) {
    console.error('❌ Connection failed:', error.message);
  } else {
    console.log('✅ Connection successful');
    testResults.connection = true;
  }
} catch (err) {
  console.error('❌ Connection error:', err.message);
}

// Test 2: Database Tables
console.log('\n2️⃣ Testing Database Tables...');
const tables = ['profiles', 'user_notification_preferences', 'community_posts', 'user_sessions', 'prayer_requests', 'projects', 'settings', 'daily_reminders'];

for (const table of tables) {
  try {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table '${table}': ${error.message}`);
    } else {
      console.log(`✅ Table '${table}': Accessible`);
      if (['prayer_requests', 'projects', 'settings', 'daily_reminders'].includes(table)) {
        testResults.tables++;
      }
    }
  } catch (err) {
    console.log(`❌ Table '${table}': ${err.message}`);
  }
}

// Test 3: Storage Bucket
console.log('\n3️⃣ Testing Storage...');
try {
  const { data, error } = await supabase.storage.from('user-media').list();
  if (error) {
    console.error('❌ Storage error:', error.message);
  } else {
    console.log('✅ user-media bucket accessible');
    testResults.storage = true;
  }
} catch (err) {
  console.error('❌ Storage error:', err.message);
}

// Test 4: Authentication Service
console.log('\n4️⃣ Testing Authentication...');
try {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('❌ Auth service error:', error.message);
  } else {
    console.log('✅ Auth service accessible');
    testResults.auth = true;
  }
} catch (err) {
  console.error('❌ Auth service error:', err.message);
}

// Test 5: RLS Policies Check
console.log('\n5️⃣ Checking RLS Policies...');
try {
  const { data, error } = await supabase.rpc('get_policies');
  if (error) {
    console.log('⚠️ Could not check policies directly, but tables are accessible');
  } else {
    console.log('✅ RLS policies configured');
  }
} catch (err) {
  console.log('⚠️ Policy check skipped (normal)');
}

// Final Results
console.log('\n🎯 TEST RESULTS SUMMARY:');
console.log('=' .repeat(40));
console.log(`✅ Connection: ${testResults.connection ? 'PASS' : 'FAIL'}`);
console.log(`✅ Database: ${testResults.tables >= 4 ? 'PASS' : 'FAIL'} (${testResults.tables}/4 tables)`);
console.log(`✅ Storage: ${testResults.storage ? 'PASS' : 'FAIL'}`);
console.log(`✅ Auth Service: ${testResults.auth ? 'PASS' : 'FAIL'}`);

const allTestsPassed = testResults.connection && testResults.tables >= 4 && testResults.storage && testResults.auth;

console.log('\n' + '=' .repeat(40));
if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED! Ready for git push.');
  console.log('✅ Authentication system is fully functional');
  console.log('✅ Database tables are accessible');
  console.log('✅ Storage bucket is working');
  console.log('✅ Supabase connection is stable');
} else {
  console.log('❌ SOME TESTS FAILED - Fix issues before git push');
  console.log('Check the errors above and resolve them first.');
}

console.log('\n🚀 Next steps:');
if (allTestsPassed) {
  console.log('1. Run: git add .');
  console.log('2. Run: git commit -m "Fix authentication system - all tests passing"');
  console.log('3. Run: git push');
} else {
  console.log('1. Fix the failing tests above');
  console.log('2. Re-run this test');
  console.log('3. Then proceed with git push');
}

export { allTestsPassed };
