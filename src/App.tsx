import React, { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { PrayerTimerPage } from './components/PrayerTimerPage'
import { CommunitySection } from './components/CommunitySection'
import { UserQuestionnaire } from './components/UserQuestionnaire'
import { LoginPage } from './components/LoginPage'
import { useSupabaseAuth } from './components/SupabaseAuthProvider'
import AuthCallback from './pages/AuthCallback'
import { Routes, Route, Navigate } from 'react-router-dom'
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
import { OsmoLandingPage } from './components/OsmoLandingPage'
import { reminderService } from './services/reminderService'
import { subscriptionService } from './services/subscriptionService'
import { dailyReEngagementService } from './services/dailyReEngagementService'
import { SyncStatus } from './components/SyncStatus'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import { Footer } from './components/Footer'
import { pwaService } from './services/pwaService'
import './theme/osmoGlobal.css'

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
  const { user, loading, signOut: logout, signInWithGoogle } = useSupabaseAuth();
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



  console.log('🚀 AppContent: Rendering with user:', user?.email, 'loading:', loading)

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

    // Initialize cloud sync and pro features if user is authenticated
    if (user) {
      const initializeCloudSync = async () => {
        try {
          console.log('Cloud sync ready for user:', user.email)
          
          // Initialize subscription service
          await subscriptionService.initializeUserSubscription(user.id)
          console.log('✅ Subscription service initialized')
          
          // Initialize daily re-engagement service
          await dailyReEngagementService.initialize()
          console.log('✅ Daily re-engagement service initialized')
          
        } catch (error) {
          console.error('Error initializing cloud sync:', error)
        }
      }
      
      initializeCloudSync()
    }

    // Initialize PWA features
    const initializePWA = async () => {
      try {
        console.log('🚀 Initializing PWA features...')
        
        // Setup network listeners
        pwaService.setupNetworkListeners(
          () => {
            console.log('🌐 App back online - syncing data...')
            // Handle coming back online
          },
          () => {
            console.log('📱 App offline - enabling offline mode...')
            // Handle going offline
          }
        )

        // Schedule daily reminders for returning users
        if (!isFirstTimeUser && user) {
          pwaService.scheduleLocalReminders()
          console.log('⏰ Daily reminders scheduled')
        }

        // Show welcome back notification for returning users
        const lastVisit = localStorage.getItem('lastVisit')
        const now = new Date().toISOString()
        
        if (lastVisit && user) {
          const daysSinceLastVisit = Math.floor(
            (new Date(now).getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24)
          )
          
          if (daysSinceLastVisit >= 1) {
            setTimeout(() => {
              pwaService.showStreakBrokenNotification(daysSinceLastVisit)
            }, 3000) // Show after 3 seconds
          }
        }
        
        localStorage.setItem('lastVisit', now)
        
        console.log('✅ PWA features initialized')
      } catch (error) {
        console.error('❌ Error initializing PWA:', error)
      }
    }

    initializePWA()
  }, [user, isFirstTimeUser])

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

  const handleQuestionnaireComplete = (plan: UserPlan) => {
    console.log('Questionnaire completed with plan:', plan)
    setUserPlan(plan)
    setShowQuestionnaire(false)
    setIsFirstTimeUser(false)
    setActiveTab('prayer')
    localStorage.setItem('userPlan', JSON.stringify(plan))
    localStorage.setItem('hasCompletedQuestionnaire', 'true')
    console.log('Questionnaire completed, user plan saved:', plan)
  }

  const handleCustomizePlan = () => {
    setShowQuestionnaire(true)
  }

  const handleNavigate = (page: string, duration?: number) => {
    if (page === 'prayer' && duration) {
      setSelectedMinutes(duration);
    }
    setActiveTab(page);
  };

  const handleTimerComplete = (duration?: number) => {
    console.log('Timer completed, staying on prayer timer')
    
    // Show PWA celebration notification
    if (duration && duration > 0) {
      pwaService.showPrayerCompletedNotification(duration)
    }
  }

  const handleLogout = async () => {
    await logout();
    setActiveTab('prayer');
    setUserPlan(null);
    setShowQuestionnaire(false);
    setIsFirstTimeUser(true);
    localStorage.removeItem('userPlan');
    localStorage.removeItem('hasCompletedQuestionnaire');
    console.log('User logged out, reset to first-time user')
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

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <main className="flex-1">{renderContent()}</main>
      <PWAInstallPrompt />
    </div>
  )
}

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/callback" element={<AuthCallback />} />
      <Route path="/*" element={<AppContent />} />
    </Routes>
  )
}

export default App
