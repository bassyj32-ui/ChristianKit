import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider, useThemeMode } from './theme/ThemeProvider'
import { PrayerTimerPage } from './components/PrayerTimerPage'
import { Dashboard } from './components/Dashboard'
import { CommunitySection } from './components/CommunitySection'
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
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import { NotificationManager } from './components/NotificationManager'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useSupabaseAuth } from './components/SupabaseAuthProvider'

const AppContent: React.FC = () => {
  // Real Supabase authentication
  const { user, loading, signOut: logout, signInWithGoogle } = useSupabaseAuth();
  const { mode } = useThemeMode()
  const [activeTab, setActiveTab] = useState('prayer') // Default to prayer timer
  const [selectedMinutes, setSelectedMinutes] = useState(10)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [userPlan, setUserPlan] = useState<any>(null)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  }, [user, loading, activeTab, showQuestionnaire, isFirstTimeUser, error])

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
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">⏳</div>
          <h1 className="text-2xl font-bold mb-4">Loading ChristianKit...</h1>
          <p className="text-[var(--text-secondary)]">Please wait while we initialize the app</p>
        </div>
      </div>
    )
  }

  // Trial period management
  const [trialStartDate, setTrialStartDate] = useState<string>(() => {
    const saved = localStorage.getItem('trialStartDate')
    if (saved) return saved
    const newTrialStart = new Date().toISOString()
    localStorage.setItem('trialStartDate', newTrialStart)
    return newTrialStart
  })

  const [showTrialExpired, setShowTrialExpired] = useState(false)

  // Check if trial has expired (2 weeks = 14 days)
  const isTrialExpired = () => {
    const trialStart = new Date(trialStartDate)
    const now = new Date()
    const daysDiff = (now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24)
    return daysDiff > 14
  }

  // Check if user should see trial expired message
  useEffect(() => {
    if (!user && isTrialExpired()) {
      setShowTrialExpired(true)
    }
  }, [user, trialStartDate])

  // Determine if user is first time user (for non-authenticated users, check if they've used the app before)
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

  const renderContent = () => {
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
          <Dashboard 
            onNavigate={(page) => setActiveTab(page)}
            userPlan={userPlan}
          />
        )
      case 'community':
        console.log('🔍 Rendering CommunitySection')
        return <CommunitySection />
      case 'journal':
        console.log('🔍 Rendering JournalPage')
        return <JournalPage />
      case 'store':
        console.log('🔍 Rendering StorePage')
        return <StorePage />
      case 'subscription':
        console.log('🔍 Rendering SubscriptionPage')
        return <SubscriptionPage />
      case 'settings':
        console.log('🔍 Rendering SettingsPage')
        return <SettingsPage />
      case 'prayerHistory':
        console.log('🔍 Rendering PrayerHistory')
        return <PrayerHistory />
      case 'prayerSettings':
        console.log('🔍 Rendering PrayerSettings')
        return <PrayerSettings />
      case 'bible':
        console.log('🔍 Rendering BibleReadingPage')
        return (
          <BibleReadingPage 
            onNavigate={handleNavigate}
            onStartQuestionnaire={() => {
              console.log('onStartQuestionnaire called from BibleReadingPage')
              setShowQuestionnaire(true)
            }}
            onTimerComplete={handleTimerComplete}
            userPlan={userPlan}
            selectedMinutes={selectedMinutes}
            isFirstTimeUser={determineIsFirstTimeUser()}
          />
        )
      case 'meditation':
        console.log('🔍 Rendering MeditationPage')
        return (
          <MeditationPage 
            onNavigate={handleNavigate}
            onStartQuestionnaire={() => {
              console.log('onStartQuestionnaire called from MeditationPage')
              setShowQuestionnaire(true)
            }}
            onTimerComplete={handleTimerComplete}
            userPlan={userPlan}
            selectedMinutes={selectedMinutes}
            isFirstTimeUser={determineIsFirstTimeUser()}
          />
        )
      case 'osmo-landing':
        console.log('🔍 Rendering OsmoLandingPage')
        return <OsmoLandingPage />
      default:
        console.log('🔍 Rendering default case - PrayerTimerPage')
        return (
          <PrayerTimerPage 
            onNavigate={handleNavigate}
            onStartQuestionnaire={() => {
              console.log('onStartQuestionnaire called from PrayerTimerPage (default case)')
              setShowQuestionnaire(true)
            }}
            onTimerComplete={handleTimerComplete}
            userPlan={userPlan}
            selectedMinutes={selectedMinutes}
            isFirstTimeUser={determineIsFirstTimeUser()}
          />
        )
    }
  }

  // Show questionnaire if it's the first time
  if (showQuestionnaire) {
    console.log('Showing questionnaire...')
    return (
      <UserQuestionnaire
        onComplete={(plan) => {
          console.log('Questionnaire completed with plan:', plan)
          setUserPlan(plan)
          setShowQuestionnaire(false)
          setIsFirstTimeUser(false)
          localStorage.setItem('hasCompletedQuestionnaire', 'true') // Mark as completed
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Debug info for authenticated users */}
      <div className="fixed top-4 left-4 z-40 text-xs text-white bg-black/50 p-2 rounded">
        Auth User: {user?.email} | Tab: {activeTab} | Loading: {loading}
      </div>
      
      {/* User Menu - Fixed Position (Theme toggle moved to settings) */}
      <div className="fixed top-4 right-4 z-50 group">
        <div className="relative">
          <button
            className="bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] p-3 rounded-full shadow-lg transition-all duration-300 border border-[var(--border-primary)]"
            title="User menu"
          >
            👤
          </button>
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div className="p-2">
              <div className="px-3 py-2 text-sm text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                {user?.email || 'Guest'}
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-1">
        {renderContent()}
      </main>
      
      <PWAInstallPrompt />
      
      {/* Notification Manager - Handles all notification permissions and scheduling */}
      <NotificationManager user={user} />
    </div>
  )
}

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/callback" element={<AuthCallback />} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </ErrorBoundary>
  )
}

// Add a simple fallback for debugging
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('🚨 Global Error:', event.error)
  })
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason)
  })
}

export default App
