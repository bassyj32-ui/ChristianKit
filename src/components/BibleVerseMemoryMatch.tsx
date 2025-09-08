import { useState, useEffect, useCallback } from 'react';

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
    perfectMatches: 0
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('popular');
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);

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
      setGameState(prev => ({ ...prev, bestScore: data.bestScore || 0 }));
    }
  }, []);

  // Initialize game
  const initializeGame = useCallback(() => {
    const categoryVerses = bibleVerses.filter(verse => verse.category === selectedCategory);
    const gameVerses = categoryVerses.slice(0, gameState.difficulty === 'easy' ? 4 : gameState.difficulty === 'medium' ? 6 : 8);
    
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
      perfectMatches: 0
    }));
  }, [selectedCategory, gameState.difficulty, bibleVerses]);

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

  // Save game completion
  useEffect(() => {
    if (gameState.gameCompleted) {
      const newBestScore = Math.max(gameState.score, gameState.bestScore);
      localStorage.setItem('bible-memory-match-data', JSON.stringify({
        bestScore: newBestScore
      }));
      setGameState(prev => ({ ...prev, bestScore: newBestScore }));
    }
  }, [gameState.gameCompleted, gameState.score, gameState.bestScore]);

  // Reset game
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-500/3 to-blue-500/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Bible Verse Match
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Match verses with their references
          </p>
        </div>

        {/* Game Setup */}
        {!gameState.gameStarted && !gameState.gameCompleted && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Start Game Button - Moved to Top */}
            <div className="text-center">
              <button
                onClick={initializeGame}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 w-full md:w-auto"
              >
                Start Game
              </button>
            </div>

            {/* Category Selection */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700/50">
              <h2 className="text-lg md:text-xl font-semibold text-white mb-4">Category</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`group relative p-3 md:p-4 rounded-lg border transition-all duration-300 ${
                      selectedCategory === category.id
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300 hover:text-white hover:bg-gray-700/70'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1 md:space-y-2">
                      <div className="group-hover:scale-110 transition-transform duration-300">{category.icon}</div>
                      <div className="font-medium text-xs md:text-sm text-center leading-tight">{category.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Selection */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700/50">
              <h2 className="text-lg md:text-xl font-semibold text-white mb-4">Difficulty</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { 
                    id: 'easy', 
                    name: 'Easy', 
                    pairs: '4 pairs', 
                    color: 'from-emerald-500 to-green-500', 
                    icon: (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    )
                  },
                  { 
                    id: 'medium', 
                    name: 'Medium', 
                    pairs: '6 pairs', 
                    color: 'from-amber-500 to-orange-500', 
                    icon: (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    )
                  },
                  { 
                    id: 'hard', 
                    name: 'Hard', 
                    pairs: '8 pairs', 
                    color: 'from-red-500 to-rose-500', 
                    icon: (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    )
                  }
                ].map((diff, index) => (
                  <button
                    key={diff.id}
                    onClick={() => setGameState(prev => ({ ...prev, difficulty: diff.id as 'easy' | 'medium' | 'hard' }))}
                    className={`group relative p-3 md:p-4 rounded-lg border transition-all duration-300 ${
                      gameState.difficulty === diff.id
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300 hover:text-white hover:bg-gray-700/70'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1 md:space-y-2">
                      <div className="group-hover:scale-110 transition-transform duration-300">{diff.icon}</div>
                      <div className="font-medium text-xs md:text-sm">{diff.name}</div>
                      <div className="text-xs opacity-70">{diff.pairs}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>


            {/* Stats Display */}
            {gameState.bestScore > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700/50 text-center">
                <h3 className="text-base md:text-lg font-semibold text-white mb-2">Best Score</h3>
                <div className="text-2xl md:text-3xl font-bold text-blue-400">
                  {gameState.bestScore.toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Game Board */}
        {gameState.gameStarted && !gameState.gameCompleted && (
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Game Stats */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-gray-700/50">
              <div className="grid grid-cols-5 gap-2 md:gap-4 text-center">
                <div>
                  <div className="text-lg md:text-xl font-bold text-blue-400">{formatTime(gameState.timeElapsed)}</div>
                  <div className="text-xs text-gray-400">Time</div>
                </div>
                <div>
                  <div className="text-lg md:text-xl font-bold text-green-400">{gameState.matches}</div>
                  <div className="text-xs text-gray-400">Matches</div>
                </div>
                <div>
                  <div className="text-lg md:text-xl font-bold text-orange-400">{gameState.attempts}</div>
                  <div className="text-xs text-gray-400">Attempts</div>
                </div>
                <div>
                  <div className="text-lg md:text-xl font-bold text-purple-400">{gameState.streak}</div>
                  <div className="text-xs text-gray-400">Streak</div>
                </div>
                <div>
                  <div className="text-lg md:text-xl font-bold text-yellow-400">{gameState.score.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Score</div>
                </div>
              </div>
            </div>

            {/* Game Board */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700/50">
              <div className={`grid ${getGridClasses()} max-w-4xl mx-auto`}>
                {gameState.cards.map((card, index) => (
                  <div
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    className={`group aspect-square cursor-pointer transition-all duration-300 ${
                      card.flipped || card.matched ? 'rotate-y-180' : ''
                    }`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Card Back - Christian Cross Design */}
                    <div className={`absolute inset-0 rounded-xl bg-white shadow-lg flex items-center justify-center ${
                      card.flipped || card.matched ? 'opacity-0' : 'opacity-100'
                    } transition-opacity duration-300`}>
                      {/* Christian Cross */}
                      <div className="relative w-12 h-16">
                        {/* Vertical bar (main cross) */}
                        <div className="absolute left-1/2 top-0 w-2 h-full bg-red-600 transform -translate-x-1/2 rounded-sm"></div>
                        {/* Horizontal bar (cross beam) */}
                        <div className="absolute top-1/3 left-0 w-full h-2 bg-red-600 transform -translate-y-1/2 rounded-sm"></div>
                      </div>
                    </div>

                    {/* Card Front */}
                    <div className={`absolute inset-0 rounded-xl shadow-lg border-2 p-2 md:p-3 flex items-center justify-center text-center ${
                      card.flipped || card.matched ? 'opacity-100' : 'opacity-0'
                    } transition-opacity duration-300 ${
                      card.matched 
                        ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100' 
                        : 'border-gray-300 bg-gradient-to-br from-white to-gray-50'
                    }`}>
                      <div className={`text-xs md:text-sm font-medium leading-tight ${
                        card.type === 'verse' 
                          ? 'text-gray-800' 
                          : 'text-blue-700 font-bold'
                      }`}>
                        {card.content}
                      </div>
                      {card.matched && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <div className="text-center">
              <button
                onClick={resetGame}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 w-full md:w-auto"
              >
                New Game
              </button>
            </div>
          </div>
        )}

        {/* Game Completed */}
        {gameState.gameCompleted && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Celebration */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 md:p-8 text-white text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-4">Congratulations!</h2>
              <p className="text-base md:text-lg">You've successfully matched all the Bible verses!</p>
            </div>

            {/* Final Stats */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700/50">
              <h3 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6 text-center">Final Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-center">
                <div>
                  <div className="text-xl md:text-2xl font-bold text-blue-400">{formatTime(gameState.timeElapsed)}</div>
                  <div className="text-xs text-gray-400">Total Time</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-green-400">{gameState.attempts}</div>
                  <div className="text-xs text-gray-400">Total Attempts</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-purple-400">{gameState.perfectMatches}</div>
                  <div className="text-xs text-gray-400">Perfect Matches</div>
                </div>
                <div>
                  <div className="text-xl md:text-2xl font-bold text-yellow-400">{gameState.score.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Final Score</div>
                </div>
              </div>
              
              {gameState.score === gameState.bestScore && gameState.bestScore > 0 && (
                <div className="mt-4 md:mt-6 bg-yellow-500/20 rounded-lg p-3 md:p-4 text-yellow-300 text-center border border-yellow-500/30">
                  <div className="font-semibold text-sm md:text-base">New Best Score!</div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center">
              <button
                onClick={initializeGame}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 w-full md:w-auto"
              >
                Play Again
              </button>
              <button
                onClick={resetGame}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 w-full md:w-auto"
              >
                New Category
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 md:mt-12 max-w-4xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700/50">
            <h3 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-6 text-center">How to Play</h3>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default BibleVerseMemoryMatch;
