import React, { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { PrayerTimerPage } from './components/PrayerTimerPage'
import { CommunitySection } from './components/CommunitySection'
import { UserQuestionnaire } from './components/UserQuestionnaire'
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
  const { user, loading, logout, isProUser, error, signInWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState('prayer')
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true)
  const [selectedMinutes, setSelectedMinutes] = useState<number | undefined>(undefined);
  const [showFeedback, setShowFeedback] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const savedPlan = localStorage.getItem('userPlan')
    const hasCompletedQuestionnaire = localStorage.getItem('hasCompletedQuestionnaire')
    
    if (savedPlan && hasCompletedQuestionnaire === 'true') {
      setUserPlan(JSON.parse(savedPlan))
      setIsFirstTimeUser(false)
    } else {
      // Even if there's a plan, if questionnaire wasn't completed, show it
      setIsFirstTimeUser(true)
      if (savedPlan) {
        setUserPlan(JSON.parse(savedPlan))
      }
    }
    
    // Debug logging
    console.log('App loaded:', { 
      hasPlan: !!savedPlan, 
      hasCompletedQuestionnaire, 
      isFirstTimeUser: !hasCompletedQuestionnaire 
    })
  }, [])

  // Close mobile menu when questionnaire is shown
  useEffect(() => {
    if (showQuestionnaire) {
      setShowMobileMenu(false)
    }
  }, [showQuestionnaire])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showMobileMenu && !target.closest('nav')) {
        setShowMobileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMobileMenu])

  const handleQuestionnaireComplete = (plan: UserPlan) => {
    setUserPlan(plan)
    setShowQuestionnaire(false)
    setIsFirstTimeUser(false)
    
    // Adjust main screen tabs based on questionnaire results
    if (plan.experienceLevel === 'beginner') {
      // Beginners see simplified tabs
      setActiveTab('dashboard')
    } else if (plan.experienceLevel === 'intermediate') {
      // Intermediate users see all tabs
      setActiveTab('dashboard')
    } else if (plan.experienceLevel === 'advanced') {
      // Advanced users see all tabs plus advanced features
      setActiveTab('dashboard')
    }
    
    localStorage.setItem('userPlan', JSON.stringify(plan))
    localStorage.setItem('hasCompletedQuestionnaire', 'true') // Mark as completed
    
    console.log('Questionnaire completed, user plan saved:', plan)
    console.log('User experience level:', plan.experienceLevel)
  }

  const handleCustomizePlan = () => {
    setShowQuestionnaire(true)
  }

  const handleNavigate = (page: string, duration?: number) => {
    if (page === 'prayer' && duration) {
      // Set the selected minutes for the timer
      setSelectedMinutes(duration);
    }
    
    // For first-time users, certain pages should trigger questionnaire first
    if (isFirstTimeUser && (page === 'dashboard' || page === 'community')) {
      console.log('First-time user trying to navigate to', page, '- showing questionnaire instead')
      setShowQuestionnaire(true)
    } else {
      setActiveTab(page);
    }
  };

  const handleTimerComplete = () => {
    // ALL new users go to questionnaire after timer completion
    if (isFirstTimeUser) {
      console.log('Timer completed for first-time user, showing questionnaire')
      setShowQuestionnaire(true)
    } else {
      console.log('Timer completed for returning user, going to dashboard')
      setActiveTab('dashboard')
    }
  }

  const handleLogout = async () => {
    await logout();
    setActiveTab('prayer');
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

  // For first-time users, always show the timer first
  if (isFirstTimeUser && !showQuestionnaire) {
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
                    console.log('Homepage button clicked:', { isFirstTimeUser, showQuestionnaire })
                    if (isFirstTimeUser) {
                      console.log('Showing questionnaire for first-time user')
                      setShowQuestionnaire(true)
                    } else {
                      console.log('Going directly to dashboard for returning user')
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
                  {/* Debug status indicator */}
                  {process.env.NODE_ENV === 'development' && (
                    <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                      isFirstTimeUser ? 'bg-yellow-500 text-black' : 'bg-blue-500 text-white'
                    }`}>
                      {isFirstTimeUser ? 'FTU' : 'RTU'}
                    </span>
                  )}
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

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                {/* Pro Badge */}
                {isProUser && (
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    ⭐ PRO
                  </span>
                )}

                {/* User Avatar and Actions */}
                <div className="flex items-center space-x-2">
                  {user ? (
                    // User is signed in - show avatar and logout
                    <>
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {user.email?.charAt(0).toUpperCase() || 'G'}
                        </span>
                      </div>
                      
                      {/* Debug Button - Only show in development */}
                      {process.env.NODE_ENV === 'development' && (
                        <button
                          onClick={() => {
                            setIsFirstTimeUser(true)
                            localStorage.removeItem('hasCompletedQuestionnaire')
                            console.log('Debug: Reset to first-time user')
                          }}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                          title="Reset to first-time user (dev only)"
                        >
                          🔄
                        </button>
                      )}
                      
                      <button
                        onClick={handleLogout}
                        className="text-gray-400 hover:text-gray-100 transition-colors duration-200"
                        title="Sign out"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    // User is not signed in - show sign-in button
                    <button
                      onClick={signInWithGoogle}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-xl font-bold hover:from-blue-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                      title="Sign in to save your progress"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Sign In
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div className="md:hidden bg-black/95 backdrop-blur-xl border-b border-neutral-800 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => {
                setActiveTab('prayer')
                setShowMobileMenu(false)
              }}
              className={`w-full p-4 rounded-xl font-medium transition-all duration-200 text-left ${
                activeTab === 'prayer'
                  ? 'bg-neutral-800 text-green-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50'
              }`}
            >
              ✨ Heal Now
            </button>
            <button
              onClick={() => {
                console.log('Mobile Homepage button clicked:', { isFirstTimeUser, showQuestionnaire })
                if (isFirstTimeUser) {
                  console.log('Mobile: Showing questionnaire for first-time user')
                  setShowQuestionnaire(true)
                  setShowMobileMenu(false)
                } else {
                  console.log('Mobile: Going directly to dashboard for returning user')
                  setActiveTab('dashboard')
                  setShowMobileMenu(false)
                }
              }}
              className={`w-full p-4 rounded-xl font-medium transition-all duration-200 text-left ${
                activeTab === 'dashboard'
                  ? 'bg-neutral-800 text-green-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50'
              }`}
            >
              🏠 Homepage {isFirstTimeUser && <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">New</span>}
            </button>
            <button
              onClick={() => {
                setActiveTab('community')
                setShowMobileMenu(false)
              }}
              className={`w-full p-4 rounded-xl font-medium transition-all duration-200 text-left ${
                activeTab === 'community'
                  ? 'bg-neutral-800 text-green-400'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50'
              }`}
            >
              👥 Community
            </button>
            <button
              onClick={() => {
                setShowFeedback(true)
                setShowMobileMenu(false)
              }}
              className="w-full p-4 rounded-xl font-medium transition-all duration-200 text-left text-gray-400 hover:text-gray-100 hover:bg-neutral-900/50"
            >
              💬 Feedback
            </button>
            
            {/* Sign In Button for Mobile - Only show when user is not authenticated */}
            {!user && (
              <div className="pt-2 border-t border-neutral-700">
                <button
                  onClick={() => {
                    signInWithGoogle()
                    setShowMobileMenu(false)
                  }}
                  className="w-full p-4 rounded-xl font-medium transition-all duration-200 text-left bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 flex items-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  🔐 Sign In with Google
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
