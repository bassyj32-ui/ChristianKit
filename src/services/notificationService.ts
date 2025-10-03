import { supabase } from '../utils/supabase';
import { savePushSubscription } from '../api/pushSubscription';
import { logger, logNotificationEvent, logNotificationError } from '../utils/logger';
import { metrics, recordNotificationDelivery, recordNotificationFailure } from '../utils/metrics';
import { notificationCache, cacheUserPreferences, getCachedUserPreferences, cacheUserNotifications, getCachedUserNotifications, invalidateUserCache } from '../utils/cache';
import { withDatabaseRetry, withNotificationRetry } from '../utils/retry';

export interface Notification {
  id: string;
  user_id: string;
  type: 'follow' | 'amen' | 'love' | 'prayer' | 'post_mention' | 'comment';
  title: string;
  message: string;
  data?: {
    actor_id?: string;
    actor_name?: string;
    actor_avatar?: string;
    post_id?: string;
    post_content?: string;
  };
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  follows: boolean;
  interactions: boolean;
  mentions: boolean;
  comments: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

/**
 * Create a new notification
 */
export const createNotification = async (
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  data?: Notification['data']
): Promise<boolean> => {
  const timer = metrics.startTimer('create_notification', userId)

  try {
    logger.debug('Creating notification', { userId, type, title })

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        read: false
      });

    if (error) throw error;

    timer() // Record timing
    logNotificationEvent('created', userId, undefined, { type, title })
    logger.info('Notification created successfully', { userId, type, title })

    return true;
  } catch (error) {
    timer() // Record timing even for failures
    logNotificationError('Failed to create notification', error as Error, userId)
    recordNotificationFailure(type, 'database', (error as Error).message, userId)
    return false;
  }
};

/**
 * Get user notifications with caching
 */
export const getUserNotifications = async (
  userId: string,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<Notification[]> => {
  const cacheKey = `notifications_${userId}_${limit}_${unreadOnly}`

  // Check cache first
  const cached = getCachedUserNotifications(cacheKey)
  if (cached) {
    logger.debug('Returning cached notifications', { userId, limit, unreadOnly })
    return cached
  }

  try {
      const data = await withDatabaseRetry(async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    })

    // Cache the result
    cacheUserNotifications(cacheKey, data)

    logger.debug('Fetched notifications from database', { userId, count: data.length })
    return data;
  } catch (error) {
    logger.error('Error fetching notifications', error as Error, { userId, limit, unreadOnly })
    return [];
  }
};

/**
 * Mark notification as read with cache invalidation
 */
export const markNotificationAsRead = async (notificationId: string, userId?: string): Promise<boolean> => {
  try {
    const result = await withNotificationRetry(async () => {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    }, { userId, notificationId })

    if (result.success && userId) {
      // Invalidate user notification cache since read status changed
      invalidateUserCache(userId)

      logger.info('Notification marked as read', { notificationId, userId })
    }

    return result.success;
  } catch (error) {
    logger.error('Error marking notification as read', error as Error, { notificationId, userId })
    return false;
  }
};

/**
 * Mark all notifications as read for a user with cache invalidation
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  try {
    const result = await withNotificationRetry(async () => {
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return true;
    }, { userId })

    if (result.success) {
      // Invalidate user notification cache since all notifications marked as read
      invalidateUserCache(userId)

      logger.info('All notifications marked as read', { userId })
    }

    return result.success;
  } catch (error) {
    logger.error('Error marking all notifications as read', error as Error, { userId })
    return false;
  }
};

/**
 * Get unread notification count with caching
 */
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  const cacheKey = `unread_count_${userId}`

  // Check cache first (short TTL since this changes frequently)
  const cached = notificationCache.get(cacheKey)
  if (cached && (Date.now() - cached.timestamp) < 30000) { // 30 second cache
    logger.debug('Returning cached unread count', { userId, count: cached.data })
    return cached.data
  }

  try {
    const result = await withDatabaseRetry(async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    })

    // Cache the result
    notificationCache.set(cacheKey, result, 30000) // 30 seconds

    logger.debug('Fetched unread count from database', { userId, count: result })
    return result;
  } catch (error) {
    logger.error('Error getting unread count', error as Error, { userId })
    return 0;
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

/**
 * Create follow notification
 */
export const createFollowNotification = async (
  followerId: string,
  followingId: string,
  followerName: string,
  followerAvatar?: string
): Promise<boolean> => {
  return createNotification(
    followingId,
    'follow',
    'New Follower',
    `${followerName} started following you`,
    {
      actor_id: followerId,
      actor_name: followerName,
      actor_avatar: followerAvatar
    }
  );
};

/**
 * Create interaction notification (amen, love)
 */
export const createInteractionNotification = async (
  postAuthorId: string,
  actorId: string,
  actorName: string,
  postId: string,
  postContent: string,
  interactionType: 'amen' | 'love',
  actorAvatar?: string
): Promise<boolean> => {
  const titles = {
    amen: 'Amen Received',
    love: 'Love Received'
  };

  const messages = {
    amen: `${actorName} said Amen to your post`,
    love: `${actorName} loved your post`
  };

  return createNotification(
    postAuthorId,
    interactionType,
    titles[interactionType],
    messages[interactionType],
    {
      actor_id: actorId,
      actor_name: actorName,
      actor_avatar: actorAvatar,
      post_id: postId,
      post_content: postContent.substring(0, 100)
    }
  );
};

/**
 * Create prayer/comment notification
 */
export const createPrayerNotification = async (
  postAuthorId: string,
  actorId: string,
  actorName: string,
  postId: string,
  postContent: string,
  prayerContent: string,
  actorAvatar?: string
): Promise<boolean> => {
  return createNotification(
    postAuthorId,
    'prayer',
    'Prayer Received',
    `${actorName} prayed for you`,
    {
      actor_id: actorId,
      actor_name: actorName,
      actor_avatar: actorAvatar,
      post_id: postId,
      post_content: postContent.substring(0, 100)
    }
  );
};

/**
 * Get or create user notification preferences
 */
export const getUserNotificationPreferences = async (userId: string): Promise<NotificationPreferences> => {
  try {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Create default preferences if they don't exist
      const defaultPrefs: Omit<NotificationPreferences, 'user_id'> = {
        follows: true,
        interactions: true,
        mentions: true,
        comments: true,
        email_notifications: false,
        push_notifications: true
      };

      const { data: newData, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({ user_id: userId, ...defaultPrefs })
        .select()
        .single();

      if (insertError) throw insertError;
      return { user_id: userId, ...defaultPrefs };
    }

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    // Return default preferences on error
    return {
      user_id: userId,
      follows: true,
      interactions: true,
      mentions: true,
      comments: true,
      email_notifications: false,
      push_notifications: true
    };
  }
};

/**
 * Update user notification preferences
 */
export const updateNotificationPreferences = async (
  userId: string,
  preferences: Partial<Omit<NotificationPreferences, 'user_id'>>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
};

/**
 * Subscribe to real-time notifications
 */
export const subscribeToNotifications = (
  userId: string,
  onNotification: (notification: Notification) => void
) => {
  const subscription = supabase
    .channel('notifications')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onNotification(payload.new as Notification);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
};

/**
 * Subscribe to push notifications
 */
export const subscribeToPushNotifications = async (userId: string) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();

    if (existingSubscription) {
      // Update existing subscription
      await sendSubscriptionToServer(existingSubscription, userId);
      return true;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BEd9I1aA4TrQnASkZfKFKylZuy_-EjSeNwBsD32JvHFrbaZxTbfcPme2KhboVY8QMK47OoYtpus0alGzuJuR-60')
    });

    await sendSubscriptionToServer(subscription, userId);
    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
};

/**
 * Send push subscription to server
 */
const sendSubscriptionToServer = async (subscription: PushSubscription, userId: string) => {
  try {
    await savePushSubscription(userId, subscription.toJSON());
    localStorage.setItem(`pushSubscription_${userId}`, JSON.stringify(subscription.toJSON()));
  } catch (error) {
    console.error('Error sending subscription to server:', error);
  }
};

// Utility function for VAPID key conversion
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Create push_subscriptions table SQL (run this in Supabase SQL Editor)
 */
export const createPushSubscriptionsTableSQL = `
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
`;

