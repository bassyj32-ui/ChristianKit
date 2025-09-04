import { supabase } from '../utils/supabase'
import { useAppStore, PrayerSession, BibleSession, MeditationSession, GameScore, UserPlan } from '../store/appStore'

interface SyncResult {
  success: boolean
  error?: string
  syncedAt: string
}

interface CloudData {
  userPlan: UserPlan | null
  prayerSessions: PrayerSession[]
  bibleSessions: BibleSession[]
  meditationSessions: MeditationSession[]
  gameScores: GameScore[]
  lastSync: string
}

class CloudSyncService {
  private isOnline: boolean = navigator.onLine
  private syncInProgress: boolean = false
  private lastSyncTime: string | null = null

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncData()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })

    // Auto-sync every 5 minutes when online
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.syncData()
      }
    }, 5 * 60 * 1000)
  }

  // Initialize cloud sync
  async initialize(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Load data from cloud on initialization
        await this.loadFromCloud()
      }
    } catch (error) {
      console.error('Cloud sync initialization error:', error)
    }
  }

  // Sync data to cloud
  async syncToCloud(): Promise<SyncResult> {
    if (!this.isOnline) {
      return {
        success: false,
        error: 'No internet connection',
        syncedAt: new Date().toISOString()
      }
    }

    if (this.syncInProgress) {
      return {
        success: false,
        error: 'Sync already in progress',
        syncedAt: new Date().toISOString()
      }
    }

    try {
      this.syncInProgress = true
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const state = useAppStore.getState()
      const cloudData: CloudData = {
        userPlan: state.userPlan,
        prayerSessions: state.prayerSessions,
        bibleSessions: state.bibleSessions,
        meditationSessions: state.meditationSessions,
        gameScores: state.gameScores,
        lastSync: new Date().toISOString()
      }

      // Upsert user data
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: user.id,
          data: cloudData,
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw error
      }

      this.lastSyncTime = new Date().toISOString()
      
      return {
        success: true,
        syncedAt: this.lastSyncTime
      }
    } catch (error) {
      console.error('Cloud sync error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        syncedAt: new Date().toISOString()
      }
    } finally {
      this.syncInProgress = false
    }
  }

  // Load data from cloud
  async loadFromCloud(): Promise<SyncResult> {
    if (!this.isOnline) {
      return {
        success: false,
        error: 'No internet connection',
        syncedAt: new Date().toISOString()
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('user_data')
        .select('data, updated_at')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data?.data) {
        const cloudData: CloudData = data.data
        
        // Merge cloud data with local data
        const state = useAppStore.getState()
        
        // Only update if cloud data is newer
        if (!this.lastSyncTime || new Date(cloudData.lastSync) > new Date(this.lastSyncTime)) {
          useAppStore.setState({
            userPlan: cloudData.userPlan || state.userPlan,
            prayerSessions: this.mergeSessions(state.prayerSessions, cloudData.prayerSessions),
            bibleSessions: this.mergeSessions(state.bibleSessions, cloudData.bibleSessions),
            meditationSessions: this.mergeSessions(state.meditationSessions, cloudData.meditationSessions),
            gameScores: this.mergeSessions(state.gameScores, cloudData.gameScores)
          })
        }

        this.lastSyncTime = data.updated_at
      }

      return {
        success: true,
        syncedAt: this.lastSyncTime || new Date().toISOString()
      }
    } catch (error) {
      console.error('Cloud load error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        syncedAt: new Date().toISOString()
      }
    }
  }

  // Sync data (bidirectional)
  async syncData(): Promise<SyncResult> {
    try {
      // First load from cloud
      const loadResult = await this.loadFromCloud()
      
      if (!loadResult.success) {
        return loadResult
      }

      // Then sync to cloud
      const syncResult = await this.syncToCloud()
      
      return syncResult
    } catch (error) {
      console.error('Sync error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        syncedAt: new Date().toISOString()
      }
    }
  }

  // Merge sessions (local and cloud)
  private mergeSessions<T extends { id: string; date: string }>(
    local: T[], 
    cloud: T[]
  ): T[] {
    const merged = new Map<string, T>()
    
    // Add local sessions
    local.forEach(session => {
      merged.set(session.id, session)
    })
    
    // Add/update with cloud sessions
    cloud.forEach(session => {
      const existing = merged.get(session.id)
      if (!existing || new Date(session.date) > new Date(existing.date)) {
        merged.set(session.id, session)
      }
    })
    
    return Array.from(merged.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }

  // Get sync status
  getSyncStatus(): {
    isOnline: boolean
    syncInProgress: boolean
    lastSync: string | null
  } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      lastSync: this.lastSyncTime
    }
  }

  // Force sync
  async forceSync(): Promise<SyncResult> {
    return this.syncData()
  }

  // Export data for backup
  async exportData(): Promise<string> {
    const state = useAppStore.getState()
    return state.exportData()
  }

  // Import data from backup
  async importData(data: string): Promise<SyncResult> {
    try {
      const state = useAppStore.getState()
      state.importData(data)
      
      // Sync imported data to cloud
      return await this.syncToCloud()
    } catch (error) {
      console.error('Import error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        syncedAt: new Date().toISOString()
      }
    }
  }
}

export const cloudSyncService = new CloudSyncService()
