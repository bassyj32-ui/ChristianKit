import React, { useState, useEffect } from 'react';

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

  useEffect(() => {
    // Set initial message
    setCurrentMessage('You\'re 78% to your weekly goal! 🎯');
    setMessageType('reminder');
    
    // Show bot after a delay
    setTimeout(() => setIsVisible(true), 2000);
    
    // Add attention-grabbing effects for web users
    const attentionInterval = setInterval(() => {
      if (!isExpanded) {
        // Cycle through different message types to grab attention
        const types = ['motivation', 'celebration', 'achievement', 'reminder'] as const;
        const randomType = types[Math.floor(Math.random() * types.length)];
        setMessageType(randomType);
        
        // Update message based on type with engaging content
        switch (randomType) {
          case 'motivation':
            setCurrentMessage('Only 3 more prayers to hit 100% this week! 💪');
            break;
          case 'celebration':
            setCurrentMessage('Wow! You\'ve prayed 5 days in a row! 🎉');
            break;
          case 'achievement':
            setCurrentMessage('You\'re in the top 15% of users this week! 🏆');
            break;
          default:
            setCurrentMessage('Your streak is 7 days strong! Keep going! 🔥');
        }
      }
    }, 8000); // Change every 8 seconds
    
    return () => clearInterval(attentionInterval);
  }, [isExpanded]);

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
        return 'from-yellow-400 via-orange-500 to-red-500';
      case 'achievement':
        return 'from-emerald-400 via-green-500 to-teal-500';
      case 'motivation':
        return 'from-blue-400 via-purple-500 to-pink-500';
      default:
        return 'from-indigo-500 via-purple-500 to-pink-500';
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
    console.log('Start session clicked');
  };

  if (!isVisible || loading) return null;

  return (
    <div className={`fixed ${position === 'top-right' ? 'top-4 right-4' : position === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 right-4'} z-50`}>
      {/* Mini Bot */}
      <div className="relative">
        {/* Bot Avatar */}
        <button
          onClick={handleBotClick}
          className={`w-16 h-16 rounded-full bg-gradient-to-r ${getBotColor()} text-white text-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300 cursor-pointer border-2 border-white/30 hover:border-white/50 relative group overflow-hidden`}
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
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
            3
          </div>
        )}

        {/* Expanded Bot Panel */}
        {isExpanded && (
          <div className="absolute bottom-20 right-0 w-72 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-gray-600/50 animate-in slide-in-from-bottom-2 duration-300">
            {/* Bot Header */}
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getBotColor()} text-white text-sm flex items-center justify-center shadow-lg`}>
                {getBotIcon()}
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">Spiritual Assistant</h3>
                <p className="text-gray-300 text-xs">Your daily companion</p>
              </div>
            </div>

            {/* Current Message */}
            <div className="mb-3 p-3 bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-xl border border-gray-600/40">
              <p className="text-gray-100 text-sm font-medium">
                {currentMessage}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 rounded-xl p-3 border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 group">
                <div className="text-lg font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">7</div>
                <div className="text-xs text-emerald-200">Day Streak</div>
              </div>
              <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-xl p-3 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 group">
                <div className="text-lg font-bold text-blue-400 group-hover:text-blue-300 transition-colors">92%</div>
                <div className="text-xs text-blue-200">Weekly Goal</div>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="mb-3 p-3 bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-xl border border-purple-500/30">
              <p className="text-purple-200 text-sm font-medium">
                💫 {getMotivationalMessage()}
              </p>
            </div>

            {/* Progress Insights */}
            <div className="mb-3 p-3 bg-[var(--glass-light)]/80 rounded-xl border border-[var(--glass-border)]/40">
              <p className="text-[var(--text-primary)] text-sm font-medium">
                {getProgressInsight()}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 mb-3">
              <button
                onClick={handleStartSession}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2 px-3 rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                🚀 Start Session
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="px-3 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200 rounded-xl text-sm font-medium hover:from-gray-500 hover:to-gray-600 transition-all duration-200 hover:scale-105"
              >
                ✕ Close
              </button>
            </div>

            {/* Progress Tip */}
            <div className="p-2 bg-gradient-to-r from-amber-900/30 to-orange-900/30 rounded-lg border border-amber-500/30">
              <p className="text-amber-200 text-xs font-medium">
                💡 Pro tip: Consistency beats perfection every time!
              </p>
            </div>
          </div>
        )}

        {/* Floating Message Bubble */}
        {!isExpanded && showNotifications && (
          <div className="absolute bottom-20 right-0 w-56 bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-2xl p-3 shadow-2xl border border-gray-600/50 animate-bounce">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-yellow-400 text-sm">💬</span>
              <span className="text-gray-300 text-xs font-medium">Live Update</span>
            </div>
            <p className="text-gray-100 text-sm font-medium">
              {currentMessage}
            </p>
            <div className="absolute bottom-0 right-4 w-3 h-3 bg-gray-900/95 transform rotate-45 border-r border-b border-gray-600/50"></div>
          </div>
        )}
      </div>
    </div>
  );
};
