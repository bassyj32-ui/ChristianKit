import { createClient } from '@supabase/supabase-js';

const client = createClient(
  'https://hrznuhcwdjnpasfnqqwp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyem51aGN3ZGpucGFzZm5xcXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mzg3ODAsImV4cCI6MjA3MTIxNDc4MH0.G4x6DJxwgdXGI47Zc4Gro_HBbDW0J2rwxru72f3z_Us'
);

async function checkAllTables() {
  console.log('🔍 Checking all tables and their columns...\n');

  try {
    // List of all tables we know exist
    const tables = [
      'users',
      'profiles',
      'posts',
      'followers',
      'notifications'
    ];

    for (const tableName of tables) {
      console.log(`📋 Checking ${tableName} table...`);

      try {
        const { data, error } = await client
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Error accessing ${tableName}: ${error.message}`);
        } else if (data && data.length > 0) {
          console.log(`✅ ${tableName} columns:`, Object.keys(data[0]));
          console.log(`📝 Sample data keys:`, Object.keys(data[0]));
          console.log('');
        } else {
          console.log(`⚠️ ${tableName} exists but no data found`);
        }
      } catch (err) {
        console.log(`❌ Cannot access ${tableName}: ${err.message}`);
      }
    }

    // Check for any other tables that might exist
    console.log('🔍 Checking for other tables...');
    try {
      // This is a bit of a hack, but we can try to see if there are other tables
      // by attempting to query them with common names
      const possibleTables = [
        'user_profiles', 'accounts', 'account', 'user', 'profile',
        'post', 'following', 'follow', 'notification', 'notif'
      ];

      for (const tableName of possibleTables) {
        try {
          const { data, error } = await client
            .from(tableName)
            .select('*')
            .limit(1);

          if (!error && data) {
            console.log(`❓ Found additional table: ${tableName}`);
            console.log(`   Columns:`, Object.keys(data[0]));
          }
        } catch (err) {
          // Table doesn't exist, continue
        }
      }
    } catch (err) {
      console.log('❌ Error checking other tables');
    }

  } catch (err) {
    console.log('❌ General error:', err.message);
  }
}

checkAllTables();










