import React, { useState, useEffect } from 'react';
import { prayerService } from '../services/prayerService';

interface WeeklyProgressBotProps {
  position?: 'top-right' | 'bottom-right' | 'floating';
  showNotifications?: boolean;
}

export const WeeklyProgressBot: React.FC<WeeklyProgressBotProps> = ({ 
  position = 'bottom-right',
  showNotifications = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageType, setMessageType] = useState<'motivation' | 'celebration' | 'achievement' | 'reminder'>('reminder');
  const [isExpanded, setIsExpanded] = useState(false);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWeeklyData = async () => {
      try {
        setLoading(true);
        const data = await prayerService.getWeeklyProgress();
        const reminders = await prayerService.getWeeklyReminders();
        setWeeklyData(data);
        
        // Set initial message based on reminders
        if (reminders.length > 0) {
          setCurrentMessage(reminders[0].message);
          setMessageType(reminders[0].type);
        } else {
          setCurrentMessage('How is your spiritual journey going this week?');
          setMessageType('reminder');
        }
        
        // Show bot after a delay
        setTimeout(() => setIsVisible(true), 2000);
      } catch (error) {
        console.error('Error loading weekly data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWeeklyData();
    
    // Set up periodic updates
    const interval = setInterval(loadWeeklyData, 300000); // Update every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  const getBotIcon = () => {
    switch (messageType) {
      case 'celebration':
        return '🎉';
      case 'achievement':
        return '🏆';
      case 'motivation':
        return '💪';
      default:
        return '🤖';
    }
  };

  const getBotColor = () => {
    switch (messageType) {
      case 'celebration':
        return 'from-yellow-500 to-orange-500';
      case 'achievement':
        return 'from-green-500 to-emerald-500';
      case 'motivation':
        return 'from-blue-500 to-purple-500';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const getMotivationalMessage = () => {
    if (!weeklyData) return 'Start your spiritual journey today!';
    
    const { summary } = weeklyData;
    
    if (summary.currentStreak >= 7) {
      return '🔥 Perfect week! You\'re absolutely crushing it!';
    } else if (summary.currentStreak >= 5) {
      return '🌟 Amazing consistency! You\'re building great habits!';
    } else if (summary.currentStreak >= 3) {
      return '💪 Great start! Keep the momentum going!';
    } else if (summary.weeklyGoal >= 80) {
      return '🎯 So close to your weekly goal! You can do it!';
    } else if (summary.totalSessions === 0) {
      return '🌱 Ready to start your spiritual journey? Every prayer counts!';
    } else {
      return '🙏 Every session brings you closer to your goals!';
    }
  };

  const handleBotClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStartSession = () => {
    // This would typically navigate to the prayer timer
    window.location.href = '#prayer';
  };

  if (!isVisible || loading) return null;

  return (
    <div className={`fixed ${position === 'top-right' ? 'top-4 right-4' : position === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 right-4'} z-50`}>
      {/* Mini Bot */}
      <div className="relative">
        {/* Bot Avatar */}
        <button
          onClick={handleBotClick}
          className={`w-16 h-16 rounded-full bg-gradient-to-r ${getBotColor()} text-white text-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 cursor-pointer border-2 border-white/20`}
        >
          {getBotIcon()}
        </button>

        {/* Notification Badge */}
        {showNotifications && weeklyData?.summary?.currentStreak > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
            {weeklyData.summary.currentStreak}
          </div>
        )}

        {/* Expanded Bot Panel */}
        {isExpanded && (
          <div className="absolute bottom-20 right-0 w-80 bg-gray-900/95 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-gray-700/50 animate-slideInUp">
            {/* Bot Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getBotColor()} text-white text-lg flex items-center justify-center`}>
                {getBotIcon()}
              </div>
              <div>
                <h3 className="text-white font-semibold">Spiritual Assistant</h3>
                <p className="text-gray-400 text-sm">Your weekly progress buddy</p>
              </div>
            </div>

            {/* Current Message */}
            <div className="mb-4 p-3 bg-gray-800/50 rounded-xl border border-gray-600/30">
              <p className="text-gray-200 text-sm leading-relaxed">
                {currentMessage}
              </p>
            </div>

            {/* Quick Stats */}
            {weeklyData && (
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-600/30">
                  <div className="text-2xl font-bold text-green-400">{weeklyData.summary.currentStreak}</div>
                  <div className="text-xs text-gray-400">Day Streak</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-600/30">
                  <div className="text-2xl font-bold text-blue-400">{weeklyData.summary.weeklyGoal}%</div>
                  <div className="text-xs text-gray-400">Weekly Goal</div>
                </div>
              </div>
            )}

            {/* Motivational Message */}
            <div className="mb-4 p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/30">
              <p className="text-blue-200 text-sm font-medium">
                {getMotivationalMessage()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleStartSession}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2 px-4 rounded-xl text-sm font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
              >
                Start Session
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-600 transition-all duration-200"
              >
                Close
              </button>
            </div>

            {/* Progress Tip */}
            <div className="mt-3 p-2 bg-amber-900/20 rounded-lg border border-amber-500/30">
              <p className="text-amber-200 text-xs">
                💡 Tip: Consistency beats perfection. Even 5 minutes of prayer daily makes a difference!
              </p>
            </div>
          </div>
        )}

        {/* Floating Message Bubble */}
        {!isExpanded && showNotifications && (
          <div className="absolute bottom-20 right-0 w-64 bg-gray-900/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-gray-700/50 animate-bounce">
            <p className="text-gray-200 text-sm">
              {currentMessage}
            </p>
            <div className="absolute bottom-0 right-4 w-3 h-3 bg-gray-900/95 transform rotate-45 border-r border-b border-gray-700/50"></div>
          </div>
        )}
      </div>
    </div>
  );
};
