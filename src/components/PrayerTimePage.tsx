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

      // Get today's prayer sessions
      const todaySessions = await ProgressService.getSessionsByDateRange(
        user.id,
        todayStr,
        todayStr
      )

      // Calculate today's prayer minutes
      const todayPrayerMinutes = todaySessions.reduce((total, session) => {
        return total + (session.duration_minutes || 0)
      }, 0)

      // Load weekly data for progress calculation
      if (todayPrayerMinutes > 0) {
        try {
          const oneWeekAgo = new Date(today)
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

          const weeklyData = await ProgressService.getWeeklyProgress(user.id)

          // Calculate current streak
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

        } catch (error) {
          console.error('Error loading progress data:', error)
          setPrayerProgress({
            currentStreak: todayPrayerMinutes > 0 ? 1 : 0,
            totalPrayers: todaySessions.length,
            currentLevel: 'beginner',
            daysThisMonth: todayPrayerMinutes > 0 ? 1 : 0
          })
        }
      }

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-medium text-gray-900">Prayer Time</div>
            <div className="text-sm text-gray-500">Your spiritual practice</div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Header Section */}
        <div className="mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium mb-4">
            PRAYER & SCRIPTURE
          </div>
          <h1 className="text-4xl font-medium text-gray-900 mb-4">My Prayer Time</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Connect with God through intentional prayer and scripture study.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { label: 'Current Streak', value: prayerProgress.currentStreak, unit: 'days' },
            { label: 'Total Prayers', value: prayerProgress.totalPrayers, unit: 'sessions' },
            { label: 'Prayer Level', value: prayerProgress.currentLevel, unit: '' },
            { label: 'This Month', value: prayerProgress.daysThisMonth, unit: 'days' }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="text-2xl font-semibold text-gray-900 mb-1">
                {typeof stat.value === 'string' ? stat.value : stat.value}
              </div>
              <div className="text-sm text-gray-500">
                {stat.label} {stat.unit && typeof stat.value === 'number' && `(${stat.unit})`}
              </div>
            </div>
          ))}
        </div>

        {/* Prayer Session Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-16">
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium mb-4">
              SESSION
            </div>
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Start Prayer Session</h2>
            <p className="text-gray-600 mb-8">Choose your prayer duration and begin your spiritual practice.</p>
            
            {/* Duration Selection */}
            <div className="flex justify-center gap-3 mb-8">
              {[5, 10, 15, 20, 30].map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => setSelectedMinutes(minutes)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedMinutes === minutes
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {minutes}m
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowPrayerTimer(true)}
              className="px-8 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Begin Prayer
            </button>
          </div>
        </div>

        {/* Scripture Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-16">
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium mb-4">
              SCRIPTURE
            </div>
            <h2 className="text-2xl font-medium text-gray-900 mb-6">Daily Scripture</h2>
            <blockquote className="text-lg text-gray-700 italic mb-4 max-w-3xl mx-auto leading-relaxed">
              "If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness."
            </blockquote>
            <cite className="text-sm text-gray-500 font-medium">— 1 John 1:9</cite>
          </div>
        </div>

        {/* Weekly Progress Placeholder */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium mb-4">
              PROGRESS
            </div>
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Weekly Progress</h2>
            <p className="text-gray-600 mb-8">Track your spiritual growth and consistency.</p>
            <div className="bg-gray-50 rounded-lg p-12">
              <div className="text-gray-400 text-sm">Progress visualization coming soon...</div>
            </div>
          </div>
        </div>

      </div>

      {/* Prayer Timer Modal */}
      {showPrayerTimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowPrayerTimer(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-8 max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setShowPrayerTimer(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>

            {/* Current Streak Display */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium mb-2">
                CURRENT STREAK
              </div>
              <div className="text-2xl font-semibold text-gray-900">{prayerProgress.currentStreak} days</div>
              <div className="text-sm text-gray-500">Keep going strong!</div>
            </div>

            {/* Completion Feedback */}
            {prayerCompleted && (
              <div className="text-center mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-green-600 font-medium mb-2">Prayer Session Completed!</div>
                <div className="text-sm text-green-700">{completionMessage}</div>
              </div>
            )}

            {/* Timer Display */}
            <div className="text-center mb-8">
              <div className="text-6xl font-light text-gray-900 mb-2">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-sm text-gray-500 mb-4">
                {encouragingTitles[currentEncouragingTitle]}
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div 
                  className="bg-gray-900 h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${((selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60)) * 100}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Achievement Orbs */}
            <div className="flex justify-center space-x-4 mb-8">
              {[
                { emoji: '🌱', label: 'Seed', achieved: prayerProgress.currentStreak >= 1 },
                { emoji: '🌿', label: 'Growth', achieved: prayerProgress.currentStreak >= 7 },
                { emoji: '✨', label: 'Light', achieved: prayerProgress.currentStreak >= 14 },
                { emoji: '🔥', label: 'Flame', achieved: prayerProgress.currentStreak >= 30 }
              ].map((orb, index) => (
                <div key={index} className="text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg mb-2 ${
                    orb.achieved ? 'bg-green-100 border-2 border-green-300' : 'bg-gray-100 border-2 border-gray-300'
                  }`}>
                    <span className={orb.achieved ? 'opacity-100' : 'opacity-40'}>{orb.emoji}</span>
                  </div>
                  <div className={`text-xs ${orb.achieved ? 'text-green-600' : 'text-gray-400'}`}>
                    {orb.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Scripture During Prayer */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-xs font-medium text-gray-500 mb-2 text-center">TODAY'S SCRIPTURE</div>
              <div className="text-sm text-gray-700 text-center italic">
                "If we confess our sins, he is faithful and just..."
              </div>
            </div>

            {/* Timer Controls */}
            <div className="space-y-3">
              {/* Duration Selection */}
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-3">Choose prayer duration:</div>
                <div className="flex justify-center space-x-2 mb-4">
                  {[5, 10, 15, 20, 30].map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => setSelectedMinutes(minutes)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedMinutes === minutes
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                className={`w-full py-4 rounded-lg font-medium transition-colors ${
                  prayerCompleted
                    ? 'bg-green-100 text-green-600 cursor-not-allowed'
                    : isTimerRunning
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-gray-900 hover:bg-gray-800 text-white'
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
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium transition-colors"
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