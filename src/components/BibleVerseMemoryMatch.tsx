import React, { useState, useEffect, useCallback } from 'react';
import { OsmoCard, OsmoButton, OsmoBadge } from '../theme/osmoComponents';
import { bibleVersesByLevel, levelProgression, getVersesForLevel, getTotalLevels } from '../data/verseLevels';
import { useGameAudio } from '../hooks/useGameAudio';

// Simple save utility (no external dependencies)
const saveGameData = (data: any) => {
  try {
    localStorage.setItem('bible-memory-match-data', JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save game data:', error);
    return false;
  }
};

const loadGameData = () => {
  try {
    const saved = localStorage.getItem('bible-memory-match-data');
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Failed to load game data:', error);
    return {};
  }
};

const recordGameComplete = (score: number, matches: number, timeElapsed: number) => {
  const currentData = loadGameData();
  const bestScore = Math.max((currentData.bestScore as number) || 0, score);
  const newData = {
    ...currentData,
    bestScore,
    lastScore: score,
    lastMatches: matches,
    lastTime: timeElapsed,
    gamesPlayed: (currentData.gamesPlayed as number) || 0 + 1
  };

  saveGameData(newData);
  return { bestScore };
};

// Game Types
interface Card {
  id: string;
  content: string;
  type: 'verse' | 'reference';
  matched: boolean;
  flipped: boolean;
  pairId: string;
}

interface GameState {
  cards: Card[];
  flippedCards: Card[];
  matches: number;
  attempts: number;
  score: number;
  timeElapsed: number;
  gameStarted: boolean;
  gameCompleted: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  streak: number;
  bestScore: number;
  perfectMatches: number;
  perfectGamesInRow: number;
  currentCategory: string;
  unlockedCategories: string[];
  currentLevel: number;
}

interface BibleVerse {
  id: string;
  verse: string;
  reference: string;
  category: string;
}

const BibleVerseMemoryMatch: React.FC = () => {
  // Audio hooks
  const { playSound, initializeAudio } = useGameAudio();

  // Initialize with saved data
  const savedData = loadGameData();
  
  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    flippedCards: [],
    matches: 0,
    attempts: 0,
    score: 0,
    timeElapsed: 0,
    gameStarted: false,
    gameCompleted: false,
    difficulty: 'easy',
    streak: 0,
    bestScore: savedData.bestScore || 0,
    perfectMatches: 0,
    perfectGamesInRow: 0,
    currentCategory: 'popular',
    unlockedCategories: ['popular'],
    currentLevel: 1
  });

  const [showGameComplete, setShowGameComplete] = useState(false);
  const [autoContinueTimer, setAutoContinueTimer] = useState(3);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load sound preference from localStorage
  useEffect(() => {
    const savedSoundEnabled = localStorage.getItem('bible-game-sound-enabled');
    if (savedSoundEnabled !== null) {
      setSoundEnabled(savedSoundEnabled === 'true');
    }
  }, []);

  // Save sound preference to localStorage
  useEffect(() => {
    localStorage.setItem('bible-game-sound-enabled', soundEnabled.toString());
  }, [soundEnabled]);

  // Get current level in the non-sequential progression
  const getCurrentLevelIndex = () => {
    const currentIndex = levelProgression.indexOf(gameState.currentLevel);
    return currentIndex >= 0 ? currentIndex : 0;
  };

  // Get next level in sequential progression
  const getNextLevel = () => {
    return gameState.currentLevel + 1;
  };

  const categories = [
    { 
      id: 'popular', 
      name: 'Popular Verses', 
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ), 
      color: 'from-yellow-500 to-orange-500' 
    },
    { 
      id: 'faith', 
      name: 'Hope & Faith', 
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ), 
      color: 'from-blue-500 to-purple-500' 
    },
    { 
      id: 'love', 
      name: 'Love & Grace', 
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      ), 
      color: 'from-pink-500 to-red-500' 
    },
    { 
      id: 'wisdom', 
      name: 'Wisdom', 
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ), 
      color: 'from-green-500 to-teal-500' 
    }
  ];

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState.gameStarted && !gameState.gameCompleted) {
      interval = setInterval(() => {
        setGameState(prev => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.gameStarted, gameState.gameCompleted]);

  // Load saved data
  useEffect(() => {
    const savedData = localStorage.getItem('bible-memory-match-data');
    if (savedData) {
      const data = JSON.parse(savedData);
      setGameState(prev => ({
        ...prev,
        bestScore: data.bestScore || 0,
        perfectGamesInRow: data.perfectGamesInRow || 0,
        currentCategory: data.currentCategory || 'popular',
        unlockedCategories: data.unlockedCategories || ['popular'],
        currentLevel: data.currentLevel || 1,
        difficulty: data.difficulty || 'easy'
      }));
    }
  }, []);

  // Get next game settings based on level progression
  const getNextGameSettings = () => {
    const nextLevel = getNextLevel();
    const levelVerses = getVersesForLevel(nextLevel);

    if (!levelVerses || levelVerses.length === 0) {
      console.error('No verses found for level:', nextLevel);
      return null;
    }

    // Determine difficulty based on level number
    let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
    if (nextLevel >= 9) difficulty = 'hard';
    else if (nextLevel >= 5) difficulty = 'medium';

    return {
      level: nextLevel,
      verses: levelVerses,
      difficulty: difficulty,
      totalLevels: getTotalLevels(),
      currentLevelIndex: getCurrentLevelIndex()
    };
  };

  // Initialize game
  const initializeGame = useCallback(() => {
    const nextSettings = getNextGameSettings();
    if (!nextSettings) {
      console.error('Failed to get next game settings');
      return;
    }

    const gameVerses = nextSettings.verses;
    
    const cards: Card[] = [];
    
    // Create verse and reference cards
    gameVerses.forEach(verse => {
      cards.push({
        id: `verse-${verse.id}`,
        content: verse.verse,
        type: 'verse',
        matched: false,
        flipped: false,
        pairId: verse.id
      });
      
      cards.push({
        id: `ref-${verse.id}`,
        content: verse.reference,
        type: 'reference',
        matched: false,
        flipped: false,
        pairId: verse.id
      });
    });
    
    // Shuffle cards
    const shuffledCards = cards.sort(() => Math.random() - 0.5);
    
    setGameState(prev => ({
      ...prev,
      cards: shuffledCards,
      flippedCards: [],
      matches: 0,
      attempts: 0,
      score: 0,
      timeElapsed: 0,
      gameStarted: true,
      gameCompleted: false,
      streak: 0,
      perfectMatches: 0,
      currentCategory: 'mixed',
      difficulty: nextSettings.difficulty,
      currentLevel: nextSettings.level,
      unlockedCategories: ['mixed']
    }));
  }, [gameState.currentLevel, getNextGameSettings]);

  // Handle card click
  const handleCardClick = useCallback((clickedCard: Card) => {
    if (clickedCard.flipped || clickedCard.matched || gameState.flippedCards.length >= 2) {
      return;
    }

    // Initialize audio on first user interaction
    initializeAudio();

    // Play card flip sound (always enabled)
    if (soundEnabled) {
      playSound('cardFlip');
    }

    const newFlippedCards = [...gameState.flippedCards, clickedCard];
    const updatedCards = gameState.cards.map(card =>
      card.id === clickedCard.id ? { ...card, flipped: true } : card
    );

    setGameState(prev => ({
      ...prev,
      cards: updatedCards,
      flippedCards: newFlippedCards
    }));

    // Check for match when 2 cards are flipped
    if (newFlippedCards.length === 2) {
      const [firstCard, secondCard] = newFlippedCards;
      const isMatch = firstCard.pairId === secondCard.pairId;

      setTimeout(() => {
        if (isMatch) {
          // Match found
          const matchedCards = gameState.cards.map(card =>
            card.pairId === firstCard.pairId ? { ...card, matched: true, flipped: true } : card
          );

          const newMatches = gameState.matches + 1;
          const newStreak = gameState.streak + 1;
          const isPerfectMatch = gameState.attempts === newMatches - 1; // No wrong attempts before this match
          const baseScore = 100;
          const timeBonus = Math.max(0, 60 - gameState.timeElapsed);
          const streakBonus = newStreak * 50;
          const perfectBonus = isPerfectMatch ? 200 : 0;
          const newScore = gameState.score + baseScore + timeBonus + streakBonus + perfectBonus;

          setGameState(prev => ({
            ...prev,
            cards: matchedCards,
            flippedCards: [],
            matches: newMatches,
            attempts: prev.attempts + 1,
            score: newScore,
            streak: newStreak,
            perfectMatches: prev.perfectMatches + (isPerfectMatch ? 1 : 0),
            gameCompleted: newMatches === (gameState.difficulty === 'easy' ? 4 : gameState.difficulty === 'medium' ? 6 : 8)
          }));

          // Play match sound (always enabled)
          if (isPerfectMatch) {
            if (soundEnabled) playSound('perfectMatch');
          } else {
            if (soundEnabled) playSound('match');
          }
          // Match found
        } else {
          // No match
          const resetCards = gameState.cards.map(card =>
            newFlippedCards.some(fc => fc.id === card.id) ? { ...card, flipped: false } : card
          );

          setGameState(prev => ({
            ...prev,
            cards: resetCards,
            flippedCards: [],
            attempts: prev.attempts + 1,
            streak: 0 // Reset streak on wrong match
          }));

          // Play no match sound (always enabled)
          if (soundEnabled) playSound('noMatch');
          // No match
        }
      }, 1000);
    }
  }, [gameState.cards, gameState.flippedCards, gameState.matches, gameState.attempts, gameState.score, gameState.streak, gameState.timeElapsed, gameState.difficulty, soundEnabled]);


  // Save game completion and handle progression
  useEffect(() => {
    if (gameState.gameCompleted && !showGameComplete) {
      // Play game completion sound (always enabled)
      if (soundEnabled) playSound('gameComplete');

      // Record completion and check for new best score
      const result = recordGameComplete(gameState.score, gameState.matches, gameState.timeElapsed);

      // Update best score in state
      setGameState(prev => ({
        ...prev,
        bestScore: result.bestScore
      }));

      // Show completion screen
      setShowGameComplete(true);

      // Auto-advance to next level if not on the final level
      if (gameState.currentLevel < getTotalLevels()) {
        const timer = setTimeout(() => {
          // Move to next level directly
          const nextLevel = gameState.currentLevel + 1;
          const nextLevelVerses = getVersesForLevel(nextLevel);

          if (nextLevelVerses.length > 0) {
            // Create cards from verses (same logic as initializeGame)
            const newCards: Card[] = [];

            nextLevelVerses.forEach(verse => {
              newCards.push({
                id: `verse-${verse.id}`,
                content: verse.verse,
                type: 'verse',
                matched: false,
                flipped: false,
                pairId: verse.id
              });

              newCards.push({
                id: `ref-${verse.id}`,
                content: verse.reference,
                type: 'reference',
                matched: false,
                flipped: false,
                pairId: verse.id
              });
            });

            // Shuffle cards
            const shuffledCards = newCards.sort(() => Math.random() - 0.5);

      setGameState(prev => ({
        ...prev,
              currentLevel: nextLevel,
              cards: shuffledCards,
              flippedCards: [],
              matches: 0,
              attempts: 0,
              score: 0,
              timeElapsed: 0,
              gameStarted: false,
              gameCompleted: false,
              streak: 0,
              perfectMatches: 0,
              perfectGamesInRow: prev.perfectGamesInRow + 1
            }));

            setShowGameComplete(false);
            setShowStats(false);
          }
        }, 3000); // 3 second delay

        setAutoAdvanceTimer(timer);
      }
    }
  }, [gameState.gameCompleted, gameState.score, gameState.matches, gameState.timeElapsed, gameState.difficulty, gameState.currentLevel, showGameComplete, playSound, recordGameComplete, getTotalLevels, getVersesForLevel]);

  // Cleanup auto-advance timer
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer) {
        clearTimeout(autoAdvanceTimer);
      }
    };
  }, [autoAdvanceTimer]);


  // Reset current game
  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      cards: [],
      flippedCards: [],
      matches: 0,
      attempts: 0,
      score: 0,
      timeElapsed: 0,
      gameStarted: false,
      gameCompleted: false,
      streak: 0,
      perfectMatches: 0
    }));
  };

  // Full reset - reset all progress
  const resetAllProgress = () => {
    localStorage.removeItem('bible-memory-match-data');
    setGameState({
      cards: [],
      flippedCards: [],
      matches: 0,
      attempts: 0,
      score: 0,
      timeElapsed: 0,
      gameStarted: false,
      gameCompleted: false,
      difficulty: 'easy',
      streak: 0,
      bestScore: 0,
      perfectMatches: 0,
      perfectGamesInRow: 0,
      currentCategory: 'popular',
      unlockedCategories: ['popular'],
      currentLevel: 1
    });
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get card grid classes based on difficulty
  const getGridClasses = () => {
    switch (gameState.difficulty) {
      case 'easy': return 'grid-cols-3 md:grid-cols-4 gap-2 md:gap-3'; // 3x2 on mobile, 4x2 on desktop
      case 'medium': return 'grid-cols-3 md:grid-cols-4 gap-2'; // 3x3 on mobile, 4x3 on desktop
      case 'hard': return 'grid-cols-3 md:grid-cols-4 gap-2'; // 3x4 on mobile, 4x4 on desktop
      default: return 'grid-cols-3 md:grid-cols-4 gap-2 md:gap-3';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden">
      {/* Simple Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[var(--accent-primary)]/5 to-[var(--accent-secondary)]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-[var(--spiritual-blue)]/5 to-[var(--spiritual-cyan)]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6">
        {/* Simple Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Bible Verse Match
          </h1>
          <p className="text-[var(--text-secondary)] text-base md:text-lg">
            Match Bible verses with their references
          </p>
          
          {/* Soldier Image Button with Rotating Gradient Border */}
          {!gameState.gameStarted && !gameState.gameCompleted && (
            <div className="flex justify-center mb-8">
              <div className="relative">
                {/* Rotating Gradient Border */}
                <div className="absolute inset-0 w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-r from-[var(--accent-primary)] via-[var(--spiritual-blue)] via-[var(--accent-secondary)] to-[var(--spiritual-green)] animate-spin opacity-60" style={{ animationDuration: '3s' }}></div>
                
                <button
                  onClick={initializeGame}
                  className="group relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 transform border-4 border-transparent"
                  style={{ margin: '2px' }}
                >
                  {/* Real Soldier Photo Background */}
                  <img 
                    src="/assets/illustrations/soldier-game-icon.jpg.jpg" 
                    alt="Start Bible Game"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to gradient if image doesn't exist
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = 'flex';
                      }
                    }}
                  />
                  
                  {/* Fallback Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] hidden items-center justify-center">
                    <svg className="w-12 h-12 md:w-14 md:h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                    </svg>
                  </div>
                  
                  {/* Subtle overlay for better text visibility */}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-all duration-300"></div>
                  
                  {/* Start Text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm md:text-base text-center drop-shadow-lg bg-black/30 px-2 py-1 rounded-md">Start Game</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Simple Game Start */}
        {!gameState.gameStarted && !gameState.gameCompleted && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Simple Stats */}
            <OsmoCard className="p-4">
              <div className="flex justify-center space-x-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-[var(--accent-primary)]">Level {gameState.currentLevel}</div>
                  <div className="text-[var(--text-secondary)] text-sm">Current</div>
                  </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--spiritual-blue)]">{(gameState.bestScore || 0).toLocaleString()}</div>
                  <div className="text-[var(--text-secondary)] text-sm">Best Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[var(--spiritual-green)]">{gameState.perfectGamesInRow || 0}</div>
                  <div className="text-[var(--text-secondary)] text-sm">Perfect</div>
                </div>
              </div>
                </OsmoCard>

            {/* Quick Reset */}
            <div className="text-center">
                <OsmoButton
                  onClick={resetAllProgress}
                  variant="secondary"
                  size="sm"
                >
                Reset Progress
                </OsmoButton>
              </div>
              </div>
            )}

        {/* Game in Progress */}
        {gameState.gameStarted && !gameState.gameCompleted && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Game Board */}
            <OsmoCard className="p-4">
              <div className={`grid ${getGridClasses()} max-w-2xl mx-auto`}>
                {gameState.cards.map((card, index) => (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    className={`group aspect-square cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      card.flipped || card.matched ? 'rotate-y-180' : ''
                    }`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Card Back */}
                    <div className={`absolute inset-0 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-600 shadow-lg flex items-center justify-center ${
                      card.flipped || card.matched ? 'opacity-0' : 'opacity-100'
                    } transition-opacity duration-300 group-hover:border-yellow-400`}>
                      <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M10 2h4v6h8v4h-8v8h-4v-8H2V8h8V2z"/>
                        </svg>
                    </div>

                    {/* Card Front */}
                    <div className={`absolute inset-0 rounded-lg shadow-lg border-2 p-2 flex items-center justify-center text-center ${
                      card.flipped || card.matched ? 'opacity-100' : 'opacity-0'
                    } transition-opacity duration-300 ${
                      card.matched 
                        ? 'border-green-400 bg-green-400/10'
                        : 'border-blue-400 bg-blue-400/10'
                    }`}>
                      <div className={`text-xs font-semibold leading-tight ${
                        card.type === 'verse' 
                          ? 'text-white'
                          : 'text-yellow-400 font-bold'
                      }`}>
                        {card.content}
                      </div>
                      {card.matched && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </OsmoCard>

            {/* Game Stats */}
            <OsmoCard className="p-3">
              <div className="flex justify-center space-x-4 text-center">
                <div>
                  <div className="text-xl font-bold text-blue-400">{formatTime(gameState.timeElapsed)}</div>
                  <div className="text-gray-400 text-xs">Time</div>
            </div>
                <div>
                  <div className="text-xl font-bold text-green-400">{gameState.matches}</div>
                  <div className="text-gray-400 text-xs">Matches</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-yellow-400">{gameState.score.toLocaleString()}</div>
                  <div className="text-gray-400 text-xs">Score</div>
                </div>
              </div>
            </OsmoCard>
            
            {/* Reset Button and Sound Toggle */}
            <div className="flex gap-3 justify-center">
              <OsmoButton onClick={resetGame} variant="secondary" size="sm">
                New Game
              </OsmoButton>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  soundEnabled
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                🔊 {soundEnabled ? 'Sound On' : 'Sound Off'}
              </button>
            </div>
          </div>
        )}

        {/* Game Completed */}
        {gameState.gameCompleted && (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Victory Message */}
            <OsmoCard className="p-6 text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold text-white mb-4">Challenge Complete!</h2>
              <p className="text-gray-300">
                Score: {gameState.score.toLocaleString()} points
              </p>

              {gameState.attempts === gameState.matches && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 font-semibold">✨ Perfect Game!</p>
                </div>
              )}
            </OsmoCard>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <OsmoButton onClick={initializeGame} variant="primary" className="flex-1">
                Next Level
              </OsmoButton>
              <OsmoButton onClick={resetGame} variant="secondary" className="flex-1">
                Play Again
              </OsmoButton>
            </div>

            {/* Sound Toggle */}
            <div className="text-center">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  soundEnabled
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                🔊 {soundEnabled ? 'Sound On' : 'Sound Off'}
              </button>
            </div>
          </div>
        )}

        {/* Simple Instructions */}
        <div className="mt-8 max-w-2xl mx-auto">
          <OsmoCard className="p-4">
            <h3 className="text-lg font-bold text-white mb-3">How to Play</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>• Click cards to reveal Bible verses</p>
              <p>• Match each verse with its reference</p>
              <p>• Complete all pairs to finish the level</p>
            </div>
          </OsmoCard>
        </div>
      </div>

    </div>
  );
};

export default BibleVerseMemoryMatch;
