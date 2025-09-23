import React from 'react';

interface GameCompleteProps {
  score: number;
  bestScore: number;
  isNewBest: boolean;
  timeElapsed: number;
  difficulty: 'easy' | 'medium' | 'hard';
  perfectMatches: number;
  totalMatches: number;
  onNextLevel: () => void;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameComplete: React.FC<GameCompleteProps> = ({
  score,
  bestScore,
  isNewBest,
  timeElapsed,
  difficulty,
  perfectMatches,
  totalMatches,
  onNextLevel,
  onPlayAgain,
  onMainMenu
}) => {
  const getLevelTheme = () => {
    switch (difficulty) {
      case 'easy':
        return {
          bg: 'from-emerald-500 to-teal-600',
          text: 'text-emerald-600',
          button: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
        };
      case 'medium':
        return {
          bg: 'from-amber-500 to-orange-600',
          text: 'text-amber-600',
          button: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
        };
      case 'hard':
        return {
          bg: 'from-purple-500 to-indigo-600',
          text: 'text-purple-600',
          button: 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
        };
      default:
        return {
          bg: 'from-blue-500 to-blue-600',
          text: 'text-blue-600',
          button: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
        };
    }
  };

  const theme = getLevelTheme();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceMessage = () => {
    const accuracy = (perfectMatches / totalMatches) * 100;
    if (accuracy === 100) return "Perfect! 🌟";
    if (accuracy >= 80) return "Excellent! 🎉";
    if (accuracy >= 60) return "Great job! 👏";
    return "Keep practicing! 💪";
  };

  const canAdvance = difficulty !== 'hard';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
        {/* Header */}
        <div className={`bg-gradient-to-r ${theme.bg} p-6 text-center`}>
          <div className="text-white text-4xl mb-2">🎉</div>
          <h2 className="text-white text-2xl font-bold mb-1">Level Complete!</h2>
          <p className="text-white/90 text-sm">{getPerformanceMessage()}</p>
        </div>

        {/* Stats */}
        <div className="p-6 space-y-4">
          {/* Score */}
          <div className="text-center">
            <div className={`text-4xl font-bold ${theme.text} mb-1`}>
              {score.toLocaleString()}
            </div>
            <div className="text-gray-600 text-sm">Final Score</div>
            {isNewBest && (
              <div className="text-yellow-600 text-xs font-semibold mt-1 animate-pulse">
                🏆 New Best Score!
              </div>
            )}
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-100">
            <div className="text-center">
              <div className={`text-lg font-semibold ${theme.text}`}>
                {formatTime(timeElapsed)}
              </div>
              <div className="text-xs text-gray-600">Time</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-semibold ${theme.text}`}>
                {Math.round((perfectMatches / totalMatches) * 100)}%
              </div>
              <div className="text-xs text-gray-600">Accuracy</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-semibold ${theme.text}`}>
                {bestScore.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600">Best</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Auto-advance message */}
            {canAdvance && (
              <div className="text-center text-sm text-gray-600 mb-4">
                Auto-advancing to next level in 3 seconds...
              </div>
            )}

            {/* Primary Action */}
            {canAdvance ? (
              <button
                onClick={onNextLevel}
                className={`
                  w-full ${theme.button}
                  text-white font-semibold py-3 px-6 rounded-xl
                  transform transition-all duration-200
                  hover:scale-105 active:scale-95
                  shadow-lg
                `}
              >
                Continue to Next Level →
              </button>
            ) : (
              <button
                onClick={onPlayAgain}
                className={`
                  w-full ${theme.button}
                  text-white font-semibold py-3 px-6 rounded-xl
                  transform transition-all duration-200
                  hover:scale-105 active:scale-95
                  shadow-lg
                `}
              >
                Play Again
              </button>
            )}

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onPlayAgain}
                className="
                  bg-gray-100 hover:bg-gray-200 text-gray-700
                  font-medium py-2 px-4 rounded-xl
                  transform transition-all duration-200
                  hover:scale-105 active:scale-95
                  text-sm
                "
              >
                Play Again
              </button>
              <button
                onClick={onMainMenu}
                className="
                  bg-gray-100 hover:bg-gray-200 text-gray-700
                  font-medium py-2 px-4 rounded-xl
                  transform transition-all duration-200
                  hover:scale-105 active:scale-95
                  text-sm
                "
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
