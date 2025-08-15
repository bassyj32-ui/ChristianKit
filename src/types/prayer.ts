export interface PrayerSession {
  id: string;
  date: string;
  duration: number;
  focus: string;
  mood: string;
  message: string;
  completed: boolean;
  reflection?: string;
  mode: 'guided' | 'silent' | 'scripture' | 'worship';
  scripture?: string;
  ambientSound?: string;
}

export interface PrayerReminder {
  id: string;
  message: string;
  timing: number; // seconds into prayer
  type: 'focus' | 'scripture' | 'breathing' | 'intention';
  enabled: boolean;
}

export interface PrayerStats {
  totalSessions: number;
  totalMinutes: number;
  averageDuration: number;
  currentStreak: number;
  longestStreak: number;
  favoriteFocus: string;
  mostFrequentMood: string;
}

export interface PrayerSettings {
  defaultDuration: number;
  defaultMode: 'guided' | 'silent' | 'scripture' | 'worship';
  enableReminders: boolean;
  reminderInterval: number; // seconds
  ambientSound: string;
  autoSave: boolean;
  showScripture: boolean;
}

export interface PrayerPrompt {
  id: string;
  category: 'gratitude' | 'healing' | 'guidance' | 'strength' | 'forgiveness' | 'worship';
  text: string;
  scripture?: string;
}

export interface PrayerTechnique {
  id: string;
  name: string;
  description: string;
  steps: string[];
  duration: number;
  category: 'meditation' | 'contemplation' | 'intercession' | 'worship';
}
