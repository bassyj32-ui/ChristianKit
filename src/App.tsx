import React, { useState, useEffect, Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider, useThemeMode } from './theme/ThemeProvider'
import { PrayerTimerPage } from './components/PrayerTimerPage'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import { FloatingAuthTab } from './components/FloatingAuthTab'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useSupabaseAuth, SupabaseAuthProvider } from './components/SupabaseAuthProvider'
import { AnalyticsProvider } from './components/AnalyticsProvider'

// Lazy load heavy components to reduce main bundle size
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })))
const CommunityPage = lazy(() => import('./components/CommunityPage').then(module => ({ default: module.CommunityPage })))
const FaithRunner = lazy(() => import('./components/FaithRunner'))
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

// Loading component for lazy-loaded components
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mx-auto mb-4"></div>
      <p className="text-amber-400 text-lg">Loading...</p>
    </div>
  </div>
)

const AppContent: React.FC = () => {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const { user, loading, signOut: logout, signInWithGoogle } = useSupabaseAuth();
  
  // Get user subscription status for analytics
  const getUserSubscription = (): 'free' | 'pro' => {
    if (!user) return 'free';
    // You can enhance this later to check actual subscription status
    return 'free'; // Default to free for now
  };
  const { mode } = useThemeMode()
  const [activeTab, setActiveTab] = useState('prayer') // Default to prayer page as the first page
  const [selectedMinutes, setSelectedMinutes] = useState(10)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [userPlan, setUserPlan] = useState<any>(null)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true)
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

  // Check if user should see trial expired message
  useEffect(() => {
    if (!user && isTrialExpired()) {
      setShowTrialExpired(true)
    }
  }, [user, trialStartDate])

  // Helper functions
  const isTrialExpired = () => {
    const trialStart = new Date(trialStartDate)
    const now = new Date()
    const daysDiff = (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff > 14
  }

  const determineIsFirstTimeUser = () => {
    if (user) {
      return isFirstTimeUser
    }
    // For non-authenticated users, check if they've completed the questionnaire before
    const hasCompletedQuestionnaire = localStorage.getItem('hasCompletedQuestionnaire')
    return !hasCompletedQuestionnaire
  }

  const handleNavigate = (page: string) => {
    setActiveTab(page)
  }

  const handleTimerComplete = () => {
    console.log('Prayer timer completed!')
    // Add completion logic here
  }

  // NOW we can have conditional returns after all hooks are called
  // Show error if something went wrong
  if (error) {
    return (
      <div className="min-h-screen bg-red-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-6xl mb-6">🚨</div>
          <h1 className="text-2xl font-bold mb-4">App Error</h1>
          <p className="text-red-200 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-white text-red-900 px-4 py-2 rounded"
          >
            Reload App
          </button>
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center relative overflow-hidden">
        {/* Osmo-inspired Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] pointer-events-none">
          {/* Subtle Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-yellow-500/5"></div>
          
          {/* Minimal Glow Effects */}
          <div className="absolute top-1/6 left-1/6 w-64 sm:w-96 h-64 sm:h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/6 right-1/6 w-56 sm:w-80 h-56 sm:h-80 bg-yellow-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="text-center relative z-10">
          {/* ChristianKit App Icon */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-2xl shadow-amber-500/25 animate-pulse">
            <span className="text-4xl sm:text-6xl font-bold text-white">✝</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">Let's start praying</h1>
          <p className="text-[var(--text-secondary)] text-base sm:text-lg">Setting up your prayer environment...</p>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    try {
      console.log('🔍 renderContent called with:', { user: user?.email, activeTab, showQuestionnaire })
      
      // If trial has expired and user is not signed in, show trial expired message
      if (!user && isTrialExpired()) {
        console.log('🔍 Showing trial expired message')
        return (
          <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
            <div className="text-center max-w-md mx-4">
              <div className="text-6xl mb-6">⏰</div>
              <h1 className="text-3xl font-bold mb-4">Trial Period Expired</h1>
              <p className="text-gray-300 mb-6">Your 2-week free trial has ended. Sign in to continue using all ChristianKit features and unlock your personalized spiritual journey.</p>
              <button
                onClick={signInWithGoogle}
                className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-8 py-3 rounded-xl font-semibold hover:from-amber-300 hover:to-yellow-400 transition-all duration-300 mb-4"
              >
                Sign In to Continue
              </button>
              <div className="text-sm text-gray-400">
                <p>Already have an account? Sign in to restore your data.</p>
              </div>
            </div>
          </div>
        )
      }

      switch (activeTab) {
        case 'prayer':
          console.log('🔍 Rendering PrayerTimerPage')
          return (
            <PrayerTimerPage 
              onNavigate={handleNavigate}
              onStartQuestionnaire={() => {
                console.log('onStartQuestionnaire called from PrayerTimerPage')
                setShowQuestionnaire(true)
              }}
              onTimerComplete={handleTimerComplete}
              userPlan={userPlan}
              selectedMinutes={selectedMinutes}
              isFirstTimeUser={determineIsFirstTimeUser()}
            />
          )
        case 'dashboard':
          console.log('🔍 Rendering Dashboard')
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <Dashboard 
                onNavigate={(page) => setActiveTab(page)}
                userPlan={userPlan}
              />
            </Suspense>
          )
        case 'community':
          console.log('🔍 Rendering CommunityPage')
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <CommunityPage />
            </Suspense>
          )
        case 'faith-runner':
          console.log('🔍 Rendering FaithRunner')
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <FaithRunner />
            </Suspense>
          )
        case 'journal':
          console.log('🔍 Rendering JournalPage')
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <JournalPage />
            </Suspense>
          )
        case 'store':
          console.log('🔍 Rendering StorePage')
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <StorePage />
            </Suspense>
          )
        case 'subscription':
          console.log('🔍 Rendering SubscriptionPage')
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <SubscriptionPage />
            </Suspense>
          )
        case 'settings':
          console.log('🔍 Rendering SettingsPage')
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <SettingsPage />
            </Suspense>
          )
        case 'history':
          console.log('🔍 Rendering PrayerHistory')
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <PrayerHistory />
            </Suspense>
          )
        case 'prayer-settings':
          console.log('🔍 Rendering PrayerSettings')
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <PrayerSettings />
            </Suspense>
          )
        case 'bible-tracker':
          console.log('🔍 Rendering BibleTracker')
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <BibleTracker />
            </Suspense>
          )
        case 'osmo-landing':
          console.log('🔍 Rendering OsmoLandingPage')
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <OsmoLandingPage />
            </Suspense>
          )
        case 'login':
          console.log('🔍 Rendering LoginPage')
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <LoginPage />
            </Suspense>
          )
        case 'bible':
          console.log('🔍 Rendering BibleReadingPage')
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <BibleReadingPage 
                onNavigate={handleNavigate}
                onStartQuestionnaire={() => {
                  console.log('onStartQuestionnaire called from bible case')
                  setShowQuestionnaire(true)
                }}
                onTimerComplete={handleTimerComplete}
                userPlan={userPlan}
                selectedMinutes={selectedMinutes}
                isFirstTimeUser={determineIsFirstTimeUser()}
              />
            </Suspense>
          )
        case 'meditation':
          console.log('🔍 Rendering MeditationPage')
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <MeditationPage 
                onNavigate={handleNavigate}
                onStartQuestionnaire={() => {
                  console.log('onStartQuestionnaire called from meditation case')
                  setShowQuestionnaire(true)
                }}
                onTimerComplete={handleTimerComplete}
                userPlan={userPlan}
                selectedMinutes={selectedMinutes}
                isFirstTimeUser={determineIsFirstTimeUser()}
              />
            </Suspense>
          )
        case 'sunrise-prayer':
          console.log('🔍 Rendering SunriseSunsetPrayer')
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <SunriseSunsetPrayer />
            </Suspense>
          )
        default:
          console.log('🔍 Rendering default PrayerTimerPage')
          return (
            <PrayerTimerPage 
              onNavigate={handleNavigate}
              onStartQuestionnaire={() => {
                console.log('onStartQuestionnaire called from default case')
                setShowQuestionnaire(true)
              }}
              onTimerComplete={handleTimerComplete}
              userPlan={userPlan}
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

  return (
    <AnalyticsProvider 
      userId={user?.id}
      userEmail={user?.email}
      userSubscription={getUserSubscription()}
    >
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {/* PWA Install Prompt - Top of screen */}
        <PWAInstallPrompt />
        
        {/* Floating Auth Tab - Below PWA prompt */}
        <FloatingAuthTab className="top-32" />
        
        {/* Main Content */}
        <div className="flex-1 pt-32">
          {renderContent()}
        </div>
      </div>
    </AnalyticsProvider>
  )
}

// Main App component with providers
const App: React.FC = () => {
  return (
    <ThemeProvider defaultMode="dark">
      <ErrorBoundary>
        <SupabaseAuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*" element={<AppContent />} />
          </Routes>
        </SupabaseAuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
