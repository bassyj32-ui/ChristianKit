import React, { useState, useEffect } from 'react';
import { saveGameScore, checkDailyChallenges, type GameScore, type DailyChallenge } from '../services/gameService';

interface BibleQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  verse: string;
  reward: number;
}

interface PlayerState {
  faithPoints: number;
  level: number;
  currentLocation: string;
  completedQuizzes: string[];
  prayerRequests: string[];
}

const BibleQuest: React.FC = () => {
  const [player, setPlayer] = useState<PlayerState>({
    faithPoints: 0,
    level: 1,
    currentLocation: 'Garden of Eden',
    completedQuizzes: [],
    prayerRequests: [],
  });

  const [questions, setQuestions] = useState<BibleQuestion[]>([
    {
      id: 'q1',
      question: 'Who built the ark?',
      options: ['Noah', 'Moses', 'David', 'Abraham'],
      correctAnswer: 'Noah',
      verse: 'Genesis 6:14',
      reward: 100,
    },
    {
      id: 'q2',
      question: 'What is John 3:16 about?',
      options: ['God\'s love', 'Creation', 'The flood', 'Ten Commandments'],
      correctAnswer: 'God\'s love',
      verse: 'John 3:16',
      reward: 150,
    },
    {
      id: 'q3',
      question: 'Who was thrown into the lion\'s den?',
      options: ['Daniel', 'David', 'Joseph', 'Moses'],
      correctAnswer: 'Daniel',
      verse: 'Daniel 6:16',
      reward: 120,
    },
    {
      id: 'q4',
      question: 'What did Jesus turn water into?',
      options: ['Wine', 'Oil', 'Milk', 'Honey'],
      correctAnswer: 'Wine',
      verse: 'John 2:9',
      reward: 130,
    },
  ]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isPrayerPrompt, setIsPrayerPrompt] = useState(false);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<GameScore[]>([]);
  const [prayerInput, setPrayerInput] = useState('');

  // Load daily challenges and leaderboard
  useEffect(() => {
    const loadData = async () => {
      try {
        const challenges = await checkDailyChallenges(dailyChallenges, { score: player.faithPoints, level: player.level });
        setDailyChallenges(challenges);
        const scores = await saveGameScore({ score: player.faithPoints, userId: 'anonymous', level: player.level });
        setLeaderboard(scores);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, [player.faithPoints, player.level]);

  const handleAnswer = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (answer === currentQuestion.correctAnswer) {
      setPlayer(prev => ({
        ...prev,
        faithPoints: prev.faithPoints + currentQuestion.reward,
        completedQuizzes: [...prev.completedQuizzes, currentQuestion.id],
      }));
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setPlayer(prev => ({
          ...prev,
          level: prev.level + 1,
          currentLocation: getNextLocation(prev.currentLocation),
        }));
        setCurrentQuestionIndex(0);
      }
      setIsPrayerPrompt(true); // Trigger prayer prompt after correct answer
    }
  };

  const getNextLocation = (current: string) => {
    const locations = ['Garden of Eden', 'Noah\'s Ark', 'Mount Sinai', 'Jerusalem'];
    const currentIndex = locations.indexOf(current);
    return locations[(currentIndex + 1) % locations.length];
  };

  const submitPrayerRequest = () => {
    if (prayerInput.trim()) {
      setPlayer(prev => ({
        ...prev,
        prayerRequests: [...prev.prayerRequests, prayerInput.trim()],
      }));
      setPrayerInput('');
      setIsPrayerPrompt(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-purple-900 flex flex-col items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* Animated Background - Mobile Optimized */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-5 w-20 h-20 sm:top-20 sm:left-10 sm:w-32 sm:h-32 bg-gradient-to-br from-amber-400/20 to-yellow-500/20 rounded-full blur-2xl sm:blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-5 w-16 h-16 sm:bottom-40 sm:right-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-xl sm:blur-2xl animate-bounce" />
      </div>

      {/* Game Content - Mobile First */}
      <div className="relative w-full max-w-sm sm:max-w-2xl mx-auto text-center z-10 px-2 sm:px-4">
        {/* Title - Mobile Optimized */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
          📖 Bible Quest
        </h1>
        
        {/* Player Stats - Mobile Optimized */}
        <div className="bg-black/30 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 border border-amber-400/50">
          <p className="text-lg sm:text-xl text-blue-200 mb-2 sm:mb-4">📍 {player.currentLocation}</p>
          <p className="text-base sm:text-lg text-white">💎 {player.faithPoints} pts | 🎯 Level {player.level}</p>
        </div>

        {/* Quiz Section - Mobile First */}
        {!isPrayerPrompt && (
          <div className="bg-gradient-to-br from-blue-800/90 to-purple-800/90 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-amber-400/50 shadow-2xl">
            {/* Question - Mobile Optimized */}
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              {questions[currentQuestionIndex].question}
            </h2>
            
            {/* Bible Verse - Mobile Optimized */}
            <p className="text-amber-300 italic mb-4 sm:mb-6 text-sm sm:text-base">
              📖 {questions[currentQuestionIndex].verse}
            </p>
            
            {/* Answer Options - Mobile First Grid */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {questions[currentQuestionIndex].options.map(option => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 sm:px-4 sm:py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg text-sm sm:text-base min-h-[48px] sm:min-h-[56px] flex items-center justify-center"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prayer Prompt Modal - Mobile First */}
        {isPrayerPrompt && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-blue-900 to-purple-900 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-amber-400 max-w-sm sm:max-w-md mx-auto text-center w-full">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">🙏 Prayer Moment</h3>
              <p className="text-blue-100 mb-4 text-sm sm:text-base">
                Reflect on {questions[currentQuestionIndex].verse}
              </p>
              
              {/* Prayer Input - Mobile Optimized */}
              <input
                type="text"
                placeholder="Share a prayer request..."
                value={prayerInput}
                className="w-full p-3 rounded-xl bg-blue-800/50 text-white border border-amber-400/50 mb-4 text-sm sm:text-base placeholder-blue-300/60"
                onChange={(e) => setPrayerInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && submitPrayerRequest()}
              />
              
              {/* Continue Button - Mobile Optimized */}
              <button
                onClick={submitPrayerRequest}
                className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-6 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all duration-200 text-sm sm:text-base min-h-[48px]"
              >
                Continue Quest
              </button>
            </div>
          </div>
        )}

        {/* Leaderboard - Mobile Optimized */}
        <div className="mt-4 sm:mt-6 bg-black/30 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-blue-400/50">
          <h3 className="text-base sm:text-lg font-bold text-blue-400 mb-2 sm:mb-3">🏆 Leaderboard</h3>
          <div className="space-y-1 sm:space-y-2">
            {leaderboard.slice(0, 5).map((score, index) => (
              <div key={index} className="text-blue-200 text-xs sm:text-sm flex justify-between items-center">
                <span className="truncate">{score.userId}</span>
                <span className="font-semibold">{score.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BibleQuest;
