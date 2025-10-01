/**
 * Real Notification Service
 * This service works with the actual Supabase backend to send real notifications
 * that work when the app is closed and phone is locked
 */

import { supabase } from '../utils/supabase';
import { getValidatedVapidPublicKey, logVapidConfigurationStatus } from '../utils/vapidKeys';

export interface RealNotificationPreferences {
  preferredTime: string; // Format: "HH:MM" (24-hour)
  timezone: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  isActive: boolean;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Using the browser's native PushSubscription interface for Web API compatibility
// Our custom interface for database storage

class RealNotificationService {
  private static instance: RealNotificationService;

  public static getInstance(): RealNotificationService {
    if (!RealNotificationService.instance) {
      RealNotificationService.instance = new RealNotificationService();
    }
    return RealNotificationService.instance;
  }

  /**
   * Initialize the real notification service
   */
  public async initialize(): Promise<void> {
    try {
      // Log VAPID configuration status for debugging
      logVapidConfigurationStatus();

      // Check if VAPID keys are configured
      if (!getValidatedVapidPublicKey()) {
        console.warn('⚠️ Cannot initialize push notifications: VAPID keys not configured');
        return;
      }

      // Initializing Real Notification Service

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // Get user preferences
      const preferences = await this.getUserPreferences(user.id);
      if (preferences) {
        // Real notification preferences loaded
      }

      // Request push notification permission
      await this.requestPushPermission();

      // Real Notification Service initialized
    } catch (error) {
      console.error('❌ Error initializing Real Notification Service:', error);
    }
  }

  /**
   * Get user notification preferences from Supabase
   */
  public async getUserPreferences(userId: string): Promise<RealNotificationPreferences | null> {
    try {
      // First check if user has notification preferences
      const { data: prefs, error: prefsError } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (prefsError && prefsError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user preferences:', prefsError);
        return null;
      }

      // Get user profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, experience_level')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', profileError);
      }

      // Return preferences with defaults if not found
      return {
        preferredTime: prefs?.preferred_time || '09:00',
        timezone: prefs?.timezone || 'UTC',
        pushEnabled: prefs?.push_enabled ?? true,
        emailEnabled: prefs?.email_enabled ?? true,
        isActive: prefs?.is_active ?? false,
        experienceLevel: profile?.experience_level || 'beginner'
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  /**
   * Save user notification preferences to Supabase
   */
  public async saveUserPreferences(userId: string, preferences: Partial<RealNotificationPreferences>): Promise<boolean> {
    try {
      // First, ensure user profile exists
      await this.ensureUserProfile(userId, preferences.experienceLevel);

      // Update or insert notification preferences
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
          user_id: userId,
          preferred_time: preferences.preferredTime,
          timezone: preferences.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          push_enabled: preferences.pushEnabled,
          email_enabled: preferences.emailEnabled,
          is_active: preferences.isActive
        });

      if (error) {
        console.error('Error saving user preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving user preferences:', error);
      return false;
    }
  }

  /**
   * Ensure user profile exists in the database
   */
  private async ensureUserProfile(userId: string, experienceLevel?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          experience_level: experienceLevel || 'beginner'
        });

      if (error) {
        console.error('Error ensuring user profile:', error);
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  }

  /**
   * Request push notification permission and set up subscription
   */
  public async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      await this.setupPushSubscription();
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
        await this.setupPushSubscription();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Set up push subscription
   */
  private async setupPushSubscription(): Promise<void> {
    try {
      if (!('serviceWorker' in navigator)) {
        console.warn('Service worker not supported');
        return;
      }

      // Get validated VAPID key
      const vapidKey = getValidatedVapidPublicKey();
      if (!vapidKey) {
        console.error('❌ Cannot setup push subscription: Invalid VAPID key');
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      // Service worker registered

      // Get push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey) as any
      });

      // Save subscription to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Convert browser PushSubscription to our expected format
        const subscriptionData = subscription.toJSON();
        await this.savePushSubscription(user.id, {
          endpoint: subscriptionData.endpoint!,
          keys: {
            p256dh: subscriptionData.keys?.p256dh || '',
            auth: subscriptionData.keys?.auth || ''
          }
        });
      }

      // Push subscription set up
    } catch (error) {
      console.error('Error setting up push subscription:', error);
    }
  }

  /**
   * Save push subscription to Supabase
   */
  private async savePushSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          is_active: true
        });

      if (error) {
        console.error('Error saving push subscription:', error);
      } else {
        // Push subscription saved
      }
    } catch (error) {
      console.error('Error saving push subscription:', error);
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Enable notifications for the current user
   */
  public async enableNotifications(preferences: Partial<RealNotificationPreferences>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return false;
      }

      // Request push permission
      const pushGranted = await this.requestPushPermission();

      // Save preferences
      const success = await this.saveUserPreferences(user.id, {
        ...preferences,
        pushEnabled: pushGranted,
        isActive: true
      });

      return success;
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    }
  }

  /**
   * Disable notifications for the current user
   */
  public async disableNotifications(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return false;
      }

      const { error } = await supabase
        .from('user_notification_preferences')
        .update({ is_active: false })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error disabling notifications:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error disabling notifications:', error);
      return false;
    }
  }

  /**
   * Get notification status
   */
  public async getStatus(): Promise<{
    isSupported: boolean;
    permission: NotificationPermission;
    isActive: boolean;
    preferences: RealNotificationPreferences | null;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    
    let preferences = null;
    if (user) {
      preferences = await this.getUserPreferences(user.id);
    }

    return {
      isSupported: 'Notification' in window,
      permission: 'Notification' in window ? Notification.permission : 'denied',
      isActive: preferences?.isActive || false,
      preferences
    };
  }

  /**
   * Send test notification
   */
  public async sendTestNotification(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return false;
      }

      // Sending test notification

      // First, ensure user has notification preferences set up
      await this.ensureUserNotificationSetup(user.id);

      // Call the daily notifications function to send a test
      const { data, error } = await supabase.functions.invoke('daily-notifications', {
        body: { test: true, userId: user.id }
      });

      if (error) {
        console.error('Error sending test notification:', error);
        console.error('Error details:', error);
        return false;
      }

      return data?.success || false;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return false;
    }
  }

  /**
   * Ensure user has notification preferences set up
   */
  private async ensureUserNotificationSetup(userId: string): Promise<void> {
    try {
      // Get user data first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Cannot get user data for notification setup:', userError);
        return;
      }

      // Check if user preferences exist
      const { data: existingPrefs } = await supabase
        .from('user_notification_preferences')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (!existingPrefs) {
        // Create default preferences
        await supabase
          .from('user_notification_preferences')
          .insert({
            user_id: userId,
            preferred_time: '09:00',
            timezone: 'UTC',
            push_enabled: true,
            email_enabled: true,
            is_active: true
          });
        // Created default notification preferences
      }

      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (!existingProfile) {
        // Create default profile
        await supabase
          .from('profiles')
          .insert({
            id: userId,
            display_name: user.email?.split('@')[0] || 'User',
            email: user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        // Created default user profile
      }
    } catch (error) {
      console.error('Error setting up user notifications:', error);
    }
  }
}

// Export singleton instance
export const realNotificationService = RealNotificationService.getInstance();


