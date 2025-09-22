import React, { useState, useEffect } from 'react';
import { anonymousNotificationService } from '../services/AnonymousNotificationService';

export const DailyMessageTest: React.FC = () => {
  const [status, setStatus] = useState({
    isSupported: false,
    permission: 'default' as NotificationPermission,
    isActive: false,
    messageCount: 0,
    preferredTime: '09:00'
  });
  
  const [todaysMessage, setTodaysMessage] = useState<any>(null);

  useEffect(() => {
    // Load current status
    const currentStatus = anonymousNotificationService.getStatus();
    setStatus(currentStatus);
    
    // Get today's message
    const message = anonymousNotificationService.getTodaysMessage();
    setTodaysMessage(message);
  }, []);

  const handleEnable = async () => {
    const success = await anonymousNotificationService.enableNotifications();
    if (success) {
      const newStatus = anonymousNotificationService.getStatus();
      setStatus(newStatus);
    }
  };

  const handleDisable = () => {
    anonymousNotificationService.disableNotifications();
    const newStatus = anonymousNotificationService.getStatus();
    setStatus(newStatus);
  };

  const sendTestNotification = async () => {
    try {
      await anonymousNotificationService.showDailyNotification();
      alert('Test notification sent!');
    } catch (error) {
      alert('Could not send test notification. Please check permissions.');
    }
  };

  const setTime = (time: string) => {
    anonymousNotificationService.savePreferences({ preferredTime: time });
    setStatus(prev => ({ ...prev, preferredTime: time }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          📱 Daily Message Test
        </h1>

        {/* Status Card */}
        <div className="bg-white/10 rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Current Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/70">Browser Support:</span>
              <span className={`ml-2 ${status.isSupported ? 'text-green-400' : 'text-red-400'}`}>
                {status.isSupported ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div>
              <span className="text-white/70">Permission:</span>
              <span className={`ml-2 ${
                status.permission === 'granted' ? 'text-green-400' :
                status.permission === 'denied' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {status.permission}
              </span>
            </div>
            <div>
              <span className="text-white/70">Active:</span>
              <span className={`ml-2 ${status.isActive ? 'text-green-400' : 'text-red-400'}`}>
                {status.isActive ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div>
              <span className="text-white/70">Messages Sent:</span>
              <span className="ml-2 text-white">{status.messageCount}</span>
            </div>
          </div>
        </div>

        {/* Today's Message Preview */}
        {todaysMessage && (
          <div className="bg-white/10 rounded-xl p-6 mb-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4">Today's Message Preview</h2>
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-amber-400 mb-2">
                {todaysMessage.title}
              </h3>
              <p className="text-white/80 mb-3">{todaysMessage.message}</p>
              {todaysMessage.verse && (
                <div className="border-l-4 border-amber-400 pl-4">
                  <p className="text-white/90 italic">"{todaysMessage.verse}"</p>
                  <p className="text-white/70 text-sm mt-1">- {todaysMessage.verseReference}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white/10 rounded-xl p-6 mb-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">Controls</h2>
          
          {/* Time Selection */}
          <div className="mb-4">
            <label className="block text-white/70 mb-2">Preferred Time</label>
            <div className="flex gap-2 flex-wrap">
              {['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'].map(time => (
                <button
                  key={time}
                  onClick={() => setTime(time)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    status.preferredTime === time
                      ? 'bg-amber-400 text-black'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            {!status.isActive ? (
              <button
                onClick={handleEnable}
                disabled={!status.isSupported}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-all"
              >
                Enable Notifications
              </button>
            ) : (
              <button
                onClick={handleDisable}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
              >
                Disable Notifications
              </button>
            )}
            
            <button
              onClick={sendTestNotification}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-all"
            >
              Send Test Message
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/10 rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-semibold text-white mb-4">How to Test</h2>
          <ol className="text-white/70 space-y-2 list-decimal list-inside">
            <li>Click "Enable Notifications" and allow browser permissions</li>
            <li>Set your preferred time to a few minutes from now</li>
            <li>Wait for the notification to appear (within 5 minutes of your chosen time)</li>
            <li>Or click "Send Test Message" to test immediately</li>
            <li>Check the browser console for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

