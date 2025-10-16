import { createClient } from '@supabase/supabase-js';

const client = createClient(
  'https://hrznuhcwdjnpasfnqqwp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyem51aGN3ZGpucGFzZm5xcXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mzg3ODAsImV4cCI6MjA3MTIxNDc4MH0.G4x6DJxwgdXGI47Zc4Gro_HBbDW0J2rwxru72f3z_Us'
);

async function analyzeSchema() {
  console.log('🔍 Analyzing actual database schema...\n');

  try {
    const tables = ['users', 'profiles', 'posts', 'followers', 'notifications'];

    for (const tableName of tables) {
      console.log(`📋 Checking ${tableName} table structure...`);

      // Try to get table info by querying it
      try {
        const { data, error } = await client
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Error accessing ${tableName}: ${error.message}`);
        } else if (data && data.length > 0) {
          console.log(`✅ ${tableName} columns:`, Object.keys(data[0]));
          console.log(`📝 Sample data:`, data[0]);
        } else {
          console.log(`⚠️ ${tableName} exists but no data found`);
        }
      } catch (err) {
        console.log(`❌ Cannot access ${tableName}: ${err.message}`);
      }

      console.log(''); // Empty line for readability
    }

    // Check auth.users table structure
    console.log('🔐 Checking auth.users table...');
    try {
      const { data, error } = await client.auth.getUser();
      if (error) {
        console.log(`❌ Cannot access auth info: ${error.message}`);
      } else {
        console.log('✅ Auth user accessible');
      }
    } catch (err) {
      console.log(`❌ Auth error: ${err.message}`);
    }

  } catch (err) {
    console.log('❌ General error:', err.message);
  }
}

analyzeSchema();










