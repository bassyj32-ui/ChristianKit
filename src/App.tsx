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
import AuthCallback from './pages/AuthCallback'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import { NotificationManager } from './components/NotificationManager'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useSupabaseAuth } from './components/SupabaseAuthProvider'

// Real Supabase authentication
const { user, loading, signOut: logout, signInWithGoogle } = useSupabaseAuth();

const AppContent: React.FC = () => {
  const { mode, toggleMode } = useThemeMode()
  const [activeTab, setActiveTab] = useState('prayer') // Default to prayer timer
  const [selectedMinutes, setSelectedMinutes] = useState(10)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [userPlan, setUserPlan] = useState<any>(null)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true)

  const handleNavigate = (page: string) => {
    setActiveTab(page)
  }

  const handleTimerComplete = () => {
    console.log('Prayer timer completed!')
    // Add completion logic here
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
            isFirstTimeUser={isFirstTimeUser}
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
      case 'osmo-landing':
        return <OsmoLandingPage />
      default:
        return (
          <PrayerTimerPage 
            onNavigate={handleNavigate}
            onStartQuestionnaire={() => setShowQuestionnaire(true)}
            onTimerComplete={handleTimerComplete}
            userPlan={userPlan}
            selectedMinutes={selectedMinutes}
            isFirstTimeUser={isFirstTimeUser}
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

  // Show login page if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center">
        <div className="osmo-card max-w-md w-full mx-4">
          {/* Logo and Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="text-4xl">✝️</div>
            </div>
            <p className="text-gray-400 text-lg">
              Transform your spiritual journey today
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-neutral-800">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Welcome to ChristianKit
              </h2>
              <p className="text-gray-400">
                Sign in to continue your spiritual journey
              </p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={signInWithGoogle}
              className="w-full bg-white text-[var(--text-primary)] rounded-xl py-4 px-6 font-bold text-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg mb-6 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Features Preview */}
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-xl p-4 border border-green-500/30">
                <h3 className="text-lg font-bold text-green-400 mb-3">✨ What you'll get:</h3>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>• Prayer timer with guided sessions</li>
                  <li>• Daily Bible verses and meditation</li>
                  <li>• Habit tracking and progress analytics</li>
                  <li>• Community of fellow believers</li>
                  <li>• Personalized spiritual journey</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show questionnaire if it's the first time
  if (showQuestionnaire) {
    return (
      <UserQuestionnaire
        onComplete={(plan) => {
          setUserPlan(plan)
          setShowQuestionnaire(false)
          setIsFirstTimeUser(false)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Theme Toggle and User Menu - Fixed Position */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleMode}
          className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[var(--text-inverse)] p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        >
          {mode === 'dark' ? '☀️' : '🌙'}
        </button>
        
        {/* User Menu */}
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
