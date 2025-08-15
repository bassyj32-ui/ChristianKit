import React, { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { PrayerTimerPage } from './components/PrayerTimerPage'
import { CommunitySection } from './components/CommunitySection'
import { UserQuestionnaire } from './components/UserQuestionnaire'
import { PersonalizedPlan } from './components/PersonalizedPlan'
import { LoginPage } from './components/LoginPage'
import { AuthProvider, useAuth } from './components/AuthProvider'
import { SimpleLogo } from './components/SimpleLogo'
import { FeedbackForm } from './components/FeedbackForm'

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
  const { user, loading, logout, isProUser, error } = useAuth();
  const [activeTab, setActiveTab] = useState('prayer')
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [showPersonalizedPlan, setShowPersonalizedPlan] = useState(false)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true)
  const [selectedMinutes, setSelectedMinutes] = useState<number | undefined>(undefined);
  const [showFeedback, setShowFeedback] = useState(false)

  useEffect(() => {
    const savedPlan = localStorage.getItem('userPlan')
    if (savedPlan) {
      setUserPlan(JSON.parse(savedPlan))
      setIsFirstTimeUser(false)
    }
  }, [])

  const handleQuestionnaireComplete = (plan: UserPlan) => {
    setUserPlan(plan)
    setShowQuestionnaire(false)
    setShowPersonalizedPlan(true)
    localStorage.setItem('userPlan', JSON.stringify(plan))
  }

  const handlePlanComplete = () => {
    setShowPersonalizedPlan(false)
    setIsFirstTimeUser(false)
  }

  const handleCustomizePlan = () => {
    setShowPersonalizedPlan(false)
    setShowQuestionnaire(true)
  }

  const handleNavigate = (page: string, duration?: number) => {
    if (page === 'prayer' && duration) {
      // Set the selected minutes for the timer
      setSelectedMinutes(duration);
    }
    setActiveTab(page);
  };

  const handleTimerComplete = () => {
    if (isFirstTimeUser) {
      setShowQuestionnaire(true)
    } else {
      setActiveTab('dashboard')
    }
  }

  const handleLogout = async () => {
    await logout();
    setActiveTab('prayer');
    setUserPlan(null);
    setShowQuestionnaire(false);
    setShowPersonalizedPlan(false);
    setIsFirstTimeUser(true);
    localStorage.removeItem('userPlan');
  }

  // Show error screen
  if (error) {
  return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-6 text-center">
          <div className="bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-neutral-800">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-100 mb-4">
              Configuration Required
          </h1>
            <p className="text-gray-400 mb-6">
              {error}
            </p>
            <div className="bg-neutral-800 rounded-xl p-4 text-left text-sm">
              <p className="text-gray-300 mb-2">To fix this:</p>
              <ol className="text-gray-400 space-y-1">
                <li>1. Create a Firebase project</li>
                <li>2. Enable Google Authentication</li>
                <li>3. Add your config to .env file</li>
                <li>4. Restart the development server</li>
              </ol>
            </div>
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
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <SimpleLogo size="lg" />
          </div>
          <p className="text-gray-400">Loading ChristianKit...</p>
        </div>
      </div>
    );
  }

  // Show questionnaire for first-time users (regardless of authentication)
  if (showQuestionnaire) {
    return (
      <UserQuestionnaire 
        onComplete={handleQuestionnaireComplete}
        onBack={() => setShowQuestionnaire(false)}
      />
    )
  }

  // Show personalized plan
  if (showPersonalizedPlan) {
    return (
      <PersonalizedPlan 
        plan={userPlan!}
        onComplete={handlePlanComplete}
        onCustomize={handleCustomizePlan}
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
          />
        )
      case 'dashboard':
        return (
          <Dashboard 
            onNavigate={(page) => {
              if (page === 'dashboard' && isFirstTimeUser) {
                setShowQuestionnaire(true)
              } else {
                setActiveTab(page)
              }
            }}
            userPlan={userPlan}
          />
        )
      case 'community':
        return <CommunitySection />
      default:
        return (
          <PrayerTimerPage 
            onNavigate={handleNavigate}
            onStartQuestionnaire={() => setShowQuestionnaire(true)}
            onTimerComplete={handleTimerComplete}
            userPlan={userPlan}
            selectedMinutes={selectedMinutes}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-black text-gray-100">
      {/* Navigation */}
      <nav className="bg-black/95 backdrop-blur-xl border-b border-neutral-800 shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <SimpleLogo />
            </div>

            {/* Right Side - Navigation Tabs + User Menu */}
            <div className="flex items-center space-x-4">
              {/* Navigation Tabs */}
              <div className="hidden md:flex items-center space-x-1">
                <button
                  onClick={() => setActiveTab('prayer')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'prayer'
                      ? 'bg-neutral-800 text-green-400'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50 hover:border-neutral-700/50'
                  }`}
                >
                  ✨ Heal Now
                </button>
                <button
                  onClick={() => {
                    if (isFirstTimeUser) {
                      setShowQuestionnaire(true)
                    } else {
                      setActiveTab('dashboard')
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'dashboard'
                      ? 'bg-neutral-800 text-green-400'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50 hover:border-neutral-700/50'
                  }`}
                >
                  🏠 Homepage {isFirstTimeUser && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">New</span>}
                </button>
                <button
                  onClick={() => setActiveTab('community')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === 'community'
                      ? 'bg-neutral-800 text-green-400'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50 hover:border-neutral-700/50'
                  }`}
                >
                  👥 Community
                </button>
                <button
                  onClick={() => setShowFeedback(true)}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50 hover:border-neutral-700/50"
                >
                  💬 Feedback
                </button>
              </div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                {/* Pro Badge */}
                {isProUser && (
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    ⭐ PRO
                  </span>
                )}

                {/* User Avatar */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user?.email?.charAt(0).toUpperCase() || 'G'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-gray-100 transition-colors duration-200"
                    title="Sign out"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
        {renderContent()}

      {/* Feedback Form Modal */}
      {showFeedback && (
        <FeedbackForm onClose={() => setShowFeedback(false)} />
      )}
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
