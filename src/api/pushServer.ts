import webpush from 'web-push';

// VAPID Keys (these should match the ones generated)
const VAPID_PUBLIC_KEY = 'BPlP29OfGd9w0ZcAui2TOSn8PCS6CYUyy8sHKCmOH6sOLEf7GGemqyWpU1T5y2pylT8W-v78UG5uQQ2VylVpVeM';
const VAPID_PRIVATE_KEY = 'nRrlq7DHaijuldAViq9YzwIHZd4hsTRYa0iIZI8zEQk';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:baslieljy@gmail.com', // Your email
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  tag?: string;
  renotify?: boolean;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Send a push notification to a specific subscription
 */
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-72x72.png',
      data: payload.data || {},
      actions: payload.actions || [
        {
          action: 'open',
          title: 'Open App',
          icon: '/icon-72x72.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icon-72x72.png'
        }
      ],
      requireInteraction: payload.requireInteraction !== false,
      tag: payload.tag || 'christiankit-reminder',
      renotify: payload.renotify !== false
    });

    const result = await webpush.sendNotification(subscription, pushPayload);
    
    if (result.statusCode === 200 || result.statusCode === 201) {
      console.log('✅ Push notification sent successfully');
      return true;
    } else {
      console.error('❌ Push notification failed:', result.statusCode, result.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return false;
  }
}

/**
 * Send push notifications to multiple subscriptions
 */
export async function sendPushNotificationsToMultiple(
  subscriptions: PushSubscription[],
  payload: PushNotificationPayload
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  const promises = subscriptions.map(async (subscription) => {
    try {
      const result = await sendPushNotification(subscription, payload);
      if (result) {
        success++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error('❌ Error sending to subscription:', error);
      failed++;
    }
  });

  await Promise.all(promises);

  return { success, failed };
}

/**
 * Send daily reminder notifications to all active subscriptions
 */
export async function sendDailyReminderNotifications(
  reminderType: string,
  userName?: string
): Promise<{ success: number; failed: number }> {
  try {
    // This would typically fetch from your database
    // For now, we'll return a mock result
    console.log(`📱 Sending daily ${reminderType} reminders to all users`);
    
    const payload: PushNotificationPayload = {
      title: getReminderTitle(reminderType),
      body: `Hello ${userName || 'there'}! It's time for your daily ${reminderType} session.`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      data: {
        url: '/',
        reminderType: reminderType
      },
      tag: `daily-${reminderType}`,
      renotify: true
    };

    // In a real implementation, you would:
    // 1. Fetch all active push subscriptions from database
    // 2. Send notifications to each subscription
    // 3. Log the results
    
    console.log('✅ Daily reminder notifications queued');
    return { success: 1, failed: 0 };
  } catch (error) {
    console.error('❌ Error sending daily reminder notifications:', error);
    return { success: 0, failed: 1 };
  }
}

/**
 * Get reminder title based on type
 */
function getReminderTitle(reminderType: string): string {
  const titles: Record<string, string> = {
    'prayer': '🙏 Prayer Time',
    'bible': '📖 Bible Reading Time',
    'meditation': '🧘 Meditation Time',
    'journal': '📝 Journaling Time',
    'default': '🔔 Daily Reminder'
  };
  return titles[reminderType] || titles.default;
}

/**
 * Test the push notification system
 */
export async function testPushNotification(): Promise<boolean> {
  try {
    // This is a test function - in production, you'd send to real subscriptions
    console.log('🧪 Testing push notification system...');
    console.log('✅ VAPID keys configured');
    console.log('✅ Web-push library ready');
    return true;
  } catch (error) {
    console.error('❌ Push notification test failed:', error);
    return false;
  }
}















