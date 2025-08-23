// Notification Scheduler - Aggressive User Re-engagement System
import EmailService from './EmailService';

export interface UserActivity {
  userId: string;
  email: string;
  lastPrayerTime: Date;
  currentStreak: number;
  notificationCount: number;
}

class NotificationScheduler {
  private intervals: Map<string, NodeJS.Timer> = new Map();

  /**
   * Start aggressive notification campaign for user
   */
  startRestlessNotifications(user: UserActivity): void {
    // Clear any existing timers
    this.stopNotifications(user.userId);

    const now = new Date();
    const hoursSinceLastPrayer = (now.getTime() - user.lastPrayerTime.getTime()) / (1000 * 60 * 60);

    // Schedule increasingly aggressive notifications
    this.scheduleEmailSequence(user, hoursSinceLastPrayer);
    this.schedulePushSequence(user, hoursSinceLastPrayer);
  }

  /**
   * Email notification sequence
   */
  private scheduleEmailSequence(user: UserActivity, hoursSinceLastPrayer: number): void {
    const emailSchedule = {
      userId: user.userId,
      email: user.email,
      lastActivity: user.lastPrayerTime,
      daysSinceLastPrayer: Math.floor(hoursSinceLastPrayer / 24),
      consecutiveMissedDays: Math.floor(hoursSinceLastPrayer / 24),
      streak: user.currentStreak
    };

    // Send immediate email if > 24 hours
    if (hoursSinceLastPrayer >= 24) {
      EmailService.getInstance().sendDailyReEngagementEmail(emailSchedule);
    }

    // Schedule follow-up emails
    const emailTimer = setInterval(() => {
      EmailService.getInstance().sendDailyReEngagementEmail({
        ...emailSchedule,
        consecutiveMissedDays: emailSchedule.consecutiveMissedDays + 1
      });
    }, 24 * 60 * 60 * 1000); // Daily

    this.intervals.set(`email-${user.userId}`, emailTimer);
  }

  /**
   * Push notification sequence - make them restless!
   */
  private schedulePushSequence(user: UserActivity, hoursSinceLastPrayer: number): void {
    const pushSchedule = {
      userId: user.userId,
      lastActivity: user.lastPrayerTime,
      daysSinceLastPrayer: Math.floor(hoursSinceLastPrayer / 24),
      consecutiveMissedDays: Math.floor(hoursSinceLastPrayer / 24),
      timesSnoozed: 0,
      notificationsSentToday: user.notificationCount
    };

    // Start with gentle reminders, escalate quickly
    this.sendEscalatingPushNotifications(pushSchedule);
  }

  /**
   * Send escalating push notifications
   */
  private async sendEscalatingPushNotifications(schedule: any): Promise<void> {
    const intervals = [
      30 * 60 * 1000,  // 30 minutes
      60 * 60 * 1000,  // 1 hour  
      2 * 60 * 60 * 1000,  // 2 hours
      4 * 60 * 60 * 1000,  // 4 hours
      6 * 60 * 60 * 1000,  // 6 hours
      12 * 60 * 60 * 1000, // 12 hours
    ];

    intervals.forEach((interval, index) => {
      const timer = setTimeout(() => {
        this.sendPushNotification({
          ...schedule,
          timesSnoozed: index,
          notificationsSentToday: index + 1
        });
      }, interval);

      this.intervals.set(`push-${schedule.userId}-${index}`, timer);
    });
  }

  /**
   * Send individual push notification
   */
  private async sendPushNotification(schedule: any): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const urgency = this.calculateUrgency(schedule);
    const message = this.getPushMessage(urgency, schedule);

    new Notification(message.title, {
      body: message.body,
      icon: '/icon-192x192.png',
      requireInteraction: urgency >= 3,
      vibrate: urgency >= 2 ? [200, 100, 200] : [200],
      actions: [
        { action: 'pray', title: '🙏 Pray Now' },
        { action: 'snooze', title: '⏰ Later' }
      ]
    });
  }

  /**
   * Calculate urgency level (1-5)
   */
  private calculateUrgency(schedule: any): number {
    const { daysSinceLastPrayer, timesSnoozed, notificationsSentToday } = schedule;
    
    let urgency = 1;
    urgency += Math.min(daysSinceLastPrayer, 2); // +0-2 for days missed
    urgency += Math.min(timesSnoozed, 1); // +0-1 for snoozes
    urgency += Math.min(Math.floor(notificationsSentToday / 3), 1); // +0-1 for notification count
    
    return Math.min(urgency, 5);
  }

  /**
   * Get push notification message based on urgency
   */
  private getPushMessage(urgency: number, schedule: any): { title: string; body: string } {
    const messages = {
      1: {
        title: "🌅 Time to Pray",
        body: "Your daily spiritual moment awaits you"
      },
      2: {
        title: "🙏 God is Waiting",
        body: "Your prayer time is ready when you are"
      },
      3: {
        title: "💝 We miss you!",
        body: "Ready to continue your prayer journey?"
      },
      4: {
        title: "✨ Come back anytime",
        body: "Your spiritual growth journey continues"
      },
      5: {
        title: "🌟 Welcome back!",
        body: "We'd love to see you return to prayer"
      }
    };

    return messages[urgency as keyof typeof messages] || messages[1];
  }

  /**
   * Stop all notifications for user
   */
  stopNotifications(userId: string): void {
    // Clear all timers for this user
    for (const [key, timer] of this.intervals.entries()) {
      if (key.includes(userId)) {
        clearInterval(timer);
        clearTimeout(timer);
        this.intervals.delete(key);
      }
    }
  }

  /**
   * Process all inactive users for notifications
   */
  async processInactiveUsers(users: UserActivity[]): Promise<void> {
    console.log(`🔥 Starting restless notification campaign for ${users.length} inactive users`);
    
    for (const user of users) {
      this.startRestlessNotifications(user);
    }
    
    console.log('✅ Restless notification campaign initiated');
  }
}

export const notificationScheduler = new NotificationScheduler();
export default NotificationScheduler;
