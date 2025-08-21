export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  createdAt: string
  subscription?: {
    tier: 'free' | 'pro'
    expiresAt?: string | null
    isActive: boolean
  }
  preferences?: {
    theme: 'light' | 'dark' | 'auto'
    reminders: boolean
    notifications: boolean
    dailyReEngagement: boolean
    weeklyProgressEmails: boolean
  }
  lastLogin?: string
  lastActivity?: string
}

export interface UserProfile extends User {
  // Extended profile data
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced'
  prayerGoals?: string[]
  bibleReadingPlan?: string
  customHabits?: string[]
  streakData?: {
    current: number
    best: number
    lastUpdated: string
  }
}
