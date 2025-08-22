import React, { useState } from 'react'
import { useAuth } from './AuthProvider'
import { dataExportService } from '../services/dataExportService'
import { reminderService } from '../services/reminderService'
import { SyncStatus } from './SyncStatus'
import { PushNotificationSettings } from './PushNotificationSettings'

interface Settings {
  theme: string
  notifications: {
    prayer: boolean
    bible: boolean
    community: boolean
    daily: boolean
  }
  privacy: {
    shareProgress: boolean
    publicProfile: boolean
    showStats: boolean
  }
}

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('account')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    notifications: {
      prayer: true,
      bible: true,
      community: true,
      daily: true
    },
    privacy: {
      shareProgress: false,
      publicProfile: false,
      showStats: true
    }
  })

  const handleSettingChange = (category: keyof Settings, setting: string, value: any) => {
    setSettings(prev => {
      if (category === 'notifications') {
        return {
          ...prev,
          notifications: {
            ...prev.notifications,
            [setting]: value
          }
        }
      } else if (category === 'privacy') {
        return {
          ...prev,
          privacy: {
            ...prev.privacy,
            [setting]: value
          }
        }
      } else {
        return {
          ...prev,
          [category]: value
        }
      }
    })
  }

  const handleExportAllData = async () => {
    try {
      setIsExporting(true)
      await dataExportService.exportAllData()
      dataExportService.updateLastBackupDate()
      alert('Data exported successfully!')
    } catch (error) {
      alert('Failed to export data: ' + error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = async () => {
    if (!importFile) return
    
    try {
      setIsImporting(true)
      await dataExportService.importData(importFile)
      // Page will reload after import
    } catch (error) {
      alert('Failed to import data: ' + error)
      setIsImporting(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/json') {
      setImportFile(file)
    } else {
      alert('Please select a valid JSON backup file')
    }
  }

  const handleLogout = () => {
    logout()
  }

  const tabs = [
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'reminders', label: 'Prayer Reminders', icon: '⏰' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'sync', label: 'Cloud Sync', icon: '🌐' },
    { id: 'data', label: 'Data & Backup', icon: '💾' },
    { id: 'help', label: 'Help & Support', icon: '❓' }
  ]

  const dataSummary = dataExportService.getDataSummary()

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-6">
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full p-3 bg-neutral-700 border border-neutral-600 rounded-xl text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email managed by Google</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                  <input
                    type="text"
                    defaultValue={user?.email?.split('@')[0] || 'User'}
                    className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Account Actions</h3>
              <div className="space-y-4">
                <button
                  onClick={handleLogout}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300"
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <PushNotificationSettings />
            
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">🔔 Browser Notifications</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Browser Notifications</span>
                  <button
                    onClick={() => reminderService.requestNotificationPermission()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Enable
                  </button>
                </div>
                <p className="text-sm text-gray-400">
                  Allow browser notifications to receive prayer reminders even when the app is closed.
                </p>
              </div>
            </div>
          </div>
        )

      case 'reminders':
        return (
          <div className="space-y-6">
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Prayer Reminders</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Browser Notifications</span>
                  <button
                    onClick={() => reminderService.requestNotificationPermission()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Enable
                  </button>
                </div>
                <p className="text-sm text-gray-400">
                  Allow browser notifications to receive prayer reminders even when the app is closed.
                </p>
              </div>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Active Reminders</h3>
              <div className="space-y-3">
                {reminderService.getReminders().map((reminder) => (
                  <div key={reminder.id} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-100">{reminder.title}</h4>
                        <p className="text-sm text-gray-400">{reminder.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {reminder.time} • {reminder.days.map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => reminderService.toggleReminder(reminder.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            reminder.enabled
                              ? 'bg-green-500 text-white'
                              : 'bg-neutral-700 text-gray-300 hover:bg-neutral-600'
                          }`}
                        >
                          {reminder.enabled ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => reminderService.deleteReminder(reminder.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {reminderService.getReminders().length === 0 && (
                  <p className="text-gray-400 text-center py-8">No reminders set yet.</p>
                )}
              </div>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Upcoming Reminders Today</h3>
              <div className="space-y-3">
                {reminderService.getUpcomingReminders().map((reminder) => (
                  <div key={reminder.id} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-100">{reminder.title}</h4>
                        <p className="text-sm text-gray-400">{reminder.message}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">{reminder.time}</div>
                        <div className="text-xs text-gray-400">Today</div>
                      </div>
                    </div>
                  </div>
                ))}
                {reminderService.getUpcomingReminders().length === 0 && (
                  <p className="text-gray-400 text-center py-8">No more reminders for today.</p>
                )}
              </div>
            </div>
          </div>
        )

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Privacy Settings</h3>
              <div className="space-y-4">
                {Object.entries(settings.privacy).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                    <div>
                      <span className="text-gray-100 font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleSettingChange('privacy', key, e.target.checked)}
                      className="w-5 h-5 text-green-500 bg-neutral-700 border-neutral-600 rounded focus:ring-green-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 'sync':
        return (
          <div className="space-y-6">
            <SyncStatus />
            
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">🔄 Sync Settings</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Auto-sync on login</span>
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    Enabled
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Sync in background</span>
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    Enabled
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Conflict resolution</span>
                  <select className="px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-gray-100">
                    <option>Latest wins</option>
                    <option>Manual resolve</option>
                    <option>Local priority</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">📱 Device Management</h3>
              <div className="space-y-4">
                <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-100">Current Device</h4>
                      <p className="text-sm text-gray-400">{navigator.userAgent}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-green-400">Active</div>
                      <div className="text-xs text-gray-500">Last active: Now</div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  Your data automatically syncs across all devices where you're signed in.
                </p>
              </div>
            </div>
          </div>
        )

      case 'data':
        return (
          <div className="space-y-6">
            {/* Data Summary */}
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Data Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{dataSummary.totalEntries}</div>
                  <div className="text-sm text-gray-400">Total Entries</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">{dataSummary.dataSize}</div>
                  <div className="text-sm text-gray-400">Data Size</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-400">
                    {dataSummary.lastBackup ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-gray-400">Last Backup</div>
                </div>
              </div>
            </div>

            {/* Export Data */}
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Export Data</h3>
              <div className="space-y-4">
                <button
                  onClick={handleExportAllData}
                  disabled={isExporting}
                  className="w-full py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? '🔄 Exporting...' : '💾 Export All Data'}
                </button>
                <div className="text-sm text-gray-400 text-center">
                  Downloads a complete backup of all your spiritual data
                </div>
              </div>
            </div>

            {/* Import Data */}
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Import Data</h3>
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleImportData}
                  disabled={!importFile || isImporting}
                  className="w-full py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? '🔄 Importing...' : '📥 Import Data'}
                </button>
                <div className="text-sm text-gray-400 text-center">
                  Import data from a previous backup file
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-red-400 mb-4">⚠️ Danger Zone</h3>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                      dataExportService.clearAllData()
                    }
                  }}
                  className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-300 font-medium"
                >
                  🗑️ Clear All Data
                </button>
                <div className="text-sm text-red-400 text-center">
                  This will permanently delete all your data and reset the app
                </div>
              </div>
            </div>
          </div>
        )

      case 'help':
        return (
          <div className="space-y-6">
            <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Help & Support</h3>
              <div className="space-y-4">
                <div className="p-4 bg-neutral-800 rounded-lg">
                  <h4 className="font-medium text-gray-100 mb-2">📚 Getting Started</h4>
                  <p className="text-sm text-gray-400">Learn how to use ChristianKit effectively</p>
                </div>
                <div className="p-4 bg-neutral-800 rounded-lg">
                  <h4 className="font-medium text-gray-100 mb-2">❓ FAQ</h4>
                  <p className="text-sm text-gray-400">Common questions and answers</p>
                </div>
                <div className="p-4 bg-neutral-800 rounded-lg">
                  <h4 className="font-medium text-gray-100 mb-2">📧 Contact Support</h4>
                  <p className="text-sm text-gray-400">Get help from our support team</p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your{' '}
            <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
              Settings
            </span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Customize your ChristianKit experience and manage your account
          </p>
        </div>

        {/* Settings Tabs */}
        <div className="bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-2 border border-neutral-800 mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  )
}
