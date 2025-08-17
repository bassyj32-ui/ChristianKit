import React, { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { PrayerTimerPage } from './components/PrayerTimerPage'
import { CommunitySection } from './components/CommunitySection'
import { UserQuestionnaire } from './components/UserQuestionnaire'
import { LoginPage } from './components/LoginPage'
import { AuthProvider, useAuth } from './components/AuthProvider'
import { SimpleLogo } from './components/SimpleLogo'
import { FeedbackForm } from './components/FeedbackForm'
import { JournalPage } from './components/JournalPage'
import { StorePage } from './components/StorePage'
import { SubscriptionPage } from './components/SubscriptionPage'
import { SettingsPage } from './components/SettingsPage'
import { PrayerHistory } from './components/PrayerHistory'
import { PrayerSettings } from './components/PrayerSettings'
import { BibleTracker } from './components/BibleTracker'
import { WeeklyProgressBot } from './components/WeeklyProgressBot'
import { reminderService } from './services/reminderService'
import { SyncStatus } from './components/SyncStatus'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'

interface UserPlan {
  prayerTime: number;
  bibleTime: number;
  prayerStyle: string;
  prayerFocus: string[];
  bibleTopics: string[];
  dailyGoal: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

const AppContent: React.FC = () => {
  const { user, loading, logout, isProUser, error, signInWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState('prayer')
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true)
  const [selectedMinutes, setSelectedMinutes] = useState<number | undefined>(undefined);
  const [showFeedback, setShowFeedback] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSyncStatus, setShowSyncStatus] = useState(false);

  useEffect(() => {
    // Check if user has completed questionnaire
    const savedPlan = localStorage.getItem('userPlan')
    const hasCompletedQuestionnaire = localStorage.getItem('hasCompletedQuestionnaire')
    
    console.log('Initial load - localStorage state:', {
      savedPlan,
      hasCompletedQuestionnaire,
      user: !!user
    })
    
    if (savedPlan && hasCompletedQuestionnaire) {
      setIsFirstTimeUser(false)
      setUserPlan(JSON.parse(savedPlan))
      console.log('User plan loaded from localStorage:', JSON.parse(savedPlan))
    } else {
      setIsFirstTimeUser(true)
      console.log('No saved plan found, user is first-time')
    }

    // Initialize cloud sync if user is authenticated
    if (user) {
      const initializeCloudSync = async () => {
        try {
          // This will be handled by AuthProvider, but we can add additional setup here
          console.log('Cloud sync ready for user:', user.email)
        } catch (error) {
          console.error('Error initializing cloud sync:', error)
        }
      }
      
      initializeCloudSync()
    }

    // Register service worker for push notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [user])

  // Debug useEffect to track userPlan state changes
  useEffect(() => {
    console.log('userPlan state changed:', {
      userPlan,
      isFirstTimeUser,
      showQuestionnaire
    })
  }, [userPlan, isFirstTimeUser, showQuestionnaire])

  // Close mobile menu when questionnaire is shown
  useEffect(() => {
    if (showQuestionnaire) {
      setShowMobileMenu(false)
    }
  }, [showQuestionnaire])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showMobileMenu && !target.closest('nav')) {
        setShowMobileMenu(false)
      }
      if (showProfileMenu && !target.closest('.profile-menu')) {
        setShowProfileMenu(false)
      }
      if (showNotifications && !target.closest('.notifications-dropdown')) {
        setShowNotifications(false);
      }
      if (showSyncStatus && !target.closest('.sync-status-dropdown')) {
        setShowSyncStatus(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMobileMenu, showProfileMenu, showNotifications, showSyncStatus])

  const handleQuestionnaireComplete = (plan: UserPlan) => {
    console.log('Questionnaire completed with plan:', plan)
    console.log('Before saving - localStorage state:', {
      userPlan: localStorage.getItem('userPlan'),
      hasCompletedQuestionnaire: localStorage.getItem('hasCompletedQuestionnaire')
    })
    
    setUserPlan(plan)
    setShowQuestionnaire(false)
    setIsFirstTimeUser(false)
    
    // Adjust main screen tabs based on questionnaire results
    if (plan.experienceLevel === 'beginner') {
      // Beginners see simplified tabs
      setActiveTab('dashboard')
    } else if (plan.experienceLevel === 'intermediate') {
      // Intermediate users see all tabs
      setActiveTab('dashboard')
    } else if (plan.experienceLevel === 'advanced') {
      // Advanced users see all tabs plus advanced features
      setActiveTab('dashboard')
    }
    
    localStorage.setItem('userPlan', JSON.stringify(plan))
    localStorage.setItem('hasCompletedQuestionnaire', 'true') // Mark as completed
    
    console.log('After saving - localStorage state:', {
      userPlan: localStorage.getItem('userPlan'),
      hasCompletedQuestionnaire: localStorage.getItem('hasCompletedQuestionnaire')
    })
    console.log('Questionnaire completed, user plan saved:', plan)
    console.log('User experience level:', plan.experienceLevel)
  }

  const handleCustomizePlan = () => {
    setShowQuestionnaire(true)
  }

  // Helper function to check if user should be considered first-time
  const shouldShowQuestionnaire = () => {
    // Check localStorage directly instead of relying on state
    const localStorageUserPlan = localStorage.getItem('userPlan')
    const hasPlan = !!localStorageUserPlan
    const hasCompletedQuestionnaire = localStorage.getItem('hasCompletedQuestionnaire') === 'true'
    const result = !hasPlan || !hasCompletedQuestionnaire
    
    // Debug logging
    console.log('shouldShowQuestionnaire check:', {
      hasPlan,
      hasCompletedQuestionnaire,
      result,
      userPlan,
      localStorageUserPlan: localStorage.getItem('userPlan'),
      localStorageQuestionnaire: localStorage.getItem('hasCompletedQuestionnaire')
    })
    
    return result
  }

  const handleNavigate = (page: string, duration?: number) => {
    if (page === 'prayer' && duration) {
      // Set the selected minutes for the timer
      setSelectedMinutes(duration);
    }
    
    // For users who need questionnaire, certain pages should trigger questionnaire first
    if (shouldShowQuestionnaire() && (page === 'dashboard' || page === 'community')) {
      console.log('User needs questionnaire and trying to navigate to', page, '- showing questionnaire instead')
      setShowQuestionnaire(true)
    } else {
      setActiveTab(page);
    }
  };

  const handleTimerComplete = () => {
    // Users who need questionnaire go to questionnaire after timer completion
    const needsQuestionnaire = shouldShowQuestionnaire()
    console.log('Timer completed:', { 
      needsQuestionnaire, 
      userPlan, 
      localStorageUserPlan: localStorage.getItem('userPlan'),
      localStorageQuestionnaire: localStorage.getItem('hasCompletedQuestionnaire')
    })
    
    if (needsQuestionnaire) {
      console.log('Timer completed for user who needs questionnaire, showing questionnaire')
      setShowQuestionnaire(true)
    } else {
      console.log('Timer completed for user with completed setup, going to dashboard')
      setActiveTab('dashboard')
    }
  }

  const handleLogout = async () => {
    await logout();
    setActiveTab('prayer');
    setUserPlan(null);
    setShowQuestionnaire(false);
    setIsFirstTimeUser(true);
    localStorage.removeItem('userPlan');
    localStorage.removeItem('hasCompletedQuestionnaire'); // Reset questionnaire flag
    
    console.log('User logged out, reset to first-time user')
  }

  // Show error screen
  if (error) {
  return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-neutral-800">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-100 mb-4">
              Configuration Required
          </h1>
            <p className="text-gray-400 mb-6">
              {error}
            </p>
            <div className="bg-neutral-800 rounded-xl p-4 text-left text-sm">
              <p className="text-gray-300 mb-2">To fix this:</p>
              <ol className="text-gray-400 space-y-1">
                <li>1. Create a Firebase project</li>
                <li>2. Enable Google Authentication</li>
                <li>3. Add your config to .env file</li>
                <li>4. Restart the development server</li>
              </ol>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
}

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <SimpleLogo size="lg" />
          </div>
          <p className="text-gray-400">Loading ChristianKit...</p>
        </div>
      </div>
    );
  }

  // Show questionnaire for first-time users (regardless of authentication)
  if (showQuestionnaire) {
    return (
      <UserQuestionnaire 
        onComplete={handleQuestionnaireComplete}
        onBack={() => setShowQuestionnaire(false)}
      />
    )
  }

  // For users who need questionnaire, always show the timer first
  if (shouldShowQuestionnaire() && !showQuestionnaire) {
    return (
      <PrayerTimerPage 
        onNavigate={handleNavigate}
        onStartQuestionnaire={() => setShowQuestionnaire(true)}
        onTimerComplete={handleTimerComplete}
        userPlan={userPlan}
        selectedMinutes={selectedMinutes}
      />
    )
  }



  const renderContent = () => {
    switch (activeTab) {
      case 'prayer':
        return (
          <PrayerTimerPage 
            onNavigate={handleNavigate}
            onStartQuestionnaire={() => setShowQuestionnaire(true)}
            onTimerComplete={handleTimerComplete}
            userPlan={userPlan}
            selectedMinutes={selectedMinutes}
          />
        )
      case 'dashboard':
        return (
          <Dashboard 
            onNavigate={(page) => {
              if (page === 'dashboard' && shouldShowQuestionnaire()) {
                setShowQuestionnaire(true)
              } else {
                setActiveTab(page)
              }
            }}
            userPlan={userPlan}
          />
        )
      case 'community':
        return <CommunitySection />
      case 'journal':
        return <JournalPage />
      case 'store':
        return <StorePage />
      case 'subscription':
        return <SubscriptionPage />
      case 'settings':
        return <SettingsPage />
      case 'prayerHistory':
        return <PrayerHistory />
      case 'prayerSettings':
        return <PrayerSettings />
      case 'bible':
        return <BibleTracker />
      default:
        return (
          <PrayerTimerPage 
            onNavigate={handleNavigate}
            onStartQuestionnaire={() => setShowQuestionnaire(true)}
            onTimerComplete={handleTimerComplete}
            userPlan={userPlan}
            selectedMinutes={selectedMinutes}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Navigation */}
      <nav className="bg-black/95 backdrop-blur-xl border-b border-neutral-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <SimpleLogo />
            </div>

            {/* Right Side - Navigation Tabs + User Menu */}
            <div className="flex items-center gap-4">
              {/* Main Navigation Tabs */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('prayer')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'prayer'
                      ? 'bg-neutral-800 text-green-400'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50 hover:border-neutral-700/50'
                  }`}
                >
                  ✨ Heal Now
                </button>
                <button
                  onClick={() => {
                    const needsQuestionnaire = shouldShowQuestionnaire()
                    console.log('Desktop Homepage button clicked:', { 
                      isFirstTimeUser, 
                      showQuestionnaire, 
                      hasUserPlan: !!userPlan, 
                      needsQuestionnaire,
                      userPlan,
                      localStorageUserPlan: localStorage.getItem('userPlan'),
                      localStorageQuestionnaire: localStorage.getItem('hasCompletedQuestionnaire')
                    })
                    if (needsQuestionnaire) {
                      console.log('Desktop: Showing questionnaire - user needs to complete setup')
                      setShowQuestionnaire(true)
                    } else {
                      console.log('Desktop: Going directly to dashboard - user has completed setup')
                      setActiveTab('dashboard')
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'dashboard'
                      ? 'bg-neutral-800 text-green-400'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50 hover:border-neutral-700/50'
                  }`}
                >
                  🏠 Homepage {user && isFirstTimeUser && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">New</span>}
                </button>
                <button
                  onClick={() => setActiveTab('community')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'community'
                      ? 'bg-neutral-800 text-green-400'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50 hover:border-neutral-700/50'
                  }`}
                >
                  👥 Community
                </button>
                <button
                  onClick={() => setActiveTab('subscription')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'subscription'
                      ? 'bg-neutral-800 text-green-400'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50 hover:border-neutral-700/50'
                  }`}
                >
                  ⭐ Pro
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center hover:bg-neutral-700 transition-colors"
              >
                <span className="text-gray-300 text-lg">☰</span>
              </button>

              {/* User Avatar and Actions */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200 cursor-pointer"
                >
                  <span className="text-white text-sm font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'G'}
                  </span>
                </button>
                
                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-xl shadow-2xl z-50 profile-menu">
                    <div className="py-2">
                      <div className="px-4 py-3 border-b border-neutral-700">
                        <div className="text-sm font-medium text-gray-100">{user?.email}</div>
                        <div className="text-xs text-gray-400">Signed in with Google</div>
                      </div>
                      
                      {/* Navigation Links */}
                      <div className="px-2 py-2">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">Navigation</div>
                        <button
                          onClick={() => {
                            setActiveTab('bible')
                            setShowProfileMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 flex items-center gap-3 rounded-lg"
                        >
                          <span>📖</span>
                          Bible Tracker
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('journal')
                            setShowProfileMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 flex items-center gap-3 rounded-lg"
                        >
                          <span>📝</span>
                          Journal
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('store')
                            setShowProfileMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 flex items-center gap-3 rounded-lg"
                        >
                          <span>🛍️</span>
                          Store
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('subscription')
                            setShowProfileMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 flex items-center gap-3 rounded-lg"
                        >
                          <span>⭐</span>
                          Pro
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('settings')
                            setShowProfileMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 flex items-center gap-3 rounded-lg"
                        >
                          <span>⚙️</span>
                          Settings
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('prayerHistory')
                            setShowProfileMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 flex items-center gap-3 rounded-lg"
                        >
                          <span>📊</span>
                          History
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('prayerSettings')
                            setShowProfileMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 flex items-center gap-3 rounded-lg"
                        >
                          <span>🎯</span>
                          Prayer Settings
                        </button>
                      </div>
                      
                      {/* Actions */}
                      <div className="px-2 py-2">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">Actions</div>
                        <button
                          onClick={() => {
                            setShowProfileEdit(true)
                            setShowProfileMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 flex items-center gap-2 rounded-lg"
                        >
                          <span>⚙️</span>
                          Edit Profile
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false)
                            setShowFeedback(true)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 flex items-center gap-2 rounded-lg"
                        >
                          <span>💬</span>
                          Feedback
                        </button>
                      </div>
                      
                      <div className="border-t border-neutral-700 my-1"></div>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left text-sm text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-colors duration-200 flex items-center gap-2"
                      >
                        <span>🚪</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center hover:bg-neutral-700 transition-colors relative"
                >
                  <span className="text-gray-300 text-lg">🔔</span>
                  {reminderService.getUnreadCount() > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {reminderService.getUnreadCount() > 9 ? '9+' : reminderService.getUnreadCount()}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-xl shadow-2xl z-50 notifications-dropdown">
                    <div className="p-4 border-b border-neutral-700">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-100">Notifications</h3>
                        <button
                          onClick={() => reminderService.markAllNotificationsAsRead()}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          Mark all read
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {reminderService.getNotifications().slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-neutral-700 hover:bg-neutral-800 transition-colors ${
                            !notification.read ? 'bg-blue-500/10' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-100">{notification.title}</h4>
                              <p className="text-sm text-gray-400 mt-1">{notification.body}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={() => reminderService.deleteNotification(notification.id)}
                              className="text-gray-500 hover:text-red-400 transition-colors ml-2"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                      {reminderService.getNotifications().length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                          No notifications yet
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Cloud Sync Status */}
              {user && (
                <div className="relative">
                  <button
                    onClick={() => setShowSyncStatus(!showSyncStatus)}
                    className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center hover:bg-neutral-700 transition-colors relative"
                  >
                    <span className="text-gray-300 text-lg">🌐</span>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
                  </button>
                  
                  {/* Sync Status Dropdown */}
                  {showSyncStatus && (
                    <div className="absolute right-0 mt-2 w-80 bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-xl shadow-2xl z-50 sync-status-dropdown">
                      <SyncStatus />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Editing Modal */}
      {showProfileEdit && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowProfileEdit(false)}
        >
          <div 
            className="bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-3xl p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-3xl font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'G'}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Edit Profile</h2>
              <p className="text-gray-400">Customize your ChristianKit experience</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                <input
                  type="text"
                  defaultValue={user?.email?.split('@')[0] || 'User'}
                  className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your display name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full p-3 bg-neutral-700 border border-neutral-600 rounded-xl text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email managed by Google</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Theme Preference</label>
                <select className="w-full p-3 bg-neutral-800 border border-neutral-600 rounded-xl text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option value="auto">Auto (System)</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notification Settings</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-green-500 bg-neutral-800 border-neutral-600 rounded focus:ring-green-500" />
                    <span className="text-sm text-gray-300">Daily prayer reminders</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-green-500 bg-neutral-800 border-neutral-600 rounded focus:ring-green-500" />
                    <span className="text-sm text-gray-300">Bible reading goals</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-green-500 bg-neutral-800 border-neutral-600 rounded focus:ring-green-500" />
                    <span className="text-sm text-gray-300">Community updates</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowProfileEdit(false)}
                className="px-6 py-3 text-gray-400 hover:text-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Save profile changes
                  setShowProfileEdit(false)
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div className="md:hidden bg-black/95 backdrop-blur-xl border-b border-neutral-800 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => {
                setActiveTab('prayer')
                setShowMobileMenu(false)
              }}
              className={`w-full p-4 rounded-xl font-medium transition-all duration-200 text-left ${
                activeTab === 'prayer'
                  ? 'bg-neutral-800 text-green-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50'
              }`}
            >
              ✨ Heal Now
            </button>
            <button
              onClick={() => {
                const needsQuestionnaire = shouldShowQuestionnaire()
                console.log('Mobile Homepage button clicked:', { 
                  isFirstTimeUser, 
                  showQuestionnaire, 
                  hasUserPlan: !!userPlan, 
                  needsQuestionnaire,
                  userPlan,
                  localStorageUserPlan: localStorage.getItem('userPlan'),
                  localStorageQuestionnaire: localStorage.getItem('hasCompletedQuestionnaire')
                })
                if (needsQuestionnaire) {
                  console.log('Mobile: Showing questionnaire - user needs to complete setup')
                  setShowQuestionnaire(true)
                  setShowMobileMenu(false)
                } else {
                  console.log('Mobile: Going directly to dashboard - user has completed setup')
                  setActiveTab('dashboard')
                  setShowMobileMenu(false)
                }
              }}
              className={`w-full p-4 rounded-xl font-medium transition-all duration-200 text-left ${
                activeTab === 'dashboard'
                  ? 'bg-neutral-800 text-green-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50'
              }`}
            >
              🏠 Homepage {isFirstTimeUser && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">New</span>}
            </button>
            <button
              onClick={() => {
                setActiveTab('community')
                setShowMobileMenu(false)
              }}
              className={`w-full p-4 rounded-xl font-medium transition-all duration-200 text-left ${
                activeTab === 'community'
                  ? 'bg-neutral-800 text-green-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50'
              }`}
            >
              👥 Community
            </button>
            <button
              onClick={() => {
                setActiveTab('bible')
                setShowMobileMenu(false)
              }}
              className={`w-full p-4 rounded-xl font-medium transition-all duration-200 text-left ${
                activeTab === 'bible'
                  ? 'bg-neutral-800 text-green-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50'
              }`}
            >
              📖 Bible Tracker
            </button>
            <button
              onClick={() => {
                setActiveTab('journal')
                setShowMobileMenu(false)
              }}
              className={`w-full p-4 rounded-xl font-medium transition-all duration-200 text-left ${
                activeTab === 'journal'
                  ? 'bg-neutral-800 text-green-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50'
              }`}
            >
              📝 Journal
            </button>
            <button
              onClick={() => {
                setActiveTab('store')
                setShowMobileMenu(false)
              }}
              className={`w-full p-4 rounded-xl font-medium transition-all duration-200 text-left ${
                activeTab === 'store'
                  ? 'bg-neutral-800 text-green-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50'
              }`}
            >
              🛍️ Store
            </button>
            <button
              onClick={() => {
                setActiveTab('subscription')
                setShowMobileMenu(false)
              }}
              className={`w-full p-4 rounded-xl font-medium transition-all duration-200 text-left ${
                activeTab === 'subscription'
                  ? 'bg-neutral-800 text-green-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50'
              }`}
            >
              ⭐ Pro
            </button>
            <button
              onClick={() => {
                setActiveTab('settings')
                setShowMobileMenu(false)
              }}
              className={`w-full p-4 rounded-xl font-medium transition-all duration-200 text-left ${
                activeTab === 'settings'
                  ? 'bg-neutral-800 text-green-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50'
              }`}
            >
              ⚙️ Settings
            </button>
            <button
              onClick={() => {
                setActiveTab('prayerHistory')
                setShowMobileMenu(false)
              }}
              className={`w-full p-4 rounded-xl font-medium transition-all duration-200 text-left ${
                activeTab === 'prayerHistory'
                  ? 'bg-neutral-800 text-green-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50'
              }`}
            >
              📊 History
            </button>
            <button
              onClick={() => {
                setActiveTab('prayerSettings')
                setShowMobileMenu(false)
              }}
              className={`w-full p-4 rounded-xl font-medium transition-all duration-200 text-left ${
                activeTab === 'prayerSettings'
                  ? 'bg-neutral-800 text-green-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50'
              }`}
            >
              🎯 Prayer Settings
            </button>
            <button
              onClick={() => {
                setShowFeedback(true)
                setShowMobileMenu(false)
              }}
              className="w-full p-4 rounded-xl font-medium transition-all duration-200 text-left text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50"
            >
              💬 Feedback
            </button>
            
            {/* Sign In Button for Mobile - Only show when user is not authenticated */}
            {!user && (
              <div className="pt-2 border-t border-neutral-700">
                <button
                  onClick={() => {
                    signInWithGoogle()
                    setShowMobileMenu(false)
                  }}
                  className="w-full p-4 rounded-xl font-medium transition-all duration-200 text-left bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 flex items-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  🔐 Sign In with Google
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
        {renderContent()}

      {/* Weekly Progress Bot - Floating Reminder */}
      {user && !showQuestionnaire && activeTab !== 'prayer' && (
        <WeeklyProgressBot 
          position="bottom-right"
          showProgress={true}
        />
      )}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Feedback Form Modal */}
      {showFeedback && (
        <FeedbackForm onClose={() => setShowFeedback(false)} />
      )}
    </div>
  )
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
