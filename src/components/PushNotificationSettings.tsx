import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { pushNotificationService } from '../services/pushNotificationService'

interface NotificationPreferences {
  prayerReminders: boolean
  communityUpdates: boolean
  dailyMotivation: boolean
  weeklyProgress: boolean
  bibleStudy: boolean
  pushEnabled: boolean
}

export const PushNotificationSettings: React.FC = () => {
  const { user } = useSupabaseAuth()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    prayerReminders: true,
    communityUpdates: true,
    dailyMotivation: true,
    weeklyProgress: false,
    bibleStudy: true,
    pushEnabled: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<string>('default')
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (user) {
      loadNotificationPreferences()
      checkPermissionStatus()
    }
  }, [user])

  const loadNotificationPreferences = () => {
    const saved = localStorage.getItem('notificationPreferences')
    if (saved) {
      setPreferences(JSON.parse(saved))
    }
  }

  const checkPermissionStatus = async () => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission)
      
      if (Notification.permission === 'granted') {
        const token = await pushNotificationService.requestPermissionAndToken()
        setFcmToken(token)
        setPreferences(prev => ({ ...prev, pushEnabled: true }))
      }
    }
  }

  const handlePermissionRequest = async () => {
    setIsLoading(true)
    setMessage('Requesting notification permission...')
    
    try {
      const token = await pushNotificationService.requestPermissionAndToken()
      
      if (token) {
        setFcmToken(token)
        setPreferences(prev => ({ ...prev, pushEnabled: true }))
        setPermissionStatus('granted')
        setMessage('✅ Push notifications enabled successfully!')
        
        // Save preferences
        savePreferences({ ...preferences, pushEnabled: true })
      } else {
        setMessage('❌ Failed to enable push notifications')
      }
    } catch (error) {
      console.error('Error requesting permission:', error)
      setMessage('❌ Error enabling push notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    savePreferences(newPreferences)
  }

  const savePreferences = (newPreferences: NotificationPreferences) => {
    localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences))
    
    // Save to cloud if user is authenticated
    if (user) {
      // This would typically save to your backend
      console.log('Saving notification preferences to cloud:', newPreferences)
    }
  }

  const handleTestNotification = async () => {
    if (!user) return
    
    setIsLoading(true)
    setMessage('Sending test notification...')
    
    try {
      const success = await pushNotificationService.sendTestNotification()
      
      if (success) {
        setMessage('✅ Test notification sent successfully!')
      } else {
        setMessage('❌ Failed to send test notification')
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      setMessage('❌ Error sending test notification')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setIsLoading(true)
    setMessage('Unsubscribing from push notifications...')
    
    try {
      await pushNotificationService.unsubscribeFromPushNotifications()
      setPreferences(prev => ({ ...prev, pushEnabled: false }))
      setFcmToken(null)
      setPermissionStatus('denied')
      setMessage('✅ Unsubscribed from push notifications')
      
      savePreferences({ ...preferences, pushEnabled: false })
    } catch (error) {
      console.error('Error unsubscribing:', error)
      setMessage('❌ Error unsubscribing')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-100">🔔 Push Notifications</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            preferences.pushEnabled ? 'bg-green-500' : 'bg-yellow-500'
          }`}></div>
          <span className="text-sm text-gray-400">
            {preferences.pushEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Permission Status */}
      <div className="mb-6 p-4 bg-neutral-800 rounded-lg border border-neutral-700">
        <div className="flex justify-between items-center mb-3">
          <span className="text-gray-300 font-medium">Permission Status</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            permissionStatus === 'granted' ? 'bg-green-500 text-white' :
            permissionStatus === 'denied' ? 'bg-red-500 text-white' :
            'bg-yellow-500 text-white'
          }`}>
            {permissionStatus === 'granted' ? 'Granted' :
             permissionStatus === 'denied' ? 'Denied' : 'Default'}
          </span>
        </div>
        
        {permissionStatus === 'default' && (
          <button
            onClick={handlePermissionRequest}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '🔄 Enabling...' : '🔔 Enable Push Notifications'}
          </button>
        )}
        
        {permissionStatus === 'denied' && (
          <p className="text-sm text-gray-400">
            Notification permission was denied. Please enable it in your browser settings.
          </p>
        )}
        
        {permissionStatus === 'granted' && (
          <div className="text-sm text-gray-400">
            <p>✅ Push notifications are enabled</p>
            {fcmToken && (
              <p className="mt-2 text-xs text-gray-500 break-all">
                FCM Token: {fcmToken.substring(0, 20)}...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      {permissionStatus === 'granted' && (
        <div className="space-y-4 mb-6">
          <h4 className="text-lg font-medium text-gray-100">Notification Types</h4>
          
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>⏰</span>
                <span className="text-gray-300">Prayer Reminders</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.prayerReminders}
                onChange={(e) => handlePreferenceChange('prayerReminders', e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 focus:ring-2"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>👥</span>
                <span className="text-gray-300">Community Updates</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.communityUpdates}
                onChange={(e) => handlePreferenceChange('communityUpdates', e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 focus:ring-2"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>✨</span>
                <span className="text-gray-300">Daily Motivation</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.dailyMotivation}
                onChange={(e) => handlePreferenceChange('dailyMotivation', e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 focus:ring-2"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>📊</span>
                <span className="text-gray-300">Weekly Progress</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.weeklyProgress}
                onChange={(e) => handlePreferenceChange('weeklyProgress', e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 focus:ring-2"
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>📖</span>
                <span className="text-gray-300">Bible Study</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.bibleStudy}
                onChange={(e) => handlePreferenceChange('bibleStudy', e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-neutral-700 border-neutral-600 rounded focus:ring-blue-500 focus:ring-2"
              />
            </label>
          </div>
        </div>
      )}

      {/* Test and Control Buttons */}
      {permissionStatus === 'granted' && (
        <div className="space-y-3">
          <button
            onClick={handleTestNotification}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🧪 Send Test Notification
          </button>
          
          <button
            onClick={handleUnsubscribe}
            disabled={isLoading}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🚫 Unsubscribe from Push
          </button>
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className="mt-4 p-3 rounded-lg bg-neutral-800 border border-neutral-700">
          <p className="text-sm text-gray-300">{message}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 text-xs text-gray-500">
        <p>• Push notifications work even when the app is closed</p>
        <p>• You can customize which types of notifications to receive</p>
        <p>• Notifications are delivered in real-time across all devices</p>
      </div>
    </div>
  )
}
