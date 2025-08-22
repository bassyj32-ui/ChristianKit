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

// Mock user data for now (we'll add real auth later)
const mockUser = {
  id: 'demo-user-123',
  email: 'demo@christiankit.app',
  user_metadata: { full_name: 'Demo User' }
} as any

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
      {/* Theme Toggle Button - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleMode}
          className="bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[var(--text-inverse)] p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        >
          {mode === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
      
      <main className="flex-1">
        {renderContent()}
      </main>
      
      <PWAInstallPrompt />
      
      {/* Notification Manager - Handles all notification permissions and scheduling */}
      <NotificationManager user={mockUser} />
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
