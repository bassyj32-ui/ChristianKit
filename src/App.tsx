import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { ThemeProvider, useThemeMode } from './theme/ThemeProvider'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import { FloatingAuthTab } from './components/FloatingAuthTab'
import { PersistentNavigation } from './components/PersistentNavigation'
import { UnifiedTimerPage } from './components/UnifiedTimerPage'
import { OfflineIndicator } from './components/OfflineIndicator'
import { UserProfile } from './components/UserProfile'
import { GameLeaderboard } from './components/GameLeaderboard'
import { NotificationManager } from './components/NotificationManager'

import { ErrorBoundary } from './components/ErrorBoundary'
import { SupabaseAuthProvider, useSupabaseAuth } from './components/SupabaseAuthProvider'
import { AnalyticsProvider } from './components/AnalyticsProvider'
import { LoadingSpinner } from './components/LoadingSpinner'
import { useAppStore } from './store/appStore'
import { authService } from './services/authService'
import { cloudSyncService } from './services/cloudSyncService'
import { useSEO } from './hooks/useSEO'
import { initPerformanceOptimizations } from './utils/performance'

// Import components directly to fix lazy loading issue
import { Dashboard } from './components/Dashboard'
import { CommunityPage } from './components/CommunityPage'
import { CommunityErrorBoundary } from './components/CommunityErrorBoundary'
import BibleVerseMemoryMatch from './components/BibleVerseMemoryMatch'
import { BlogPage } from './components/BlogPage'
import { JournalPage } from './components/JournalPage'
import { StorePage } from './components/StorePage'
import { SubscriptionPage } from './components/SubscriptionPage'
import { SettingsPage } from './components/SettingsPage'
import { PrayerHistory } from './components/PrayerHistory'
import { PrayerSettings } from './components/PrayerSettings'
import { BibleTracker } from './components/BibleTracker'
import { OsmoLandingPage } from './components/OsmoLandingPage'
import { UserQuestionnaire } from './components/UserQuestionnaire'
import { LoginPage } from './components/LoginPage'
import { BibleReadingPage } from './components/BibleReadingPage'
import { MeditationPage } from './components/MeditationPage'
import AuthCallback from './pages/AuthCallback'
import { SunriseSunsetPrayer } from './components/SunriseSunsetPrayer'
import { SearchInterface } from './components/SearchInterface'
import { PrayerTimePage } from './components/PrayerTimePage'

// Create aliases for backward compatibility
const BibleQuest = BibleVerseMemoryMatch


// Main App component with providers
const App: React.FC = () => {
  return (
    <ThemeProvider defaultMode="dark">
      <ErrorBoundary>
        <SupabaseAuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/search"
              element={<SearchInterface />}
            />
            <Route path="*" element={<AppContent />} />
          </Routes>
        </SupabaseAuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

// AppContent component - must be defined inside both ThemeProvider and SupabaseAuthProvider contexts
const AppContent: React.FC = () => {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut, signInWithGoogle } = useSupabaseAuth();
  
  // SEO optimization
  useSEO();
  
  // Use centralized state management
  const {
    activeTab,
    setActiveTab,
    userPlan,
    setUserPlan,
    showQuestionnaire,
    setShowQuestionnaire,
    isFirstTimeUser,
    setIsFirstTimeUser
  } = useAppStore();
  
  // Get user subscription status for analytics
  const getUserSubscription = (): 'free' | 'pro' => {
    if (!user) return 'free';
    // You can enhance this later to check actual subscription status
    return 'free'; // Default to free for now
  };
  
  const [selectedMinutes, setSelectedMinutes] = useState(10)
  
  // Trial period management hooks
  const [trialStartDate, setTrialStartDate] = useState<string>(() => {
    const saved = localStorage.getItem('trialStartDate')
    if (saved) return saved
    const newTrialStart = new Date().toISOString()
    localStorage.setItem('trialStartDate', newTrialStart)
    return newTrialStart
  })
  const [showTrialExpired, setShowTrialExpired] = useState(false)


  // Debug logging
  useEffect(() => {
    console.log('🔍 AppContent Debug:', {
      user: user?.email,
      activeTab,
      showQuestionnaire,
      isFirstTimeUser
    })

    // Track app load for analytics
    console.log('🎯 App loaded, GA4 should be tracking...')
  }, [user, activeTab, showQuestionnaire, isFirstTimeUser])

  // Initialize performance optimizations
  useEffect(() => {
    initPerformanceOptimizations()
  }, [])

  // Check if user has completed questionnaire
  const determineIsFirstTimeUser = (): boolean => {
    const hasCompleted = localStorage.getItem('hasCompletedQuestionnaire')
    console.log('🔍 Checking questionnaire completion:', { hasCompleted, result: !hasCompleted })

    // Return true if questionnaire hasn't been completed (meaning user is first time)
    return !hasCompleted
  }

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize auth service
        const authUser = await authService.initialize()
        if (authUser) {
          useAppStore.getState().setUser(authUser)
        }

        // Initialize cloud sync
        await cloudSyncService.initialize()

        // Set up auth state listener
        authService.onAuthStateChange((user) => {
          useAppStore.getState().setUser(user)
          if (user) {
            cloudSyncService.initialize()
          }
        })

      } catch (error) {
        console.error('Service initialization error:', error)
      }
    }

    initializeServices()
  }, [])

  // Check if questionnaire should be shown for first-time users
  useEffect(() => {
    const shouldShowQuestionnaire = determineIsFirstTimeUser()
    console.log('🔍 Should show questionnaire:', shouldShowQuestionnaire)

    if (shouldShowQuestionnaire) {
      console.log('📝 Showing questionnaire for first-time user')
      setShowQuestionnaire(true)
    }
  }, [])

  // Handle navigation between tabs
  const handleNavigate = (tab: string, duration?: number) => {
    console.log('🔄 Navigating to:', tab, 'with duration:', duration)
    // Normalize known aliases
    const normalized = tab === 'faith-runner' ? 'runner' : tab
    
    // Update URL to match the tab
    const urlPath = getUrlPathForTab(normalized)
    navigate(urlPath)
    
    // Update internal state
    setActiveTab(normalized)

    // If duration is provided, update the selected minutes for timer pages
    if (duration) {
      setSelectedMinutes(duration)
    }
  }

  // Helper function to get URL path for each tab
  const getUrlPathForTab = (tab: string): string => {
    const tabToPath: Record<string, string> = {
      'home': '/',
      'dashboard': '/dashboard',
      'community': '/community',
      'runner': '/faith-runner',
      // HIDDEN PAGES - Commented out to simplify app
      // 'journal': '/journal',
      // 'store': '/store',
      'subscription': '/pricing',
      'settings': '/settings',
      // 'prayer-history': '/prayer-history',
      // 'prayer-settings': '/prayer-settings',
      // 'bible-tracker': '/bible-tracker',
      // 'osmo-landing': '/landing',
      'bible-reading': '/bible-reading',
      'meditation': '/meditation',
      // 'sunrise-sunset': '/sunrise-sunset',
      'profile': '/profile',
      // 'leaderboard': '/leaderboard',
      // 'analysis': '/analysis',
      'prayer': '/prayer'
    }
    return tabToPath[tab] || '/'
  }

  // Helper function to get tab from URL path
  const getTabFromUrlPath = (pathname: string): string => {
    const pathToTab: Record<string, string> = {
      '/': 'home',
      '/dashboard': 'dashboard',
      '/community': 'community',
      '/faith-runner': 'runner',
      // HIDDEN PAGES - Commented out to simplify app
      // '/journal': 'journal',
      // '/store': 'store',
      '/pricing': 'subscription',
      '/settings': 'settings',
      // '/prayer-history': 'prayer-history',
      // '/prayer-settings': 'prayer-settings',
      // '/bible-tracker': 'bible-tracker',
      // '/landing': 'osmo-landing',
      '/bible-reading': 'bible-reading',
      '/meditation': 'meditation',
      // '/sunrise-sunset': 'sunrise-sunset',
      '/profile': 'profile',
      // '/leaderboard': 'leaderboard',
      // '/analysis': 'analysis',
      '/prayer': 'prayer'
    }
    return pathToTab[pathname] || 'home'
  }

  // Sync URL with activeTab on location change
  useEffect(() => {
    const tabFromUrl = getTabFromUrlPath(location.pathname)
    if (tabFromUrl !== activeTab) {
      console.log('🔄 URL changed, syncing activeTab to:', tabFromUrl)
      setActiveTab(tabFromUrl)
    }
  }, [location.pathname])

  // Handle timer completion
  const handleTimerComplete = () => {
    console.log('⏰ Timer completed!')
    // You can add logic here for when prayer timer finishes
  }


  // Show trial expired message if needed
  if (showTrialExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-6">⏰</div>
          <h1 className="text-2xl font-bold mb-4 text-white">Trial Period Expired</h1>
          <p className="text-slate-300 mb-6">
            Your 14-day trial has ended. Please sign in to continue using ChristianKit.
          </p>
          <button 
            onClick={() => signInWithGoogle()} 
            className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-yellow-500 hover:to-amber-400 transition-all duration-300"
          >
            Sign In to Continue
          </button>
        </div>
      </div>
    )
  }

  // Show prayer timer page as the first page for signed-out users, but allow tab navigation away
  if (!user && activeTab === 'prayer') {
    return (
      <UnifiedTimerPage 
        timerType="prayer"
        onNavigate={handleNavigate}
        onTimerComplete={handleTimerComplete}
        selectedMinutes={selectedMinutes}
        isFirstTimeUser={determineIsFirstTimeUser()} // Check localStorage properly
      />
    )
  }

  // Show questionnaire if needed
  if (showQuestionnaire) {
    return (
      <UserQuestionnaire
        onComplete={(plan) => {
          console.log('Questionnaire completed with plan:', plan)
          setUserPlan(plan)
          setShowQuestionnaire(false)
          setIsFirstTimeUser(false)
          setActiveTab('dashboard') // Navigate to homepage after questionnaire
          localStorage.setItem('hasCompletedQuestionnaire', 'true')
          localStorage.setItem('userPlan', JSON.stringify(plan))
          
          // Apply notification settings if user enabled them
          if (plan.notificationPreferences?.pushEnabled) {
            // Request notification permission
            if ('Notification' in window && Notification.permission === 'default') {
              Notification.requestPermission();
            }
          }
        }}
      />
    )
  }

  // Render main content based on active tab
  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'home':
        case 'dashboard': // Keep backward compatibility
          return (
            <Dashboard
              userPlan={userPlan}
              onNavigate={handleNavigate}
            />
          )
        case 'community':
          return (
            <CommunityErrorBoundary>
              <CommunityPage />
            </CommunityErrorBoundary>
          )
        case 'runner':
        case 'faith-runner': // accept alias and route to the same view
          return <BibleQuest />
        // HIDDEN PAGES - Commented out to simplify app
        // case 'journal':
        //   return <JournalPage />
        // case 'store':
        //   return <StorePage />
        case 'subscription':
          return <SubscriptionPage />
        case 'settings':
          return <SettingsPage />
        // case 'prayer-history':
        //   return <PrayerHistory />
        // case 'prayer-settings':
        //   return <PrayerSettings />
        // case 'bible-tracker':
        //   return <BibleTracker />
        // case 'osmo-landing':
        //   return <OsmoLandingPage />
        case 'bible-reading':
          return <BibleReadingPage />
        case 'meditation':
          return (
            <UnifiedTimerPage 
              timerType="meditation"
              onNavigate={handleNavigate}
              onTimerComplete={handleTimerComplete}
              selectedMinutes={selectedMinutes}
              isFirstTimeUser={determineIsFirstTimeUser()}
              onStartQuestionnaire={() => setShowQuestionnaire(true)}
            />
          )
        // case 'sunrise-sunset':
        //   return <SunriseSunsetPrayer />
        case 'profile':
          return <UserProfile />
        // case 'leaderboard':
        //   return <GameLeaderboard />
        // case 'analysis':
        //   return (
        //     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex items-center justify-center">
        //       <div className="text-center">
        //         <h1 className="text-4xl font-bold mb-4">Analysis</h1>
        //         <p className="text-gray-400">Coming soon...</p>
        //       </div>
        //     </div>
        //   )
        case 'prayer':
          return (
            <UnifiedTimerPage
              timerType="prayer"
              onNavigate={handleNavigate}
              onTimerComplete={handleTimerComplete}
              selectedMinutes={selectedMinutes}
              isFirstTimeUser={determineIsFirstTimeUser()}
              onStartQuestionnaire={() => setShowQuestionnaire(true)}
            />
          )
        case 'prayer-time':
          return (
            <PrayerTimePage
              onNavigate={handleNavigate}
              userPlan={userPlan}
            />
          )
        case 'bible':
          return (
            <UnifiedTimerPage 
              timerType="bible"
              onNavigate={handleNavigate}
              onTimerComplete={handleTimerComplete}
              selectedMinutes={selectedMinutes}
              isFirstTimeUser={determineIsFirstTimeUser()}
              onStartQuestionnaire={() => setShowQuestionnaire(true)}
            />
          )
        case 'blog':
          return <BlogPage />
        default:
          return (
            <UnifiedTimerPage 
              timerType="prayer"
              onNavigate={handleNavigate}
              onTimerComplete={handleTimerComplete}
              selectedMinutes={selectedMinutes}
              isFirstTimeUser={determineIsFirstTimeUser()}
              onStartQuestionnaire={() => setShowQuestionnaire(true)}
            />
          )
      }
    } catch (error) {
      console.error('🚨 Error in renderContent:', error)
      // Return a simple fallback instead of reload button
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-center max-w-md mx-4">
            <div className="text-amber-400 text-6xl mb-6">✝️</div>
            <h1 className="text-white text-2xl font-bold mb-4">App Error</h1>
            <p className="text-gray-400 mb-4">
              Something went wrong. Please try refreshing the page manually.
            </p>
          </div>
        </div>
      )
    }
  }

  return (
            <AnalyticsProvider 
          userId={user?.id}
          userEmail={user?.email}
          userSubscription={getUserSubscription()}
        >
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {/* PWA Install Prompt - Top of screen */}
        <PWAInstallPrompt />
        
        {/* Floating Auth Tab - ensure always visible above content */}
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[70] pointer-events-auto">
          <FloatingAuthTab />
        </div>
        {/* Floating Search Link - HIDDEN */}
        {/* {user && location.pathname !== '/auth/callback' && (
          <div className="fixed top-36 right-4 z-10">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:opacity-95 active:opacity-90 transition-all duration-200"
              aria-label="Open Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm font-semibold">Search</span>
            </Link>
          </div>
        )} */}
        
        {/* Offline Indicator - HIDDEN */}
        {/* <OfflineIndicator /> */}

        {/* Notification Manager - HIDDEN */}
        {/* <NotificationManager user={user} /> */}

        {/* Main Content */}
        <div className="flex-1 pt-20 pb-20 lg:pb-0 lg:pt-20">
          {renderContent()}
        </div>
        
        {/* Persistent Navigation */}
        <PersistentNavigation 
          activeTab={activeTab} 
          onNavigate={handleNavigate} 
        />
      </div>
    </AnalyticsProvider>
  )
}

export default App
