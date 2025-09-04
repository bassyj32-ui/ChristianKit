import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { useAppStore } from '../store/appStore'
import { MobileOptimizedCard } from './MobileOptimizedCard'
import { MobileOptimizedButton } from './MobileOptimizedButton'
import { authService } from '../services/authService'
import { cloudSyncService } from '../services/cloudSyncService'

export const UserProfile: React.FC = () => {
  const { user, signOut } = useSupabaseAuth()
  const { userPlan, prayerSessions, bibleSessions, meditationSessions, gameScores, exportData, importData: importUserData } = useAppStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState('')

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      setEmail(user.email || '')
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      await authService.updateProfile({
        displayName: displayName.trim() || undefined
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `christiankit-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  const handleImportData = async () => {
    try {
      await cloudSyncService.importData(importData)
      setShowImport(false)
      setImportData('')
      alert('Data imported successfully!')
    } catch (error) {
      console.error('Failed to import data:', error)
      alert('Failed to import data. Please check the format and try again.')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setImportData(content)
      }
      reader.readAsText(file)
    }
  }

  // Calculate stats
  const totalPrayerTime = prayerSessions.reduce((sum, session) => sum + session.duration, 0)
  const totalBibleTime = bibleSessions.reduce((sum, session) => sum + session.duration, 0)
  const totalMeditationTime = meditationSessions.reduce((sum, session) => sum + session.duration, 0)
  const bestGameScore = gameScores.length > 0 ? Math.max(...gameScores.map(score => score.score)) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-yellow-300/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
            👤 Your Profile
          </h1>
          <p className="text-slate-300">Manage your account and view your spiritual journey</p>
        </div>

        {/* Profile Card */}
        <MobileOptimizedCard variant="primary" size="lg">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-black text-3xl font-bold shadow-xl">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span>{displayName[0] || email[0] || '👤'}</span>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full p-3 bg-slate-800/50 border border-yellow-400/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                      placeholder="Enter your display name"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <MobileOptimizedButton
                      onClick={handleSaveProfile}
                      variant="primary"
                      size="sm"
                      loading={loading}
                      icon="💾"
                    >
                      Save
                    </MobileOptimizedButton>
                    
                    <MobileOptimizedButton
                      onClick={() => setIsEditing(false)}
                      variant="ghost"
                      size="sm"
                      icon="❌"
                    >
                      Cancel
                    </MobileOptimizedButton>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {displayName || 'User'}
                  </h2>
                  <p className="text-slate-300 mb-4">{email}</p>
                  
                  <MobileOptimizedButton
                    onClick={() => setIsEditing(true)}
                    variant="secondary"
                    size="sm"
                    icon="✏️"
                  >
                    Edit Profile
                  </MobileOptimizedButton>
                </div>
              )}
            </div>
          </div>
        </MobileOptimizedCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MobileOptimizedCard variant="secondary" size="md" className="text-center">
            <div className="text-2xl mb-2">🙏</div>
            <div className="text-lg font-bold text-white">{totalPrayerTime}</div>
            <div className="text-sm text-slate-400">Minutes Prayed</div>
          </MobileOptimizedCard>

          <MobileOptimizedCard variant="secondary" size="md" className="text-center">
            <div className="text-2xl mb-2">📖</div>
            <div className="text-lg font-bold text-white">{totalBibleTime}</div>
            <div className="text-sm text-slate-400">Minutes Reading</div>
          </MobileOptimizedCard>

          <MobileOptimizedCard variant="secondary" size="md" className="text-center">
            <div className="text-2xl mb-2">🧘</div>
            <div className="text-lg font-bold text-white">{totalMeditationTime}</div>
            <div className="text-sm text-slate-400">Minutes Meditating</div>
          </MobileOptimizedCard>

          <MobileOptimizedCard variant="secondary" size="md" className="text-center">
            <div className="text-2xl mb-2">🎮</div>
            <div className="text-lg font-bold text-white">{bestGameScore}</div>
            <div className="text-sm text-slate-400">Best Score</div>
          </MobileOptimizedCard>
        </div>

        {/* Data Management */}
        <MobileOptimizedCard variant="accent" size="lg">
          <h3 className="text-xl font-bold text-white mb-4">📊 Data Management</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-white mb-2">Export Data</h4>
              <p className="text-sm text-slate-300 mb-3">
                Download a backup of all your spiritual journey data
              </p>
              <MobileOptimizedButton
                onClick={() => setShowExport(true)}
                variant="primary"
                size="sm"
                icon="📤"
              >
                Export Data
              </MobileOptimizedButton>
            </div>

            <div>
              <h4 className="font-medium text-white mb-2">Import Data</h4>
              <p className="text-sm text-slate-300 mb-3">
                Restore your data from a previous backup
              </p>
              <MobileOptimizedButton
                onClick={() => setShowImport(true)}
                variant="secondary"
                size="sm"
                icon="📥"
              >
                Import Data
              </MobileOptimizedButton>
            </div>
          </div>
        </MobileOptimizedCard>

        {/* Account Actions */}
        <MobileOptimizedCard variant="danger" size="lg">
          <h3 className="text-xl font-bold text-white mb-4">⚙️ Account Actions</h3>
          
          <MobileOptimizedButton
            onClick={handleSignOut}
            variant="danger"
            size="md"
            icon="🚪"
            fullWidth
          >
            Sign Out
          </MobileOptimizedButton>
        </MobileOptimizedCard>
      </div>

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <MobileOptimizedCard variant="primary" size="lg" className="max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">📤 Export Data</h3>
            <p className="text-slate-300 mb-6">
              This will download a JSON file containing all your spiritual journey data including prayer sessions, Bible readings, meditation sessions, and game scores.
            </p>
            
            <div className="flex gap-3">
              <MobileOptimizedButton
                onClick={handleExportData}
                variant="primary"
                size="md"
                icon="📤"
                fullWidth
              >
                Download Backup
              </MobileOptimizedButton>
              
              <MobileOptimizedButton
                onClick={() => setShowExport(false)}
                variant="ghost"
                size="md"
                icon="❌"
              >
                Cancel
              </MobileOptimizedButton>
            </div>
          </MobileOptimizedCard>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <MobileOptimizedCard variant="primary" size="lg" className="max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">📥 Import Data</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Upload Backup File
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="w-full p-3 bg-slate-800/50 border border-yellow-400/30 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-yellow-400 file:text-black hover:file:bg-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Or paste JSON data
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste your backup data here..."
                  className="w-full p-3 bg-slate-800/50 border border-yellow-400/30 rounded-xl text-white placeholder-slate-400 resize-none h-32 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <MobileOptimizedButton
                onClick={handleImportData}
                variant="primary"
                size="md"
                icon="📥"
                fullWidth
                disabled={!importData.trim()}
              >
                Import Data
              </MobileOptimizedButton>
              
              <MobileOptimizedButton
                onClick={() => {
                  setShowImport(false)
                  setImportData('')
                }}
                variant="ghost"
                size="md"
                icon="❌"
              >
                Cancel
              </MobileOptimizedButton>
            </div>
          </MobileOptimizedCard>
        </div>
      )}
    </div>
  )
}