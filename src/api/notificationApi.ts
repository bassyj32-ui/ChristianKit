import { supabase } from '../utils/supabase';

export interface NotificationPayload {
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
}

export interface UserNotification {
  user_id: string;
  title: string;
  body: string;
  type: 'prayer' | 'bible' | 'meditation' | 'journal' | 'reminder' | 'achievement';
  data?: any;
  scheduled_for?: string;
  sent_at?: string;
}

export class NotificationAPI {
  /**
   * Send notification to a specific user
   */
  static async sendToUser(userId: string, notification: NotificationPayload): Promise<boolean> {
    try {
      // Get user's FCM token
      const { data: tokenData, error: tokenError } = await supabase
        .from('fcm_tokens')
        .select('fcm_token')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (tokenError || !tokenData?.fcm_token) {
        console.warn(`No FCM token found for user ${userId}`);
        return false;
      }

      // Send via Firebase Cloud Messaging
      const response = await fetch('/api/send-fcm-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: tokenData.fcm_token,
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/icon-192x192.png',
            badge: notification.badge || '/icon-72x72.png',
            data: notification.data || {},
            actions: notification.actions || []
          }
        })
      });

      if (response.ok) {
        // Log notification in database
        await this.logNotification(userId, {
          title: notification.title,
          body: notification.body,
          type: 'reminder',
          data: notification.data
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return false;
    }
  }

  /**
   * Send notification to multiple users
   */
  static async sendToUsers(userIds: string[], notification: NotificationPayload): Promise<number> {
    let successCount = 0;
    
    for (const userId of userIds) {
      const success = await this.sendToUser(userId, notification);
      if (success) successCount++;
    }
    
    return successCount;
  }

  /**
   * Send daily reminder to all active users
   */
  static async sendDailyReminder(): Promise<number> {
    try {
      // Get all active users
      const { data: users, error } = await supabase
        .from('user_notification_preferences')
        .select('user_id, preferred_time, reminder_intensity')
        .eq('email_enabled', true)
        .eq('is_active', true);

      if (error || !users) {
        console.error('Error fetching users for daily reminder:', error);
        return 0;
      }

      let successCount = 0;
      const now = new Date();
      const currentHour = now.getHours();

      for (const user of users) {
        // Check if it's time to send reminder for this user
        if (this.shouldSendReminder(user.preferred_time, currentHour)) {
          const message = this.generateReminderMessage(user.reminder_intensity);
          
          const success = await this.sendToUser(user.user_id, {
            title: '🙏 Daily Spiritual Reminder',
            body: message,
            data: {
              type: 'daily_reminder',
              timestamp: now.toISOString()
            }
          });

          if (success) successCount++;
        }
      }

      return successCount;
    } catch (error) {
      console.error('Error sending daily reminders:', error);
      return 0;
    }
  }

  /**
   * Schedule a notification for later
   */
  static async scheduleNotification(userId: string, notification: UserNotification): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scheduled_notifications')
        .insert({
          user_id: userId,
          title: notification.title,
          body: notification.body,
          type: notification.type,
          data: notification.data,
          scheduled_for: notification.scheduled_for,
          status: 'pending'
        });

      return !error;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  }

  /**
   * Log notification in database
   */
  private static async logNotification(userId: string, notification: Partial<UserNotification>): Promise<void> {
    try {
      await supabase
        .from('user_notifications')
        .insert({
          user_id: userId,
          title: notification.title,
          body: notification.body,
          type: notification.type || 'reminder',
          data: notification.data,
          sent_at: new Date().toISOString(),
          status: 'sent'
        });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Check if reminder should be sent based on user's preferred time
   */
  private static shouldSendReminder(preferredTime: string, currentHour: number): boolean {
    const preferredHour = parseInt(preferredTime);
    return Math.abs(currentHour - preferredHour) <= 1; // Send within 1 hour of preferred time
  }

  /**
   * Generate reminder message based on intensity
   */
  private static generateReminderMessage(intensity: string): string {
    const messages = {
      gentle: 'Take a moment to connect with God today. Your spiritual journey matters.',
      motivating: 'Ready to grow spiritually? Your daily practice awaits!',
      aggressive: 'DON\'T MISS OUT! Your spiritual growth is waiting - start now!'
    };
    
    return messages[intensity as keyof typeof messages] || messages.gentle;
  }

  /**
   * Get user's notification preferences
   */
  static async getUserPreferences(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }
  }

  /**
   * Update user's notification preferences
   */
  static async updateUserPreferences(userId: string, preferences: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }
}










