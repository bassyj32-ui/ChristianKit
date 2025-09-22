#!/usr/bin/env node

/**
 * Test Notification System Script
 * 
 * This script helps test the notification system by:
 * 1. Checking database tables exist
 * 2. Testing Edge Functions
 * 3. Verifying user setup
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testNotificationSystem() {
  console.log('🧪 Testing ChristianKit Notification System...\n');

  // Test 1: Check database tables
  await testDatabaseTables();

  // Test 2: Check Edge Functions
  await testEdgeFunctions();

  // Test 3: Check environment variables
  await testEnvironmentVariables();

  console.log('\n✅ Notification system test completed!');
}

async function testDatabaseTables() {
  console.log('📊 Testing Database Tables...');

  const tables = [
    'user_notification_preferences',
    'user_profiles',
    'push_subscriptions',
    'user_notifications',
    'prayer_reminders'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.error(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: OK`);
      }
    } catch (err) {
      console.error(`❌ Table ${table}: ${err.message}`);
    }
  }
}

async function testEdgeFunctions() {
  console.log('\n🔧 Testing Edge Functions...');

  const functions = [
    'daily-notifications',
    'send-push-notification'
  ];

  for (const func of functions) {
    try {
      const { data, error } = await supabase.functions.invoke(func, {
        body: { test: true }
      });

      if (error) {
        console.error(`❌ Function ${func}: ${error.message}`);
      } else {
        console.log(`✅ Function ${func}: OK`);
      }
    } catch (err) {
      console.error(`❌ Function ${func}: ${err.message}`);
    }
  }
}

async function testEnvironmentVariables() {
  console.log('\n🔑 Testing Environment Variables...');

  const requiredVars = [
    'VITE_VAPID_PUBLIC_KEY',
    'VITE_VAPID_PRIVATE_KEY',
    'BREVO_API_KEY'
  ];

  const optionalVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value && value !== `your_${varName.toLowerCase()}_here`) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`❌ ${varName}: Missing or not configured`);
    }
  }

  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`⚠️  ${varName}: Missing`);
    }
  }
}

// Run the test
testNotificationSystem().catch(console.error);
