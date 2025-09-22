import { useState, useEffect, useCallback } from 'react';
import { OsmoCard, OsmoButton, OsmoGradientText, OsmoSectionHeader, OsmoBadge } from '../theme/osmoComponents';

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

const BibleVerseMemoryMatch = () => {
  // Game state
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
    bestScore: 0,
    perfectMatches: 0,
    perfectGamesInRow: 0,
    currentCategory: 'popular',
    unlockedCategories: ['popular'],
    currentLevel: 1
  });

  const [showStats, setShowStats] = useState(false);
  const [autoContinueTimer, setAutoContinueTimer] = useState(3);

  // Bible verses database
  const bibleVerses: BibleVerse[] = [
    // Popular Verses
    { id: '1', verse: 'For God so loved the world that he gave his one and only Son', reference: 'John 3:16', category: 'popular' },
    { id: '2', verse: 'I can do all things through Christ who strengthens me', reference: 'Philippians 4:13', category: 'popular' },
    { id: '3', verse: 'Trust in the Lord with all your heart and lean not on your own understanding', reference: 'Proverbs 3:5', category: 'popular' },
    { id: '4', verse: 'The Lord is my shepherd, I lack nothing', reference: 'Psalm 23:1', category: 'popular' },
    { id: '5', verse: 'Be strong and courageous. Do not be afraid; do not be discouraged', reference: 'Joshua 1:9', category: 'popular' },
    { id: '6', verse: 'And we know that in all things God works for the good of those who love him', reference: 'Romans 8:28', category: 'popular' },
    { id: '7', verse: 'Cast all your anxiety on him because he cares for you', reference: '1 Peter 5:7', category: 'popular' },
    { id: '8', verse: 'For I know the plans I have for you, declares the Lord', reference: 'Jeremiah 29:11', category: 'popular' },
    
    // Hope & Faith
    { id: '9', verse: 'Now faith is confidence in what we hope for and assurance about what we do not see', reference: 'Hebrews 11:1', category: 'faith' },
    { id: '10', verse: 'May the God of hope fill you with all joy and peace as you trust in him', reference: 'Romans 15:13', category: 'faith' },
    { id: '11', verse: 'But those who hope in the Lord will renew their strength', reference: 'Isaiah 40:31', category: 'faith' },
    { id: '12', verse: 'Faith is taking the first step even when you don\'t see the whole staircase', reference: 'Martin Luther King Jr.', category: 'faith' },
    
    // Love & Grace
    { id: '13', verse: 'Love is patient, love is kind. It does not envy, it does not boast', reference: '1 Corinthians 13:4', category: 'love' },
    { id: '14', verse: 'But God demonstrates his own love for us in this: While we were still sinners, Christ died for us', reference: 'Romans 5:8', category: 'love' },
    { id: '15', verse: 'Above all, love each other deeply, because love covers over a multitude of sins', reference: '1 Peter 4:8', category: 'love' },
    { id: '16', verse: 'For it is by grace you have been saved, through faith—and this is not from yourselves', reference: 'Ephesians 2:8', category: 'love' },
    
    // Wisdom
    { id: '17', verse: 'The fear of the Lord is the beginning of wisdom', reference: 'Proverbs 9:10', category: 'wisdom' },
    { id: '18', verse: 'If any of you lacks wisdom, you should ask God, who gives generously to all', reference: 'James 1:5', category: 'wisdom' },
    { id: '19', verse: 'The simple believe anything, but the prudent give thought to their steps', reference: 'Proverbs 14:15', category: 'wisdom' },
    { id: '20', verse: 'Plans fail for lack of counsel, but with many advisers they succeed', reference: 'Proverbs 15:22', category: 'wisdom' }
  ];

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

  // Determine next category and difficulty based on progression
  const getNextGameSettings = () => {
    const { perfectGamesInRow, unlockedCategories, currentLevel } = gameState;
    
    // Unlock new categories based on perfect games
    let newUnlockedCategories = [...unlockedCategories];
    if (perfectGamesInRow >= 2 && !newUnlockedCategories.includes('faith')) {
      newUnlockedCategories.push('faith');
    }
    if (perfectGamesInRow >= 4 && !newUnlockedCategories.includes('love')) {
      newUnlockedCategories.push('love');
    }
    if (perfectGamesInRow >= 6 && !newUnlockedCategories.includes('wisdom')) {
      newUnlockedCategories.push('wisdom');
    }

    // Determine next category (cycle through unlocked ones)
    const currentIndex = newUnlockedCategories.indexOf(gameState.currentCategory);
    const nextCategoryIndex = (currentIndex + 1) % newUnlockedCategories.length;
    const nextCategory = newUnlockedCategories[nextCategoryIndex];

    // Determine difficulty based on perfect games
    let nextDifficulty: 'easy' | 'medium' | 'hard' = 'easy';
    let nextLevel = currentLevel;
    
    if (perfectGamesInRow >= 3) {
      nextDifficulty = 'medium';
      nextLevel = Math.max(2, currentLevel);
    }
    if (perfectGamesInRow >= 6) {
      nextDifficulty = 'hard';
      nextLevel = Math.max(3, currentLevel);
    }

    return {
      category: nextCategory,
      difficulty: nextDifficulty,
      level: nextLevel,
      unlockedCategories: newUnlockedCategories
    };
  };

  // Initialize game
  const initializeGame = useCallback(() => {
    const nextSettings = getNextGameSettings();
    const categoryVerses = bibleVerses.filter(verse => verse.category === nextSettings.category);
    const gameVerses = categoryVerses.slice(0, nextSettings.difficulty === 'easy' ? 4 : nextSettings.difficulty === 'medium' ? 6 : 8);
    
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
      currentCategory: nextSettings.category,
      difficulty: nextSettings.difficulty,
      currentLevel: nextSettings.level,
      unlockedCategories: nextSettings.unlockedCategories
    }));
  }, [gameState.perfectGamesInRow, gameState.unlockedCategories, gameState.currentLevel, bibleVerses]);

  // Handle card click
  const handleCardClick = useCallback((clickedCard: Card) => {
    if (clickedCard.flipped || clickedCard.matched || gameState.flippedCards.length >= 2) {
      return;
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

          // Play success sound (you can add actual audio here)
          console.log('🎉 Match found!');
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

          console.log('❌ No match');
        }
      }, 1000);
    }
  }, [gameState.cards, gameState.flippedCards, gameState.matches, gameState.attempts, gameState.score, gameState.streak, gameState.timeElapsed, gameState.difficulty]);

  // Save game completion and handle progression
  useEffect(() => {
    if (gameState.gameCompleted) {
      const newBestScore = Math.max(gameState.score, gameState.bestScore);
      const isPerfectGame = gameState.attempts === gameState.matches; // Perfect game = no wrong attempts
      const newPerfectGamesInRow = isPerfectGame ? gameState.perfectGamesInRow + 1 : 0;
      
      // Update progression
      const nextSettings = getNextGameSettings();
      
      const saveData = {
        bestScore: newBestScore,
        perfectGamesInRow: newPerfectGamesInRow,
        currentCategory: nextSettings.category,
        unlockedCategories: nextSettings.unlockedCategories,
        currentLevel: nextSettings.level,
        difficulty: nextSettings.difficulty
      };
      
      localStorage.setItem('bible-memory-match-data', JSON.stringify(saveData));
      
      setGameState(prev => ({ 
        ...prev, 
        bestScore: newBestScore,
        perfectGamesInRow: newPerfectGamesInRow,
        currentCategory: nextSettings.category,
        unlockedCategories: nextSettings.unlockedCategories,
        currentLevel: nextSettings.level,
        difficulty: nextSettings.difficulty
      }));
    }
  }, [gameState.gameCompleted, gameState.score, gameState.bestScore, gameState.attempts, gameState.matches]);

  // Auto-continue timer
  useEffect(() => {
    if (gameState.gameCompleted) {
      setAutoContinueTimer(3);
      const timer = setInterval(() => {
        setAutoContinueTimer(prev => {
          if (prev <= 1) {
            initializeGame();
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameState.gameCompleted, initializeGame]);

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
      {/* Osmo Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[var(--accent-primary)]/10 to-[var(--accent-secondary)]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-[var(--spiritual-blue)]/10 to-[var(--spiritual-cyan)]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-[var(--spiritual-green)]/5 to-[var(--spiritual-blue)]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Osmo Hero Section */}
        <div className="text-center mb-12">
          <OsmoBadge variant="primary" className="mb-6">
            ✨ Bible Memory Challenge
          </OsmoBadge>
          
          <OsmoGradientText className="text-4xl md:text-6xl font-bold mb-6">
            Bible Verse Match
          </OsmoGradientText>
          
          <p className="text-[var(--text-secondary)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
            Strengthen your faith through God's Word. Match verses with their references and grow in spiritual knowledge.
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

        {/* Game Progress Info */}
        {!gameState.gameStarted && !gameState.gameCompleted && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Current Progress */}
            <OsmoCard className="p-6">
              <OsmoSectionHeader title="Your Progress" subtitle="Track your spiritual growth journey" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--accent-primary)] mb-2">
                    {categories.find(cat => cat.id === gameState.currentCategory)?.name}
                  </div>
                  <div className="text-[var(--text-secondary)] text-sm">Current Category</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--spiritual-blue)] mb-2">
                    {gameState.difficulty === 'easy' ? '4' : gameState.difficulty === 'medium' ? '6' : '8'} Pairs
                  </div>
                  <div className="text-[var(--text-secondary)] text-sm">Difficulty Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--spiritual-green)] mb-2">
                    {gameState.unlockedCategories.length}/4
                  </div>
                  <div className="text-[var(--text-secondary)] text-sm">Categories Unlocked</div>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="flex justify-center space-x-4 md:space-x-6 mt-6">
                <OsmoCard className="px-4 py-3 text-center">
                  <div className="text-[var(--accent-primary)] font-bold text-lg">Level {gameState.currentLevel}</div>
                  <div className="text-[var(--text-tertiary)] text-sm">
                    {gameState.difficulty === 'easy' ? 'Beginner' : 
                     gameState.difficulty === 'medium' ? 'Intermediate' : 'Advanced'}
                  </div>
                </OsmoCard>
                <OsmoCard className="px-4 py-3 text-center">
                  <div className="text-[var(--spiritual-blue)] font-bold text-lg">{gameState.bestScore.toLocaleString()}</div>
                  <div className="text-[var(--text-tertiary)] text-sm">Best Score</div>
                </OsmoCard>
                <OsmoCard className="px-4 py-3 text-center">
                  <div className="text-[var(--spiritual-green)] font-bold text-lg">{gameState.perfectGamesInRow}</div>
                  <div className="text-[var(--text-tertiary)] text-sm">Perfect Games</div>
                </OsmoCard>
              </div>
              
              {/* Reset Button */}
              <div className="mt-6 text-center">
                <OsmoButton
                  onClick={resetAllProgress}
                  variant="secondary"
                  size="sm"
                  className="px-6 py-2"
                >
                  Reset All Progress
                </OsmoButton>
              </div>
            </OsmoCard>

            {/* Unlocked Categories Display */}
            <OsmoCard className="p-6">
              <OsmoSectionHeader title="Unlocked Categories" subtitle="Categories you've earned access to" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {categories.map((category) => {
                  const isUnlocked = gameState.unlockedCategories.includes(category.id);
                  return (
                    <div
                      key={category.id}
                      className={`text-center p-4 rounded-xl border-2 transition-all duration-300 ${
                        isUnlocked 
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' 
                          : 'border-[var(--bg-tertiary)] bg-[var(--bg-tertiary)]/30 opacity-50'
                      }`}
                    >
                      <div className="text-2xl mb-2">
                        {category.icon}
          </div>
                      <div className={`font-semibold text-sm ${
                        isUnlocked ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
                      }`}>
                        {category.name}
                      </div>
                      {isUnlocked ? (
                        <div className="text-[var(--accent-primary)] text-xs mt-1">✓ Unlocked</div>
                      ) : (
                        <div className="text-[var(--text-tertiary)] text-xs mt-1">Locked</div>
                      )}
                    </div>
                  );
                })}
                  </div>
                </OsmoCard>
              </div>
            )}

        {/* Game in Progress */}
        {gameState.gameStarted && !gameState.gameCompleted && (
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Osmo Game Board */}
            <OsmoCard className="p-6">
              <div className={`grid ${getGridClasses()} max-w-4xl mx-auto`}>
                {gameState.cards.map((card, index) => (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    className={`group aspect-square cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      card.flipped || card.matched ? 'rotate-y-180' : ''
                    }`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Card Back - Bible-Themed Design */}
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-secondary)] border-2 border-[var(--border-primary)] shadow-lg flex items-center justify-center ${
                      card.flipped || card.matched ? 'opacity-0' : 'opacity-100'
                    } transition-opacity duration-300 group-hover:border-[var(--accent-primary)] group-hover:shadow-xl`}>
                      {/* Bible Icon with Decorative Elements */}
                      <div className="relative">
                        {/* Main Christian Cross Icon */}
                        <svg className="w-12 h-12 text-[var(--accent-primary)]/70 group-hover:text-[var(--accent-primary)] transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M10 2h4v6h8v4h-8v8h-4v-8H2V8h8V2z"/>
                        </svg>
                        
                        {/* Decorative Elements */}
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--accent-primary)] rounded-full group-hover:scale-110 transition-transform duration-300"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[var(--spiritual-blue)] rounded-full group-hover:scale-110 transition-transform duration-300"></div>
                        
                        {/* Subtle Pattern Overlay */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="w-full h-full bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
                        </div>
                      </div>
                    </div>

                    {/* Card Front - Osmo Content */}
                    <div className={`absolute inset-0 rounded-xl shadow-lg border-2 p-3 md:p-4 flex items-center justify-center text-center ${
                      card.flipped || card.matched ? 'opacity-100' : 'opacity-0'
                    } transition-opacity duration-300 ${
                      card.matched 
                        ? 'border-[var(--spiritual-green)] bg-[var(--spiritual-green)]/10' 
                        : 'border-[var(--spiritual-blue)] bg-[var(--spiritual-blue)]/10'
                    }`}>
                      <div className={`text-xs md:text-sm font-semibold leading-tight ${
                        card.type === 'verse' 
                          ? 'text-[var(--text-primary)]' 
                          : 'text-[var(--accent-primary)] font-bold'
                      }`}>
                        {card.content}
                      </div>
                      {card.matched && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-[var(--spiritual-green)] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </OsmoCard>

            {/* Reset Button */}
            <div className="text-center">
              <OsmoButton
                onClick={resetGame}
                variant="secondary"
                size="lg"
                className="px-8 py-3"
              >
                New Game
              </OsmoButton>
            </div>
            
            {/* Mobile Responsive Stats Below Game */}
            <OsmoCard className="p-4 md:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 text-center">
                <div className="bg-[var(--bg-tertiary)]/30 rounded-lg md:rounded-xl p-3 md:p-4">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[var(--spiritual-blue)] mb-1">{formatTime(gameState.timeElapsed)}</div>
                  <div className="text-[var(--text-tertiary)] text-xs sm:text-sm font-semibold">⏱️ Time</div>
                </div>
                <div className="bg-[var(--bg-tertiary)]/30 rounded-lg md:rounded-xl p-3 md:p-4">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[var(--spiritual-green)] mb-1">{gameState.matches}</div>
                  <div className="text-[var(--text-tertiary)] text-xs sm:text-sm font-semibold">🎯 Matches</div>
                </div>
                <div className="bg-[var(--bg-tertiary)]/30 rounded-lg md:rounded-xl p-3 md:p-4">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[var(--accent-primary)] mb-1">{gameState.attempts}</div>
                  <div className="text-[var(--text-tertiary)] text-xs sm:text-sm font-semibold">🔄 Attempts</div>
                </div>
                <div className="bg-[var(--bg-tertiary)]/30 rounded-lg md:rounded-xl p-3 md:p-4">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[var(--spiritual-cyan)] mb-1">{gameState.streak}</div>
                  <div className="text-[var(--text-tertiary)] text-xs sm:text-sm font-semibold">🔥 Streak</div>
                </div>
                <div className="bg-[var(--bg-tertiary)]/30 rounded-lg md:rounded-xl p-3 md:p-4 col-span-2 sm:col-span-1">
                  <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[var(--accent-primary)] mb-1">{gameState.score.toLocaleString()}</div>
                  <div className="text-[var(--text-tertiary)] text-xs sm:text-sm font-semibold">⭐ Points</div>
                </div>
              </div>
            </OsmoCard>
            
            {/* Game Progress Text Below Stats */}
            <div className="text-center mt-6">
              <OsmoBadge variant="primary" className="mb-4">
                🎯 Game in Progress
              </OsmoBadge>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">
                {categories.find(cat => cat.id === gameState.currentCategory)?.name} Challenge
              </h2>
              <p className="text-[var(--text-secondary)] text-sm sm:text-base md:text-lg">
                Strengthen your faith through God's Word. Match verses with their references and grow in spiritual knowledge.
              </p>
              <p className="text-[var(--text-secondary)] mt-2 text-sm sm:text-base">
                Match the verses with their references to complete the challenge!
              </p>
            </div>
          </div>
        )}

        {/* Game Completed */}
        {gameState.gameCompleted && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Osmo Victory Celebration */}
            <OsmoCard className="p-8 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <OsmoGradientText className="text-3xl md:text-4xl font-bold mb-4">
                Challenge Completed!
              </OsmoGradientText>
              <p className="text-[var(--text-secondary)] text-lg md:text-xl mb-4">
                You've successfully completed the {categories.find(cat => cat.id === gameState.currentCategory)?.name} challenge!
              </p>
              
              {/* Perfect Game Bonus */}
              {gameState.attempts === gameState.matches && (
                <div className="bg-gradient-to-r from-[var(--spiritual-green)]/20 to-[var(--accent-primary)]/20 border border-[var(--spiritual-green)]/50 rounded-xl p-4 mb-4">
                  <div className="text-2xl mb-2">✨ Perfect Game!</div>
                  <div className="text-[var(--spiritual-green)] font-semibold">
                    No wrong attempts - You're getting better!
                  </div>
                </div>
              )}
              
              {/* Level Up Notification */}
              {gameState.perfectGamesInRow > 0 && (
                <div className="bg-gradient-to-r from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/20 border border-[var(--accent-primary)]/50 rounded-xl p-4 mb-4">
                  <div className="text-2xl mb-2">🚀 {gameState.perfectGamesInRow} Perfect Games in a Row!</div>
                  <div className="text-[var(--accent-primary)] font-semibold">
                    Keep going to unlock new categories and increase difficulty!
                  </div>
                </div>
              )}
            </OsmoCard>

            {/* Osmo Results */}
            <OsmoCard className="p-6">
              <OsmoSectionHeader title="🎯 Final Results" subtitle="Your performance summary" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-6">
                <div className="bg-[var(--bg-tertiary)]/30 rounded-xl p-4">
                  <div className="text-2xl md:text-3xl font-bold text-[var(--spiritual-blue)] mb-1">{formatTime(gameState.timeElapsed)}</div>
                  <div className="text-[var(--text-tertiary)] text-sm font-semibold">⏱️ Time</div>
                </div>
                <div className="bg-[var(--bg-tertiary)]/30 rounded-xl p-4">
                  <div className="text-2xl md:text-3xl font-bold text-[var(--accent-primary)] mb-1">{gameState.attempts}</div>
                  <div className="text-[var(--text-tertiary)] text-sm font-semibold">🔄 Attempts</div>
                </div>
                <div className="bg-[var(--bg-tertiary)]/30 rounded-xl p-4">
                  <div className="text-2xl md:text-3xl font-bold text-[var(--spiritual-cyan)] mb-1">{gameState.perfectMatches}</div>
                  <div className="text-[var(--text-tertiary)] text-sm font-semibold">✨ Perfect</div>
                </div>
                <div className="bg-[var(--bg-tertiary)]/30 rounded-xl p-4">
                  <div className="text-2xl md:text-3xl font-bold text-[var(--accent-primary)] mb-1">{gameState.score.toLocaleString()}</div>
                  <div className="text-[var(--text-tertiary)] text-sm font-semibold">⭐ Points</div>
                </div>
              </div>
              
              {gameState.score === gameState.bestScore && gameState.bestScore > 0 && (
                <div className="mt-6 text-center">
                  <OsmoBadge variant="primary" className="text-lg">
                    🎉 New Personal Best!
                  </OsmoBadge>
                  <div className="text-[var(--text-secondary)] text-sm mt-2">You've set a new record!</div>
                </div>
              )}
            </OsmoCard>

            {/* Auto Continue Timer */}
            <OsmoCard className="p-6 text-center">
                  <div className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                🎮 Next Level Starting in...
                  </div>
                  <div className="text-4xl font-bold text-[var(--accent-primary)] mb-4">
                    {autoContinueTimer}
                  </div>
                  <div className="text-[var(--text-secondary)] text-sm mb-4">
                The game will automatically continue to the next challenge
                  </div>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <OsmoButton
                  onClick={initializeGame}
                  variant="primary"
                  size="lg"
                  className="text-lg px-8 py-4"
                >
                  Continue Now
                </OsmoButton>
                <OsmoButton
                  onClick={resetGame}
                  variant="secondary"
                  size="lg"
                  className="text-lg px-8 py-4"
                >
                  Take a Break
                </OsmoButton>
              </div>
            </OsmoCard>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 md:mt-12 max-w-4xl mx-auto">
          <OsmoCard className="p-6">
            <OsmoSectionHeader title="How to Play" subtitle="Learn the basics of Bible Verse Match" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-white mb-1 md:mb-2 text-sm md:text-base">Choose Category</h4>
                <p className="text-xs text-gray-400 leading-tight">Select from Popular Verses, Faith, Love, or Wisdom</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-white mb-1 md:mb-2 text-sm md:text-base">Flip Cards</h4>
                <p className="text-xs text-gray-400 leading-tight">Click cards to reveal Bible verses and references</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-white mb-1 md:mb-2 text-sm md:text-base">Find Matches</h4>
                <p className="text-xs text-gray-400 leading-tight">Match each verse with its correct Bible reference</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h4 className="font-medium text-white mb-1 md:mb-2 text-sm md:text-base">Score Points</h4>
                <p className="text-xs text-gray-400 leading-tight">Earn bonus points for speed and perfect matches</p>
              </div>
            </div>
          </OsmoCard>
        </div>
      </div>
    </div>
  );
};

export default BibleVerseMemoryMatch;
