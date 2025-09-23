import React from 'react';

interface GameHeaderProps {
  score: number;
  matches: number;
  totalPairs: number;
  timeElapsed: number;
  difficulty: 'easy' | 'medium' | 'hard';
  streak: number;
  bestScore: number;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  score,
  matches,
  totalPairs,
  timeElapsed,
  difficulty,
  streak,
  bestScore
}) => {
  const getLevelTheme = () => {
    switch (difficulty) {
      case 'easy':
        return {
          bg: 'from-emerald-500 to-teal-600',
          text: 'text-emerald-600',
          badge: 'bg-emerald-100 text-emerald-800'
        };
      case 'medium':
        return {
          bg: 'from-amber-500 to-orange-600',
          text: 'text-amber-600',
          badge: 'bg-amber-100 text-amber-800'
        };
      case 'hard':
        return {
          bg: 'from-purple-500 to-indigo-600',
          text: 'text-purple-600',
          badge: 'bg-purple-100 text-purple-800'
        };
      default:
        return {
          bg: 'from-blue-500 to-blue-600',
          text: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800'
        };
    }
  };

  const theme = getLevelTheme();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyLabel = () => {
    switch (difficulty) {
      case 'easy': return 'Beginner';
      case 'medium': return 'Intermediate';
      case 'hard': return 'Advanced';
      default: return 'Beginner';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-4 sm:mb-6">
      {/* Level Badge */}
      <div className="flex justify-center mb-3 sm:mb-4">
        <div className={`
          px-3 sm:px-4 py-1 sm:py-2 rounded-full
          ${theme.badge}
          text-xs sm:text-sm font-semibold
          shadow-md
        `}>
          {getDifficultyLabel()} Level
        </div>
      </div>

      {/* Main Stats */}
      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {/* Score */}
          <div className="text-center">
            <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${theme.text}`}>
              {score.toLocaleString()}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Score</div>
          </div>

          {/* Progress */}
          <div className="text-center">
            <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${theme.text}`}>
              {matches}/{totalPairs}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Matches</div>
          </div>

          {/* Time */}
          <div className="text-center">
            <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${theme.text}`}>
              {formatTime(timeElapsed)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Time</div>
          </div>

          {/* Streak */}
          <div className="text-center">
            <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${theme.text}`}>
              {streak}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Streak</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 sm:mt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs sm:text-sm text-gray-600">Progress</span>
            <span className="text-xs sm:text-sm text-gray-600">
              {Math.round((matches / totalPairs) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
            <div 
              className={`bg-gradient-to-r ${theme.bg} h-2 sm:h-3 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${(matches / totalPairs) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Best Score */}
      {bestScore > 0 && (
        <div className="text-center">
          <div className="text-xs sm:text-sm text-gray-600">
            Best Score: <span className={`font-semibold ${theme.text}`}>
              {bestScore.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
