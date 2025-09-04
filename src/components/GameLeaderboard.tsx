import React, { useState, useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { MobileOptimizedCard } from './MobileOptimizedCard'
import { MobileOptimizedButton } from './MobileOptimizedButton'

interface LeaderboardEntry {
  id: string
  playerName: string
  score: number
  level: number
  distance: number
  crosses: number
  streak: number
  date: string
  avatar?: string
}

export const GameLeaderboard: React.FC = () => {
  const { gameScores, user } = useAppStore()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'all'>('daily')
  const [sortBy, setSortBy] = useState<'score' | 'distance' | 'streak'>('score')
  const [loading, setLoading] = useState(false)

  // Mock leaderboard data (in real app, this would come from API)
  const mockLeaderboard: LeaderboardEntry[] = [
    {
      id: '1',
      playerName: 'Faithful Runner',
      score: 15420,
      level: 12,
      distance: 2450,
      crosses: 89,
      streak: 15,
      date: new Date().toISOString(),
      avatar: '🏃‍♂️'
    },
    {
      id: '2',
      playerName: 'Divine Jumper',
      score: 12850,
      level: 10,
      distance: 2100,
      crosses: 72,
      streak: 12,
      date: new Date(Date.now() - 86400000).toISOString(),
      avatar: '⛹️‍♀️'
    },
    {
      id: '3',
      playerName: 'Holy Sprinter',
      score: 11200,
      level: 9,
      distance: 1850,
      crosses: 65,
      streak: 10,
      date: new Date(Date.now() - 172800000).toISOString(),
      avatar: '🏃‍♀️'
    },
    {
      id: '4',
      playerName: 'Blessed Runner',
      score: 9800,
      level: 8,
      distance: 1650,
      crosses: 58,
      streak: 8,
      date: new Date(Date.now() - 259200000).toISOString(),
      avatar: '🏃‍♂️'
    },
    {
      id: '5',
      playerName: 'Sacred Jumper',
      score: 8750,
      level: 7,
      distance: 1450,
      crosses: 52,
      streak: 7,
      date: new Date(Date.now() - 345600000).toISOString(),
      avatar: '⛹️‍♂️'
    }
  ]

  useEffect(() => {
    loadLeaderboard()
  }, [timeFilter, sortBy])

  const loadLeaderboard = async () => {
    setLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Filter by time
    let filtered = [...mockLeaderboard]
    const now = new Date()
    
    if (timeFilter === 'daily') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      filtered = filtered.filter(entry => new Date(entry.date) >= today)
    } else if (timeFilter === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(entry => new Date(entry.date) >= weekAgo)
    }
    
    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score
        case 'distance':
          return b.distance - a.distance
        case 'streak':
          return b.streak - a.streak
        default:
          return b.score - a.score
      }
    })
    
    setLeaderboard(filtered)
    setLoading(false)
  }

  const getUserBestScore = () => {
    if (gameScores.length === 0) return null
    return gameScores.reduce((best, score) => score.score > best.score ? score : best)
  }

  const getUserRank = () => {
    const userBest = getUserBestScore()
    if (!userBest) return null
    
    return leaderboard.findIndex(entry => entry.score > userBest.score) + 1
  }

  const formatScore = (score: number) => {
    return score.toLocaleString()
  }

  const formatDistance = (distance: number) => {
    return `${distance}m`
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇'
      case 1: return '🥈'
      case 2: return '🥉'
      default: return `#${index + 1}`
    }
  }

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'from-yellow-400 to-amber-500'
      case 1: return 'from-gray-300 to-gray-400'
      case 2: return 'from-amber-600 to-orange-500'
      default: return 'from-slate-600 to-slate-700'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
          🏆 Faith Runner Leaderboard
        </h2>
        <p className="text-slate-300">Compete with fellow believers in your spiritual journey</p>
      </div>

      {/* Filters */}
      <MobileOptimizedCard variant="secondary" size="md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Time Period
            </label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'all'] as const).map((period) => (
                <MobileOptimizedButton
                  key={period}
                  onClick={() => setTimeFilter(period)}
                  variant={timeFilter === period ? 'primary' : 'ghost'}
                  size="sm"
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </MobileOptimizedButton>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Sort By
            </label>
            <div className="flex gap-2">
              {(['score', 'distance', 'streak'] as const).map((criteria) => (
                <MobileOptimizedButton
                  key={criteria}
                  onClick={() => setSortBy(criteria)}
                  variant={sortBy === criteria ? 'primary' : 'ghost'}
                  size="sm"
                >
                  {criteria.charAt(0).toUpperCase() + criteria.slice(1)}
                </MobileOptimizedButton>
              ))}
            </div>
          </div>
        </div>
      </MobileOptimizedCard>

      {/* User's Best Score */}
      {getUserBestScore() && (
        <MobileOptimizedCard variant="accent" size="md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Your Best Score</h3>
              <p className="text-slate-300">
                {formatScore(getUserBestScore()!.score)} points • Level {getUserBestScore()!.level}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-yellow-400">
                #{getUserRank() || 'Unranked'}
              </div>
              <div className="text-sm text-slate-400">Your Rank</div>
            </div>
          </div>
        </MobileOptimizedCard>
      )}

      {/* Leaderboard */}
      <MobileOptimizedCard variant="primary" size="lg">
        <h3 className="text-xl font-bold text-white mb-4">🏆 Top Players</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300">Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏃‍♂️</div>
            <p className="text-slate-300">No scores yet for this time period</p>
            <p className="text-slate-400 text-sm">Be the first to play and set a record!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r ${getRankColor(index)}/10 border border-current/20`}
              >
                {/* Rank */}
                <div className="text-2xl font-bold text-yellow-400">
                  {getRankIcon(index)}
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-black text-xl">
                  {entry.avatar || '👤'}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">
                    {entry.playerName}
                  </div>
                  <div className="text-sm text-slate-400">
                    Level {entry.level} • {formatDistance(entry.distance)}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="font-bold text-white">
                    {formatScore(entry.score)}
                  </div>
                  <div className="text-sm text-slate-400">
                    {entry.crosses} crosses • {entry.streak} streak
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </MobileOptimizedCard>

      {/* Play Now Button */}
      <div className="text-center">
        <MobileOptimizedButton
          onClick={() => {
            // Navigate to Faith Runner game
            window.location.hash = '#runner'
          }}
          variant="primary"
          size="lg"
          icon="🎮"
        >
          Play Faith Runner Now
        </MobileOptimizedButton>
      </div>
    </div>
  )
}
