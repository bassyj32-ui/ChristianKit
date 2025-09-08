import { supabase } from '../utils/supabase';
import { pushNotificationService } from './pushNotificationService';

export interface PrayerReminder {
  id: string;
  user_id: string;
  title: string;
  message: string;
  verse?: string;
  verse_reference?: string;
  time: string; // HH:MM format
  days: number[]; // 0-6 (Sunday-Saturday)
  is_active: boolean;
  notification_type: 'morning' | 'midday' | 'evening' | 'custom';
  created_at: string;
  updated_at: string;
}

export interface PrayerNotificationContent {
  title: string;
  message: string;
  verse?: string;
  verse_reference?: string;
  icon?: string;
}

class DailyPrayerNotificationService {
  private defaultReminders: Omit<PrayerReminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] = [
    {
      title: '🌅 Morning Prayer',
      message: 'Start your day with God. He has wonderful plans for you today!',
      verse: 'This is the day the Lord has made; let us rejoice and be glad in it.',
      verse_reference: 'Psalm 118:24',
      time: '08:00',
      days: [1, 2, 3, 4, 5, 6, 0], // Every day
      is_active: true,
      notification_type: 'morning'
    },
    {
      title: '☀️ Midday Pause',
      message: 'Take a moment to connect with God in the middle of your busy day.',
      verse: 'Be still, and know that I am God.',
      verse_reference: 'Psalm 46:10',
      time: '12:00',
      days: [1, 2, 3, 4, 5], // Weekdays only
      is_active: false, // Optional midday prayer
      notification_type: 'midday'
    },
    {
      title: '🌙 Evening Gratitude',
      message: 'End your day by thanking God for His blessings and seeking His peace.',
      verse: 'Give thanks to the Lord, for he is good; his love endures forever.',
      verse_reference: 'Psalm 107:1',
      time: '20:00',
      days: [1, 2, 3, 4, 5, 6, 0], // Every day
      is_active: true,
      notification_type: 'evening'
    }
  ];

  private prayerContent: PrayerNotificationContent[] = [
    // Morning Prayers
    {
      title: '🌅 Good Morning, Beloved!',
      message: 'God has given you a fresh start today. Begin with His presence.',
      verse: 'In the morning, Lord, you hear my voice; in the morning I lay my requests before you and wait expectantly.',
      verse_reference: 'Psalm 5:3'
    },
    {
      title: '☀️ Rise and Shine!',
      message: 'Before the world gets busy, spend these quiet moments with Jesus.',
      verse: 'Very early in the morning, while it was still dark, Jesus got up, left the house and went off to a solitary place, where he prayed.',
      verse_reference: 'Mark 1:35'
    },
    {
      title: '🙏 New Mercies Today',
      message: 'His mercies are new every morning. Great is His faithfulness!',
      verse: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.',
      verse_reference: 'Lamentations 3:22-23'
    },

    // Midday Prayers
    {
      title: '⏰ Midday Reset',
      message: 'Pause and remember that God is with you in every moment.',
      verse: 'Cast all your anxiety on him because he cares for you.',
      verse_reference: '1 Peter 5:7'
    },
    {
      title: '💪 Stay Strong',
      message: 'You\'re doing great! God sees your efforts and is pleased.',
      verse: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.',
      verse_reference: 'Galatians 6:9'
    },

    // Evening Prayers
    {
      title: '🌙 End with Gratitude',
      message: 'Reflect on God\'s goodness today and rest in His peace.',
      verse: 'In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.',
      verse_reference: 'Psalm 4:8'
    },
    {
      title: '✨ Rest in His Love',
      message: 'You are loved, chosen, and His. Sleep well knowing you belong to the King.',
      verse: 'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you; in his love he will no longer rebuke you, but will rejoice over you with singing.',
      verse_reference: 'Zephaniah 3:17'
    },
    {
      title: '🕊️ Peace for Tonight',
      message: 'Let go of today\'s worries and trust God with tomorrow.',
      verse: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.',
      verse_reference: 'Philippians 4:6'
    }
  ];

  /**
   * Initialize prayer reminders for a new user
   */
  async initializeUserReminders(userId: string): Promise<boolean> {
    try {
      if (!supabase) {
        console.error('Supabase client not available');
        return false;
      }

      // Check if user already has reminders
      const { data: existingReminders } = await supabase
        .from('prayer_reminders')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (existingReminders && existingReminders.length > 0) {
        console.log('User already has prayer reminders');
        return true;
      }

      // Create default reminders for the user
      const remindersToInsert = this.defaultReminders.map(reminder => ({
        ...reminder,
        user_id: userId
      }));

      const { error } = await supabase
        .from('prayer_reminders')
        .insert(remindersToInsert);

      if (error) throw error;

      console.log('✅ Default prayer reminders created for user');
      return true;
    } catch (error) {
      console.error('❌ Error initializing user reminders:', error);
      return false;
    }
  }

  /**
   * Get user's prayer reminders
   */
  async getUserReminders(userId: string): Promise<PrayerReminder[]> {
    try {
      if (!supabase) {
        console.error('Supabase client not available');
        return [];
      }

      const { data, error } = await supabase
        .from('prayer_reminders')
        .select('*')
        .eq('user_id', userId)
        .order('time');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching user reminders:', error);
      return [];
    }
  }

  /**
   * Update prayer reminder
   */
  async updateReminder(reminderId: string, updates: Partial<PrayerReminder>): Promise<boolean> {
    try {
      if (!supabase) return false;
      
      const { error } = await supabase
        .from('prayer_reminders')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', reminderId);

      if (error) throw error;

      console.log('✅ Prayer reminder updated');
      return true;
    } catch (error) {
      console.error('❌ Error updating reminder:', error);
      return false;
    }
  }

  /**
   * Create custom prayer reminder
   */
  async createCustomReminder(
    userId: string,
    title: string,
    message: string,
    time: string,
    days: number[],
    verse?: string,
    verseReference?: string
  ): Promise<boolean> {
    try {
      if (!supabase) return false;
      
      const { error } = await supabase
        .from('prayer_reminders')
        .insert({
          user_id: userId,
          title,
          message,
          verse,
          verse_reference: verseReference,
          time,
          days,
          is_active: true,
          notification_type: 'custom'
        });

      if (error) throw error;

      console.log('✅ Custom prayer reminder created');
      return true;
    } catch (error) {
      console.error('❌ Error creating custom reminder:', error);
      return false;
    }
  }

  /**
   * Delete prayer reminder
   */
  async deleteReminder(reminderId: string): Promise<boolean> {
    try {
      if (!supabase) return false;
      
      const { error } = await supabase
        .from('prayer_reminders')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;

      console.log('✅ Prayer reminder deleted');
      return true;
    } catch (error) {
      console.error('❌ Error deleting reminder:', error);
      return false;
    }
  }

  /**
   * Schedule daily prayer notifications
   */
  async scheduleDailyNotifications(): Promise<void> {
    try {
      if (!supabase) return;
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's active reminders
      const reminders = await this.getUserReminders(user.id);
      const activeReminders = reminders.filter(r => r.is_active);

      if (activeReminders.length === 0) {
        console.log('No active prayer reminders found');
        return;
      }

      // Schedule notifications for today and tomorrow
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      for (const reminder of activeReminders) {
        // Check if today is a scheduled day
        const todayDay = today.getDay();
        if (reminder.days.includes(todayDay)) {
          await this.scheduleNotificationForDay(reminder, today);
        }

        // Check if tomorrow is a scheduled day
        const tomorrowDay = tomorrow.getDay();
        if (reminder.days.includes(tomorrowDay)) {
          await this.scheduleNotificationForDay(reminder, tomorrow);
        }
      }

      console.log('✅ Daily prayer notifications scheduled');
    } catch (error) {
      console.error('❌ Error scheduling daily notifications:', error);
    }
  }

  /**
   * Schedule notification for a specific day
   */
  private async scheduleNotificationForDay(reminder: PrayerReminder, date: Date): Promise<void> {
    try {
      const [hours, minutes] = reminder.time.split(':').map(Number);
      const notificationTime = new Date(date);
      notificationTime.setHours(hours, minutes, 0, 0);

      // Only schedule if the time hasn't passed
      if (notificationTime > new Date()) {
        // Get random content for this notification type
        const content = this.getRandomPrayerContent(reminder.notification_type);

        // Use the reminder's content or fallback to random content
        const notificationData = {
          title: reminder.title || content.title,
          body: reminder.message || content.message,
          icon: '/icon-192x192.png',
          badge: '/icon-72x72.png',
          data: {
            type: 'prayer_reminder',
            reminder_id: reminder.id,
            verse: reminder.verse || content.verse,
            verse_reference: reminder.verse_reference || content.verse_reference,
            url: '/?tab=prayer'
          },
          tag: `prayer-reminder-${reminder.id}`,
          requireInteraction: true,
          actions: [
            {
              action: 'pray_now',
              title: '🙏 Pray Now',
              icon: '/icon-72x72.png'
            },
            {
              action: 'remind_later',
              title: '⏰ Remind Later',
              icon: '/icon-72x72.png'
            }
          ]
        };

        // In a real implementation, you would use a proper scheduling service
        // For now, we'll use setTimeout for demonstration
        const timeUntilNotification = notificationTime.getTime() - new Date().getTime();
        
        if (timeUntilNotification > 0 && timeUntilNotification < 24 * 60 * 60 * 1000) { // Within 24 hours
          setTimeout(() => {
            this.sendPrayerNotification(notificationData);
          }, timeUntilNotification);

          console.log(`📅 Prayer notification scheduled for ${notificationTime.toLocaleString()}`);
        }
      }
    } catch (error) {
      console.error('❌ Error scheduling notification for day:', error);
    }
  }

  /**
   * Send prayer notification
   */
  private async sendPrayerNotification(notificationData: any): Promise<void> {
    try {
      // Check if push notifications are available
      if (pushNotificationService.isEnabled()) {
        // Send via service worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            data: notificationData
          });
        }
      } else {
        // Fallback to browser notification
        if (Notification.permission === 'granted') {
          new Notification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            data: notificationData.data,
            tag: notificationData.tag,
            requireInteraction: notificationData.requireInteraction
          });
        }
      }

      // Track notification sent
      await this.trackNotificationSent(notificationData.data.reminder_id);

      console.log('✅ Prayer notification sent:', notificationData.title);
    } catch (error) {
      console.error('❌ Error sending prayer notification:', error);
    }
  }

  /**
   * Get random prayer content based on type
   */
  private getRandomPrayerContent(type: 'morning' | 'midday' | 'evening' | 'custom'): PrayerNotificationContent {
    // Filter content by time of day
    let filteredContent = this.prayerContent;
    
    if (type === 'morning') {
      filteredContent = this.prayerContent.filter(c => 
        c.title.includes('Morning') || c.title.includes('Rise') || c.title.includes('🌅') || c.title.includes('☀️')
      );
    } else if (type === 'midday') {
      filteredContent = this.prayerContent.filter(c => 
        c.title.includes('Midday') || c.title.includes('Reset') || c.title.includes('Strong')
      );
    } else if (type === 'evening') {
      filteredContent = this.prayerContent.filter(c => 
        c.title.includes('Evening') || c.title.includes('Gratitude') || c.title.includes('Rest') || c.title.includes('Peace') || c.title.includes('🌙')
      );
    }

    // Fallback to all content if no matches
    if (filteredContent.length === 0) {
      filteredContent = this.prayerContent;
    }

    const randomIndex = Math.floor(Math.random() * filteredContent.length);
    return filteredContent[randomIndex];
  }

  /**
   * Track notification sent for analytics
   */
  private async trackNotificationSent(reminderId: string): Promise<void> {
    try {
      if (!supabase) return;
      
      const { error } = await supabase
        .from('prayer_notification_logs')
        .insert({
          reminder_id: reminderId,
          sent_at: new Date().toISOString(),
          status: 'sent'
        });

      if (error) throw error;
    } catch (error) {
      console.error('❌ Error tracking notification:', error);
    }
  }

  /**
   * Handle notification interaction (user clicked pray now, etc.)
   */
  async handleNotificationInteraction(action: string, reminderId: string): Promise<void> {
    try {
      if (action === 'pray_now') {
        // Track that user started praying
        if (supabase) {
          await supabase
          .from('prayer_sessions')
          .insert({
            reminder_id: reminderId,
            started_at: new Date().toISOString(),
            source: 'notification'
          });

          console.log('✅ Prayer session started from notification');
        }
      } else if (action === 'remind_later') {
        // Schedule a reminder for 30 minutes later
        setTimeout(() => {
          this.sendPrayerNotification({
            title: '🔔 Prayer Reminder',
            body: 'You asked to be reminded to pray. This is your gentle reminder! 🙏',
            icon: '/icon-192x192.png',
            data: { type: 'prayer_reminder_later', reminder_id: reminderId }
          });
        }, 30 * 60 * 1000); // 30 minutes

        console.log('✅ Prayer reminder scheduled for 30 minutes later');
      }
    } catch (error) {
      console.error('❌ Error handling notification interaction:', error);
    }
  }

  /**
   * Get user's prayer statistics
   */
  async getUserPrayerStats(userId: string): Promise<{
    totalReminders: number;
    activeReminders: number;
    notificationsSentToday: number;
    prayerSessionsToday: number;
    currentStreak: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      if (!supabase) {
        return {
          totalReminders: 0,
          activeReminders: 0,
          notificationsSentToday: 0,
          prayerSessionsToday: 0,
          currentStreak: 0
        };
      }

      const [reminders, notificationLogs, prayerSessions] = await Promise.all([
        this.getUserReminders(userId),
        supabase
          .from('prayer_notification_logs')
          .select('id')
          .gte('sent_at', `${today}T00:00:00.000Z`)
          .lte('sent_at', `${today}T23:59:59.999Z`),
        supabase
          .from('prayer_sessions')
          .select('id, started_at')
          .eq('user_id', userId)
          .gte('started_at', `${today}T00:00:00.000Z`)
          .lte('started_at', `${today}T23:59:59.999Z`)
      ]);

      return {
        totalReminders: reminders.length,
        activeReminders: reminders.filter(r => r.is_active).length,
        notificationsSentToday: notificationLogs.data?.length || 0,
        prayerSessionsToday: prayerSessions.data?.length || 0,
        currentStreak: 0 // TODO: Calculate streak
      };
    } catch (error) {
      console.error('❌ Error getting prayer stats:', error);
      return {
        totalReminders: 0,
        activeReminders: 0,
        notificationsSentToday: 0,
        prayerSessionsToday: 0,
        currentStreak: 0
      };
    }
  }

  /**
   * Initialize the service for the current user
   */
  async initialize(): Promise<void> {
    try {
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, skipping prayer notification initialization');
        return;
      }

      // Initialize default reminders if needed
      await this.initializeUserReminders(user.id);

      // Schedule daily notifications
      await this.scheduleDailyNotifications();

      console.log('✅ Daily prayer notification service initialized');
    } catch (error) {
      console.error('❌ Error initializing daily prayer notification service:', error);
    }
  }

  /**
   * Request notification permissions and setup
   */
  async requestPermissionsAndSetup(): Promise<boolean> {
    try {
      // Request notification permission
      const permission = await pushNotificationService.requestPermission();
      
      if (permission === 'granted') {
        // Initialize push notifications
        await pushNotificationService.initialize();
        
        // Subscribe to push notifications
        await pushNotificationService.subscribeToPushNotifications();
        
        // Initialize prayer reminders
        await this.initialize();
        
        console.log('✅ Prayer notifications fully set up');
        return true;
      } else {
        console.log('❌ Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error setting up prayer notifications:', error);
      return false;
    }
  }
}

export const dailyPrayerNotificationService = new DailyPrayerNotificationService();
