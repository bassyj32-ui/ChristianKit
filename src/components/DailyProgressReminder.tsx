import React, { useState, useEffect } from 'react'
import { prayerService } from '../services/prayerService'

interface ProgressData {
  day: string
  prayer: number
  bible: number
  meditation: number
  journal: number
}

interface DailyProgressReminderProps {
  variant?: 'compact' | 'detailed' | 'motivational'
  showActions?: boolean
  className?: string
}

export const DailyProgressReminder: React.FC<DailyProgressReminderProps> = ({ 
  variant = 'motivational',
  showActions = true,
  className = ''
}) => {
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [motivationalMessage, setMotivationalMessage] = useState('')

  useEffect(() => {
    const loadProgress = async () => {
      try {
        setLoading(true)
        const data = await prayerService.getWeeklyProgress()
        setProgressData(data)
        calculateStreak(data)
        generateMotivationalMessage(data)
      } catch (error) {
        console.error('Error loading progress:', error)
        setProgressData([])
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [])

  const calculateStreak = (data: ProgressData[]) => {
    if (data.length === 0) {
      setCurrentStreak(0)
      return
    }

    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' })
      const dayData = data.find(day => day.day === dayName)
      
      if (dayData && (dayData.prayer > 0 || dayData.bible > 0)) {
        streak++
      } else {
        break
      }
    }
    
    setCurrentStreak(streak)
  }

  const generateMotivationalMessage = (data: ProgressData[]) => {
    if (data.length === 0) {
      setMotivationalMessage("Ready to start your spiritual journey? 🌱")
      return
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todayData = data.find(day => day.day === today)
    
    if (!todayData || (todayData.prayer === 0 && todayData.bible === 0)) {
      if (currentStreak > 0) {
        setMotivationalMessage(`Don't break your ${currentStreak}-day streak! 🔥`)
      } else {
        setMotivationalMessage("Today's a perfect day to connect with God! ✨")
      }
    } else {
      if (currentStreak >= 7) {
        setMotivationalMessage("You're on fire this week! 🔥 Keep it up!")
      } else if (currentStreak >= 3) {
        setMotivationalMessage(`Great momentum! ${currentStreak} days strong! 💪`)
      } else {
        setMotivationalMessage("Every day counts! You're doing great! 🌟")
      }
    }
  }

  const getTodayProgress = () => {
    if (progressData.length === 0) return { prayer: 0, bible: 0 }
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todayData = progressData.find(day => day.day === today)
    
    return {
      prayer: todayData?.prayer || 0,
      bible: todayData?.bible || 0
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-green-400 to-emerald-500'
    if (percentage >= 60) return 'from-yellow-400 to-orange-500'
    if (percentage >= 40) return 'from-blue-400 to-cyan-500'
    return 'from-gray-400 to-neutral-500'
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-neutral-900/80 backdrop-blur-sm rounded-xl p-4 border border-neutral-700 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-200">Today's Progress</h3>
          <span className="text-xs text-gray-400">🔥 {currentStreak} day streak</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">🙏 Prayer</span>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-neutral-700 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full bg-gradient-to-r ${getProgressColor(getTodayProgress().prayer)}`}
                  style={{ width: `${getTodayProgress().prayer}%` }}
                />
              </div>
              <span className="text-xs text-gray-300 w-8 text-right">{getTodayProgress().prayer}%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">📖 Bible</span>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-neutral-700 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full bg-gradient-to-r ${getProgressColor(getTodayProgress().bible)}`}
                  style={{ width: `${getTodayProgress().bible}%` }}
                />
              </div>
              <span className="text-xs text-gray-300 w-8 text-right">{getTodayProgress().bible}%</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-neutral-900/90 backdrop-blur-sm rounded-xl p-5 border border-neutral-700 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-200">Daily Progress</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Streak:</span>
            <span className="text-lg font-bold text-green-400">🔥 {currentStreak}</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-neutral-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">🙏 Prayer Time</span>
              <span className="text-sm text-gray-400">{getTodayProgress().prayer}%</span>
            </div>
            <div className="w-full bg-neutral-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(getTodayProgress().prayer)} transition-all duration-500`}
                style={{ width: `${getTodayProgress().prayer}%` }}
              />
            </div>
          </div>
          
          <div className="bg-neutral-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-300">📖 Bible Study</span>
              <span className="text-sm text-gray-400">{getTodayProgress().bible}%</span>
            </div>
            <div className="w-full bg-neutral-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(getTodayProgress().bible)} transition-all duration-500`}
                style={{ width: `${getTodayProgress().bible}%` }}
              />
            </div>
          </div>
        </div>
        
        {showActions && (
          <div className="mt-4 pt-4 border-t border-neutral-700">
            <div className="flex gap-2">
              <button className="flex-1 bg-green-500/20 text-green-400 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-all duration-200">
                🙏 Pray Now
              </button>
              <button className="flex-1 bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-all duration-200">
                📖 Read Bible
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Motivational variant (default)
  return (
    <div className={`bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-sm rounded-xl p-5 border border-green-500/30 ${className}`}>
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">🌟</div>
        <h3 className="text-lg font-bold text-gray-200 mb-2">Daily Motivation</h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          {motivationalMessage}
        </p>
      </div>
      
      <div className="bg-neutral-900/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{currentStreak}</div>
            <div className="text-xs text-gray-400">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{getTodayProgress().prayer + getTodayProgress().bible}</div>
            <div className="text-xs text-gray-400">Today's Total</div>
          </div>
        </div>
      </div>
      
      {showActions && (
        <div className="space-y-2">
          <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200">
            🙏 Start Today's Prayer
          </button>
          <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200">
            📖 Begin Bible Reading
          </button>
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t border-green-500/20 text-center">
        <p className="text-xs text-gray-400">
          💡 Remember: Consistency beats perfection every time
        </p>
      </div>
    </div>
  )
}
