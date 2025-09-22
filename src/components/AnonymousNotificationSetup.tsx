import React, { useState, useEffect } from 'react';
import { anonymousNotificationService, AnonymousUserPreferences } from '../services/AnonymousNotificationService';

interface AnonymousNotificationSetupProps {
  onClose?: () => void;
  showAsModal?: boolean;
}

export const AnonymousNotificationSetup: React.FC<AnonymousNotificationSetupProps> = ({ 
  onClose, 
  showAsModal = false 
}) => {
  const [preferences, setPreferences] = useState<AnonymousUserPreferences>({
    preferredTime: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    emailEnabled: false,
    pushEnabled: true,
    frequency: 'daily',
    urgencyLevel: 'gentle',
    isActive: true,
    messageCount: 0
  });
  
  const [status, setStatus] = useState({
    isSupported: false,
    permission: 'default' as NotificationPermission,
    isActive: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load current preferences and status
    const currentPreferences = anonymousNotificationService.getPreferences();
    const currentStatus = anonymousNotificationService.getStatus();
    
    setPreferences(currentPreferences);
    setStatus(currentStatus);
  }, []);

  const handlePreferenceChange = (key: keyof AnonymousUserPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    anonymousNotificationService.savePreferences(newPreferences);
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const success = await anonymousNotificationService.enableNotifications();
      
      if (success) {
        setMessage('✅ Notifications enabled! You\'ll receive daily spiritual messages.');
        setStatus(anonymousNotificationService.getStatus());
      } else {
        setMessage('❌ Could not enable notifications. Please check your browser settings.');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      setMessage('❌ Error enabling notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = () => {
    anonymousNotificationService.disableNotifications();
    setMessage('🔕 Notifications disabled.');
    setStatus(anonymousNotificationService.getStatus());
  };

  const testNotification = async () => {
    try {
      await anonymousNotificationService.showDailyNotification();
      setMessage('📱 Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      setMessage('❌ Could not send test notification.');
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          📱 Daily Spiritual Messages
        </h2>
        <p className="text-white/70">
          Receive daily encouragement and Bible verses at your preferred time
        </p>
      </div>

      {/* Status */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Notification Status</h3>
            <p className="text-white/70 text-sm">
              {status.isSupported ? (
                status.isActive ? '✅ Active' : '⏸️ Inactive'
              ) : (
                '❌ Not supported in this browser'
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-sm">Permission: {status.permission}</p>
            <p className="text-white/70 text-sm">
              Messages sent: {preferences.messageCount}
            </p>
          </div>
        </div>
      </div>

      {/* Time Selection */}
      <div className="space-y-3">
        <label className="block text-white font-semibold">
          Preferred Time
        </label>
        <input
          type="time"
          value={preferences.preferredTime}
          onChange={(e) => handlePreferenceChange('preferredTime', e.target.value)}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        />
        <p className="text-white/70 text-sm">
          You'll receive your daily message within 5 minutes of this time
        </p>
      </div>

      {/* Urgency Level */}
      <div className="space-y-3">
        <label className="block text-white font-semibold">
          Message Style
        </label>
        <select
          value={preferences.urgencyLevel}
          onChange={(e) => handlePreferenceChange('urgencyLevel', e.target.value)}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        >
          <option value="gentle" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
            🌸 Gentle - Calm and peaceful messages
          </option>
          <option value="motivating" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
            💪 Motivating - Encouraging and uplifting messages
          </option>
          <option value="aggressive" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
            ⚡ Energetic - Dynamic and action-oriented messages
          </option>
        </select>
      </div>

      {/* Frequency */}
      <div className="space-y-3">
        <label className="block text-white font-semibold">
          Frequency
        </label>
        <select
          value={preferences.frequency}
          onChange={(e) => handlePreferenceChange('frequency', e.target.value)}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        >
          <option value="daily" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
            📅 Daily - One message per day
          </option>
          <option value="twice" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
            🌅🌙 Twice Daily - Morning and evening messages
          </option>
          <option value="hourly" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
            ⏰ Hourly - Regular encouragement throughout the day
          </option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!status.isActive ? (
          <button
            onClick={handleEnableNotifications}
            disabled={isLoading || !status.isSupported}
            className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold py-3 px-6 rounded-xl hover:from-amber-500 hover:to-yellow-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳ Enabling...' : '🔔 Enable Daily Messages'}
          </button>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleDisableNotifications}
              className="w-full bg-red-500/20 text-red-400 font-semibold py-3 px-6 rounded-xl hover:bg-red-500/30 transition-all duration-300 border border-red-500/30"
            >
              🔕 Disable Notifications
            </button>
            <button
              onClick={testNotification}
              className="w-full bg-blue-500/20 text-blue-400 font-semibold py-3 px-6 rounded-xl hover:bg-blue-500/30 transition-all duration-300 border border-blue-500/30"
            >
              📱 Send Test Message
            </button>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-xl text-center ${
          message.includes('✅') ? 'bg-green-500/20 text-green-400' :
          message.includes('❌') ? 'bg-red-500/20 text-red-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {message}
        </div>
      )}

      {/* Info */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/20">
        <h4 className="text-white font-semibold mb-2">ℹ️ How it works:</h4>
        <ul className="text-white/70 text-sm space-y-1">
          <li>• Messages are stored locally on your device</li>
          <li>• No account required - works completely offline</li>
          <li>• Messages include Bible verses and spiritual encouragement</li>
          <li>• You can change settings anytime</li>
        </ul>
      </div>
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
          {content}
          {onClose && (
            <button
              onClick={onClose}
              className="mt-6 w-full bg-white/10 text-white font-semibold py-3 px-6 rounded-xl hover:bg-white/20 transition-all duration-300"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6">
      {content}
    </div>
  );
};

