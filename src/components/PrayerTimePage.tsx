import React, { useState, useEffect, useRef } from 'react'
import { WeeklyProgress } from './WeeklyProgress'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { prayerService } from '../services/prayerService'
import ProgressService from '../services/ProgressService'

interface PrayerTimePageProps {
  onNavigate?: (page: string) => void;
  userPlan?: {
    prayerTime: number;
    bibleTime: number;
    prayerStyle: string;
    prayerFocus: string[];
    bibleTopics: string[];
    customPlan?: {
      prayer: {
        title: string;
        description: string;
        duration: number;
        focus: string[];
        style: string;
        tips: string[];
      };
      reading: {
        title: string;
        description: string;
        duration: number;
        topics: string[];
        approach: string;
        tips: string[];
      };
      reflection: {
        title: string;
        description: string;
        duration: number;
        method: string;
        prompts: string[];
        tips: string[];
      };
    };
  } | null;
}

export const PrayerTimePage: React.FC<PrayerTimePageProps> = ({ onNavigate, userPlan }) => {
  const [todayProgress, setTodayProgress] = useState({
    prayer: 0,
    bible: 0,
    meditation: 0
  })
  const [prayerProgress, setPrayerProgress] = useState({
    currentStreak: 0,
    totalPrayers: 0,
    currentLevel: 'beginner',
    daysThisMonth: 0
  })
  const { user } = useSupabaseAuth()
  const [scrollY, setScrollY] = useState(0)

  // Prayer Timer States
  const [showPrayerTimer, setShowPrayerTimer] = useState(false)
  const [selectedMinutes, setSelectedMinutes] = useState(10)
  const [timeRemaining, setTimeRemaining] = useState(selectedMinutes * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [currentEncouragingTitle, setCurrentEncouragingTitle] = useState(0)

  // State for completion feedback
  const [prayerCompleted, setPrayerCompleted] = useState(false)
  const [completionMessage, setCompletionMessage] = useState('')

  const encouragingTitles = [
    "Trust in His Perfect Love",
    "Take your time, God's listening...",
    "Feel His presence around you",
    "Open your heart to His wisdom",
    "Rest in His peaceful embrace",
    "Let His love fill your soul"
  ]

  // Handle prayer session completion
  const handlePrayerCompleted = async () => {
    try {
      const today = new Date()
      const sessionDuration = selectedMinutes // in minutes

      await ProgressService.saveSession({
        user_id: user?.id || '',
        duration_minutes: sessionDuration, // Corrected property name
        prayer_type: 'prayer',
        started_at: today.toISOString(),
        ended_at: new Date(Date.now() + sessionDuration * 60000).toISOString()
      })

      setPrayerCompleted(true)
      setCompletionMessage(`🎉 Prayer session completed! ${sessionDuration} minutes of spiritual growth.`)
      await loadTodayProgress() // Reload progress to update streaks

      setTimeout(() => {
        setPrayerCompleted(false)
        setCompletionMessage('')
        setShowPrayerTimer(false)
      }, 3000) // Show completion for 3 seconds

    } catch (error) {
      console.error('Error saving prayer session:', error)
      setCompletionMessage('❌ Error saving prayer session. Please try again.')
      setTimeout(() => {
        setCompletionMessage('')
      }, 2000)
    }
  }

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Rotating encouraging titles
  useEffect(() => {
    if (showPrayerTimer) {
      const interval = setInterval(() => {
        setCurrentEncouragingTitle((prev) => (prev + 1) % encouragingTitles.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [showPrayerTimer])

  // Countdown timer functionality with prayer session tracking
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (showPrayerTimer && isTimerRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            handlePrayerCompleted() // Call on completion
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [showPrayerTimer, isTimerRunning, timeRemaining, selectedMinutes, user?.id]) // Added dependencies

  // Initialize timer when modal opens (but don't start automatically)
  useEffect(() => {
    if (showPrayerTimer) {
      setTimeRemaining(selectedMinutes * 60)
      setIsTimerRunning(false) // Don't auto-start
      setPrayerCompleted(false)
      setCompletionMessage('')
    }
  }, [showPrayerTimer, selectedMinutes])

  // Function to load today's progress (moved outside useEffect)
  const loadTodayProgress = async () => {
    if (!user) return

    try {
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]

      // Get weekly progress which includes sessions
      const weeklyData = await ProgressService.getWeeklyProgress(user.id)
      
      // Calculate today's prayer minutes from weekly data
      const todayPrayerMinutes = weeklyData.dailyProgress[todayStr]?.prayer || 0

      // Calculate current streak from weekly data
      let currentStreak = 0
      const sortedDates = Object.keys(weeklyData.dailyProgress).sort()

      for (let i = sortedDates.length - 1; i >= 0; i--) {
        const dateProgress = weeklyData.dailyProgress[sortedDates[i]]
        if (dateProgress.prayer > 0) {
          currentStreak++
        } else {
          break
        }
      }

      // If today has prayer but isn't in weekly data yet, add 1
      if (todayPrayerMinutes > 0 && !weeklyData.dailyProgress[todayStr]) {
        currentStreak++
      }

      // Calculate prayer stats from weekly data
      const totalPrayers = Object.values(weeklyData.dailyProgress).reduce((sum: number, day: any) => sum + day.prayer, 0)
      const daysActive = Object.values(weeklyData.dailyProgress).filter((day: any) => day.prayer > 0).length

      setPrayerProgress({
        currentStreak,
        totalPrayers,
        currentLevel: currentStreak > 30 ? 'advanced' : currentStreak > 14 ? 'intermediate' : 'beginner',
        daysThisMonth: daysActive
      })

      setTodayProgress({
        prayer: todayPrayerMinutes,
        bible: 0,
        meditation: 0
      })

    } catch (error) {
      console.error('Error loading today progress:', error)
    }
  }

  // Load progress on component mount
  useEffect(() => {
    loadTodayProgress()
  }, [user])

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPrayerTimer) {
        setShowPrayerTimer(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [showPrayerTimer])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showPrayerTimer) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showPrayerTimer])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Osmo Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-yellow-300/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-purple-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-black/20 backdrop-blur-2xl border-b border-yellow-400/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-white">Prayer Time</div>
            <div className="text-sm text-gray-400">Your spiritual practice</div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Header Section */}
        <div className="mb-12 sm:mb-16 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-400/20 to-yellow-500/20 text-amber-200 border border-amber-400/30 text-sm font-medium mb-6">
            PRAYER & SCRIPTURE
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            My <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent">Prayer Time</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Connect with God through intentional prayer and scripture study in a sacred digital space.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {[
            { label: 'Current Streak', value: prayerProgress.currentStreak, unit: 'days', icon: '🔥' },
            { label: 'Total Prayers', value: prayerProgress.totalPrayers, unit: 'sessions', icon: '🙏' },
            { label: 'Prayer Level', value: prayerProgress.currentLevel, unit: '', icon: '⭐' },
            { label: 'This Month', value: prayerProgress.daysThisMonth, unit: 'days', icon: '📅' }
          ].map((stat, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:bg-white/10 hover:border-yellow-400/30 transition-all duration-300 shadow-lg">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {typeof stat.value === 'string' ? stat.value : stat.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-400">
                  {stat.label} {stat.unit && typeof stat.value === 'number' && `(${stat.unit})`}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Prayer Session Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 mb-12 sm:mb-16 shadow-2xl hover:bg-white/10 hover:border-yellow-400/30 transition-all duration-300">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-400/20 to-yellow-500/20 text-amber-200 border border-amber-400/30 text-sm font-medium mb-6">
              SESSION
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Start Prayer Session</h2>
            <p className="text-gray-400 mb-8 text-lg">Choose your prayer duration and begin your spiritual practice.</p>
            
            {/* Duration Selection */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
              {[5, 10, 15, 20, 30].map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => setSelectedMinutes(minutes)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 min-w-[44px] min-h-[44px] ${
                    selectedMinutes === minutes
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg shadow-amber-500/25'
                      : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-yellow-400/30'
                  }`}
                >
                  {minutes}m
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowPrayerTimer(true)}
              className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-black rounded-xl font-bold text-lg hover:from-amber-500 hover:to-yellow-400 transition-all duration-300 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transform hover:scale-105 active:scale-95"
            >
              Begin Prayer
            </button>
          </div>
        </div>

        {/* Scripture Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 mb-12 sm:mb-16 shadow-2xl hover:bg-white/10 hover:border-yellow-400/30 transition-all duration-300">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-200 border border-purple-400/30 text-sm font-medium mb-6">
              SCRIPTURE
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">Daily Scripture</h2>
            <blockquote className="text-lg sm:text-xl text-gray-300 italic mb-6 max-w-4xl mx-auto leading-relaxed">
              "If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness."
            </blockquote>
            <cite className="text-sm sm:text-base text-amber-400 font-medium">— 1 John 1:9</cite>
          </div>
        </div>

        {/* Weekly Progress Placeholder */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl hover:bg-white/10 hover:border-yellow-400/30 transition-all duration-300">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-200 border border-green-400/30 text-sm font-medium mb-6">
              PROGRESS
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Weekly Progress</h2>
            <p className="text-gray-400 mb-8 text-lg">Track your spiritual growth and consistency.</p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 sm:p-12">
              <div className="text-gray-400 text-sm sm:text-base">Progress visualization coming soon...</div>
            </div>
          </div>
        </div>

      </div>

      {/* Prayer Timer Modal */}
      {showPrayerTimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setShowPrayerTimer(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setShowPrayerTimer(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-300"
            >
              ✕
            </button>

            {/* Current Streak Display */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-amber-400/20 to-yellow-500/20 text-amber-200 border border-amber-400/30 text-xs font-medium mb-3">
                CURRENT STREAK
              </div>
              <div className="text-3xl font-bold text-white mb-1">{prayerProgress.currentStreak} days</div>
              <div className="text-sm text-gray-400">Keep going strong!</div>
            </div>

            {/* Completion Feedback */}
            {prayerCompleted && (
              <div className="text-center mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <div className="text-green-400 font-medium mb-2">Prayer Session Completed!</div>
                <div className="text-sm text-green-300">{completionMessage}</div>
              </div>
            )}

            {/* Timer Display */}
            <div className="text-center mb-8">
              <div className="text-6xl sm:text-7xl font-light text-white mb-3">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-sm sm:text-base text-gray-400 mb-6">
                {encouragingTitles[currentEncouragingTitle]}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/10 rounded-full h-3 mb-6">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 h-3 rounded-full transition-all duration-1000 shadow-lg shadow-amber-500/25"
                  style={{
                    width: `${((selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60)) * 100}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Achievement Orbs */}
            <div className="flex justify-center space-x-3 sm:space-x-4 mb-8">
              {[
                { emoji: '🌱', label: 'Seed', achieved: prayerProgress.currentStreak >= 1 },
                { emoji: '🌿', label: 'Growth', achieved: prayerProgress.currentStreak >= 7 },
                { emoji: '✨', label: 'Light', achieved: prayerProgress.currentStreak >= 14 },
                { emoji: '🔥', label: 'Flame', achieved: prayerProgress.currentStreak >= 30 }
              ].map((orb, index) => (
                <div key={index} className="text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg mb-2 transition-all duration-300 ${
                    orb.achieved 
                      ? 'bg-gradient-to-br from-green-400/20 to-emerald-500/20 border-2 border-green-400/50 shadow-lg shadow-green-500/25' 
                      : 'bg-white/10 border-2 border-white/20'
                  }`}>
                    <span className={orb.achieved ? 'opacity-100' : 'opacity-40'}>{orb.emoji}</span>
                  </div>
                  <div className={`text-xs ${orb.achieved ? 'text-green-400' : 'text-gray-500'}`}>
                    {orb.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Scripture During Prayer */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <div className="text-xs font-medium text-gray-400 mb-2 text-center">TODAY'S SCRIPTURE</div>
              <div className="text-sm text-gray-300 text-center italic">
                "If we confess our sins, he is faithful and just..."
              </div>
            </div>

            {/* Timer Controls */}
            <div className="space-y-4">
              {/* Duration Selection */}
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-3">Choose prayer duration:</div>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {[5, 10, 15, 20, 30].map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => setSelectedMinutes(minutes)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 min-w-[44px] min-h-[44px] ${
                        selectedMinutes === minutes
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-lg shadow-amber-500/25'
                          : 'bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-yellow-400/30'
                      }`}
                      disabled={isTimerRunning}
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Timer Control Button */}
              <button
                onClick={() => {
                  if (timeRemaining === 0 && !isTimerRunning) {
                    setTimeRemaining(selectedMinutes * 60)
                    setPrayerCompleted(false)
                    setCompletionMessage('')
                  }
                  setIsTimerRunning(!isTimerRunning)
                }}
                disabled={prayerCompleted}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  prayerCompleted
                    ? 'bg-green-500/20 text-green-400 cursor-not-allowed border border-green-500/30'
                    : isTimerRunning
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25'
                    : 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-400 text-black shadow-lg shadow-amber-500/25'
                }`}
              >
                {prayerCompleted
                  ? 'Prayer Completed!'
                  : isTimerRunning
                  ? 'Pause Prayer'
                  : timeRemaining === selectedMinutes * 60
                  ? 'Start Prayer'
                  : 'Resume Prayer'
                }
              </button>

              {/* Reset Button */}
              <button
                onClick={() => {
                  setTimeRemaining(selectedMinutes * 60)
                  setIsTimerRunning(false)
                  setPrayerCompleted(false)
                  setCompletionMessage('')
                }}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 rounded-xl font-medium transition-all duration-300"
              >
                Reset
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}