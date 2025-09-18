import React, { useState, useEffect } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { useAppStore } from '../store/appStore'
import { 
  OsmoCard, 
  OsmoButton, 
  OsmoBadge, 
  OsmoSectionHeader, 
  OsmoContainer, 
  OsmoGradientText 
} from '../theme/osmoComponents'
import { authService } from '../services/authService'
import { cloudSyncService } from '../services/cloudSyncService'

export const UserProfile: React.FC = () => {
  const { user, signOut } = useSupabaseAuth()
  const { userPlan, prayerSessions, bibleSessions, meditationSessions, gameScores, exportData, importData: importUserData } = useAppStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [favoriteVerse, setFavoriteVerse] = useState('')
  const [location, setLocation] = useState('')
  const [customLinks, setCustomLinks] = useState<Array<{title: string, url: string}>>([])
  const [bannerImage, setBannerImage] = useState<string>('')
  const [profileImage, setProfileImage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState('')

  useEffect(() => {
    if (user) {
      setDisplayName((user as any).displayName || user.email?.split('@')[0] || 'User')
      setEmail(user.email || '')
      setBio((user as any).bio || '')
      setFavoriteVerse((user as any).favoriteVerse || '')
      setLocation((user as any).location || '')
      setCustomLinks((user as any).customLinks || [])
      setBannerImage((user as any).bannerImage || '/assets/images/default-banner.jpg.png')
      setProfileImage((user as any).profileImage || '/assets/images/default-profile.jpg.png')
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      await authService.updateProfile({
        displayName: displayName.trim() || undefined,
        ...(bio.trim() && { bio: bio.trim() }),
        ...(favoriteVerse.trim() && { favoriteVerse: favoriteVerse.trim() }),
        ...(location.trim() && { location: location.trim() }),
        ...(customLinks.length > 0 && { customLinks: customLinks }),
        ...(bannerImage && { bannerImage: bannerImage }),
        ...(profileImage && { profileImage: profileImage })
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate achievements and badges
  const calculateAchievements = () => {
    const totalPrayerTime = prayerSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
    const totalBibleTime = bibleSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
    const totalMeditationTime = meditationSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
    const bestGameScore = gameScores.length > 0 ? Math.max(...gameScores.map(score => score.score)) : 0

    const achievements = []
    
    // Prayer achievements
    if (totalPrayerTime >= 60) achievements.push({ id: 'prayer-1h', name: 'Prayer Warrior', icon: '🙏', description: 'Prayed for 1 hour total' })
    if (totalPrayerTime >= 300) achievements.push({ id: 'prayer-5h', name: 'Devoted Prayer', icon: '⛪', description: 'Prayed for 5 hours total' })
    if (totalPrayerTime >= 600) achievements.push({ id: 'prayer-10h', name: 'Prayer Champion', icon: '👑', description: 'Prayed for 10 hours total' })
    
    // Bible achievements
    if (totalBibleTime >= 60) achievements.push({ id: 'bible-1h', name: 'Bible Reader', icon: '📖', description: 'Read Bible for 1 hour total' })
    if (totalBibleTime >= 300) achievements.push({ id: 'bible-5h', name: 'Bible Scholar', icon: '🎓', description: 'Read Bible for 5 hours total' })
    if (totalBibleTime >= 600) achievements.push({ id: 'bible-10h', name: 'Bible Master', icon: '📚', description: 'Read Bible for 10 hours total' })
    
    // Meditation achievements
    if (totalMeditationTime >= 60) achievements.push({ id: 'meditation-1h', name: 'Peace Seeker', icon: '🧘', description: 'Meditated for 1 hour total' })
    if (totalMeditationTime >= 300) achievements.push({ id: 'meditation-5h', name: 'Zen Master', icon: '🌸', description: 'Meditated for 5 hours total' })
    
    // Game achievements
    if (bestGameScore >= 100) achievements.push({ id: 'game-100', name: 'Bible Quiz Pro', icon: '🎯', description: 'Scored 100+ in Bible Quest' })
    if (bestGameScore >= 500) achievements.push({ id: 'game-500', name: 'Bible Expert', icon: '🏆', description: 'Scored 500+ in Bible Quest' })
    
    // Streak achievements
    const currentStreak = calculateCurrentStreak()
    if (currentStreak >= 7) achievements.push({ id: 'streak-7', name: 'Week Warrior', icon: '🔥', description: '7-day spiritual streak' })
    if (currentStreak >= 30) achievements.push({ id: 'streak-30', name: 'Month Master', icon: '⭐', description: '30-day spiritual streak' })

    return achievements
  }

  const calculateCurrentStreak = () => {
    // Simple streak calculation - in real app, this would be more sophisticated
    const today = new Date()
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const recentSessions = [...prayerSessions, ...bibleSessions, ...meditationSessions]
      .filter(session => new Date((session as any).date || (session as any).createdAt) >= lastWeek)
    
    return Math.min(recentSessions.length, 30) // Cap at 30 for demo
  }

  const achievements = calculateAchievements()
  const currentStreak = calculateCurrentStreak()

  const addCustomLink = () => {
    setCustomLinks([...customLinks, { title: '', url: '' }])
  }

  const updateCustomLink = (index: number, field: 'title' | 'url', value: string) => {
    const updated = [...customLinks]
    updated[index][field] = value
    setCustomLinks(updated)
  }

  const removeCustomLink = (index: number) => {
    setCustomLinks(customLinks.filter((_, i) => i !== index))
  }

  const handleImageUpload = (file: File, type: 'banner' | 'profile'): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Validate file size
      const maxSize = type === 'banner' ? 2 * 1024 * 1024 : 1 * 1024 * 1024 // 2MB for banner, 1MB for profile
      if (file.size > maxSize) {
        reject(new Error(`File size must be less than ${type === 'banner' ? '2MB' : '1MB'}`))
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        reject(new Error('Only JPG, PNG, and WebP images are allowed'))
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        resolve(result)
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const base64 = await handleImageUpload(file, 'banner')
      setBannerImage(base64)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload banner image')
    }
  }

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const base64 = await handleImageUpload(file, 'profile')
      setProfileImage(base64)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload profile image')
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
  const totalPrayerTime = prayerSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
  const totalBibleTime = bibleSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
  const totalMeditationTime = meditationSessions.reduce((sum, session) => sum + (session.duration || 0), 0)
  const bestGameScore = gameScores.length > 0 ? Math.max(...gameScores.map(score => score.score)) : 0

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <OsmoContainer  padding={true}>
        {/* Header */}
        <OsmoSectionHeader
          title="Your Spiritual Journey"
          subtitle="Track your progress and celebrate your achievements"
        />

        {/* Social Media Style Profile Header */}
        <div className="relative mb-8 overflow-hidden rounded-2xl">
          {/* Banner Image */}
          <div className="relative h-48 overflow-hidden">
            {bannerImage ? (
              <img 
                src={bannerImage} 
                alt="Banner" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 max-w-md mx-4">
                    <p className="text-white text-center font-medium text-lg">
                      "God's will, not mine."
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile Picture */}
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-[var(--bg-primary)] overflow-hidden">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-black text-3xl font-bold">
                  ✝️
                </div>
              )}
            </div>
          </div>

          {/* Edit Profile Button */}
          <div className="absolute top-4 right-4">
            <OsmoButton
              onClick={() => setIsEditing(true)}
              variant="secondary"
            >
              Edit Profile
            </OsmoButton>
          </div>
        </div>

        {/* Profile Info */}
        <div className="mt-16 mb-8">
          {isEditing ? (
            <OsmoCard className="mb-8">
              <div className="space-y-4">
                {/* Image Uploads */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Banner Image
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleBannerUpload}
                      className="w-full p-3 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent-primary)] file:text-black hover:file:bg-amber-500"
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Max 2MB, JPG/PNG/WebP</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Profile Picture
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleProfileUpload}
                      className="w-full p-3 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent-primary)] file:text-black hover:file:bg-amber-500"
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">Max 1MB, JPG/PNG/WebP</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full p-3 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                    placeholder="Enter your display name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-3 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                    placeholder="Tell us about your spiritual journey..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Favorite Bible Verse
                  </label>
                  <input
                    type="text"
                    value={favoriteVerse}
                    onChange={(e) => setFavoriteVerse(e.target.value)}
                    className="w-full p-3 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                    placeholder="e.g., John 3:16"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-3 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                    placeholder="e.g., New York, USA"
                  />
                </div>

                {/* Custom Links */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Custom Links
                  </label>
                  <div className="space-y-3">
                    {customLinks.map((link, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => updateCustomLink(index, 'title', e.target.value)}
                          className="flex-1 p-2 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                          placeholder="Link title"
                        />
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => updateCustomLink(index, 'url', e.target.value)}
                          className="flex-1 p-2 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                          placeholder="https://example.com"
                        />
                        <button
                          onClick={() => removeCustomLink(index)}
                          className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addCustomLink}
                      className="w-full p-2 border-2 border-dashed border-[var(--glass-border)] rounded-lg text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                      + Add Link
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <OsmoButton
                    onClick={handleSaveProfile}
                  >
                    Save Changes
                  </OsmoButton>
                  
                  <OsmoButton
                    onClick={() => setIsEditing(false)}
                    variant="ghost"
                  >
                    Cancel
                  </OsmoButton>
                </div>
              </div>
            </OsmoCard>
          ) : (
            <div className="space-y-4">
              {/* Display Name */}
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                  {displayName || 'User'}
                </h2>
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              </div>

              {/* Handle */}
              <p className="text-[var(--text-secondary)]">@{email.split('@')[0] || 'user'}</p>

              {/* Bio */}
              {bio && (
                <p className="text-[var(--text-primary)] text-lg">
                  {bio}
                </p>
              )}

              {/* Custom Links */}
              {customLinks.length > 0 && (
                <div className="space-y-2">
                  {customLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 text-blue-400">
                      <span>🔗</span>
                      <a 
                        href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {link.title || link.url}
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-6 text-[var(--text-secondary)]">
                <span><span className="font-bold text-[var(--text-primary)]">{prayerSessions.length + bibleSessions.length + meditationSessions.length}</span> Sessions</span>
                <span><span className="font-bold text-[var(--text-primary)]">{achievements.length}</span> Achievements</span>
                <span><span className="font-bold text-[var(--text-primary)]">{currentStreak}</span> Day Streak</span>
              </div>

              {/* Favorite Verse */}
              {favoriteVerse && (
                <div className="bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl p-4 mt-4">
                  <p className="text-sm text-[var(--text-secondary)] mb-2">Favorite Verse:</p>
                  <p className="text-[var(--text-primary)] italic">"{favoriteVerse}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current Streak */}
        <OsmoCard   className="mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-[var(--accent-primary)] mb-2">
              🔥 {currentStreak} Day Streak
            </div>
            <p className="text-[var(--text-secondary)]">Keep up the great work!</p>
          </div>
        </OsmoCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <OsmoCard   className="text-center">
            <div className="text-2xl mb-2">🙏</div>
            <div className="text-lg font-bold text-[var(--text-primary)]">{Math.round(totalPrayerTime / 60)}h</div>
            <div className="text-sm text-[var(--text-secondary)]">Prayer Time</div>
          </OsmoCard>

          <OsmoCard   className="text-center">
            <div className="text-2xl mb-2">📖</div>
            <div className="text-lg font-bold text-[var(--text-primary)]">{Math.round(totalBibleTime / 60)}h</div>
            <div className="text-sm text-[var(--text-secondary)]">Bible Reading</div>
          </OsmoCard>

          <OsmoCard   className="text-center">
            <div className="text-2xl mb-2">🧘</div>
            <div className="text-lg font-bold text-[var(--text-primary)]">{Math.round(totalMeditationTime / 60)}h</div>
            <div className="text-sm text-[var(--text-secondary)]">Meditation</div>
          </OsmoCard>

          <OsmoCard   className="text-center">
            <div className="text-2xl mb-2">🎮</div>
            <div className="text-lg font-bold text-[var(--text-primary)]">{bestGameScore}</div>
            <div className="text-sm text-[var(--text-secondary)]">Best Score</div>
          </OsmoCard>
        </div>

        {/* Achievements Timeline */}
        <OsmoCard   className="mb-8">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">🏆 Your Achievements</h3>
          
          {achievements.length > 0 ? (
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <div key={achievement.id} className="flex items-center gap-4 p-4 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[var(--text-primary)]">{achievement.name}</h4>
                    <p className="text-sm text-[var(--text-secondary)]">{achievement.description}</p>
                  </div>
                  <OsmoBadge>Earned</OsmoBadge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-[var(--text-secondary)]">Start your spiritual journey to earn achievements!</p>
            </div>
          )}
        </OsmoCard>

        {/* Spiritual Journey Timeline */}
        <OsmoCard   className="mb-8">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">📅 Your Journey</h3>
          
          <div className="space-y-6">
            {/* Recent Activities */}
            {[...prayerSessions, ...bibleSessions, ...meditationSessions]
              .sort((a, b) => new Date((b as any).date || (b as any).createdAt).getTime() - new Date((a as any).date || (a as any).createdAt).getTime())
              .slice(0, 5)
              .map((session, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl">
                  <div className="text-2xl">
                    {(session as any).type === 'prayer' ? '🙏' : (session as any).type === 'bible' ? '📖' : '🧘'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[var(--text-primary)]">
                      {(session as any).type === 'prayer' ? 'Prayer Session' : 
                       (session as any).type === 'bible' ? 'Bible Reading' : 'Meditation'}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {session.duration} minutes • {new Date((session as any).date || (session as any).createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            
            {[...prayerSessions, ...bibleSessions, ...meditationSessions].length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🌟</div>
                <p className="text-[var(--text-secondary)]">Your spiritual journey starts here!</p>
              </div>
            )}
          </div>
        </OsmoCard>

        {/* Data Management */}
        <OsmoCard   className="mb-8">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">📊 Data Management</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-[var(--text-primary)] mb-2">Export Data</h4>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Download a backup of all your spiritual journey data
              </p>
              <OsmoButton
                onClick={() => setShowExport(true)}
              >
                Export Data
              </OsmoButton>
            </div>

            <div>
              <h4 className="font-medium text-[var(--text-primary)] mb-2">Import Data</h4>
              <p className="text-sm text-[var(--text-secondary)] mb-3">
                Restore your data from a previous backup
              </p>
              <OsmoButton
                onClick={() => setShowImport(true)}
              >
                Import Data
              </OsmoButton>
            </div>
          </div>
        </OsmoCard>

        {/* Account Actions */}
        <OsmoCard  >
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">⚙️ Account Actions</h3>
          
          <OsmoButton
            onClick={handleSignOut}
          >
            Sign Out
          </OsmoButton>
        </OsmoCard>
      </OsmoContainer>

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <OsmoCard   className="max-w-md w-full">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">📤 Export Data</h3>
            <p className="text-[var(--text-secondary)] mb-6">
              This will download a JSON file containing all your spiritual journey data including prayer sessions, Bible readings, meditation sessions, and game scores.
            </p>
            
            <div className="flex gap-3">
              <OsmoButton
                onClick={handleExportData}
              >
                Download Backup
              </OsmoButton>
              
              <OsmoButton
                onClick={() => setShowExport(false)}
                variant="ghost"
              >
                Cancel
              </OsmoButton>
            </div>
          </OsmoCard>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <OsmoCard   className="max-w-md w-full">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">📥 Import Data</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Upload Backup File
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="w-full p-3 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent-primary)] file:text-black hover:file:bg-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Or paste JSON data
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Paste your backup data here..."
                  className="w-full p-3 bg-[var(--glass-dark)] border border-[var(--glass-border)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none h-32 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <OsmoButton
                onClick={handleImportData}
              >
                Import Data
              </OsmoButton>
              
              <OsmoButton
                onClick={() => {
                  setShowImport(false)
                  setImportData('')
                }}
                variant="ghost"
              >
                Cancel
              </OsmoButton>
            </div>
          </OsmoCard>
        </div>
      )}
    </div>
  )
}