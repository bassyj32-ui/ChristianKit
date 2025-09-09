import { PrayerSession, PrayerStats, PrayerSettings, PrayerReminder, PrayerPrompt, PrayerTechnique } from '../types/prayer';
import { cloudDataService } from './cloudDataService'
import { useAuth } from '../components/AuthProvider'
import { supabase } from '../utils/supabase';

class PrayerService {
  private readonly SESSIONS_KEY = 'prayerSessions';
  private readonly SETTINGS_KEY = 'prayerSettings';
  private readonly REMINDERS_KEY = 'prayerReminders';

  async savePrayerSession(session: PrayerSession): Promise<void> {
    try {
      const sessions = await this.getPrayerSessions();
      sessions.unshift(session);

      // Keep only last 100 sessions
      if (sessions.length > 100) {
        sessions.splice(100);
      }

      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));

      // Also save to Supabase if user is authenticated
      if (supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { error } = await supabase
              .from('prayer_sessions')
              .insert({
                user_id: user.id,
                started_at: new Date(session.started_at).toISOString(),
                ended_at: session.ended_at ? new Date(session.ended_at).toISOString() : null,
                duration_minutes: session.duration_minutes,
                prayer_type: session.prayer_type || 'personal',
                notes: session.notes
              });

            if (error) {
              console.error('Error saving to Supabase:', error);
            } else {
              console.log('✅ Prayer session saved to Supabase');
            }
          }
        } catch (supabaseError) {
          console.warn('Supabase save failed, continuing with localStorage:', supabaseError);
        }
      }
    } catch (error) {
      console.error('Error saving prayer session:', error);
      throw error;
    }
  }

  async getPrayerSessions(): Promise<PrayerSession[]> {
    try {
      // Try to get from Supabase first if user is authenticated
      if (supabase) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: supabaseSessions, error } = await supabase
              .from('prayer_sessions')
              .select('*')
              .eq('user_id', user.id)
              .order('started_at', { ascending: false })
              .limit(100);

            if (!error && supabaseSessions) {
              console.log('✅ Loaded prayer sessions from Supabase:', supabaseSessions.length);

              // Convert Supabase format to local format
              const convertedSessions: PrayerSession[] = supabaseSessions.map(session => ({
                id: session.id,
                started_at: session.started_at,
                ended_at: session.ended_at,
                duration_minutes: session.duration_minutes,
                prayer_type: session.prayer_type,
                notes: session.notes,
                completed: true // Assume completed if in database
              }));

              return convertedSessions;
            }
          }
        } catch (supabaseError) {
          console.warn('Supabase fetch failed, falling back to localStorage:', supabaseError);
        }
      }

      // Fallback to localStorage
      const saved = localStorage.getItem(this.SESSIONS_KEY);
      const localSessions = saved ? JSON.parse(saved) : [];
      console.log('📱 Using localStorage sessions:', localSessions.length);
      return localSessions;
    } catch (error) {
      console.error('Error loading prayer sessions:', error);
      return [];
    }
  }

  async deletePrayerSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getPrayerSessions();
      const filtered = sessions.filter(s => s.id !== sessionId);
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting prayer session:', error);
    }
  }

  // Prayer Statistics
  async getPrayerStats(): Promise<PrayerStats> {
    const sessions = await this.getPrayerSessions();
    const completedSessions = sessions.filter(s => s.completed);
    
    if (completedSessions.length === 0) {
      return {
        totalSessions: 0,
        totalMinutes: 0,
        averageDuration: 0,
        currentStreak: 0,
        longestStreak: 0,
        favoriteFocus: '',
        mostFrequentMood: ''
      };
    }

    const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);
    const averageDuration = Math.round(totalMinutes / completedSessions.length);
    
    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(completedSessions);
    
    // Find most frequent focus and mood
    const focusCounts = this.countOccurrences(completedSessions.map(s => s.focus));
    const moodCounts = this.countOccurrences(completedSessions.map(s => s.mood));
    
    return {
      totalSessions: completedSessions.length,
      totalMinutes,
      averageDuration,
      currentStreak,
      longestStreak,
      favoriteFocus: this.getMostFrequent(focusCounts),
      mostFrequentMood: this.getMostFrequent(moodCounts)
    };
  }

  private calculateStreaks(sessions: PrayerSession[]): { currentStreak: number; longestStreak: number } {
    const sortedSessions = sessions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].date);
      sessionDate.setHours(0, 0, 0, 0);
      
      if (i === 0) {
        const daysDiff = Math.floor((today.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 1) {
          tempStreak = 1;
          currentStreak = 1;
        }
      } else {
        const prevDate = new Date(sortedSessions[i - 1].date);
        prevDate.setHours(0, 0, 0, 0);
        
        const daysDiff = Math.floor((prevDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          tempStreak++;
          if (i === 0) currentStreak = tempStreak;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { currentStreak, longestStreak };
  }

  private countOccurrences(items: string[]): Record<string, number> {
    return items.reduce((acc, item) => {
      if (item) {
        acc[item] = (acc[item] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }

  private getMostFrequent(counts: Record<string, number>): string {
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
  }

  // Prayer Settings
  async getPrayerSettings(): Promise<PrayerSettings> {
    try {
      const saved = localStorage.getItem(this.SETTINGS_KEY);
      return saved ? JSON.parse(saved) : this.getDefaultSettings();
    } catch (error) {
      console.error('Error loading prayer settings:', error);
      return this.getDefaultSettings();
    }
  }

  async savePrayerSettings(settings: PrayerSettings): Promise<void> {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving prayer settings:', error);
    }
  }

  private getDefaultSettings(): PrayerSettings {
    return {
      defaultDuration: 10,
      defaultMode: 'guided',
      enableReminders: true,
      reminderInterval: 30,
      ambientSound: 'none',
      autoSave: true,
      showScripture: true
    };
  }

  // Prayer Reminders
  async getPrayerReminders(): Promise<PrayerReminder[]> {
    try {
      const saved = localStorage.getItem(this.REMINDERS_KEY);
      return saved ? JSON.parse(saved) : this.getDefaultReminders();
    } catch (error) {
      console.error('Error loading prayer reminders:', error);
      return this.getDefaultReminders();
    }
  }

  async savePrayerReminders(reminders: PrayerReminder[]): Promise<void> {
    try {
      localStorage.setItem(this.REMINDERS_KEY, JSON.stringify(reminders));
    } catch (error) {
      console.error('Error saving prayer reminders:', error);
    }
  }

  private getDefaultReminders(): PrayerReminder[] {
    return [
      {
        id: '1',
        message: 'Take a deep breath and center yourself in God\'s presence',
        timing: 30,
        type: 'breathing',
        enabled: true
      },
      {
        id: '2',
        message: 'Remember what you\'re praying for today',
        timing: 60,
        type: 'focus',
        enabled: true
      },
      {
        id: '3',
        message: 'Be still and know that He is God',
        timing: 90,
        type: 'scripture',
        enabled: true
      }
    ];
  }

  // Prayer Prompts
  getPrayerPrompts(): PrayerPrompt[] {
    return [
      {
        id: '1',
        category: 'gratitude',
        text: 'What am I grateful for today?',
        scripture: '1 Thessalonians 5:18'
      },
      {
        id: '2',
        category: 'healing',
        text: 'Who needs my prayers for healing right now?',
        scripture: 'James 5:16'
      },
      {
        id: '3',
        category: 'guidance',
        text: 'What decision do I need God\'s wisdom for?',
        scripture: 'Proverbs 3:5-6'
      },
      {
        id: '4',
        category: 'strength',
        text: 'Where do I need God\'s strength today?',
        scripture: 'Philippians 4:13'
      },
      {
        id: '5',
        category: 'forgiveness',
        text: 'What do I need to forgive or ask forgiveness for?',
        scripture: 'Matthew 6:14-15'
      },
      {
        id: '6',
        category: 'worship',
        text: 'How can I praise God for who He is?',
        scripture: 'Psalm 100:4'
      }
    ];
  }

  // Weekly Progress - Enhanced Logic with Real Data
  async getWeeklyProgress(): Promise<any> {
    try {
      console.log('📊 Calculating weekly progress...');
      const sessions = await this.getPrayerSessions();
      console.log('📊 Sessions loaded:', sessions.length);
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
      endOfWeek.setHours(23, 59, 59, 999);
      
      // Filter sessions for this week
      const weeklySessions = sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= startOfWeek && sessionDate <= endOfWeek && session.completed;
      });
      
      // Group sessions by day with enhanced tracking
      const dailyProgress: any = {};
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      days.forEach(day => {
        dailyProgress[day] = {
          prayer: 0,
          bible: 0,
          meditation: 0,
          journal: 0,
          totalMinutes: 0,
          sessionsCount: 0,
          streak: 0
        };
      });
      
      // Calculate daily progress with enhanced logic
      weeklySessions.forEach(session => {
        const sessionDate = new Date(session.started_at || session.date);
        const dayIndex = sessionDate.getDay();
        const dayName = days[dayIndex];

        // Enhanced activity type detection
        let activityType = 'prayer'; // Default

        // More sophisticated activity detection
        const notes = session.notes?.toLowerCase() || '';
        const prayerType = session.prayer_type?.toLowerCase() || '';

        if (notes.includes('bible') || notes.includes('scripture') || notes.includes('reading') || prayerType.includes('bible')) {
          activityType = 'bible';
        } else if (notes.includes('meditation') || notes.includes('contemplation') || notes.includes('silence') || prayerType.includes('meditation')) {
          activityType = 'meditation';
        } else if (notes.includes('journal') || notes.includes('writing') || notes.includes('reflection') || prayerType.includes('journal')) {
          activityType = 'journal';
        } else if (prayerType.includes('prayer') || prayerType.includes('worship') || prayerType.includes('thanksgiving')) {
          activityType = 'prayer';
        }

        // Calculate percentage based on user's target duration (default 30 min)
        const targetDuration = 30;
        const duration = session.duration_minutes || session.duration || 0;
        const percentage = Math.min(100, Math.round((duration / targetDuration) * 100));

        // Update daily progress
        dailyProgress[dayName][activityType] = Math.max(
          dailyProgress[dayName][activityType],
          percentage
        );
        dailyProgress[dayName].totalMinutes += duration;
        dailyProgress[dayName].sessionsCount += 1;

        console.log(`📊 Day ${dayName}: ${activityType} ${percentage}% (${duration} min)`);
      });
      
      // Calculate streaks and goals
      let currentStreak = 0;
      let weeklyGoal = 0;
      
      // Calculate current streak
      for (let i = 0; i < 7; i++) {
        const dayName = days[i];
        if (dailyProgress[dayName].sessionsCount > 0) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      // Calculate weekly goal achievement
      const totalWeeklyMinutes = Object.values(dailyProgress).reduce((sum: number, day: any) => sum + day.totalMinutes, 0);
      const weeklyGoalMinutes = 210; // 30 min per day * 7 days
      weeklyGoal = Math.min(100, Math.round((totalWeeklyMinutes / weeklyGoalMinutes) * 100));
      
      // Convert to array format for the component
      const weeklyData = days.map(day => ({
        day,
        ...dailyProgress[day],
        goalAchieved: dailyProgress[day].totalMinutes >= 30,
        isToday: day === days[today.getDay()]
      }));
      
      return {
        dailyData: weeklyData,
        summary: {
          totalMinutes: totalWeeklyMinutes,
          totalSessions: weeklySessions.length,
          currentStreak,
          weeklyGoal,
          averageDailyMinutes: Math.round(totalWeeklyMinutes / 7),
          mostActiveDay: this.getMostActiveDay(dailyProgress),
          activityBreakdown: this.getActivityBreakdown(weeklySessions)
        }
      };
    } catch (error) {
      console.error('Error getting weekly progress:', error);
      return {
        dailyData: [],
        summary: {
          totalMinutes: 0,
          totalSessions: 0,
          currentStreak: 0,
          weeklyGoal: 0,
          averageDailyMinutes: 0,
          mostActiveDay: 'None',
          activityBreakdown: { prayer: 0, bible: 0, meditation: 0, journal: 0 }
        }
      };
    }
  }

  // Helper methods for enhanced weekly progress
  private getMostActiveDay(dailyProgress: any): string {
    let mostActive = 'None';
    let maxMinutes = 0;
    
    Object.entries(dailyProgress).forEach(([day, data]: [string, any]) => {
      if (data.totalMinutes > maxMinutes) {
        maxMinutes = data.totalMinutes;
        mostActive = day;
      }
    });
    
    return mostActive;
  }

  private getActivityBreakdown(sessions: any[]): any {
    const breakdown = { prayer: 0, bible: 0, meditation: 0, journal: 0 };
    
    sessions.forEach(session => {
      const focus = session.focus?.toLowerCase() || '';
      
      if (focus.includes('bible') || focus.includes('scripture')) {
        breakdown.bible += session.duration;
      } else if (focus.includes('meditation') || focus.includes('contemplation')) {
        breakdown.meditation += session.duration;
      } else if (focus.includes('journal') || focus.includes('writing')) {
        breakdown.journal += session.duration;
      } else {
        breakdown.prayer += session.duration;
      }
    });
    
    return breakdown;
  }

  // Weekly Goals Management
  async getWeeklyGoals(): Promise<any> {
    try {
      const saved = localStorage.getItem('weeklyGoals');
      return saved ? JSON.parse(saved) : this.getDefaultWeeklyGoals();
    } catch (error) {
      console.error('Error loading weekly goals:', error);
      return this.getDefaultWeeklyGoals();
    }
  }

  async saveWeeklyGoals(goals: any): Promise<void> {
    try {
      localStorage.setItem('weeklyGoals', JSON.stringify(goals));
    } catch (error) {
      console.error('Error saving weekly goals:', error);
    }
  }

  private getDefaultWeeklyGoals(): any {
    return {
      prayer: { target: 30, current: 0 },
      bible: { target: 20, current: 0 },
      meditation: { target: 15, current: 0 },
      journal: { target: 10, current: 0 },
      totalMinutes: { target: 210, current: 0 }
    };
  }

  // Weekly Progress Reminders
  async getWeeklyReminders(): Promise<any[]> {
    try {
      const progress = await this.getWeeklyProgress();
      const goals = await this.getWeeklyGoals();
      const reminders = [];
      
      // Check if user is falling behind
      const daysLeft = 7 - new Date().getDay();
      const averageNeeded = (goals.totalMinutes.target - progress.summary.totalMinutes) / daysLeft;
      
      if (averageNeeded > 30) {
        reminders.push({
          type: 'motivation',
          message: `You're ${Math.round(averageNeeded)} minutes behind your weekly goal. Don't worry, you can catch up!`,
          priority: 'high'
        });
      }
      
      // Check for streaks
      if (progress.summary.currentStreak > 0) {
        reminders.push({
          type: 'celebration',
          message: `Amazing! You're on a ${progress.summary.currentStreak}-day streak. Keep it going!`,
          priority: 'medium'
        });
      }
      
      // Check for goal achievement
      if (progress.summary.weeklyGoal >= 100) {
        reminders.push({
          type: 'achievement',
          message: '🎉 Congratulations! You\'ve reached your weekly goal!',
          priority: 'high'
        });
      }
      
      return reminders;
    } catch (error) {
      console.error('Error getting weekly reminders:', error);
      return [];
    }
  }

  // Prayer Techniques
  getPrayerTechniques(): PrayerTechnique[] {
    return [
      {
        id: '1',
        name: 'Centering Prayer',
        description: 'Focus on a sacred word to quiet your mind and open your heart to God\'s presence.',
        steps: [
          'Choose a sacred word (e.g., "Jesus", "Peace", "Love")',
          'Sit comfortably and close your eyes',
          'When thoughts arise, gently return to your sacred word',
          'Rest in God\'s presence for 10-20 minutes'
        ],
        duration: 15,
        category: 'meditation'
      },
      {
        id: '2',
        name: 'Lectio Divina',
        description: 'Read, meditate, pray, and contemplate scripture to hear God\'s voice.',
        steps: [
          'Read a scripture passage slowly',
          'Meditate on a word or phrase that stands out',
          'Pray about what God is saying to you',
          'Contemplate and rest in God\'s presence'
        ],
        duration: 20,
        category: 'contemplation'
      },
      {
        id: '3',
        name: 'Examen Prayer',
        description: 'Review your day to recognize God\'s presence and guidance in your life.',
        steps: [
          'Become aware of God\'s presence',
          'Review your day with gratitude',
          'Pay attention to your emotions',
          'Choose one feature of the day and pray about it',
          'Look toward tomorrow'
        ],
        duration: 10,
        category: 'contemplation'
      }
    ];
  }
}

export const prayerService = new PrayerService();
