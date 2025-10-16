import { createClient } from '@supabase/supabase-js';

const client = createClient(
  'https://hrznuhcwdjnpasfnqqwp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyem51aGN3ZGpucGFzZm5xcXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2Mzg3ODAsImV4cCI6MjA3MTIxNDc4MH0.G4x6DJxwgdXGI47Zc4Gro_HBbDW0J2rwxru72f3z_Us'
);

async function checkAllTablesAfterFix() {
  console.log('🔍 Checking all tables after schema fix...\n');

  try {
    const tables = ['profiles', 'posts', 'user_follows', 'notifications'];

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
          console.log(`✅ ${tableName} columns: ${Object.keys(data[0]).length} columns`);
          console.log(`   Columns: [${Object.keys(data[0]).join(', ')}]`);

          // Check for user_id column specifically
          if (data[0].user_id !== undefined) {
            console.log(`   ✅ Has user_id column`);
          } else {
            console.log(`   ⚠️ No user_id column found`);
          }
          console.log('');
        } else {
          console.log(`⚠️ ${tableName} exists but no data found`);
        }
      } catch (err) {
        console.log(`❌ Cannot access ${tableName}: ${err.message}`);
      }
    }

    // Test if we can insert into notifications table
    console.log('🧪 Testing notifications insert...');
    try {
      const testNotification = {
        user_id: '8c99984a-6178-45f0-a847-2c8e00328f8a', // Using your existing profile ID
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test notification'
      };

      const { data, error } = await client
        .from('notifications')
        .insert(testNotification)
        .select();

      if (error) {
        console.log(`❌ Insert error: ${error.message}`);
      } else {
        console.log(`✅ Successfully inserted test notification`);
        console.log(`   Inserted ID: ${data[0].id}`);
      }
    } catch (err) {
      console.log(`❌ Insert test error: ${err.message}`);
    }

  } catch (err) {
    console.log('❌ General error:', err.message);
  }
}

checkAllTablesAfterFix();










