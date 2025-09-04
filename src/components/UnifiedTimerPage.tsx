import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { useAppStore, PrayerSession, BibleSession, MeditationSession } from '../store/appStore'

interface UnifiedTimerPageProps {
  timerType: 'prayer' | 'bible' | 'meditation'
  onNavigate?: (tab: string) => void
  onTimerComplete?: () => void
  selectedMinutes?: number
  isFirstTimeUser?: boolean
}

export const UnifiedTimerPage: React.FC<UnifiedTimerPageProps> = ({ 
  timerType,
  onNavigate, 
  onTimerComplete, 
  selectedMinutes: propSelectedMinutes,
  isFirstTimeUser = false 
}) => {
  const { user, signInWithGoogle } = useSupabaseAuth()
  const { addPrayerSession, addBibleSession, addMeditationSession, userPlan } = useAppStore()
  
  const [selectedMinutes, setSelectedMinutes] = useState(propSelectedMinutes || 10)
  const [timeRemaining, setTimeRemaining] = useState((propSelectedMinutes || 10) * 60)
  const [isActive, setIsActive] = useState(timerType === 'prayer') // Prayer starts active, others paused
  const [completed, setCompleted] = useState(false)
  const [message, setMessage] = useState("")
  const [focus, setFocus] = useState("")
  const [mood, setMood] = useState("")
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0)
  const [showReminder, setShowReminder] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0)
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0)
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reminderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer-specific configurations
  const timerConfig = {
    prayer: {
      title: 'Prayer Time',
      icon: '🙏',
      color: 'from-amber-400 to-yellow-500',
      message: "Lord Jesus, I'm here with You now to talk about...",
      encouragingTitles: [
        "Find Peace", "Trust in Him", "Be Still", "Pray Without Ceasing",
        "Cast Your Cares", "Walk by Faith", "Rejoice Always", "Give Thanks"
      ],
      encouragingSubtitles: [
        "In His presence", "He is faithful", "And know He is God",
        "In every moment", "On Him", "Not by sight", "In all circumstances", "In everything"
      ],
      focusReminders: [
        "What are you grateful for today?",
        "Who needs your prayers right now?",
        "What is weighing on your heart?",
        "How has God blessed you recently?",
        "What do you need God's guidance for?"
      ]
    },
    bible: {
      title: 'Bible Reading',
      icon: '📖',
      color: 'from-blue-400 to-indigo-500',
      message: "Lord Jesus, I'm here with You now to read Your Word...",
      encouragingTitles: [
        "His Word", "Truth", "Light", "Wisdom",
        "Guidance", "Comfort", "Hope", "Life"
      ],
      encouragingSubtitles: [
        "Is a lamp", "Will set you free", "Shines in darkness", "From above",
        "For your path", "In times of need", "Never fails", "Abundant life"
      ],
      focusReminders: [
        "What verse speaks to you today?",
        "How does this apply to your life?",
        "What is God teaching you?",
        "How can you live this out?",
        "What questions do you have?"
      ]
    },
    meditation: {
      title: 'Meditation',
      icon: '🧘',
      color: 'from-green-400 to-emerald-500',
      message: "Lord Jesus, I'm here with You now to find peace...",
      encouragingTitles: [
        "Find Peace", "Trust in Him", "Be Still", "Meditate on Him",
        "Cast Your Cares", "Walk by Faith", "Rejoice Always", "Give Thanks"
      ],
      encouragingSubtitles: [
        "In His presence", "He is faithful", "And know He is God",
        "Day and night", "On Him", "Not by sight", "In all circumstances", "In everything"
      ],
      focusReminders: [
        "Breathe in God's peace",
        "Release your worries to Him",
        "Focus on His love for you",
        "Listen for His voice",
        "Rest in His presence"
      ]
    }
  }

  const config = timerConfig[timerType]

  // Initialize message
  useEffect(() => {
    setMessage(config.message)
  }, [timerType, config.message])

  // Timer logic
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((time) => {
          if (time <= 1) {
            setIsActive(false)
            setCompleted(true)
            onTimerComplete?.()
            return 0
          }
          return time - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, timeRemaining, onTimerComplete])

  // Reminder system
  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      reminderIntervalRef.current = setInterval(() => {
        setCurrentReminderIndex((prev) => (prev + 1) % config.focusReminders.length)
        setShowReminder(true)
        setTimeout(() => setShowReminder(false), 3000)
      }, 30000) // Every 30 seconds
    }

    return () => {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current)
      }
    }
  }, [isActive, timeRemaining, config.focusReminders.length])

  // Title slideshow
  useEffect(() => {
    const titleInterval = setInterval(() => {
      setCurrentTitleIndex((prev) => (prev + 1) % config.encouragingTitles.length)
    }, 5000)

    return () => clearInterval(titleInterval)
  }, [config.encouragingTitles.length])

  // Handle timer completion
  const handleComplete = useCallback(() => {
    const sessionData = {
      id: `${timerType}-${Date.now()}`,
      date: new Date().toISOString(),
      duration: selectedMinutes,
      focus,
      mood,
      completed: true,
      notes: message
    }

    // Add session to store
    if (timerType === 'prayer') {
      addPrayerSession(sessionData as PrayerSession)
    } else if (timerType === 'bible') {
      addBibleSession(sessionData as BibleSession)
    } else if (timerType === 'meditation') {
      addMeditationSession(sessionData as MeditationSession)
    }

    setCompleted(true)
    onTimerComplete?.()
  }, [timerType, selectedMinutes, focus, mood, message, addPrayerSession, addBibleSession, addMeditationSession, onTimerComplete])

  // Format time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handle start/pause
  const toggleTimer = () => {
    if (completed) {
      // Reset timer
      setTimeRemaining(selectedMinutes * 60)
      setCompleted(false)
      setIsActive(true)
    } else {
      setIsActive(!isActive)
    }
  }

  // Handle time change
  const handleTimeChange = (minutes: number) => {
    setSelectedMinutes(minutes)
    setTimeRemaining(minutes * 60)
    setIsActive(false)
    setCompleted(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-yellow-300/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-black/20 backdrop-blur-2xl border-b border-yellow-400/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              {config.icon} {config.title}
            </h1>
            <p className="text-slate-300 text-sm sm:text-lg">
              {config.encouragingTitles[currentTitleIndex]} - {config.encouragingSubtitles[currentTitleIndex]}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        
        {/* Timer Display */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className={`w-64 h-64 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center shadow-2xl`}>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-white/80 text-sm">
                  {completed ? 'Completed!' : isActive ? 'In Progress' : 'Paused'}
                </div>
              </div>
            </div>
            
            {/* Progress Ring */}
            <svg className="absolute inset-0 w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - (selectedMinutes * 60 - timeRemaining) / (selectedMinutes * 60))}`}
                className="transition-all duration-1000"
              />
            </svg>
          </div>
        </div>

        {/* Controls */}
        <div className="text-center mb-8">
          <button
            onClick={toggleTimer}
            className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 ${
              completed
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : isActive
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : `bg-gradient-to-r ${config.color} text-white hover:opacity-90`
            }`}
          >
            {completed ? '🔄 Restart' : isActive ? '⏸️ Pause' : '▶️ Start'}
          </button>
        </div>

        {/* Time Selection */}
        <div className="text-center mb-8">
          <div className="flex justify-center space-x-2 mb-4">
            {[5, 10, 15, 20, 30].map((minutes) => (
              <button
                key={minutes}
                onClick={() => handleTimeChange(minutes)}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  selectedMinutes === minutes
                    ? `bg-gradient-to-r ${config.color} text-white`
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {minutes}m
              </button>
            ))}
          </div>
        </div>

        {/* Focus Input */}
        <div className="max-w-2xl mx-auto mb-8">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`What's on your heart for ${timerType}?`}
            className="w-full p-4 bg-black/20 border border-yellow-400/30 rounded-2xl text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-base min-h-[100px] transition-all duration-300"
            rows={3}
          />
        </div>

        {/* Reminder */}
        {showReminder && (
          <div className="text-center mb-8">
            <div className="bg-yellow-400/20 border border-yellow-400/40 rounded-2xl p-4 max-w-2xl mx-auto">
              <p className="text-yellow-400 font-medium">
                💭 {config.focusReminders[currentReminderIndex]}
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        {onNavigate && (
          <div className="text-center">
            <button
              onClick={() => onNavigate('dashboard')}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300"
            >
              🏠 Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
