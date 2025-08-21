import { subscriptionService } from './subscriptionService'
import { pwaService } from './pwaService'

interface ReEngagementMessage {
  id: string
  title: string
  message: string
  verse?: string
  verseReference?: string
  action?: {
    text: string
    type: 'prayer' | 'bible' | 'community' | 'journal'
    duration?: number
  }
  timing: 'morning' | 'afternoon' | 'evening' | 'missed'
  priority: 'low' | 'medium' | 'high'
}

interface UserEngagementData {
  lastActive: string
  streakDays: number
  missedDays: number
  preferredTimes: {
    morning?: string
    evening?: string
  }
  completedToday: {
    prayer: boolean
    bible: boolean
    journal: boolean
  }
}

class DailyReEngagementService {
  private engagementMessages: ReEngagementMessage[] = [
    // Morning Messages
    {
      id: 'morning-1',
      title: 'Good Morning, Beloved! ☀️',
      message: 'God has given you a fresh start today. Begin with His presence and watch how He transforms your day.',
      verse: 'This is the day the Lord has made; let us rejoice and be glad in it.',
      verseReference: 'Psalm 118:24',
      action: { text: 'Start with 5 minutes of prayer', type: 'prayer', duration: 5 },
      timing: 'morning',
      priority: 'high'
    },
    {
      id: 'morning-2',
      title: 'Rise and Shine! 🌅',
      message: 'Before the world gets busy, spend these quiet moments with the One who loves you most.',
      verse: 'In the morning, Lord, you hear my voice; in the morning I lay my requests before you and wait expectantly.',
      verseReference: 'Psalm 5:3',
      action: { text: 'Read today\'s verse', type: 'bible' },
      timing: 'morning',
      priority: 'medium'
    },
    {
      id: 'morning-3',
      title: 'New Mercies Await! 💝',
      message: 'His mercies are new every morning. Great is His faithfulness to you!',
      verse: 'Because of the Lord\'s great love we are not consumed, for his compassions never fail. They are new every morning; great is your faithfulness.',
      verseReference: 'Lamentations 3:22-23',
      action: { text: 'Journal about God\'s faithfulness', type: 'journal' },
      timing: 'morning',
      priority: 'medium'
    },

    // Afternoon Messages
    {
      id: 'afternoon-1',
      title: 'Midday Reset 🙏',
      message: 'Take a moment to pause and remember that God is with you in every moment of this day.',
      verse: 'Be still, and know that I am God.',
      verseReference: 'Psalm 46:10',
      action: { text: 'Take a 3-minute prayer break', type: 'prayer', duration: 3 },
      timing: 'afternoon',
      priority: 'medium'
    },
    {
      id: 'afternoon-2',
      title: 'Stay Strong! 💪',
      message: 'You\'re doing great! God sees your efforts and is pleased with your faithful heart.',
      verse: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.',
      verseReference: 'Galatians 6:9',
      action: { text: 'Continue your spiritual journey', type: 'prayer', duration: 5 },
      timing: 'afternoon',
      priority: 'low'
    },

    // Evening Messages
    {
      id: 'evening-1',
      title: 'End the Day with Gratitude 🌙',
      message: 'Reflect on God\'s goodness today and rest in His peace tonight.',
      verse: 'Give thanks to the Lord, for he is good; his love endures forever.',
      verseReference: 'Psalm 107:1',
      action: { text: 'Write down 3 things you\'re grateful for', type: 'journal' },
      timing: 'evening',
      priority: 'high'
    },
    {
      id: 'evening-2',
      title: 'Rest in His Peace ✨',
      message: 'You are loved, you are chosen, you are His. Sleep well knowing you belong to the King.',
      verse: 'In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety.',
      verseReference: 'Psalm 4:8',
      action: { text: 'End with evening prayer', type: 'prayer', duration: 5 },
      timing: 'evening',
      priority: 'medium'
    },

    // Missed Day Messages
    {
      id: 'missed-1',
      title: 'Grace Over Guilt 💙',
      message: 'You missed yesterday, and that\'s okay. God\'s love for you hasn\'t changed one bit. Let\'s start fresh today!',
      verse: 'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.',
      verseReference: '1 John 1:9',
      action: { text: 'Begin again with prayer', type: 'prayer', duration: 5 },
      timing: 'missed',
      priority: 'high'
    },
    {
      id: 'missed-2',
      title: 'Come Back Home 🏠',
      message: 'Just like the prodigal son, your Father is waiting with open arms. There\'s no shame in starting again.',
      verse: 'But while he was still a long way off, his father saw him and was filled with compassion for him.',
      verseReference: 'Luke 15:20',
      action: { text: 'Take one small step today', type: 'prayer', duration: 3 },
      timing: 'missed',
      priority: 'high'
    },
    {
      id: 'missed-3',
      title: 'New Beginning 🌱',
      message: 'Every saint has a past, and every sinner has a future. Today is your fresh start!',
      verse: 'Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!',
      verseReference: '2 Corinthians 5:17',
      action: { text: 'Restart your journey', type: 'prayer', duration: 5 },
      timing: 'missed',
      priority: 'medium'
    }
  ]

  // Check if user has pro access to daily re-engagement
  private checkProAccess(): boolean {
    const featureCheck = subscriptionService.checkProFeature('dailyReEngagement')
    return featureCheck.hasAccess
  }

  // Get user engagement data from localStorage
  private getUserEngagementData(): UserEngagementData {
    const today = new Date().toDateString()
    const defaultData: UserEngagementData = {
      lastActive: today,
      streakDays: 0,
      missedDays: 0,
      preferredTimes: {
        morning: '08:00',
        evening: '20:00'
      },
      completedToday: {
        prayer: false,
        bible: false,
        journal: false
      }
    }

    try {
      const stored = localStorage.getItem('userEngagementData')
      if (stored) {
        const data = JSON.parse(stored)
        // Update completedToday if it's a new day
        if (data.lastActive !== today) {
          data.completedToday = { prayer: false, bible: false, journal: false }
          data.lastActive = today
        }
        return { ...defaultData, ...data }
      }
    } catch (error) {
      console.error('Error loading engagement data:', error)
    }

    return defaultData
  }

  // Save user engagement data
  private saveUserEngagementData(data: UserEngagementData): void {
    try {
      localStorage.setItem('userEngagementData', JSON.stringify(data))
    } catch (error) {
      console.error('Error saving engagement data:', error)
    }
  }

  // Get appropriate message based on user state
  private getContextualMessage(userData: UserEngagementData): ReEngagementMessage {
    const now = new Date()
    const hour = now.getHours()
    
    // Determine timing
    let timing: 'morning' | 'afternoon' | 'evening' | 'missed'
    if (userData.missedDays > 0) {
      timing = 'missed'
    } else if (hour < 12) {
      timing = 'morning'
    } else if (hour < 18) {
      timing = 'afternoon'
    } else {
      timing = 'evening'
    }

    // Filter messages by timing
    const relevantMessages = this.engagementMessages.filter(msg => msg.timing === timing)
    
    // Select message based on priority and randomization
    const highPriorityMessages = relevantMessages.filter(msg => msg.priority === 'high')
    const mediumPriorityMessages = relevantMessages.filter(msg => msg.priority === 'medium')
    const lowPriorityMessages = relevantMessages.filter(msg => msg.priority === 'low')

    let selectedMessages = []
    if (highPriorityMessages.length > 0) {
      selectedMessages = highPriorityMessages
    } else if (mediumPriorityMessages.length > 0) {
      selectedMessages = mediumPriorityMessages
    } else {
      selectedMessages = lowPriorityMessages
    }

    // Return random message from selected pool
    const randomIndex = Math.floor(Math.random() * selectedMessages.length)
    return selectedMessages[randomIndex] || this.engagementMessages[0]
  }

  // Send daily encouragement message
  async sendDailyEncouragement(): Promise<void> {
    if (!this.checkProAccess()) {
      console.log('Daily re-engagement is a Pro feature')
      return
    }

    try {
      const userData = this.getUserEngagementData()
      const message = this.getContextualMessage(userData)

      // Send notification
      await pwaService.showLocalNotification({
        title: message.title,
        body: message.message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: `daily-engagement-${message.id}`,
        requireInteraction: true,
        actions: message.action ? [
          {
            action: 'open-app',
            title: message.action.text
          }
        ] : undefined
      })

      console.log('✅ Daily encouragement sent:', message.title)

    } catch (error) {
      console.error('Error sending daily encouragement:', error)
    }
  }

  // Schedule daily reminders
  async scheduleDailyReminders(): Promise<void> {
    if (!this.checkProAccess()) {
      console.log('Daily re-engagement scheduling is a Pro feature')
      return
    }

    try {
      const userData = this.getUserEngagementData()
      
      // Schedule morning reminder
      if (userData.preferredTimes.morning) {
        // In a real app, you'd use a more sophisticated scheduling system
        // For now, we'll just set up the next morning reminder
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const [hour, minute] = userData.preferredTimes.morning.split(':')
        tomorrow.setHours(parseInt(hour), parseInt(minute), 0, 0)

        console.log('📅 Scheduled morning reminder for:', tomorrow.toLocaleString())
      }

      // Schedule evening reminder
      if (userData.preferredTimes.evening) {
        const today = new Date()
        const [hour, minute] = userData.preferredTimes.evening.split(':')
        today.setHours(parseInt(hour), parseInt(minute), 0, 0)

        // Only schedule if time hasn't passed today
        if (today > new Date()) {
          console.log('📅 Scheduled evening reminder for:', today.toLocaleString())
        }
      }

    } catch (error) {
      console.error('Error scheduling daily reminders:', error)
    }
  }

  // Mark activity completed
  async markActivityCompleted(activity: 'prayer' | 'bible' | 'journal'): Promise<void> {
    try {
      const userData = this.getUserEngagementData()
      userData.completedToday[activity] = true
      
      // Update streak if this is the first activity today
      const hasAnyActivity = Object.values(userData.completedToday).some(completed => completed)
      if (hasAnyActivity && userData.missedDays > 0) {
        userData.missedDays = 0
        userData.streakDays += 1
      }

      this.saveUserEngagementData(userData)

      // Send encouragement for completion
      if (this.checkProAccess()) {
        await this.sendCompletionEncouragement(activity)
      }

    } catch (error) {
      console.error('Error marking activity completed:', error)
    }
  }

  // Send encouragement for completing an activity
  private async sendCompletionEncouragement(activity: 'prayer' | 'bible' | 'journal'): Promise<void> {
    const encouragementMessages = {
      prayer: {
        title: 'Beautiful Prayer Time! 🙏',
        body: 'Your heart-to-heart conversation with God brings Him joy. Well done!'
      },
      bible: {
        title: 'Scripture Success! 📖',
        body: 'You\'ve just fed your soul with God\'s Word. Let it transform your thoughts today!'
      },
      journal: {
        title: 'Faithful Reflection! ✍️',
        body: 'Capturing God\'s work in your life is a beautiful practice. Keep it up!'
      }
    }

    const message = encouragementMessages[activity]
    
    try {
      await pwaService.showLocalNotification({
        title: message.title,
        body: message.body,
        icon: '/icon-192x192.png',
        tag: `completion-${activity}-${Date.now()}`
      })
    } catch (error) {
      console.error('Error sending completion encouragement:', error)
    }
  }

  // Check missed days and update user data
  async checkMissedDays(): Promise<void> {
    try {
      const userData = this.getUserEngagementData()
      const today = new Date().toDateString()
      const lastActive = new Date(userData.lastActive).toDateString()

      if (lastActive !== today) {
        const daysDiff = Math.floor((new Date(today).getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff > 1) {
          userData.missedDays = daysDiff - 1
          userData.streakDays = 0 // Reset streak
          this.saveUserEngagementData(userData)

          // Send re-engagement message for missed days
          if (this.checkProAccess() && userData.missedDays >= 2) {
            await this.sendDailyEncouragement()
          }
        }
      }

    } catch (error) {
      console.error('Error checking missed days:', error)
    }
  }

  // Get user engagement statistics
  getUserStats(): { streakDays: number; missedDays: number; completedToday: any } {
    const userData = this.getUserEngagementData()
    return {
      streakDays: userData.streakDays,
      missedDays: userData.missedDays,
      completedToday: userData.completedToday
    }
  }

  // Update user preferred reminder times
  async updatePreferredTimes(morning?: string, evening?: string): Promise<void> {
    try {
      const userData = this.getUserEngagementData()
      if (morning) userData.preferredTimes.morning = morning
      if (evening) userData.preferredTimes.evening = evening
      this.saveUserEngagementData(userData)

      // Reschedule with new times
      await this.scheduleDailyReminders()

    } catch (error) {
      console.error('Error updating preferred times:', error)
    }
  }

  // Initialize the service
  async initialize(): Promise<void> {
    if (!this.checkProAccess()) {
      console.log('Daily re-engagement service requires Pro subscription')
      return
    }

    try {
      await this.checkMissedDays()
      await this.scheduleDailyReminders()
      console.log('✅ Daily re-engagement service initialized')
    } catch (error) {
      console.error('Error initializing daily re-engagement service:', error)
    }
  }
}

export const dailyReEngagementService = new DailyReEngagementService()
