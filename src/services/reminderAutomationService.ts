import { supabase } from '../utils/supabase'
import { emailAutomationService } from './emailAutomationService'
import { userService } from './userService'

export interface ReminderSchedule {
  id: string
  user_id: string
  reminder_type: 'prayer' | 'bible' | 'meditation' | 'journal'
  time_of_day: string // HH:MM format
  timezone: string
  is_active: boolean
  days_of_week: string[] // ['monday', 'tuesday', etc.]
  created_at: string
  updated_at: string
}

export interface ReminderLog {
  id: string
  user_id: string
  reminder_type: string
  scheduled_for: string
  sent_at?: string
  status: 'pending' | 'sent' | 'failed'
  delivery_method: 'email' | 'push' | 'both'
  error_message?: string
}

export class ReminderAutomationService {
  private supabase = supabase

  /**
   * Send daily prayer reminder to all active users
   */
  async sendDailyPrayerReminders() {
    try {
      console.log('🔔 Starting daily prayer reminders...')
      
      // Get all users with active prayer reminders
      const activeUsers = await this.getUsersWithActiveReminders('prayer')
      
      console.log(`📧 Sending prayer reminders to ${activeUsers.length} users`)
      
      for (const user of activeUsers) {
        try {
          // Check if user should receive reminder today
          if (this.shouldSendReminderToday(user)) {
            await this.sendPrayerReminderToUser(user)
          }
        } catch (error) {
          console.error(`❌ Error sending reminder to user ${user.id}:`, error)
        }
      }
      
      console.log('✅ Daily prayer reminders completed')
    } catch (error) {
      console.error('❌ Error in sendDailyPrayerReminders:', error)
    }
  }

  /**
   * Send daily Bible reading reminder
   */
  async sendDailyBibleReminders() {
    try {
      console.log('🔔 Starting daily Bible reminders...')
      
      const activeUsers = await this.getUsersWithActiveReminders('bible')
      
      console.log(`📧 Sending Bible reminders to ${activeUsers.length} users`)
      
      for (const user of activeUsers) {
        try {
          if (this.shouldSendReminderToday(user)) {
            await this.sendBibleReminderToUser(user)
          }
        } catch (error) {
          console.error(`❌ Error sending Bible reminder to user ${user.id}:`, error)
        }
      }
      
      console.log('✅ Daily Bible reminders completed')
    } catch (error) {
      console.error('❌ Error in sendDailyBibleReminders:', error)
    }
  }

  /**
   * Send daily meditation reminder
   */
  async sendDailyMeditationReminders() {
    try {
      console.log('🔔 Starting daily meditation reminders...')
      
      const activeUsers = await this.getUsersWithActiveReminders('meditation')
      
      console.log(`📧 Sending meditation reminders to ${activeUsers.length} users`)
      
      for (const user of activeUsers) {
        try {
          if (this.shouldSendReminderToday(user)) {
            await this.sendMeditationReminderToUser(user)
          }
        } catch (error) {
          console.error(`❌ Error sending meditation reminder to user ${user.id}:`, error)
        }
      }
      
      console.log('✅ Daily meditation reminders completed')
    } catch (error) {
      console.error('❌ Error in sendDailyMeditationReminders:', error)
    }
  }

  /**
   * Get users with active reminders for a specific type
   */
  private async getUsersWithActiveReminders(reminderType: string): Promise<any[]> {
    if (!this.supabase) return []

    try {
      const { data, error } = await this.supabase
        .from('reminder_schedules')
        .select(`
          *,
          user_profiles!inner(email, full_name)
        `)
        .eq('reminder_type', reminderType)
        .eq('is_active', true)

      if (error) {
        console.error('❌ Error fetching active reminders:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('❌ Error in getUsersWithActiveReminders:', error)
      return []
    }
  }

  /**
   * Check if reminder should be sent today
   */
  private shouldSendReminderToday(user: any): boolean {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' })
    return user.days_of_week.includes(today)
  }

  /**
   * Send prayer reminder to specific user
   */
  private async sendPrayerReminderToUser(user: any) {
    try {
      const userProfile = user.user_profiles
      
      // Send email reminder
      await emailAutomationService.sendDailyPrayerReminder(
        user.user_id,
        userProfile.email,
        userProfile.full_name
      )
      
      // Log reminder sent
      await this.logReminderSent(user.user_id, 'prayer', 'email')
      
      console.log(`✅ Prayer reminder sent to ${userProfile.email}`)
    } catch (error) {
      console.error(`❌ Error sending prayer reminder to ${user.user_id}:`, error)
      await this.logReminderSent(user.user_id, 'prayer', 'failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  /**
   * Send Bible reminder to specific user
   */
  private async sendBibleReminderToUser(user: any) {
    try {
      const userProfile = user.user_profiles
      
      // Send Bible reading reminder email
      await emailAutomationService.sendEmail({
        to: userProfile.email,
        subject: '📖 Time for Your Daily Bible Reading',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">📖 Time for Your Daily Bible Reading</h1>
            <p>Hi ${userProfile.full_name || 'there'}!</p>
            <p>It's time for your daily Bible reading session. Dive into God's Word and grow in wisdom.</p>
            <p>Today's suggested reading: <strong>Psalm 119</strong></p>
            <p>Suggested time: <strong>20 minutes</strong></p>
            <p>Open ChristianKit now to start your Bible reading!</p>
            <p>Blessings,<br>The ChristianKit Team</p>
          </div>
        `
      })
      
      await this.logReminderSent(user.user_id, 'bible', 'email')
      console.log(`✅ Bible reminder sent to ${userProfile.email}`)
    } catch (error) {
      console.error(`❌ Error sending Bible reminder to ${user.user_id}:`, error)
      await this.logReminderSent(user.user_id, 'bible', 'failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  /**
   * Send meditation reminder to specific user
   */
  private async sendMeditationReminderToUser(user: any) {
    try {
      const userProfile = user.user_profiles
      
      // Send meditation reminder email
      await emailAutomationService.sendEmail({
        to: userProfile.email,
        subject: '🧘 Time for Your Daily Meditation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">🧘 Time for Your Daily Meditation</h1>
            <p>Hi ${userProfile.full_name || 'there'}!</p>
            <p>It's time for your daily meditation session. Find peace and clarity in God's presence.</p>
            <p>Today's meditation focus: <strong>Peace and Stillness</strong></p>
            <p>Suggested time: <strong>10 minutes</strong></p>
            <p>Open ChristianKit now to start your meditation!</p>
            <p>Blessings,<br>The ChristianKit Team</p>
          </div>
        `
      })
      
      await this.logReminderSent(user.user_id, 'meditation', 'email')
      console.log(`✅ Meditation reminder sent to ${userProfile.email}`)
    } catch (error) {
      console.error(`❌ Error sending meditation reminder to ${user.user_id}:`, error)
      await this.logReminderSent(user.user_id, 'meditation', 'failed', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  /**
   * Log reminder sent status
   */
  private async logReminderSent(userId: string, reminderType: string, status: 'sent' | 'failed', errorMessage?: string) {
    if (!this.supabase) return

    try {
      await this.supabase
        .from('reminder_logs')
        .insert({
          user_id: userId,
          reminder_type: reminderType,
          scheduled_for: new Date().toISOString(),
          status: status,
          delivery_method: 'email',
          error_message: errorMessage
        })
    } catch (error) {
      console.error('❌ Error logging reminder status:', error)
    }
  }

  /**
   * Create default reminder schedule for new user
   */
  async createDefaultReminderSchedule(userId: string) {
    if (!this.supabase) return null

    try {
      const defaultSchedule = {
        user_id: userId,
        reminder_type: 'prayer',
        time_of_day: '09:00',
        timezone: 'UTC',
        is_active: true,
        days_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }

      const { data, error } = await this.supabase
        .from('reminder_schedules')
        .insert(defaultSchedule)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating default reminder schedule:', error)
        return null
      }

      console.log('✅ Default reminder schedule created for user:', userId)
      return data
    } catch (error) {
      console.error('❌ Error in createDefaultReminderSchedule:', error)
      return null
    }
  }

  /**
   * Get user's reminder schedule
   */
  async getUserReminderSchedule(userId: string) {
    if (!this.supabase) return null

    try {
      const { data, error } = await this.supabase
        .from('reminder_schedules')
        .select('*')
        .eq('user_id', userId)

      if (error) {
        console.error('❌ Error fetching reminder schedule:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Error in getUserReminderSchedule:', error)
      return null
    }
  }

  /**
   * Update user's reminder schedule
   */
  async updateReminderSchedule(scheduleId: string, updates: Partial<ReminderSchedule>) {
    if (!this.supabase) return null

    try {
      const { data, error } = await this.supabase
        .from('reminder_schedules')
        .update(updates)
        .eq('id', scheduleId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating reminder schedule:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Error in updateReminderSchedule:', error)
      return null
    }
  }
}

// Export singleton instance
export const reminderAutomationService = new ReminderAutomationService()

