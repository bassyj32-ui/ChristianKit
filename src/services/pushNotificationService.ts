import { supabase } from '../utils/supabase';
import { messaging } from '../config/firebase';
import { getToken, onMessage } from 'firebase/messaging';

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
  private fcmToken: string | null = null;

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

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker ready');

      // Initialize Firebase messaging
      await this.initializeFirebaseMessaging();

      // Check if we need to update
      this.swRegistration.addEventListener('updatefound', () => {
        const newWorker = this.swRegistration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New version available');
              this.showUpdateNotification();
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Initialize Firebase Cloud Messaging
   */
  private async initializeFirebaseMessaging(): Promise<void> {
    try {
      if (messaging) {
        // Request permission and get FCM token
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          this.fcmToken = await getToken(messaging, {
            vapidKey: this.vapidPublicKey
          });
          console.log('✅ FCM Token obtained:', this.fcmToken);

          // Listen for foreground messages
          onMessage(messaging, (payload) => {
            console.log('📱 Foreground message received:', payload);
            this.showNotificationFromPayload(payload);
          });

          // Save FCM token to database
          if (this.fcmToken) {
            await this.saveFCMTokenToDatabase(this.fcmToken);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error initializing Firebase messaging:', error);
    }
  }

  /**
   * Show notification from Firebase payload
   */
  private showNotificationFromPayload(payload: any): void {
    if (Notification.permission === 'granted') {
      const notificationData = payload.notification || payload.data;
      const options = {
        body: notificationData.body || 'New notification',
        icon: notificationData.icon || '/icon-192x192.png',
        badge: '/icon-72x72.png',
        // vibrate: [200, 100, 200], // Removed due to TypeScript compatibility
        data: payload.data || {},
        actions: [
          {
            action: 'open',
            title: 'Open App',
            icon: '/icon-72x72.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/icon-72x72.png'
          }
        ],
        requireInteraction: true,
        tag: 'christiankit-notification',
        renotify: true
      };

      new Notification(notificationData.title || 'ChristianKit', options);
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('📱 Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Request notification permission and get FCM token
   */
  async requestPermissionAndToken(): Promise<string | null> {
    if (!this.isSupported) {
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted' && messaging) {
        this.fcmToken = await getToken(messaging, {
          vapidKey: this.vapidPublicKey
        });
        
        if (this.fcmToken) {
          await this.saveFCMTokenToDatabase(this.fcmToken);
          return this.fcmToken;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Error requesting permission and token:', error);
      return null;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.isSupported || !this.swRegistration) {
      console.warn('⚠️ Push notifications not supported or not initialized');
      return null;
    }

    try {
      // Check permission
      if (Notification.permission !== 'granted') {
        const permission = await this.requestPermission();
        if (permission !== 'granted') {
          console.warn('⚠️ Notification permission denied');
          return null;
        }
      }

      // Check if already subscribed
      const existingSubscription = await this.swRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('✅ Already subscribed to push notifications');
        return existingSubscription;
      }

      // Subscribe to push notifications
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('✅ Subscribed to push notifications:', subscription);

      // Save subscription to database
      await this.saveSubscriptionToDatabase(subscription);

      return subscription;
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPushNotifications(): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('✅ Unsubscribed from push notifications');

        // Remove subscription from database
        await this.removeSubscriptionFromDatabase(subscription);

        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  /**
   * Send a test notification
   */
  async sendTestNotification(): Promise<boolean> {
    try {
      if (Notification.permission === 'granted') {
        new Notification('🧪 Test Notification', {
          body: 'This is a test notification from ChristianKit!',
          icon: '/icon-192x192.png',
          badge: '/icon-72x72.png',
          // vibrate: [200, 100, 200], // Removed due to TypeScript compatibility
          data: { url: '/', type: 'test' }
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      return false;
    }
  }

  /**
   * Send a reminder notification
   */
  async sendReminderNotification(userName: string, reminderType: string): Promise<boolean> {
    if (!this.swRegistration) {
      return false;
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (!subscription) {
        console.warn('⚠️ No push subscription found');
        return false;
      }

      const notificationData = {
        title: this.getReminderTitle(reminderType),
        body: `Hello ${userName || 'there'}! It's time for your daily ${reminderType} session.`,
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        data: {
          url: '/',
          reminderType: reminderType
        }
      };

      // Send notification via our push server
      const response = await fetch('/api/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          notification: notificationData
        })
      });

      if (response.ok) {
        console.log(`✅ ${reminderType} reminder notification sent successfully`);
        return true;
      } else {
        console.error(`❌ Failed to send ${reminderType} reminder notification`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error sending ${reminderType} reminder notification:`, error);
      return false;
    }
  }

  /**
   * Get reminder title based on type
   */
  private getReminderTitle(reminderType: string): string {
    const titles: Record<string, string> = {
      'prayer': '🙏 Prayer Time',
      'bible': '📖 Bible Reading Time',
      'meditation': '🧘 Meditation Time',
      'journal': '📝 Journaling Time',
      'default': '🔔 Daily Reminder'
    };
    return titles[reminderType] || titles.default;
  }

  /**
   * Save FCM token to database
   */
  private async saveFCMTokenToDatabase(token: string): Promise<void> {
    try {
      if (!supabase) {
        console.warn('Supabase client not available');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No user found');
        return;
      }

      const tokenData = {
        user_id: user.id,
        fcm_token: token,
        is_active: true,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('fcm_tokens')
        .upsert(tokenData, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving FCM token:', error);
      } else {
        console.log('✅ FCM token saved to database');
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  /**
   * Save subscription to database
   */
  private async saveSubscriptionToDatabase(subscription: PushSubscription): Promise<void> {
    try {
      if (!supabase) {
        console.warn('Supabase client not available');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No user found');
        return;
      }

      const subscriptionData = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        is_active: true
      };

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving push subscription:', error);
      } else {
        console.log('✅ Push subscription saved to database');
      }
    } catch (error) {
      console.error('Error saving push subscription:', error);
    }
  }

  /**
   * Remove subscription from database
   */
  private async removeSubscriptionFromDatabase(subscription: PushSubscription): Promise<void> {
    try {
      if (!supabase) {
        console.warn('Supabase client not available');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No user found');
        return;
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing push subscription:', error);
      } else {
        console.log('✅ Push subscription removed from database');
      }
    } catch (error) {
      console.error('Error removing push subscription:', error);
    }
  }

  /**
   * Show update notification
   */
  private showUpdateNotification(): void {
    if (Notification.permission === 'granted') {
      new Notification('ChristianKit Update Available', {
        body: 'A new version is available. Click to refresh.',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        data: { url: '/' }
      });
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
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
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Check if push notifications are enabled
   */
  isEnabled(): boolean {
    return this.isSupported && Notification.permission === 'granted';
  }

  /**
   * Get current subscription status
   */
  async getSubscriptionStatus(): Promise<{
    isSupported: boolean;
    permission: NotificationPermission;
    isSubscribed: boolean;
    hasVapidKey: boolean;
    fcmToken: string | null;
  }> {
    const isSubscribed = this.swRegistration ? 
      !!(await this.swRegistration.pushManager.getSubscription()) : false;

    return {
      isSupported: this.isSupported,
      permission: Notification.permission,
      isSubscribed,
      hasVapidKey: !!this.vapidPublicKey,
      fcmToken: this.fcmToken
    };
  }

  /**
   * Get FCM token
   */
  getFCMToken(): string | null {
    return this.fcmToken;
  }
}

export const pushNotificationService = new PushNotificationService();
