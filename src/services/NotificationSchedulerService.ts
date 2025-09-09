import { supabase } from '../utils/supabase';
import ProgressService from './ProgressService';

export interface NotificationSchedule {
  id: string;
  user_id: string;
  type: 'daily' | 'weekly' | 'streak' | 'progress';
  scheduled_time: string;
  message: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

export interface UserNotificationPreferences {
  user_id: string;
  preferred_time: string; // HH:MM format
  timezone: string;
  daily_reminders: boolean;
  progress_updates: boolean;
  streak_notifications: boolean;
  weekly_summaries: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

class NotificationSchedulerService {
  private static instance: NotificationSchedulerService;
  private schedules: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  static getInstance(): NotificationSchedulerService {
    if (!NotificationSchedulerService.instance) {
      NotificationSchedulerService.instance = new NotificationSchedulerService();
    }
    return NotificationSchedulerService.instance;
  }

  /**
   * Initialize the notification scheduler
   */
  async initialize(userId: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔔 NotificationScheduler: Initializing for user:', userId);

      // Load user preferences
      const preferences = await this.getUserPreferences(userId);

      if (preferences) {
        // Schedule notifications based on preferences
        await this.scheduleUserNotifications(userId, preferences);
        this.isInitialized = true;
        console.log('✅ NotificationScheduler: Initialized successfully');
      }
    } catch (error) {
      console.error('❌ NotificationScheduler: Failed to initialize:', error);
    }
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(userId: string): Promise<UserNotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error fetching notification preferences:', error);
        return null;
      }

      return data || {
        user_id: userId,
        preferred_time: '09:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        daily_reminders: true,
        progress_updates: true,
        streak_notifications: true,
        weekly_summaries: true,
        email_notifications: false,
        push_notifications: true
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  /**
   * Schedule all notifications for a user
   */
  private async scheduleUserNotifications(userId: string, preferences: UserNotificationPreferences): Promise<void> {
    // Clear existing schedules for this user
    this.clearUserSchedules(userId);

    if (!preferences.push_notifications) {
      console.log('🔔 NotificationScheduler: Push notifications disabled for user');
      return;
    }

    // Schedule daily reminder
    if (preferences.daily_reminders) {
      this.scheduleDailyReminder(userId, preferences);
    }

    // Schedule progress updates
    if (preferences.progress_updates) {
      this.scheduleProgressUpdates(userId, preferences);
    }

    // Schedule streak notifications
    if (preferences.streak_notifications) {
      this.scheduleStreakNotifications(userId, preferences);
    }

    // Schedule weekly summary
    if (preferences.weekly_summaries) {
      this.scheduleWeeklySummary(userId, preferences);
    }
  }

  /**
   * Schedule daily prayer reminder
   */
  private scheduleDailyReminder(userId: string, preferences: UserNotificationPreferences): void {
    const [hours, minutes] = preferences.preferred_time.split(':').map(Number);
    const now = new Date();
    const reminderTime = new Date();

    reminderTime.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (now > reminderTime) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    console.log(`⏰ Scheduling daily reminder for ${reminderTime.toLocaleString()} (${Math.round(timeUntilReminder / 1000 / 60)} minutes from now)`);

    const timeoutId = setTimeout(async () => {
      await this.sendDailyReminder(userId);
      // Schedule next day's reminder
      this.scheduleDailyReminder(userId, preferences);
    }, timeUntilReminder);

    this.schedules.set(`${userId}-daily`, timeoutId);
  }

  /**
   * Schedule progress update notifications
   */
  private scheduleProgressUpdates(userId: string, preferences: UserNotificationPreferences): void {
    // Send progress updates every 3 days
    const intervalMs = 3 * 24 * 60 * 60 * 1000; // 3 days

    const timeoutId = setInterval(async () => {
      await this.sendProgressUpdate(userId);
    }, intervalMs);

    this.schedules.set(`${userId}-progress`, timeoutId);
  }

  /**
   * Schedule streak milestone notifications
   */
  private scheduleStreakNotifications(userId: string, preferences: UserNotificationPreferences): void {
    // Check for streak milestones every day
    const intervalMs = 24 * 60 * 60 * 1000; // Daily

    const timeoutId = setInterval(async () => {
      await this.checkAndSendStreakNotification(userId);
    }, intervalMs);

    this.schedules.set(`${userId}-streak`, timeoutId);
  }

  /**
   * Schedule weekly summary
   */
  private scheduleWeeklySummary(userId: string, preferences: UserNotificationPreferences): void {
    // Schedule weekly summary for Sunday at preferred time
    const [hours, minutes] = preferences.preferred_time.split(':').map(Number);
    const now = new Date();
    const summaryTime = new Date();

    // Find next Sunday
    const daysUntilSunday = (7 - now.getDay()) % 7;
    summaryTime.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
    summaryTime.setHours(hours, minutes, 0, 0);

    const timeUntilSummary = summaryTime.getTime() - now.getTime();

    const timeoutId = setTimeout(async () => {
      await this.sendWeeklySummary(userId);
      // Schedule next week's summary
      this.scheduleWeeklySummary(userId, preferences);
    }, timeUntilSummary);

    this.schedules.set(`${userId}-weekly`, timeoutId);
  }

  /**
   * Send daily prayer reminder
   */
  private async sendDailyReminder(userId: string): Promise<void> {
    try {
      // Get user stats to personalize the message
      const userStats = await ProgressService.getUserStats(userId);

      let title = 'Daily Prayer Reminder';
      let message = 'Time to connect with God and start your spiritual journey! 🙏';

      // Personalize based on progress
      if (userStats.currentStreak > 0) {
        message = `Day ${userStats.currentStreak + 1} of your spiritual journey! Keep the momentum going! 🔥`;
      } else if (userStats.lastSessionDate) {
        const daysSinceLastSession = Math.floor((Date.now() - new Date(userStats.lastSessionDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLastSession === 1) {
          message = 'Ready to continue your spiritual journey? God is waiting! 🙏';
        } else if (daysSinceLastSession > 1) {
          message = `It's been ${daysSinceLastSession} days since your last session. Let's reconnect with God today! 💝`;
        }
      }

      await this.sendPushNotification(userId, title, message, 'daily-reminder');
      console.log('✅ Daily reminder sent to user:', userId);
    } catch (error) {
      console.error('❌ Failed to send daily reminder:', error);
    }
  }

  /**
   * Send progress update notification
   */
  private async sendProgressUpdate(userId: string): Promise<void> {
    try {
      const userStats = await ProgressService.getUserStats(userId);

      const title = 'Weekly Progress Update';
      const message = `This week: ${userStats.totalSessions} sessions, ${userStats.averageDuration}min average. Keep growing! 📈`;

      await this.sendPushNotification(userId, title, message, 'progress-update');
      console.log('✅ Progress update sent to user:', userId);
    } catch (error) {
      console.error('❌ Failed to send progress update:', error);
    }
  }

  /**
   * Check and send streak milestone notifications
   */
  private async checkAndSendStreakNotification(userId: string): Promise<void> {
    try {
      const userStats = await ProgressService.getUserStats(userId);
      const streak = userStats.currentStreak;

      // Send milestone notifications at 3, 7, 14, 30 days
      const milestones = [3, 7, 14, 30];
      const isMilestone = milestones.includes(streak);

      if (isMilestone) {
        const title = '🎉 Streak Milestone!';
        const message = `Congratulations! You've maintained a ${streak}-day streak in your spiritual journey! Keep it up! 🔥`;

        await this.sendPushNotification(userId, title, message, 'streak-milestone');
        console.log(`✅ Streak milestone (${streak} days) sent to user:`, userId);
      }
    } catch (error) {
      console.error('❌ Failed to check/send streak notification:', error);
    }
  }

  /**
   * Send weekly summary notification
   */
  private async sendWeeklySummary(userId: string): Promise<void> {
    try {
      // Get this week's progress
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const progress = await ProgressService.getWeeklyProgress(userId, weekStartStr);

      const title = '📊 Weekly Spiritual Summary';
      const message = `This week: ${progress.sessions.length} sessions, ${progress.totalMinutesThisWeek} minutes total. ${progress.currentStreak > 0 ? `${progress.currentStreak}-day streak! ` : ''}Keep growing in faith! 🙏`;

      await this.sendPushNotification(userId, title, message, 'weekly-summary');
      console.log('✅ Weekly summary sent to user:', userId);
    } catch (error) {
      console.error('❌ Failed to send weekly summary:', error);
    }
  }

  /**
   * Send push notification via Service Worker
   */
  private async sendPushNotification(userId: string, title: string, body: string, tag: string): Promise<void> {
    try {
      // Try to use Service Worker if available
      if ('serviceWorker' in navigator && 'Notification' in window) {
        const registration = await navigator.serviceWorker.ready;

        await registration.showNotification(title, {
          body,
          icon: '/icon-192x192.png',
          badge: '/icon-72x192.png',
          tag,
          requireInteraction: true,
          actions: [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss' }
          ]
        });
      } else {
        // Fallback to regular notification if Service Worker not available
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/icon-192x192.png',
            tag,
            requireInteraction: true
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
    }
  }

  /**
   * Clear all schedules for a user
   */
  private clearUserSchedules(userId: string): void {
    const userScheduleKeys = Array.from(this.schedules.keys()).filter(key => key.startsWith(`${userId}-`));

    userScheduleKeys.forEach(key => {
      const timeoutId = this.schedules.get(key);
      if (timeoutId) {
        clearTimeout(timeoutId);
        clearInterval(timeoutId);
        this.schedules.delete(key);
      }
    });

    console.log(`🧹 Cleared ${userScheduleKeys.length} schedules for user:`, userId);
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserNotificationPreferences>): Promise<void> {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: userId,
          ...preferences
        });

      if (error) {
        console.error('Error updating notification preferences:', error);
        throw error;
      }

      // Reinitialize schedules with new preferences
      const updatedPreferences = await this.getUserPreferences(userId);
      if (updatedPreferences) {
        this.clearUserSchedules(userId);
        await this.scheduleUserNotifications(userId, updatedPreferences);
      }

      console.log('✅ Notification preferences updated for user:', userId);
    } catch (error) {
      console.error('❌ Failed to update notification preferences:', error);
      throw error;
    }
  }

  /**
   * Stop all notifications for a user
   */
  stopUserNotifications(userId: string): void {
    this.clearUserSchedules(userId);
    console.log('🛑 Stopped all notifications for user:', userId);
  }

  /**
   * Get scheduled notifications for debugging
   */
  getScheduledNotifications(userId: string): string[] {
    return Array.from(this.schedules.keys()).filter(key => key.startsWith(`${userId}-`));
  }
}

export default NotificationSchedulerService;
