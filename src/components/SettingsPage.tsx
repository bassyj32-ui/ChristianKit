import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { useNavigate } from 'react-router-dom'
import {
  OsmoCard,
  OsmoButton,
  OsmoContainer
} from '../theme/osmoComponents'
import { supabase } from '../utils/supabase'

interface SettingsState {
  dailyNotifications: boolean
  prayerReminders: boolean
  communityPrivacy: 'public' | 'followers' | 'private'
  notificationTime: string
  // Prayer settings
  defaultDuration: number
  defaultMode: 'guided' | 'silent' | 'scripture' | 'worship'
  enableReminders: boolean
  reminderInterval: number
  ambientSound: 'none' | 'nature' | 'ocean' | 'worship' | 'meditation'
  autoSave: boolean
  showScripture: boolean
  // Push notification settings
  pushEnabled: boolean
  emailEnabled: boolean
  urgencyLevel: 'gentle' | 'moderate' | 'aggressive' | 'ruthless'
  frequency: 'hourly' | 'daily' | 'constant'
}

interface NotificationPreferences {
  daily_reminders: boolean
  prayer_reminders: boolean
  preferred_time: string
  timezone: string
}

interface PrayerSettingsType {
  defaultDuration: number
  defaultMode: 'guided' | 'silent' | 'scripture' | 'worship'
  enableReminders: boolean
  reminderInterval: number
  ambientSound: 'none' | 'nature' | 'ocean' | 'worship' | 'meditation'
  autoSave: boolean
  showScripture: boolean
}

interface NotificationPermission {
  isSupported: boolean
  permission: NotificationPermission
  isSubscribed: boolean
}

export const SettingsPage: React.FC = () => {
  const { user, signOut, signInWithGoogle } = useSupabaseAuth()
  const navigate = useNavigate()
  const [settings, setSettings] = useState<SettingsState>({
    dailyNotifications: true,
    prayerReminders: true,
    communityPrivacy: 'public',
    notificationTime: '09:00',
    // Prayer settings defaults
    defaultDuration: 10,
    defaultMode: 'guided',
    enableReminders: true,
    reminderInterval: 30,
    ambientSound: 'none',
    autoSave: true,
    showScripture: true,
    // Push notification defaults
    pushEnabled: false,
    emailEnabled: true,
    urgencyLevel: 'moderate',
    frequency: 'daily'
  })
  const [loading, setLoading] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'prayer' | 'notifications' | 'privacy'>('general')
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default' as unknown as NotificationPermission)
  const [saving, setSaving] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState<string | null>(null)

  // Load settings from localStorage and database on mount
  useEffect(() => {
    loadSettings()
  }, [user])

  const loadSettings = async () => {
    try {
      // Load from localStorage first
      const savedSettings = localStorage.getItem('christiankit-settings')
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      }

      // Load notification preferences from localStorage
      const notificationPrefs = localStorage.getItem('notificationPreferences')
      if (notificationPrefs) {
        const parsed = JSON.parse(notificationPrefs)
        setSettings(prev => ({ ...prev, ...parsed }))
      }

      // Load from database if user is authenticated
      if (user) {
        await loadUserSettings()
      }
    } catch (error: any) {
      console.error('❌ Error loading settings:', {
        code: error?.code,
        message: error?.message
      })
    }
  }

  const loadUserSettings = async () => {
    if (!user) return

    try {
      // Load notification preferences
      const { data: notificationPrefs } = await supabase!
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (notificationPrefs) {
        setSettings(prev => ({
          ...prev,
          dailyNotifications: notificationPrefs.daily_reminders || false,
          prayerReminders: notificationPrefs.prayer_reminders || false,
          notificationTime: notificationPrefs.preferred_time || '09:00'
        }))
      }

      // Load community privacy from user profile
      const { data: profile } = await supabase!
        .from('profiles')
        .select('community_privacy')
        .eq('id', user.id)
        .single()

      if (profile?.community_privacy) {
        setSettings(prev => ({
          ...prev,
          communityPrivacy: profile.community_privacy
        }))
      }
    } catch (error: any) {
      console.error('❌ Error loading user settings:', {
        code: error?.code,
        message: error?.message
      })
    }
  }

  // Input validation functions
  const validateTime = (time: string): boolean => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  const validateDuration = (duration: number): boolean => {
    return duration >= 5 && duration <= 120
  }

  const validateReminderInterval = (interval: number): boolean => {
    return interval >= 15 && interval <= 120
  }

  // Enhanced update setting function with validation
  const updateSetting = async <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    // Clear any previous errors
    setErrors(prev => ({ ...prev, [key]: '' }))

    // Validate inputs
    if (key === 'notificationTime' && !validateTime(value as string)) {
      setErrors(prev => ({ ...prev, [key]: 'Please enter a valid time (HH:MM)' }))
      return
    }

    if (key === 'defaultDuration' && !validateDuration(value as number)) {
      setErrors(prev => ({ ...prev, [key]: 'Duration must be between 5 and 120 minutes' }))
      return
    }

    if (key === 'reminderInterval' && !validateReminderInterval(value as number)) {
      setErrors(prev => ({ ...prev, [key]: 'Reminder interval must be between 15 and 120 seconds' }))
      return
    }

    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)

    // Save to localStorage immediately
    localStorage.setItem('christiankit-settings', JSON.stringify(newSettings))

    // Save to database if user is authenticated
    if (user) {
      await saveToDatabase(newSettings)
    }

    // Update notification services if notification settings changed
    if (key === 'dailyNotifications' || key === 'prayerReminders' || key === 'notificationTime') {
      await updateNotificationServices(newSettings)
    }
  }

  // Notification permission management
  const requestNotificationPermission = async () => {
    try {
      if (!('Notification' in window)) {
        setErrors(prev => ({ ...prev, notifications: 'This browser does not support notifications' }))
        return
      }

      const permission = await Notification.requestPermission()
      setNotificationPermission(permission as unknown as NotificationPermission)

      if (permission === 'granted') {
        await updateSetting('pushEnabled', true)
        setSuccess('Push notifications enabled successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setErrors(prev => ({ ...prev, notifications: 'Notification permission denied' }))
      }
    } catch (error: any) {
      console.error('❌ Error requesting notification permission:', error)
      setErrors(prev => ({ ...prev, notifications: 'Failed to request notification permission' }))
    }
  }

  // Test notification functionality
  const testNotification = async () => {
    try {
      if (notificationPermission !== ('granted' as unknown as NotificationPermission)) {
        await requestNotificationPermission()
        return
      }

      new Notification('🧪 Test Notification', {
        body: 'This is a test notification from ChristianKit!',
        icon: '/icon-192x192.png'
      })

      setSuccess('Test notification sent!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('❌ Error sending test notification:', error)
      setErrors(prev => ({ ...prev, notifications: 'Failed to send test notification' }))
    }
  }

  const saveToDatabase = async (newSettings: SettingsState) => {
    if (!user) return

    try {
      // Save notification preferences
      const notificationPrefs: NotificationPreferences = {
        daily_reminders: newSettings.dailyNotifications,
        prayer_reminders: newSettings.prayerReminders,
        preferred_time: newSettings.notificationTime,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }

      await supabase!
        .from('user_notification_preferences')
        .upsert({
          user_id: user.id,
          ...notificationPrefs,
          updated_at: new Date().toISOString()
        })

      // Save community privacy to user profile
      await supabase!
        .from('profiles')
        .upsert({
          id: user.id,
          community_privacy: newSettings.communityPrivacy,
          updated_at: new Date().toISOString()
        })

      console.log('✅ Settings saved to database')
    } catch (error: any) {
      console.error('❌ Error saving settings to database:', {
        code: error?.code,
        message: error?.message
      })
    }
  }

  const updateNotificationServices = async (newSettings: SettingsState) => {
    try {
      // Update the notification settings that the services read from
      const notificationSettings = {
        emailEnabled: newSettings.emailEnabled,
        pushEnabled: newSettings.pushEnabled,
        frequency: newSettings.dailyNotifications ? 'daily' : 'never',
        preferredTime: newSettings.notificationTime,
        prayerReminders: newSettings.prayerReminders
      }

      localStorage.setItem('notificationPreferences', JSON.stringify(notificationSettings))
      console.log('✅ Notification services updated:', notificationSettings)
    } catch (error: any) {
      console.error('❌ Error updating notification services:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      setLoading(true)
      await signOut()
      navigate('/') // Redirect to homepage
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
      setShowSignOutConfirm(false)
    }
  }

  // Ambient sound options
  const ambientSounds = [
    { value: 'none', label: 'None', description: 'No background sound' },
    { value: 'nature', label: 'Nature Sounds', description: 'Gentle rain, birds, forest' },
    { value: 'ocean', label: 'Ocean Waves', description: 'Calming ocean waves' },
    { value: 'worship', label: 'Worship Music', description: 'Soft instrumental worship' },
    { value: 'meditation', label: 'Meditation', description: 'Peaceful meditation music' }
  ]

  // Prayer modes
  const prayerModes = [
    { value: 'guided', label: 'Guided Prayer', description: 'Step-by-step prayer prompts' },
    { value: 'silent', label: 'Silent Prayer', description: 'Just timer with minimal distractions' },
    { value: 'scripture', label: 'Scripture Prayer', description: 'Bible verses appear during prayer' },
    { value: 'worship', label: 'Worship Prayer', description: 'Background worship music' }
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <OsmoContainer padding={true}>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2">Settings</h1>
          <p className="text-[var(--text-secondary)] text-lg">
            Customize your ChristianKit experience and manage your account
          </p>
        </div>

        {/* Sign In Prompt for Non-Authenticated Users */}
        {!user && (
          <OsmoCard className="mb-8 text-center">
            <div className="p-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Sign In Required</h3>
              <p className="text-[var(--text-secondary)] mb-6">Sign in to access your personalized settings</p>
              <OsmoButton
                onClick={signInWithGoogle}
                variant="primary"
                className="px-8 py-3"
              >
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center mr-2">
                  <span className="text-[var(--accent-primary)] text-sm font-bold">G</span>
                </div>
                Sign In with Google
              </OsmoButton>
            </div>
          </OsmoCard>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 p-1 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-2xl">
            {(['general', 'prayer', 'notifications', 'privacy'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-[var(--accent-primary)] text-white shadow-lg'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-light)]'
                }`}
              >
                {tab === 'general' && 'General'}
                {tab === 'prayer' && 'Prayer'}
                {tab === 'notifications' && 'Notifications'}
                {tab === 'privacy' && 'Privacy'}
              </button>
            ))}
          </div>
        </div>

        {/* Settings for Authenticated Users */}
        {user && (
          <div className="space-y-6">
            {/* Success Messages */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                {success}
              </div>
            )}

            {/* Tab Content */}
            {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Daily Notifications */}
            <OsmoCard className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-[var(--spiritual-blue)]/5"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V1H4v4zM15 3h5l-5-5v5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Daily Notifications</h3>
                      <p className="text-[var(--text-secondary)] text-sm">Receive spiritual messages and reminders daily</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateSetting('dailyNotifications', !settings.dailyNotifications)}
                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                      settings.dailyNotifications
                        ? 'bg-[var(--accent-primary)]'
                        : 'bg-[var(--glass-border)]'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                      settings.dailyNotifications ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                
                {/* Time Picker */}
                {settings.dailyNotifications && (
                  <div className="flex items-center gap-3 pl-16">
                    <label className="text-sm text-[var(--text-secondary)]">Time:</label>
                    <input
                      type="time"
                      value={settings.notificationTime}
                      onChange={(e) => updateSetting('notificationTime', e.target.value)}
                      className="bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                    />
                        {errors.notificationTime && (
                          <span className="text-red-400 text-sm">{errors.notificationTime}</span>
                        )}
                  </div>
                )}
              </div>
            </OsmoCard>

                {/* Email Notifications */}
            <OsmoCard className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--spiritual-blue)]/5 to-[var(--spiritual-cyan)]/5"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[var(--spiritual-blue)]/20 to-[var(--spiritual-cyan)]/20 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-[var(--spiritual-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Email Notifications</h3>
                          <p className="text-[var(--text-secondary)] text-sm">Receive notifications via email</p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateSetting('emailEnabled', !settings.emailEnabled)}
                        className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                          settings.emailEnabled
                            ? 'bg-[var(--spiritual-blue)]'
                            : 'bg-[var(--glass-border)]'
                        }`}
                      >
                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                          settings.emailEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </OsmoCard>
              </div>
            )}

            {activeTab === 'prayer' && (
              <div className="space-y-6">
                {/* Default Prayer Duration */}
                <OsmoCard className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--spiritual-blue)]/5 to-[var(--spiritual-cyan)]/5"></div>
                  <div className="relative p-6">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">⏰ Default Prayer Duration</h3>
                    <div className="flex flex-wrap justify-center gap-3">
                      {[5, 10, 15, 20, 30].map((minutes) => (
                        <button
                          key={minutes}
                          onClick={() => updateSetting('defaultDuration', minutes)}
                          className={`p-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 border-2 ${
                            settings.defaultDuration === minutes
                              ? 'bg-[var(--spiritual-blue)] text-white shadow-lg border-[var(--spiritual-blue)]'
                              : 'bg-[var(--glass-dark)] text-[var(--text-primary)] hover:bg-[var(--glass-light)] border-[var(--glass-border)]'
                          }`}
                        >
                          {minutes}
                          <div className="text-xs font-normal mt-1">MINUTES</div>
                        </button>
                      ))}
                    </div>
                    {errors.defaultDuration && (
                      <p className="text-red-400 text-sm mt-2 text-center">{errors.defaultDuration}</p>
                    )}
                  </div>
                </OsmoCard>

                {/* Prayer Mode */}
                <OsmoCard className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-secondary)]/5 to-[var(--spiritual-blue)]/5"></div>
                  <div className="relative p-6">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">🙏 Default Prayer Mode</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {prayerModes.map((mode) => (
                        <button
                          key={mode.value}
                          onClick={() => updateSetting('defaultMode', mode.value as SettingsState['defaultMode'])}
                          className={`p-4 rounded-xl text-left transition-all duration-300 hover:scale-105 border-2 ${
                            settings.defaultMode === mode.value
                              ? 'bg-[var(--accent-secondary)] text-white shadow-lg border-[var(--accent-secondary)]'
                              : 'bg-[var(--glass-dark)] text-[var(--text-primary)] hover:bg-[var(--glass-light)] border-[var(--glass-border)]'
                          }`}
                        >
                          <h4 className="font-semibold">{mode.label}</h4>
                          <p className="text-sm opacity-80 mt-1">{mode.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </OsmoCard>

                {/* Prayer Reminders */}
                <OsmoCard className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--spiritual-blue)]/5 to-[var(--spiritual-cyan)]/5"></div>
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--spiritual-blue)]/20 to-[var(--spiritual-cyan)]/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-[var(--spiritual-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Enable Prayer Reminders</h3>
                          <p className="text-[var(--text-secondary)] text-sm">Show gentle prompts during prayer</p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateSetting('enableReminders', !settings.enableReminders)}
                        className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                          settings.enableReminders
                            ? 'bg-[var(--spiritual-blue)]'
                            : 'bg-[var(--glass-border)]'
                        }`}
                      >
                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                          settings.enableReminders ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {settings.enableReminders && (
                      <div className="pl-16">
                        <label className="block text-sm text-[var(--text-secondary)] mb-2">Reminder Interval (seconds)</label>
                        <input
                          type="range"
                          min="15"
                          max="120"
                          step="15"
                          value={settings.reminderInterval}
                          onChange={(e) => updateSetting('reminderInterval', parseInt(e.target.value))}
                          className="w-full h-2 bg-[var(--glass-border)] rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
                          <span>15s</span>
                          <span className="font-semibold">{settings.reminderInterval}s</span>
                          <span>120s</span>
                        </div>
                        {errors.reminderInterval && (
                          <p className="text-red-400 text-sm mt-2">{errors.reminderInterval}</p>
                        )}
                      </div>
                    )}
                  </div>
                </OsmoCard>

                {/* Ambient Sound */}
                <OsmoCard className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-secondary)]/5 to-[var(--spiritual-blue)]/5"></div>
                  <div className="relative p-6">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">🔊 Ambient Sound</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ambientSounds.map((sound) => (
                        <button
                          key={sound.value}
                          onClick={() => updateSetting('ambientSound', sound.value as SettingsState['ambientSound'])}
                          className={`p-4 rounded-xl text-left transition-all duration-300 hover:scale-105 border-2 ${
                            settings.ambientSound === sound.value
                              ? 'bg-[var(--accent-secondary)] text-white shadow-lg border-[var(--accent-secondary)]'
                              : 'bg-[var(--glass-dark)] text-[var(--text-primary)] hover:bg-[var(--glass-light)] border-[var(--glass-border)]'
                          }`}
                        >
                          <h4 className="font-semibold">{sound.label}</h4>
                          <p className="text-sm opacity-80 mt-1">{sound.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </OsmoCard>

                {/* Additional Settings */}
                <OsmoCard className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--spiritual-blue)]/5 to-[var(--spiritual-cyan)]/5"></div>
                  <div className="relative p-6">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">⚙️ Additional Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[var(--text-primary)]">Auto Save Sessions</h4>
                          <p className="text-sm text-[var(--text-secondary)]">Automatically save prayer sessions</p>
                        </div>
                        <button
                          onClick={() => updateSetting('autoSave', !settings.autoSave)}
                          className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                            settings.autoSave
                              ? 'bg-[var(--spiritual-blue)]'
                              : 'bg-[var(--glass-border)]'
                          }`}
                        >
                          <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                            settings.autoSave ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[var(--text-primary)]">Show Scripture Verses</h4>
                          <p className="text-sm text-[var(--text-secondary)]">Display Bible verses during prayer</p>
                  </div>
                  <button
                          onClick={() => updateSetting('showScripture', !settings.showScripture)}
                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                            settings.showScripture
                        ? 'bg-[var(--spiritual-blue)]'
                        : 'bg-[var(--glass-border)]'
                    }`}
                  >
                    <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                            settings.showScripture ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                    </div>
                  </div>
                </OsmoCard>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                {/* Push Notifications */}
                <OsmoCard className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-[var(--spiritual-blue)]/5"></div>
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V1H4v4zM15 3h5l-5-5v5z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Push Notifications</h3>
                          <p className="text-[var(--text-secondary)] text-sm">Browser notifications for spiritual reminders</p>
                        </div>
                      </div>
                      <button
                        onClick={() => updateSetting('pushEnabled', !settings.pushEnabled)}
                        className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                          settings.pushEnabled
                            ? 'bg-[var(--accent-primary)]'
                            : 'bg-[var(--glass-border)]'
                        }`}
                      >
                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                          settings.pushEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {settings.pushEnabled && (
                      <div className="pl-16 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-[var(--text-primary)]">Request Permission</h4>
                            <p className="text-sm text-[var(--text-secondary)]">Enable browser notifications</p>
                          </div>
                          <button
                            onClick={requestNotificationPermission}
                            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary)]/80 transition-all duration-300"
                          >
                            {notificationPermission === ('granted' as unknown as NotificationPermission) ? '✓ Granted' : 'Request'}
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-[var(--text-primary)]">Test Notification</h4>
                            <p className="text-sm text-[var(--text-secondary)]">Send a test notification</p>
                          </div>
                          <button
                            onClick={testNotification}
                            className="px-4 py-2 bg-[var(--spiritual-blue)] text-white rounded-lg hover:bg-[var(--spiritual-blue)]/80 transition-all duration-300"
                          >
                            🧪 Test
                          </button>
                        </div>
                      </div>
                    )}
              </div>
            </OsmoCard>

                {/* Notification Settings */}
                <OsmoCard className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--spiritual-blue)]/5 to-[var(--spiritual-cyan)]/5"></div>
                  <div className="relative p-6">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Notification Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[var(--text-primary)]">Urgency Level</h4>
                          <p className="text-sm text-[var(--text-secondary)]">How persistent notifications should be</p>
                        </div>
                        <select
                          value={settings.urgencyLevel}
                          onChange={(e) => updateSetting('urgencyLevel', e.target.value as SettingsState['urgencyLevel'])}
                          className="bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                        >
                          <option value="gentle">Gentle</option>
                          <option value="moderate">Moderate</option>
                          <option value="aggressive">Aggressive</option>
                          <option value="ruthless">Ruthless</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-[var(--text-primary)]">Frequency</h4>
                          <p className="text-sm text-[var(--text-secondary)]">How often to send notifications</p>
                        </div>
                        <select
                          value={settings.frequency}
                          onChange={(e) => updateSetting('frequency', e.target.value as SettingsState['frequency'])}
                          className="bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all"
                        >
                          <option value="hourly">Hourly</option>
                          <option value="daily">Daily</option>
                          <option value="constant">Constant</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </OsmoCard>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
            {/* Community Privacy */}
            <OsmoCard className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-secondary)]/5 to-[var(--spiritual-blue)]/5"></div>
              <div className="relative p-6">
                    <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">🔒 Privacy Settings</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-secondary)]/20 to-[var(--spiritual-blue)]/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                          <h4 className="text-lg font-semibold text-[var(--text-primary)]">Community Privacy</h4>
                      <p className="text-[var(--text-secondary)] text-sm">Control who can see your posts and activities</p>
                    </div>
                  </div>
                  <select
                    value={settings.communityPrivacy}
                    onChange={(e) => updateSetting('communityPrivacy', e.target.value as SettingsState['communityPrivacy'])}
                    className="bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all min-w-[140px]"
                  >
                    <option value="public">Public</option>
                    <option value="followers">Followers Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            </OsmoCard>
              </div>
            )}

            {/* Sign Out */}
            <OsmoCard className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--text-primary)]">Sign Out</h3>
                      <p className="text-[var(--text-secondary)] text-sm">Sign out of your account and return to homepage</p>
                    </div>
                  </div>
                  <OsmoButton
                    onClick={() => setShowSignOutConfirm(true)}
                    variant="secondary"
                    disabled={loading}
                    className="px-6 py-3 border-2 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500 transition-all duration-300"
                  >
                    {loading ? 'Signing Out...' : 'Sign Out'}
                  </OsmoButton>
                </div>
              </div>
            </OsmoCard>
          </div>
        )}

        {/* Sign Out Confirmation Dialog */}
        {showSignOutConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <OsmoCard className="max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">Confirm Sign Out</h3>
                    <p className="text-[var(--text-secondary)] text-sm">Are you sure you want to sign out?</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <OsmoButton
                    onClick={handleSignOut}
                    variant="secondary"
                    disabled={loading}
                    className="flex-1 px-6 py-3 border-2 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500 transition-all duration-300"
                  >
                    {loading ? 'Signing Out...' : 'Yes, Sign Out'}
                  </OsmoButton>
                  <OsmoButton
                    onClick={() => setShowSignOutConfirm(false)}
                    variant="primary"
                    className="flex-1 px-6 py-3"
                    disabled={loading}
                  >
                    Cancel
                  </OsmoButton>
                </div>
              </div>
            </OsmoCard>
          </div>
        )}
      </OsmoContainer>
    </div>
  )
}