import React, { useState, useEffect } from 'react'
import { prayerService } from '../services/prayerService'

interface ProgressData {
  day: string
  prayer: number
  bible: number
  meditation: number
  journal: number
  totalMinutes?: number
  sessionsCount?: number
  streak?: number
  goalAchieved?: boolean
  isToday?: boolean
}

interface WeeklyProgressProps {
  showSummary?: boolean;
}

export const WeeklyProgress: React.FC<WeeklyProgressProps> = ({ showSummary = true }) => {
  const [animateProgress, setAnimateProgress] = useState(false)
  const [animateStats, setAnimateStats] = useState(false)
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadWeeklyProgress = async () => {
      try {
        setLoading(true)
        const data = await prayerService.getWeeklyProgress()
        setProgressData(data.dailyData || [])
        setAnimateProgress(true)
        setTimeout(() => setAnimateStats(true), 500)
      } catch (error) {
        console.error('Error loading weekly progress:', error)
        // Fallback to empty data
        setProgressData([])
      } finally {
        setLoading(false)
      }
    }

    loadWeeklyProgress()
  }, [])

  const calculateAverage = (data: ProgressData[], key: keyof ProgressData) => {
    const values = data.map(item => item[key] as number)
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-green-400 to-emerald-500'
    if (percentage >= 60) return 'from-yellow-400 to-orange-500'
    return 'from-red-400 to-pink-500'
  }

  const getProgressText = (percentage: number) => {
    if (percentage >= 80) return 'Excellent!'
    if (percentage >= 60) return 'Good Job!'
    return 'Keep Going!'
  }

  const getWeeklySummaryMessage = (data: ProgressData[]) => {
    if (data.length === 0) return 'Start your spiritual journey this week!'
    
    const totalPrayer = data.reduce((sum, day) => sum + day.prayer, 0)
    const totalBible = data.reduce((sum, day) => sum + day.bible, 0)
    const totalMeditation = data.reduce((sum, day) => sum + day.meditation, 0)
    const totalJournal = data.reduce((sum, day) => sum + day.journal, 0)
    
    const totalActivities = totalPrayer + totalBible + totalMeditation + totalJournal
    const averagePerDay = totalActivities / 7
    
    if (averagePerDay >= 200) return 'Outstanding week! You\'re truly dedicated to your spiritual growth. Keep shining! ✨'
    if (averagePerDay >= 150) return 'Amazing progress this week! Your consistency is inspiring. Keep up the great work! 🌟'
    if (averagePerDay >= 100) return 'Great job this week! You\'re building strong spiritual habits. Keep going! 🙏'
    if (averagePerDay >= 50) return 'Good start this week! Every step counts in your spiritual journey. Keep growing! 🌱'
    
    return 'You\'re taking the first steps on your spiritual journey. Every prayer session matters! 💪'
  }

  // Enhanced progress calculation
  const getEnhancedProgress = () => {
    if (progressData.length === 0) return null;
    
    const totalMinutes = progressData.reduce((sum, day) => sum + (day.totalMinutes || 0), 0);
    const totalSessions = progressData.reduce((sum, day) => sum + (day.sessionsCount || 0), 0);
    const currentStreak = progressData.filter(day => (day.sessionsCount || 0) > 0).length;
    const weeklyGoal = Math.min(100, Math.round((totalMinutes / 210) * 100)); // 210 min = 30 min/day * 7 days
    
    return {
      totalMinutes,
      totalSessions,
      currentStreak,
      weeklyGoal,
      averageDailyMinutes: Math.round(totalMinutes / 7)
    };
  };

  const enhancedProgress = getEnhancedProgress();

  return (
    <div className="space-y-8">
      {/* Weekly Chart */}
      <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10">
        <div className="flex items-center justify-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mr-3">
            <span className="text-lg">📊</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">Weekly Progress</h3>
        </div>
        
        <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-6">
          {loading ? (
            // Loading state
            Array.from({ length: 7 }).map((_, index) => {
              const dayPatterns = [
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop&crop=center&blur=40', // Sunday - Peaceful nature
                'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=200&h=150&fit=crop&crop=center&blur=40', // Monday - Productivity
                'https://images.unsplash.com/photo-1544373365-d0501372d1bd?w=200&h=150&fit=crop&crop=center&blur=40', // Tuesday - Growth
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=150&fit=crop&crop=center&blur=40', // Wednesday - Prayer
                'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=200&h=150&fit=crop&crop=center&blur=40', // Thursday - Planning
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=150&fit=crop&crop=center&blur=40', // Friday - Analytics
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop&crop=center&blur=40', // Saturday - Rest
              ]
              return (
                <div key={index} className="text-center p-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 relative overflow-hidden group hover:bg-white/8 transition-all duration-300">
                  <div 
                    className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                    style={{
                      backgroundImage: `url(${dayPatterns[index]})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div className="relative z-10">
                    <div className="text-xs sm:text-sm font-medium text-white/90 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}
                    </div>
                <div className="space-y-1 sm:space-y-2">
                  {['prayer', 'bible', 'meditation', 'journal'].map((activity) => (
                    <div key={activity} className="relative">
                      <div className="w-full bg-neutral-700 rounded-full h-1 sm:h-2">
                        <div className="h-1 sm:h-2 rounded-full bg-neutral-600 animate-pulse"></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">--</div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            )})
          ) : progressData.length > 0 ? (
            progressData.map((day, index) => {
              const dayPatterns = [
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop&crop=center&blur=40', // Sunday - Peaceful nature
                'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=200&h=150&fit=crop&crop=center&blur=40', // Monday - Productivity
                'https://images.unsplash.com/photo-1544373365-d0501372d1bd?w=200&h=150&fit=crop&crop=center&blur=40', // Tuesday - Growth
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=150&fit=crop&crop=center&blur=40', // Wednesday - Prayer
                'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=200&h=150&fit=crop&crop=center&blur=40', // Thursday - Planning
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=150&fit=crop&crop=center&blur=40', // Friday - Analytics
                'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=200&h=150&fit=crop&crop=center&blur=40', // Saturday - Zen
              ]
              const todayIndex = new Date().getDay()
              const isToday = index === todayIndex
              return (
                <div key={day.day} className={`text-center p-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 relative overflow-hidden group hover:bg-white/8 transition-all duration-300 ${isToday ? 'ring-2 ring-amber-400/60 shadow-lg shadow-amber-400/20' : ''}`}>
                  <div 
                    className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                    style={{
                      backgroundImage: `url(${dayPatterns[index]})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div className="relative z-10">
                    <div className={`text-xs sm:text-sm font-medium mb-2 ${isToday ? 'text-amber-300 font-bold' : 'text-white/90'}`}>
                      {day.day} {isToday ? '●' : ''}
                    </div>
                <div className="space-y-1 sm:space-y-2">
                  {['prayer', 'bible', 'meditation', 'journal'].map((activity) => {
                    const value = day[activity as keyof ProgressData] as number
                    return (
                      <div key={activity} className="relative">
                        <div className="w-full bg-black/30 backdrop-blur-sm rounded-full h-1 sm:h-2 border border-white/10">
                          <div
                            className={`h-1 sm:h-2 rounded-full bg-gradient-to-r from-white/60 to-white/80 shadow-lg transition-all duration-1000 ease-out ${
                              animateProgress ? 'w-full' : 'w-0'
                            }`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{value}%</div>
                      </div>
                    )
                  })}
                  </div>
                </div>
              </div>
            )})
          ) : (
            // No data state
            Array.from({ length: 7 }).map((_, index) => {
              const dayPatterns = [
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop&crop=center&blur=40', // Sunday - Peaceful nature
                'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=200&h=150&fit=crop&crop=center&blur=40', // Monday - Productivity
                'https://images.unsplash.com/photo-1544373365-d0501372d1bd?w=200&h=150&fit=crop&crop=center&blur=40', // Tuesday - Growth
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=150&fit=crop&crop=center&blur=40', // Wednesday - Prayer
                'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=200&h=150&fit=crop&crop=center&blur=40', // Thursday - Planning
                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=150&fit=crop&crop=center&blur=40', // Friday - Analytics
                'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=200&h=150&fit=crop&crop=center&blur=40', // Saturday - Zen
              ]
              const todayIndex = new Date().getDay()
              const isToday = index === todayIndex
              return (
                <div key={index} className={`text-center p-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 relative overflow-hidden group hover:bg-white/8 transition-all duration-300 ${isToday ? 'ring-2 ring-amber-400/60 shadow-lg shadow-amber-400/20' : ''}`}>
                  <div 
                    className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                    style={{
                      backgroundImage: `url(${dayPatterns[index]})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div className="relative z-10">
                    <div className={`text-xs sm:text-sm font-medium mb-2 ${isToday ? 'text-amber-300 font-bold' : 'text-white/90'}`}>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]} {isToday ? '●' : ''}
                    </div>
                <div className="space-y-1 sm:space-y-2">
                  {['prayer', 'bible', 'meditation', 'journal'].map((activity) => (
                    <div key={activity} className="relative">
                      <div className="w-full bg-neutral-700 rounded-full h-1 sm:h-2">
                        <div className="h-1 sm:h-2 rounded-full bg-neutral-600"></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">0%</div>
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            )})
          )}
        </div>

        {/* Activity Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg shadow-lg"></div>
            <span className="text-xs sm:text-sm text-white font-medium">🙏 Prayer</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg shadow-lg"></div>
            <span className="text-xs sm:text-sm text-white font-medium">📖 Bible</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-violet-500 rounded-lg shadow-lg"></div>
            <span className="text-xs sm:text-sm text-white font-medium">🧘 Meditation</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg"></div>
            <span className="text-xs sm:text-sm text-white font-medium">📝 Journal</span>
          </div>
        </div>
            </div>
            
      {/* Weekly Stats */}
      <div className="flex flex-row overflow-x-auto gap-4 w-full pb-2">
        <div className="flex-shrink-0 w-80 sm:w-auto sm:flex-1 bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-neutral-800 shadow-xl">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-2">
              {animateStats && progressData.length > 0 ? calculateAverage(progressData, 'prayer') : 0}%
            </div>
            <div className="text-sm text-gray-400">Prayer Average</div>
          </div>
        </div>
        
        <div className="flex-shrink-0 w-80 sm:w-auto sm:flex-1 bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-neutral-800 shadow-xl">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-400 mb-2">
              {animateStats && progressData.length > 0 ? calculateAverage(progressData, 'bible') : 0}%
            </div>
            <div className="text-sm text-gray-400">Bible Study Average</div>
          </div>
        </div>

        <div className="flex-shrink-0 w-80 sm:w-auto sm:flex-1 bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-neutral-800 shadow-xl">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">
              {animateStats && progressData.length > 0 ? calculateAverage(progressData, 'meditation') : 0}%
            </div>
            <div className="text-sm text-gray-400">Meditation Average</div>
          </div>
        </div>

        <div className="flex-shrink-0 w-80 sm:w-auto sm:flex-1 bg-neutral-900/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-neutral-800 shadow-xl">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">
              {animateStats && progressData.length > 0 ? calculateAverage(progressData, 'journal') : 0}%
            </div>
            <div className="text-sm text-gray-400">Journal Average</div>
          </div>
        </div>
      </div>

      {/* Weekly Summary - Only show if showSummary is true */}
      {showSummary && (
        <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-3xl p-6 sm:p-8 border border-neutral-800 shadow-2xl">
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-100 mb-4">Weekly Summary</h3>
            {loading ? (
              <p className="text-gray-300 mb-6">Loading your progress...</p>
            ) : progressData.length > 0 ? (
              <p className="text-gray-300 mb-6">
                {getWeeklySummaryMessage(progressData)}
              </p>
            ) : (
              <p className="text-gray-300 mb-6">Start your spiritual journey this week! Every prayer session counts.</p>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button className="bg-neutral-800 text-gray-100 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:bg-neutral-700 transition-all duration-200 transform hover:scale-105">
                View Details
              </button>
              <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105">
                Set Goals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
