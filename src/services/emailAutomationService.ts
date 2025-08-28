import { supabase } from '../utils/supabase'
import { emailService } from './EmailService'
import { UserService } from './userService'

export interface EmailTrigger {
  id: string
  user_id: string
  trigger_type: 'welcome' | 'prayer_reminder' | 'bible_reminder' | 'achievement' | 'goal_met' | 'weekly_report'
  status: 'pending' | 'sent' | 'failed'
  scheduled_for: string
  created_at: string
  sent_at?: string
  error_message?: string
}

export class EmailAutomationService {
  private emailService = emailService.getInstance()
  private supabase = supabase

  /**
   * Send welcome email when user first signs up
   */
  async sendWelcomeEmail(userId: string, userEmail: string, userName?: string) {
    try {
      console.log('📧 Sending welcome email to:', userEmail)
      
      const emailContent = {
        to: userEmail,
        subject: 'Welcome to ChristianKit! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">Welcome to ChristianKit!</h1>
            <p>Hi ${userName || 'there'}!</p>
            <p>Welcome to your spiritual journey with ChristianKit. We're excited to help you grow in your faith through:</p>
            <ul>
              <li>📿 Prayer tracking and reminders</li>
              <li>📖 Bible reading progress</li>
              <li>🧘 Daily meditation sessions</li>
              <li>📝 Spiritual journaling</li>
              <li>🏆 Achievement tracking</li>
            </ul>
            <p>Start your journey today by setting up your first prayer session!</p>
            <p>Blessings,<br>The ChristianKit Team</p>
          </div>
        `,
        text: `Welcome to ChristianKit! Hi ${userName || 'there'}! Welcome to your spiritual journey with ChristianKit. We're excited to help you grow in your faith through prayer tracking, Bible reading, meditation, journaling, and achievement tracking. Start your journey today by setting up your first prayer session! Blessings, The ChristianKit Team`
      }

      const result = await this.emailService.sendEmail(emailContent)
      
      if (result) {
        console.log('✅ Welcome email sent successfully')
        // Log email sent in database
        await this.logEmailSent(userId, 'welcome', 'sent')
      } else {
        console.error('❌ Welcome email failed')
        await this.logEmailSent(userId, 'welcome', 'failed', 'Email service returned false')
      }
      
      return { success: result, error: result ? undefined : 'Email service returned false' }
    } catch (error) {
      console.error('❌ Error sending welcome email:', error)
      await this.logEmailSent(userId, 'welcome', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send daily prayer reminder
   */
  async sendDailyPrayerReminder(userId: string, userEmail: string, userName?: string) {
    try {
      console.log('📧 Sending daily prayer reminder to:', userEmail)
      
      const emailContent = {
        to: userEmail,
        subject: 'Time for Your Daily Prayer 🙏',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">Time for Your Daily Prayer</h1>
            <p>Hi ${userName || 'there'}!</p>
            <p>It's time for your daily prayer session. Take a moment to connect with God and strengthen your faith.</p>
            <p>Today's prayer focus: <strong>Gratitude and Thanksgiving</strong></p>
            <p>Suggested prayer time: <strong>15 minutes</strong></p>
            <p>Open ChristianKit now to start your prayer session!</p>
            <p>Blessings,<br>The ChristianKit Team</p>
          </div>
        `,
        text: `Time for Your Daily Prayer! Hi ${userName || 'there'}! It's time for your daily prayer session. Take a moment to connect with God and strengthen your faith. Today's prayer focus: Gratitude and Thanksgiving. Suggested prayer time: 15 minutes. Open ChristianKit now to start your prayer session! Blessings, The ChristianKit Team`
      }

      const result = await this.emailService.sendEmail(emailContent)
      
      if (result) {
        console.log('✅ Daily prayer reminder sent successfully')
        await this.logEmailSent(userId, 'prayer_reminder', 'sent')
      } else {
        console.error('❌ Daily prayer reminder failed')
        await this.logEmailSent(userId, 'prayer_reminder', 'failed', 'Email service returned false')
      }
      
      return { success: result, error: result ? undefined : 'Email service returned false' }
    } catch (error) {
      console.error('❌ Error sending daily prayer reminder:', error)
      await this.logEmailSent(userId, 'prayer_reminder', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send achievement celebration email
   */
  async sendAchievementEmail(userId: string, userEmail: string, achievementName: string, achievementDescription: string) {
    try {
      console.log('📧 Sending achievement email to:', userEmail)
      
      const emailContent = {
        to: userEmail,
        subject: `🎉 Achievement Unlocked: ${achievementName}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10B981;">🎉 Achievement Unlocked!</h1>
            <h2 style="color: #4F46E5;">${achievementName}</h2>
            <p>Congratulations! You've earned a new achievement in ChristianKit.</p>
            <p><strong>${achievementDescription}</strong></p>
            <p>Keep up the great work on your spiritual journey!</p>
            <p>Open ChristianKit to see all your achievements.</p>
            <p>Blessings,<br>The ChristianKit Team</p>
          </div>
        `,
        text: `🎉 Achievement Unlocked: ${achievementName}! Congratulations! You've earned a new achievement in ChristianKit. ${achievementDescription}. Keep up the great work on your spiritual journey! Open ChristianKit to see all your achievements. Blessings, The ChristianKit Team`
      }

      const result = await this.emailService.sendEmail(emailContent)
      
      if (result) {
        console.log('✅ Achievement email sent successfully')
        await this.logEmailSent(userId, 'achievement', 'sent')
      } else {
        console.error('❌ Achievement email failed')
        await this.logEmailSent(userId, 'achievement', 'failed', 'Email service returned false')
      }
      
      return { success: result, error: result ? undefined : 'Email service returned false' }
    } catch (error) {
      console.error('❌ Error sending achievement email:', error)
      await this.logEmailSent(userId, 'achievement', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Send weekly progress report
   */
  async sendWeeklyReport(userId: string, userEmail: string, userName?: string, weeklyStats?: any) {
    try {
      console.log('📧 Sending weekly report to:', userEmail)
      
      const emailContent = {
        to: userEmail,
        subject: '📊 Your Weekly ChristianKit Report',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #4F46E5;">📊 Weekly Progress Report</h1>
            <p>Hi ${userName || 'there'}!</p>
            <p>Here's your weekly spiritual journey summary:</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>This Week's Activities:</h3>
              <p>📿 Prayer Sessions: ${weeklyStats?.prayerSessions || 0}</p>
              <p>📖 Bible Reading: ${weeklyStats?.bibleMinutes || 0} minutes</p>
              <p>🧘 Meditation: ${weeklyStats?.meditationMinutes || 0} minutes</p>
              <p>🏆 Achievements: ${weeklyStats?.achievements || 0} unlocked</p>
            </div>
            <p>Keep up the great work! Your spiritual growth is inspiring.</p>
            <p>Open ChristianKit to continue your journey.</p>
            <p>Blessings,<br>The ChristianKit Team</p>
          </div>
        `,
        text: `📊 Your Weekly ChristianKit Report. Hi ${userName || 'there'}! Here's your weekly spiritual journey summary: Prayer Sessions: ${weeklyStats?.prayerSessions || 0}, Bible Reading: ${weeklyStats?.bibleMinutes || 0} minutes, Meditation: ${weeklyStats?.meditationMinutes || 0} minutes, Achievements: ${weeklyStats?.achievements || 0} unlocked. Keep up the great work! Your spiritual growth is inspiring. Open ChristianKit to continue your journey. Blessings, The ChristianKit Team`
      }

      const result = await this.emailService.sendEmail(emailContent)
      
      if (result) {
        console.log('✅ Weekly report sent successfully')
        await this.logEmailSent(userId, 'weekly_report', 'sent')
      } else {
        console.error('❌ Weekly report failed')
        await this.logEmailSent(userId, 'weekly_report', 'failed', 'Email service returned false')
      }
      
      return { success: result, error: result ? undefined : 'Email service returned false' }
    } catch (error) {
      console.error('❌ Error sending weekly report:', error)
      await this.logEmailSent(userId, 'weekly_report', 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  /**
   * Log email sent status in database
   */
  private async logEmailSent(userId: string, triggerType: string, status: 'sent' | 'failed', errorMessage?: string) {
    if (!this.supabase) return

    try {
      await this.supabase
        .from('email_triggers')
        .insert({
          user_id: userId,
          trigger_type: triggerType,
          status: status,
          scheduled_for: new Date().toISOString(),
          error_message: errorMessage
        })
    } catch (error) {
      console.error('❌ Error logging email status:', error)
    }
  }

  /**
   * Get user email preferences
   */
  async getUserEmailPreferences(userId: string) {
    if (!this.supabase) return null

    try {
      const { data, error } = await this.supabase
        .from('user_email_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('❌ Error fetching email preferences:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Error in getUserEmailPreferences:', error)
      return null
    }
  }

  /**
   * Update user email preferences
   */
  async updateUserEmailPreferences(userId: string, preferences: any) {
    if (!this.supabase) return null

    try {
      const { data, error } = await this.supabase
        .from('user_email_preferences')
        .upsert({
          user_id: userId,
          ...preferences
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating email preferences:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('❌ Error in updateUserEmailPreferences:', error)
      return null
    }
  }
}

// Export singleton instance
export const emailAutomationService = new EmailAutomationService()

