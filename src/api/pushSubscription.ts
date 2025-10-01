import { supabase } from '../utils/supabase';

/**
 * Save push subscription to database
 */
export const savePushSubscription = async (userId: string, subscription: PushSubscriptionJSON) => {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        subscription: subscription,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return false;
  }
};

/**
 * Send push notification to user
 */
export const sendPushNotification = async (userId: string, title: string, body: string, data?: any) => {
  try {
    // Get user's push subscription
    const { data: subData, error: subError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single();

    if (subError || !subData) {
      console.warn('No push subscription found for user:', userId);
      return false;
    }

    // Use web-push library or service to send notification
    // For demo, we'll log it
    console.log('Sending push notification:', { userId, title, body, data });

    // In a real app, integrate with web-push or FCM
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};




