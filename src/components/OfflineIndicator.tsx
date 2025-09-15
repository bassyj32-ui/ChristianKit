import React, { useState, useEffect } from 'react'
import { offlineService } from '../services/offlineService'
import { MobileOptimizedCard } from './MobileOptimizedCard'
import { MobileOptimizedButton } from './MobileOptimizedButton'

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queueLength, setQueueLength] = useState(0)
  const [syncInProgress, setSyncInProgress] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const updateStatus = () => {
      const status = offlineService.getStatus()
      setIsOnline(status.isOnline)
      setQueueLength(status.queueLength)
      setSyncInProgress(status.syncInProgress)
    }

    // Initial status
    updateStatus()

    // Listen for online/offline events
    const handleOnline = () => updateStatus()
    const handleOffline = () => updateStatus()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Update status periodically
    const interval = setInterval(updateStatus, 2000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const handleForceSync = async () => {
    try {
      setSyncInProgress(true)
      await offlineService.forceSync()
    } catch (error) {
      console.error('Force sync failed:', error)
    } finally {
      setSyncInProgress(false)
    }
  }

  const handleClearQueue = () => {
    offlineService.clearQueue()
    setQueueLength(0)
  }

  // Always show indicator for testing/debugging purposes
  // if (isOnline && queueLength === 0) {
  //   return null
  // }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <MobileOptimizedCard
        variant={isOnline ? 'accent' : 'danger'}
        size="sm"
        className="cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg">
              {isOnline ? '🔄' : '📴'}
            </div>
            <div>
              <div className="font-medium text-sm">
                {isOnline ? 'Syncing...' : 'Offline'}
              </div>
              {queueLength > 0 && (
                <div className="text-xs opacity-75">
                  {queueLength} item{queueLength !== 1 ? 's' : ''} pending
                </div>
              )}
            </div>
          </div>
          
          {syncInProgress && (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-current/20">
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium mb-1">Status:</div>
                <div className="opacity-75">
                  {isOnline ? 'Connected to internet' : 'No internet connection'}
                </div>
              </div>

              {queueLength > 0 && (
                <div className="text-sm">
                  <div className="font-medium mb-1">Pending Items:</div>
                  <div className="opacity-75">
                    {queueLength} item{queueLength !== 1 ? 's' : ''} waiting to sync
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {isOnline && queueLength > 0 && (
                  <MobileOptimizedButton
                    onClick={handleForceSync}
                    variant="primary"
                    size="sm"
                    loading={syncInProgress}
                    icon="🔄"
                  >
                    Sync Now
                  </MobileOptimizedButton>
                )}
                
                {queueLength > 0 && (
                  <MobileOptimizedButton
                    onClick={handleClearQueue}
                    variant="ghost"
                    size="sm"
                    icon="🗑️"
                  >
                    Clear
                  </MobileOptimizedButton>
                )}
              </div>
            </div>
          </div>
        )}
      </MobileOptimizedCard>
    </div>
  )
}
