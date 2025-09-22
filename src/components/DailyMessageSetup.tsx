import React, { useState, useEffect } from 'react';
import { anonymousNotificationService } from '../services/AnonymousNotificationService';

interface DailyMessageSetupProps {
  compact?: boolean;
  showStatus?: boolean;
}

export const DailyMessageSetup: React.FC<DailyMessageSetupProps> = ({ 
  compact = false, 
  showStatus = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState({
    isActive: false,
    messageCount: 0,
    preferredTime: '09:00'
  });

  useEffect(() => {
    // Load current status
    const preferences = anonymousNotificationService.getPreferences();
    setStatus({
      isActive: preferences.isActive,
      messageCount: preferences.messageCount,
      preferredTime: preferences.preferredTime
    });
  }, []);

  const handleToggle = () => {
    if (status.isActive) {
      anonymousNotificationService.disableNotifications();
    } else {
      anonymousNotificationService.enableNotifications();
    }
    
    // Update status
    const preferences = anonymousNotificationService.getPreferences();
    setStatus({
      isActive: preferences.isActive,
      messageCount: preferences.messageCount,
      preferredTime: preferences.preferredTime
    });
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-all duration-300"
        >
          <span className="text-lg">📱</span>
          <span className="text-sm font-medium">Daily Messages</span>
        </button>
        
        {showStatus && status.isActive && (
          <div className="text-xs text-white/70">
            {status.messageCount} messages sent
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/20">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold">📱 Daily Spiritual Messages</h3>
          <p className="text-white/70 text-sm">
            Get daily encouragement and Bible verses
          </p>
        </div>
        <button
          onClick={handleToggle}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
            status.isActive
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-amber-400/20 text-amber-400 hover:bg-amber-400/30'
          }`}
        >
          {status.isActive ? 'Disable' : 'Enable'}
        </button>
      </div>

      {status.isActive && (
        <div className="space-y-2 text-sm text-white/70">
          <div>⏰ Time: {status.preferredTime}</div>
          <div>📊 Messages sent: {status.messageCount}</div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(true)}
        className="mt-3 w-full text-center text-amber-400 hover:text-amber-300 text-sm underline transition-colors duration-300"
      >
        Configure Settings
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Daily Messages</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Time Selection */}
              <div>
                <label className="block text-white font-medium mb-2">Preferred Time</label>
                <input
                  type="time"
                  value={status.preferredTime}
                  onChange={(e) => {
                    anonymousNotificationService.savePreferences({ preferredTime: e.target.value });
                    setStatus(prev => ({ ...prev, preferredTime: e.target.value }));
                  }}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>

              {/* Test Button */}
              <button
                onClick={async () => {
                  try {
                    await anonymousNotificationService.showDailyNotification();
                    alert('Test notification sent!');
                  } catch (error) {
                    alert('Could not send test notification. Please check permissions.');
                  }
                }}
                className="w-full bg-blue-500/20 text-blue-400 font-medium py-3 px-4 rounded-xl hover:bg-blue-500/30 transition-all duration-300 border border-blue-500/30"
              >
                📱 Send Test Message
              </button>

              {/* Info */}
              <div className="bg-white/5 rounded-lg p-3 text-sm text-white/70">
                <p>• Messages work offline and don't require an account</p>
                <p>• You'll receive notifications within 5 minutes of your chosen time</p>
                <p>• All data is stored locally on your device</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

