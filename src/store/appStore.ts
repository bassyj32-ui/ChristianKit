import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Types
export interface User {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
  isAuthenticated: boolean
}

export interface UserPlan {
  prayerTime: number
  bibleTime: number
  prayerStyle: string
  prayerFocus: string[]
  bibleTopics: string[]
  dailyGoal: string
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  customPlan?: {
    prayer: {
      title: string
      description: string
      duration: number
      focus: string[]
      style: string
      tips: string[]
    }
    reading: {
      title: string
      description: string
      duration: number
      topics: string[]
      approach: string
      tips: string[]
    }
    reflection: {
      title: string
      description: string
      duration: number
      method: string
      prompts: string[]
      tips: string[]
    }
  }
}

export interface PrayerSession {
  id: string
  date: string
  duration: number
  focus: string
  mood: string
  completed: boolean
  notes?: string
}

export interface BibleSession {
  id: string
  date: string
  duration: number
  book: string
  chapter: string
  verses: string
  completed: boolean
  notes?: string
}

export interface MeditationSession {
  id: string
  date: string
  duration: number
  technique: string
  mood: string
  completed: boolean
  notes?: string
}

export interface GameScore {
  id: string
  gameType: 'faith-runner'
  score: number
  level: number
  distance: number
  crosses: number
  streak: number
  date: string
}

export interface AppState {
  // User & Auth
  user: User | null
  userPlan: UserPlan | null
  isAuthenticated: boolean
  
  // Navigation
  activeTab: string
  previousTab: string
  
  // Data
  prayerSessions: PrayerSession[]
  bibleSessions: BibleSession[]
  meditationSessions: MeditationSession[]
  gameScores: GameScore[]
  
  // UI State
  isDrawerOpen: boolean
  showQuestionnaire: boolean
  isFirstTimeUser: boolean
  isLoading: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setUserPlan: (plan: UserPlan | null) => void
  setActiveTab: (tab: string) => void
  setLoading: (loading: boolean) => void
  
  // Data Actions
  addPrayerSession: (session: PrayerSession) => void
  addBibleSession: (session: BibleSession) => void
  addMeditationSession: (session: MeditationSession) => void
  addGameScore: (score: GameScore) => void
  
  // UI Actions
  toggleDrawer: () => void
  setShowQuestionnaire: (show: boolean) => void
  setIsFirstTimeUser: (isFirst: boolean) => void
  
  // Utility Actions
  clearAllData: () => void
  exportData: () => string
  importData: (data: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      userPlan: null,
      isAuthenticated: false,
      
      activeTab: 'prayer',
      previousTab: 'prayer',
      
      prayerSessions: [],
      bibleSessions: [],
      meditationSessions: [],
      gameScores: [],
      
      isDrawerOpen: false,
      showQuestionnaire: false,
      isFirstTimeUser: true,
      isLoading: false,
      
      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user?.isAuthenticated 
      }),
      
      setUserPlan: (plan) => set({ userPlan: plan }),
      
      setActiveTab: (tab) => set((state) => ({
        previousTab: state.activeTab,
        activeTab: tab
      })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      // Data Actions
      addPrayerSession: (session) => set((state) => ({
        prayerSessions: [...state.prayerSessions, session]
      })),
      
      addBibleSession: (session) => set((state) => ({
        bibleSessions: [...state.bibleSessions, session]
      })),
      
      addMeditationSession: (session) => set((state) => ({
        meditationSessions: [...state.meditationSessions, session]
      })),
      
      addGameScore: (score) => set((state) => ({
        gameScores: [...state.gameScores, score]
      })),
      
      // UI Actions
      toggleDrawer: () => set((state) => ({ 
        isDrawerOpen: !state.isDrawerOpen 
      })),
      
      setShowQuestionnaire: (show) => set({ showQuestionnaire: show }),
      
      setIsFirstTimeUser: (isFirst) => set({ isFirstTimeUser: isFirst }),
      
      // Utility Actions
      clearAllData: () => set({
        prayerSessions: [],
        bibleSessions: [],
        meditationSessions: [],
        gameScores: [],
        userPlan: null,
        showQuestionnaire: false,
        isFirstTimeUser: true
      }),
      
      exportData: () => {
        const state = get()
        return JSON.stringify({
          userPlan: state.userPlan,
          prayerSessions: state.prayerSessions,
          bibleSessions: state.bibleSessions,
          meditationSessions: state.meditationSessions,
          gameScores: state.gameScores,
          exportDate: new Date().toISOString()
        })
      },
      
      importData: (data) => {
        try {
          const imported = JSON.parse(data)
          set({
            userPlan: imported.userPlan || null,
            prayerSessions: imported.prayerSessions || [],
            bibleSessions: imported.bibleSessions || [],
            meditationSessions: imported.meditationSessions || [],
            gameScores: imported.gameScores || []
          })
        } catch (error) {
          console.error('Failed to import data:', error)
        }
      }
    }),
    {
      name: 'christiankit-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userPlan: state.userPlan,
        prayerSessions: state.prayerSessions,
        bibleSessions: state.bibleSessions,
        meditationSessions: state.meditationSessions,
        gameScores: state.gameScores,
        isFirstTimeUser: state.isFirstTimeUser,
        showQuestionnaire: state.showQuestionnaire
      })
    }
  )
)

// Selectors for common use cases
export const useUser = () => useAppStore((state) => state.user)
export const useUserPlan = () => useAppStore((state) => state.userPlan)
export const useActiveTab = () => useAppStore((state) => state.activeTab)
export const usePrayerSessions = () => useAppStore((state) => state.prayerSessions)
export const useBibleSessions = () => useAppStore((state) => state.bibleSessions)
export const useMeditationSessions = () => useAppStore((state) => state.meditationSessions)
export const useGameScores = () => useAppStore((state) => state.gameScores)
