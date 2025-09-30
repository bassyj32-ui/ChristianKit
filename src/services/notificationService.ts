import { supabase } from '../utils/supabase';
import { savePushSubscription } from '../api/pushSubscription';

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
  try {
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
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

/**
 * Get user notifications
 */
export const getUserNotifications = async (
  userId: string,
  limit: number = 20,
  unreadOnly: boolean = false
): Promise<Notification[]> => {
  try {
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
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
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
  subscription JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
`;

