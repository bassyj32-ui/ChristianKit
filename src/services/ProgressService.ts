import { supabase } from '../utils/supabase'

export interface UserSession {
  id?: string
  user_id: string
  activity_type: 'prayer' | 'bible' | 'meditation' | 'journal'
  duration_minutes: number
  completed: boolean
  completed_duration?: number
  session_date: string
  notes?: string
}

export interface UserAchievement {
  id?: string
  user_id: string
  achievement_type: string
  achievement_name: string
  description: string
  icon: string
  unlocked_at: string
  metadata?: any
}

export interface UserGoal {
  id?: string
  user_id: string
  activity_type: 'prayer' | 'bible' | 'meditation' | 'journal'
  daily_minutes: number
  weekly_sessions: number
}

export interface WeeklyProgress {
  weekStart: string
  sessions: UserSession[]
  calculatedStats: {
    prayer: number
    bible: number
    meditation: number
    journal: number
  }
}

export interface AchievementDefinition {
  type: string
  name: string
  description: string
  icon: string
  condition: (sessions: UserSession[], goals: UserGoal[]) => boolean
  metadata?: any
}

export class ProgressService {
  private static achievements: AchievementDefinition[] = [
    {
      type: 'first_session',
      name: 'First Steps',
      description: 'Complete your first spiritual session',
      icon: '🌱',
      condition: (sessions) => sessions.length >= 1
    },
    {
      type: 'week_streak',
      name: 'Week Warrior',
      description: 'Complete sessions for 7 consecutive days',
      icon: '🔥',
      condition: (sessions) => {
        const last7Days = this.getLastNDays(7)
        return last7Days.every(date => 
          sessions.some(session => session.session_date === date && session.completed)
        )
      }
    },
    {
      type: 'month_streak',
      name: 'Monthly Master',
      description: 'Complete sessions for 30 consecutive days',
      icon: '👑',
      condition: (sessions) => {
        const last30Days = this.getLastNDays(30)
        return last30Days.every(date => 
          sessions.some(session => session.session_date === date && session.completed)
        )
      }
    },
    {
      type: 'prayer_master',
      name: 'Prayer Master',
      description: 'Complete 50 prayer sessions',
      icon: '🙏',
      condition: (sessions) => 
        sessions.filter(s => s.activity_type === 'prayer' && s.completed).length >= 50
    },
    {
      type: 'bible_scholar',
      name: 'Bible Scholar',
      description: 'Complete 50 bible study sessions',
      icon: '📖',
      condition: (sessions) => 
        sessions.filter(s => s.activity_type === 'bible' && s.completed).length >= 50
    },
    {
      type: 'meditation_guru',
      name: 'Meditation Guru',
      description: 'Complete 50 meditation sessions',
      icon: '🧘',
      condition: (sessions) => 
        sessions.filter(s => s.activity_type === 'meditation' && s.completed).length >= 50
    },
    {
      type: 'journal_keeper',
      name: 'Journal Keeper',
      description: 'Complete 50 journal sessions',
      icon: '📝',
      condition: (sessions) => 
        sessions.filter(s => s.activity_type === 'journal' && s.completed).length >= 50
    },
    {
      type: 'perfect_week',
      name: 'Perfect Week',
      description: 'Complete all planned sessions for a week',
      icon: '⭐',
      condition: (sessions, goals) => {
        const last7Days = this.getLastNDays(7)
        const totalGoalSessions = goals.reduce((sum, goal) => sum + goal.weekly_sessions, 0)
        const completedSessions = last7Days.reduce((sum, date) => 
          sum + sessions.filter(s => s.session_date === date && s.completed).length, 0
        )
        return completedSessions >= totalGoalSessions
      }
    }
  ]

  // Record a new session
  static async recordSession(session: Omit<UserSession, 'id'>): Promise<UserSession> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    const { data, error } = await supabase
      .from('user_sessions')
      .upsert({
        user_id: session.user_id,
        activity_type: session.activity_type,
        duration_minutes: session.duration_minutes,
        completed: session.completed,
        completed_duration: session.completed_duration,
        session_date: session.session_date,
        notes: session.notes
      })
      .select()
      .single()

    if (error) throw error

    // Check for new achievements after recording session
    await this.checkAchievements(session.user_id)

    return data
  }

  // Get user sessions for a date range
  static async getUserSessions(userId: string, startDate: string, endDate: string): Promise<UserSession[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('session_date', startDate)
      .lte('session_date', endDate)
      .order('session_date', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Get weekly progress
  static async getWeeklyProgress(userId: string, weekStart: string): Promise<WeeklyProgress> {
    const weekEnd = this.addDays(weekStart, 6)
    const sessions = await this.getUserSessions(userId, weekStart, weekEnd)
    const goals = await this.getUserGoals(userId)

    const calculatedStats = this.calculateWeeklyStats(sessions, goals)

    return {
      weekStart,
      sessions,
      calculatedStats
    }
  }

  // Calculate weekly statistics
  static calculateWeeklyStats(sessions: UserSession[], goals: UserGoal[]): { prayer: number; bible: number; meditation: number; journal: number } {
    const stats = {
      prayer: 0,
      bible: 0,
      meditation: 0,
      journal: 0
    }

    const activityTypes: ('prayer' | 'bible' | 'meditation' | 'journal')[] = ['prayer', 'bible', 'meditation', 'journal']

    activityTypes.forEach(activityType => {
      const activitySessions = sessions.filter(s => s.activity_type === activityType && s.completed)
      const goal = goals.find(g => g.activity_type === activityType)
      
      if (goal && activitySessions.length > 0) {
        // Calculate percentage based on completed duration vs goal
        const totalCompletedMinutes = activitySessions.reduce((sum, session) => 
          sum + (session.completed_duration || session.duration_minutes), 0
        )
        const totalGoalMinutes = goal.daily_minutes * 7 // Weekly goal
        stats[activityType] = Math.min(100, Math.round((totalCompletedMinutes / totalGoalMinutes) * 100))
      }
    })

    return stats
  }

  // Get user goals
  static async getUserGoals(userId: string): Promise<UserGoal[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  // Set user goals
  static async setUserGoals(userId: string, goals: Omit<UserGoal, 'id' | 'user_id'>[]): Promise<UserGoal[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    const goalsWithUserId = goals.map(goal => ({ ...goal, user_id: userId }))
    
    const { data, error } = await supabase
      .from('user_goals')
      .upsert(goalsWithUserId)
      .select()

    if (error) throw error
    return data || []
  }

  // Get user achievements
  static async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Check for new achievements
  static async checkAchievements(userId: string): Promise<UserAchievement[]> {
    const sessions = await this.getUserSessions(userId, this.addDays(new Date().toISOString().split('T')[0], -365), new Date().toISOString().split('T')[0])
    const goals = await this.getUserGoals(userId)
    const existingAchievements = await this.getUserAchievements(userId)
    
    const newAchievements: UserAchievement[] = []

    for (const achievement of this.achievements) {
      const alreadyUnlocked = existingAchievements.some(a => a.achievement_type === achievement.type)
      
      if (!alreadyUnlocked && achievement.condition(sessions, goals)) {
        const newAchievement: Omit<UserAchievement, 'id'> = {
          user_id: userId,
          achievement_type: achievement.type,
          achievement_name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          unlocked_at: new Date().toISOString(),
          metadata: achievement.metadata
        }

        if (!supabase) {
          throw new Error('Supabase client not initialized')
        }

        const { data, error } = await supabase
          .from('user_achievements')
          .insert(newAchievement)
          .select()
          .single()

        if (!error && data) {
          newAchievements.push(data)
        }
      }
    }

    return newAchievements
  }

  // Get streak information
  static async getCurrentStreak(userId: string): Promise<number> {
    const sessions = await this.getUserSessions(userId, this.addDays(new Date().toISOString().split('T')[0], -30), new Date().toISOString().split('T')[0])
    
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const checkDate = this.addDays(today.toISOString().split('T')[0], -i)
      const hasSession = sessions.some(s => s.session_date === checkDate && s.completed)
      
      if (hasSession) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  // Helper methods
  private static addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr)
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  private static getLastNDays(n: number): string[] {
    const dates: string[] = []
    const today = new Date()
    
    for (let i = n - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split('T')[0])
    }
    
    return dates
  }

  // Notification methods
  // Get user notification preferences
  static async getUserNotificationPreferences(userId: string): Promise<any> {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const { data, error } = await supabase
      .from('user_notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return data
  }

  // Set user notification preferences
  static async setUserNotificationPreferences(userId: string, preferences: {
    email_enabled?: boolean
    push_enabled?: boolean
    preferred_time?: string
    intensity?: 'gentle' | 'motivating' | 'aggressive'
    frequency?: 'daily' | 'twice_daily' | 'hourly'
  }): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const { error } = await supabase
      .from('user_notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      })
    
    if (error) throw error
  }

  // Get user notifications
  static async getUserNotifications(userId: string, limit: number = 50): Promise<any[]> {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    const { error } = await supabase
      .from('user_notifications')
      .update({ 
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
    
    if (error) throw error
  }

  // Send test email
  static async sendTestEmail(userId: string, email: string): Promise<void> {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    // Call the send-email edge function
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: 'Test Email from ChristianKit',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">ChristianKit Test Email</h2>
            <p>Hello! This is a test email to verify your notification settings are working correctly.</p>
            <p>If you received this email, your notification system is properly configured! 🎉</p>
            <hr>
            <p style="color: #6b7280; font-size: 12px;">
              This email was sent from ChristianKit notification system.
            </p>
          </div>
        `,
        text: 'ChristianKit Test Email - Your notification system is working!',
        userId: userId,
        notificationType: 'test'
      }
    })
    
    if (error) throw error
  }
}
