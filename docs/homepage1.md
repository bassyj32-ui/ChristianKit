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
  const [activeTab, setActiveTab] = useState('prayer') // Default to prayer timer
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
    
    // Go back to prayer timer after questionnaire completion
    setActiveTab('prayer')
    
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
    console.log('Timer completed, staying on prayer timer')
    // Stay on prayer timer page after completion
  }

  const handleLogout = async () => {
    await logout();
    setActiveTab('prayer'); // Default to prayer timer
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

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* No Navigation Bar - Clean Full Screen */}

      {/* Main Content */}
      <main className="flex-1">
        {renderContent()}
      </main>

      {/* No Mobile Navigation - Clean Full Screen */}

      {/* Clean Full Screen - No Additional Components */}
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
