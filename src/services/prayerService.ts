import { PrayerSession, PrayerStats, PrayerSettings, PrayerReminder, PrayerPrompt, PrayerTechnique } from '../types/prayer';
import { cloudDataService } from './cloudDataService'
import { useAuth } from '../components/AuthProvider'

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
      
      // Save to cloud if user is authenticated (we'll handle this in the component)
      // The cloud sync is handled at the component level through the AuthProvider
    } catch (error) {
      console.error('Error saving prayer session:', error);
      throw error;
    }
  }

  async getPrayerSessions(): Promise<PrayerSession[]> {
    try {
      const saved = localStorage.getItem(this.SESSIONS_KEY);
      return saved ? JSON.parse(saved) : [];
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

  // Weekly Progress
  async getWeeklyProgress(): Promise<any> {
    try {
      const sessions = await this.getPrayerSessions();
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
      
      // Group sessions by day
      const dailyProgress: any = {};
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      days.forEach(day => {
        dailyProgress[day] = {
          prayer: 0,
          bible: 0,
          meditation: 0,
          journal: 0
        };
      });
      
      // Calculate daily progress based on session types and durations
      weeklySessions.forEach(session => {
        const sessionDate = new Date(session.date);
        const dayIndex = sessionDate.getDay();
        const dayName = days[dayIndex];
        
        // Determine activity type based on session focus and duration
        let activityType = 'prayer'; // Default
        
        if (session.focus && session.focus.toLowerCase().includes('bible')) {
          activityType = 'bible';
        } else if (session.focus && session.focus.toLowerCase().includes('meditation')) {
          activityType = 'meditation';
        } else if (session.focus && session.focus.toLowerCase().includes('journal')) {
          activityType = 'journal';
        }
        
        // Calculate percentage based on target duration (assuming 30 min target)
        const targetDuration = 30;
        const percentage = Math.min(100, Math.round((session.duration / targetDuration) * 100));
        
        dailyProgress[dayName][activityType] = Math.max(
          dailyProgress[dayName][activityType], 
          percentage
        );
      });
      
      // Convert to array format for the component
      const weeklyData = days.map(day => ({
        day,
        ...dailyProgress[day]
      }));
      
      return weeklyData;
    } catch (error) {
      console.error('Error getting weekly progress:', error);
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
