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
    console.log('Start session clicked');
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
