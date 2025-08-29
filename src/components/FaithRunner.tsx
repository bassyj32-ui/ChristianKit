import React, { useState, useRef, useCallback, useEffect } from 'react';
import { saveGameScore, checkDailyChallenges, type GameScore, type DailyChallenge } from '../services/gameService';

interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  score: number;
  level: number;
  experience: number;
  health: number;
  maxHealth: number;
  prayerShield: boolean;
  faithBoost: boolean;
  graceGlide: boolean;
  mercyJump: boolean;
  wisdomVision: boolean;
  currentAbility: string | null;
  combo: number;
  streak: number;
  environment: string;
  weather: string;
  timeOfDay: string;
  mission: string;
  storyChapter: number;
  unlockedAbilities: string[];
  bossBattle: boolean;
  bossHealth: number;
}

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  speed: number;
  health?: number;
  isActive: boolean;
  animationFrame: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: string;
  isActive: boolean;
  animationFrame: number;
}

interface PrayerPrompt {
  id: string;
  message: string;
  verse: string;
  isActive: boolean;
  timer: number;
}

const FaithRunner: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    level: 1,
    experience: 0,
    health: 100,
    maxHealth: 100,
    prayerShield: false,
    faithBoost: false,
    graceGlide: false,
    mercyJump: false,
    wisdomVision: false,
    currentAbility: null,
    combo: 0,
    streak: 0,
    environment: 'forest',
    weather: 'clear',
    timeOfDay: 'day',
    mission: 'Complete your daily prayer journey',
    storyChapter: 1,
    unlockedAbilities: ['basic-jump'],
    bossBattle: false,
    bossHealth: 100
  });

  const [player, setPlayer] = useState({
    x: 100,
    y: 400,
    width: 40,
    height: 60,
    velocityY: 0,
    isJumping: false,
    canDoubleJump: false,
    animationFrame: 0,
    direction: 1,
    isInvulnerable: false
  });

  const [obstacles, setObstacles] = useState<GameObject[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [prayerPrompts, setPrayerPrompts] = useState<PrayerPrompt[]>([]);
  const [particles, setParticles] = useState<any[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [lastObstacleSpawn, setLastObstacleSpawn] = useState<number>(0);
  const [lastPowerUpSpawn, setLastPowerUpSpawn] = useState<number>(0);
  const [lastPrayerPrompt, setLastPrayerPrompt] = useState<number>(0);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);

  // Game constants
  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;
  const GROUND_Y = 400;
  const OBSTACLE_SPEED = 5;
  const POWER_UP_SPAWN_RATE = 0.02;
  const PRAYER_PROMPT_RATE = 0.01;

  // Story and mission data
  const storyChapters = [
    {
      id: 1,
      title: "The Faith Novice",
      description: "Begin your spiritual journey",
      mission: "Complete your first prayer session",
      unlock: "prayer-shield"
    },
    {
      id: 2,
      title: "The Prayer Warrior",
      description: "Strengthen your faith",
      mission: "Achieve a 5x combo",
      unlock: "faith-boost"
    },
    {
      id: 3,
      title: "The Spiritual Master",
      description: "Master the divine path",
      mission: "Defeat the first boss",
      unlock: "grace-glide"
    }
  ];

  const prayerPromptsData = [
    {
      message: "Take a moment to pray for strength",
      verse: "Philippians 4:13 - I can do all things through Christ who strengthens me."
    },
    {
      message: "Pray for wisdom in your journey",
      verse: "James 1:5 - If any of you lacks wisdom, let him ask God."
    },
    {
      message: "Give thanks for this moment",
      verse: "1 Thessalonians 5:18 - Give thanks in all circumstances."
    }
  ];

  const environments = {
    forest: { color: '#2d5016', obstacles: ['tree', 'rock', 'bush'] },
    mountain: { color: '#4a4a4a', obstacles: ['cliff', 'avalanche', 'eagle'] },
    city: { color: '#2c3e50', obstacles: ['car', 'building', 'traffic'] },
    spiritual: { color: '#8e44ad', obstacles: ['darkness', 'temptation', 'doubt'] }
  };

  const weatherEffects = {
    clear: { modifier: 1, particles: [] },
    rain: { modifier: 0.8, particles: ['rain'] },
    wind: { modifier: 1.2, particles: ['wind'] },
    fog: { modifier: 0.6, particles: ['fog'] }
  };

  // Initialize game
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused) {
      const gameLoop = () => {
        updateGame();
        renderGame();
        requestAnimationFrame(gameLoop);
      };
      gameLoop();
    }
  }, [gameState.isPlaying, gameState.isPaused]);

  // Load daily challenges
  useEffect(() => {
    const loadChallenges = async () => {
      try {
        const challenges = await checkDailyChallenges(dailyChallenges, { distance: 0, score: 0, blessings: 0, level: 0 });
        setDailyChallenges(challenges);
      } catch (error) {
        console.error('Failed to load daily challenges:', error);
      }
    };
    loadChallenges();
  }, []);

  const startGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: true, isGameOver: false }));
    setGameStartTime(Date.now());
    setPlayer(prev => ({ ...prev, y: GROUND_Y, velocityY: 0, isJumping: false }));
    setObstacles([]);
    setPowerUps([]);
    setPrayerPrompts([]);
    setParticles([]);
  };

  const pauseGame = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      score: 0,
      level: 1,
      experience: 0,
      health: 100,
      combo: 0,
      streak: 0,
      environment: 'forest',
      weather: 'clear',
      timeOfDay: 'day',
      bossBattle: false,
      bossHealth: 100
    }));
  };

  const jump = () => {
    if (!player.isJumping) {
      setPlayer(prev => ({
        ...prev,
        velocityY: JUMP_FORCE,
        isJumping: true,
        canDoubleJump: true
      }));
      addParticles(player.x + player.width / 2, player.y + player.height, 'jump');
    } else if (player.canDoubleJump && gameState.mercyJump) {
      setPlayer(prev => ({
        ...prev,
        velocityY: JUMP_FORCE * 0.7,
        canDoubleJump: false
      }));
      addParticles(player.x + player.width / 2, player.y + player.height, 'double-jump');
    }
  };

  const addParticles = (x: number, y: number, type: string) => {
    const newParticles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      type: string;
      color: string;
    }> = [];
    
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 30,
        maxLife: 30,
        type,
        color: type === 'jump' ? '#ffd700' : '#ff6b6b'
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const spawnObstacle = () => {
    const obstacleTypes = environments[gameState.environment as keyof typeof environments].obstacles;
    const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
    const height = Math.random() * 60 + 20;
    const y = GROUND_Y - height;
    
    const obstacle: GameObject = {
      x: 800,
      y,
      width: 30,
      height,
      type,
      speed: OBSTACLE_SPEED * (gameState.faithBoost ? 1.5 : 1),
      isActive: true,
      animationFrame: 0
    };
    
    setObstacles(prev => [...prev, obstacle]);
  };

  const spawnPowerUp = () => {
    const powerUpTypes = ['prayer-shield', 'faith-boost', 'grace-glide', 'mercy-jump', 'wisdom-vision'];
    const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
    
    const powerUp: PowerUp = {
      x: 800,
      y: Math.random() * 300 + 50,
      type,
      isActive: true,
      animationFrame: 0
    };
    
    setPowerUps(prev => [...prev, powerUp]);
  };

  const spawnPrayerPrompt = () => {
    const promptData = prayerPromptsData[Math.floor(Math.random() * prayerPromptsData.length)];
    const prompt: PrayerPrompt = {
      id: Date.now().toString(),
      message: promptData.message,
      verse: promptData.verse,
      isActive: true,
      timer: 300 // 5 seconds
    };
    
    setPrayerPrompts(prev => [...prev, prompt]);
    setGameState(prev => ({ ...prev, isPaused: true }));
  };

  const activateAbility = (ability: string) => {
    setGameState(prev => ({ ...prev, currentAbility: ability }));
    
    switch (ability) {
      case 'prayer-shield':
        setGameState(prev => ({ ...prev, prayerShield: true }));
        setTimeout(() => setGameState(prev => ({ ...prev, prayerShield: false })), 5000);
        break;
      case 'faith-boost':
        setGameState(prev => ({ ...prev, faithBoost: true }));
        setTimeout(() => setGameState(prev => ({ ...prev, faithBoost: false })), 8000);
        break;
      case 'grace-glide':
        setGameState(prev => ({ ...prev, graceGlide: true }));
        setTimeout(() => setGameState(prev => ({ ...prev, graceGlide: false })), 6000);
        break;
    }
    
    addParticles(player.x + player.width / 2, player.y, ability);
  };

  const updateGame = () => {
    const currentTime = Date.now();
    
    // Update player physics
    if (!gameState.graceGlide) {
      setPlayer(prev => ({
        ...prev,
        velocityY: prev.velocityY + GRAVITY,
        y: Math.min(prev.y + prev.velocityY, GROUND_Y)
      }));
    }
    
    if (player.y >= GROUND_Y) {
      setPlayer(prev => ({
        ...prev,
        y: GROUND_Y,
        velocityY: 0,
        isJumping: false
      }));
    }
    
    // Spawn obstacles
    if (currentTime - lastObstacleSpawn > 1500 / (gameState.level * 0.5 + 1)) {
      spawnObstacle();
      setLastObstacleSpawn(currentTime);
    }
    
    // Spawn power-ups
    if (Math.random() < POWER_UP_SPAWN_RATE) {
      spawnPowerUp();
    }
    
    // Spawn prayer prompts
    if (Math.random() < PRAYER_PROMPT_RATE) {
      spawnPrayerPrompt();
    }
    
    // Update obstacles
    setObstacles(prev => 
      prev
        .map(obs => ({ ...obs, x: obs.x - obs.speed, animationFrame: obs.animationFrame + 1 }))
        .filter(obs => obs.x > -obs.width)
    );
    
    // Update power-ups
    setPowerUps(prev => 
      prev
        .map(power => ({ ...power, x: power.x - OBSTACLE_SPEED, animationFrame: power.animationFrame + 1 }))
        .filter(power => power.x > -30)
    );
    
    // Update prayer prompts
    setPrayerPrompts(prev => 
      prev
        .map(prompt => ({ ...prompt, timer: prompt.timer - 1 }))
        .filter(prompt => prompt.timer > 0)
    );
    
    // Update particles
    setParticles(prev => 
      prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 1
        }))
        .filter(particle => particle.life > 0)
    );
    
    // Check collisions
    checkCollisions();
    
    // Update score and level
    setGameState(prev => ({
      ...prev,
      score: prev.score + 1,
      experience: prev.experience + 1
    }));
    
    // Level up
    if (gameState.experience >= gameState.level * 100) {
      levelUp();
    }
    
    // Change environment
    if (gameState.score % 1000 === 0) {
      changeEnvironment();
    }
    
    // Check for boss battle
    if (gameState.level % 5 === 0 && !gameState.bossBattle) {
      startBossBattle();
    }
  };

  const checkCollisions = () => {
    // Player-obstacle collisions
    obstacles.forEach(obstacle => {
      if (obstacle.isActive && !gameState.prayerShield) {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
          
          if (gameState.prayerShield) {
            // Shield blocks the hit
            addParticles(player.x + player.width / 2, player.y + player.height / 2, 'shield-block');
          } else {
            // Player takes damage
          }
        }
      }
    });
    
    // Player-power-up collisions
    powerUps.forEach(powerUp => {
      if (powerUp.isActive) {
        if (player.x < powerUp.x + 30 &&
            player.x + player.width > powerUp.x &&
            player.y < powerUp.y + 30 &&
            player.y + player.height > powerUp.y) {
          
          collectPowerUp(powerUp);
        }
      }
    });
  };

  const collectPowerUp = (powerUp: PowerUp) => {
    setPowerUps(prev => prev.map(p => p === powerUp ? { ...p, isActive: false } : p));
    
    if (powerUp.type === 'prayer-shield' && !gameState.unlockedAbilities.includes('prayer-shield')) {
      unlockAbility('prayer-shield');
    } else if (powerUp.type === 'faith-boost' && !gameState.unlockedAbilities.includes('faith-boost')) {
      unlockAbility('faith-boost');
    } else if (powerUp.type === 'grace-glide' && !gameState.unlockedAbilities.includes('grace-glide')) {
      unlockAbility('grace-glide');
    } else if (powerUp.type === 'mercy-jump' && !gameState.unlockedAbilities.includes('mercy-jump')) {
      unlockAbility('mercy-jump');
    } else if (powerUp.type === 'wisdom-vision' && !gameState.unlockedAbilities.includes('wisdom-vision')) {
      unlockAbility('wisdom-vision');
    }
    
    activateAbility(powerUp.type);
    addParticles(powerUp.x + 15, powerUp.y + 15, 'power-up');
  };

  const unlockAbility = (ability: string) => {
    setGameState(prev => ({
      ...prev,
      unlockedAbilities: [...prev.unlockedAbilities, ability]
    }));
    
    // Show unlock notification
    addParticles(400, 200, 'unlock');
  };

  const levelUp = () => {
    setGameState(prev => ({
      ...prev,
      level: prev.level + 1,
      experience: 0,
      maxHealth: prev.maxHealth + 20,
      health: prev.maxHealth + 20
    }));
    
    addParticles(400, 200, 'level-up');
  };

  const changeEnvironment = () => {
    const envKeys = Object.keys(environments);
    const currentIndex = envKeys.indexOf(gameState.environment);
    const nextIndex = (currentIndex + 1) % envKeys.length;
    const nextEnv = envKeys[nextIndex];
    
    setGameState(prev => ({ ...prev, environment: nextEnv }));
    
    // Change weather randomly
    const weatherKeys = Object.keys(weatherEffects);
    const randomWeather = weatherKeys[Math.floor(Math.random() * weatherKeys.length)];
    setGameState(prev => ({ ...prev, weather: randomWeather }));
    
    // Change time of day
    const times = ['day', 'night'];
    const randomTime = times[Math.floor(Math.random() * times.length)];
    setGameState(prev => ({ ...prev, timeOfDay: randomTime }));
  };

  const startBossBattle = () => {
    setGameState(prev => ({ ...prev, bossBattle: true, bossHealth: 100 }));
    // Boss battle logic would go here
  };

  const renderGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    const env = environments[gameState.environment as keyof typeof environments];
    const weather = weatherEffects[gameState.weather as keyof typeof weatherEffects];
    
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (gameState.timeOfDay === 'day') {
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#98FB98');
    } else {
      gradient.addColorStop(0, '#191970');
      gradient.addColorStop(1, '#2F4F4F');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Ground
    ctx.fillStyle = env.color;
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    
    // Draw obstacles
    obstacles.forEach(obstacle => {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    
    // Draw power-ups
    powerUps.forEach(powerUp => {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(powerUp.x, powerUp.y, 30, 30);
      ctx.fillStyle = '#000';
      ctx.font = '16px Arial';
      ctx.fillText(powerUp.type.charAt(0).toUpperCase(), powerUp.x + 10, powerUp.y + 20);
    });
    
    // Draw player
    ctx.fillStyle = gameState.prayerShield ? '#00FFFF' : '#FF6B6B';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw particles
    particles.forEach(particle => {
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.life / particle.maxLife;
      ctx.fillRect(particle.x, particle.y, 4, 4);
    });
    ctx.globalAlpha = 1;
    
    // Draw UI
    drawUI(ctx);
  };

  const drawUI = (ctx: CanvasRenderingContext2D) => {
    // Score and level
    ctx.fillStyle = '#FFF';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 40);
    ctx.fillText(`Level: ${gameState.level}`, 20, 70);
    ctx.fillText(`Health: ${gameState.health}/${gameState.maxHealth}`, 20, 100);
    
    // Abilities
    ctx.fillStyle = '#FFD700';
    ctx.font = '16px Arial';
    ctx.fillText('Abilities:', 20, 140);
    gameState.unlockedAbilities.forEach((ability, index) => {
      ctx.fillText(`• ${ability}`, 30, 160 + index * 20);
    });
    
    // Current mission
    ctx.fillStyle = '#FFF';
    ctx.font = '18px Arial';
    ctx.fillText(`Mission: ${gameState.mission}`, 20, 250);
    
    // Environment info
    ctx.fillText(`Environment: ${gameState.environment}`, 20, 280);
    ctx.fillText(`Weather: ${gameState.weather}`, 20, 310);
    ctx.fillText(`Time: ${gameState.timeOfDay}`, 20, 340);
    
    // Combo and streak
    if (gameState.combo > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.font = '32px Arial';
      ctx.fillText(`Combo: ${gameState.combo}x!`, 400, 100);
    }
    
    if (gameState.streak > 0) {
      ctx.fillStyle = '#00FF00';
      ctx.font = '28px Arial';
      ctx.fillText(`Streak: ${gameState.streak}`, 400, 140);
    }
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (gameState.isPlaying && !gameState.isPaused) {
        jump();
      }
    }
  }, [gameState.isPlaying, gameState.isPaused]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleTouch = useCallback(() => {
    if (gameState.isPlaying && !gameState.isPaused) {
      jump();
    }
  }, [gameState.isPlaying, gameState.isPaused]);

  // Prayer prompt modal
  const PrayerPromptModal = ({ prompt }: { prompt: PrayerPrompt }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-blue-900 to-purple-900 p-8 rounded-3xl border-2 border-amber-400 max-w-md mx-4 text-center">
        <h3 className="text-2xl font-bold text-white mb-4">🙏 Prayer Moment</h3>
        <p className="text-blue-100 mb-4">{prompt.message}</p>
        <div className="bg-blue-800/50 p-4 rounded-xl mb-6">
          <p className="text-amber-300 italic">{prompt.verse}</p>
        </div>
        <div className="text-sm text-blue-200 mb-6">
          Time remaining: {Math.ceil(prompt.timer / 60)}s
        </div>
        <button
          onClick={() => {
            setPrayerPrompts(prev => prev.filter(p => p.id !== prompt.id));
            setGameState(prev => ({ ...prev, isPaused: false }));
          }}
          className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
        >
          Continue Journey
        </button>
      </div>
    </div>
  );

  if (!gameState.isPlaying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            🏃‍♂️ FaithRunner
          </h1>
          <p className="text-xl text-blue-200 mb-8">
            Embark on an epic spiritual journey filled with challenges, abilities, and divine encounters!
          </p>
          
          {/* Story Progress */}
          <div className="bg-black/30 backdrop-blur-2xl rounded-3xl p-6 mb-8 border border-amber-400/50">
            <h3 className="text-2xl font-bold text-amber-400 mb-4">📖 Your Story Progress</h3>
            <div className="space-y-4">
              {storyChapters.map((chapter, index) => (
                <div key={chapter.id} className={`p-4 rounded-xl border-2 ${
                  gameState.storyChapter >= chapter.id 
                    ? 'border-green-500 bg-green-900/20' 
                    : 'border-gray-600 bg-gray-800/20'
                }`}>
                  <h4 className="font-bold text-white">{chapter.title}</h4>
                  <p className="text-gray-300 text-sm">{chapter.description}</p>
                  <p className="text-amber-300 text-sm">Mission: {chapter.mission}</p>
                  {gameState.storyChapter >= chapter.id && (
                    <span className="text-green-400 text-sm">✅ Unlocked: {chapter.unlock}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Unlocked Abilities */}
          <div className="bg-black/30 backdrop-blur-2xl rounded-3xl p-6 mb-8 border border-blue-400/50">
            <h3 className="text-2xl font-bold text-blue-400 mb-4">⚡ Your Abilities</h3>
            <div className="grid grid-cols-2 gap-4">
              {gameState.unlockedAbilities.map(ability => (
                <div key={ability} className="bg-blue-800/30 p-3 rounded-xl border border-blue-500/50">
                  <span className="text-blue-200 capitalize">{ability.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-8 py-4 rounded-2xl text-xl font-bold hover:scale-105 transition-transform shadow-2xl"
          >
            🚀 Start Adventure
          </button>
        </div>
      </div>
    );
  }

  if (gameState.isGameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-red-400 mb-6">Game Over</h2>
          <p className="text-xl text-blue-200 mb-8">Final Score: {gameState.score}</p>
          <button
            onClick={resetGame}
            className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements - Osmo Theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-yellow-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-2xl animate-bounce" />
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-gradient-to-br from-green-400/20 to-teal-500/20 rounded-full blur-3xl animate-pulse" />
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-transparent to-yellow-500/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-400/10 via-transparent to-purple-500/10" />
        </div>
      </div>

      {/* Game Canvas - Mobile Responsive */}
      <div className="relative w-full max-w-4xl mx-auto">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-auto max-h-[70vh] border-2 border-amber-400/50 rounded-3xl shadow-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm"
          onTouchStart={handleTouch}
          style={{ touchAction: 'none' }}
        />
        
        {/* Game Overlay - Mobile Optimized */}
        <div className="absolute top-4 left-4 right-4 flex flex-col sm:flex-row justify-between items-start space-y-2 sm:space-y-0">
          {/* Score Display */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-3 border border-amber-400/30">
            <div className="text-amber-400 text-sm font-medium">Score</div>
            <div className="text-white text-xl font-bold">{gameState.score}</div>
          </div>
          
          {/* Level Display */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-3 border border-blue-400/30">
            <div className="text-blue-400 text-sm font-medium">Level</div>
            <div className="text-white text-xl font-bold">{gameState.level}</div>
          </div>
          
          {/* Health Bar */}
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-3 border border-green-400/30">
            <div className="text-green-400 text-sm font-medium">Health</div>
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${(gameState.health / gameState.maxHealth) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Combo Display */}
        {gameState.combo > 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-6 py-3 rounded-2xl font-bold text-3xl animate-bounce">
              {gameState.combo}x Combo!
            </div>
          </div>
        )}
      </div>
      
      {/* Game Controls - Mobile First */}
      <div className="mt-6 w-full max-w-4xl mx-auto">
        {/* Touch Controls for Mobile */}
        <div className="grid grid-cols-3 gap-3 sm:hidden mb-4">
          <button
            onClick={jump}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-2xl font-bold text-lg shadow-2xl active:scale-95 transition-transform touch-manipulation"
          >
            🦘 Jump
          </button>
          <button
            onClick={pauseGame}
            className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-4 rounded-2xl font-bold text-lg shadow-2xl active:scale-95 transition-transform touch-manipulation"
          >
            {gameState.isPaused ? '▶️' : '⏸️'}
          </button>
          <button
            onClick={resetGame}
            className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-4 rounded-2xl font-bold text-lg shadow-2xl active:scale-95 transition-transform touch-manipulation"
          >
            🔄
          </button>
        </div>
        
        {/* Desktop Controls */}
        <div className="hidden sm:flex justify-center space-x-4">
          <button
            onClick={jump}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-transform shadow-2xl"
          >
            🦘 Jump
          </button>
          <button
            onClick={pauseGame}
            className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-transform shadow-2xl"
          >
            {gameState.isPaused ? '▶️ Resume' : '⏸️ Pause'}
          </button>
          <button
            onClick={resetGame}
            className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-transform shadow-2xl"
          >
            🔄 Reset
          </button>
        </div>
        
        {/* Abilities Display - Mobile Responsive */}
        <div className="mt-6 bg-black/30 backdrop-blur-2xl rounded-3xl p-4 border border-amber-400/30">
          <h3 className="text-lg font-bold text-amber-400 mb-3 text-center">⚡ Active Abilities</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {gameState.unlockedAbilities.map(ability => (
              <div key={ability} className={`p-2 rounded-xl border text-center text-xs ${
                gameState.currentAbility === ability 
                  ? 'bg-amber-400/30 border-amber-400 text-amber-200' 
                  : 'bg-blue-800/30 border-blue-500/50 text-blue-200'
              }`}>
                <div className="capitalize">{ability.replace('-', ' ')}</div>
                {gameState.currentAbility === ability && (
                  <div className="text-amber-400 text-xs">Active</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Prayer Prompts */}
      {prayerPrompts.map(prompt => (
        <PrayerPromptModal key={prompt.id} prompt={prompt} />
      ))}
      
      {/* Pause Menu - Enhanced Osmo Theme */}
      {gameState.isPaused && !prayerPrompts.some(p => p.isActive) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-40 p-4">
          <div className="bg-gradient-to-br from-slate-800/90 via-slate-700/90 to-slate-800/90 p-8 rounded-3xl border-2 border-amber-400/50 backdrop-blur-2xl shadow-2xl max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">⏸️ Game Paused</h3>
            <div className="space-y-4">
              <button
                onClick={pauseGame}
                className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg"
              >
                ▶️ Resume
              </button>
              <button
                onClick={resetGame}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-transform shadow-lg"
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaithRunner;
