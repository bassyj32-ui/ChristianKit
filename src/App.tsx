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
import { Footer } from './components/Footer'

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
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSyncStatus, setShowSyncStatus] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

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

  // Add timeout for loading state to prevent freezing
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('Loading timeout reached, forcing loading to false');
        setLoadingTimeout(true);
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  // Debug useEffect to track userPlan state changes
  useEffect(() => {
    console.log('userPlan state changed:', {
      userPlan,
      isFirstTimeUser,
      showQuestionnaire
    })
  }, [userPlan, isFirstTimeUser, showQuestionnaire])

  useEffect(() => {
    if (showQuestionnaire) {
      // Mobile menu cleanup handled elsewhere
    }
  }, [showQuestionnaire])

  // Handle clicks outside of dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Close profile menu when clicking outside
      if (showProfileMenu && !target.closest('.profile-menu')) {
        setShowProfileMenu(false)
      }
      
      // Close notifications when clicking outside
      if (showNotifications && !target.closest('.notifications-dropdown')) {
        setShowNotifications(false)
      }
      
      // Close sync status when clicking outside
      if (showSyncStatus && !target.closest('.sync-status-dropdown')) {
        setShowSyncStatus(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProfileMenu, showNotifications, showSyncStatus])

  const handleQuestionnaireComplete = (plan: UserPlan) => {
    console.log('Questionnaire completed with plan:', plan)
    console.log('Before saving - localStorage state:', {
      userPlan: localStorage.getItem('userPlan'),
      hasCompletedQuestionnaire: localStorage.getItem('hasCompletedQuestionnaire')
    })
    
    setUserPlan(plan)
    setShowQuestionnaire(false)
    setIsFirstTimeUser(false)
    
    // Always go to dashboard after questionnaire completion
    setActiveTab('dashboard')
    
    // Save the plan and mark questionnaire as completed
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
    setActiveTab(page);
  };

  const handleTimerComplete = () => {
    console.log('Timer completed, going to dashboard')
    setActiveTab('dashboard')
  }

  const handleLogout = async () => {
    await logout();
    setActiveTab('dashboard');
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
              Something went wrong
            </h1>
            <p className="text-gray-400 mb-6">
              {error}
            </p>
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
  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <SimpleLogo size="lg" />
          </div>
          <p className="text-gray-400">Loading ChristianKit...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we sign you in...</p>
        </div>
      </div>
    );
  }

  // Show timeout message if loading takes too long
  if (loading && loadingTimeout) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <SimpleLogo size="lg" />
          </div>
          <p className="text-gray-400 mb-4">Sign in is taking longer than expected</p>
          <p className="text-gray-500 text-sm mb-6">Please try again or refresh the page</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  console.log('App render - user:', user, 'loading:', loading, 'error:', error);
  // Remove login check - timer should always be visible

  // Show questionnaire for first-time users
  if (showQuestionnaire) {
    return (
      <UserQuestionnaire 
        onComplete={handleQuestionnaireComplete}
        onBack={() => setShowQuestionnaire(false)}
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
            onNavigate={(page) => setActiveTab(page)}
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
                   onClick={() => {
                     const needsQuestionnaire = shouldShowQuestionnaire()
                     if (needsQuestionnaire) {
                       setShowQuestionnaire(true)
                     } else {
                       setActiveTab('dashboard')
                     }
                   }}
                   className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                     activeTab === 'dashboard'
                       ? 'bg-neutral-800 text-green-400'
                       : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50 hover:border-neutral-700/50'
                   }`}
                 >
                   🏠 Homepage
                 </button>
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

              {/* User Avatar and Actions */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-200 cursor-pointer"
                  >
                    <span className="text-white text-sm font-bold">
                      {user?.email?.charAt(0).toUpperCase() || 'G'}
                    </span>
                  </button>
                  
                  {/* Profile Dropdown Menu - Only show when user is authenticated */}
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
                        
                                                 {/* Core Navigation for Mobile */}
                         <button
                           onClick={() => {
                             const needsQuestionnaire = shouldShowQuestionnaire()
                             if (needsQuestionnaire) {
                               setShowQuestionnaire(true)
                               setShowProfileMenu(false)
                             } else {
                               setActiveTab('dashboard')
                               setShowProfileMenu(false)
                             }
                           }}
                           className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 flex items-center gap-3 rounded-lg"
                         >
                           <span>🏠</span>
                           Homepage
                         </button>
                         <button
                           onClick={() => {
                             setActiveTab('prayer')
                             setShowProfileMenu(false)
                           }}
                           className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 flex items-center gap-3 rounded-lg"
                         >
                           <span>✨</span>
                           Heal Now
                         </button>
                         <button
                           onClick={() => {
                             setActiveTab('community')
                             setShowProfileMenu(false)
                           }}
                           className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:text-white hover:bg-neutral-800 transition-colors duration-200 flex items-center gap-3 rounded-lg"
                         >
                           <span>👥</span>
                           Community
                         </button>
                        
                        <div className="border-t border-neutral-700 my-2"></div>
                        
                        {/* Secondary Navigation */}
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
            ) : (
              <button
                onClick={signInWithGoogle}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                Sign In
              </button>
            )}

              {/* Notification Bell - Only show when user is authenticated */}
              {user && (
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
              )}

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

      {/* Footer */}
      <Footer />
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
