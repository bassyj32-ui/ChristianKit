import React, { useState, useEffect, Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider, useThemeMode } from './theme/ThemeProvider'
import { PrayerTimerPage } from './components/PrayerTimerPage'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import { FloatingAuthTab } from './components/FloatingAuthTab'

import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider, useAuth } from './components/AuthProvider'
import { AnalyticsProvider } from './components/AnalyticsProvider'

// Lazy load heavy components to reduce main bundle size
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })))
const CommunityPage = lazy(() => import('./components/CommunityPage').then(module => ({ default: module.CommunityPage })))
const BibleQuest = lazy(() => import('./components/FaithRunner'))
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

// Main App component with providers
const App: React.FC = () => {
  return (
    <ThemeProvider defaultMode="dark">
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="*" element={<AppContent />} />
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

// AppContent component - must be defined inside both ThemeProvider and AuthProvider contexts
const AppContent: React.FC = () => {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional returns
  const { user, loading, logout, signInWithGoogle } = useAuth();
  
  // Get user subscription status for analytics
  const getUserSubscription = (): 'free' | 'pro' => {
    if (!user) return 'free';
    // You can enhance this later to check actual subscription status
    return 'free'; // Default to free for now
  };
  
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

  // Check if user has completed questionnaire
  const determineIsFirstTimeUser = (): boolean => {
    const hasCompleted = localStorage.getItem('hasCompletedQuestionnaire')
    return !hasCompleted
  }

  // Handle navigation between tabs
  const handleNavigate = (tab: string) => {
    console.log('🔄 Navigating to:', tab)
    setActiveTab(tab)
  }

  // Handle timer completion
  const handleTimerComplete = () => {
    console.log('⏰ Timer completed!')
    // You can add logic here for when prayer timer finishes
  }

  // Show loading state
  if (loading) {
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

  // Show login page if no user
  if (!user) {
    return (
      <LoginPage />
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
        case 'dashboard':
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
            <Suspense fallback={<LoadingSpinner />}>
              <MeditationPage />
            </Suspense>
          )
        case 'sunrise-sunset':
          return (
            <Suspense fallback={<LoadingSpinner />}>
              <SunriseSunsetPrayer />
            </Suspense>
          )
        default:
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

  return (
    <AnalyticsProvider 
      userId={user?.uid}
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

export default App
