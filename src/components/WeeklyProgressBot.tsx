import React, { useState, useEffect } from 'react';
import ProgressService from '../services/ProgressService';
import { useSupabaseAuth } from './SupabaseAuthProvider';

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
  const [loading, setLoading] = useState(false);
  const [progressData, setProgressData] = useState<any>(null);
  const { user } = useSupabaseAuth();

  useEffect(() => {
    const loadProgressData = async () => {
      if (!user) {
        // Default message for non-authenticated users
        setCurrentMessage('Sign in to track your spiritual progress! 🙏');
    setMessageType('reminder');
        setTimeout(() => setIsVisible(true), 2000);
        return;
      }

      try {
        // Load real progress data
        const today = new Date();
        const dayOfWeek = today.getDay();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - dayOfWeek);
        const weekStartStr = weekStart.toISOString().split('T')[0];

        const progress = await ProgressService.getWeeklyProgress(user.id, weekStartStr);
        setProgressData(progress);

        // Calculate real progress metrics
        const weeklyGoal = progress.weeklyGoal;
        const currentStreak = progress.currentStreak;
        const totalSessions = progress.sessions.length;

        // Set initial message based on real data
        let initialMessage = '';
        let initialType: 'motivation' | 'celebration' | 'achievement' | 'reminder' = 'reminder';

        if (weeklyGoal >= 80) {
          initialMessage = `You're ${weeklyGoal}% to your weekly goal! 🎯`;
          initialType = 'achievement';
        } else if (currentStreak >= 5) {
          initialMessage = `${currentStreak}-day streak! Keep the momentum! 🔥`;
          initialType = 'celebration';
        } else if (totalSessions === 0) {
          initialMessage = 'Ready to start your spiritual journey? 🙏';
          initialType = 'motivation';
        } else {
          initialMessage = `You've completed ${totalSessions} sessions this week! 💪`;
          initialType = 'motivation';
        }

        setCurrentMessage(initialMessage);
        setMessageType(initialType);
        setTimeout(() => setIsVisible(true), 2000);

        // Update messages based on real data
        const attentionInterval = setInterval(() => {
          if (!isExpanded && progressData) {
            const messages = generateRealMessages(progress);
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            setCurrentMessage(randomMessage.text);
            setMessageType(randomMessage.type);
          }
        }, 8000);

        return () => clearInterval(attentionInterval);
      } catch (error) {
        console.error('Error loading progress for bot:', error);
        // Fallback to default message
        setCurrentMessage('Track your spiritual progress with us! 🙏');
        setMessageType('reminder');
        setTimeout(() => setIsVisible(true), 2000);
      }
    };

    loadProgressData();
  }, [user, isExpanded]);

  const generateRealMessages = (progress: any) => {
    const messages = [];
    const weeklyGoal = progress.weeklyGoal;
    const currentStreak = progress.currentStreak;
    const totalSessions = progress.sessions.length;
    const totalMinutes = progress.totalMinutesThisWeek;

    // Achievement messages
    if (weeklyGoal >= 90) {
      messages.push({
        text: `Amazing! ${weeklyGoal}% weekly goal achieved! 🏆`,
        type: 'achievement' as const
      });
    }

    if (currentStreak >= 7) {
      messages.push({
        text: `${currentStreak}-day streak! You're on fire! 🔥`,
        type: 'celebration' as const
      });
    }

    // Motivation messages
    if (weeklyGoal < 50 && totalSessions > 0) {
      messages.push({
        text: `Only ${7 - Math.floor(totalSessions / 1.5)} more sessions to hit 50%! 💪`,
        type: 'motivation' as const
      });
    }

    // Encouragement messages
    if (totalMinutes > 0) {
      const avgMinutes = Math.round(totalMinutes / Math.max(totalSessions, 1));
      messages.push({
        text: `Average ${avgMinutes}min per session this week! 📈`,
        type: 'achievement' as const
      });
    }

    // Default messages if we don't have enough data
    if (messages.length === 0) {
      messages.push({
        text: totalSessions > 0 ? `${totalSessions} sessions completed this week! 🎯` : 'Start your spiritual journey today! 🙏',
        type: 'motivation' as const
      });
    }

    return messages;
  };

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
        return 'from-amber-400 to-yellow-500';
      case 'achievement':
        return 'from-amber-400 to-yellow-500';
      case 'motivation':
        return 'from-amber-400 to-yellow-500';
      default:
        return 'from-amber-400 to-yellow-500';
    }
  };

  const getMotivationalMessage = () => {
    const messages = [
      'You\'re crushing it this week! 92% goal completion! 🚀',
      'Your 7-day streak is inspiring others! Keep it up! ✨',
      'Only 2 more sessions to beat last week\'s record! 💪',
      'You\'re in the top 20% of prayer warriors! 🏆',
      'This week you\'ve grown 15% more than last week! 📈'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getProgressInsight = () => {
    const messages = [
      'You\'re crushing it this week! 92% goal completion! 🚀',
      'Your 7-day streak is inspiring others! Keep it up! ✨',
      'Only 2 more sessions to beat last week\'s record! 💪',
      'You\'re in the top 20% of prayer warriors! 🏆',
      'This week you\'ve grown 15% more than last week! 📈'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleBotClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleStartSession = () => {
    // This would typically navigate to the prayer timer
    // Start session clicked
  };

  if (!isVisible || loading) return null;

  return (
    <div className={`fixed ${position === 'top-right' ? 'top-4 right-4' : position === 'bottom-right' ? 'bottom-20 right-4 lg:bottom-4' : 'bottom-20 right-4 lg:bottom-4'} z-50`}>
      {/* Mini Bot */}
      <div className="relative">
        {/* Bot Avatar */}
        <button
          onClick={handleBotClick}
          className={`w-16 h-16 rounded-full bg-gradient-to-r ${getBotColor()} text-black text-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 cursor-pointer border-2 border-white/30 hover:border-white/50 relative group overflow-hidden`}
        >
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse rounded-full"></div>
          
          {/* Main icon */}
          <span className="relative z-10 group-hover:scale-110 transition-transform duration-300">
            {getBotIcon()}
          </span>
          
          {/* Floating particles around the bot */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{animationDuration: '2s'}}></div>
            <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{animationDuration: '2.5s', animationDelay: '0.5s'}}></div>
            <div className="absolute -bottom-1 -left-1 w-1 h-1 bg-white/50 rounded-full animate-bounce" style={{animationDuration: '1.8s', animationDelay: '1s'}}></div>
            <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{animationDuration: '2.2s', animationDelay: '0.3s'}}></div>
          </div>
        </button>

        {/* Notification Badge */}
        {showNotifications && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-black text-xs font-bold animate-pulse shadow-lg">
            3
          </div>
        )}

        {/* Expanded Bot Panel */}
        {isExpanded && (
          <div className="absolute bottom-20 right-0 w-72 bg-white/10 backdrop-blur-xl rounded-3xl p-5 shadow-2xl border border-white/20 animate-in slide-in-from-bottom-2 duration-300">
            {/* Bot Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getBotColor()} text-black text-sm flex items-center justify-center shadow-lg`}>
                {getBotIcon()}
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Spiritual Assistant</h3>
                <p className="text-white/70 text-xs">Your daily companion</p>
              </div>
            </div>

            {/* Current Message */}
            <div className="mb-4 p-3 bg-white/5 rounded-2xl border border-white/20">
              <p className="text-white text-sm font-medium">
                {currentMessage}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/20 hover:border-white/30 transition-all duration-300 group">
                <div className="text-lg font-bold text-amber-400 group-hover:text-amber-300 transition-colors">7</div>
                <div className="text-xs text-white/70">Day Streak</div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/20 hover:border-white/30 transition-all duration-300 group">
                <div className="text-lg font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors">92%</div>
                <div className="text-xs text-white/70">Weekly Goal</div>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="mb-4 p-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-2xl border border-amber-400/30">
              <p className="text-white text-sm font-medium">
                💫 {getMotivationalMessage()}
              </p>
            </div>

            {/* Progress Insights */}
            <div className="mb-4 p-3 bg-white/5 rounded-2xl border border-white/20">
              <p className="text-white text-sm font-medium">
                {getProgressInsight()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 mb-4">
              <button
                onClick={handleStartSession}
                className="flex-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-black py-2 px-3 rounded-2xl text-sm font-semibold hover:from-amber-500 hover:to-yellow-500 transition-all duration-200 hover:scale-105 shadow-lg shadow-amber-500/25"
              >
                🚀 Start Session
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="px-3 py-2 bg-white/10 text-white rounded-2xl text-sm font-medium hover:bg-white/20 transition-all duration-200 hover:scale-105 border border-white/20"
              >
                ✕ Close
              </button>
            </div>

            {/* Progress Tip */}
            <div className="p-3 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-2xl border border-amber-400/30">
              <p className="text-white text-xs font-medium">
                💡 Pro tip: Consistency beats perfection every time!
              </p>
            </div>
          </div>
        )}

        {/* Floating Message Bubble */}
        {!isExpanded && showNotifications && (
          <div className="absolute bottom-20 right-0 w-56 bg-white/10 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-white/20 animate-bounce">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-amber-400 text-sm">💬</span>
              <span className="text-white/70 text-xs font-medium">Live Update</span>
            </div>
            <p className="text-white text-sm font-medium">
              {currentMessage}
            </p>
            <div className="absolute bottom-0 right-4 w-3 h-3 bg-white/10 transform rotate-45 border-r border-b border-white/20"></div>
          </div>
        )}
      </div>
    </div>
  );
};
