import { createClient } from '@supabase/supabase-js';

// Test database utilities for E2E testing
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

const testSupabase = createClient(supabaseUrl, supabaseServiceKey);

export interface TestUser {
  id: string;
  email: string;
  preferences: {
    push_enabled: boolean;
    email_enabled: boolean;
    preferred_time: string;
    timezone: string;
  };
}

export interface TestNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
}

/**
 * Set up clean test database state
 */
export async function setupTestDatabase(): Promise<void> {
  try {
    // Clean up existing test data
    await cleanupTestData();

    // Create test user
    const testUser = await createTestUser();

    // Set up test notification preferences
    await createTestNotificationPreferences(testUser.id);

    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

/**
 * Clean up test data
 */
export async function cleanupTestData(): Promise<void> {
  try {
    // Delete test notifications
    await testSupabase
      .from('user_notifications')
      .delete()
      .like('user_id', 'test-%');

    // Delete test push subscriptions
    await testSupabase
      .from('push_subscriptions')
      .delete()
      .like('user_id', 'test-%');

    // Delete test notification preferences
    await testSupabase
      .from('user_notification_preferences')
      .delete()
      .like('user_id', 'test-%');

    console.log('✅ Test data cleanup complete');
  } catch (error) {
    console.error('❌ Test data cleanup failed:', error);
    throw error;
  }
}

/**
 * Create a test user for E2E testing
 */
export async function createTestUser(): Promise<TestUser> {
  const testUserId = `test-user-${Date.now()}`;
  const testEmail = `test-${Date.now()}@example.com`;

  const testUser: TestUser = {
    id: testUserId,
    email: testEmail,
    preferences: {
      push_enabled: true,
      email_enabled: true,
      preferred_time: '09:00',
      timezone: 'UTC',
    },
  };

  // Insert test user profile
  await testSupabase
    .from('profiles')
    .upsert({
      id: testUserId,
      email: testEmail,
      display_name: 'Test User',
      experience_level: 'beginner',
    });

  return testUser;
}

/**
 * Create test notification preferences
 */
export async function createTestNotificationPreferences(userId: string): Promise<void> {
  await testSupabase
    .from('user_notification_preferences')
    .upsert({
      user_id: userId,
      email_enabled: true,
      push_enabled: true,
      prayer_reminders: true,
      community_updates: true,
      daily_motivation: true,
      weekly_progress: false,
      bible_study: true,
      preferred_time: '09:00:00',
      reminder_intensity: 'gentle',
      timezone: 'UTC',
      is_active: true,
    });
}

/**
 * Create a test notification
 */
export async function createTestNotification(
  userId: string,
  overrides: Partial<TestNotification> = {}
): Promise<TestNotification> {
  const notification: TestNotification = {
    id: `test-notification-${Date.now()}`,
    user_id: userId,
    type: 'test',
    title: 'Test Notification',
    message: 'This is a test notification',
    read: false,
    ...overrides,
  };

  await testSupabase
    .from('user_notifications')
    .insert({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      status: 'sent',
      delivery_method: 'push',
    });

  return notification;
}

/**
 * Get test notifications for a user
 */
export async function getTestNotifications(userId: string): Promise<TestNotification[]> {
  const { data, error } = await testSupabase
    .from('user_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Mark test notification as read
 */
export async function markTestNotificationAsRead(notificationId: string): Promise<void> {
  await testSupabase
    .from('user_notifications')
    .update({
      read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);
}

/**
 * Create test push subscription
 */
export async function createTestPushSubscription(userId: string): Promise<void> {
  await testSupabase
    .from('push_subscriptions')
    .insert({
      user_id: userId,
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
      p256dh: 'test-p256dh-key-for-testing',
      auth: 'test-auth-key-for-testing',
      is_active: true,
    });
}

/**
 * Wait for database operation to complete
 */
export async function waitForDatabaseOperation(timeout: number = 5000): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}

/**
 * Verify notification system health
 */
export async function verifyNotificationSystemHealth(): Promise<boolean> {
  try {
    // Check if core tables exist and are accessible
    const { data: tables } = await testSupabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', [
        'user_notifications',
        'user_notification_preferences',
        'push_subscriptions',
        'fcm_tokens'
      ]);

    const expectedTables = [
      'user_notifications',
      'user_notification_preferences',
      'push_subscriptions'
    ];

    const existingTables = tables?.map(t => t.table_name) || [];

    for (const table of expectedTables) {
      if (!existingTables.includes(table)) {
        throw new Error(`Required table ${table} does not exist`);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Notification system health check failed:', error);
    return false;
  }
}
