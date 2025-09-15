import { supabase } from '../utils/supabase';

export interface ProgressSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  duration_minutes: number;
  prayer_type: string;
  notes?: string;
  created_at: string;
}

export interface DailyProgress {
  day: string;
  prayer: number;
  bible: number;
  meditation: number;
  journal: number;
  totalMinutes: number;
  sessionsCount: number;
}

export interface WeeklyProgressData {
  sessions: ProgressSession[];
  dailyProgress: { [key: string]: DailyProgress };
  currentStreak: number;
  weeklyGoal: number;
  totalMinutesThisWeek: number;
  averageSessionDuration: number;
}

class ProgressService {
  /**
   * Get weekly progress for a user
   */
  static async getWeeklyProgress(userId: string, weekStart?: string): Promise<WeeklyProgressData> {
    try {
      console.log('📊 ProgressService: Getting weekly progress for user:', userId);

      // Calculate week boundaries
      const today = new Date();
      const startOfWeek = weekStart ? new Date(weekStart) : new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
      endOfWeek.setHours(23, 59, 59, 999);

      console.log('📊 ProgressService: Week range:', startOfWeek.toISOString(), 'to', endOfWeek.toISOString());

      // Fetch sessions from Supabase
      const { data: sessions, error } = await supabase
        .from('prayer_sessions')
      .select('*')
      .eq('user_id', userId)
        .gte('started_at', startOfWeek.toISOString())
        .lte('started_at', endOfWeek.toISOString())
        .order('started_at', { ascending: false });

      if (error) {
        console.error('❌ ProgressService: Error fetching sessions:', error);
        throw error;
      }

      console.log('✅ ProgressService: Found', sessions?.length || 0, 'sessions');

      // Process sessions into daily progress
      const dailyProgress: { [key: string]: DailyProgress } = {};
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      // Initialize daily progress
      days.forEach(day => {
        dailyProgress[day] = {
          day,
      prayer: 0,
      bible: 0,
      meditation: 0,
          journal: 0,
          totalMinutes: 0,
          sessionsCount: 0
        };
      });

      // Process each session
      sessions?.forEach(session => {
        const sessionDate = new Date(session.started_at);
        const dayIndex = sessionDate.getDay();
        const dayName = days[dayIndex];

        // Activity type detection
        let activityType = 'prayer'; // Default
        const notes = session.notes?.toLowerCase() || '';
        const prayerType = session.prayer_type?.toLowerCase() || '';

        if (notes.includes('bible') || notes.includes('scripture') || notes.includes('reading') || prayerType.includes('bible')) {
          activityType = 'bible';
        } else if (notes.includes('meditation') || notes.includes('contemplation') || notes.includes('silence') || prayerType.includes('meditation')) {
          activityType = 'meditation';
        } else if (notes.includes('journal') || notes.includes('writing') || notes.includes('reflection') || prayerType.includes('journal')) {
          activityType = 'journal';
        }

        // Calculate percentage based on target duration
        const targetDuration = 30;
        const percentage = Math.min(100, Math.round((session.duration_minutes / targetDuration) * 100));

        // Update daily progress
        dailyProgress[dayName][activityType] = Math.max(
          dailyProgress[dayName][activityType],
          percentage
        );
        dailyProgress[dayName].totalMinutes += session.duration_minutes;
        dailyProgress[dayName].sessionsCount += 1;

        console.log(`📊 ProgressService: ${dayName} - ${activityType}: ${percentage}% (${session.duration_minutes} min)`);
      });

      // Calculate current streak
      let currentStreak = 0;
      for (let i = 0; i < 7; i++) {
        const dayName = days[i];
        if (dailyProgress[dayName].sessionsCount > 0) {
          currentStreak++;
        } else {
          break;
        }
      }

      // Calculate weekly totals
      const totalMinutesThisWeek = Object.values(dailyProgress).reduce(
        (total, day) => total + day.totalMinutes,
        0
      );

      const totalSessionsThisWeek = Object.values(dailyProgress).reduce(
        (total, day) => total + day.sessionsCount,
        0
      );

      const averageSessionDuration = totalSessionsThisWeek > 0
        ? Math.round(totalMinutesThisWeek / totalSessionsThisWeek)
        : 0;

      // Calculate weekly goal achievement (7 sessions per week as goal)
      const weeklyGoal = Math.min(100, Math.round((totalSessionsThisWeek / 7) * 100));

      const result: WeeklyProgressData = {
        sessions: sessions || [],
        dailyProgress,
        currentStreak,
        weeklyGoal,
        totalMinutesThisWeek,
        averageSessionDuration
      };

      console.log('✅ ProgressService: Weekly progress calculated:', {
        sessions: result.sessions.length,
        streak: result.currentStreak,
        goal: result.weeklyGoal,
        totalMinutes: result.totalMinutesThisWeek
      });

      return result;
    } catch (error) {
      console.error('❌ ProgressService: Error getting weekly progress:', error);
      throw error;
    }
  }

  /**
   * Get user statistics for notifications
   */
  static async getUserStats(userId: string): Promise<{
    currentStreak: number;
    weeklyGoal: number;
    totalSessions: number;
    averageDuration: number;
    lastSessionDate: string | null;
  }> {
    try {
      // Get recent sessions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: sessions, error } = await supabase
        .from('prayer_sessions')
      .select('*')
      .eq('user_id', userId)
        .gte('started_at', thirtyDaysAgo.toISOString())
        .order('started_at', { ascending: false });

      if (error) {
        console.error('❌ ProgressService: Error fetching user stats:', error);
        return {
          currentStreak: 0,
          weeklyGoal: 0,
          totalSessions: 0,
          averageDuration: 0,
          lastSessionDate: null
        };
      }

      // Calculate stats
      const totalSessions = sessions?.length || 0;
      const totalMinutes = sessions?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;
      const averageDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
      const lastSessionDate = sessions?.[0]?.started_at || null;

      // Calculate current streak (consecutive days with sessions)
      let currentStreak = 0;
      if (sessions && sessions.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() - i);

          const hasSessionOnDate = sessions.some(session => {
            const sessionDate = new Date(session.started_at);
            sessionDate.setHours(0, 0, 0, 0);
            return sessionDate.getTime() === checkDate.getTime();
          });

          if (hasSessionOnDate) {
            currentStreak++;
          } else {
            break;
          }
        }
      }

      // Calculate weekly goal (sessions per week)
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weeklySessions = sessions?.filter(session => {
        const sessionDate = new Date(session.started_at);
        return sessionDate >= weekStart;
      }).length || 0;

      const weeklyGoal = Math.min(100, Math.round((weeklySessions / 7) * 100));

      return {
        currentStreak,
        weeklyGoal,
        totalSessions,
        averageDuration,
        lastSessionDate
      };
    } catch (error) {
      console.error('❌ ProgressService: Error getting user stats:', error);
      return {
        currentStreak: 0,
        weeklyGoal: 0,
        totalSessions: 0,
        averageDuration: 0,
        lastSessionDate: null
      };
    }
  }

  /**
   * Save a prayer session to Supabase
   */
  static async saveSession(session: Omit<ProgressSession, 'id' | 'created_at'>): Promise<ProgressSession | null> {
    try {
    const { data, error } = await supabase
        .from('prayer_sessions')
        .insert({
          user_id: session.user_id,
          started_at: session.started_at,
          ended_at: session.ended_at,
          duration_minutes: session.duration_minutes,
          prayer_type: session.prayer_type,
          notes: session.notes
        })
        .select()
        .single();

      if (error) {
        console.error('❌ ProgressService: Error saving session:', error);
        return null;
      }

      console.log('✅ ProgressService: Session saved:', data.id);
      return data;
    } catch (error) {
      console.error('❌ ProgressService: Error saving session:', error);
      return null;
    }
  }
}

export default ProgressService;