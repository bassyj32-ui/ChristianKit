// DEPRECATED: This service is DISABLED in favor of RealNotificationService
// DO NOT USE - Use RealNotificationService instead
console.warn('⚠️ pushNotificationService is DEPRECATED. Use RealNotificationService instead.');

/*
import { supabase } from '../utils/supabase';

export interface PushNotificationData {
  title: string;
  body: string;
  url?: string;
  reminderType?: 'prayer' | 'bible' | 'meditation' | 'journal';
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

export class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;
  private vapidPublicKey: string;

  constructor() {
    // Use the VAPID key from environment
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BPlP29OfGd9w0ZcAui2TOSn8PCS6CYUyy8sHKCmOH6sOLEf7GGemqyWpU1T5y2pylT8W-v78UG5uQQ2VylVpVeM';
    this.checkSupport();
  }

  /**
   * Check if push notifications are supported
   */
  private checkSupport(): void {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    console.log('📱 Push notification support:', this.isSupported);
    console.log('🔑 VAPID Public Key:', this.vapidPublicKey ? '✅ Set' : '❌ Missing');
  }

  /**
   * Initialize the service worker and push notifications
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('⚠️ Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', this.swRegistration);

      // Request notification permission
      const permission = await Notification.requestPermission();
      console.log('🔔 Notification permission:', permission);

      if (permission !== 'granted') {
        console.warn('⚠️ Notification permission denied');
        return false;
      }

      // Subscribe to push notifications
      await this.subscribeToPush();
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications using Web Push API
   */
  private async subscribeToPush(): Promise<void> {
    if (!this.swRegistration) {
      throw new Error('Service worker not registered');
    }

    try {
      // Get push subscription
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('✅ Push subscription created:', subscription);

      // Store subscription in Supabase
      await this.storeSubscription(subscription);
      
    } catch (error) {
      console.error('❌ Error subscribing to push:', error);
      throw error;
    }
  }

  /**
   * Store push subscription in Supabase
   */
  private async storeSubscription(subscription: PushSubscription): Promise<void> {
    if (!supabase) {
      console.warn('Supabase not available');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user');
        return;
      }

      const subscriptionData = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!)
      };

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id' });

      if (error) {
        console.error('❌ Error storing subscription:', error);
      } else {
        console.log('✅ Push subscription stored in Supabase');
      }
    } catch (error) {
      console.error('❌ Error storing subscription:', error);
    }
  }

  /**
   * Send a push notification
   */
  async sendNotification(data: PushNotificationData): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        console.warn('Service worker not registered');
        return false;
      }

      await this.swRegistration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/christiankit-icon.svg',
        badge: data.badge || '/christiankit-icon.svg',
        tag: data.tag,
        data: data.data,
        actions: [
          {
            action: 'open',
            title: 'Open App',
            icon: '/christiankit-icon.svg'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      });

      console.log('✅ Notification sent:', data.title);
      return true;
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return false;
    }
  }

  /**
   * Schedule a prayer reminder notification
   */
  async schedulePrayerReminder(reminderData: {
    title: string;
    message: string;
    time: string;
    days: number[];
  }): Promise<boolean> {
    try {
      if (!supabase) {
        console.warn('Supabase not available');
        return false;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user');
        return false;
      }

      // Store reminder in Supabase
      const { error } = await supabase
        .from('prayer_reminders')
        .insert({
          user_id: user.id,
          title: reminderData.title,
          message: reminderData.message,
          time: reminderData.time,
          days: reminderData.days,
          is_active: true,
          notification_type: 'custom'
        });

      if (error) {
        console.error('❌ Error storing prayer reminder:', error);
        return false;
      }

      console.log('✅ Prayer reminder scheduled');
      return true;
    } catch (error) {
      console.error('❌ Error scheduling prayer reminder:', error);
      return false;
    }
  }

  /**
   * Get user's prayer reminders
   */
  async getPrayerReminders(): Promise<any[]> {
    try {
      if (!supabase) {
        console.warn('Supabase not available');
        return [];
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No authenticated user');
        return [];
      }

      const { data: reminders, error } = await supabase
        .from('prayer_reminders')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('time');

      if (error) {
        console.error('❌ Error fetching prayer reminders:', error);
        return [];
      }

      return reminders || [];
    } catch (error) {
      console.error('❌ Error fetching prayer reminders:', error);
      return [];
    }
  }

  /**
   * Delete a prayer reminder
   */
  async deletePrayerReminder(reminderId: string): Promise<boolean> {
    try {
      if (!supabase) {
        console.warn('Supabase not available');
        return false;
      }

      const { error } = await supabase
        .from('prayer_reminders')
        .delete()
        .eq('id', reminderId);

      if (error) {
        console.error('❌ Error deleting prayer reminder:', error);
        return false;
      }

      console.log('✅ Prayer reminder deleted');
      return true;
    } catch (error) {
      console.error('❌ Error deleting prayer reminder:', error);
      return false;
    }
  }

  /**
   * Utility function to convert VAPID key
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
   * Utility function to convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Check if notifications are supported and enabled
   */
  isNotificationSupported(): boolean {
    return this.isSupported && Notification.permission === 'granted';
  }

  /**
   * Get notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
*/

// Export a disabled version that throws errors
export const pushNotificationService = {
  initialize: () => { throw new Error('pushNotificationService is DEPRECATED. Use RealNotificationService instead.'); },
  requestPermission: () => { throw new Error('pushNotificationService is DEPRECATED. Use RealNotificationService instead.'); },
  getSubscriptionStatus: () => { throw new Error('pushNotificationService is DEPRECATED. Use RealNotificationService instead.'); },
  sendTestNotification: () => { throw new Error('pushNotificationService is DEPRECATED. Use RealNotificationService instead.'); }
};