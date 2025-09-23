import React, { useState, useEffect } from 'react';
import { unifiedProgressService, UnifiedProgressStats } from '../services/UnifiedProgressService';
import { useSupabaseAuth } from './SupabaseAuthProvider';

interface ProfessionalProgressBotProps {
  position?: 'bottom-right' | 'bottom-left';
  onPrayerStart?: () => void;
}

export const ProfessionalProgressBot: React.FC<ProfessionalProgressBotProps> = ({ 
  position = 'bottom-right',
  onPrayerStart
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progressStats, setProgressStats] = useState<UnifiedProgressStats | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    loadProgressData();
    // Show bot after a delay for professional entrance
    setTimeout(() => setIsVisible(true), 2000);
    
    // Auto-refresh every 10 minutes (less frequent for professional use)
    const interval = setInterval(loadProgressData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const stats = await unifiedProgressService.getProgressStats(user?.id);
      setProgressStats(stats);
      
      // Generate professional message
      const message = generateProfessionalMessage(stats);
      setCurrentMessage(message);
      
    } catch (error) {
      console.error('Error loading progress data:', error);
      setCurrentMessage('Ready to begin your spiritual practice');
    } finally {
      setLoading(false);
    }
  };

  const generateProfessionalMessage = (stats: UnifiedProgressStats): string => {
    const { currentStreak, totalPrayers, currentLevel, daysThisMonth } = stats;

    // Professional milestone messages
    if (currentStreak >= 30) {
      return `Exceptional dedication: ${currentStreak} consecutive days of practice`;
    }
    if (currentStreak >= 14) {
      return `Outstanding consistency: ${currentStreak} days of spiritual engagement`;
    }
    if (currentStreak >= 7) {
      return `Strong commitment demonstrated: ${currentStreak} days maintained`;
    }

    // Level-based professional messaging
    if (currentLevel === 'advanced') {
      if (currentStreak >= 3) {
        return `Advanced practitioner: ${currentStreak} days of consistent engagement`;
      } else if (currentStreak === 0) {
        return `Advanced practitioner: Ready to resume your spiritual discipline`;
      } else {
        return `Advanced level: ${currentStreak} day${currentStreak === 1 ? '' : 's'} completed`;
      }
    }

    if (currentLevel === 'intermediate') {
      if (currentStreak >= 3) {
        return `Intermediate progress: ${currentStreak} days of dedicated practice`;
      } else if (currentStreak === 0) {
        return `Intermediate level: Continue building your spiritual foundation`;
      } else {
        return `Developing consistency: ${currentStreak} day${currentStreak === 1 ? '' : 's'} active`;
      }
    }

    // Beginner level - professional tone
    if (totalPrayers === 0) {
      return 'Welcome to your spiritual development journey';
    }
    if (currentStreak === 0) {
      return `${totalPrayers} session${totalPrayers === 1 ? '' : 's'} completed. Ready to continue`;
    }
    if (currentStreak === 1) {
      return 'Foundation established. Building consistent practice';
    }
    if (currentStreak >= 2) {
      return `Developing discipline: ${currentStreak} days of commitment`;
    }

    return `${daysThisMonth} session${daysThisMonth === 1 ? '' : 's'} this month. Progress tracking active`;
  };

  const getProgressPercentage = (current: number, target: number = 7): number => {
    return Math.min(100, Math.round((current / target) * 100));
  };

  const getLevelLabel = (level: string): string => {
    switch (level) {
      case 'advanced': return 'Advanced';
      case 'intermediate': return 'Intermediate';
      default: return 'Foundation';
    }
  };

  if (!isVisible) return null;

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-6 right-6' 
    : 'bottom-6 left-6';

  return (
    <div className={`fixed ${positionClasses} z-40 transition-all duration-500 ease-out`}>
      
      {/* Expanded Professional View */}
      {isExpanded && progressStats && (
        <div className="mb-3 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-2xl min-w-[300px] animate-slideUp">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="text-sm font-medium text-gray-100">
                Spiritual Progress
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-200 transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Professional Stats Grid */}
          <div className="p-4 space-y-4">
            {/* Current Streak with Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Consecutive Days</span>
                <span className="text-lg font-semibold text-white">{progressStats.currentStreak}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage(progressStats.currentStreak)}%` }}
                ></div>
              </div>
            </div>

            {/* Professional Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-white">{progressStats.totalPrayers}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">{progressStats.daysThisMonth}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">This Month</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-white">{progressStats.weeklyGoal}%</div>
                <div className="text-xs text-gray-400 uppercase tracking-wide">Weekly</div>
              </div>
            </div>

            {/* Level Indicator */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
              <span className="text-sm text-gray-300">Level</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  progressStats.currentLevel === 'advanced' ? 'bg-yellow-500' :
                  progressStats.currentLevel === 'intermediate' ? 'bg-blue-500' : 'bg-gray-500'
                }`}></div>
                <span className="text-sm font-medium text-gray-100">
                  {getLevelLabel(progressStats.currentLevel)}
                </span>
              </div>
            </div>

            {/* Data Source - Subtle */}
            {progressStats.dataSource !== 'empty' && (
              <div className="text-center text-xs text-gray-500 pt-1">
                Source: {progressStats.dataSource}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compact Professional Bot */}
      <div 
        className="bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700/50 shadow-2xl cursor-pointer transition-all duration-300 hover:shadow-3xl hover:border-gray-600/50 max-w-[280px]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-4">
          {/* Professional Header */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="relative">
              {/* Professional Status Indicator */}
              <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center border border-gray-600/50">
                {loading ? (
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )}
              </div>
              
              {/* Streak Indicator - Professional Badge */}
              {progressStats && progressStats.currentStreak > 0 && (
                <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium border border-gray-800">
                  {progressStats.currentStreak}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Progress Tracker
              </div>
              <div className="text-sm text-gray-200 font-medium">
                {getLevelLabel(progressStats?.currentLevel || 'beginner')}
              </div>
            </div>
          </div>

          {/* Professional Message */}
          <div className="text-sm text-gray-200 leading-relaxed mb-3">
            {loading ? 'Analyzing progress data...' : currentMessage}
          </div>

          {/* Professional Quick Stats */}
          {progressStats && !loading && (
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center space-x-4">
                <span>{progressStats.currentStreak} days</span>
                <span>{progressStats.totalPrayers} total</span>
              </div>
              <div className="text-gray-500">
                {isExpanded ? 'Minimize' : 'Expand'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Professional CSS Animations */}
      <style jsx>{`
        @keyframes slideUp {
          from { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};






