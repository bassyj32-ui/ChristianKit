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

  // Debug logging
  useEffect(() => {
    console.log('🔍 AppContent Debug:', {
      user: user?.email,
      loading,
      activeTab,
      showQuestionnaire,
      isFirstTimeUser
    })
  }, [user, loading, activeTab, showQuestionnaire, isFirstTimeUser])

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

  // Show loading state while Supabase initializes
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Connecting to ChristianKit...</h2>
          <p className="text-[var(--text-secondary)]">Initializing your spiritual journey</p>
        </div>
      </div>
    )
  }

  // Show prayer timer page with floating sign-in when user is not authenticated
  if (!user) {
    const trialDaysLeft = Math.max(0, 14 - Math.floor((new Date().getTime() - new Date(trialStartDate).getTime()) / (1000 * 60 * 60 * 24)))
    
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Floating Sign In Button - Top Right */}
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={signInWithGoogle}
            className="bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-2xl py-2 px-3 sm:py-3 sm:px-4 font-semibold text-xs sm:text-sm hover:bg-white/20 hover:border-white/30 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-1 sm:gap-2"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="hidden sm:inline">Sign In</span>
          </button>
        </div>
        
        {/* Main App Content - Accessible to all users during trial */}
        <main className="flex-1">
          {renderContent()}
        </main>
        
        {/* Remove the old bottom-right sign-in button */}
      </div>
    )
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
                {user.email}
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

export default App
