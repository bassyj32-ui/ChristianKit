import React, { useState, useEffect } from 'react'
import { ProFeatureGate } from './ProFeatureGate'
import { dailyReEngagementService } from '../services/dailyReEngagementService'

interface ReEngagementMessage {
  id: string
  title: string
  message: string
  verse?: string
  verseReference?: string
  action?: {
    text: string
    type: 'prayer' | 'bible' | 'community' | 'journal'
    duration?: number
  }
  timing: 'morning' | 'afternoon' | 'evening' | 'missed'
  priority: 'low' | 'medium' | 'high'
}

interface DailyReEngagementCardProps {
  onActionClick?: (type: 'prayer' | 'bible' | 'community' | 'journal', duration?: number) => void
}

export const DailyReEngagementCard: React.FC<DailyReEngagementCardProps> = ({ onActionClick }) => {
  const [message, setMessage] = useState<ReEngagementMessage | null>(null)
  const [stats, setStats] = useState({ streakDays: 0, missedDays: 0, completedToday: {} })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDailyMessage = async () => {
      try {
        // Load user stats
        const userStats = dailyReEngagementService.getUserStats()
        setStats(userStats)

        // Generate today's message based on user state
        const today = new Date()
        const hour = today.getHours()
        
        let timing: 'morning' | 'afternoon' | 'evening' | 'missed'
        if (userStats.missedDays > 0) {
          timing = 'missed'
        } else if (hour < 12) {
          timing = 'morning'
        } else if (hour < 18) {
          timing = 'afternoon'
        } else {
          timing = 'evening'
        }

        // Create contextual message
        const contextualMessage = generateContextualMessage(timing, userStats)
        setMessage(contextualMessage)
        
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading daily message:', error)
        setIsLoading(false)
      }
    }

    loadDailyMessage()
  }, [])

  const generateContextualMessage = (timing: string, userStats: any): ReEngagementMessage => {
    const messages = {
      morning: [
        {
          id: 'morning-contextual',
          title: 'Good Morning, Beloved! ☀️',
          message: userStats.streakDays > 0 
            ? `You're on a ${userStats.streakDays}-day streak! God is delighted with your consistency.`
            : 'God has given you a fresh start today. Begin with His presence.',
          verse: 'This is the day the Lord has made; let us rejoice and be glad in it.',
          verseReference: 'Psalm 118:24',
          action: { text: 'Start with prayer', type: 'prayer' as const, duration: 5 },
          timing: 'morning' as const,
          priority: 'high' as const
        }
      ],
      afternoon: [
        {
          id: 'afternoon-contextual',
          title: 'Midday Reset 🙏',
          message: 'Take a moment to pause and remember that God is with you in every moment.',
          verse: 'Be still, and know that I am God.',
          verseReference: 'Psalm 46:10',
          action: { text: 'Take a prayer break', type: 'prayer' as const, duration: 3 },
          timing: 'afternoon' as const,
          priority: 'medium' as const
        }
      ],
      evening: [
        {
          id: 'evening-contextual',
          title: 'End with Gratitude 🌙',
          message: 'Reflect on God\'s goodness today and rest in His peace tonight.',
          verse: 'Give thanks to the Lord, for he is good; his love endures forever.',
          verseReference: 'Psalm 107:1',
          action: { text: 'Journal your gratitude', type: 'journal' as const },
          timing: 'evening' as const,
          priority: 'high' as const
        }
      ],
      missed: [
        {
          id: 'missed-contextual',
          title: 'Grace Over Guilt 💙',
          message: `You've been away for ${userStats.missedDays} days, and that's okay. God's love hasn't changed.`,
          verse: 'If we confess our sins, he is faithful and just and will forgive us.',
          verseReference: '1 John 1:9',
          action: { text: 'Begin again with prayer', type: 'prayer' as const, duration: 5 },
          timing: 'missed' as const,
          priority: 'high' as const
        }
      ]
    }

    const relevantMessages = messages[timing as keyof typeof messages] || messages.morning
    return relevantMessages[Math.floor(Math.random() * relevantMessages.length)]
  }

  const handleActionClick = async () => {
    if (message?.action) {
      // Mark activity as completed
      await dailyReEngagementService.markActivityCompleted(message.action.type)
      
      // Call parent handler
      if (onActionClick) {
        onActionClick(message.action.type, message.action.duration)
      }
    }
  }

  const getTimingEmoji = (timing: string) => {
    switch (timing) {
      case 'morning': return '🌅'
      case 'afternoon': return '☀️'
      case 'evening': return '🌙'
      case 'missed': return '💙'
      default: return '✨'
    }
  }

  const getTimingColor = (timing: string) => {
    switch (timing) {
      case 'morning': return 'from-amber-400/20 to-orange-500/30'
      case 'afternoon': return 'from-blue-400/20 to-cyan-500/30'
      case 'evening': return 'from-purple-400/20 to-indigo-500/30'
      case 'missed': return 'from-emerald-400/20 to-teal-500/30'
      default: return 'from-gray-400/20 to-slate-500/30'
    }
  }

  if (isLoading) {
    return (
      <ProFeatureGate feature="dailyReEngagement">
        <div className={`osmo-card ${message ? getTimingColor(message.timing) : 'bg-[var(--glass-light)]'} animate-pulse`}>
          <div className="h-6 bg-[var(--glass-medium)] rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-[var(--glass-medium)] rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-[var(--glass-medium)] rounded"></div>
        </div>
      </ProFeatureGate>
    )
  }

  return (
    <ProFeatureGate feature="dailyReEngagement">
      <div className={`bg-gradient-to-br ${message ? getTimingColor(message.timing) : 'from-gray-400/20 to-slate-500/30'} backdrop-blur-xl rounded-2xl p-6 text-white shadow-xl border border-gray-600/30 transition-all duration-300 hover:scale-[1.02]`}>
        
        {/* Header with timing indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{message ? getTimingEmoji(message.timing) : '✨'}</span>
            <div className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-xs font-medium text-white/90 capitalize">
                {message?.timing || 'Daily'} Encouragement
              </span>
            </div>
          </div>
          
          {/* Streak indicator */}
          {stats.streakDays > 0 && (
            <div className="bg-amber-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-amber-400/30">
              <span className="text-xs font-bold text-amber-200">
                🔥 {stats.streakDays} day streak!
              </span>
            </div>
          )}
        </div>

        {/* Main message */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-3 leading-tight">
            {message?.title || 'Daily Encouragement'}
          </h3>
          <p className="text-slate-200 leading-relaxed mb-4">
            {message?.message || 'God is with you today and always. Keep growing in faith!'}
          </p>
          
          {/* Scripture verse */}
          {message?.verse && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-4">
              <p className="text-white/90 italic leading-relaxed mb-2">
                "{message.verse}"
              </p>
              {message.verseReference && (
                <p className="text-slate-300 text-sm font-medium">
                  — {message.verseReference}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action button */}
        {message?.action && (
          <button
            onClick={handleActionClick}
            className="w-full bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm text-white py-3 px-6 rounded-xl font-semibold text-sm hover:from-white/20 hover:to-white/10 transition-all duration-300 border border-white/20 hover:border-white/30"
          >
            {message.action.text}
            {message.action.duration && (
              <span className="ml-2 text-xs opacity-75">
                ({message.action.duration} min)
              </span>
            )}
          </button>
        )}

        {/* Pro badge */}
        <div className="flex justify-center mt-4">
          <span className="bg-gradient-to-r from-amber-400/20 to-orange-500/20 backdrop-blur-sm text-amber-200 px-3 py-1 rounded-full text-xs font-medium border border-amber-400/30">
            ⭐ Pro Feature
          </span>
        </div>
      </div>
    </ProFeatureGate>
  )
}
