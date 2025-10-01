import React, { useState, useEffect } from 'react';
import { unifiedProgressService, UnifiedProgressStats } from '../services/UnifiedProgressService';
import { useSupabaseAuth } from './SupabaseAuthProvider';

interface EnhancedProgressBotProps {
  position?: 'bottom-right' | 'bottom-left';
  onPrayerStart?: () => void;
}

export const EnhancedProgressBot: React.FC<EnhancedProgressBotProps> = ({ 
  position = 'bottom-right',
  onPrayerStart
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progressStats, setProgressStats] = useState<UnifiedProgressStats | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    loadRealProgress();
    // Show bot after a delay
    setTimeout(() => setIsVisible(true), 3000);
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadRealProgress, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const loadRealProgress = async () => {
    try {
      setLoading(true);
      const stats = await unifiedProgressService.getProgressStats(user?.id);
      setProgressStats(stats);
      
      // Generate personalized message
      const message = generatePersonalizedMessage(stats);
      setCurrentMessage(message);
      
      // Trigger celebration for high streaks
      if (stats.currentStreak >= 7 && stats.currentStreak % 7 === 0) {
        triggerCelebration();
      }
      
    } catch (error) {
      console.error('❌ EnhancedProgressBot: Error loading progress:', error);
      setCurrentMessage('🌱 Ready to start your spiritual journey?');
    } finally {
      setLoading(false);
    }
  };

  const generatePersonalizedMessage = (stats: UnifiedProgressStats): string => {
    const { currentStreak, totalPrayers, currentLevel, daysThisMonth } = stats;

    // Celebration messages for high streaks
    if (currentStreak >= 30) {
      return `🏆 Incredible ${currentStreak}-day streak! You're a spiritual warrior!`;
    }
    if (currentStreak >= 14) {
      return `🔥 Amazing ${currentStreak}-day streak! Your dedication is inspiring!`;
    }
    if (currentStreak >= 7) {
      return `✨ One week strong! ${currentStreak} days of faithful prayer!`;
    }

    // Level-based encouragement
    if (currentLevel === 'advanced') {
      if (currentStreak >= 3) {
        return `🌳 Advanced believer on a ${currentStreak}-day streak! Keep growing!`;
      } else if (currentStreak === 0) {
        return `🌳 Advanced believer, ready to restart your prayer journey?`;
      } else {
        return `🌳 ${currentStreak} day${currentStreak === 1 ? '' : 's'} strong! You've got this!`;
      }
    }

    if (currentLevel === 'intermediate') {
      if (currentStreak >= 3) {
        return `🌿 Growing strong! ${currentStreak} days of consistent prayer!`;
      } else if (currentStreak === 0) {
        return `🌿 Ready to continue your spiritual growth?`;
      } else {
        return `🌿 ${currentStreak} day${currentStreak === 1 ? '' : 's'} in! Building great habits!`;
      }
    }

    // Beginner level
    if (totalPrayers === 0) {
      return `🌱 Welcome! Ready to start your first prayer?`;
    }
    if (currentStreak === 0) {
      return `🌱 You've prayed ${totalPrayers} time${totalPrayers === 1 ? '' : 's'}! Ready for today?`;
    }
    if (currentStreak === 1) {
      return `🌱 Great start! Day 1 complete. Keep the momentum!`;
    }
    if (currentStreak >= 2) {
      return `🌱 Building consistency! ${currentStreak} days strong!`;
    }

    return `🌱 ${daysThisMonth} prayer${daysThisMonth === 1 ? '' : 's'} this month. You're growing!`;
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 14) return 'from-yellow-400 to-orange-500'; // Gold
    if (streak >= 7) return 'from-purple-400 to-pink-500'; // Purple
    if (streak >= 3) return 'from-blue-400 to-indigo-500'; // Blue  
    if (streak >= 1) return 'from-green-400 to-emerald-500'; // Green
    return 'from-gray-400 to-gray-500'; // Gray
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'advanced': return '🌳';
      case 'intermediate': return '🌿';
      default: return '🌱';
    }
  };

  if (!isVisible) return null;

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-8 right-8' 
    : 'bottom-8 left-8';

  return (
    <>
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce">
            <div className="text-6xl animate-pulse">🎉</div>
          </div>
          {/* Simple confetti effect */}
          <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
          <div className="absolute top-1/2 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '0.4s'}}></div>
          <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-green-400 rounded-full animate-ping" style={{animationDelay: '0.6s'}}></div>
        </div>
      )}

      {/* Progress Bot */}
      <div className={`fixed ${positionClasses} z-40 transition-all duration-500 ease-out ${isExpanded ? 'scale-105' : 'hover:scale-105'}`}>
        
        {/* Expanded View */}
        {isExpanded && progressStats && (
          <div className="mb-4 bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20 min-w-[280px] animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="text-xl">{getLevelIcon(progressStats.currentLevel)}</div>
                <div className="text-sm font-medium text-gray-700 capitalize">
                  {progressStats.currentLevel} Level
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Progress Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Current Streak */}
              <div className="text-center p-2 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl">
                <div className="text-lg font-bold text-orange-600">{progressStats.currentStreak}</div>
                <div className="text-xs text-orange-500">Day Streak</div>
              </div>

              {/* Total Prayers */}
              <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <div className="text-lg font-bold text-blue-600">{progressStats.totalPrayers}</div>
                <div className="text-xs text-blue-500">Total Prayers</div>
              </div>

              {/* This Month */}
              <div className="text-center p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <div className="text-lg font-bold text-green-600">{progressStats.daysThisMonth}</div>
                <div className="text-xs text-green-500">This Month</div>
              </div>

              {/* Weekly Goal */}
              <div className="text-center p-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                <div className="text-lg font-bold text-purple-600">{progressStats.weeklyGoal}%</div>
                <div className="text-xs text-purple-500">Weekly Goal</div>
              </div>
            </div>

            {/* Data Source */}
            {progressStats.dataSource !== 'empty' && (
              <div className="text-center text-xs text-gray-400 mb-2">
                📊 Data from: {progressStats.dataSource}
              </div>
            )}
          </div>
        )}

        {/* Compact Bot */}
        <div 
          className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/20 cursor-pointer transition-all duration-300 hover:shadow-3xl max-w-[320px]"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Bot Avatar with Streak Indicator */}
          <div className="flex items-start space-x-3">
            <div className="relative flex-shrink-0">
              {/* Main Avatar */}
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getStreakColor(progressStats?.currentStreak || 0)} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                {loading ? '⏳' : getLevelIcon(progressStats?.currentLevel || 'beginner')}
              </div>
              
              {/* Streak Badge */}
              {progressStats && progressStats.currentStreak > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-pulse">
                  {progressStats.currentStreak}
                </div>
              )}
              
              {/* Pulsing Ring for Active Streaks */}
              {progressStats && progressStats.currentStreak >= 3 && (
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${getStreakColor(progressStats.currentStreak)} animate-ping opacity-20`}></div>
              )}
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-700 leading-relaxed">
                {loading ? 'Loading your progress...' : currentMessage}
              </div>
              
              {/* Quick Stats */}
              {progressStats && !loading && (
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>🔥 {progressStats.currentStreak}</span>
                  <span>📚 {progressStats.totalPrayers}</span>
                  <span className="capitalize">{getLevelIcon(progressStats.currentLevel)} {progressStats.currentLevel}</span>
                </div>
              )}
            </div>
          </div>

          {/* Subtle Expand Hint */}
          <div className="text-center mt-2">
            <div className="text-xs text-gray-400">
              {isExpanded ? '↑ Click to minimize' : '↓ Click for details'}
            </div>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};
















