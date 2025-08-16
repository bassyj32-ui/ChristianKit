interface PrayerReminder {
  id: string
  title: string
  message: string
  time: string // HH:MM format
  days: number[] // 0-6 (Sunday-Saturday)
  enabled: boolean
  lastTriggered?: string
  nextTrigger?: string
  type: 'daily' | 'custom' | 'prayer-time'
}

interface ReminderNotification {
  id: string
  title: string
  body: string
  timestamp: string
  read: boolean
  actionUrl?: string
}

class ReminderService {
  private reminders: PrayerReminder[] = []
  private notifications: ReminderNotification[] = []
  private checkInterval: NodeJS.Timeout | null = null

  constructor() {
    this.loadReminders()
    this.loadNotifications()
    this.startReminderCheck()
  }

  // Load reminders from localStorage
  private loadReminders(): void {
    try {
      const saved = localStorage.getItem('prayerReminders')
      if (saved) {
        this.reminders = JSON.parse(saved)
      } else {
        // Create default reminders
        this.reminders = [
          {
            id: '1',
            title: 'Morning Prayer',
            message: 'Time for your morning prayer and devotion',
            time: '07:00',
            days: [0, 1, 2, 3, 4, 5, 6],
            enabled: true,
            type: 'daily'
          },
          {
            id: '2',
            title: 'Evening Prayer',
            message: 'Time for your evening prayer and reflection',
            time: '21:00',
            days: [0, 1, 2, 3, 4, 5, 6],
            enabled: true,
            type: 'daily'
          }
        ]
        this.saveReminders()
      }
    } catch (error) {
      console.error('Error loading reminders:', error)
      this.reminders = []
    }
  }

  // Save reminders to localStorage
  private saveReminders(): void {
    try {
      localStorage.setItem('prayerReminders', JSON.stringify(this.reminders))
    } catch (error) {
      console.error('Error saving reminders:', error)
    }
  }

  // Load notifications from localStorage
  private loadNotifications(): void {
    try {
      const saved = localStorage.getItem('reminderNotifications')
      if (saved) {
        this.notifications = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      this.notifications = []
    }
  }

  // Save notifications to localStorage
  private saveNotifications(): void {
    try {
      localStorage.setItem('reminderNotifications', JSON.stringify(this.notifications))
    } catch (error) {
      console.error('Error saving notifications:', error)
    }
  }

  // Start checking for reminders
  private startReminderCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    this.checkInterval = setInterval(() => {
      this.checkReminders()
    }, 60000) // Check every minute
  }

  // Check if any reminders should be triggered
  private checkReminders(): void {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const currentDay = now.getDay()

    this.reminders.forEach(reminder => {
      if (!reminder.enabled) return
      if (!reminder.days.includes(currentDay)) return
      if (reminder.time !== currentTime) return

      // Check if we already triggered this reminder today
      const today = now.toDateString()
      if (reminder.lastTriggered === today) return

      this.triggerReminder(reminder)
    })
  }

  // Trigger a reminder
  private triggerReminder(reminder: PrayerReminder): void {
    // Update last triggered
    reminder.lastTriggered = new Date().toDateString()
    this.saveReminders()

    // Create notification
    const notification: ReminderNotification = {
      id: Date.now().toString(),
      title: reminder.title,
      body: reminder.message,
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: '/prayer'
    }

    this.notifications.unshift(notification)
    this.saveNotifications()

    // Show browser notification if supported
    this.showBrowserNotification(reminder)

    // Update next trigger time
    this.updateNextTrigger(reminder)
  }

  // Show browser notification
  private showBrowserNotification(reminder: PrayerReminder): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(reminder.title, {
        body: reminder.message,
        icon: '/favicon.ico',
        tag: reminder.id
      })
    }
  }

  // Update next trigger time
  private updateNextTrigger(reminder: PrayerReminder): void {
    const now = new Date()
    const [hours, minutes] = reminder.time.split(':').map(Number)
    
    let nextTrigger = new Date(now)
    nextTrigger.setHours(hours, minutes, 0, 0)

    // If time has passed today, set for tomorrow
    if (nextTrigger <= now) {
      nextTrigger.setDate(nextTrigger.getDate() + 1)
    }

    reminder.nextTrigger = nextTrigger.toISOString()
    this.saveReminders()
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  // Get all reminders
  getReminders(): PrayerReminder[] {
    return [...this.reminders]
  }

  // Add new reminder
  addReminder(reminder: Omit<PrayerReminder, 'id' | 'lastTriggered' | 'nextTrigger'>): string {
    const newReminder: PrayerReminder = {
      ...reminder,
      id: Date.now().toString(),
      lastTriggered: undefined,
      nextTrigger: undefined
    }

    this.reminders.push(newReminder)
    this.saveReminders()
    this.updateNextTrigger(newReminder)
    
    return newReminder.id
  }

  // Update reminder
  updateReminder(id: string, updates: Partial<PrayerReminder>): boolean {
    const index = this.reminders.findIndex(r => r.id === id)
    if (index === -1) return false

    this.reminders[index] = { ...this.reminders[index], ...updates }
    this.saveReminders()
    
    if (updates.time || updates.days) {
      this.updateNextTrigger(this.reminders[index])
    }
    
    return true
  }

  // Delete reminder
  deleteReminder(id: string): boolean {
    const index = this.reminders.findIndex(r => r.id === id)
    if (index === -1) return false

    this.reminders.splice(index, 1)
    this.saveReminders()
    return true
  }

  // Toggle reminder
  toggleReminder(id: string): boolean {
    const reminder = this.reminders.find(r => r.id === id)
    if (!reminder) return false

    reminder.enabled = !reminder.enabled
    this.saveReminders()
    
    if (reminder.enabled) {
      this.updateNextTrigger(reminder)
    }
    
    return true
  }

  // Get all notifications
  getNotifications(): ReminderNotification[] {
    return [...this.notifications]
  }

  // Mark notification as read
  markNotificationAsRead(id: string): boolean {
    const notification = this.notifications.find(n => n.id === id)
    if (!notification) return false

    notification.read = true
    this.saveNotifications()
    return true
  }

  // Mark all notifications as read
  markAllNotificationsAsRead(): void {
    this.notifications.forEach(n => n.read = true)
    this.saveNotifications()
  }

  // Delete notification
  deleteNotification(id: string): boolean {
    const index = this.notifications.findIndex(n => n.id === id)
    if (index === -1) return false

    this.notifications.splice(index, 1)
    this.saveNotifications()
    return true
  }

  // Clear all notifications
  clearAllNotifications(): void {
    this.notifications = []
    this.saveNotifications()
  }

  // Get unread notification count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  // Get upcoming reminders for today
  getUpcomingReminders(): PrayerReminder[] {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5)
    const currentDay = now.getDay()

    return this.reminders
      .filter(r => r.enabled && r.days.includes(currentDay))
      .filter(r => r.time > currentTime)
      .sort((a, b) => a.time.localeCompare(b.time))
  }

  // Clean up old notifications (older than 30 days)
  cleanupOldNotifications(): void {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    this.notifications = this.notifications.filter(n => 
      new Date(n.timestamp) > thirtyDaysAgo
    )
    this.saveNotifications()
  }

  // Stop the service
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}

export const reminderService = new ReminderService()
