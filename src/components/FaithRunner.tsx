import React, { useState, useEffect, useCallback, useRef } from 'react';

// Game Types
interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  score: number;
  distance: number;
  crosses: number;
  level: number;
  speed: number;
  streak: number;        // NEW → how many crosses in a row
  comboMessage: string;  // NEW → text to display
  comboTimer: number;    // NEW → how long to show the message
  powerUpActive: 'none' | 'wings' | 'shield' | 'speed' | 'doublejump' | 'magnet';
  powerUpTimer: number;
  bestScore: number;
  canDoubleJump: boolean;
  doubleJumpUsed: boolean;
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'cloud' | 'rock' | 'spike';
}

interface Collectible {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'cross' | 'wings' | 'shield' | 'speed' | 'doublejump' | 'magnet';
  collected: boolean;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'dust' | 'sparkle' | 'magnet';
}

interface BackgroundElement {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: 'cloud' | 'mountain';
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  isJumping: boolean;
  jumpVelocity: number;
  groundY: number;
}

const FaithRunner: React.FC = () => {
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    distance: 0,
    crosses: 0,
    level: 1,
    speed: 2,
    streak: 0,
    comboMessage: '',
    comboTimer: 0,
    powerUpActive: 'none',
    powerUpTimer: 0,
    bestScore: 0,
    canDoubleJump: false,
    doubleJumpUsed: false
  });

  const [player, setPlayer] = useState<Player>({
    x: 50,
    y: 0,
    width: 40,
    height: 50,
    isJumping: false,
    jumpVelocity: 0,
    groundY: 0
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [backgroundElements, setBackgroundElements] = useState<BackgroundElement[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  // Refs
  const gameLoopRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Game constants
  const GRAVITY = 0.8;
  const JUMP_FORCE = -15;
  const GROUND_HEIGHT = 100;
  const CANVAS_WIDTH = Math.min(800, window.innerWidth - 40);
  const CANVAS_HEIGHT = Math.min(400, window.innerHeight * 0.6);

  // Audio system
  const playSound = useCallback((type: 'jump' | 'collect' | 'combo' | 'powerup' | 'gameover') => {
    // Create audio context for sound effects
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different sounds
    const frequencies = {
      jump: 440,      // A4
      collect: 660,   // E5
      combo: 880,     // A5
      powerup: 1100,  // C#6
      gameover: 220   // A3
    };
    
    oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime);
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  }, []);

  // Initialize game
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas size
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        
        // Set initial player position
        setPlayer(prev => ({
          ...prev,
          y: CANVAS_HEIGHT - GROUND_HEIGHT - prev.height,
          groundY: CANVAS_HEIGHT - GROUND_HEIGHT - prev.height
        }));

        // Load best score from localStorage
        const savedBestScore = localStorage.getItem('faith-runner-best-score');
        if (savedBestScore) {
          setGameState(prev => ({ ...prev, bestScore: parseInt(savedBestScore) }));
        }

        // Initialize background elements
        const initialBackground: BackgroundElement[] = [];
        for (let i = 0; i < 5; i++) {
          initialBackground.push({
            x: i * 200,
            y: CANVAS_HEIGHT - 300,
            width: 100,
            height: 80,
            speed: 0.5,
            type: 'mountain'
          });
        }
        for (let i = 0; i < 3; i++) {
          initialBackground.push({
            x: i * 300,
            y: CANVAS_HEIGHT - 400,
            width: 80,
            height: 40,
            speed: 1,
            type: 'cloud'
          });
        }
        setBackgroundElements(initialBackground);
      }
    }
  }, []);

  // Jump handler
  const handleJump = () => {
    if (gameState.isPlaying && !player.isJumping) {
      setPlayer(prev => ({
        ...prev,
        isJumping: true,
        jumpVelocity: JUMP_FORCE
      }));
      playSound('jump');
      createDustParticles();
    } else if (gameState.isPlaying && player.isJumping && gameState.canDoubleJump && !gameState.doubleJumpUsed) {
      setPlayer(prev => ({
        ...prev,
        jumpVelocity: JUMP_FORCE * 0.8
      }));
      setGameState(prev => ({ ...prev, doubleJumpUsed: true }));
      playSound('jump');
      createSparkleParticles();
    } else if (!gameState.isPlaying && !gameState.isGameOver) {
      startGame();
    } else if (gameState.isGameOver) {
      resetGame();
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => new Set(prev).add(e.code));
      
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.code);
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.isPlaying, gameState.isGameOver, player.isJumping]);

  // Touch Controls
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleJump();
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
      }
    };
  }, [gameState.isPlaying, gameState.isGameOver, player.isJumping]);

  // Particle creation functions
  const createDustParticles = () => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: `dust-${Date.now()}-${i}`,
        x: player.x + player.width / 2,
        y: player.y + player.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 1,
        life: 30,
        maxLife: 30,
        size: Math.random() * 3 + 2,
        color: '#8B7355',
        type: 'dust'
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const createSparkleParticles = () => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      newParticles.push({
        id: `sparkle-${Date.now()}-${i}`,
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 40,
        maxLife: 40,
        size: Math.random() * 4 + 3,
        color: '#FFD700',
        type: 'sparkle'
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const createMagnetParticles = (x: number, y: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 6; i++) {
      newParticles.push({
        id: `magnet-${Date.now()}-${i}`,
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 20,
        maxLife: 20,
        size: Math.random() * 2 + 2,
        color: '#00FFFF',
        type: 'magnet'
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  // Game loop
  const gameLoop = useCallback(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;

    setGameState(prev => ({
      ...prev,
      distance: prev.distance + (prev.powerUpActive === 'speed' ? prev.speed * 1.5 : prev.speed),
      score: prev.score + 1,
      comboTimer: prev.comboTimer > 0 ? prev.comboTimer - 1 : 0,
      powerUpTimer: prev.powerUpTimer > 0 ? prev.powerUpTimer - 1 : 0,
      powerUpActive: prev.powerUpTimer > 1 ? prev.powerUpActive : 'none'
    }));

    // Update player physics
    setPlayer(prev => {
      if (prev.isJumping) {
        const newY = prev.y + prev.jumpVelocity;
        const newVelocity = prev.jumpVelocity + GRAVITY;
        
        if (newY >= prev.groundY) {
          return {
            ...prev,
            y: prev.groundY,
            isJumping: false,
            jumpVelocity: 0
          };
        }
        
        return {
          ...prev,
          y: newY,
          jumpVelocity: newVelocity
        };
      }
      return prev;
    });

    // Move obstacles
    setObstacles(prev => 
      prev
        .map(obstacle => ({
          ...obstacle,
          x: obstacle.x - gameState.speed
        }))
        .filter(obstacle => obstacle.x > -obstacle.width)
    );

    // Move collectibles (with magnet effect)
    setCollectibles(prev => 
      prev
        .map(collectible => {
          if (gameState.powerUpActive === 'magnet' && !collectible.collected) {
            // Magnet effect: pull collectibles towards player
            const dx = player.x - collectible.x;
            const dy = player.y - collectible.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 100) {
              return {
                ...collectible,
                x: collectible.x + dx * 0.1,
                y: collectible.y + dy * 0.1
              };
            }
          }
          return {
            ...collectible,
            x: collectible.x - gameState.speed
          };
        })
        .filter(collectible => collectible.x > -collectible.width)
    );

    // Update particles
    setParticles(prev => 
      prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 1,
          vy: particle.vy + 0.1 // gravity for dust particles
        }))
        .filter(particle => particle.life > 0)
    );

    // Update background elements (parallax)
    setBackgroundElements(prev => 
      prev.map(element => ({
        ...element,
        x: element.x - element.speed
      })).map(element => {
        if (element.x < -element.width) {
          return { ...element, x: CANVAS_WIDTH + Math.random() * 200 };
        }
        return element;
      })
    );

    // Spawn obstacles
    if (Math.random() < 0.005 + (gameState.level * 0.001)) {
      spawnObstacle();
    }

    // Spawn collectibles
    if (Math.random() < 0.003) {
      spawnCollectible();
    }

    // Check collisions
    checkCollisions();

    // Increase level and speed
    if (gameState.distance > 0 && gameState.distance % 1000 === 0) {
      setGameState(prev => ({
        ...prev,
        level: prev.level + 1,
        speed: Math.min(prev.speed + 0.5, 8)
      }));
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.isPlaying, gameState.isGameOver, gameState.speed, gameState.level, gameState.distance]);

  // Start game loop
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isGameOver) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isGameOver, gameLoop]);

  // Spawn obstacle
  const spawnObstacle = () => {
    const types: Obstacle['type'][] = ['cloud', 'rock', 'spike'];
    const type = types[Math.floor(Math.random() * types.length)];
    const newObstacle: Obstacle = {
      id: `obstacle-${Date.now()}`,
      x: CANVAS_WIDTH,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - (type === 'cloud' ? 60 : 40),
      width: type === 'cloud' ? 50 : 40,
      height: type === 'cloud' ? 60 : 40,
      type
    };
    
    setObstacles(prev => [...prev, newObstacle]);
  };

  // Spawn collectible
  const spawnCollectible = () => {
    const types: Collectible['type'][] = ['cross', 'wings', 'shield', 'speed', 'doublejump', 'magnet'];
    const type = types[Math.floor(Math.random() * types.length)];
    const newCollectible: Collectible = {
      id: `collectible-${Date.now()}`,
      x: CANVAS_WIDTH,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - 80,
      width: 30,
      height: 30,
      type,
      collected: false
    };
    
    setCollectibles(prev => [...prev, newCollectible]);
  };

  // Check collisions
  const checkCollisions = () => {
    // Check obstacle collisions
    const obstacleCollision = obstacles.some(obstacle => {
      if (gameState.powerUpActive === 'shield') return false;
      return (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y
      );
    });

    if (obstacleCollision) {
      gameOver();
      return;
    }

    // Check collectible collisions
    setCollectibles(prev => {
      const updatedCollectibles = prev.map(collectible => {
        if (
          !collectible.collected &&
          player.x < collectible.x + collectible.width &&
          player.x + player.width > collectible.x &&
          player.y < collectible.y + collectible.height &&
          player.y + player.height > collectible.y
        ) {
          // Play sound effect
          if (collectible.type === 'cross') {
            playSound('collect');
          } else {
            playSound('powerup');
          }

          // Create particles for power-ups
          if (collectible.type === 'wings' || collectible.type === 'shield' || collectible.type === 'speed') {
            createSparkleParticles();
          } else if (collectible.type === 'magnet') {
            createMagnetParticles(collectible.x, collectible.y);
          }

          setGameState(prev => {
            let newStreak = prev.streak + (collectible.type === 'cross' ? 1 : 0);
            let bonus = 0;
            let message = '';
            
            // Combo bonuses
            if (newStreak === 3) {
              bonus = 200;
              message = '🔥 Faith Streak x3!';
              playSound('combo');
            } else if (newStreak === 5) {
              bonus = 500;
              message = '⚡ Divine Combo x5!';
              playSound('combo');
            }

            let powerUpActive = prev.powerUpActive;
            let powerUpTimer = prev.powerUpTimer;
            let canDoubleJump = prev.canDoubleJump;
            let doubleJumpUsed = prev.doubleJumpUsed;
            
            if (collectible.type === 'wings' || collectible.type === 'shield' || collectible.type === 'speed') {
              powerUpActive = collectible.type;
              powerUpTimer = 600; // 10 sec
            } else if (collectible.type === 'doublejump') {
              canDoubleJump = true;
              doubleJumpUsed = false;
            } else if (collectible.type === 'magnet') {
              powerUpActive = 'magnet';
              powerUpTimer = 300; // 5 sec
            }

            return {
              ...prev,
              crosses: prev.crosses + (collectible.type === 'cross' ? 1 : 0),
              score: prev.score + 100 + bonus,
              streak: newStreak,
              comboMessage: message,
              comboTimer: message ? 60 : prev.comboTimer,
              powerUpActive,
              powerUpTimer,
              canDoubleJump,
              doubleJumpUsed
            };
          });
          return { ...collectible, collected: true };
        }
        return collectible;
      });

      // After filtering collected ones
      return updatedCollectibles.filter(c => {
        if (!c.collected && c.x < -c.width) {
          // missed cross → reset streak
          setGameState(prev => ({
            ...prev,
            streak: 0,
            comboMessage: '❌ Streak Broken!',
            comboTimer: 60
          }));
          return false;
        }
        return !c.collected;
      });
    });
  };

  // Start game
  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isGameOver: false,
      score: 0,
      distance: 0,
      crosses: 0,
      level: 1,
      speed: 2,
      streak: 0,
      comboMessage: '',
      comboTimer: 0,
      powerUpActive: 'none',
      powerUpTimer: 0,
      canDoubleJump: false,
      doubleJumpUsed: false
    }));
    setObstacles([]);
    setCollectibles([]);
    setParticles([]);
  };

  // Game over
  const gameOver = () => {
    playSound('gameover');
    setGameState(prev => {
      const newBestScore = Math.max(prev.score, prev.bestScore);
      if (newBestScore > prev.bestScore) {
        localStorage.setItem('faith-runner-best-score', newBestScore.toString());
      }
      return {
        ...prev,
        isPlaying: false,
        isGameOver: true,
        streak: 0,
        comboMessage: '',
        comboTimer: 0,
        powerUpActive: 'none',
        powerUpTimer: 0,
        bestScore: newBestScore,
        canDoubleJump: false,
        doubleJumpUsed: false
      };
    });
  };

  // Reset game
  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      isPlaying: false,
      isGameOver: false,
      score: 0,
      distance: 0,
      crosses: 0,
      level: 1,
      speed: 2,
      streak: 0,
      comboMessage: '',
      comboTimer: 0,
      powerUpActive: 'none',
      powerUpTimer: 0,
      canDoubleJump: false,
      doubleJumpUsed: false
    }));
    setObstacles([]);
    setCollectibles([]);
    setParticles([]);
    setPlayer(prev => ({
      ...prev,
      y: prev.groundY,
      isJumping: false,
      jumpVelocity: 0
    }));
  };

  // Render game
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Background layers with parallax
    ctx.fillStyle = '#C6E2FF'; // sky
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw background elements (parallax)
    backgroundElements.forEach(element => {
      if (element.type === 'mountain') {
        ctx.fillStyle = '#8FBC8F'; // Dark sea green
        ctx.fillRect(element.x, element.y, element.width, element.height);
        // Mountain peak
        ctx.fillStyle = '#A9A9A9'; // Dark gray
        ctx.beginPath();
        ctx.moveTo(element.x, element.y + element.height);
        ctx.lineTo(element.x + element.width / 2, element.y);
        ctx.lineTo(element.x + element.width, element.y + element.height);
        ctx.closePath();
        ctx.fill();
      } else if (element.type === 'cloud') {
        ctx.fillStyle = '#F0F8FF'; // Alice blue
        ctx.beginPath();
        ctx.arc(element.x + 20, element.y + 20, 15, 0, Math.PI * 2);
        ctx.arc(element.x + 40, element.y + 15, 20, 0, Math.PI * 2);
        ctx.arc(element.x + 60, element.y + 20, 15, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    ctx.fillStyle = '#98FB98'; // ground
    ctx.fillRect(0, CANVAS_HEIGHT - GROUND_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT);

    // Draw player (soldier)
    ctx.fillStyle = '#4169E1'; // Royal blue
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw soldier details
    ctx.fillStyle = '#FFD700'; // Gold
    ctx.fillRect(player.x + 5, player.y + 5, 30, 10); // Helmet
    ctx.fillStyle = '#8B4513'; // Saddle brown
    ctx.fillRect(player.x + 10, player.y + 15, 20, 25); // Body
    ctx.fillStyle = '#000000'; // Black
    ctx.fillRect(player.x + 15, player.y + 20, 10, 15); // Rifle

    // Wings effect
    if (gameState.powerUpActive === 'wings') {
      ctx.save();
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(Date.now() / 200);
      ctx.fillStyle = '#00FFFF';
      ctx.beginPath();
      ctx.moveTo(player.x + 5, player.y + player.height / 2);
      ctx.lineTo(player.x - 20, player.y + 10 + 10 * Math.sin(Date.now() / 100));
      ctx.lineTo(player.x - 20, player.y + player.height - 10 - 10 * Math.sin(Date.now() / 100));
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(player.x + player.width - 5, player.y + player.height / 2);
      ctx.lineTo(player.x + player.width + 20, player.y + 10 + 10 * Math.sin(Date.now() / 100));
      ctx.lineTo(player.x + player.width + 20, player.y + player.height - 10 - 10 * Math.sin(Date.now() / 100));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Shield effect
    if (gameState.powerUpActive === 'shield') {
      ctx.save();
      ctx.strokeStyle = `rgba(0,255,255,${0.3 + 0.3 * Math.sin(Date.now() / 150)})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Speed boost effect
    if (gameState.powerUpActive === 'speed') {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#FF4500';
      ctx.fillRect(player.x - 10, player.y + 10, 10, 30);
      ctx.fillRect(player.x + player.width, player.y + 10, 10, 30);
      ctx.restore();
    }

    // Draw obstacles
    obstacles.forEach(obstacle => {
      if (obstacle.type === 'cloud') {
        ctx.fillStyle = '#2F4F4F'; // Dark slate gray
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Add cloud details
        ctx.fillStyle = '#1C1C1C'; // Dark gray
        ctx.beginPath();
        ctx.arc(obstacle.x + 10, obstacle.y + 10, 8, 0, Math.PI * 2);
        ctx.arc(obstacle.x + 25, obstacle.y + 15, 12, 0, Math.PI * 2);
        ctx.arc(obstacle.x + 40, obstacle.y + 10, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (obstacle.type === 'rock') {
        ctx.fillStyle = '#A9A9A9'; // Dark gray
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      } else { // spike
        ctx.fillStyle = '#8B0000'; // Dark red
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      }
    });

    // Draw collectibles
    collectibles.forEach(collectible => {
      if (!collectible.collected) {
        if (collectible.type === 'cross') {
          ctx.fillStyle = '#FFD700'; // Gold
          ctx.fillRect(collectible.x + 10, collectible.y, 10, 30); // Vertical
          ctx.fillRect(collectible.x, collectible.y + 10, 30, 10); // Horizontal
          
          // Add glow effect
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 10;
          ctx.fillRect(collectible.x + 10, collectible.y, 10, 30);
          ctx.fillRect(collectible.x, collectible.y + 10, 30, 10);
          ctx.shadowBlur = 0;
        } else if (collectible.type === 'wings') {
          ctx.fillStyle = '#00FFFF'; // Cyan
          ctx.fillRect(collectible.x + 10, collectible.y, 10, 30);
          ctx.fillRect(collectible.x, collectible.y + 10, 30, 10);
        } else if (collectible.type === 'shield') {
          ctx.fillStyle = '#00FFFF'; // Cyan
          ctx.fillRect(collectible.x + 10, collectible.y, 10, 30);
          ctx.fillRect(collectible.x, collectible.y + 10, 30, 10);
        } else if (collectible.type === 'speed') {
          ctx.fillStyle = '#FF4500'; // Orange red
          ctx.fillRect(collectible.x + 10, collectible.y, 10, 30);
          ctx.fillRect(collectible.x, collectible.y + 10, 30, 10);
        } else if (collectible.type === 'doublejump') {
          ctx.fillStyle = '#9370DB'; // Medium purple
          ctx.fillRect(collectible.x + 10, collectible.y, 10, 30);
          ctx.fillRect(collectible.x, collectible.y + 10, 30, 10);
        } else if (collectible.type === 'magnet') {
          ctx.fillStyle = '#FF1493'; // Deep pink
          ctx.fillRect(collectible.x + 10, collectible.y, 10, 30);
          ctx.fillRect(collectible.x, collectible.y + 10, 30, 10);
        }
      }
    });

    // Draw particles
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      
      if (particle.type === 'dust') {
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      } else if (particle.type === 'sparkle') {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (particle.type === 'magnet') {
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      }
      
      ctx.restore();
    });

    // Draw UI elements
    ctx.fillStyle = '#333333';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 30);
    ctx.fillText(`Best: ${gameState.bestScore}`, 20, 60);
    ctx.fillText(`Crosses: ${gameState.crosses}`, 20, 90);
    ctx.fillText(`Streak: ${gameState.streak}`, 20, 120);
    ctx.fillText(`Level: ${gameState.level}`, 20, 150);
    ctx.fillText(`Distance: ${Math.floor(gameState.distance)}m`, 20, 180);

    // Draw combo message
    if (gameState.comboTimer > 0 && gameState.comboMessage) {
      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${32 + Math.sin(Date.now()/100)*4}px Arial`; // pulse effect
      ctx.textAlign = 'center';
      ctx.fillText(
        gameState.comboMessage,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 - 120
      );
      ctx.textAlign = 'left';
    }

    // Draw game over screen
    if (gameState.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '24px Arial';
      ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.fillText(`Best Score: ${gameState.bestScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
      ctx.fillText(`Crosses Collected: ${gameState.crosses}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
      ctx.fillText(`Distance: ${Math.floor(gameState.distance)}m`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
      ctx.fillText('Press SPACE to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 130);
      ctx.textAlign = 'left';
    }

    // Draw start screen
    if (!gameState.isPlaying && !gameState.isGameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('FAITH RUNNER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      
      ctx.font = '20px Arial';
      ctx.fillText('Help the soldier run through the storm!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
      ctx.fillText('Jump over obstacles and collect crosses', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText('Collect power-ups: Wings, Shield, Speed,', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      ctx.fillText('Double Jump, and Magnet!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
      ctx.fillText('Press SPACE to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110);
      ctx.textAlign = 'left';
    }
  }, [player, obstacles, collectibles, particles, backgroundElements, gameState]);

  // Render on every frame
  useEffect(() => {
    const renderLoop = () => {
      render();
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }, [render]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">🌟 Faith Runner</h1>
        <p className="text-gray-600">Help the soldier run through the storm and collect crosses!</p>
      </div>

      {/* Game Canvas */}
      <div className="bg-white rounded-2xl shadow-2xl p-4 mb-6">
        <canvas
          ref={canvasRef}
          className="border-2 border-gray-200 rounded-xl"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      {/* Instructions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 max-w-md text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-3">🎮 How to Play</h3>
        <div className="space-y-2 text-gray-600">
          <p>• Press <kbd className="bg-gray-200 px-2 py-1 rounded">SPACE</kbd>, <kbd className="bg-gray-200 px-2 py-1 rounded">↑</kbd>, or <kbd className="bg-gray-200 px-2 py-1 rounded">TAP</kbd> to jump</p>
          <p>• Avoid obstacles (clouds, rocks, spikes)</p>
          <p>• Collect golden crosses for points</p>
          <p>• Collect power-ups: Wings, Shield, Speed, Double Jump, Magnet</p>
          <p>• Run as far as you can!</p>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="mt-6">
        <button
          onClick={handleJump}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl text-xl transform hover:scale-105 transition-all duration-300 shadow-lg active:scale-95"
        >
          {!gameState.isPlaying && !gameState.isGameOver ? '🚀 Start Game' : 
           gameState.isGameOver ? '🔄 Restart' : '⬆️ Jump'}
        </button>
      </div>
    </div>
  );
};

export default FaithRunner;

