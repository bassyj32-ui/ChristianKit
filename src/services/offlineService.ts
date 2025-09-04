import { useAppStore } from '../store/appStore'

interface OfflineQueueItem {
  id: string
  type: 'prayer' | 'bible' | 'meditation' | 'game' | 'user'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  retries: number
}

class OfflineService {
  private isOnline: boolean = navigator.onLine
  private offlineQueue: OfflineQueueItem[] = []
  private syncInProgress: boolean = false
  private maxRetries: number = 3
  private retryDelay: number = 5000 // 5 seconds

  constructor() {
    this.initialize()
  }

  private initialize() {
    // Load offline queue from localStorage
    this.loadOfflineQueue()

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))

    // Auto-sync when coming online
    if (this.isOnline) {
      this.syncOfflineQueue()
    }
  }

  private loadOfflineQueue() {
    try {
      const saved = localStorage.getItem('offline-queue')
      if (saved) {
        this.offlineQueue = JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error)
      this.offlineQueue = []
    }
  }

  private saveOfflineQueue() {
    try {
      localStorage.setItem('offline-queue', JSON.stringify(this.offlineQueue))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }
  }

  private handleOnline() {
    console.log('🌐 App is online - syncing offline data')
    this.isOnline = true
    this.syncOfflineQueue()
  }

  private handleOffline() {
    console.log('📴 App is offline - queuing operations')
    this.isOnline = false
  }

  // Add item to offline queue
  addToQueue(type: OfflineQueueItem['type'], action: OfflineQueueItem['action'], data: any): string {
    const item: OfflineQueueItem = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      action,
      data,
      timestamp: Date.now(),
      retries: 0
    }

    this.offlineQueue.push(item)
    this.saveOfflineQueue()

    console.log(`📝 Added to offline queue: ${type} ${action}`, item)

    // Try to sync immediately if online
    if (this.isOnline) {
      this.syncOfflineQueue()
    }

    return item.id
  }

  // Sync offline queue with server
  async syncOfflineQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.offlineQueue.length === 0) {
      return
    }

    this.syncInProgress = true
    console.log(`🔄 Syncing ${this.offlineQueue.length} offline items`)

    const itemsToSync = [...this.offlineQueue]
    const successfulItems: string[] = []
    const failedItems: OfflineQueueItem[] = []

    for (const item of itemsToSync) {
      try {
        await this.syncItem(item)
        successfulItems.push(item.id)
        console.log(`✅ Synced offline item: ${item.type} ${item.action}`)
      } catch (error) {
        console.error(`❌ Failed to sync offline item: ${item.type} ${item.action}`, error)
        
        // Increment retry count
        item.retries++
        
        if (item.retries < this.maxRetries) {
          failedItems.push(item)
        } else {
          console.error(`🚫 Max retries exceeded for item: ${item.id}`)
        }
      }
    }

    // Update queue with failed items
    this.offlineQueue = failedItems
    this.saveOfflineQueue()

    // Schedule retry for failed items
    if (failedItems.length > 0) {
      setTimeout(() => {
        this.syncOfflineQueue()
      }, this.retryDelay)
    }

    this.syncInProgress = false

    if (successfulItems.length > 0) {
      console.log(`🎉 Successfully synced ${successfulItems.length} items`)
    }
  }

  // Sync individual item
  private async syncItem(item: OfflineQueueItem): Promise<void> {
    // This would integrate with your actual API calls
    // For now, we'll simulate the sync process
    
    switch (item.type) {
      case 'prayer':
        await this.syncPrayerSession(item)
        break
      case 'bible':
        await this.syncBibleSession(item)
        break
      case 'meditation':
        await this.syncMeditationSession(item)
        break
      case 'game':
        await this.syncGameScore(item)
        break
      case 'user':
        await this.syncUserData(item)
        break
      default:
        throw new Error(`Unknown sync type: ${item.type}`)
    }
  }

  // Simulate API calls (replace with actual API integration)
  private async syncPrayerSession(item: OfflineQueueItem): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Simulated network error')
    }
  }

  private async syncBibleSession(item: OfflineQueueItem): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    if (Math.random() < 0.1) {
      throw new Error('Simulated network error')
    }
  }

  private async syncMeditationSession(item: OfflineQueueItem): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    if (Math.random() < 0.1) {
      throw new Error('Simulated network error')
    }
  }

  private async syncGameScore(item: OfflineQueueItem): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    if (Math.random() < 0.1) {
      throw new Error('Simulated network error')
    }
  }

  private async syncUserData(item: OfflineQueueItem): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000))
    if (Math.random() < 0.1) {
      throw new Error('Simulated network error')
    }
  }

  // Get offline status
  getStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.offlineQueue.length,
      syncInProgress: this.syncInProgress,
      oldestItem: this.offlineQueue.length > 0 ? this.offlineQueue[0].timestamp : null
    }
  }

  // Clear offline queue
  clearQueue() {
    this.offlineQueue = []
    this.saveOfflineQueue()
    console.log('🗑️ Cleared offline queue')
  }

  // Get queue items
  getQueueItems(): OfflineQueueItem[] {
    return [...this.offlineQueue]
  }

  // Force sync
  async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncOfflineQueue()
    } else {
      throw new Error('Cannot sync while offline')
    }
  }
}

export const offlineService = new OfflineService()
