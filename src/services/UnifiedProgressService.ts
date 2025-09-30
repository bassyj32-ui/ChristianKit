/**
 * Unified Progress Service - Combines all progress tracking sources
 * Handles: Supabase + localStorage + PrayerSystemService
 * Provides graceful fallbacks and real progress data
 */

import { supabase } from '../utils/supabase';
import { prayerService } from './prayerService';
import { prayerSystemService } from './PrayerSystemService';

export interface UnifiedProgressStats {
  currentStreak: number;
  totalPrayers: number;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  daysThisMonth: number;
  weeklyGoal: number;
  averageSessionDuration: number;
  lastPrayerDate: string | null;
  dataSource: 'supabase' | 'localStorage' | 'prayerSystem' | 'empty';
}

export interface DailyProgress {
  date: string;
  prayer: number;
  bible: number;
  meditation: number;
  journal: number;
  totalMinutes: number;
  completed: boolean;
}

export interface WeeklyProgressData {
  dailyProgress: DailyProgress[];
  stats: UnifiedProgressStats;
  insights: string[];
}

class UnifiedProgressService {
  
  /**
   * Get comprehensive progress stats with graceful fallbacks
   */
  async getProgressStats(userId?: string): Promise<UnifiedProgressStats> {
    // Getting progress stats for user
    
    try {
      // Try Supabase first (if user is logged in)
      if (userId && supabase) {
        try {
          const supabaseStats = await this.getSupabaseStats(userId);
          if (supabaseStats) {
            return { ...supabaseStats, dataSource: 'supabase' };
          }
        } catch (error) {
          console.warn('⚠️ Supabase stats failed, continuing with fallbacks:', error);
        }
      }
      
      // Fallback to localStorage + PrayerSystemService
      const localStats = await this.getLocalStorageStats(userId);
      if (localStats && (localStats.totalPrayers > 0 || localStats.currentStreak > 0)) {
        return { ...localStats, dataSource: 'localStorage' };
      }
      
      // Final fallback to PrayerSystemService
      const prayerSystemStats = await this.getPrayerSystemStats(userId);
      if (prayerSystemStats && prayerSystemStats.totalPrayers > 0) {
        return { ...prayerSystemStats, dataSource: 'prayerSystem' };
      }
      
      // Return empty state (new user)
      return this.getEmptyStats();
      
    } catch (error) {
      console.error('❌ UnifiedProgressService: Error getting stats:', error);
      return this.getEmptyStats();
    }
  }
  
  /**
   * Get weekly progress data with fallbacks
   */
  async getWeeklyProgress(userId?: string): Promise<WeeklyProgressData> {
    // Getting weekly progress for user
    
    try {
      // Try Supabase first
      if (userId && supabase) {
        try {
          const supabaseWeekly = await this.getSupabaseWeeklyProgress(userId);
          if (supabaseWeekly) {
            return supabaseWeekly;
          }
        } catch (error) {
          console.warn('⚠️ Supabase weekly failed, continuing with fallbacks:', error);
        }
      }
      
      // Fallback to localStorage
      const localWeekly = await this.getLocalStorageWeeklyProgress();
      if (localWeekly && localWeekly.dailyProgress.some(day => day.totalMinutes > 0)) {
        return localWeekly;
      }
      
      // Return empty weekly progress
      return this.getEmptyWeeklyProgress();
      
    } catch (error) {
      console.error('❌ UnifiedProgressService: Error getting weekly progress:', error);
      return this.getEmptyWeeklyProgress();
    }
  }
  
  /**
   * Try to get stats from Supabase (with error handling for schema issues)
   */
  private async getSupabaseStats(userId: string): Promise<UnifiedProgressStats | null> {
    try {
      // Try different possible column names for compatibility
      const possibleQueries = [
        // Modern schema
        () => supabase!
          .from('prayer_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('started_at', { ascending: false }),
        
        // Alternative schema
        () => supabase!
          .from('prayer_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
          
        // Legacy schema
        () => supabase!
          .from('sessions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false })
      ];
      
      let sessions = null;
      let error = null;
      
      // Try each query until one works
      for (const query of possibleQueries) {
        const result = await query();
        if (!result.error && result.data) {
          sessions = result.data;
          break;
        }
        error = result.error;
      }
      
      if (!sessions) {
        console.warn('⚠️ All Supabase queries failed:', error);
        return null;
      }
      
      // Found Supabase sessions
      
      // Calculate stats from sessions
      return this.calculateStatsFromSessions(sessions, 'supabase');
      
    } catch (error) {
      console.warn('⚠️ Supabase stats failed:', error);
      return null;
    }
  }
  
  /**
   * Get stats from localStorage (prayerService)
   */
  private async getLocalStorageStats(userId?: string): Promise<UnifiedProgressStats | null> {
    try {
      const sessions = await prayerService.getPrayerSessions();
      // Found localStorage sessions
      
      if (sessions.length === 0) {
        return null;
      }
      
      return this.calculateStatsFromSessions(sessions, 'localStorage');
      
    } catch (error) {
      console.warn('⚠️ localStorage stats failed:', error);
      return null;
    }
  }
  
  /**
   * Get stats from PrayerSystemService
   */
  private async getPrayerSystemStats(userId?: string): Promise<UnifiedProgressStats | null> {
    try {
      if (!userId) return null;
      
      const profile = prayerSystemService.getUserProfile(userId);
      if (!profile) return null;
      
      // Found PrayerSystem profile
      
      return {
        currentStreak: profile.currentStreak || 0,
        totalPrayers: profile.completedDays || 0,
        currentLevel: profile.currentLevel as 'beginner' | 'intermediate' | 'advanced' || 'beginner',
        daysThisMonth: profile.completedDays % 30 || 0,
        weeklyGoal: Math.min(100, Math.round((profile.completedDays / 30) * 100)),
        averageSessionDuration: 15, // Default assumption
        lastPrayerDate: profile.startDate ? profile.startDate.toISOString() : null,
        dataSource: 'prayerSystem'
      };
      
    } catch (error) {
      console.warn('⚠️ PrayerSystem stats failed:', error);
      return null;
    }
  }
  
  /**
   * Calculate stats from any session format
   */
  private calculateStatsFromSessions(sessions: any[], source: string): UnifiedProgressStats {
    if (!sessions || sessions.length === 0) {
      return this.getEmptyStats();
    }
    
    // Normalize session format
    const normalizedSessions = sessions.map(session => ({
      date: session.started_at || session.created_at || session.date || new Date().toISOString(),
      duration: session.duration_minutes || session.duration || 0,
      completed: session.completed !== false, // Default to true unless explicitly false
      type: session.prayer_type || session.type || 'prayer'
    }));
    
    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Sort by date descending
    const sortedSessions = normalizedSessions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Check for consecutive days
    let checkDate = new Date(today);
    for (let i = 0; i < 365; i++) { // Max 365 day streak
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayHasPrayer = sortedSessions.some(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= dayStart && sessionDate <= dayEnd && session.completed;
      });
      
      if (dayHasPrayer) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // Allow 1 day gap if we're checking today and found no session
        if (i === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }
    
    // Calculate other stats
    const completedSessions = normalizedSessions.filter(s => s.completed);
    const totalPrayers = completedSessions.length;
    
    // Calculate this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const daysThisMonth = completedSessions.filter(session => 
      new Date(session.date) >= thisMonth
    ).length;
    
    // Calculate level based on total prayers
    let currentLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
    if (totalPrayers >= 100) currentLevel = 'advanced';
    else if (totalPrayers >= 30) currentLevel = 'intermediate';
    
    // Calculate average duration
    const totalDuration = completedSessions.reduce((sum, s) => sum + s.duration, 0);
    const averageSessionDuration = completedSessions.length > 0 
      ? Math.round(totalDuration / completedSessions.length) 
      : 0;
    
    // Weekly goal (percentage of 7 days completed this week)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const weekSessions = completedSessions.filter(session => 
      new Date(session.date) >= startOfWeek
    ).length;
    const weeklyGoal = Math.min(100, Math.round((weekSessions / 7) * 100));
    
    // Last prayer date
    const lastPrayerDate = sortedSessions.length > 0 ? sortedSessions[0].date : null;
    
    return {
      currentStreak,
      totalPrayers,
      currentLevel,
      daysThisMonth,
      weeklyGoal,
      averageSessionDuration,
      lastPrayerDate,
      dataSource: source as any
    };
  }
  
  /**
   * Get Supabase weekly progress
   */
  private async getSupabaseWeeklyProgress(userId: string): Promise<WeeklyProgressData | null> {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const { data: sessions, error } = await supabase!
        .from('prayer_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('started_at', startOfWeek.toISOString())
        .order('started_at', { ascending: false });
        
      if (error || !sessions) {
        console.warn('⚠️ Supabase weekly query failed:', error);
        return null;
      }
      
      return this.buildWeeklyProgressFromSessions(sessions);
      
    } catch (error) {
      console.warn('⚠️ Supabase weekly progress failed:', error);
      return null;
    }
  }
  
  /**
   * Get localStorage weekly progress
   */
  private async getLocalStorageWeeklyProgress(): Promise<WeeklyProgressData | null> {
    try {
      const sessions = await prayerService.getPrayerSessions();
      
      // Filter to this week
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const weekSessions = sessions.filter(session => {
        const sessionDate = new Date((session as any).started_at || session.date);
        return sessionDate >= startOfWeek;
      });
      
      return this.buildWeeklyProgressFromSessions(weekSessions);
      
    } catch (error) {
      console.warn('⚠️ localStorage weekly progress failed:', error);
      return null;
    }
  }
  
  /**
   * Build weekly progress from sessions
   */
  private buildWeeklyProgressFromSessions(sessions: any[]): WeeklyProgressData {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const dailyProgress: DailyProgress[] = [];
    
    // Build 7 days of progress
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Find sessions for this day
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.started_at || session.date);
        return sessionDate >= dayStart && sessionDate <= dayEnd;
      });
      
      // Calculate day totals
      let prayer = 0, bible = 0, meditation = 0, journal = 0, totalMinutes = 0;
      let completed = false;
      
      daySessions.forEach(session => {
        const duration = session.duration_minutes || session.duration || 0;
        totalMinutes += duration;
        
        if (session.completed !== false) {
          completed = true;
          const type = (session.prayer_type || session.type || '').toLowerCase();
          
          if (type.includes('bible')) bible += duration;
          else if (type.includes('meditation')) meditation += duration;
          else if (type.includes('journal')) journal += duration;
          else prayer += duration;
        }
      });
      
      dailyProgress.push({
        date: date.toISOString().split('T')[0],
        prayer,
        bible,
        meditation,
        journal,
        totalMinutes,
        completed
      });
    }
    
    // Get stats
    const stats = this.calculateStatsFromSessions(sessions, 'weekly');
    
    // Generate insights
    const insights = this.generateInsights(dailyProgress, stats);
    
    return {
      dailyProgress,
      stats,
      insights
    };
  }
  
  /**
   * Generate insights from progress data
   */
  private generateInsights(dailyProgress: DailyProgress[], stats: UnifiedProgressStats): string[] {
    const insights: string[] = [];
    
    const completedDays = dailyProgress.filter(day => day.completed).length;
    const totalMinutes = dailyProgress.reduce((sum, day) => sum + day.totalMinutes, 0);
    const avgMinutes = completedDays > 0 ? Math.round(totalMinutes / completedDays) : 0;
    
    if (completedDays >= 5) {
      insights.push(`🔥 Excellent consistency! You've prayed ${completedDays} days this week.`);
    } else if (completedDays >= 3) {
      insights.push(`✨ Good progress! You've prayed ${completedDays} days this week.`);
    } else if (completedDays >= 1) {
      insights.push(`🌱 You're building a habit! ${completedDays} days of prayer this week.`);
    }
    
    if (stats.currentStreak >= 7) {
      insights.push(`🏆 Amazing ${stats.currentStreak}-day prayer streak!`);
    } else if (stats.currentStreak >= 3) {
      insights.push(`🔥 You're on a ${stats.currentStreak}-day streak!`);
    }
    
    if (avgMinutes > 0) {
      insights.push(`⏰ Average session: ${avgMinutes} minutes`);
    }
    
    return insights;
  }
  
  /**
   * Get empty stats for new users
   */
  private getEmptyStats(): UnifiedProgressStats {
    return {
      currentStreak: 0,
      totalPrayers: 0,
      currentLevel: 'beginner',
      daysThisMonth: 0,
      weeklyGoal: 0,
      averageSessionDuration: 0,
      lastPrayerDate: null,
      dataSource: 'empty'
    };
  }
  
  /**
   * Get empty weekly progress
   */
  private getEmptyWeeklyProgress(): WeeklyProgressData {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const dailyProgress: DailyProgress[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      dailyProgress.push({
        date: date.toISOString().split('T')[0],
        prayer: 0,
        bible: 0,
        meditation: 0,
        journal: 0,
        totalMinutes: 0,
        completed: false
      });
    }
    
    return {
      dailyProgress,
      stats: this.getEmptyStats(),
      insights: ['🌱 Start your spiritual journey today!']
    };
  }
}

export const unifiedProgressService = new UnifiedProgressService();
