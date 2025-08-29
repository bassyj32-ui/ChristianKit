import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSupabaseAuth } from './SupabaseAuthProvider'
import { saveGameScore, getUserGameStats, getDailyChallenges, checkDailyChallenges, getMotivationalMessage } from '../services/gameService'

interface GameState {
  isPlaying: boolean
  isPaused: boolean
  isGameOver: boolean
  score: number
  distance: number
  speed: number
  level: number
  lives: number
  blessings: number
  powerUps: string[]
}

interface GameObject {
  x: number
  y: number
  width: number
  height: number
  type: 'blessing' | 'obstacle' | 'powerup'
  id: string
}

export const FaithRunner: React.FC = () => {
  const { user } = useSupabaseAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    distance: 0,
    speed: 5,
    level: 1,
    lives: 3,
    blessings: 0,
    powerUps: []
  })

  const [player, setPlayer] = useState({ x: 100, y: 300, width: 40, height: 60, isJumping: false, velocity: 0 })
  const [gameObjects, setGameObjects] = useState<GameObject[]>([])
  const [highScore, setHighScore] = useState(0)
  const [showTutorial, setShowTutorial] = useState(true)
  const [showStats, setShowStats] = useState(false)
  const [gameStats, setGameStats] = useState<any>(null)
  const [dailyChallenges, setDailyChallenges] = useState<any[]>([])
  const [gameStartTime, setGameStartTime] = useState<number>(0)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 400 })
  const [isMobile, setIsMobile] = useState(false)

  // Game constants - now responsive
  const GRAVITY = 0.8
  const JUMP_FORCE = -15
  const GROUND_Y = 300
  const BASE_CANVAS_WIDTH = 800
  const BASE_CANVAS_HEIGHT = 400

  // Responsive canvas sizing
  const updateCanvasSize = useCallback(() => {
    if (containerRef.current) {
      const container = containerRef.current
      const containerWidth = container.clientWidth
      const containerHeight = Math.min(container.clientHeight * 0.6, 500)
      
      // Calculate responsive dimensions
      const aspectRatio = BASE_CANVAS_WIDTH / BASE_CANVAS_HEIGHT
      let newWidth = containerWidth - 32 // Account for padding
      let newHeight = newWidth / aspectRatio
      
      // Ensure minimum and maximum sizes
      newWidth = Math.max(300, Math.min(newWidth, 800))
      newHeight = Math.max(200, Math.min(newHeight, 500))
      
      setCanvasSize({ width: newWidth, height: newHeight })
      setIsMobile(containerWidth < 768)
      
      // Update canvas element
      if (canvasRef.current) {
        canvasRef.current.width = newWidth
        canvasRef.current.height = newHeight
      }
    }
  }, [])

  // Handle window resize
  useEffect(() => {
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [updateCanvasSize])

  // Touch controls for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (gameState.isPlaying && !gameState.isPaused && !player.isJumping) {
      setPlayer(prev => ({ ...prev, isJumping: true, velocity: JUMP_FORCE }))
    }
  }, [gameState.isPlaying, gameState.isPaused, player.isJumping])

  // Keyboard controls for desktop
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && gameState.isPlaying && !gameState.isPaused && !player.isJumping) {
      e.preventDefault()
      setPlayer(prev => ({ ...prev, isJumping: true, velocity: JUMP_FORCE }))
    }
  }, [gameState.isPlaying, gameState.isPaused, player.isJumping])

  // Initialize game
  const initGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      score: 0,
      distance: 0,
      speed: 5,
      level: 1,
      lives: 3,
      blessings: 0,
      powerUps: []
    }))
    
    // Adjust player starting position based on canvas size
    const startX = Math.max(50, canvasSize.width * 0.15)
    const startY = Math.min(canvasSize.height * 0.75, GROUND_Y)
    
    setPlayer({ 
      x: startX, 
      y: startY, 
      width: Math.max(30, canvasSize.width * 0.05), 
      height: Math.max(45, canvasSize.height * 0.15), 
      isJumping: false, 
      velocity: 0 
    })
    setGameObjects([])
    setShowTutorial(false)
    setGameStartTime(Date.now())
  }, [canvasSize])

  // Load game stats and daily challenges
  useEffect(() => {
    if (user) {
      const loadGameData = async () => {
        try {
          const stats = await getUserGameStats(user.id)
          setGameStats(stats)
          if (stats?.bestScore) {
            setHighScore(stats.bestScore)
          }
        } catch (error) {
          console.error('Error loading game stats:', error)
        }
      }
      
      loadGameData()
    }
  }, [user])

  // Load daily challenges
  useEffect(() => {
    if (user) {
      const loadChallenges = async () => {
        try {
          const challenges = await getDailyChallenges()
          setDailyChallenges(challenges || [])
        } catch (error) {
          console.error('Error loading daily challenges:', error)
        }
      }
      
      loadChallenges()
    }
  }, [user])

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    if (!gameState.isPlaying || gameState.isPaused) return

    const deltaTime = currentTime - lastTimeRef.current
    lastTimeRef.current = currentTime

    // Update player physics
    setPlayer(prev => {
      if (prev.isJumping) {
        const newY = prev.y + prev.velocity
        const newVelocity = prev.velocity + GRAVITY
        
        if (newY >= Math.min(canvasSize.height * 0.75, GROUND_Y)) {
          return { ...prev, y: Math.min(canvasSize.height * 0.75, GROUND_Y), isJumping: false, velocity: 0 }
        }
        
        return { ...prev, y: newY, velocity: newVelocity }
      }
      return prev
    })

    // Update game objects
    setGameObjects(prev => {
      const speed = gameState.speed * (deltaTime / 16) // Normalize to 60fps
      return prev
        .map(obj => ({ ...obj, x: obj.x - speed }))
        .filter(obj => obj.x > -50)
    })

    // Spawn new objects
    if (Math.random() < 0.02) {
      const newObject: GameObject = {
        x: canvasSize.width + 50,
        y: Math.random() * (canvasSize.height * 0.6) + 50,
        width: Math.max(20, canvasSize.width * 0.03),
        height: Math.max(20, canvasSize.height * 0.05),
        type: Math.random() < 0.7 ? 'blessing' : 'obstacle',
        id: Date.now().toString()
      }
      setGameObjects(prev => [...prev, newObject])
    }

    // Update game state
    setGameState(prev => ({
      ...prev,
      distance: prev.distance + gameState.speed * 0.1,
      score: prev.score + 1,
      level: Math.floor(prev.distance / 100) + 1,
      speed: Math.min(prev.speed + 0.001, 15)
    }))

    gameLoopRef.current = requestAnimationFrame(gameLoop)
  }, [gameState.isPlaying, gameState.isPaused, gameState.speed, canvasSize])

  // Collision detection
  useEffect(() => {
    if (!gameState.isPlaying) return

    gameObjects.forEach(obj => {
      if (player.x < obj.x + obj.width && player.x + player.width > obj.x &&
          player.y < obj.y + obj.height && player.y + player.height > obj.y) {
        
        if (obj.type === 'blessing') {
          setGameState(prev => ({ ...prev, blessings: prev.blessings + 1, score: prev.score + 50 }))
          setGameObjects(prev => prev.filter(o => o.id !== obj.id))
        } else if (obj.type === 'obstacle') {
          setGameState(prev => ({ ...prev, lives: prev.lives - 1 }))
          setGameObjects(prev => prev.filter(o => o.id !== obj.id))
          
          if (gameState.lives <= 1) {
            gameOver()
          }
        }
      }
    })
  }, [player, gameObjects, gameState.lives, gameState.isPlaying])

  // Game over
  const gameOver = useCallback(async () => {
    setGameState(prev => ({ ...prev, isPlaying: false, isGameOver: true }))
    
    if (user) {
      try {
        await saveGameScore({
          user_id: user.id,
          game_type: 'faith-runner',
          score: gameState.score,
          distance: Math.floor(gameState.distance),
          blessings: gameState.blessings,
          level: gameState.level,
          duration: Math.floor((Date.now() - gameStartTime) / 1000)
        })
        
        // Check daily challenges
        const updatedChallenges = checkDailyChallenges(dailyChallenges, {
          distance: Math.floor(gameState.distance),
          score: gameState.score,
          blessings: gameState.blessings,
          level: gameState.level
        })
        setDailyChallenges(updatedChallenges)
      } catch (error) {
        console.error('Error saving game score:', error)
      }
    }
  }, [gameState, user])

  // Toggle pause
  const togglePause = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }, [])

  // Start game loop
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused) {
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState.isPlaying, gameState.isPaused, gameLoop])

  // Keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Render game on canvas
  useEffect(() => {
    if (!canvasRef.current || !gameState.isPlaying) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#1e3a8a')
    gradient.addColorStop(1, '#3b82f6')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw ground
    ctx.fillStyle = '#059669'
    ctx.fillRect(0, Math.min(canvas.height * 0.75, GROUND_Y), canvas.width, canvas.height)

    // Draw player
    ctx.fillStyle = '#fbbf24'
    ctx.fillRect(player.x, player.y, player.width, player.height)

    // Draw game objects
    gameObjects.forEach(obj => {
      if (obj.type === 'blessing') {
        ctx.fillStyle = '#fbbf24'
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
      } else {
        ctx.fillStyle = '#dc2626'
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
      }
    })
  }, [player, gameObjects, gameState.isPlaying, canvasSize])

  if (gameState.isGameOver) {
    const updatedChallenges = dailyChallenges.map(challenge => {
      let progress = 0
      let completed = false
      
      if (challenge.type === 'distance') {
        progress = Math.min(gameState.distance, challenge.target)
        completed = gameState.distance >= challenge.target
      } else if (challenge.type === 'score') {
        progress = Math.min(gameState.score, challenge.target)
        completed = gameState.score >= challenge.target
      } else if (challenge.type === 'blessings') {
        progress = Math.min(gameState.blessings, challenge.target)
        completed = gameState.blessings >= challenge.target
      } else if (challenge.type === 'level') {
        progress = Math.min(gameState.level, challenge.target)
        completed = gameState.level >= challenge.target
      }
      
      return { ...challenge, progress, completed }
    })

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-600 flex flex-col items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full text-white text-center">
          <div className="text-6xl mb-4">🏁</div>
          <h1 className="text-2xl font-bold mb-2">Game Over!</h1>
          <p className="text-lg mb-4">Final Score: {gameState.score}</p>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-xl font-bold text-yellow-400">{Math.floor(gameState.distance)}m</div>
              <div className="text-sm opacity-80">Distance</div>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <div className="text-xl font-bold text-green-400">{gameState.blessings}</div>
              <div className="text-sm opacity-80">Blessings</div>
            </div>
          </div>
          
          {gameState.score > highScore && (
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black px-4 py-2 rounded-xl font-bold mb-4 text-sm">
              🎉 New High Score! 🎉
            </div>
          )}
          
          {updatedChallenges.length > 0 && (
            <div className="bg-white/10 rounded-xl p-4 mb-4">
              <h3 className="text-lg font-bold mb-2">🎯 Daily Challenges</h3>
              <div className="space-y-1 text-sm">
                {updatedChallenges.map((challenge) => (
                  <div key={challenge.id} className="flex items-center justify-between">
                    <span className="text-xs">{challenge.reward}</span>
                    <span className={`text-xs ${challenge.completed ? 'text-green-400' : 'opacity-80'}`}>
                      {challenge.completed ? '✅' : `${challenge.progress}/${challenge.target}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={initGame}
              className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-4 py-2 rounded-xl font-bold hover:from-yellow-500 hover:to-amber-400 transition-all duration-300 text-sm"
            >
              Play Again 🔄
            </button>
            
            {user && (
              <button
                onClick={() => setShowStats(true)}
                className="bg-gradient-to-r from-purple-400 to-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:from-purple-600 hover:to-purple-400 transition-all duration-300 text-sm"
              >
                View Stats 📊
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-600 flex flex-col items-center justify-center p-4">
      {/* Game Header */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 text-white text-center w-full max-w-md">
        <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">🏃‍♂️ Faith Runner</h1>
        <p className="text-xs sm:text-sm opacity-80">
          {isMobile ? 'Tap to jump • Collect blessings • Avoid obstacles' : 'Press SPACE to jump • Collect blessings • Avoid obstacles'}
        </p>
      </div>

      {/* Game Canvas Container */}
      <div ref={containerRef} className="relative w-full max-w-4xl">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="border-2 border-white/20 rounded-2xl shadow-2xl w-full h-auto"
          onTouchStart={handleTouchStart}
          style={{ touchAction: 'none' }}
        />
        
        {/* Pause Overlay */}
        {gameState.isPaused && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
            <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-4 sm:p-6 text-white text-center">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">⏸️ Paused</h2>
              <button
                onClick={togglePause}
                className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:from-yellow-500 hover:to-amber-400 transition-all duration-300 text-sm sm:text-base"
              >
                Resume ▶️
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Game Controls */}
      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md">
        <button
          onClick={togglePause}
          className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-white/20 transition-all duration-300 text-sm sm:text-base"
        >
          {gameState.isPaused ? '▶️ Resume' : '⏸️ Pause'}
        </button>
        
        <button
          onClick={initGame}
          className="bg-gradient-to-r from-red-400 to-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-red-600 hover:to-red-400 transition-all duration-300 text-sm sm:text-base"
        >
          🔄 Restart
        </button>

        {user && (
          <button
            onClick={() => setShowStats(!showStats)}
            className="bg-gradient-to-r from-purple-400 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-purple-600 hover:to-purple-400 transition-all duration-300 text-sm sm:text-base"
          >
            📊 Stats
          </button>
        )}
      </div>

      {/* Game Stats */}
      <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4 text-white w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-3 text-center">
          <div className="text-lg sm:text-2xl font-bold">{gameState.score}</div>
          <div className="text-xs sm:text-sm opacity-80">Score</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-3 text-center">
          <div className="text-lg sm:text-2xl font-bold">{Math.floor(gameState.distance)}m</div>
          <div className="text-xs sm:text-sm opacity-80">Distance</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-3 text-center">
          <div className="text-lg sm:text-2xl font-bold">{gameState.lives}</div>
          <div className="text-xs sm:text-sm opacity-80">Lives</div>
        </div>
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-3 text-center">
          <div className="text-lg sm:text-2xl font-bold">{gameState.blessings}</div>
          <div className="text-xs sm:text-sm opacity-80">Blessings</div>
        </div>
      </div>

      {/* Stats Overlay */}
      {showStats && user && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto text-white">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold">📊 Game Statistics</h2>
              <button
                onClick={() => setShowStats(false)}
                className="w-6 sm:w-8 h-6 sm:h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors text-sm sm:text-base"
              >
                ✕
              </button>
            </div>
            
            {gameStats ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white/10 rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-yellow-400">{gameStats.totalGames}</div>
                    <div className="text-xs sm:text-sm opacity-80">Total Games</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-green-400">{gameStats.bestScore}</div>
                    <div className="text-xs sm:text-sm opacity-80">Best Score</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-blue-400">{Math.floor(gameStats.totalDistance)}m</div>
                    <div className="text-xs sm:text-sm opacity-80">Total Distance</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 sm:p-4 text-center">
                    <div className="text-lg sm:text-2xl font-bold text-purple-400">{gameStats.totalBlessings}</div>
                    <div className="text-xs sm:text-sm opacity-80">Total Blessings</div>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-3 sm:p-4">
                  <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">🎯 Daily Challenges</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {dailyChallenges.map((challenge) => (
                      <div key={challenge.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm sm:text-base">{challenge.reward}</div>
                          <div className="text-xs sm:text-sm opacity-80">
                            {challenge.type === 'distance' && `Run ${challenge.target}m`}
                            {challenge.type === 'score' && `Score ${challenge.target} points`}
                            {challenge.type === 'blessings' && `Collect ${challenge.target} blessings`}
                            {challenge.type === 'level' && `Reach level ${challenge.target}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs sm:text-sm opacity-80">
                            {Math.min(challenge.progress, challenge.target)} / {challenge.target}
                          </div>
                          {challenge.completed && (
                            <div className="text-green-400 text-xs sm:text-sm">✅ Completed!</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎮</div>
                <p className="text-base sm:text-lg opacity-80">Play your first game to see statistics!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
