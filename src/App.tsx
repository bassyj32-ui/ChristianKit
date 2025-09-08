import React, { useState, useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { ThemeProvider, useThemeMode } from './theme/ThemeProvider'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import { FloatingAuthTab } from './components/FloatingAuthTab'
import { PersistentNavigation } from './components/PersistentNavigation'
import { UnifiedTimerPage } from './components/UnifiedTimerPage'
import { OfflineIndicator } from './components/OfflineIndicator'
import { UserProfile } from './components/UserProfile'
import { GameLeaderboard } from './components/GameLeaderboard'

import { ErrorBoundary } from './components/ErrorBoundary'
import { SupabaseAuthProvider, useSupabaseAuth } from './components/SupabaseAuthProvider'
import { AnalyticsProvider } from './components/AnalyticsProvider'
import { useAppStore } from './store/appStore'
import { authService } from './services/authService'
import { cloudSyncService } from './services/cloudSyncService'
import { useSEO } from './hooks/useSEO'

// Lazy load heavy components to reduce main bundle size
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })))
const CommunityPage = lazy(() => import('./components/CommunityPage').then(module => ({ default: module.CommunityPage })))
const BibleQuest = lazy(() => import('./components/BibleVerseMemoryMatch'))
const BlogPage = lazy(() => import('./components/BlogPage').then(module => ({ default: module.BlogPage })))
const JournalPage = lazy(() => import('./components/JournalPage').then(module => ({ default: module.JournalPage })))
const StorePage = lazy(() => import('./components/StorePage').then(module => ({ default: module.StorePage })))
const SubscriptionPage = lazy(() => import('./components/SubscriptionPage').then(module => ({ default: module.SubscriptionPage })))
const SettingsPage = lazy(() => import('./components/SettingsPage').then(module => ({ default: module.SettingsPage })))
const PrayerHistory = lazy(() => import('./components/PrayerHistory').then(module => ({ default: module.PrayerHistory })))
const PrayerSettings = lazy(() => import('./components/PrayerSettings').then(module => ({ default: module.PrayerSettings })))
const BibleTracker = lazy(() => import('./components/BibleTracker').then(module => ({ default: module.BibleTracker })))
const OsmoLandingPage = lazy(() => import('./components/OsmoLandingPage').then(module => ({ default: module.OsmoLandingPage })))
const UserQuestionnaire = lazy(() => import('./components/UserQuestionnaire').then(module => ({ default: module.UserQuestionnaire })))
const LoginPage = lazy(() => import('./components/LoginPage').then(module => ({ default: module.LoginPage })))
const BibleReadingPage = lazy(() => import('./components/BibleReadingPage').then(module => ({ default: module.BibleReadingPage })))
const MeditationPage = lazy(() => import('./components/MeditationPage').then(module => ({ default: module.MeditationPage })))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const SunriseSunsetPrayer = lazy(() => import('./components/SunriseSunsetPrayer').then(module => ({ default: module.SunriseSunsetPrayer })))
const SearchInterface = lazy(() => import('./components/SearchInterface').then(module => ({ default: module.SearchInterface })))

// Loading component for lazy-loaded components
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mx-auto mb-4"></div>
      <p className="text-amber-400 text-lg">Loading...</p>
    </div>
  </div>
)

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
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <SearchInterface />
                </Suspense>
              }
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
  const { user, loading, signOut, signInWithGoogle } = useSupabaseAuth();
  const location = useLocation();
  
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
    setIsFirstTimeUser,
    isLoading,
    setLoading
  } = useAppStore();
  
  // Get user subscription status for analytics
  const getUserSubscription = (): 'free' | 'pro' => {
    if (!user) return 'free';
    // You can enhance this later to check actual subscription status
    return 'free'; // Default to free for now
  };
  
  const [selectedMinutes, setSelectedMinutes] = useState(10)
  const [error, setError] = useState<string | null>(null)
  
  // Trial period management hooks
  const [trialStartDate, setTrialStartDate] = useState<string>(() => {
    const saved = localStorage.getItem('trialStartDate')
    if (saved) return saved
    const newTrialStart = new Date().toISOString()
    localStorage.setItem('trialStartDate', newTrialStart)
    return newTrialStart
  })
  const [showTrialExpired, setShowTrialExpired] = useState(false)

  // Add error boundary for runtime errors
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('🚨 App Error:', error.error)
      setError(error.error?.message || 'Unknown error occurred')
    }
    
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // Debug logging
  useEffect(() => {
    console.log('🔍 AppContent Debug:', {
      user: user?.email,
      loading,
      activeTab,
      showQuestionnaire,
      isFirstTimeUser,
      error
    })
    
    // Track app load for analytics
    if (!loading) {
      console.log('🎯 App loaded, GA4 should be tracking...')
    }
  }, [user, loading, activeTab, showQuestionnaire, isFirstTimeUser, error])

  // Check if user has completed questionnaire
  const determineIsFirstTimeUser = (): boolean => {
    const hasCompleted = localStorage.getItem('hasCompletedQuestionnaire')
    console.log('🔍 Checking questionnaire completion:', { hasCompleted, result: !hasCompleted })
    
    // For now, allow navigation without questionnaire to fix the tab issue
    // TODO: Implement proper questionnaire flow later
    if (!hasCompleted) {
      console.log('🔧 Setting questionnaire as completed to allow navigation')
      localStorage.setItem('hasCompletedQuestionnaire', 'true')
      return false
    }
    
    return false
  }

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setLoading(true)
        
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
      } finally {
        setLoading(false)
      }
    }
    
    initializeServices()
  }, [setLoading])

  // Handle navigation between tabs
  const handleNavigate = (tab: string) => {
    console.log('🔄 Navigating to:', tab)
    // Normalize known aliases
    const normalized = tab === 'faith-runner' ? 'runner' : tab
    setActiveTab(normalized)
  }

  // Handle timer completion
  const handleTimerComplete = () => {
    console.log('⏰ Timer completed!')
    // You can add logic here for when prayer timer finishes
  }

  // Show loading state
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Let's start praying</h1>
          <p className="text-slate-300 text-base sm:text-lg">Setting up your prayer environment...</p>
        </div>
      </div>
    )
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
            <Suspense fallback={<LoadingSpinner />}>
              <Dashboard 
                userPlan={userPlan}
              />
            </Suspense>
          )
        case 'community':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <CommunityPage />
            </Suspense>
          )
        case 'runner':
        case 'faith-runner': // accept alias and route to the same view
          return (
            <Suspense fallback={<LoadingSpinner />}>
                              <BibleQuest />
            </Suspense>
          )
        case 'journal':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <JournalPage />
            </Suspense>
          )
        case 'store':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <StorePage />
            </Suspense>
          )
        case 'subscription':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <SubscriptionPage />
            </Suspense>
          )
        case 'settings':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <SettingsPage />
            </Suspense>
          )
        case 'prayer-history':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <PrayerHistory />
            </Suspense>
          )
        case 'prayer-settings':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <PrayerSettings />
            </Suspense>
          )
        case 'bible-tracker':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <BibleTracker />
            </Suspense>
          )
        case 'osmo-landing':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <OsmoLandingPage />
            </Suspense>
          )
        case 'bible-reading':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <BibleReadingPage />
            </Suspense>
          )
        case 'meditation':
          return (
            <UnifiedTimerPage 
              timerType="meditation"
              onNavigate={handleNavigate}
              onTimerComplete={handleTimerComplete}
              selectedMinutes={selectedMinutes}
              isFirstTimeUser={determineIsFirstTimeUser()}
            />
          )
        case 'sunrise-sunset':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <SunriseSunsetPrayer />
            </Suspense>
          )
        case 'profile':
          return <UserProfile />
        case 'leaderboard':
          return <GameLeaderboard />
        case 'analysis':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-4">Analysis</h1>
                  <p className="text-gray-400">Coming soon...</p>
                </div>
              </div>
            </Suspense>
          )
        case 'prayer':
          return (
            <UnifiedTimerPage 
              timerType="prayer"
              onNavigate={handleNavigate}
              onTimerComplete={handleTimerComplete}
              selectedMinutes={selectedMinutes}
              isFirstTimeUser={determineIsFirstTimeUser()}
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
            />
          )
      }
    } catch (error) {
      console.error('🚨 Error in renderContent:', error)
      return (
        <div className="min-h-screen bg-red-900 text-white flex items-center justify-center">
          <div className="text-center max-w-md mx-4">
            <div className="text-6xl mb-6">🚨</div>
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-red-200 mb-4">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-white text-red-900 px-4 py-2 rounded"
            >
              Refresh Page
            </button>
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
        {/* Floating Search Link - show only for signed-in users and not on auth callback */}
        {user && location.pathname !== '/auth/callback' && (
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
        )}
        
        {/* Offline Indicator */}
        <OfflineIndicator />
        
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
