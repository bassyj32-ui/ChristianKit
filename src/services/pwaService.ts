// PWA Service for ChristianKit
// Handles PWA-specific functionality like notifications, offline support, etc.

export interface PWANotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

class PWAService {
  private swRegistration: ServiceWorkerRegistration | null = null
  private isSupported = false

  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window
    this.initialize()
  }

  private async initialize() {
    if (!this.isSupported) {
      console.log('📱 PWA: Service Worker not supported')
      return
    }

    try {
      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js')
      console.log('✅ PWA: Service Worker registered:', this.swRegistration)

      // Listen for service worker updates
      this.swRegistration.addEventListener('updatefound', () => {
        console.log('🔄 PWA: Service Worker update found')
        const newWorker = this.swRegistration!.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🆕 PWA: New content available, please refresh')
              this.showUpdateAvailableNotification()
            }
          })
        }
      })

    } catch (error) {
      console.error('❌ PWA: Service Worker registration failed:', error)
    }
  }

  // Check if app is running as PWA
  isPWAInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('📱 PWA: Notifications not supported')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      console.log('🔔 PWA: Notification permission:', permission)
      return permission
    }

    return Notification.permission
  }

  // Show local notification (works when app is open)
  async showLocalNotification(options: PWANotificationOptions): Promise<void> {
    const permission = await this.requestNotificationPermission()
    
    if (permission !== 'granted') {
      console.log('🚫 PWA: Notification permission denied')
      return
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/icon-192x192.png',
      badge: options.badge || '/icon-192x192.png',
      tag: options.tag || 'christiankit-notification',
      data: options.data,
      requireInteraction: true
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
      
      // Handle notification click
      if (options.data?.action) {
        this.handleNotificationAction(options.data.action)
      }
    }

    // Auto close after 10 seconds
    setTimeout(() => {
      notification.close()
    }, 10000)
  }

  // Show daily encouragement notification
  async showDailyEncouragement(): Promise<void> {
    const encouragements = [
      "🙏 Time for a moment with God. Start your prayer session!",
      "📖 Ready to dive into Scripture today?",
      "✨ Your spiritual journey continues. Take a step forward!",
      "💖 God is waiting to spend time with you today.",
      "🌅 Start your day with prayer and reflection.",
      "🎯 Stay consistent in your faith journey.",
      "💪 Building spiritual habits, one day at a time."
    ]

    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)]

    await this.showLocalNotification({
      title: 'ChristianKit Daily Reminder',
      body: randomEncouragement,
      tag: 'daily-encouragement',
      data: { action: 'open-prayer' },
      actions: [
        { action: 'pray-now', title: '🙏 Pray Now' },
        { action: 'dismiss', title: '⏰ Later' }
      ]
    })
  }

  // Show streak broken notification
  async showStreakBrokenNotification(daysMissed: number): Promise<void> {
    const message = daysMissed === 1 
      ? "Don't worry! Get back on track with God today. 🙏"
      : `${daysMissed} days missed. God's grace is new every morning! ✨`

    await this.showLocalNotification({
      title: 'ChristianKit - Welcome Back',
      body: message,
      tag: 'streak-broken',
      data: { action: 'open-prayer' }
    })
  }

  // Show prayer completion celebration
  async showPrayerCompletedNotification(duration: number): Promise<void> {
    await this.showLocalNotification({
      title: 'Prayer Completed! 🎉',
      body: `Great job! You spent ${duration} minutes with God today.`,
      tag: 'prayer-completed',
      data: { action: 'open-dashboard' }
    })
  }

  // Handle notification actions
  private handleNotificationAction(action: string): void {
    console.log('🔔 PWA: Handling notification action:', action)
    
    switch (action) {
      case 'open-prayer':
        window.location.href = '/?tab=prayer&source=notification'
        break
      case 'open-dashboard':
        window.location.href = '/?tab=dashboard&source=notification'
        break
      case 'open-community':
        window.location.href = '/?tab=community&source=notification'
        break
      default:
        window.location.href = '/?source=notification'
    }
  }

  // Show update available notification
  private showUpdateAvailableNotification(): void {
    this.showLocalNotification({
      title: 'ChristianKit Update Available',
      body: 'A new version is ready. Refresh to update!',
      tag: 'app-update',
      data: { action: 'refresh' }
    })
  }

  // Schedule daily reminders (basic version)
  scheduleLocalReminders(): void {
    if (!this.isSupported) return

    // Set daily reminder for 8 AM
    const now = new Date()
    const reminder = new Date()
    reminder.setHours(8, 0, 0, 0)

    // If 8 AM has passed today, set for tomorrow
    if (now.getTime() > reminder.getTime()) {
      reminder.setDate(reminder.getDate() + 1)
    }

    const timeUntilReminder = reminder.getTime() - now.getTime()

    setTimeout(() => {
      this.showDailyEncouragement()
      
      // Schedule next day's reminder
      setInterval(() => {
        this.showDailyEncouragement()
      }, 24 * 60 * 60 * 1000) // 24 hours
      
    }, timeUntilReminder)

    console.log('⏰ PWA: Daily reminders scheduled for 8:00 AM')
  }

  // Store prayer data offline
  async storePrayerDataOffline(prayerData: any): Promise<void> {
    try {
      const stored = localStorage.getItem('offline-prayer-data') || '[]'
      const data = JSON.parse(stored)
      data.push({
        ...prayerData,
        timestamp: new Date().toISOString(),
        synced: false
      })
      
      localStorage.setItem('offline-prayer-data', JSON.stringify(data))
      console.log('💾 PWA: Prayer data stored offline')
      
      // Try to sync when online
      if (navigator.onLine && this.swRegistration) {
        this.swRegistration.sync?.register('prayer-sync')
      }
    } catch (error) {
      console.error('❌ PWA: Error storing offline data:', error)
    }
  }

  // Get offline prayer data
  getOfflinePrayerData(): any[] {
    try {
      const stored = localStorage.getItem('offline-prayer-data') || '[]'
      return JSON.parse(stored)
    } catch (error) {
      console.error('❌ PWA: Error getting offline data:', error)
      return []
    }
  }

  // Clear synced offline data
  clearSyncedOfflineData(): void {
    try {
      const stored = localStorage.getItem('offline-prayer-data') || '[]'
      const data = JSON.parse(stored)
      const unsynced = data.filter((item: any) => !item.synced)
      
      localStorage.setItem('offline-prayer-data', JSON.stringify(unsynced))
      console.log('🧹 PWA: Cleared synced offline data')
    } catch (error) {
      console.error('❌ PWA: Error clearing offline data:', error)
    }
  }

  // Check if app is online
  isOnline(): boolean {
    return navigator.onLine
  }

  // Listen for online/offline events
  setupNetworkListeners(
    onOnline?: () => void,
    onOffline?: () => void
  ): void {
    window.addEventListener('online', () => {
      console.log('🌐 PWA: App is online')
      onOnline?.()
      
      // Try to sync offline data
      if (this.swRegistration) {
        this.swRegistration.sync?.register('prayer-sync')
      }
    })

    window.addEventListener('offline', () => {
      console.log('📱 PWA: App is offline')
      onOffline?.()
    })
  }
}

// Create singleton instance
export const pwaService = new PWAService()

// Export for use in components
export default pwaService

