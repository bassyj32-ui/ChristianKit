import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'
import app from '../config/firebase'

interface PushNotification {
  id: string
  title: string
  body: string
  icon?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  silent?: boolean
}

interface NotificationSubscription {
  userId: string
  token: string
  device: string
  platform: string
  enabled: boolean
  createdAt: Date
  lastUsed: Date
}

class PushNotificationService {
  private messaging: any = null
  private isSupported: boolean = false
  private currentToken: string | null = null
  private onMessageCallback: ((notification: PushNotification) => void) | null = null

  constructor() {
    this.initialize()
  }

  private async initialize() {
    try {
      // Check if FCM is supported
      this.isSupported = await isSupported()
      
      if (this.isSupported) {
        try {
          this.messaging = getMessaging(app)
          console.log('Firebase Messaging initialized')
          
          // Set up message listener
          this.setupMessageListener()
        } catch (messagingError) {
          console.log('Firebase Messaging not available:', messagingError)
          this.isSupported = false
        }
      } else {
        console.log('Firebase Messaging not supported in this browser')
      }
    } catch (error) {
      console.error('Error initializing Firebase Messaging:', error)
      this.isSupported = false
    }
  }

  private setupMessageListener() {
    if (!this.messaging) return

    onMessage(this.messaging, (payload) => {
      console.log('Message received in foreground:', payload)
      
      const notification: PushNotification = {
        id: payload.messageId || Date.now().toString(),
        title: payload.notification?.title || 'ChristianKit',
        body: payload.notification?.body || 'You have a new notification',
        icon: payload.notification?.icon || '/favicon.ico',
        tag: 'christiankit-notification',
        data: payload.data || {},
        requireInteraction: true,
        silent: false
      }

      // Show notification if app is in foreground
      this.showNotification(notification)
      
      // Call callback if set
      if (this.onMessageCallback) {
        this.onMessageCallback(notification)
      }
    })
  }

  // Request notification permissions and get FCM token
  async requestPermissionAndToken(): Promise<string | null> {
    if (!this.isSupported || !this.messaging) {
      console.log('Firebase Messaging not supported')
      return null
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        // Get FCM token
        const token = await getToken(this.messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        })
        
        this.currentToken = token
        console.log('FCM Token obtained:', token)
        
        // Save token to cloud
        await this.saveTokenToCloud(token)
        
        return token
      } else {
        console.log('Notification permission denied')
        return null
      }
    } catch (error) {
      console.error('Error getting FCM token:', error)
      return null
    }
  }

  // Save FCM token to cloud
  private async saveTokenToCloud(token: string) {
    try {
      // This would typically save to your backend
      // For now, we'll save to localStorage
      const subscriptions = JSON.parse(localStorage.getItem('pushSubscriptions') || '[]')
      
      const subscription: NotificationSubscription = {
        userId: 'current-user', // Replace with actual user ID
        token: token,
        device: navigator.userAgent,
        platform: this.getPlatform(),
        enabled: true,
        createdAt: new Date(),
        lastUsed: new Date()
      }
      
      // Update or add subscription
      const existingIndex = subscriptions.findIndex((sub: any) => sub.token === token)
      if (existingIndex >= 0) {
        subscriptions[existingIndex] = subscription
      } else {
        subscriptions.push(subscription)
      }
      
      localStorage.setItem('pushSubscriptions', JSON.stringify(subscriptions))
      console.log('Push subscription saved to cloud')
    } catch (error) {
      console.error('Error saving push subscription:', error)
    }
  }

  // Get platform information
  private getPlatform(): string {
    if (/Android/i.test(navigator.userAgent)) return 'android'
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return 'ios'
    if (/Windows/i.test(navigator.userAgent)) return 'windows'
    if (/Mac/i.test(navigator.userAgent)) return 'mac'
    if (/Linux/i.test(navigator.userAgent)) return 'linux'
    return 'web'
  }

  // Show notification (for foreground messages)
  private showNotification(notification: PushNotification) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    const options: NotificationOptions = {
      body: notification.body,
      icon: notification.icon,
      tag: notification.tag,
      data: notification.data,
      requireInteraction: notification.requireInteraction,
      silent: notification.silent
    }

    new Notification(notification.title, options)
  }

  // Send push notification to specific user
  async sendPushNotification(userId: string, notification: PushNotification): Promise<boolean> {
    try {
      // This would typically send to your backend/FCM server
      // For now, we'll simulate sending
      console.log('Sending push notification to user:', userId, notification)
      
      // In a real implementation, you would:
      // 1. Get user's FCM token from your backend
      // 2. Send via FCM API
      // 3. Handle delivery status
      
      return true
    } catch (error) {
      console.error('Error sending push notification:', error)
      return false
    }
  }

  // Send prayer reminder notification
  async sendPrayerReminder(userId: string, reminder: any): Promise<boolean> {
    const notification: PushNotification = {
      id: `prayer-${reminder.id}`,
      title: '⏰ Prayer Reminder',
      body: reminder.message || 'Time for your prayer session',
      icon: '/favicon.ico',
      tag: 'prayer-reminder',
      data: {
        type: 'prayer-reminder',
        reminderId: reminder.id,
        action: 'start-prayer'
      },
      requireInteraction: true,
      silent: false
    }

    return this.sendPushNotification(userId, notification)
  }

  // Send community notification
  async sendCommunityNotification(userId: string, post: any): Promise<boolean> {
    const notification: PushNotification = {
      id: `community-${post.id}`,
      title: '👥 New Community Post',
      body: `New post from ${post.authorName}: ${post.content.substring(0, 50)}...`,
      icon: '/favicon.ico',
      tag: 'community-post',
      data: {
        type: 'community-post',
        postId: post.id,
        action: 'view-post'
      },
      requireInteraction: false,
      silent: false
    }

    return this.sendPushNotification(userId, notification)
  }

  // Send daily motivation notification
  async sendDailyMotivation(userId: string, message: string): Promise<boolean> {
    const notification: PushNotification = {
      id: `daily-${Date.now()}`,
      title: '✨ Daily Motivation',
      body: message,
      icon: '/favicon.ico',
      tag: 'daily-motivation',
      data: {
        type: 'daily-motivation',
        action: 'view-motivation'
      },
      requireInteraction: false,
      silent: false
    }

    return this.sendPushNotification(userId, notification)
  }

  // Set callback for foreground messages
  setOnMessageCallback(callback: (notification: PushNotification) => void) {
    this.onMessageCallback = callback
  }

  // Get current FCM token
  getCurrentToken(): string | null {
    return this.currentToken
  }

  // Check if push notifications are supported
  isPushSupported(): boolean {
    return this.isSupported
  }

  // Check if permission is granted
  async hasPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false
    return Notification.permission === 'granted'
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<void> {
    try {
      // Remove token from cloud
      if (this.currentToken) {
        // This would typically remove from your backend
        const subscriptions = JSON.parse(localStorage.getItem('pushSubscriptions') || '[]')
        const filtered = subscriptions.filter((sub: any) => sub.token !== this.currentToken)
        localStorage.setItem('pushSubscriptions', JSON.stringify(filtered))
      }
      
      this.currentToken = null
      console.log('Unsubscribed from push notifications')
    } catch (error) {
      console.error('Error unsubscribing:', error)
    }
  }
}

export const pushNotificationService = new PushNotificationService()
