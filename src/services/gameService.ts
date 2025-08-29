import { supabase } from '../utils/supabase'

export interface GameScore {
  id?: string
  user_id: string
  game_type: 'faith-runner'
  score: number
  distance: number
  blessings: number
  level: number
  duration: number
  created_at?: string
}

export interface GameStats {
  totalGames: number
  totalScore: number
  bestScore: number
  totalDistance: number
  totalBlessings: number
  averageScore: number
  bestLevel: number
}

export interface DailyChallenge {
  id: string
  type: 'distance' | 'score' | 'blessings' | 'level'
  target: number
  reward: string
  completed: boolean
  progress: number
}

// Save game score to Supabase
export const saveGameScore = async (scoreData: Omit<GameScore, 'id' | 'created_at'>): Promise<GameScore | null> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('game_scores')
      .insert(scoreData)
      .select()
      .single()

    if (error) {
      console.error('Error saving game score:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in saveGameScore:', error)
    return null
  }
}

// Get user's game statistics
export const getUserGameStats = async (userId: string): Promise<GameStats | null> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('game_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('game_type', 'faith-runner')
      .order('score', { ascending: false })

    if (error) {
      console.error('Error fetching game stats:', error)
      return null
    }

    if (!data || data.length === 0) {
      return {
        totalGames: 0,
        totalScore: 0,
        bestScore: 0,
        totalDistance: 0,
        totalBlessings: 0,
        averageScore: 0,
        bestLevel: 0
      }
    }

    const totalGames = data.length
    const totalScore = data.reduce((sum, game) => sum + game.score, 0)
    const bestScore = Math.max(...data.map(game => game.score))
    const totalDistance = data.reduce((sum, game) => sum + game.distance, 0)
    const totalBlessings = data.reduce((sum, game) => sum + game.blessings, 0)
    const averageScore = Math.round(totalScore / totalGames)
    const bestLevel = Math.max(...data.map(game => game.level))

    return {
      totalGames,
      totalScore,
      bestScore,
      totalDistance,
      totalBlessings,
      averageScore,
      bestLevel
    }
  } catch (error) {
    console.error('Error in getUserGameStats:', error)
    return null
  }
}

// Get leaderboard for Faith Runner
export const getLeaderboard = async (limit: number = 10): Promise<GameScore[] | null> => {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized')
      return null
    }

    const { data, error } = await supabase
      .from('game_scores')
      .select(`
        *,
        user_profiles!inner(display_name, avatar_url, handle)
      `)
      .eq('game_type', 'faith-runner')
      .order('score', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return null
    }

    return data || []
  } catch (error) {
    console.error('Error in getLeaderboard:', error)
    return null
  }
}

// Get daily challenges
export const getDailyChallenges = (): DailyChallenge[] => {
  const today = new Date().toDateString()
  const seed = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  
  // Generate consistent daily challenges based on date
  const challenges: DailyChallenge[] = [
    {
      id: '1',
      type: 'distance',
      target: 1000 + (seed % 1000),
      reward: '🏆 Distance Master',
      completed: false,
      progress: 0
    },
    {
      id: '2',
      type: 'score',
      target: 5000 + (seed % 5000),
      reward: '⭐ Score Champion',
      completed: false,
      progress: 0
    },
    {
      id: '3',
      type: 'blessings',
      target: 20 + (seed % 30),
      reward: '🙏 Blessing Collector',
      completed: false,
      progress: 0
    },
    {
      id: '4',
      type: 'level',
      target: 3 + (seed % 5),
      reward: '🚀 Level Achiever',
      completed: false,
      progress: 0
    }
  ]

  return challenges
}

// Check if daily challenges are completed
export const checkDailyChallenges = (
  challenges: DailyChallenge[],
  gameStats: { distance: number; score: number; blessings: number; level: number }
): DailyChallenge[] => {
  return challenges.map(challenge => {
    let progress = 0
    let completed = false

    switch (challenge.type) {
      case 'distance':
        progress = Math.min(gameStats.distance, challenge.target)
        completed = gameStats.distance >= challenge.target
        break
      case 'score':
        progress = Math.min(gameStats.score, challenge.target)
        completed = gameStats.score >= challenge.target
        break
      case 'blessings':
        progress = Math.min(gameStats.blessings, challenge.target)
        completed = gameStats.blessings >= challenge.target
        break
      case 'level':
        progress = Math.min(gameStats.level, challenge.target)
        completed = gameStats.level >= challenge.target
        break
    }

    return {
      ...challenge,
      progress,
      completed
    }
  })
}

// Calculate experience points and level
export const calculateExperience = (score: number, distance: number, blessings: number): { xp: number; level: number } => {
  const xp = Math.floor(score * 0.1) + Math.floor(distance * 0.05) + (blessings * 10)
  const level = Math.floor(xp / 100) + 1
  
  return { xp, level }
}

// Get motivational messages based on performance
export const getMotivationalMessage = (score: number, previousBest: number): string => {
  if (score > previousBest) {
    return "🎉 New personal best! You're growing stronger in faith!"
  } else if (score > previousBest * 0.8) {
    return "💪 Great effort! You're almost at your best!"
  } else if (score > previousBest * 0.5) {
    return "🙏 Good run! Every step in faith counts!"
  } else {
    return "🌟 Keep running! Your spiritual journey continues!"
  }
}

