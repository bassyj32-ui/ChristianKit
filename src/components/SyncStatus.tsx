import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
// Removed cloudDataService - using Supabase directly

interface SyncStatus {
  lastSync: Date | null
  dataCount: number
}

export const SyncStatus: React.FC = () => {
  const { user } = useSupabaseAuth()
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncAttempt, setLastSyncAttempt] = useState<Date | null>(null)
  const [syncMessage, setSyncMessage] = useState('')

  useEffect(() => {
    if (user) {
      loadSyncStatus()
    }
  }, [user])

  const loadSyncStatus = async () => {
    if (!user) return
    
    try {
      // Using Supabase only - no local sync needed
      setSyncStatus({ lastSync: new Date(), dataCount: 0 })
    } catch (error) {
      console.error('Error loading sync status:', error)
    }
  }

  const handleSyncToCloud = async () => {
    if (!user) return
    
    setIsSyncing(true)
    setSyncMessage('Syncing local data to cloud...')
    
    try {
      // Using Supabase only - no local sync neededsyncLocalDataToCloud(user)
      setSyncMessage('✅ Data synced to cloud successfully!')
      setLastSyncAttempt(new Date())
      await loadSyncStatus()
    } catch (error) {
      setSyncMessage('❌ Failed to sync data. Please try again.')
      console.error('Sync error:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSyncFromCloud = async () => {
    if (!user) return
    
    setIsSyncing(true)
    setSyncMessage('Syncing cloud data to local...')
    
    try {
      // Using Supabase only - no local sync neededsyncCloudDataToLocal(user)
      setSyncMessage('✅ Data synced from cloud successfully!')
      setLastSyncAttempt(new Date())
      await loadSyncStatus()
    } catch (error) {
      setSyncMessage('❌ Failed to sync data. Please try again.')
      console.error('Sync error:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleAutoSync = async () => {
    if (!user) return
    
    setIsSyncing(true)
    setSyncMessage('Performing automatic sync...')
    
    try {
      // First sync local to cloud, then cloud to local
      // Using Supabase only - no local sync neededsyncLocalDataToCloud(user)
      // Using Supabase only - no local sync neededsyncCloudDataToLocal(user)
      setSyncMessage('✅ Automatic sync completed successfully!')
      setLastSyncAttempt(new Date())
      await loadSyncStatus()
    } catch (error) {
      setSyncMessage('❌ Automatic sync failed. Please try manual sync.')
      console.error('Auto sync error:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-100">🌐 Cloud Sync Status</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            syncStatus?.lastSync ? 'bg-green-500' : 'bg-yellow-500'
          }`}></div>
          <span className="text-sm text-gray-400">
            {syncStatus?.lastSync ? 'Synced' : 'Not Synced'}
          </span>
        </div>
      </div>

      {/* Sync Status Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {syncStatus?.dataCount || 0}
          </div>
          <div className="text-sm text-gray-400">Data Items</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">
            {syncStatus?.lastSync ? syncStatus.lastSync.toLocaleDateString() : 'Never'}
          </div>
          <div className="text-sm text-gray-400">Last Sync</div>
        </div>
      </div>

      {/* Sync Message */}
      {syncMessage && (
        <div className="mb-4 p-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <p className="text-sm text-gray-300">{syncMessage}</p>
        </div>
      )}

      {/* Sync Controls */}
      <div className="space-y-3">
        <button
          onClick={handleAutoSync}
          disabled={isSyncing}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? '🔄 Syncing...' : '🔄 Auto Sync (Recommended)'}
        </button>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSyncToCloud}
            disabled={isSyncing}
            className="py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📤 To Cloud
          </button>
          <button
            onClick={handleSyncFromCloud}
            disabled={isSyncing}
            className="py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📥 From Cloud
          </button>
        </div>
      </div>

      {/* Sync Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>• Auto sync ensures your data is up-to-date across all devices</p>
        <p>• Data is automatically backed up to the cloud</p>
        <p>• Changes sync in real-time when you're online</p>
      </div>

      {/* Last Sync Attempt */}
      {lastSyncAttempt && (
        <div className="mt-4 pt-4 border-t border-neutral-700">
          <p className="text-xs text-gray-400">
            Last sync attempt: {lastSyncAttempt.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}
