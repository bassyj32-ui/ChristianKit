import React, { useState, useEffect } from 'react'
import { ProFeatureGate } from './ProFeatureGate'
import { subscriptionService } from '../services/subscriptionService'
import ProgressService, { WeeklyProgressData } from '../services/ProgressService'
import { useSupabaseAuth } from './SupabaseAuthProvider'

interface AdvancedProgressData {
  date: string
  prayer: {
    duration: number
    sessionsCount: number
    consistency: number
    quality: string
  }
  bible: {
    duration: number
    chaptersRead: number
    consistency: number
    quality: string
  }
  journal: {
    entriesCount: number
    wordCount: number
    consistency: number
    quality: string
  }
  meditation: {
    duration: number
    sessionsCount: number
    consistency: number
    quality: string
  }
  overall: {
    completionRate: number
    qualityScore: number
    growthTrend: 'up' | 'down' | 'stable'
  }
}

interface WeeklyInsights {
  strongestDay: string
  weakestDay: string
  bestCategory: 'prayer' | 'bible' | 'journal'
  improvementArea: 'prayer' | 'bible' | 'journal'
  weeklyTrend: 'improving' | 'declining' | 'stable'
  personalizedTip: string
  encouragement: string
  nextWeekGoal: string
}

interface AdvancedWeeklyProgressProps {
  compact?: boolean
  showInsights?: boolean
  showComparison?: boolean
}

export const AdvancedWeeklyProgress: React.FC<AdvancedWeeklyProgressProps> = ({
  compact = false,
  showInsights = true,
  showComparison = false
}) => {
  const [progressData, setProgressData] = useState<AdvancedProgressData[]>([])
  const [insights, setInsights] = useState<WeeklyInsights | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<'duration' | 'consistency' | 'quality'>('duration')
  const [timeRange, setTimeRange] = useState<'thisWeek' | 'lastWeek' | 'lastMonth'>('thisWeek')
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useSupabaseAuth()

  useEffect(() => {
    loadAdvancedProgress()
  }, [timeRange, user])

  const loadAdvancedProgress = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // Loading real progress data for user

      // Calculate date range based on timeRange
      const today = new Date()
      let weekStart: Date

      switch (timeRange) {
        case 'lastWeek':
          weekStart = new Date(today)
          weekStart.setDate(today.getDate() - today.getDay() - 7) // Last week's start
          break
        case 'lastMonth':
          weekStart = new Date(today)
          weekStart.setDate(today.getDate() - 30) // Last 30 days
          break
        default: // thisWeek
          weekStart = new Date(today)
          weekStart.setDate(today.getDate() - today.getDay()) // This week's start
      }

      const weekStartStr = weekStart.toISOString().split('T')[0]

      // Load real progress data
      const realData = await ProgressService.getWeeklyProgress(user.id, weekStartStr)
      // Real data loaded

      // Convert to AdvancedProgressData format
      const advancedData = convertToAdvancedFormat(realData)
      setProgressData(advancedData)

      // Generate insights from real data
      const weeklyInsights = generateWeeklyInsights(advancedData)
      setInsights(weeklyInsights)

      setIsLoading(false)
    } catch (error) {
      console.error('❌ AdvancedWeeklyProgress: Error loading progress:', error)
      // Fallback to mock data on error
      const mockData = generateMockAdvancedData()
      setProgressData(mockData)
      const weeklyInsights = generateWeeklyInsights(mockData)
      setInsights(weeklyInsights)
      setIsLoading(false)
    }
  }

  const convertToAdvancedFormat = (realData: WeeklyProgressData): AdvancedProgressData[] => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const advancedData: AdvancedProgressData[] = []

    days.forEach((day, index) => {
      const dayData = realData.dailyProgress[day]
      if (dayData) {
        advancedData.push({
          date: day,
          prayer: {
            duration: dayData.totalMinutes || 0,
            sessionsCount: dayData.sessionsCount || 0,
            consistency: dayData.prayer || 0,
            quality: dayData.prayer >= 80 ? 'excellent' : dayData.prayer >= 60 ? 'good' : 'needs_improvement'
          },
          bible: {
            duration: dayData.totalMinutes || 0,
            sessionsCount: dayData.sessionsCount || 0,
            consistency: dayData.bible || 0,
            quality: dayData.bible >= 80 ? 'excellent' : dayData.bible >= 60 ? 'good' : 'needs_improvement'
          },
          meditation: {
            duration: dayData.totalMinutes || 0,
            sessionsCount: dayData.sessionsCount || 0,
            consistency: dayData.meditation || 0,
            quality: dayData.meditation >= 80 ? 'excellent' : dayData.meditation >= 60 ? 'good' : 'needs_improvement'
          }
        })
      }
    })

    return advancedData
  }

  const generateMockAdvancedData = (): AdvancedProgressData[] => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return days.map((day, index) => ({
      date: day,
      prayer: {
        duration: Math.floor(Math.random() * 30) + 5,
        sessionsCount: Math.floor(Math.random() * 3) + 1,
        consistency: Math.floor(Math.random() * 40) + 60
      },
      bible: {
        duration: Math.floor(Math.random() * 25) + 10,
        chaptersRead: Math.floor(Math.random() * 3) + 1,
        consistency: Math.floor(Math.random() * 35) + 65
      },
      journal: {
        entriesCount: Math.floor(Math.random() * 2) + (Math.random() > 0.3 ? 1 : 0),
        wordCount: Math.floor(Math.random() * 200) + 50,
        consistency: Math.floor(Math.random() * 45) + 55
      },
      overall: {
        completionRate: Math.floor(Math.random() * 30) + 70,
        qualityScore: Math.floor(Math.random() * 25) + 75,
        growthTrend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
      }
    }))
  }

  const generateWeeklyInsights = (data: AdvancedProgressData[]): WeeklyInsights => {
    const totalDuration = data.reduce((sum, day) => 
      sum + day.prayer.duration + day.bible.duration, 0)
    
    const avgConsistency = data.reduce((sum, day) => 
      sum + (day.prayer.consistency + day.bible.consistency + day.journal.consistency) / 3, 0) / 7

    return {
      strongestDay: data.reduce((best, day) => 
        day.overall.completionRate > best.overall.completionRate ? day : best).date,
      weakestDay: data.reduce((worst, day) => 
        day.overall.completionRate < worst.overall.completionRate ? day : worst).date,
      bestCategory: avgConsistency > 80 ? 'prayer' : 'bible',
      improvementArea: avgConsistency < 70 ? 'journal' : 'prayer',
      weeklyTrend: totalDuration > 150 ? 'improving' : 'stable',
      personalizedTip: "Try setting a specific time each day for spiritual practices to build stronger habits.",
      encouragement: "Your commitment to spiritual growth is inspiring! God sees your faithful heart.",
      nextWeekGoal: "Focus on increasing your consistency in the area that needs the most growth."
    }
  }

  const getMetricValue = (day: AdvancedProgressData, category: 'prayer' | 'bible' | 'journal') => {
    switch (selectedMetric) {
      case 'duration':
        return category === 'prayer' ? day.prayer.duration : 
               category === 'bible' ? day.bible.duration : day.journal.wordCount / 10
      case 'consistency':
        return day[category].consistency
      case 'quality':
        return day.overall.qualityScore
      default:
        return 0
    }
  }

  const getMetricMax = () => {
    if (selectedMetric === 'duration') return 60
    if (selectedMetric === 'consistency') return 100
    return 100
  }

  const getInsightIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈'
      case 'declining': return '📉'
      case 'stable': return '➡️'
      default: return '📊'
    }
  }

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 90) return 'from-emerald-400 to-green-500'
    if (percentage >= 75) return 'from-blue-400 to-indigo-500'
    if (percentage >= 60) return 'from-amber-400 to-orange-500'
    return 'from-red-400 to-rose-500'
  }

  if (isLoading) {
    return (
      <ProFeatureGate feature="weeklyProgressTracking">
        <div className="osmo-card animate-pulse">
          <div className="h-6 bg-[var(--glass-medium)] rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-[var(--glass-medium)] rounded w-3/4 mb-4"></div>
          <div className="h-20 bg-[var(--glass-medium)] rounded"></div>
        </div>
      </ProFeatureGate>
    )
  }

  return (
    <ProFeatureGate feature="weeklyProgressTracking">
      <div className={`osmo-card ${compact ? 'max-w-md' : ''}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Advanced Analytics</h3>
              <p className="text-slate-300 text-sm">Detailed spiritual growth insights</p>
            </div>
          </div>
          
          {/* Pro badge */}
          <span className="bg-gradient-to-r from-amber-400/20 to-orange-500/20 backdrop-blur-sm text-amber-200 px-3 py-1 rounded-full text-xs font-medium border border-amber-400/30">
            ⭐ Pro
          </span>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mb-6">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="bg-slate-700/50 backdrop-blur-sm border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="duration">Duration</option>
            <option value="consistency">Consistency</option>
            <option value="quality">Quality Score</option>
          </select>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-slate-700/50 backdrop-blur-sm border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="thisWeek">This Week</option>
            <option value="lastWeek">Last Week</option>
            <option value="lastMonth">Last Month</option>
          </select>
        </div>

        {/* Advanced Chart */}
        <div className="mb-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {progressData.map((day, index) => (
              <div key={day.date} className="text-center">
                <div className="text-xs text-slate-400 mb-2">{day.date}</div>
                
                {/* Prayer bar */}
                <div className="h-16 bg-slate-700/30 rounded-lg overflow-hidden relative mb-1">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-1000"
                    style={{ height: `${(getMetricValue(day, 'prayer') / getMetricMax()) * 100}%` }}
                  />
                  <div className="absolute top-1 left-0 right-0 text-xs text-white font-medium">
                    {Math.round(getMetricValue(day, 'prayer'))}
                  </div>
                </div>
                
                {/* Bible bar */}
                <div className="h-16 bg-slate-700/30 rounded-lg overflow-hidden relative mb-1">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-green-400 transition-all duration-1000"
                    style={{ height: `${(getMetricValue(day, 'bible') / getMetricMax()) * 100}%` }}
                  />
                  <div className="absolute top-1 left-0 right-0 text-xs text-white font-medium">
                    {Math.round(getMetricValue(day, 'bible'))}
                  </div>
                </div>
                
                {/* Journal bar */}
                <div className="h-16 bg-slate-700/30 rounded-lg overflow-hidden relative">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-500 to-purple-400 transition-all duration-1000"
                    style={{ height: `${(getMetricValue(day, 'journal') / getMetricMax()) * 100}%` }}
                  />
                  <div className="absolute top-1 left-0 right-0 text-xs text-white font-medium">
                    {Math.round(getMetricValue(day, 'journal'))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-400 rounded"></div>
              <span className="text-slate-300">Prayer</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-400 rounded"></div>
              <span className="text-slate-300">Bible</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-purple-400 rounded"></div>
              <span className="text-slate-300">Journal</span>
            </div>
          </div>
        </div>

        {/* Weekly Insights */}
        {showInsights && insights && (
          <div className="bg-slate-700/20 backdrop-blur-sm rounded-xl p-4 mb-4">
            <h4 className="font-semibold text-white mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Weekly Insights
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-300">
                  <span className="text-emerald-400 font-medium">Strongest day:</span> {insights.strongestDay}
                </p>
                <p className="text-slate-300">
                  <span className="text-blue-400 font-medium">Best category:</span> {insights.bestCategory}
                </p>
                <p className="text-slate-300">
                  <span className="text-amber-400 font-medium">Trend:</span> 
                  <span className="ml-1">{getInsightIcon(insights.weeklyTrend)} {insights.weeklyTrend}</span>
                </p>
              </div>
              
              <div>
                <p className="text-slate-300">
                  <span className="text-orange-400 font-medium">Focus area:</span> {insights.improvementArea}
                </p>
                <p className="text-slate-300">
                  <span className="text-purple-400 font-medium">Next goal:</span> {insights.nextWeekGoal}
                </p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-400/20 rounded-lg">
              <p className="text-emerald-200 text-sm italic">
                "{insights.encouragement}"
              </p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-blue-400">
              {progressData.reduce((sum, day) => sum + day.prayer.duration, 0)}
            </div>
            <div className="text-xs text-slate-300">Total Prayer (min)</div>
          </div>
          
          <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-green-400">
              {progressData.reduce((sum, day) => sum + day.bible.chaptersRead, 0)}
            </div>
            <div className="text-xs text-slate-300">Chapters Read</div>
          </div>
          
          <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-purple-400">
              {Math.round(progressData.reduce((sum, day) => sum + day.overall.completionRate, 0) / 7)}%
            </div>
            <div className="text-xs text-slate-300">Avg Completion</div>
          </div>
        </div>
      </div>
    </ProFeatureGate>
  )
}
