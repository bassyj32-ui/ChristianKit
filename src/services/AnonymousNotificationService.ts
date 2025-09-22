/**
 * Anonymous Notification Service
 * Handles daily spiritual messages for users who haven't signed up
 * Works entirely client-side using localStorage and browser notifications
 */

export interface AnonymousUserPreferences {
  preferredTime: string; // Format: "HH:MM" (24-hour)
  timezone: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  frequency: 'daily' | 'twice' | 'hourly';
  urgencyLevel: 'gentle' | 'motivating' | 'aggressive';
  isActive: boolean;
  lastMessageSent?: string; // ISO date string
  messageCount: number;
}

export interface DailyMessage {
  id: string;
  title: string;
  message: string;
  verse?: string;
  verseReference?: string;
  timing: 'morning' | 'afternoon' | 'evening';
  urgency: 'gentle' | 'motivating' | 'aggressive';
}

class AnonymousNotificationService {
  private static instance: AnonymousNotificationService;
  private readonly STORAGE_KEY = 'anonymousNotificationPreferences';
  private readonly MESSAGES_KEY = 'anonymousDailyMessages';
  private readonly LAST_CHECK_KEY = 'lastNotificationCheck';
  
  // Default preferences
  private readonly DEFAULT_PREFERENCES: AnonymousUserPreferences = {
    preferredTime: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    emailEnabled: false, // Can't send emails without user email
    pushEnabled: true,
    frequency: 'daily',
    urgencyLevel: 'gentle',
    isActive: true,
    messageCount: 0
  };

  // Spiritual messages database
  private readonly DAILY_MESSAGES: DailyMessage[] = [
    // Morning Messages
    {
      id: 'morning-1',
      title: '🌅 Good Morning, Beloved',
      message: 'Start your day with gratitude. God has given you this new day as a gift. What will you do with it?',
      verse: 'This is the day the Lord has made; let us rejoice and be glad in it.',
      verseReference: 'Psalm 118:24',
      timing: 'morning',
      urgency: 'gentle'
    },
    {
      id: 'morning-2',
      title: '☀️ Rise and Shine',
      message: 'Your faith is like the morning sun - it brings light to the darkness. Let it shine today.',
      verse: 'Arise, shine, for your light has come, and the glory of the Lord rises upon you.',
      verseReference: 'Isaiah 60:1',
      timing: 'morning',
      urgency: 'motivating'
    },
    {
      id: 'morning-3',
      title: '🙏 Morning Prayer',
      message: 'Take a moment to center yourself in God\'s presence. He is with you in every step of this day.',
      verse: 'In the morning, Lord, you hear my voice; in the morning I lay my requests before you and wait expectantly.',
      verseReference: 'Psalm 5:3',
      timing: 'morning',
      urgency: 'gentle'
    },
    
    // Afternoon Messages
    {
      id: 'afternoon-1',
      title: '☀️ Midday Reflection',
      message: 'How is your day going? Remember that God is walking with you through every moment.',
      verse: 'The Lord your God is with you, the Mighty Warrior who saves. He will take great delight in you.',
      verseReference: 'Zephaniah 3:17',
      timing: 'afternoon',
      urgency: 'gentle'
    },
    {
      id: 'afternoon-2',
      title: '💪 Stay Strong',
      message: 'You are stronger than you think. God\'s strength is made perfect in your weakness.',
      verse: 'But he said to me, "My grace is sufficient for you, for my power is made perfect in weakness."',
      verseReference: '2 Corinthians 12:9',
      timing: 'afternoon',
      urgency: 'motivating'
    },
    
    // Evening Messages
    {
      id: 'evening-1',
      title: '🌙 Evening Gratitude',
      message: 'As the day ends, take a moment to thank God for His blessings. What are you grateful for today?',
      verse: 'Give thanks in all circumstances; for this is God\'s will for you in Christ Jesus.',
      verseReference: '1 Thessalonians 5:18',
      timing: 'evening',
      urgency: 'gentle'
    },
    {
      id: 'evening-2',
      title: '🕊️ Peace for the Night',
      message: 'Rest in God\'s peace tonight. He watches over you and will give you strength for tomorrow.',
      verse: 'In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.',
      verseReference: 'Psalm 4:8',
      timing: 'evening',
      urgency: 'gentle'
    },
    {
      id: 'evening-3',
      title: '⭐ Night Reflection',
      message: 'Before you sleep, reflect on God\'s faithfulness today. He never leaves you alone.',
      verse: 'The Lord himself goes before you and will be with you; he will never leave you nor forsake you.',
      verseReference: 'Deuteronomy 31:8',
      timing: 'evening',
      urgency: 'motivating'
    }
  ];

  public static getInstance(): AnonymousNotificationService {
    if (!AnonymousNotificationService.instance) {
      AnonymousNotificationService.instance = new AnonymousNotificationService();
    }
    return AnonymousNotificationService.instance;
  }

  /**
   * Initialize the service and start checking for notifications
   */
  public async initialize(): Promise<void> {
    try {
      console.log('🔔 Initializing Anonymous Notification Service...');
      
      // Load or create preferences
      const preferences = this.getPreferences();
      
      // Check if notifications are enabled
      if (preferences.isActive && preferences.pushEnabled) {
        await this.requestNotificationPermission();
        this.scheduleNextNotification();
      }
      
      // Check if it's time to show a notification right now
      await this.checkAndShowNotification();
      
      console.log('✅ Anonymous Notification Service initialized');
    } catch (error) {
      console.error('❌ Error initializing Anonymous Notification Service:', error);
    }
  }

  /**
   * Get user preferences from localStorage
   */
  public getPreferences(): AnonymousUserPreferences {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
    return { ...this.DEFAULT_PREFERENCES };
  }

  /**
   * Save user preferences to localStorage
   */
  public savePreferences(preferences: Partial<AnonymousUserPreferences>): void {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      console.log('✅ Anonymous notification preferences saved:', updated);
      
      // Reschedule notifications if preferences changed
      if (preferences.preferredTime || preferences.isActive !== undefined) {
        this.scheduleNextNotification();
      }
    } catch (error) {
      console.error('❌ Error saving preferences:', error);
    }
  }

  /**
   * Request notification permission from browser
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      if (granted) {
        console.log('✅ Notification permission granted');
        this.savePreferences({ pushEnabled: true });
      } else {
        console.log('❌ Notification permission denied');
        this.savePreferences({ pushEnabled: false });
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Check if it's time to show a notification and show it
   */
  public async checkAndShowNotification(): Promise<void> {
    const preferences = this.getPreferences();
    
    if (!preferences.isActive || !preferences.pushEnabled) {
      return;
    }

    const now = new Date();
    const currentTime = this.formatTime(now);
    const preferredTime = preferences.preferredTime;
    
    // Check if current time matches preferred time (within 5 minutes)
    if (this.isTimeToNotify(currentTime, preferredTime)) {
      // Check if we already sent a message today
      const lastSent = preferences.lastMessageSent;
      const today = now.toDateString();
      
      if (lastSent && new Date(lastSent).toDateString() === today) {
        console.log('📅 Message already sent today');
        return;
      }

      // Show notification
      await this.showDailyNotification();
      
      // Update last sent time
      this.savePreferences({ 
        lastMessageSent: now.toISOString(),
        messageCount: preferences.messageCount + 1
      });
    }
  }

  /**
   * Show the daily notification
   */
  private async showDailyNotification(): Promise<void> {
    const preferences = this.getPreferences();
    const message = this.selectMessage(preferences.urgencyLevel);
    
    if (!message) {
      console.error('No message found');
      return;
    }

    try {
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(message.title, {
          body: message.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'daily-spiritual-message',
          requireInteraction: false,
          silent: false
        });

        // Auto-close after 10 seconds
        setTimeout(() => {
          notification.close();
        }, 10000);

        // Handle click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        console.log('✅ Daily notification shown:', message.title);
      }

      // Also log to console for development
      console.log('📱 Daily Spiritual Message:', {
        title: message.title,
        message: message.message,
        verse: message.verse,
        reference: message.verseReference
      });

    } catch (error) {
      console.error('❌ Error showing notification:', error);
    }
  }

  /**
   * Select appropriate message based on time and urgency
   */
  private selectMessage(urgencyLevel: string): DailyMessage | null {
    const now = new Date();
    const hour = now.getHours();
    
    // Determine timing
    let timing: 'morning' | 'afternoon' | 'evening';
    if (hour < 12) {
      timing = 'morning';
    } else if (hour < 18) {
      timing = 'afternoon';
    } else {
      timing = 'evening';
    }

    // Filter messages by timing and urgency
    const relevantMessages = this.DAILY_MESSAGES.filter(msg => 
      msg.timing === timing && msg.urgency === urgencyLevel
    );

    // If no messages match exact urgency, get any message for this timing
    const fallbackMessages = this.DAILY_MESSAGES.filter(msg => msg.timing === timing);
    const messagesToChooseFrom = relevantMessages.length > 0 ? relevantMessages : fallbackMessages;

    if (messagesToChooseFrom.length === 0) {
      return null;
    }

    // Select random message
    const randomIndex = Math.floor(Math.random() * messagesToChooseFrom.length);
    return messagesToChooseFrom[randomIndex];
  }

  /**
   * Schedule the next notification check
   */
  private scheduleNextNotification(): void {
    const preferences = this.getPreferences();
    
    if (!preferences.isActive) {
      return;
    }

    // Clear any existing interval
    const existingInterval = (window as any).__anonymousNotificationInterval;
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Check every minute
    const interval = setInterval(async () => {
      await this.checkAndShowNotification();
    }, 60000); // 1 minute

    // Store interval reference
    (window as any).__anonymousNotificationInterval = interval;

    console.log('⏰ Anonymous notification scheduler started (checking every minute)');
  }

  /**
   * Check if current time matches preferred time (within 5 minutes)
   */
  private isTimeToNotify(currentTime: string, preferredTime: string): boolean {
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const [preferredHour, preferredMinute] = preferredTime.split(':').map(Number);
    
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const preferredTotalMinutes = preferredHour * 60 + preferredMinute;
    
    const timeDiff = Math.abs(currentTotalMinutes - preferredTotalMinutes);
    
    return timeDiff <= 5; // Within 5 minutes
  }

  /**
   * Format time as HH:MM
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Get today's message (for display in UI)
   */
  public getTodaysMessage(): DailyMessage | null {
    const preferences = this.getPreferences();
    return this.selectMessage(preferences.urgencyLevel);
  }

  /**
   * Enable notifications
   */
  public async enableNotifications(): Promise<boolean> {
    const permissionGranted = await this.requestNotificationPermission();
    if (permissionGranted) {
      this.savePreferences({ isActive: true, pushEnabled: true });
      this.scheduleNextNotification();
    }
    return permissionGranted;
  }

  /**
   * Disable notifications
   */
  public disableNotifications(): void {
    this.savePreferences({ isActive: false, pushEnabled: false });
    
    // Clear interval
    const existingInterval = (window as any).__anonymousNotificationInterval;
    if (existingInterval) {
      clearInterval(existingInterval);
      (window as any).__anonymousNotificationInterval = null;
    }
    
    console.log('🔕 Anonymous notifications disabled');
  }

  /**
   * Get notification status
   */
  public getStatus(): {
    isSupported: boolean;
    permission: NotificationPermission;
    isActive: boolean;
    preferences: AnonymousUserPreferences;
  } {
    const preferences = this.getPreferences();
    
    return {
      isSupported: 'Notification' in window,
      permission: 'Notification' in window ? Notification.permission : 'denied',
      isActive: preferences.isActive && preferences.pushEnabled,
      preferences
    };
  }
}

// Export singleton instance
export const anonymousNotificationService = AnonymousNotificationService.getInstance();

