import React, { useState, useEffect } from 'react'
import { prayerService } from '../services/prayerService'

interface ProgressData {
  day: string
  prayer: number
  bible: number
  meditation: number
  journal: number
}

interface WeeklyProgressBotProps {
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left'
  showProgress?: boolean
}

export const WeeklyProgressBot: React.FC<WeeklyProgressBotProps> = ({ 
  position = 'bottom-right',
  showProgress = true 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [loading, setLoading] = useState(true)
  const [lastInteraction, setLastInteraction] = useState<Date | null>(null)

  useEffect(() => {
    const loadWeeklyProgress = async () => {
      try {
        setLoading(true)
        const data = await prayerService.getWeeklyProgress()
        setProgressData(data)
        generateMotivationalMessage(data)
      } catch (error) {
        console.error('Error loading weekly progress:', error)
        setProgressData([])
      } finally {
        setLoading(false)
      }
    }

    // Load user preferences
    const savedCollapsedState = localStorage.getItem('progressBotCollapsed')
    if (savedCollapsedState === 'true') {
      setIsCollapsed(true)
    }

    loadWeeklyProgress()
    
    // Check if we should show a reminder (every 4 hours)
    const checkReminder = () => {
      const now = new Date()
      const last = lastInteraction ? new Date(lastInteraction) : null
      const hoursSinceLastInteraction = last ? (now.getTime() - last.getTime()) / (1000 * 60 * 60) : 24
      
      if (hoursSinceLastInteraction >= 4 && !isCollapsed) {
        setIsMinimized(false)
        generateMotivationalMessage(progressData)
      }
    }

    const reminderInterval = setInterval(checkReminder, 1000 * 60 * 60) // Check every hour
    return () => clearInterval(reminderInterval)
  }, [progressData, lastInteraction, isCollapsed])

  // Check if user has completed their daily progress
  const hasCompletedDailyProgress = () => {
    if (progressData.length === 0) return false
    
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todayData = progressData.find(day => day.day === today)
    
    if (!todayData) return false
    
    // Check if user has completed their planned activities for today
    const userPlan = localStorage.getItem('userPlan')
    if (userPlan) {
      const plan = JSON.parse(userPlan)
      const plannedPrayerTime = plan.prayerTime || 10
      const plannedBibleTime = plan.bibleTime || 20
      
      // Convert planned minutes to percentage (assuming 100% = planned time)
      const prayerProgress = Math.min(100, (todayData.prayer / plannedPrayerTime) * 100)
      const bibleProgress = Math.min(100, (todayData.bible / plannedBibleTime) * 100)
      
      // Consider complete if both prayer and bible are at least 80% of planned
      return prayerProgress >= 80 && bibleProgress >= 80
    }
    
    // If no plan, consider complete if they've done some activity
    return todayData.prayer > 0 || todayData.bible > 0
  }

  // Auto-hide if user has completed their daily progress (unless manually hidden)
  useEffect(() => {
    if (!isCollapsed && hasCompletedDailyProgress()) {
      // Auto-minimize after 30 seconds if they've completed their progress
      const autoHideTimer = setTimeout(() => {
        if (!isCollapsed && hasCompletedDailyProgress()) {
          setIsMinimized(true)
        }
      }, 30000) // 30 seconds
      
      return () => clearTimeout(autoHideTimer)
    } else if (!isCollapsed && !hasCompletedDailyProgress()) {
      // If user hasn't completed progress, keep bot visible and encouraging
      // Only auto-minimize after 2 minutes of inactivity
      const autoHideTimer = setTimeout(() => {
        if (!isCollapsed && !hasCompletedDailyProgress() && !isMinimized) {
          // Don't auto-hide, but maybe minimize to save space
          setIsMinimized(true)
        }
      }, 120000) // 2 minutes
      
      return () => clearTimeout(autoHideTimer)
    }
  }, [progressData, isCollapsed])

  const generateMotivationalMessage = (data: ProgressData[]) => {
    if (data.length === 0) {
      setCurrentMessage("Hey there! 👋 Ready to start your spiritual journey? Let's begin with a simple prayer today! 🙏")
      return
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const todayData = data.find(day => day.day === today) || data[data.length - 1]
    
    if (!todayData) {
      setCurrentMessage("Good day! 🌅 How about we spend some time with God today? Even 5 minutes of prayer can make a difference! ✨")
      return
    }

    const totalPrayer = data.reduce((sum, day) => sum + day.prayer, 0)
    const totalBible = data.reduce((sum, day) => sum + day.bible, 0)
    const weeklyTotal = totalPrayer + totalBible
    
    // Check if user has completed their daily progress
    const hasCompleted = hasCompletedDailyProgress()
    
    if (hasCompleted) {
      // User has completed their daily progress - celebrate!
      if (weeklyTotal >= 200) {
        setCurrentMessage("🎉 Amazing! You've completed today's spiritual goals! You're absolutely crushing it this week! Keep inspiring others! ✨")
      } else if (weeklyTotal >= 100) {
        setCurrentMessage("🌟 Fantastic! You've completed today's spiritual goals! Your consistency is inspiring. Keep up the great work! 🙏")
      } else {
        setCurrentMessage("✨ Great job! You've completed today's spiritual goals! Every day you're building stronger spiritual habits! 💪")
      }
    } else {
      // User hasn't completed their daily progress - encourage them
      const userPlan = localStorage.getItem('userPlan')
      if (userPlan) {
        const plan = JSON.parse(userPlan)
        const plannedPrayerTime = plan.prayerTime || 10
        const plannedBibleTime = plan.bibleTime || 20
        
        const todayPrayer = todayData.prayer || 0
        const todayBible = todayData.bible || 0
        
        if (todayPrayer === 0 && todayBible === 0) {
          setCurrentMessage(`🌅 Good morning! Ready to tackle today's spiritual goals? You planned ${plannedPrayerTime} min prayer + ${plannedBibleTime} min Bible study. Let's start! 💪`)
        } else if (todayPrayer < plannedPrayerTime * 0.8) {
          setCurrentMessage(`🙏 Great start with Bible study! Now let's complete your ${plannedPrayerTime} min prayer goal. You're ${Math.round((todayPrayer / plannedPrayerTime) * 100)}% there! 🎯`)
        } else if (todayBible < plannedBibleTime * 0.8) {
          setCurrentMessage(`📖 Awesome prayer time! Now let's finish your ${plannedBibleTime} min Bible study goal. You're ${Math.round((todayBible / plannedBibleTime) * 100)}% there! 🎯`)
        } else {
          setCurrentMessage(`🔥 You're so close to completing today's goals! Just a little more effort and you'll have an amazing spiritual day! 💪`)
        }
      } else {
        // No plan - general encouragement
        if (weeklyTotal === 0) {
          setCurrentMessage("Hey friend! 🌱 I noticed you haven't started yet this week. How about we begin with a simple 5-minute prayer? Every journey starts with one step! 💪")
        } else if (weeklyTotal < 50) {
          setCurrentMessage("Great start this week! 🌟 You're building momentum. How about adding a quick Bible reading today? Even 10 minutes can refresh your soul! 📖")
        } else if (weeklyTotal < 100) {
          setCurrentMessage("You're doing amazing! 🎉 Your consistency is inspiring. Ready for today's spiritual nourishment? Let's keep this beautiful rhythm going! ✨")
        } else if (weeklyTotal < 200) {
          setCurrentMessage("Wow! You're on fire this week! 🔥 Your dedication is incredible. You're building such strong spiritual habits. Keep shining! 🌟")
        } else {
          setCurrentMessage("Incredible! You're absolutely crushing it this week! 🚀 You're a spiritual powerhouse! Your consistency is legendary. Keep inspiring others! ✨")
        }
      }
    }
  }

  const getProgressEmoji = (percentage: number) => {
    if (percentage >= 80) return '🎯'
    if (percentage >= 60) return '👍'
    if (percentage >= 40) return '💪'
    if (percentage >= 20) return '🌱'
    return '🌱'
  }

  const getDailyProgressPercentage = () => {
    if (progressData.length === 0) return 0;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayData = progressData.find(day => day.day === today);

    if (!todayData) return 0;

    const userPlan = localStorage.getItem('userPlan');
    if (!userPlan) return 0;

    const plan = JSON.parse(userPlan);
    const plannedPrayerTime = plan.prayerTime || 10;
    const plannedBibleTime = plan.bibleTime || 20;

    const todayPrayer = todayData.prayer || 0;
    const todayBible = todayData.bible || 0;

    const totalPlanned = plannedPrayerTime + plannedBibleTime;
    const totalCompleted = todayPrayer + todayBible;

    if (totalPlanned === 0) return 0;
    return Math.min(100, (totalCompleted / totalPlanned) * 100);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4'
      case 'bottom-right':
        return 'bottom-4 right-4'
      case 'bottom-left':
        return 'bottom-4 left-4'
      case 'top-left':
        return 'top-4 left-4'
      default:
        return 'bottom-4 right-4'
    }
  }

  const handleInteraction = () => {
    setLastInteraction(new Date())
    setIsMinimized(false)
  }

  const handleCollapse = () => {
    setIsCollapsed(true)
    localStorage.setItem('progressBotCollapsed', 'true')
  }

  const handleRestore = () => {
    setIsCollapsed(false)
    localStorage.setItem('progressBotCollapsed', 'false')
  }

  const handleQuickAction = (action: string) => {
    handleInteraction()
    // You can add navigation logic here
    console.log(`Quick action: ${action}`)
  }

  if (isMinimized) {
    return (
      <div className={`fixed ${getPositionClasses()} z-50`}>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setIsMinimized(false)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 animate-bounce"
            title="Check your progress!"
          >
            📊
          </button>
          <button
            onClick={handleCollapse}
            className="bg-neutral-700 text-gray-300 p-2 rounded-full shadow-xl hover:bg-neutral-600 transition-all duration-300"
            title="Collapse bot"
          >
            🚫
          </button>
        </div>
      </div>
    )
  }

  // If collapsed, don't show anything
  if (isCollapsed) {
    return (
      <div className={`fixed ${getPositionClasses()} z-50`}>
        <button
          onClick={handleRestore}
          className="bg-neutral-600 text-gray-300 p-3 rounded-full shadow-xl hover:bg-neutral-500 transition-all duration-300"
          title="Restore Progress Buddy"
        >
          🔄
        </button>
      </div>
    )
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-50`}>
      <div className="bg-neutral-900/95 backdrop-blur-xl border border-neutral-700 rounded-2xl shadow-2xl max-w-sm w-80">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-t-2xl p-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="text-white font-bold">Progress Buddy</h3>
                <p className="text-white/80 text-sm">Your spiritual companion</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-white/80 hover:text-white transition-colors"
                title="Minimize"
              >
                ➖
              </button>
              <button
                onClick={handleCollapse}
                className="text-white/80 hover:text-white transition-colors"
                title="Collapse bot"
              >
                🚫
              </button>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-white/80 hover:text-white transition-colors"
                title={isOpen ? "Close" : "Open"}
              >
                {isOpen ? "✕" : "📊"}
              </button>
            </div>
          </div>
          
          {/* Daily Progress Bar */}
          {!hasCompletedDailyProgress() && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-white/90 text-xs mb-1">
                <span>Today's Progress</span>
                <span>{Math.round(getDailyProgressPercentage())}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getDailyProgressPercentage()}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="p-4 border-b border-neutral-700">
          <p className="text-gray-200 text-sm leading-relaxed">
            {currentMessage}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-neutral-700">
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickAction('prayer')}
              className="flex-1 bg-green-500/20 text-green-400 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-all duration-200"
            >
              🙏 Pray Now
            </button>
            <button
              onClick={() => handleQuickAction('bible')}
              className="flex-1 bg-blue-500/20 text-blue-400 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-all duration-200"
            >
              📖 Read Bible
            </button>
          </div>
        </div>

        {/* Progress Summary (Collapsible) */}
        {isOpen && showProgress && (
          <div className="p-4">
            <h4 className="text-gray-200 font-semibold mb-3 text-center">This Week's Progress</h4>
            
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                <p className="text-gray-400 text-sm mt-2">Loading...</p>
              </div>
            ) : progressData.length > 0 ? (
              <div className="space-y-3">
                {['prayer', 'bible'].map((activity) => {
                  const total = progressData.reduce((sum, day) => sum + (day[activity as keyof ProgressData] as number), 0)
                  const average = Math.round(total / 7)
                  const emoji = activity === 'prayer' ? '🙏' : '📖'
                  const label = activity === 'prayer' ? 'Prayer' : 'Bible Study'
                  
                  return (
                    <div key={activity} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{emoji}</span>
                        <span className="text-gray-300 text-sm">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs">{average}% avg</span>
                        <span className="text-lg">{getProgressEmoji(average)}</span>
                      </div>
                    </div>
                  )
                })}
                
                <div className="pt-2 border-t border-neutral-700">
                  <div className="text-center">
                    <p className="text-gray-400 text-xs mb-2">Weekly Goal Progress</p>
                    <div className="w-full bg-neutral-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${Math.min(100, (progressData.reduce((sum, day) => sum + day.prayer + day.bible, 0) / 7) * 2)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">No progress data yet</p>
                <p className="text-gray-500 text-xs mt-1">Start your journey today!</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-neutral-800/50 rounded-b-2xl">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>💡 Tip: Small steps lead to big changes</span>
            <button
              onClick={handleInteraction}
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              Got it!
            </button>
          </div>
          <div className="text-xs text-gray-500 text-center">
            <span className="block mb-1">Controls:</span>
            <span className="text-gray-400">➖ Minimize | 🚫 Collapse | 📊 Expand</span>
          </div>
        </div>
      </div>
    </div>
  )
}
